import { Attendance, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { AppError } from '../lib/http';
import {
  CreateAttendanceInput,
  UpdateAttendanceInput,
} from '../schemas/attendance.schema';

export type AttendanceType = 'regular_member' | 'visiting_member' | 'external_visitor';

export interface AttendanceDTO extends Attendance {
  attendanceType: AttendanceType;
}

/**
 * Deriva el tipo de asistencia a partir de los flags. Es la regla central
 * de los 3 casos descritos en el README:
 *
 *   - regular_member   → isGuest === false
 *   - visiting_member  → isGuest === true  && isMemberFromOtherHouse !== null
 *   - external_visitor → isGuest === true  && isMemberFromOtherHouse === null
 */
export function deriveAttendanceType(record: {
  isGuest: boolean;
  isMemberFromOtherHouse: number | null;
}): AttendanceType {
  if (!record.isGuest) {
    return 'regular_member';
  }
  return record.isMemberFromOtherHouse !== null ? 'visiting_member' : 'external_visitor';
}

/** Adjunta el campo derivado attendanceType a un registro. */
export function withAttendanceType<T extends {
  isGuest: boolean;
  isMemberFromOtherHouse: number | null;
}>(record: T): T & { attendanceType: AttendanceType } {
  return { ...record, attendanceType: deriveAttendanceType(record) };
}

/**
 * Normaliza y valida la coherencia de una asistencia según los 3 casos.
 * Devuelve los datos listos para persistir. Lanza UNPROCESSABLE si la
 * combinación de flags es incoherente.
 */
function normalizeInput(input: CreateAttendanceInput) {
  const isGuest = input.isGuest ?? false;
  const memberId = input.memberId ?? null;
  const isMemberFromOtherHouse = input.isMemberFromOtherHouse ?? null;

  if (!isGuest) {
    // Caso 1: miembro regular en su propia casa.
    if (memberId === null) {
      throw new AppError(
        'UNPROCESSABLE',
        'A regular member attendance (isGuest=false) requires memberId',
      );
    }
    if (isMemberFromOtherHouse !== null) {
      throw new AppError(
        'UNPROCESSABLE',
        'isMemberFromOtherHouse must be null for a regular member',
      );
    }
  } else {
    // Casos 2 y 3: invitado. El memberId local no aplica.
    if (memberId !== null) {
      throw new AppError(
        'UNPROCESSABLE',
        'memberId must be null for a guest (use isMemberFromOtherHouse for visiting members)',
      );
    }
  }

  return {
    meetingId: input.meetingId,
    memberId,
    peopleId: input.peopleId,
    isGuest,
    isMemberFromOtherHouse,
    present: input.present ?? true,
    arrivalTime: input.arrivalTime,
    notes: input.notes,
  } satisfies Prisma.AttendanceUncheckedCreateInput;
}

export interface ListAttendanceFilters {
  meetingId?: number;
  peopleId?: number;
  isGuest?: boolean;
  skip: number;
  take: number;
}

export async function listAttendances(filters: ListAttendanceFilters) {
  const where: Prisma.AttendanceWhereInput = {};
  if (filters.meetingId !== undefined) where.meetingId = filters.meetingId;
  if (filters.peopleId !== undefined) where.peopleId = filters.peopleId;
  if (filters.isGuest !== undefined) where.isGuest = filters.isGuest;

  const [records, totalCount] = await Promise.all([
    prisma.attendance.findMany({
      where,
      skip: filters.skip,
      take: filters.take,
      orderBy: { id: 'desc' },
      include: { people: true },
    }),
    prisma.attendance.count({ where }),
  ]);

  return { records: records.map(withAttendanceType), totalCount };
}

export async function getAttendance(id: number): Promise<AttendanceDTO> {
  const record = await prisma.attendance.findUnique({
    where: { id },
    include: { people: true, meeting: true },
  });
  if (!record) {
    throw new AppError('NOT_FOUND', 'Attendance not found');
  }
  return withAttendanceType(record);
}

export async function createAttendance(
  input: CreateAttendanceInput,
): Promise<AttendanceDTO> {
  const data = normalizeInput(input);
  const record = await prisma.attendance.create({ data, include: { people: true } });
  return withAttendanceType(record);
}

export async function updateAttendance(
  id: number,
  input: UpdateAttendanceInput,
): Promise<AttendanceDTO> {
  const current = await prisma.attendance.findUnique({ where: { id } });
  if (!current) {
    throw new AppError('NOT_FOUND', 'Attendance not found');
  }

  // Revalida la coherencia mezclando estado actual + cambios.
  const merged: CreateAttendanceInput = {
    meetingId: input.meetingId ?? current.meetingId,
    memberId: input.memberId !== undefined ? input.memberId : current.memberId,
    peopleId: input.peopleId ?? current.peopleId,
    isGuest: input.isGuest ?? current.isGuest,
    isMemberFromOtherHouse:
      input.isMemberFromOtherHouse !== undefined
        ? input.isMemberFromOtherHouse
        : current.isMemberFromOtherHouse,
    present: input.present ?? current.present,
    arrivalTime: input.arrivalTime ?? current.arrivalTime ?? undefined,
    notes: input.notes ?? current.notes ?? undefined,
  };

  const data = normalizeInput(merged);
  const record = await prisma.attendance.update({
    where: { id },
    data,
    include: { people: true },
  });
  return withAttendanceType(record);
}

export async function deleteAttendance(id: number): Promise<void> {
  await prisma.attendance.delete({ where: { id } });
}

/**
 * Registra muchas asistencias para una reunión en una sola transacción.
 * Valida la coherencia de cada item antes de persistir; si alguno falla,
 * no se inserta ninguno.
 */
export async function bulkCreate(
  meetingId: number,
  items: Array<Partial<CreateAttendanceInput>>,
): Promise<AttendanceDTO[]> {
  const normalized = items.map((item) =>
    normalizeInput({ ...item, meetingId } as CreateAttendanceInput),
  );

  const created = await prisma.$transaction(
    normalized.map((data) =>
      prisma.attendance.create({ data, include: { people: true } }),
    ),
  );

  return created.map(withAttendanceType);
}
