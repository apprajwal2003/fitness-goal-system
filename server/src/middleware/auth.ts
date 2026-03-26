import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.js';
import { UserModel } from '../models/User.js';

export interface AuthPayload {
  userId: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'));
    return;
  }
  try {
    const decoded = jwt.verify(token, env.jwt.secret) as AuthPayload;
    const user = await UserModel.findById(decoded.userId).select('_id email').lean();
    if (!user) {
      next(new AppError(401, 'User not found', 'UNAUTHORIZED'));
      return;
    }
    req.user = { id: user._id.toString(), email: user.email };
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token', 'UNAUTHORIZED'));
  }
}
