import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof AppError ? err.message : 'Internal server error';
  const code = err instanceof AppError ? err.code : undefined;
  res.status(status).json({ error: message, ...(code && { code }) });
}
