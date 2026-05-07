import type { IUserProfile } from '../models/UserProfile.js';
import type { IBusySlot, IScheduledActivity } from '../models/Schedule.js';
import { ScheduleModel, computeScheduleStatus } from '../models/Schedule.js';
import { runScheduler, buildDayConstraints } from './scheduler/constraintScheduler.js';
import type { ActivityToSchedule } from './scheduler/types.js';
import {
  recommendExercises,
  recommendDayMeals,
  calculateDailyCalorieTarget,
  calculateMacroTargets,
  calculateBMI,
  generateInsights,
  generateFitnessPrediction,
  suggestRestDay,
  getMotivationMessage,
  getEnergyPrediction,
  getDayBoundaries,
  shouldWorkoutToday,
  isWorkDay,
  getPreferredWorkoutStartMin,
  type DayStatForInsight,
} from './recommendationEngine.js';
import { timeToMinutes } from './scheduler/timeUtils.js';

const MEAL_ORDER = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };

export async function getOrCreateDaySchedule(
  userId: string,
  date: string
): Promise<{ busySlots: IBusySlot[]; scheduledActivities: IScheduledActivity[] }> {
  const doc = await ScheduleModel.findOne({ userId, date }).lean();
  if (doc) return { busySlots: doc.busySlots, scheduledActivities: doc.scheduledActivities };
  return { busySlots: [], scheduledActivities: [] };
}

/**
 * Build a stable identity key for an activity so we can match an activity in
 * the freshly-built plan against a completion flag from the previous plan.
 *
 * Using `(type, mealType, name)` is safe because meal/snack names are unique
 * within a day's plan and workout names are derived deterministically from the
 * exercise list. After a busy-slot edit only the *times* shift; identities
 * stay the same and completion flags survive.
 */
function activityIdentity(a: { type: string; mealType?: string; name?: string }): string {
  return `${a.type}|${a.mealType ?? ''}|${a.name ?? ''}`;
}

export async function recalculateDaySchedule(
  userId: string,
  date: string,
  profile: IUserProfile,
  busySlots: IBusySlot[],
  reason: string = 'recalculate'
): Promise<IScheduledActivity[]> {
  // Snapshot completion flags from the previous plan so adding/removing a busy
  // slot doesn't silently un-check activities the user had already done.
  const existingDoc = await ScheduleModel.findOne({ userId, date }).lean();
  const previousCompletion = new Map<string, boolean>();
  if (existingDoc) {
    for (const a of existingDoc.scheduledActivities) {
      if (a.completed) previousCompletion.set(activityIdentity(a), true);
    }
  }

  const dayOfWeek = new Date(date + 'T12:00:00').getDay();
  const blockedRanges: Array<{ start: string; end: string }> = [];

  // Derive day boundaries from sleep schedule
  const { dayStartMin, dayEndMin } = getDayBoundaries(profile);

  // Block work hours only if this is a work day for this user
  if (isWorkDay(profile, dayOfWeek)) {
    const workStart = profile.workHours?.start ?? '09:00';
    const workEnd = profile.workHours?.end ?? '17:00';
    blockedRanges.push({ start: workStart, end: workEnd });
  }

  // Block travel time around work
  if (isWorkDay(profile, dayOfWeek) && (profile.travelMinutesPerDay ?? 0) > 0) {
    const halfTravel = Math.ceil((profile.travelMinutesPerDay ?? 0) / 2);
    const workStartMin = timeToMinutes(profile.workHours?.start ?? '09:00');
    const workEndMin = timeToMinutes(profile.workHours?.end ?? '17:00');
    const travelToWork = workStartMin - halfTravel;
    const travelFromWork = workEndMin;
    if (travelToWork > 0) {
      const th = Math.floor(travelToWork / 60);
      const tm = travelToWork % 60;
      blockedRanges.push({ start: `${String(th).padStart(2, '0')}:${String(tm).padStart(2, '0')}`, end: profile.workHours?.start ?? '09:00' });
    }
    const endTravel = travelFromWork + halfTravel;
    const eh = Math.floor(endTravel / 60);
    const em = endTravel % 60;
    blockedRanges.push({ start: profile.workHours?.end ?? '17:00', end: `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}` });
  }

  // Skip weekends if user chose not available
  const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
  if (isWeekendDay && profile.weekendAvailability === false) {
    return [];
  }

  // Weekly routine
  for (const r of (profile.weeklyRoutine ?? [])) {
    if (r.dayOfWeek === dayOfWeek) blockedRanges.push({ start: r.start, end: r.end });
  }

  // User-added busy slots
  for (const b of busySlots) blockedRanges.push({ start: b.start, end: b.end });

  // Build activities
  const dayMeals = recommendDayMeals(profile, date);
  const doWorkout = shouldWorkoutToday(profile, dayOfWeek);
  const weight = profile.bodyMetrics?.weightKg ?? 70;
  const mealDurations = profile.mealDurationsMinutes ?? { breakfast: 15, lunch: 30, dinner: 30, snack: 10 };

  const activities: ActivityToSchedule[] = [];

  activities.push({
    type: 'meal', mealType: 'breakfast',
    durationMinutes: mealDurations.breakfast ?? 15,
    name: dayMeals.breakfast.meal.name,
    preferredOrder: MEAL_ORDER.breakfast,
  });
  activities.push({
    type: 'meal', mealType: 'lunch',
    durationMinutes: mealDurations.lunch ?? 30,
    name: dayMeals.lunch.meal.name,
    preferredOrder: MEAL_ORDER.lunch,
  });
  activities.push({
    type: 'meal', mealType: 'dinner',
    durationMinutes: mealDurations.dinner ?? 30,
    name: dayMeals.dinner.meal.name,
    preferredOrder: MEAL_ORDER.dinner,
  });
  if (dayMeals.snack) {
    activities.push({
      type: 'snack', mealType: 'snack',
      durationMinutes: mealDurations.snack ?? 10,
      name: dayMeals.snack.meal.name,
      preferredOrder: MEAL_ORDER.snack,
    });
  }

  let exercises: ReturnType<typeof recommendExercises>['exercises'] = [];
  let workoutCalories = 0;
  if (doWorkout) {
    const rec = recommendExercises(profile, date);
    exercises = rec.exercises;
    workoutCalories = rec.totalCalories;
    const exerciseNames = exercises.map((e) => e.name).join(', ');
    activities.push({
      type: 'workout',
      durationMinutes: profile.workoutDurationMinutes ?? 45,
      name: `Workout: ${exerciseNames.slice(0, 60)}`,
      preferredOrder: 5,
      preferredStartMin: getPreferredWorkoutStartMin(profile),
    });
  }

  const constraints = buildDayConstraints(blockedRanges, {
    dayStartMinutes: dayStartMin,
    dayEndMinutes: dayEndMin,
  });
  const result = runScheduler({ date, dayOfWeek, activities, constraints });

  const mealMap: Record<string, typeof dayMeals.breakfast> = {
    breakfast: dayMeals.breakfast,
    lunch: dayMeals.lunch,
    dinner: dayMeals.dinner,
    ...(dayMeals.snack ? { snack: dayMeals.snack } : {}),
  };

  const scheduled: IScheduledActivity[] = result.scheduled.map((s) => {
    if ((s.type === 'meal' || s.type === 'snack') && s.mealType && mealMap[s.mealType]) {
      const rec = mealMap[s.mealType];
      const built = {
        type: s.type,
        mealType: s.mealType,
        start: s.start, end: s.end,
        name: rec.meal.name,
        completed: false,
        nutrition: { calories: rec.meal.calories, proteinG: rec.meal.proteinG, carbsG: rec.meal.carbsG, fatG: rec.meal.fatG },
        mealDetail: {
          mealId: rec.meal.id, mealName: rec.meal.name, description: rec.meal.description,
          alternatives: rec.alternatives.map((a) => ({ mealId: a.id, mealName: a.name, calories: a.calories })),
        },
      };
      built.completed = previousCompletion.get(activityIdentity(built)) ?? false;
      return built;
    }
    if (s.type === 'workout') {
      const built = {
        type: s.type, start: s.start, end: s.end, name: s.name, completed: false,
        nutrition: { calories: workoutCalories, proteinG: 0, carbsG: 0, fatG: 0 },
        exerciseDetails: exercises.map((ex) => ({
          exerciseId: ex.id, exerciseName: ex.name, sets: ex.sets, reps: ex.reps,
          muscleGroups: ex.muscleGroups, intensity: ex.intensity,
        })),
      };
      built.completed = previousCompletion.get(activityIdentity(built)) ?? false;
      return built;
    }
    const fallback = { type: s.type, mealType: s.mealType, start: s.start, end: s.end, name: s.name ?? s.type, completed: false };
    fallback.completed = previousCompletion.get(activityIdentity(fallback)) ?? false;
    return fallback;
  });

  await ScheduleModel.findOneAndUpdate(
    { userId, date },
    {
      $set: {
        busySlots,
        scheduledActivities: scheduled,
        status: computeScheduleStatus(scheduled),
      },
      $push: { reschedulingHistory: { at: new Date(), reason } },
    },
    { upsert: true, new: true }
  );
  return scheduled;
}

export async function setBusySlot(userId: string, date: string, busySlots: IBusySlot[], profile: IUserProfile): Promise<IScheduledActivity[]> {
  return recalculateDaySchedule(userId, date, profile, busySlots, 'busy_slot_change');
}

export async function markActivityCompleted(userId: string, date: string, activityIndex: number, completed: boolean): Promise<void> {
  const doc = await ScheduleModel.findOne({ userId, date });
  if (!doc || activityIndex < 0 || activityIndex >= doc.scheduledActivities.length) return;
  doc.scheduledActivities[activityIndex].completed = completed;
  doc.status = computeScheduleStatus(doc.scheduledActivities);
  await doc.save();
}

export async function getScheduleRange(userId: string, startDate: string, endDate: string) {
  const docs = await ScheduleModel.find({ userId, date: { $gte: startDate, $lte: endDate } }).sort({ date: 1 }).lean();
  const byDate = new Map(docs.map((d) => [d.date, { date: d.date, busySlots: d.busySlots, scheduledActivities: d.scheduledActivities }]));
  const result: Array<{ date: string; busySlots: IBusySlot[]; scheduledActivities: IScheduledActivity[] }> = [];
  for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    result.push(byDate.get(dateStr) ?? { date: dateStr, busySlots: [], scheduledActivities: [] });
  }
  return result;
}

export interface DayStat {
  date: string;
  completedWorkouts: number;
  totalWorkouts: number;
  completedMeals: number;
  totalMeals: number;
  goalPercent: number;
  caloriesConsumed: number;
  caloriesBurned: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface ProgressStats {
  days: DayStat[];
  currentStreak: number;
  totalWorkoutsCompleted: number;
  totalMealsCompleted: number;
  insights: string[];
  prediction: string | null;
  shouldRestToday: boolean;
  motivationMessage: string;
}

function goalPercent(cM: number, tM: number, cW: number, tW: number): number {
  const mealPct = tM > 0 ? cM / tM : 0;
  const workoutPct = tW > 0 ? cW / tW : 0;
  const parts = (tM > 0 ? 1 : 0) + (tW > 0 ? 1 : 0);
  if (parts === 0) return 0;
  return Math.round(((mealPct + workoutPct) / parts) * 100);
}

export async function getProgressStats(userId: string, startDate: string, endDate: string, profile?: IUserProfile): Promise<ProgressStats> {
  const schedule = await getScheduleRange(userId, startDate, endDate);
  const days: DayStat[] = schedule.map((day) => {
    const meals = day.scheduledActivities.filter((a) => a.type === 'meal' || a.type === 'snack');
    const workouts = day.scheduledActivities.filter((a) => a.type === 'workout');
    const cM = meals.filter((a) => a.completed).length;
    const cW = workouts.filter((a) => a.completed).length;
    let caloriesConsumed = 0, caloriesBurned = 0, proteinG = 0, carbsG = 0, fatG = 0;
    for (const a of day.scheduledActivities) {
      if ((a.type === 'meal' || a.type === 'snack') && a.completed && a.nutrition) {
        caloriesConsumed += a.nutrition.calories; proteinG += a.nutrition.proteinG; carbsG += a.nutrition.carbsG; fatG += a.nutrition.fatG;
      }
      if (a.type === 'workout' && a.completed && a.nutrition) caloriesBurned += a.nutrition.calories;
    }
    return { date: day.date, completedMeals: cM, totalMeals: meals.length, completedWorkouts: cW, totalWorkouts: workouts.length, goalPercent: goalPercent(cM, meals.length, cW, workouts.length), caloriesConsumed, caloriesBurned, proteinG, carbsG, fatG };
  });

  let currentStreak = 0;
  const today = new Date().toISOString().slice(0, 10);
  for (const d of days.filter((d) => d.date <= today).reverse()) {
    if (d.totalWorkouts > 0 && d.completedWorkouts >= 1) currentStreak++;
    else if (d.totalWorkouts > 0) break;
  }

  const totalWorkoutsCompleted = days.reduce((s, d) => s + d.completedWorkouts, 0);
  const totalMealsCompleted = days.reduce((s, d) => s + d.completedMeals, 0);
  const insightDays: DayStatForInsight[] = days;
  const insights = generateInsights(insightDays);
  const prediction = profile ? generateFitnessPrediction(profile, insightDays) : null;
  const shouldRestToday = suggestRestDay(insightDays.slice(-3));
  const motivationMessage = getMotivationMessage(insightDays);

  return { days, currentStreak, totalWorkoutsCompleted, totalMealsCompleted, insights, prediction, shouldRestToday, motivationMessage };
}

export async function getDashboardData(userId: string, profile: IUserProfile) {
  const today = new Date().toISOString().slice(0, 10);
  let { busySlots, scheduledActivities } = await getOrCreateDaySchedule(userId, today);

  // Auto-generate today's schedule if empty
  if (scheduledActivities.length === 0) {
    scheduledActivities = await recalculateDaySchedule(userId, today, profile, busySlots);
  }

  const calorieTarget = calculateDailyCalorieTarget(profile);
  const macroTargets = calculateMacroTargets(profile);
  const energy = getEnergyPrediction(profile);
  const bmi = calculateBMI(profile);

  let caloriesConsumed = 0, caloriesBurned = 0, proteinG = 0, carbsG = 0, fatG = 0;
  for (const a of scheduledActivities) {
    if ((a.type === 'meal' || a.type === 'snack') && a.completed && a.nutrition) {
      caloriesConsumed += a.nutrition.calories; proteinG += a.nutrition.proteinG; carbsG += a.nutrition.carbsG; fatG += a.nutrition.fatG;
    }
    if (a.type === 'workout' && a.completed && a.nutrition) caloriesBurned += a.nutrition.calories;
  }

  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const stats = await getProgressStats(userId, sevenDaysAgo.toISOString().slice(0, 10), today, profile);

  const waterTarget = profile.dailyWaterIntakeL ?? 2.5;

  return {
    today: {
      date: today, scheduledActivities, busySlots,
      caloriesConsumed, caloriesBurned, calorieTarget,
      macroTargets, nutrition: { proteinG, carbsG, fatG },
    },
    energy, bmi, waterTarget,
    weekStreak: stats.currentStreak,
    motivationMessage: stats.motivationMessage,
    shouldRestToday: stats.shouldRestToday,
  };
}
