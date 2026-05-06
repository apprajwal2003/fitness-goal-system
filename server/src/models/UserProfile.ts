import mongoose from 'mongoose';

const recurringSlotSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    start: { type: String, required: true },
    end: { type: String, required: true },
    label: { type: String, default: '' },
  },
  { _id: false }
);

export interface IUserProfile {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  onboardingCompleted: boolean;

  bodyMetrics: {
    weightKg?: number;
    heightCm?: number;
    age?: number;
    gender?: 'male' | 'female' | 'other';
  };

  bodyType?: 'ectomorph' | 'mesomorph' | 'endomorph';
  athleticismLevel?: 'beginner' | 'intermediate' | 'advanced';
  exerciseModality?: 'gym' | 'yoga' | 'home_workout' | 'cardio' | 'aerobics' | 'mixed';
  /** Equipment the user has access to. Empty / undefined means "no preference" — no filtering applied. */
  availableEquipment?: string[];

  dietaryPreferences: {
    dietType?: 'vegetarian' | 'vegan' | 'pescatarian' | 'none';
    allergies?: string[];
    avoid?: string[];
  };
  foodsToAvoid?: string[];
  preferredFoodType?: 'high_protein' | 'low_carb' | 'balanced';
  dailyWaterIntakeL?: number;

  fitnessGoals: {
    goalType?: 'lose_weight' | 'build_muscle' | 'maintain' | 'endurance';
    targetWeightKg?: number;
    weeklyWorkoutDays?: number;
    weeklyMealPlan?: boolean;
  };

  workHours: {
    start: string;
    end: string;
    daysPerWeek: number;
  };
  workIntensity?: 'light' | 'moderate' | 'heavy';

  sleepSchedule?: {
    sleepTime: string;
    wakeUpTime: string;
  };
  preferredWorkoutTime?: 'morning' | 'afternoon' | 'evening' | 'flexible';
  energyLevelPreference?: 'high_morning' | 'balanced' | 'high_evening';
  weekendAvailability?: boolean;

  travelMinutesPerDay: number;
  weeklyRoutine: Array<{ dayOfWeek: number; start: string; end: string; label?: string }>;

  mealDurationsMinutes: { breakfast: number; lunch: number; dinner: number; snack?: number };
  workoutDurationMinutes: number;
  maxWorkoutIntensity?: 'light' | 'moderate' | 'intense';
  mealFrequency?: number;
  dailyCalorieTarget?: number;

  createdAt: Date;
  updatedAt: Date;
}

const userProfileSchema = new mongoose.Schema<IUserProfile>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    onboardingCompleted: { type: Boolean, default: false },
    bodyMetrics: {
      weightKg: Number,
      heightCm: Number,
      age: Number,
      gender: { type: String, enum: ['male', 'female', 'other'] },
    },
    bodyType: { type: String, enum: ['ectomorph', 'mesomorph', 'endomorph'] },
    athleticismLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
    exerciseModality: { type: String, enum: ['gym', 'yoga', 'home_workout', 'cardio', 'aerobics', 'mixed'] },
    availableEquipment: { type: [String], default: undefined },
    dietaryPreferences: {
      dietType: { type: String, enum: ['vegetarian', 'vegan', 'pescatarian', 'none'] },
      allergies: [String],
      avoid: [String],
    },
    foodsToAvoid: [String],
    preferredFoodType: { type: String, enum: ['high_protein', 'low_carb', 'balanced'] },
    dailyWaterIntakeL: Number,
    fitnessGoals: {
      goalType: { type: String, enum: ['lose_weight', 'build_muscle', 'maintain', 'endurance'] },
      targetWeightKg: Number,
      weeklyWorkoutDays: Number,
      weeklyMealPlan: Boolean,
    },
    workHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      daysPerWeek: { type: Number, default: 5 },
    },
    workIntensity: { type: String, enum: ['light', 'moderate', 'heavy'] },
    sleepSchedule: {
      sleepTime: { type: String, default: '23:00' },
      wakeUpTime: { type: String, default: '07:00' },
    },
    preferredWorkoutTime: { type: String, enum: ['morning', 'afternoon', 'evening', 'flexible'] },
    energyLevelPreference: { type: String, enum: ['high_morning', 'balanced', 'high_evening'] },
    weekendAvailability: { type: Boolean, default: true },
    travelMinutesPerDay: { type: Number, default: 0 },
    weeklyRoutine: [recurringSlotSchema],
    mealDurationsMinutes: {
      breakfast: { type: Number, default: 15 },
      lunch: { type: Number, default: 30 },
      dinner: { type: Number, default: 30 },
      snack: { type: Number, default: 10 },
    },
    workoutDurationMinutes: { type: Number, default: 45 },
    maxWorkoutIntensity: { type: String, enum: ['light', 'moderate', 'intense'] },
    mealFrequency: { type: Number, default: 3 },
    dailyCalorieTarget: Number,
  },
  { timestamps: true }
);

export const UserProfileModel = mongoose.model<IUserProfile>('UserProfile', userProfileSchema);
