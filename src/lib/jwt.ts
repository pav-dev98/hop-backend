import jwt, { SignOptions } from 'jsonwebtoken';

export interface JwtPayload {
  userId: number;
  email: string;
  role: 'ADMIN' | 'LEADER';
}

const SECRET = process.env.JWT_SECRET_KEY ?? 'insecure-dev-secret-change-me';
const EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? '24h') as SignOptions['expiresIn'];

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}
