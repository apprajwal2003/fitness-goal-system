export interface User {
  id: string;
  email: string;
  name: string;
  profileId?: string;
  squadId?: string;
  createdAt?: string;
}

export interface UserProfile {
  onboardingCompleted: boolean;
  bodyMetrics?: {
    weightKg?: number;
    heightCm?: number;
    age?: number;
    gender?: 'male' | 'female' | 'other';
  };
  bodyType?: 'ectomorph' | 'mesomorph' | 'endomorph';
  athleticismLevel?: 'beginner' | 'intermediate' | 'advanced';
  exerciseModality?: 'gym' | 'yoga' | 'home_workout' | 'cardio' | 'mixed';
  dietaryPreferences?: {
    dietType?: 'vegetarian' | 'vegan' | 'pescatarian' | 'none';
    allergies?: string[];
    avoid?: string[];
  };
  foodsToAvoid?: string[];
  preferredFoodType?: 'high_protein' | 'low_carb' | 'balanced';
  dailyWaterIntakeL?: number;
  fitnessGoals?: {
    goalType?: 'lose_weight' | 'build_muscle' | 'maintain' | 'endurance';
    targetWeightKg?: number;
    weeklyWorkoutDays?: number;
    weeklyMealPlan?: boolean;
  };
  workHours?: { start: string; end: string; daysPerWeek: number };
  workIntensity?: 'light' | 'moderate' | 'heavy';
  sleepSchedule?: { sleepTime: string; wakeUpTime: string };
  preferredWorkoutTime?: 'morning' | 'afternoon' | 'evening' | 'flexible';
  energyLevelPreference?: 'high_morning' | 'balanced' | 'high_evening';
  weekendAvailability?: boolean;
  travelMinutesPerDay?: number;
  weeklyRoutine?: Array<{ dayOfWeek: number; start: string; end: string; label?: string }>;
  mealDurationsMinutes?: { breakfast: number; lunch: number; dinner: number; snack?: number };
  workoutDurationMinutes?: number;
  maxWorkoutIntensity?: 'light' | 'moderate' | 'intense';
  mealFrequency?: number;
  dailyCalorieTarget?: number;
}

export interface Nutrition {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface ExerciseDetail {
  exerciseId: string;
  exerciseName: string;
  sets?: string;
  reps?: string;
  muscleGroups: string[];
  intensity: string;
}

export interface MealDetail {
  mealId: string;
  mealName: string;
  description?: string;
  alternatives: Array<{ mealId: string; mealName: string; calories: number }>;
}

export interface BusySlot {
  start: string;
  end: string;
  label?: string;
}

export interface ScheduledActivity {
  type: 'meal' | 'workout' | 'snack';
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  start: string;
  end: string;
  name?: string;
  completed?: boolean;
  nutrition?: Nutrition;
  exerciseDetails?: ExerciseDetail[];
  mealDetail?: MealDetail;
}

export interface DaySchedule {
  date: string;
  busySlots: BusySlot[];
  scheduledActivities: ScheduledActivity[];
}

export interface Squad {
  id: string;
  name: string;
  members: Array<{ id: string; name: string; email: string }>;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  goalPercent: number;
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

export interface DashboardData {
  today: {
    date: string;
    scheduledActivities: ScheduledActivity[];
    busySlots: BusySlot[];
    caloriesConsumed: number;
    caloriesBurned: number;
    calorieTarget: number;
    macroTargets: { proteinG: number; carbsG: number; fatG: number };
    nutrition: { proteinG: number; carbsG: number; fatG: number };
  };
  energy: { level: 'high' | 'moderate' | 'low'; message: string };
  bmi: number | null;
  waterTarget: number;
  weekStreak: number;
  motivationMessage: string;
  shouldRestToday: boolean;
}
