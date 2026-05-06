/**
 * Constraint Satisfaction Problem (CSP) based daily scheduler.
 *
 * Variables:
 *   one variable per activity (breakfast, lunch, dinner, snack?, workout?).
 *
 * Domain:
 *   discretized start times (15-minute blocks) within the user's awake window
 *   that don't overlap any blocked range.
 *
 * Hard constraints:
 *   - In-day: start >= dayStart, start + duration <= dayEnd
 *   - No overlap with blocked ranges (work hours, busy slots, weekly routine)
 *   - No overlap between any two scheduled activities
 *   - Meal ordering: breakfast before lunch before dinner
 *   - Meal-meal gap >= mealGap minutes
 *
 * Soft constraints (used for value ordering, never to reject):
 *   - Activity preferred start time (e.g. evening workout)
 *   - Sensible defaults: breakfast early, lunch midday, dinner evening, snack late afternoon
 *
 * Solver pipeline:
 *   1. Build domains (hard-constraint filtering against blocked ranges).
 *   2. AC-3 binary arc consistency: prune dominated values from each variable's
 *      domain by checking ordering / gap / no-overlap consistency with every
 *      other variable.
 *   3. Backtracking search with:
 *        - MRV (Minimum Remaining Values) variable ordering
 *        - Soft-constraint value ordering (preferred-start proximity)
 *        - Forward checking: prune incompatible values from neighbors after assignment.
 *
 * Soft-constraint relaxation:
 *   If the strictest configuration is infeasible, the solver retries with
 *   progressively relaxed configurations (reduced meal gap, drop snack,
 *   drop workout, etc.) so it always returns the most-complete feasible
 *   schedule rather than failing entirely.
 */

import type {
  ActivityToSchedule,
  ScheduledActivityResult,
  DayConstraints,
  SchedulerInput,
  SchedulerResult,
} from './types.js';
import { mergeRanges, minutesToTime } from './timeUtils.js';

const DEFAULT_MEAL_GAP = 150; // 2.5 hours between meals
const DEFAULT_DAY_START = 6 * 60;
const DEFAULT_DAY_END = 22 * 60;
/** Time discretization granularity in minutes. */
const TIME_BLOCK_MIN = 15;

/** Rank used for meal ordering and value-ordering defaults. */
const MEAL_RANK: Record<string, number> = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };

interface Variable {
  /** Index into the variables array — also the canonical id used in maps. */
  id: number;
  activity: ActivityToSchedule;
  duration: number;
  /** True if this is a meal/snack (subject to meal-gap constraints). */
  isMeal: boolean;
  /** 0=breakfast, 1=lunch, 2=dinner, 3=snack, 4=workout, 99=other. */
  mealRank: number;
}

function buildVariable(act: ActivityToSchedule, id: number): Variable {
  const rank = act.mealType
    ? (MEAL_RANK[act.mealType] ?? 99)
    : act.type === 'workout'
      ? 4
      : 99;
  return {
    id,
    activity: act,
    duration: act.durationMinutes,
    isMeal: act.type === 'meal' || act.type === 'snack',
    mealRank: rank,
  };
}

function overlapsBlocked(start: number, duration: number, blocked: Array<[number, number]>): boolean {
  const end = start + duration;
  for (const [s, e] of blocked) {
    if (start < e && end > s) return true;
  }
  return false;
}

/** A "strict" meal is breakfast/lunch/dinner — these have a strict ordering. Snacks do not. */
function isStrictMeal(v: Variable): boolean {
  return v.isMeal && v.mealRank <= 2;
}

/**
 * Returns true iff assigning x1 to v1 and x2 to v2 is consistent (no hard-constraint violation).
 */
function consistentPair(
  v1: Variable,
  x1: number,
  v2: Variable,
  x2: number,
  mealGap: number
): boolean {
  const e1 = x1 + v1.duration;
  const e2 = x2 + v2.duration;

  // Hard constraint: no time overlap between any two activities.
  if (x1 < e2 && x2 < e1) return false;

  if (isStrictMeal(v1) && isStrictMeal(v2)) {
    // Hard constraint: breakfast < lunch < dinner with at least mealGap between them.
    if (v1.mealRank < v2.mealRank) {
      if (e1 + mealGap > x2) return false;
    } else if (v1.mealRank > v2.mealRank) {
      if (e2 + mealGap > x1) return false;
    }
    return true;
  }

  if (v1.isMeal && v2.isMeal) {
    // Snack vs strict meal (or two snacks): no fixed ordering, but meal-gap still applies.
    const earlierEnd = x1 < x2 ? e1 : e2;
    const laterStart = x1 < x2 ? x2 : x1;
    if (earlierEnd + mealGap > laterStart) return false;
    return true;
  }

  // Workout vs anything (or unknown vs unknown): only no-overlap, already checked.
  return true;
}

function buildDomain(v: Variable, dayStart: number, dayEnd: number, blocked: Array<[number, number]>): number[] {
  const dom: number[] = [];
  for (let t = dayStart; t + v.duration <= dayEnd; t += TIME_BLOCK_MIN) {
    if (!overlapsBlocked(t, v.duration, blocked)) dom.push(t);
  }
  return dom;
}

/**
 * AC-3 binary arc consistency.
 * For each ordered pair (Vi, Vj) prunes any value xi in dom(Vi) that has no supporting
 * value xj in dom(Vj). Repeats until quiescence. Returns false if any domain becomes empty.
 */
function ac3(variables: Variable[], domains: Map<number, number[]>, mealGap: number): boolean {
  const queue: Array<[number, number]> = [];
  for (let i = 0; i < variables.length; i++) {
    for (let j = 0; j < variables.length; j++) {
      if (i !== j) queue.push([variables[i].id, variables[j].id]);
    }
  }
  while (queue.length > 0) {
    const arc = queue.shift();
    if (!arc) break;
    const [iId, jId] = arc;
    if (revise(variables[iId], variables[jId], domains, mealGap)) {
      if ((domains.get(iId) ?? []).length === 0) return false;
      // Re-add arcs (k, i) for every other variable k (k != i, k != j) so we re-check
      // anyone whose support might have been removed.
      for (const k of variables) {
        if (k.id !== iId && k.id !== jId) queue.push([k.id, iId]);
      }
    }
  }
  return true;
}

function revise(vi: Variable, vj: Variable, domains: Map<number, number[]>, mealGap: number): boolean {
  const di = domains.get(vi.id) ?? [];
  const dj = domains.get(vj.id) ?? [];
  let revised = false;
  const newDi: number[] = [];
  for (const x of di) {
    let supported = false;
    for (const y of dj) {
      if (consistentPair(vi, x, vj, y, mealGap)) {
        supported = true;
        break;
      }
    }
    if (supported) newDi.push(x);
    else revised = true;
  }
  if (revised) domains.set(vi.id, newDi);
  return revised;
}

/**
 * Soft-constraint value ordering (LCV-flavored): try the most-preferred values first.
 * Uses preferredStartMin if given, otherwise sensible per-meal defaults.
 */
function orderValues(v: Variable, dom: number[]): number[] {
  const ordered = [...dom];
  const target = v.activity.preferredStartMin;
  if (target !== undefined) {
    ordered.sort((a, b) => Math.abs(a - target) - Math.abs(b - target) || a - b);
    return ordered;
  }
  if (v.isMeal && v.mealRank === 0) {
    ordered.sort((a, b) => a - b);
    return ordered;
  }
  if (v.isMeal && v.mealRank === 1) {
    const t = 12 * 60 + 30;
    ordered.sort((a, b) => Math.abs(a - t) - Math.abs(b - t) || a - b);
    return ordered;
  }
  if (v.isMeal && v.mealRank === 2) {
    const t = 19 * 60;
    ordered.sort((a, b) => Math.abs(a - t) - Math.abs(b - t) || a - b);
    return ordered;
  }
  if (v.isMeal && v.mealRank === 3) {
    const t = 16 * 60;
    ordered.sort((a, b) => Math.abs(a - t) - Math.abs(b - t) || a - b);
    return ordered;
  }
  ordered.sort((a, b) => a - b);
  return ordered;
}

/** MRV: select the unassigned variable with the smallest remaining domain. */
function selectUnassigned(
  variables: Variable[],
  domains: Map<number, number[]>,
  assignment: Map<number, number>
): Variable | null {
  let best: Variable | null = null;
  let bestSize = Infinity;
  for (const v of variables) {
    if (assignment.has(v.id)) continue;
    const size = (domains.get(v.id) ?? []).length;
    if (size < bestSize) {
      bestSize = size;
      best = v;
    }
  }
  return best;
}

function snapshotDomains(domains: Map<number, number[]>): Map<number, number[]> {
  const copy = new Map<number, number[]>();
  for (const [k, list] of domains) copy.set(k, [...list]);
  return copy;
}

function restoreDomains(domains: Map<number, number[]>, snapshot: Map<number, number[]>): void {
  for (const [k, list] of snapshot) domains.set(k, [...list]);
}

/**
 * Backtracking search with MRV + value ordering + forward checking.
 * Returns the completed assignment on success, or null on failure.
 */
function backtrack(
  variables: Variable[],
  domains: Map<number, number[]>,
  assignment: Map<number, number>,
  mealGap: number
): Map<number, number> | null {
  if (assignment.size === variables.length) return new Map(assignment);
  const v = selectUnassigned(variables, domains, assignment);
  if (!v) return null;

  const values = orderValues(v, domains.get(v.id) ?? []);
  for (const val of values) {
    let consistentWithAssignment = true;
    for (const [uId, uVal] of assignment) {
      if (!consistentPair(v, val, variables[uId], uVal, mealGap)) {
        consistentWithAssignment = false;
        break;
      }
    }
    if (!consistentWithAssignment) continue;

    const saved = snapshotDomains(domains);
    assignment.set(v.id, val);

    let allDomainsAlive = true;
    for (const u of variables) {
      if (u.id === v.id || assignment.has(u.id)) continue;
      const filtered = (domains.get(u.id) ?? []).filter((xu) =>
        consistentPair(u, xu, v, val, mealGap)
      );
      domains.set(u.id, filtered);
      if (filtered.length === 0) {
        allDomainsAlive = false;
        break;
      }
    }

    if (allDomainsAlive) {
      const result = backtrack(variables, domains, assignment, mealGap);
      if (result) return result;
    }

    assignment.delete(v.id);
    restoreDomains(domains, saved);
  }
  return null;
}

interface SolveOk {
  variables: Variable[];
  assignment: Map<number, number>;
}

function trySolve(
  activities: ActivityToSchedule[],
  dayStart: number,
  dayEnd: number,
  blocked: Array<[number, number]>,
  mealGap: number
): SolveOk | null {
  const variables = activities.map((a, i) => buildVariable(a, i));
  const domains = new Map<number, number[]>();
  for (const v of variables) {
    const dom = buildDomain(v, dayStart, dayEnd, blocked);
    if (dom.length === 0) return null;
    domains.set(v.id, dom);
  }
  if (!ac3(variables, domains, mealGap)) return null;
  const assignment = backtrack(variables, domains, new Map(), mealGap);
  if (!assignment) return null;
  return { variables, assignment };
}

interface RelaxationTier {
  /** Picks which activities are kept at this tier. */
  filter: (a: ActivityToSchedule) => boolean;
  /** Meal gap (minutes) used at this tier. */
  mealGap: number;
  label: string;
}

function buildRelaxationTiers(baseMealGap: number): RelaxationTier[] {
  const reduced = Math.max(60, Math.round(baseMealGap * 0.6));
  return [
    { filter: () => true, mealGap: baseMealGap, label: 'strict' },
    { filter: () => true, mealGap: reduced, label: 'reduced-gap' },
    { filter: (a) => a.type !== 'snack', mealGap: reduced, label: 'drop-snack' },
    { filter: (a) => a.type !== 'workout', mealGap: reduced, label: 'drop-workout' },
    { filter: (a) => a.type !== 'snack' && a.type !== 'workout', mealGap: 30, label: 'meals-only' },
  ];
}

export function runScheduler(input: SchedulerInput): SchedulerResult {
  const { activities, constraints } = input;
  const dayStart = constraints.dayStartMinutes ?? DEFAULT_DAY_START;
  const dayEnd = constraints.dayEndMinutes ?? DEFAULT_DAY_END;
  const baseMealGap = constraints.mealGapMinutes ?? DEFAULT_MEAL_GAP;
  const blocked = mergeRanges(constraints.blockedRanges);

  const tiers = buildRelaxationTiers(baseMealGap);
  for (const tier of tiers) {
    const subset = activities.filter(tier.filter);
    if (subset.length === 0) continue;
    const sol = trySolve(subset, dayStart, dayEnd, blocked, tier.mealGap);
    if (!sol) continue;

    const scheduled: ScheduledActivityResult[] = [];
    const placedActivities = new Set<ActivityToSchedule>();
    for (const v of sol.variables) {
      const start = sol.assignment.get(v.id);
      if (start === undefined) continue;
      const end = start + v.duration;
      placedActivities.add(v.activity);
      scheduled.push({
        type: v.activity.type,
        mealType: v.activity.mealType,
        start: minutesToTime(start),
        end: minutesToTime(end),
        name: v.activity.name ?? (v.activity.mealType ?? v.activity.type),
      });
    }
    scheduled.sort((a, b) => a.start.localeCompare(b.start));
    const unscheduled = activities.filter((a) => !placedActivities.has(a));
    return { scheduled, unscheduled, feasible: unscheduled.length === 0 };
  }

  return { scheduled: [], unscheduled: [...activities], feasible: false };
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
