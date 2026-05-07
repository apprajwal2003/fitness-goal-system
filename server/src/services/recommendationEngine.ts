import type { IUserProfile } from '../models/UserProfile.js';
import { EXERCISES, type Exercise, type Modality, type Intensity, type BodyType, type GoalType, type MuscleGroup } from '../data/exercises.js';
import { MEALS, type Meal, type MealSlot, type FoodPreference } from '../data/meals.js';

function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (h * 16807 + 0) % 2147483647;
    return (h & 0x7fffffff) / 0x7fffffff;
  };
}

function shuffleWithSeed<T>(arr: T[], rand: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const MUSCLE_GROUP_ROTATION: MuscleGroup[][] = [
  ['chest', 'shoulders', 'arms'],
  ['back', 'arms'],
  ['legs', 'glutes'],
  ['core', 'full_body'],
  ['cardio_endurance'],
  ['chest', 'back', 'shoulders'],
  ['legs', 'glutes', 'core'],
];

// --- BMR & Calorie Calculations (Mifflin-St Jeor) ---

export function calculateBMR(profile: IUserProfile): number {
  const weight = profile.bodyMetrics?.weightKg ?? 70;
  const height = profile.bodyMetrics?.heightCm ?? 170;
  const age = profile.bodyMetrics?.age ?? 25;
  const gender = profile.bodyMetrics?.gender ?? 'male';
  if (gender === 'female') {
    return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
  return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
}

export function calculateBMI(profile: IUserProfile): number | null {
  const weight = profile.bodyMetrics?.weightKg;
  const height = profile.bodyMetrics?.heightCm;
  if (!weight || !height || height === 0) return null;
  return Math.round((weight / ((height / 100) ** 2)) * 10) / 10;
}

export function calculateTDEE(profile: IUserProfile): number {
  const bmr = calculateBMR(profile);
  const workoutDays = profile.fitnessGoals?.weeklyWorkoutDays ?? 3;
  const athleticism = profile.athleticismLevel ?? 'beginner';
  const workIntensity = profile.workIntensity ?? 'moderate';
  let multiplier = 1.4; // sedentary base
  if (workoutDays >= 6 || athleticism === 'advanced') multiplier = 1.725;
  else if (workoutDays >= 4 || athleticism === 'intermediate') multiplier = 1.55;
  else if (workoutDays >= 2) multiplier = 1.45;
  // Heavy desk work slightly lowers effective activity
  if (workIntensity === 'heavy') multiplier -= 0.05;
  return Math.round(bmr * multiplier);
}

export function calculateDailyCalorieTarget(profile: IUserProfile): number {
  if (profile.dailyCalorieTarget && profile.dailyCalorieTarget > 0) return profile.dailyCalorieTarget;
  const tdee = calculateTDEE(profile);
  const goal = profile.fitnessGoals?.goalType ?? 'maintain';
  switch (goal) {
    case 'lose_weight': return Math.round(tdee * 0.8); // 20% deficit
    case 'build_muscle': return Math.round(tdee * 1.15); // 15% surplus
    case 'endurance': return Math.round(tdee * 1.05);
    default: return tdee;
  }
}

export function calculateMacroTargets(profile: IUserProfile): { proteinG: number; carbsG: number; fatG: number } {
  const calories = calculateDailyCalorieTarget(profile);
  const goal = profile.fitnessGoals?.goalType ?? 'maintain';
  const foodPref = profile.preferredFoodType ?? 'balanced';

  let proteinPct = 0.25, carbPct = 0.50, fatPct = 0.25;
  if (goal === 'build_muscle' || foodPref === 'high_protein') {
    proteinPct = 0.35; carbPct = 0.40; fatPct = 0.25;
  } else if (goal === 'lose_weight' || foodPref === 'low_carb') {
    proteinPct = 0.30; carbPct = 0.35; fatPct = 0.35;
  }
  return {
    proteinG: Math.round((calories * proteinPct) / 4),
    carbsG: Math.round((calories * carbPct) / 4),
    fatG: Math.round((calories * fatPct) / 9),
  };
}

export function estimateCaloriesBurned(exercise: Exercise, durationMinutes: number, weightKg: number): number {
  const weightFactor = weightKg / 70;
  return Math.round(exercise.caloriesPerMinute * durationMinutes * weightFactor);
}

// --- Day boundaries from sleep ---

export function getDayBoundaries(profile: IUserProfile): { dayStartMin: number; dayEndMin: number } {
  const wakeUp = profile.sleepSchedule?.wakeUpTime ?? '07:00';
  const sleepTime = profile.sleepSchedule?.sleepTime ?? '23:00';
  const [wh, wm] = wakeUp.split(':').map(Number);
  const [sh, sm] = sleepTime.split(':').map(Number);
  return {
    dayStartMin: wh * 60 + wm,
    dayEndMin: sh * 60 + sm,
  };
}

// --- Should this day have a workout? ---

export function shouldWorkoutToday(profile: IUserProfile, dayOfWeek: number): boolean {
  const targetDays = profile.fitnessGoals?.weeklyWorkoutDays ?? 5;
  if (targetDays >= 7) return true;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  if (isWeekend && profile.weekendAvailability === false) return false;
  // For N workout days, select: Mon(1), Wed(3), Fri(5) for 3; Mon-Fri for 5; etc.
  const weekdayOrder = [1, 3, 5, 2, 4, 6, 0]; // Mon,Wed,Fri,Tue,Thu,Sat,Sun
  const activeDays = weekdayOrder.slice(0, targetDays);
  return activeDays.includes(dayOfWeek);
}

// --- Is this a work day? ---

export function isWorkDay(profile: IUserProfile, dayOfWeek: number): boolean {
  const workDays = profile.workHours?.daysPerWeek ?? 5;
  if (workDays === 0) return false;
  if (workDays >= 7) return true;
  // Work days are the first N weekdays starting from Monday
  const weekdayOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun
  return weekdayOrder.indexOf(dayOfWeek) < workDays;
}

// --- Preferred workout start time in minutes ---

export function getPreferredWorkoutStartMin(profile: IUserProfile): number | undefined {
  const pref = profile.preferredWorkoutTime;
  const boundaries = getDayBoundaries(profile);
  switch (pref) {
    case 'morning': return boundaries.dayStartMin + 15; // shortly after waking
    case 'afternoon': return 12 * 60 + 30; // 12:30
    case 'evening': return 17 * 60 + 30; // 17:30
    default: return undefined; // flexible — let scheduler decide
  }
}

// --- Exercise Recommendations ---

/**
 * Returns true if the exercise can be performed with the user's available equipment.
 * If the user provided no equipment list (undefined or empty), no filtering is applied
 * (treated as "no preference"). Bodyweight exercises (equipment includes 'none') are
 * always allowed.
 */
function exerciseEquipmentAllowed(
  exercise: Exercise,
  availableEquipment: string[] | undefined
): boolean {
  if (!availableEquipment || availableEquipment.length === 0) return true;
  if (!exercise.equipment || exercise.equipment.length === 0) return true;
  if (exercise.equipment.includes('none')) return true;
  return exercise.equipment.every((eq) => availableEquipment.includes(eq));
}

export function recommendExercises(
  profile: IUserProfile,
  date: string,
  count: number = 4
): { exercises: Exercise[]; totalCalories: number } {
  const goal = (profile.fitnessGoals?.goalType ?? 'maintain') as GoalType;
  const bodyType = (profile.bodyType ?? 'mesomorph') as BodyType;
  // 'not_sure' means the user doesn't have a preference — treat it like 'mixed'
  // so the recommender draws from the broadest exercise pool.
  const rawModality = profile.exerciseModality;
  const modality: Modality = (!rawModality || rawModality === 'not_sure' ? 'mixed' : rawModality) as Modality;
  const intensity = (profile.maxWorkoutIntensity ?? 'moderate') as Intensity;
  const athleticism = profile.athleticismLevel ?? 'beginner';
  const weight = profile.bodyMetrics?.weightKg ?? 70;
  const durationMin = profile.workoutDurationMinutes ?? 45;
  const dayOfWeek = new Date(date + 'T12:00:00').getDay();
  const targetMuscles = MUSCLE_GROUP_ROTATION[dayOfWeek % MUSCLE_GROUP_ROTATION.length];
  const availableEquipment = profile.availableEquipment;

  const intensityOrder: Record<string, number> = { light: 1, moderate: 2, intense: 3 };
  const maxLevel = intensityOrder[intensity] ?? 2;

  let pool = EXERCISES.filter((e) => {
    if (intensityOrder[e.intensity] > maxLevel) return false;
    if (!e.suitableGoals.includes(goal)) return false;
    if (!e.suitableBodyTypes.includes(bodyType)) return false;
    if (modality !== 'mixed' && !e.modality.includes(modality)) return false;
    if (!exerciseEquipmentAllowed(e, availableEquipment)) return false;
    return true;
  });

  if (pool.length < count) {
    // Relax body-type and modality, but keep the equipment constraint so we never
    // recommend something the user literally cannot perform.
    pool = EXERCISES.filter((e) => {
      if (intensityOrder[e.intensity] > maxLevel) return false;
      if (!e.suitableGoals.includes(goal)) return false;
      if (!exerciseEquipmentAllowed(e, availableEquipment)) return false;
      return true;
    });
  }
  if (pool.length === 0) {
    // Relax goal as well; keep equipment constraint.
    pool = EXERCISES.filter((e) =>
      intensityOrder[e.intensity] <= maxLevel && exerciseEquipmentAllowed(e, availableEquipment)
    );
  }
  if (pool.length === 0) {
    // Equipment list is so restrictive nothing matches — fall back to bodyweight only.
    pool = EXERCISES.filter((e) => e.equipment.includes('none'));
  }

  const scored = pool.map((e) => {
    let score = 0;
    score += e.muscleGroups.filter((m) => targetMuscles.includes(m)).length * 3;
    if (e.suitableBodyTypes.includes(bodyType)) score += 2;
    if (e.modality.includes(modality) || modality === 'mixed') score += 1;
    if (athleticism === 'beginner' && e.intensity === 'light') score += 1;
    if (athleticism === 'intermediate' && e.intensity === 'moderate') score += 1;
    if (athleticism === 'advanced' && e.intensity === 'intense') score += 1;
    if (goal === 'lose_weight' && e.caloriesPerMinute > 8) score += 2;
    if (goal === 'build_muscle' && e.muscleGroups.some((m) => !['cardio_endurance', 'flexibility'].includes(m))) score += 2;
    if (goal === 'endurance' && e.muscleGroups.includes('cardio_endurance')) score += 2;
    return { exercise: e, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const rand = seededRandom(`${profile.userId}-${date}`);
  const topPool = scored.slice(0, Math.max(count * 3, 12));
  const shuffled = shuffleWithSeed(topPool, rand);

  const selected: Exercise[] = [];
  const usedMuscles = new Set<string>();
  for (const item of shuffled) {
    if (selected.length >= count) break;
    if (item.exercise.muscleGroups.every((m) => usedMuscles.has(m)) && selected.length >= 2) continue;
    selected.push(item.exercise);
    item.exercise.muscleGroups.forEach((m) => usedMuscles.add(m));
  }
  while (selected.length < count) {
    const next = shuffled.find((s) => !selected.includes(s.exercise));
    if (next) selected.push(next.exercise);
    else break;
  }

  const perMin = durationMin / Math.max(selected.length, 1);
  const totalCalories = selected.reduce((s, e) => s + estimateCaloriesBurned(e, perMin, weight), 0);
  return { exercises: selected, totalCalories };
}

// --- Meal Recommendations ---

export function recommendMeal(
  profile: IUserProfile,
  mealSlot: MealSlot,
  date: string,
  excludeIds: string[] = []
): { meal: Meal; alternatives: Meal[] } {
  const dietType = profile.dietaryPreferences?.dietType ?? 'none';
  const avoidList = [
    ...(profile.dietaryPreferences?.allergies ?? []),
    ...(profile.dietaryPreferences?.avoid ?? []),
    ...(profile.foodsToAvoid ?? []),
  ].map((s) => s.toLowerCase());
  const foodPref = profile.preferredFoodType ?? 'balanced';

  let pool = MEALS.filter((m) => {
    if (!m.mealSlot.includes(mealSlot)) return false;
    if (dietType !== 'none' && !m.diets.includes(dietType)) return false;
    if (avoidList.some((a) => m.contains.some((c) => c.toLowerCase().includes(a)))) return false;
    if (excludeIds.includes(m.id)) return false;
    return true;
  });
  if (pool.length === 0) {
    pool = MEALS.filter((m) => m.mealSlot.includes(mealSlot) && !excludeIds.includes(m.id));
  }

  const calorieTarget = calculateDailyCalorieTarget(profile);
  const mealTarget = mealSlot === 'snack' ? calorieTarget * 0.1 : calorieTarget * 0.3;

  const scored = pool.map((m) => {
    let score = 0;
    if (m.foodPreferences.includes(foodPref)) score += 3;
    if (dietType !== 'none' && m.diets.includes(dietType)) score += 2;
    score -= Math.abs(m.calories - mealTarget) / 100;
    return { meal: m, score };
  });
  scored.sort((a, b) => b.score - a.score);

  const rand = seededRandom(`${profile.userId}-${date}-${mealSlot}`);
  const shuffled = shuffleWithSeed(scored.slice(0, Math.max(6, scored.length)), rand);
  const primary = shuffled[0]?.meal ?? pool[0];
  const alternatives = shuffled.slice(1, 4).map((s) => s.meal);
  return { meal: primary, alternatives };
}

export function recommendDayMeals(profile: IUserProfile, date: string) {
  const usedIds: string[] = [];
  const breakfast = recommendMeal(profile, 'breakfast', date, usedIds);
  usedIds.push(breakfast.meal.id);
  const lunch = recommendMeal(profile, 'lunch', date, usedIds);
  usedIds.push(lunch.meal.id);
  const dinner = recommendMeal(profile, 'dinner', date, usedIds);
  usedIds.push(dinner.meal.id);

  const mealFreq = profile.mealFrequency ?? 3;
  let snack: { meal: Meal; alternatives: Meal[] } | undefined;
  if (mealFreq > 3) {
    snack = recommendMeal(profile, 'snack', date, usedIds);
  }
  return { breakfast, lunch, dinner, snack };
}

// --- Insights ---

export interface DayStatForInsight {
  date: string;
  completedWorkouts: number;
  totalWorkouts: number;
  completedMeals: number;
  totalMeals: number;
  goalPercent: number;
}

export function generateInsights(days: DayStatForInsight[]): string[] {
  const insights: string[] = [];
  if (days.length === 0) return insights;

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayScores = new Map<number, { total: number; count: number }>();
  for (const d of days) {
    if (d.totalWorkouts === 0 && d.totalMeals === 0) continue;
    const dow = new Date(d.date + 'T12:00:00').getDay();
    const prev = dayScores.get(dow) ?? { total: 0, count: 0 };
    prev.total += d.goalPercent;
    prev.count += 1;
    dayScores.set(dow, prev);
  }

  const ranked = [...dayScores.entries()]
    .map(([dow, s]) => ({ dow, avg: s.total / s.count }))
    .sort((a, b) => b.avg - a.avg);

  if (ranked.length >= 2 && ranked[0].avg > 50) {
    insights.push(`You are most consistent on ${DAY_NAMES[ranked[0].dow]} and ${DAY_NAMES[ranked[1].dow]}.`);
  }

  const worst = ranked[ranked.length - 1];
  if (worst && worst.avg < 30 && ranked.length >= 3) {
    insights.push(`${DAY_NAMES[worst.dow]} tends to be your weakest day — consider lighter workouts or meal prep.`);
  }

  const totalW = days.reduce((s, d) => s + d.completedWorkouts, 0);
  const totalM = days.reduce((s, d) => s + d.completedMeals, 0);
  const avgGoal = days.reduce((s, d) => s + d.goalPercent, 0) / days.length;

  if (totalW > 0 && totalM === 0) {
    insights.push('You are completing workouts but not tracking meals. Nutrition is key to seeing results.');
  } else if (totalM > 0 && totalW === 0) {
    insights.push('Meal tracking is on point! Adding workouts will accelerate your progress.');
  } else if (totalW > totalM * 0.8 && totalM > 0) {
    insights.push('Great workout consistency! Slightly more meal adherence will maximize results.');
  }

  if (avgGoal >= 80) insights.push('Outstanding consistency — you are in the top tier. Keep it going!');
  else if (avgGoal >= 50) insights.push('Good progress! Aim for 80%+ daily completion for faster results.');
  else if (avgGoal > 0) insights.push('Every step counts. Try completing at least 2 activities daily to build momentum.');

  return insights;
}

export function generateFitnessPrediction(profile: IUserProfile, days: DayStatForInsight[]): string | null {
  const activeDays = days.filter((d) => d.totalWorkouts > 0 || d.totalMeals > 0);
  if (activeDays.length < 7) return null;
  const goal = profile.fitnessGoals?.goalType;
  const avgGoal = activeDays.reduce((s, d) => s + d.goalPercent, 0) / activeDays.length;
  const workoutsPerWeek = (activeDays.reduce((s, d) => s + d.completedWorkouts, 0) / activeDays.length) * 7;

  if (goal === 'lose_weight' && avgGoal >= 50) {
    const kgPerMonth = Math.min(workoutsPerWeek * 0.12 * (avgGoal / 100), 2);
    if (kgPerMonth < 0.1) return null;
    return `At your current pace (~${workoutsPerWeek.toFixed(0)} workouts/week, ${avgGoal.toFixed(0)}% adherence), you could lose ~${kgPerMonth.toFixed(1)} kg in 30 days.`;
  }
  if (goal === 'build_muscle' && avgGoal >= 50) {
    const gainPerMonth = Math.min(workoutsPerWeek * 0.06 * (avgGoal / 100), 0.8);
    if (gainPerMonth < 0.1) return null;
    return `With ${workoutsPerWeek.toFixed(0)} workouts/week and ${avgGoal.toFixed(0)}% consistency, you could gain ~${gainPerMonth.toFixed(1)} kg of lean mass per month.`;
  }
  if (goal === 'endurance' && avgGoal >= 40) {
    return `Your cardio consistency suggests noticeable endurance improvement within 3-4 weeks. Keep pushing!`;
  }
  if (avgGoal >= 70) {
    return `Strong consistency at ${avgGoal.toFixed(0)}%! You are building lasting healthy habits.`;
  }
  return null;
}

export function suggestRestDay(recentDays: DayStatForInsight[]): boolean {
  if (recentDays.length < 3) return false;
  return recentDays.every((d) => d.completedWorkouts >= 1 && d.goalPercent >= 70);
}

export function getMotivationMessage(days: DayStatForInsight[]): string {
  const msgs = {
    streak: [
      "You're on fire! Keep the streak alive.",
      'Consistency is the key to transformation. Great work.',
      'Champions are made one day at a time. Keep going.',
    ],
    comeback: [
      "Every champion has setbacks. Today is your comeback day.",
      "Start fresh today — yesterday doesn't define your journey.",
      'One workout can change your mood. Let us do this.',
    ],
    steady: [
      'Steady progress beats perfection. Well done.',
      'You are building habits that last a lifetime.',
      'Small steps, big results. Keep showing up.',
    ],
  };
  if (days.length === 0) return msgs.comeback[0];
  const recent = days.slice(-3);
  const streak = recent.filter((d) => d.completedWorkouts >= 1).length;
  const rand = seededRandom(new Date().toISOString().slice(0, 10));
  const idx = Math.floor(rand() * 3);
  if (streak >= 3) return msgs.streak[idx];
  if (streak === 0) return msgs.comeback[idx];
  return msgs.steady[idx];
}

export function getEnergyPrediction(profile: IUserProfile): { level: 'high' | 'moderate' | 'low'; message: string } {
  const sleepStart = profile.sleepSchedule?.sleepTime ?? '23:00';
  const wakeUp = profile.sleepSchedule?.wakeUpTime ?? '07:00';
  const [sh, sm] = sleepStart.split(':').map(Number);
  const [wh, wm] = wakeUp.split(':').map(Number);
  let sleepMinutes = (wh * 60 + wm) - (sh * 60 + sm);
  if (sleepMinutes < 0) sleepMinutes += 24 * 60;
  const sleepHours = sleepMinutes / 60;

  if (sleepHours >= 7 && sleepHours <= 9) {
    return { level: 'high', message: `Good sleep (${sleepHours.toFixed(1)}h) — you should have great energy for today's workout.` };
  }
  if (sleepHours >= 5.5) {
    return { level: 'moderate', message: `Moderate sleep (${sleepHours.toFixed(1)}h). Consider a moderate-intensity workout today.` };
  }
  return { level: 'low', message: `Low sleep (${sleepHours.toFixed(1)}h). A light workout or rest day might be better today.` };
}
