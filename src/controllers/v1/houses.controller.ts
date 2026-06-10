import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { sendSuccess, sendPaginated, buildMeta, AppError } from '../../lib/http';
import { parsePagination } from '../../lib/pagination';
import { parseId } from '../../lib/params';

export async function list(req: Request, res: Response): Promise<void> {
  const { page, perPage, skip, take } = parsePagination(req.query);
  const active = req.query.active;

  const where = active === undefined ? {} : { active: active === 'true' };

  const [houses, totalCount] = await Promise.all([
    prisma.house.findMany({ where, skip, take, orderBy: { id: 'asc' }, include: { leader: true } }),
    prisma.house.count({ where }),
  ]);

  sendPaginated(res, houses, buildMeta(page, perPage, totalCount));
}

export async function getById(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const house = await prisma.house.findUnique({
    where: { id },
    include: { leader: true },
  });
  if (!house) throw new AppError('NOT_FOUND', 'House not found');
  sendSuccess(res, house);
}

export async function create(req: Request, res: Response): Promise<void> {
  const house = await prisma.house.create({ data: req.body });
  sendSuccess(res, house, 201);
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  await assertCanManageHouse(req, id);
  const house = await prisma.house.update({ where: { id }, data: req.body });
  sendSuccess(res, house);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  await prisma.house.delete({ where: { id } });
  sendSuccess(res, { id });
}

export async function members(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const { page, perPage, skip, take } = parsePagination(req.query);

  const where = { houseId: id };
  const [rows, totalCount] = await Promise.all([
    prisma.member.findMany({ where, skip, take, include: { personalData: true } }),
    prisma.member.count({ where }),
  ]);

  sendPaginated(res, rows, buildMeta(page, perPage, totalCount));
}

export async function meetings(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const { page, perPage, skip, take } = parsePagination(req.query);

  const where = { houseId: id };
  const [rows, totalCount] = await Promise.all([
    prisma.meeting.findMany({ where, skip, take, orderBy: { date: 'desc' } }),
    prisma.meeting.count({ where }),
  ]);

  sendPaginated(res, rows, buildMeta(page, perPage, totalCount));
}

export async function statistics(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const house = await prisma.house.findUnique({ where: { id } });
  if (!house) throw new AppError('NOT_FOUND', 'House not found');

  const [memberCount, activeMembers, meetingCount, attendanceCount] = await Promise.all([
    prisma.member.count({ where: { houseId: id } }),
    prisma.member.count({ where: { houseId: id, active: true } }),
    prisma.meeting.count({ where: { houseId: id } }),
    prisma.attendance.count({ where: { meeting: { houseId: id } } }),
  ]);

  sendSuccess(res, {
    houseId: id,
    members: { total: memberCount, active: activeMembers },
    meetings: { total: meetingCount },
    attendances: { total: attendanceCount },
  });
}

/**
 * Un ADMIN puede gestionar cualquier casa; un LEADER solo la suya
 * (la casa cuyo leaderId apunta a su People).
 */
async function assertCanManageHouse(req: Request, houseId: number): Promise<void> {
  const user = req.currentUser!;
  if (user.role === 'ADMIN') return;

  const [house, dbUser] = await Promise.all([
    prisma.house.findUnique({ where: { id: houseId }, select: { leaderId: true } }),
    prisma.user.findUnique({ where: { id: user.id }, select: { personalDataId: true } }),
  ]);

  if (!house) throw new AppError('NOT_FOUND', 'House not found');
  if (!dbUser || house.leaderId !== dbUser.personalDataId) {
    throw new AppError('FORBIDDEN', 'Leaders can only manage their own house');
  }
}
