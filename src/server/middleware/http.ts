import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ValidationError } from '../lib/validation';

export function asyncHandler<T extends Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<void | Response>
) {
  return (req: T, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ValidationError) {
    return res.status(err.status).json({ error: err.message, details: err.details ?? null });
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    console.error('Database initialization error:', err);
    return res.status(503).json({
      error: 'Database connection failed. Check DATABASE_URL and database availability.',
      code: 'DB_INIT_FAILED',
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2021') {
      return res.status(503).json({
        error: 'Database schema is not ready. Run Prisma migrations first.',
        code: 'DB_SCHEMA_NOT_READY',
      });
    }
  }

  console.error('Unhandled server error:', err);
  return res.status(500).json({ error: 'Internal server error' });
}
