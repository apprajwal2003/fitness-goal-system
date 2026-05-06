import { Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { SquadModel, generateInviteCode, type ISquad } from '../models/Squad.js';
import { SquadProgressModel } from '../models/SquadProgress.js';
import { UserModel } from '../models/User.js';
import { ScheduleModel } from '../models/Schedule.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const createSquadSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  privacy: z.enum(['public', 'invite_only']).optional(),
});

function squadToPublic(squad: ISquad) {
  return {
    id: squad._id.toString(),
    name: squad.name,
    description: squad.description ?? '',
    privacy: squad.privacy,
    inviteCode: squad.inviteCode,
    leaderId: squad.leaderId.toString(),
    memberIds: squad.memberIds.map((id) => id.toString()),
    createdById: squad.createdById.toString(),
  };
}

/** Creates a new invite code that is not yet present in the collection. Tries up to 5 times. */
async function createUniqueInviteCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = generateInviteCode();
    const existing = await SquadModel.exists({ inviteCode: code });
    if (!existing) return code;
  }
  return generateInviteCode() + Math.floor(Math.random() * 100).toString();
}

export async function createSquad(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = createSquadSchema.parse(req.body);
    const inviteCode = await createUniqueInviteCode();
    const squad = await SquadModel.create({
      name: body.name,
      description: body.description ?? '',
      privacy: body.privacy ?? 'invite_only',
      inviteCode,
      leaderId: req.user!.id,
      memberIds: [req.user!.id],
      createdById: req.user!.id,
    });
    await UserModel.updateOne({ _id: req.user!.id }, { squadId: squad._id });
    res.status(201).json(squadToPublic(squad));
  } catch (e) {
    if (e instanceof z.ZodError) {
      next(new AppError(400, e.errors[0]?.message ?? 'Validation failed', 'VALIDATION_ERROR'));
      return;
    }
    next(e);
  }
}

type SquadDoc = mongoose.HydratedDocument<ISquad>;

async function addMemberAndSave(squad: SquadDoc, userId: string): Promise<SquadDoc> {
  if (!squad.memberIds.some((id) => id.toString() === userId)) {
    squad.memberIds.push(new mongoose.Types.ObjectId(userId));
    await squad.save();
    await UserModel.updateOne({ _id: userId }, { squadId: squad._id });
  }
  return squad;
}

export async function joinSquad(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const squadId = z.string().min(1).parse(req.params.squadId);
    if (!mongoose.Types.ObjectId.isValid(squadId)) {
      next(new AppError(400, 'Invalid squad id', 'VALIDATION_ERROR'));
      return;
    }
    const squad = await SquadModel.findById(squadId);
    if (!squad) {
      next(new AppError(404, 'Squad not found'));
      return;
    }
    const updated = await addMemberAndSave(squad, req.user!.id);
    res.json(squadToPublic(updated));
  } catch (e) {
    if (e instanceof z.ZodError) {
      next(new AppError(400, 'Invalid squad id', 'VALIDATION_ERROR'));
      return;
    }
    next(e);
  }
}

export async function joinSquadByCode(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const codeRaw = z.string().min(4).max(16).parse(req.body.inviteCode);
    const code = codeRaw.trim().toUpperCase();
    const squad = await SquadModel.findOne({ inviteCode: code });
    if (!squad) {
      next(new AppError(404, 'Invite code not found'));
      return;
    }
    const updated = await addMemberAndSave(squad, req.user!.id);
    res.json(squadToPublic(updated));
  } catch (e) {
    if (e instanceof z.ZodError) {
      next(new AppError(400, e.errors[0]?.message ?? 'Invite code is required', 'VALIDATION_ERROR'));
      return;
    }
    next(e);
  }
}

/**
 * Backfills `inviteCode` and `leaderId` on a squad document if they are missing.
 * This keeps squads created before these fields existed usable without a manual migration.
 * Returns the squad doc with all fields populated.
 */
async function ensureSquadHasInviteFields(squad: SquadDoc): Promise<SquadDoc> {
  let dirty = false;
  if (!squad.inviteCode) {
    squad.inviteCode = await createUniqueInviteCode();
    dirty = true;
  }
  if (!squad.leaderId) {
    squad.leaderId = squad.createdById;
    dirty = true;
  }
  if (!squad.privacy) {
    squad.privacy = 'invite_only';
    dirty = true;
  }
  if (dirty) {
    await squad.save();
  }
  return squad;
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
    const squadDoc = await SquadModel.findById(user.squadId);
    if (!squadDoc) {
      res.json({ squad: null });
      return;
    }
    const squad = await ensureSquadHasInviteFields(squadDoc);
    const members = await UserModel.find({ _id: { $in: squad.memberIds } })
      .select('name email')
      .lean();
    res.json({
      squad: {
        id: squad._id.toString(),
        name: squad.name,
        description: squad.description ?? '',
        privacy: squad.privacy,
        inviteCode: squad.inviteCode,
        leaderId: squad.leaderId?.toString?.() ?? squad.createdById.toString(),
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
