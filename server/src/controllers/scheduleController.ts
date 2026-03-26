import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserProfileModel } from '../models/UserProfile.js';
import { ScheduleModel } from '../models/Schedule.js';
import {
  getOrCreateDaySchedule,
  recalculateDaySchedule,
  setBusySlot,
  markActivityCompleted,
  getScheduleRange,
  getProgressStats,
  getDashboardData,
} from '../services/scheduleService.js';
import { syncSquadProgress } from './squadsController.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const busySlotSchema = z.object({ start: z.string(), end: z.string(), label: z.string().optional() });

export async function getDaySchedule(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.query.date);
    const data = await getOrCreateDaySchedule(req.user!.id, date);
    res.json(data);
  } catch (e) {
    if (e instanceof z.ZodError) {
      next(new AppError(400, 'Invalid date format (YYYY-MM-DD)', 'VALIDATION_ERROR'));
      return;
    }
    next(e);
  }
}

export async function updateBusySlots(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.body.date);
    const busySlots = z.array(busySlotSchema).parse(req.body.busySlots ?? []);
    const profile = await UserProfileModel.findOne({ userId: req.user!.id }).lean();
    if (!profile) {
      next(new AppError(400, 'Complete onboarding first', 'PROFILE_REQUIRED'));
      return;
    }
    const scheduled = await setBusySlot(req.user!.id, date, busySlots, profile);
    res.json({ busySlots, scheduledActivities: scheduled });
  } catch (e) {
    if (e instanceof z.ZodError) {
      next(new AppError(400, e.errors[0]?.message ?? 'Validation failed', 'VALIDATION_ERROR'));
      return;
    }
    next(e);
  }
}

export async function recalculateSchedule(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.body.date);
    const profile = await UserProfileModel.findOne({ userId: req.user!.id }).lean();
    if (!profile) {
      next(new AppError(400, 'Complete onboarding first', 'PROFILE_REQUIRED'));
      return;
    }
    const { busySlots } = await getOrCreateDaySchedule(req.user!.id, date);
    const scheduled = await recalculateDaySchedule(req.user!.id, date, profile, busySlots);
    res.json({ scheduledActivities: scheduled });
  } catch (e) {
    if (e instanceof z.ZodError) {
      next(new AppError(400, 'Invalid date', 'VALIDATION_ERROR'));
      return;
    }
    next(e);
  }
}

export async function markComplete(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.body.date);
    const activityIndex = z.number().int().min(0).parse(req.body.activityIndex);
    const completed = z.boolean().parse(req.body.completed);
    await markActivityCompleted(req.user!.id, date, activityIndex, completed);
    const updated = await ScheduleModel.findOne({ userId: req.user!.id, date }).lean();
    if (updated) await syncSquadProgress(req.user!.id, date, updated);
    res.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      next(new AppError(400, e.errors[0]?.message ?? 'Validation failed', 'VALIDATION_ERROR'));
      return;
    }
    next(e);
  }
}

export async function getRange(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const startDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.query.startDate);
    const endDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.query.endDate);
    if (startDate > endDate) {
      next(new AppError(400, 'startDate must be <= endDate'));
      return;
    }
    const data = await getScheduleRange(req.user!.id, startDate, endDate);
    res.json({ schedule: data });
  } catch (e) {
    if (e instanceof z.ZodError) {
      next(new AppError(400, 'Invalid date range', 'VALIDATION_ERROR'));
      return;
    }
    next(e);
  }
}

export async function getStats(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const startDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.query.startDate);
    const endDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.query.endDate);
    if (startDate > endDate) {
      next(new AppError(400, 'startDate must be <= endDate'));
      return;
    }
    const profile = await UserProfileModel.findOne({ userId: req.user!.id }).lean();
    const data = await getProgressStats(req.user!.id, startDate, endDate, profile ?? undefined);
    res.json(data);
  } catch (e) {
    if (e instanceof z.ZodError) {
      next(new AppError(400, 'Invalid date range', 'VALIDATION_ERROR'));
      return;
    }
    next(e);
  }
}

export async function getDashboard(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await UserProfileModel.findOne({ userId: req.user!.id }).lean();
    if (!profile) {
      next(new AppError(400, 'Complete onboarding first', 'PROFILE_REQUIRED'));
      return;
    }
    const data = await getDashboardData(req.user!.id, profile);
    res.json(data);
  } catch (e) {
    next(e);
  }
}
