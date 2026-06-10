import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../../lib/prisma';
import * as attendanceService from '../../services/attendance.service';
import { withAttendanceType } from '../../services/attendance.service';
import { sendSuccess, sendPaginated, buildMeta, AppError } from '../../lib/http';
import { parsePagination } from '../../lib/pagination';
import { parseId, parseOptionalInt } from '../../lib/params';

/**
 * Los "visitantes" son asistencias marcadas como invitado (isGuest = true),
 * abarcando tanto miembros de otra casa (visiting_member) como visitantes
 * externos (external_visitor).
 */
export async function list(req: Request, res: Response): Promise<void> {
  const { page, perPage, skip, take } = parsePagination(req.query);
  const meetingId = parseOptionalInt(req.query.meetingId);

  const where: Prisma.AttendanceWhereInput = {
    isGuest: true,
    ...(meetingId !== undefined ? { meetingId } : {}),
  };

  const [rows, totalCount] = await Promise.all([
    prisma.attendance.findMany({
      where,
      skip,
      take,
      orderBy: { id: 'desc' },
      include: { people: true, meeting: true },
    }),
    prisma.attendance.count({ where }),
  ]);

  sendPaginated(res, rows.map(withAttendanceType), buildMeta(page, perPage, totalCount));
}

export async function getById(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const record = await prisma.attendance.findFirst({
    where: { id, isGuest: true },
    include: { people: true, meeting: true },
  });
  if (!record) throw new AppError('NOT_FOUND', 'Visitor record not found');
  sendSuccess(res, withAttendanceType(record));
}

/**
 * Registra un visitante externo: fuerza isGuest=true y sin casa de origen.
 */
export async function create(req: Request, res: Response): Promise<void> {
  const record = await attendanceService.createAttendance({
    ...req.body,
    memberId: null,
    isGuest: true,
    isMemberFromOtherHouse: null,
  });
  sendSuccess(res, record, 201);
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const record = await attendanceService.updateAttendance(id, req.body);
  sendSuccess(res, record);
}

/**
 * Visitantes recurrentes: personas que asistieron como visitantes externos
 * a 2 o más reuniones distintas.
 */
export async function recurring(req: Request, res: Response): Promise<void> {
  const grouped = await prisma.attendance.groupBy({
    by: ['peopleId'],
    where: { isGuest: true, isMemberFromOtherHouse: null },
    _count: { meetingId: true },
    having: { meetingId: { _count: { gte: 2 } } },
    orderBy: { _count: { meetingId: 'desc' } },
  });

  const peopleIds = grouped.map((g) => g.peopleId);
  const people = await prisma.people.findMany({ where: { id: { in: peopleIds } } });
  const peopleById = new Map(people.map((p) => [p.id, p]));

  const data = grouped.map((g) => ({
    person: peopleById.get(g.peopleId) ?? null,
    visitCount: g._count.meetingId,
  }));

  sendSuccess(res, data);
}
