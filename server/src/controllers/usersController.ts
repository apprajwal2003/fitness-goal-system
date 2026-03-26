import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserProfileModel } from '../models/UserProfile.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const updateProfileSchema = z.object({
  onboardingCompleted: z.boolean().optional(),
  bodyMetrics: z.object({
    weightKg: z.number().min(0).optional(),
    heightCm: z.number().min(0).optional(),
    age: z.number().min(1).max(120).optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
  }).optional(),
  bodyType: z.enum(['ectomorph', 'mesomorph', 'endomorph']).optional(),
  athleticismLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  exerciseModality: z.enum(['gym', 'yoga', 'home_workout', 'cardio', 'mixed']).optional(),
  dietaryPreferences: z.object({
    dietType: z.enum(['vegetarian', 'vegan', 'pescatarian', 'none']).optional(),
    allergies: z.array(z.string()).optional(),
    avoid: z.array(z.string()).optional(),
  }).optional(),
  foodsToAvoid: z.array(z.string()).optional(),
  preferredFoodType: z.enum(['high_protein', 'low_carb', 'balanced']).optional(),
  dailyWaterIntakeL: z.number().min(0).max(10).optional(),
  fitnessGoals: z.object({
    goalType: z.enum(['lose_weight', 'build_muscle', 'maintain', 'endurance']).optional(),
    targetWeightKg: z.number().min(0).optional(),
    weeklyWorkoutDays: z.number().min(0).max(7).optional(),
    weeklyMealPlan: z.boolean().optional(),
  }).optional(),
  workHours: z.object({
    start: z.string().regex(/^\d{1,2}:\d{2}$/),
    end: z.string().regex(/^\d{1,2}:\d{2}$/),
    daysPerWeek: z.number().min(0).max(7),
  }).optional(),
  workIntensity: z.enum(['light', 'moderate', 'heavy']).optional(),
  sleepSchedule: z.object({
    sleepTime: z.string().regex(/^\d{1,2}:\d{2}$/),
    wakeUpTime: z.string().regex(/^\d{1,2}:\d{2}$/),
  }).optional(),
  preferredWorkoutTime: z.enum(['morning', 'afternoon', 'evening', 'flexible']).optional(),
  energyLevelPreference: z.enum(['high_morning', 'balanced', 'high_evening']).optional(),
  weekendAvailability: z.boolean().optional(),
  travelMinutesPerDay: z.number().min(0).optional(),
  weeklyRoutine: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    start: z.string(),
    end: z.string(),
    label: z.string().optional(),
  })).optional(),
  mealDurationsMinutes: z.object({
    breakfast: z.number().min(1).max(120).optional(),
    lunch: z.number().min(1).max(120).optional(),
    dinner: z.number().min(1).max(120).optional(),
    snack: z.number().min(1).max(60).optional(),
  }).optional(),
  workoutDurationMinutes: z.number().min(5).max(180).optional(),
  maxWorkoutIntensity: z.enum(['light', 'moderate', 'intense']).optional(),
  mealFrequency: z.number().min(3).max(6).optional(),
  dailyCalorieTarget: z.number().min(0).max(10000).optional(),
});

const PROFILE_FIELDS = [
  'onboardingCompleted', 'bodyMetrics', 'bodyType', 'athleticismLevel', 'exerciseModality',
  'dietaryPreferences', 'foodsToAvoid', 'preferredFoodType', 'dailyWaterIntakeL',
  'fitnessGoals', 'workHours', 'workIntensity', 'sleepSchedule',
  'preferredWorkoutTime', 'energyLevelPreference', 'weekendAvailability',
  'travelMinutesPerDay', 'weeklyRoutine', 'mealDurationsMinutes',
  'workoutDurationMinutes', 'maxWorkoutIntensity', 'mealFrequency', 'dailyCalorieTarget',
] as const;

function profileToJson(profile: any) {
  const obj: any = {};
  for (const key of PROFILE_FIELDS) {
    if (profile[key] !== undefined) obj[key] = profile[key];
  }
  return obj;
}

export async function getProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await UserProfileModel.findOne({ userId: req.user!.id }).lean();
    if (!profile) {
      next(new AppError(404, 'Profile not found'));
      return;
    }
    res.json(profileToJson(profile));
  } catch (e) {
    next(e);
  }
}

export async function updateProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = updateProfileSchema.parse(req.body);
    const profile = await UserProfileModel.findOneAndUpdate(
      { userId: req.user!.id },
      { $set: body },
      { new: true }
    ).lean();
    if (!profile) {
      next(new AppError(404, 'Profile not found'));
      return;
    }
    res.json(profileToJson(profile));
  } catch (e) {
    if (e instanceof z.ZodError) {
      next(new AppError(400, e.errors[0]?.message ?? 'Validation failed', 'VALIDATION_ERROR'));
      return;
    }
    next(e);
  }
}
