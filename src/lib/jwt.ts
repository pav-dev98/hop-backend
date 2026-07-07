import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';

export interface JwtPayload {
  userId: number;
  email: string;
  role: 'ADMIN' | 'LEADER';
}

const SECRET = process.env.JWT_SECRET_KEY ?? 'insecure-dev-secret-change-me';
const EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? '15m') as SignOptions['expiresIn'];
const REFRESH_EXPIRES_IN_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS ?? 30);

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}

export interface GeneratedRefreshToken {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

/**
 * Genera un refresh token opaco (no JWT): su validez vive en la tabla
 * refresh_tokens. Solo se persiste el hash; el token en claro se entrega una
 * única vez al cliente.
 */
export function generateRefreshToken(): GeneratedRefreshToken {
  const token = crypto.randomBytes(64).toString('base64url');
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);
  return { token, tokenHash: hashRefreshToken(token), expiresAt };
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
