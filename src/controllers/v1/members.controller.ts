import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { sendSuccess, sendPaginated, buildMeta, AppError } from '../../lib/http';
import { parsePagination } from '../../lib/pagination';
import { parseId, parseOptionalInt } from '../../lib/params';

export async function list(req: Request, res: Response): Promise<void> {
  const { page, perPage, skip, take } = parsePagination(req.query);
  const houseId = parseOptionalInt(req.query.houseId);
  const active = req.query.active;

  const where = {
    ...(houseId !== undefined ? { houseId } : {}),
    ...(active !== undefined ? { active: active === 'true' } : {}),
  };

  const [rows, totalCount] = await Promise.all([
    prisma.member.findMany({
      where,
      skip,
      take,
      orderBy: { id: 'asc' },
      include: { personalData: true, house: true },
    }),
    prisma.member.count({ where }),
  ]);

  sendPaginated(res, rows, buildMeta(page, perPage, totalCount));
}

export async function getById(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const member = await prisma.member.findUnique({
    where: { id },
    include: { personalData: true, house: true },
  });
  if (!member) throw new AppError('NOT_FOUND', 'Member not found');
  sendSuccess(res, member);
}

export async function create(req: Request, res: Response): Promise<void> {
  const member = await prisma.member.create({
    data: req.body,
    include: { personalData: true, house: true },
  });
  sendSuccess(res, member, 201);
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const member = await prisma.member.update({
    where: { id },
    data: req.body,
    include: { personalData: true, house: true },
  });
  sendSuccess(res, member);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  await prisma.member.delete({ where: { id } });
  sendSuccess(res, { id });
}
