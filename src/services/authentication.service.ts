import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
import { signToken, JwtPayload } from '../lib/jwt';
import { AppError } from '../lib/http';
import { LoginInput, RegisterInput } from '../schemas/auth.schema';

const SALT_ROUNDS = 10;

interface AuthResult {
  token: string;
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

  return toAuthResult(user);
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

  return toAuthResult(user);
}

/**
 * Emite un token nuevo para un usuario ya autenticado (refresh).
 */
export async function refresh(payload: JwtPayload): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { personalData: true },
  });

  if (!user) {
    throw new AppError('UNAUTHORIZED', 'User no longer exists');
  }

  return toAuthResult(user);
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

function toAuthResult(user: {
  id: number;
  email: string;
  role: 'ADMIN' | 'LEADER';
  personalData: { id: number; name: string; lastName: string };
}): AuthResult {
  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  return {
    token,
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
