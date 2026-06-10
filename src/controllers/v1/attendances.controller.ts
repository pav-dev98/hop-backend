import { Request, Response } from 'express';
import * as service from '../../services/attendance.service';
import { sendSuccess, sendPaginated, buildMeta } from '../../lib/http';
import { parsePagination } from '../../lib/pagination';
import { parseId, parseOptionalInt } from '../../lib/params';

export async function list(req: Request, res: Response): Promise<void> {
  const { page, perPage, skip, take } = parsePagination(req.query);
  const isGuestQuery = req.query.isGuest;

  const { records, totalCount } = await service.listAttendances({
    meetingId: parseOptionalInt(req.query.meetingId),
    peopleId: parseOptionalInt(req.query.peopleId),
    isGuest: isGuestQuery === undefined ? undefined : isGuestQuery === 'true',
    skip,
    take,
  });

  sendPaginated(res, records, buildMeta(page, perPage, totalCount));
}

export async function getById(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const record = await service.getAttendance(id);
  sendSuccess(res, record);
}

export async function create(req: Request, res: Response): Promise<void> {
  const record = await service.createAttendance(req.body);
  sendSuccess(res, record, 201);
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const record = await service.updateAttendance(id, req.body);
  sendSuccess(res, record);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  await service.deleteAttendance(id);
  sendSuccess(res, { id });
}

export async function bulk(req: Request, res: Response): Promise<void> {
  const { meetingId, attendances } = req.body;
  const records = await service.bulkCreate(meetingId, attendances);
  sendSuccess(res, records, 201);
}
