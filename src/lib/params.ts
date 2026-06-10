import { AppError } from './http';

/** Parsea un id numérico de los route params; lanza BAD_REQUEST si no es válido. */
export function parseId(value: string | string[] | undefined, field = 'id'): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    throw new AppError('BAD_REQUEST', `Invalid ${field}: must be a positive integer`);
  }
  return n;
}

/** Parsea un entero opcional de la query string. */
export function parseOptionalInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isInteger(n) ? n : undefined;
}

/** Parsea una fecha opcional de la query string. */
export function parseOptionalDate(value: unknown): Date | undefined {
  if (typeof value !== 'string' || value === '') return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
