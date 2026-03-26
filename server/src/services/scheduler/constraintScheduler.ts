import type {
  ActivityToSchedule,
  ScheduledActivityResult,
  DayConstraints,
  SchedulerInput,
  SchedulerResult,
} from './types.js';
import { mergeRanges, getFreeIntervals, minutesToTime } from './timeUtils.js';

const DEFAULT_MEAL_GAP = 150; // 2.5 hours between meals (more realistic than 3h)
const DEFAULT_DAY_START = 6 * 60;
const DEFAULT_DAY_END = 22 * 60;

export function runScheduler(input: SchedulerInput): SchedulerResult {
  const { activities, constraints } = input;
  const blocked = mergeRanges(constraints.blockedRanges);
  const dayStart = constraints.dayStartMinutes ?? DEFAULT_DAY_START;
  const dayEnd = constraints.dayEndMinutes ?? DEFAULT_DAY_END;
  const mealGap = constraints.mealGapMinutes ?? DEFAULT_MEAL_GAP;

  const free = getFreeIntervals(blocked, dayStart, dayEnd);
  const scheduled: ScheduledActivityResult[] = [];
  const unscheduled: ActivityToSchedule[] = [];

  const ordered = [...activities].sort((a, b) => {
    const orderA = a.preferredOrder ?? mealOrder(a);
    const orderB = b.preferredOrder ?? mealOrder(b);
    return orderA - orderB;
  });

  let lastMealEndMinutes: number | null = null;

  for (const act of ordered) {
    const duration = act.durationMinutes;
    const isMealLike = act.type === 'meal' || act.type === 'snack';
    const needGapAfterMeal = isMealLike ? mealGap : 0;

    let candidateStart = dayStart;
    if (lastMealEndMinutes != null && isMealLike) {
      candidateStart = lastMealEndMinutes + mealGap;
    }

    // If activity has a preferred start, try that first
    let placed: [number, number] | null = null;
    if (act.preferredStartMin !== undefined) {
      placed = placeInFreeSlot(free, duration, Math.max(act.preferredStartMin, candidateStart), dayEnd, needGapAfterMeal);
    }
    if (!placed) {
      placed = placeInFreeSlot(free, duration, candidateStart, dayEnd, needGapAfterMeal);
    }
    // Last resort: try from the very start of day
    if (!placed && candidateStart > dayStart) {
      placed = placeInFreeSlot(free, duration, dayStart, dayEnd, 0);
    }

    if (placed) {
      const [startMin, endMin] = placed;
      scheduled.push({
        type: act.type,
        mealType: act.mealType,
        start: minutesToTime(startMin),
        end: minutesToTime(endMin),
        name: act.name ?? (act.mealType ? act.mealType : 'Workout'),
      });
      if (isMealLike) lastMealEndMinutes = endMin;
      markSlotUsed(free, startMin, endMin);
    } else {
      unscheduled.push(act);
    }
  }

  return {
    scheduled,
    unscheduled,
    feasible: unscheduled.length === 0,
  };
}

function mealOrder(a: ActivityToSchedule): number {
  if (!a.mealType) return 99;
  const o: Record<string, number> = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };
  return o[a.mealType] ?? 99;
}

function placeInFreeSlot(
  free: Array<[number, number]>,
  durationMinutes: number,
  earliestStart: number,
  dayEndMinutes: number,
  minGapAfter: number
): [number, number] | null {
  for (const [s, e] of free) {
    const start = Math.max(s, earliestStart);
    const end = start + durationMinutes;
    const endWithGap = end + minGapAfter;
    if (end <= e && end <= dayEndMinutes && (minGapAfter === 0 || endWithGap <= dayEndMinutes)) {
      return [start, end];
    }
  }
  return null;
}

function markSlotUsed(free: Array<[number, number]>, start: number, end: number): void {
  for (let i = 0; i < free.length; i++) {
    const [s, e] = free[i];
    if (start < e && end > s) {
      const newRanges: Array<[number, number]> = [];
      if (s < start) newRanges.push([s, start]);
      if (end < e) newRanges.push([end, e]);
      free.splice(i, 1, ...newRanges);
      break;
    }
  }
}

export function buildDayConstraints(
  blockedRanges: Array<{ start: string; end: string }>,
  options?: { mealGapMinutes?: number; dayStartMinutes?: number; dayEndMinutes?: number }
): DayConstraints {
  return {
    blockedRanges,
    mealGapMinutes: options?.mealGapMinutes ?? DEFAULT_MEAL_GAP,
    dayStartMinutes: options?.dayStartMinutes ?? DEFAULT_DAY_START,
    dayEndMinutes: options?.dayEndMinutes ?? DEFAULT_DAY_END,
  };
}
