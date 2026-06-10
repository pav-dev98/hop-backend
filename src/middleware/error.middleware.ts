import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError, ErrorCode } from '../lib/http';

interface ErrorBody {
  code: ErrorCode;
  message: string;
  details: unknown;
}

/**
 * Error handler global. Traduce AppError, errores conocidos de Prisma y
 * cualquier excepción inesperada al formato estándar de error de la API.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const { status, body } = normalize(err);

  if (status >= 500) {
    // Log de errores no controlados para diagnóstico.
    console.error(err);
  }

  res.status(status).json({ success: false, error: body });
}

function normalize(err: unknown): { status: number; body: ErrorBody } {
  if (err instanceof AppError) {
    return {
      status: err.status,
      body: { code: err.code, message: err.message, details: err.details },
    };
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return normalizePrisma(err);
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return {
      status: 400,
      body: { code: 'BAD_REQUEST', message: 'Invalid query', details: null },
    };
  }

  return {
    status: 500,
    body: { code: 'INTERNAL_ERROR', message: 'Internal server error', details: null },
  };
}

function normalizePrisma(
  err: Prisma.PrismaClientKnownRequestError,
): { status: number; body: ErrorBody } {
  switch (err.code) {
    case 'P2025': // Record not found
      return {
        status: 404,
        body: { code: 'NOT_FOUND', message: 'Resource not found', details: null },
      };
    case 'P2002': // Unique constraint violation
      return {
        status: 422,
        body: {
          code: 'UNPROCESSABLE',
          message: 'A record with these values already exists',
          details: err.meta ?? null,
        },
      };
    case 'P2003': // Foreign key constraint violation
      return {
        status: 422,
        body: {
          code: 'UNPROCESSABLE',
          message: 'Related record does not exist',
          details: err.meta ?? null,
        },
      };
    default:
      return {
        status: 500,
        body: { code: 'INTERNAL_ERROR', message: 'Database error', details: null },
      };
  }
}
