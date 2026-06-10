import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../../lib/prisma';
import { sendSuccess, sendPaginated, buildMeta, AppError } from '../../lib/http';
import { parsePagination } from '../../lib/pagination';
import { parseId, parseOptionalInt } from '../../lib/params';

export async function list(req: Request, res: Response): Promise<void> {
  const { page, perPage, skip, take } = parsePagination(req.query);

  const [rows, totalCount] = await Promise.all([
    prisma.people.findMany({ skip, take, orderBy: { lastName: 'asc' } }),
    prisma.people.count(),
  ]);

  sendPaginated(res, rows, buildMeta(page, perPage, totalCount));
}

export async function getById(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const person = await prisma.people.findUnique({
    where: { id },
    include: { member: true, user: { select: { id: true, email: true, role: true } } },
  });
  if (!person) throw new AppError('NOT_FOUND', 'Person not found');
  sendSuccess(res, person);
}

export async function create(req: Request, res: Response): Promise<void> {
  const person = await prisma.people.create({ data: req.body });
  sendSuccess(res, person, 201);
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const person = await prisma.people.update({ where: { id }, data: req.body });
  sendSuccess(res, person);
}

/**
 * Búsqueda por nombre/apellido/email. `q` es requerido; `houseId` filtra a
 * personas que son miembros de esa casa.
 */
export async function search(req: Request, res: Response): Promise<void> {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!q) throw new AppError('BAD_REQUEST', 'Query parameter "q" is required');

  const houseId = parseOptionalInt(req.query.houseId);
  const { page, perPage, skip, take } = parsePagination(req.query);

  const where: Prisma.PeopleWhereInput = {
    OR: [
      { name: { contains: q, mode: 'insensitive' } },
      { lastName: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ],
    ...(houseId !== undefined ? { member: { houseId } } : {}),
  };

  const [rows, totalCount] = await Promise.all([
    prisma.people.findMany({ where, skip, take, orderBy: { lastName: 'asc' } }),
    prisma.people.count({ where }),
  ]);

  sendPaginated(res, rows, buildMeta(page, perPage, totalCount));
}
