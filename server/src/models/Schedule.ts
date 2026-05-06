import mongoose from 'mongoose';

const busySlotSchema = new mongoose.Schema(
  {
    start: { type: String, required: true },
    end: { type: String, required: true },
    label: { type: String, default: 'Busy' },
  },
  { _id: false }
);

const nutritionSchema = new mongoose.Schema(
  {
    calories: { type: Number, default: 0 },
    proteinG: { type: Number, default: 0 },
    carbsG: { type: Number, default: 0 },
    fatG: { type: Number, default: 0 },
  },
  { _id: false }
);

const exerciseDetailSchema = new mongoose.Schema(
  {
    exerciseId: String,
    exerciseName: String,
    sets: String,
    reps: String,
    muscleGroups: [String],
    intensity: String,
  },
  { _id: false }
);

const mealDetailSchema = new mongoose.Schema(
  {
    mealId: String,
    mealName: String,
    description: String,
    alternatives: [{ mealId: String, mealName: String, calories: Number }],
  },
  { _id: false }
);

const scheduledActivitySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['meal', 'workout', 'snack'], required: true },
    mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], default: null },
    start: { type: String, required: true },
    end: { type: String, required: true },
    name: { type: String, default: '' },
    completed: { type: Boolean, default: false },
    nutrition: nutritionSchema,
    exerciseDetails: [exerciseDetailSchema],
    mealDetail: mealDetailSchema,
  },
  { _id: false }
);

const reschedulingHistorySchema = new mongoose.Schema(
  {
    at: { type: Date, required: true, default: () => new Date() },
    reason: { type: String, required: true },
  },
  { _id: false }
);

export interface INutrition {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface IExerciseDetail {
  exerciseId: string;
  exerciseName: string;
  sets?: string;
  reps?: string;
  muscleGroups: string[];
  intensity: string;
}

export interface IMealDetail {
  mealId: string;
  mealName: string;
  description?: string;
  alternatives: Array<{ mealId: string; mealName: string; calories: number }>;
}

export interface IBusySlot {
  start: string;
  end: string;
  label?: string;
}

export interface IScheduledActivity {
  type: 'meal' | 'workout' | 'snack';
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  start: string;
  end: string;
  name?: string;
  completed?: boolean;
  nutrition?: INutrition;
  exerciseDetails?: IExerciseDetail[];
  mealDetail?: IMealDetail;
}

export type ScheduleStatus = 'active' | 'completed' | 'partially_completed';

export interface IReschedulingHistoryEntry {
  at: Date;
  reason: string;
}

export interface IDaySchedule {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: string;
  busySlots: IBusySlot[];
  scheduledActivities: IScheduledActivity[];
  status: ScheduleStatus;
  reschedulingHistory: IReschedulingHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const dayScheduleSchema = new mongoose.Schema<IDaySchedule>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    busySlots: [busySlotSchema],
    scheduledActivities: [scheduledActivitySchema],
    status: {
      type: String,
      enum: ['active', 'completed', 'partially_completed'],
      default: 'active',
    },
    reschedulingHistory: { type: [reschedulingHistorySchema], default: [] },
  },
  { timestamps: true }
);

/** Recomputes status from completion counts. Used by service layer before saving. */
export function computeScheduleStatus(activities: IScheduledActivity[]): ScheduleStatus {
  if (activities.length === 0) return 'active';
  const total = activities.length;
  const done = activities.filter((a) => a.completed).length;
  if (done === 0) return 'active';
  if (done === total) return 'completed';
  return 'partially_completed';
}

dayScheduleSchema.index({ userId: 1, date: 1 }, { unique: true });

export const ScheduleModel = mongoose.model<IDaySchedule>('Schedule', dayScheduleSchema);
