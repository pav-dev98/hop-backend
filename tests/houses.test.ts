import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/lib/prisma';

/**
 * Tests de integración de Houses. Requieren PostgreSQL de prueba.
 * Verifican autenticación, autorización por rol y CRUD básico.
 */
const adminEmail = `house_admin_${Date.now()}@example.test`;
const leaderEmail = `house_leader_${Date.now()}@example.test`;

let adminToken: string;
let leaderToken: string;
const createdHouseIds: number[] = [];

async function registerAndLogin(email: string, role: 'ADMIN' | 'LEADER') {
  await request(app).post('/api/v1/auth/register').send({
    email,
    password: 'password123',
    name: 'T',
    lastName: 'U',
    role,
  });
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: 'password123' });
  return login.body.data.token as string;
}

describe('Houses endpoints', () => {
  beforeAll(async () => {
    adminToken = await registerAndLogin(adminEmail, 'ADMIN');
    leaderToken = await registerAndLogin(leaderEmail, 'LEADER');
  });

  afterAll(async () => {
    if (createdHouseIds.length > 0) {
      await prisma.house.deleteMany({ where: { id: { in: createdHouseIds } } });
    }
    await prisma.user.deleteMany({ where: { email: { in: [adminEmail, leaderEmail] } } });
    await prisma.people.deleteMany({ where: { email: { in: [adminEmail, leaderEmail] } } });
    await prisma.$disconnect();
  });

  it('GET /api/v1/houses sin token → 401', async () => {
    const res = await request(app).get('/api/v1/houses');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/houses con token devuelve lista paginada', async () => {
    const res = await request(app)
      .get('/api/v1/houses')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('currentPage');
  });

  it('POST /api/v1/houses como ADMIN crea una casa', async () => {
    const res = await request(app)
      .post('/api/v1/houses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Casa Test', address: 'Calle X' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Casa Test');
    createdHouseIds.push(res.body.data.id);
  });

  it('POST /api/v1/houses como LEADER → 403', async () => {
    const res = await request(app)
      .post('/api/v1/houses')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ name: 'No permitida' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('POST /api/v1/houses con body inválido → 400', async () => {
    const res = await request(app)
      .post('/api/v1/houses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ address: 'sin nombre' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
});
