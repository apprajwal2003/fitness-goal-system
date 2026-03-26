import mongoose from 'mongoose';

export interface ISquadProgress {
  _id: mongoose.Types.ObjectId;
  squadId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  goalPercent: number; // 0-100 standardized
  completedMeals: number;
  totalMeals: number;
  completedWorkouts: number;
  totalWorkouts: number;
  updatedAt: Date;
}

const squadProgressSchema = new mongoose.Schema<ISquadProgress>(
  {
    squadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Squad', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    goalPercent: { type: Number, default: 0 },
    completedMeals: { type: Number, default: 0 },
    totalMeals: { type: Number, default: 0 },
    completedWorkouts: { type: Number, default: 0 },
    totalWorkouts: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

squadProgressSchema.index({ squadId: 1, date: 1 });
squadProgressSchema.index({ userId: 1, date: 1 });
squadProgressSchema.index({ squadId: 1, userId: 1, date: 1 }, { unique: true });

export const SquadProgressModel = mongoose.model<ISquadProgress>('SquadProgress', squadProgressSchema);
