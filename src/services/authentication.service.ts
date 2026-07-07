import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
import { signToken, generateRefreshToken, hashRefreshToken } from '../lib/jwt';
import { AppError } from '../lib/http';
import { LoginInput, RegisterInput } from '../schemas/auth.schema';

const SALT_ROUNDS = 10;

interface AuthResult {
  token: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    role: 'ADMIN' | 'LEADER';
    personalData: {
      id: number;
      name: string;
      lastName: string;
    };
  };
}

type UserWithPersonalData = {
  id: number;
  email: string;
  role: 'ADMIN' | 'LEADER';
  personalData: { id: number; name: string; lastName: string };
};

/**
 * Registra una persona + usuario en una sola transacción y devuelve un JWT.
 */
export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError('UNPROCESSABLE', 'Email is already registered');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      role: input.role ?? 'LEADER',
      personalData: {
        create: {
          name: input.name,
          lastName: input.lastName,
          phoneNumber: input.phoneNumber,
          email: input.email,
          birthDate: input.birthDate,
          address: input.address,
        },
      },
    },
    include: { personalData: true },
  });

  return issueTokens(user);
}

/**
 * Valida credenciales y devuelve un JWT. Falla con UNAUTHORIZED tanto si el
 * email no existe como si la contraseña es incorrecta (no se filtra cuál).
 */
export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { personalData: true },
  });

  if (!user) {
    throw new AppError('UNAUTHORIZED', 'Invalid email or password');
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError('UNAUTHORIZED', 'Invalid email or password');
  }

  return issueTokens(user);
}

/**
 * Canjea un refresh token válido por un par nuevo (rotación): el token usado
 * queda revocado y apunta al que lo reemplaza. Si llega un token ya revocado
 * se asume robo y se revocan todos los tokens activos del usuario.
 */
export async function refresh(refreshToken: string): Promise<AuthResult> {
  const tokenHash = hashRefreshToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: { include: { personalData: true } } },
  });

  if (!stored) {
    throw new AppError('UNAUTHORIZED', 'Invalid refresh token');
  }

  if (stored.revokedAt) {
    // Reuso de un token ya rotado: se revoca toda la familia por seguridad.
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new AppError('UNAUTHORIZED', 'Refresh token has been revoked');
  }

  if (stored.expiresAt < new Date()) {
    throw new AppError('UNAUTHORIZED', 'Refresh token has expired');
  }

  const next = generateRefreshToken();
  await prisma.$transaction(async (tx) => {
    const created = await tx.refreshToken.create({
      data: {
        tokenHash: next.tokenHash,
        userId: stored.userId,
        expiresAt: next.expiresAt,
      },
    });
    await tx.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date(), replacedById: created.id },
    });
  });

  return toAuthResult(stored.user, next.token);
}

/**
 * Revoca el refresh token recibido. Idempotente: un token inexistente o ya
 * revocado no es error, el resultado final es el mismo (sesión cerrada).
 */
export async function logout(refreshToken?: string): Promise<void> {
  if (!refreshToken) return;

  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashRefreshToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Devuelve el usuario actual con sus datos personales.
 */
export async function getCurrentUser(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { personalData: true },
  });

  if (!user) {
    throw new AppError('NOT_FOUND', 'User not found');
  }

  const { passwordHash: _omit, ...safe } = user;
  return safe;
}

/**
 * Genera el par access + refresh y persiste el refresh token (hasheado).
 */
async function issueTokens(user: UserWithPersonalData): Promise<AuthResult> {
  const refreshTokenData = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      tokenHash: refreshTokenData.tokenHash,
      userId: user.id,
      expiresAt: refreshTokenData.expiresAt,
    },
  });
  return toAuthResult(user, refreshTokenData.token);
}

function toAuthResult(user: UserWithPersonalData, refreshToken: string): AuthResult {
  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      personalData: {
        id: user.personalData.id,
        name: user.personalData.name,
        lastName: user.personalData.lastName,
      },
    },
  };
}