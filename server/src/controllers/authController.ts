import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { UserModel, hashPassword, verifyPassword } from '../models/User.js';
import { UserProfileModel } from '../models/UserProfile.js';
import { AppError } from '../middleware/errorHandler.js';
import { profileToJson } from './usersController.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function register(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = registerSchema.parse(req.body);
    const existing = await UserModel.findOne({ email: body.email });
    if (existing) {
      next(new AppError(400, 'Email already registered', 'EMAIL_EXISTS'));
      return;
    }
    const passwordHash = await hashPassword(body.password);
    const user = await UserModel.create({
      email: body.email,
      passwordHash,
      name: body.name,
    });
    const profile = await UserProfileModel.create({
      userId: user._id,
      onboardingCompleted: false,
    });
    await UserModel.updateOne({ _id: user._id }, { profileId: profile._id });
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn as jwt.SignOptions['expiresIn'] }
    );
    res.status(201).json({
      user: { id: user._id.toString(), email: user.email, name: user.name },
      token,
      profileId: profile._id.toString(),
      onboardingCompleted: false,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      next(new AppError(400, e.errors[0]?.message ?? 'Validation failed', 'VALIDATION_ERROR'));
      return;
    }
    next(e);
  }
}

export async function login(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = loginSchema.parse(req.body);
    const user = await UserModel.findOne({ email: body.email }).select('+passwordHash');
    if (!user) {
      next(new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS'));
      return;
    }
    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) {
      next(new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS'));
      return;
    }
    const profile = await UserProfileModel.findOne({ userId: user._id }).lean();
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn as jwt.SignOptions['expiresIn'] }
    );
    res.json({
      user: { id: user._id.toString(), email: user.email, name: user.name },
      token,
      profileId: profile?._id.toString(),
      onboardingCompleted: profile?.onboardingCompleted ?? false,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      next(new AppError(400, e.errors[0]?.message ?? 'Validation failed', 'VALIDATION_ERROR'));
      return;
    }
    next(e);
  }
}

export async function me(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      next(new AppError(401, 'Not authenticated'));
      return;
    }
    const user = await UserModel.findById(req.user.id)
      .select('email name profileId squadId createdAt')
      .lean();
    if (!user) {
      next(new AppError(404, 'User not found'));
      return;
    }
    const profile = await UserProfileModel.findOne({ userId: user._id }).lean();
    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        profileId: user.profileId?.toString(),
        squadId: user.squadId?.toString(),
        createdAt: user.createdAt,
      },
      // Use the same canonical projection as `GET /users/profile` so that
      // `useAuth().profile` on the client matches what the Profile page sees.
      // Otherwise per-field reads (e.g. the Dashboard's water-target label
      // reading `profile.dailyWaterIntakeL`) silently return `undefined` for
      // every field that wasn't in this hand-picked list.
      profile: profile ? profileToJson(profile) : null,
    });
  } catch (e) {
    next(e);
  }
}
