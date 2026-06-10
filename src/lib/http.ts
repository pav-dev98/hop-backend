import { Response } from 'express';

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'UNPROCESSABLE'
  | 'INTERNAL_ERROR';

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE: 422,
  INTERNAL_ERROR: 500,
};

/**
 * Error de aplicación con código semántico. El error handler global lo
 * traduce al formato { success: false, error: {...} } con su HTTP status.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: unknown;

  constructor(code: ErrorCode, message: string, details: unknown = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }
}

export interface PaginationMeta {
  currentPage: number;
  perPage: number;
  totalPages: number;
  totalCount: number;
}

export function sendSuccess(res: Response, data: unknown, status = 200): Response {
  return res.status(status).json({ success: true, data });
}

export function sendPaginated(
  res: Response,
  data: unknown[],
  meta: PaginationMeta,
  status = 200,
): Response {
  return res.status(status).json({ success: true, data, meta });
}

export function buildMeta(
  page: number,
  perPage: number,
  totalCount: number,
): PaginationMeta {
  return {
    currentPage: page,
    perPage,
    totalPages: Math.max(1, Math.ceil(totalCount / perPage)),
    totalCount,
  };
}
