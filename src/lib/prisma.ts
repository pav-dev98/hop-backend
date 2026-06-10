import { PrismaClient } from '@prisma/client';

// Singleton PrismaClient. En desarrollo, evita crear múltiples instancias
// durante el hot-reload de tsx watch reutilizando la del global.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
