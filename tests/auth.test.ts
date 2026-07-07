import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/lib/prisma';

/**
 * Tests de integración de Auth. Requieren una base de datos PostgreSQL de
 * prueba accesible vía DATABASE_URL (idealmente peace_houses_test).
 */
const unique = `auth_${Date.now()}@example.test`;

describe('Auth endpoints', () => {
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: unique } });
    await prisma.people.deleteMany({ where: { email: unique } });
    await prisma.$disconnect();
  });

  it('POST /api/v1/auth/register crea un usuario y devuelve token + refreshToken', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: unique,
      password: 'password123',
      name: 'Test',
      lastName: 'User',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTypeOf('string');
    expect(res.body.data.refreshToken).toBeTypeOf('string');
    expect(res.body.data.user.email).toBe(unique);
  });

  it('POST /api/v1/auth/login con credenciales válidas devuelve token + refreshToken', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: unique, password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTypeOf('string');
    expect(res.body.data.refreshToken).toBeTypeOf('string');
  });

  it('POST /api/v1/auth/login con contraseña incorrecta → 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: unique, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/v1/auth/me sin token → 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/auth/me con token válido devuelve el usuario', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: unique, password: 'password123' });
    const token = login.body.data.token;

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(unique);
  });

  describe('refresh tokens', () => {
    async function loginTokens() {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: unique, password: 'password123' });
      return res.body.data as { token: string; refreshToken: string };
    }

    it('POST /api/v1/auth/refresh con token válido rota y devuelve un par nuevo', async () => {
      const { refreshToken } = await loginTokens();

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeTypeOf('string');
      expect(res.body.data.refreshToken).toBeTypeOf('string');
      expect(res.body.data.refreshToken).not.toBe(refreshToken);
      expect(res.body.data.user.email).toBe(unique);
    });

    it('POST /api/v1/auth/refresh no requiere access token (header vacío)', async () => {
      const { refreshToken } = await loginTokens();

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
    });

    it('reusar un refresh token ya rotado → 401 y revoca la familia', async () => {
      const { refreshToken } = await loginTokens();

      const first = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });
      expect(first.status).toBe(200);
      const rotated = first.body.data.refreshToken;

      // Reuso del token viejo: debe fallar…
      const reuse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });
      expect(reuse.status).toBe(401);

      // …y revocar también el token que lo reemplazó (familia comprometida).
      const afterReuse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: rotated });
      expect(afterReuse.status).toBe(401);
    });

    it('POST /api/v1/auth/refresh con token inexistente → 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'not-a-real-token' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('POST /api/v1/auth/refresh sin refreshToken → 400', async () => {
      const res = await request(app).post('/api/v1/auth/refresh').send({});
      expect(res.status).toBe(400);
    });

    it('POST /api/v1/auth/logout revoca el refresh token', async () => {
      const { refreshToken } = await loginTokens();

      const logout = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken });
      expect(logout.status).toBe(200);

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });
      expect(res.status).toBe(401);
    });

    it('POST /api/v1/auth/logout sin body sigue respondiendo 200', async () => {
      const res = await request(app).post('/api/v1/auth/logout').send({});
      expect(res.status).toBe(200);
    });
  });
});
