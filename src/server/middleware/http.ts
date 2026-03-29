import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ValidationError } from '../lib/validation.js';
import { AiQuotaError } from '../../services/ai.service.js';

interface ProviderError {
  status?: number;
  error?: {
    status?: string;
    message?: string;
  };
}

function isProviderQuotaError(err: unknown): err is ProviderError {
  if (!err || typeof err !== 'object') return false;
  const providerError = err as ProviderError;
  const statusText = (providerError.error?.status ?? '').toLowerCase();
  return providerError.status === 429 || statusText.includes('resource_exhausted');
}

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

  if (err instanceof AiQuotaError) {
    return res.status(429).json({
      error: err.message,
      code: err.code,
      retryAfterSeconds: err.retryAfterSeconds,
      details: err.details,
    });
  }

  if (isProviderQuotaError(err)) {
    const providerMessage = err.error?.message || 'Kuota AI habis. Coba lagi beberapa saat lagi.';
    return res.status(429).json({
      error: providerMessage,
      code: 'AI_QUOTA_EXCEEDED',
      retryAfterSeconds: null,
      details: null,
    });
  }

  console.error('Unhandled server error:', err);
  return res.status(500).json({ error: 'Internal server error' });
}
