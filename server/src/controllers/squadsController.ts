import { Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { SquadModel } from '../models/Squad.js';
import { SquadProgressModel } from '../models/SquadProgress.js';
import { UserModel } from '../models/User.js';
import { ScheduleModel } from '../models/Schedule.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export async function createSquad(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const name = z.string().min(1).max(80).parse(req.body.name);
    const squad = await SquadModel.create({
      name,
      memberIds: [req.user!.id],
      createdById: req.user!.id,
    });
    await UserModel.updateOne({ _id: req.user!.id }, { squadId: squad._id });
    res.status(201).json({
      id: squad._id.toString(),
      name: squad.name,
      memberIds: squad.memberIds.map((id) => id.toString()),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      next(new AppError(400, e.errors[0]?.message ?? 'Validation failed', 'VALIDATION_ERROR'));
      return;
    }
    next(e);
  }
}

export async function joinSquad(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const squadId = z.string().min(1).parse(req.params.squadId);
    const squad = await SquadModel.findById(squadId);
    if (!squad) {
      next(new AppError(404, 'Squad not found'));
      return;
    }
    if (squad.memberIds.some((id) => id.toString() === req.user!.id)) {
      res.json({ id: squad._id.toString(), name: squad.name, memberIds: squad.memberIds.map((id) => id.toString()) });
      return;
    }
    squad.memberIds.push(new mongoose.Types.ObjectId(req.user!.id));
    await squad.save();
    await UserModel.updateOne({ _id: req.user!.id }, { squadId: squad._id });
    res.json({ id: squad._id.toString(), name: squad.name, memberIds: squad.memberIds.map((id) => id.toString()) });
  } catch (e) {
    next(e);
  }
}

export async function getMySquad(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await UserModel.findById(req.user!.id).select('squadId').lean();
    if (!user?.squadId) {
      res.json({ squad: null });
      return;
    }
    const squad = await SquadModel.findById(user.squadId).lean();
    if (!squad) {
      res.json({ squad: null });
      return;
    }
    const members = await UserModel.find({ _id: { $in: squad.memberIds } })
      .select('name email')
      .lean();
    res.json({
      squad: {
        id: squad._id.toString(),
        name: squad.name,
        members: members.map((m) => ({ id: m._id.toString(), name: m.name, email: m.email })),
      },
    });
  } catch (e) {
    next(e);
  }
}

/** Standardized goal %: (completedMeals/totalMeals + completedWorkouts/totalWorkouts) / 2 * 100 */
function computeGoalPercent(
  completedMeals: number,
  totalMeals: number,
  completedWorkouts: number,
  totalWorkouts: number
): number {
  const mealPct = totalMeals > 0 ? completedMeals / totalMeals : 0;
  const workoutPct = totalWorkouts > 0 ? completedWorkouts / totalWorkouts : 0;
  return Math.round(((mealPct + workoutPct) / 2) * 100);
}

export async function getLeaderboard(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().parse(req.query.date);
    const user = await UserModel.findById(req.user!.id).select('squadId').lean();
    if (!user?.squadId) {
      res.json({ leaderboard: [], date: date ?? new Date().toISOString().slice(0, 10) });
      return;
    }
    const targetDate = date ?? new Date().toISOString().slice(0, 10);
    const squadDoc = await SquadModel.findById(user.squadId).select('memberIds').lean();
    const memberIds = squadDoc?.memberIds ?? [];
    const schedules = await ScheduleModel.find({
      userId: { $in: memberIds },
      date: targetDate,
    }).lean();
    const users = await UserModel.find({ _id: { $in: memberIds } })
      .select('name')
      .lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u.name]));
    const progressList: Array<{ userId: string; name: string; goalPercent: number }> = [];
    for (const s of schedules) {
      const totalMeals = s.scheduledActivities.filter((a) => a.type === 'meal' || a.type === 'snack').length;
      const totalWorkouts = s.scheduledActivities.filter((a) => a.type === 'workout').length;
      const completedMeals = s.scheduledActivities.filter((a) => (a.type === 'meal' || a.type === 'snack') && a.completed).length;
      const completedWorkouts = s.scheduledActivities.filter((a) => a.type === 'workout' && a.completed).length;
      const goalPercent = computeGoalPercent(completedMeals, totalMeals, completedWorkouts, totalWorkouts);
      progressList.push({
        userId: s.userId.toString(),
        name: userMap.get(s.userId.toString()) ?? 'Unknown',
        goalPercent,
      });
    }
    progressList.sort((a, b) => b.goalPercent - a.goalPercent);
    res.json({ leaderboard: progressList, date: targetDate });
  } catch (e) {
    if (e instanceof z.ZodError) {
      next(new AppError(400, 'Invalid date', 'VALIDATION_ERROR'));
      return;
    }
    next(e);
  }
}

/** Sync progress for a user for a date (called when toggling completion) */
export async function syncSquadProgress(
  userId: string,
  date: string,
  schedule: { scheduledActivities: Array<{ type: string; completed?: boolean }> }
): Promise<void> {
  const user = await UserModel.findById(userId).select('squadId').lean();
  if (!user?.squadId) return;
  const totalMeals = schedule.scheduledActivities.filter((a) => a.type === 'meal' || a.type === 'snack').length;
  const totalWorkouts = schedule.scheduledActivities.filter((a) => a.type === 'workout').length;
  const completedMeals = schedule.scheduledActivities.filter((a) => (a.type === 'meal' || a.type === 'snack') && a.completed).length;
  const completedWorkouts = schedule.scheduledActivities.filter((a) => a.type === 'workout' && a.completed).length;
  const goalPercent = computeGoalPercent(completedMeals, totalMeals, completedWorkouts, totalWorkouts);
  await SquadProgressModel.findOneAndUpdate(
    { squadId: user.squadId, userId, date },
    {
      $set: {
        goalPercent,
        completedMeals,
        totalMeals,
        completedWorkouts,
        totalWorkouts,
      },
    },
    { upsert: true }
  );
}
