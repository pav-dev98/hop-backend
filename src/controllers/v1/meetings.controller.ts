import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../../lib/prisma';
import { sendSuccess, sendPaginated, buildMeta, AppError } from '../../lib/http';
import { parsePagination } from '../../lib/pagination';
import { parseId, parseOptionalInt, parseOptionalDate } from '../../lib/params';
import { withAttendanceType } from '../../services/attendance.service';

export async function list(req: Request, res: Response): Promise<void> {
  const { page, perPage, skip, take } = parsePagination(req.query);
  const houseId = parseOptionalInt(req.query.houseId);
  const startDate = parseOptionalDate(req.query.startDate);
  const endDate = parseOptionalDate(req.query.endDate);

  const where: Prisma.MeetingWhereInput = {
    ...(houseId !== undefined ? { houseId } : {}),
  };
  if (startDate || endDate) {
    where.date = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {}),
    };
  }

  const [rows, totalCount] = await Promise.all([
    prisma.meeting.findMany({ where, skip, take, orderBy: { date: 'desc' }, include: { house: true } }),
    prisma.meeting.count({ where }),
  ]);

  sendPaginated(res, rows, buildMeta(page, perPage, totalCount));
}

export async function getById(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: { house: true },
  });
  if (!meeting) throw new AppError('NOT_FOUND', 'Meeting not found');
  sendSuccess(res, meeting);
}

export async function create(req: Request, res: Response): Promise<void> {
  const meeting = await prisma.meeting.create({ data: req.body });
  sendSuccess(res, meeting, 201);
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const meeting = await prisma.meeting.update({ where: { id }, data: req.body });
  sendSuccess(res, meeting);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  await prisma.meeting.delete({ where: { id } });
  sendSuccess(res, { id });
}

export async function attendances(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const { page, perPage, skip, take } = parsePagination(req.query);

  const where = { meetingId: id };
  const [rows, totalCount] = await Promise.all([
    prisma.attendance.findMany({ where, skip, take, include: { people: true } }),
    prisma.attendance.count({ where }),
  ]);

  sendPaginated(res, rows.map(withAttendanceType), buildMeta(page, perPage, totalCount));
}
