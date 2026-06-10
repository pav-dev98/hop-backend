import prisma from '../lib/prisma';
import { AppError } from '../lib/http';
import { deriveAttendanceType, AttendanceType } from './attendance.service';

/**
 * Dashboard global (solo Admin): totales y conteos por estado/tipo.
 */
export async function dashboard() {
  const [
    totalHouses,
    activeHouses,
    totalMembers,
    activeMembers,
    totalMeetings,
    totalPeople,
    attendances,
  ] = await Promise.all([
    prisma.house.count(),
    prisma.house.count({ where: { active: true } }),
    prisma.member.count(),
    prisma.member.count({ where: { active: true } }),
    prisma.meeting.count(),
    prisma.people.count(),
    prisma.attendance.findMany({
      select: { isGuest: true, isMemberFromOtherHouse: true, present: true },
    }),
  ]);

  return {
    houses: { total: totalHouses, active: activeHouses },
    members: { total: totalMembers, active: activeMembers },
    meetings: { total: totalMeetings },
    people: { total: totalPeople },
    attendances: summarizeAttendances(attendances),
  };
}

/**
 * Reporte por casa: miembros, reuniones y desglose de asistencia.
 */
export async function houseReport(houseId: number) {
  const house = await prisma.house.findUnique({
    where: { id: houseId },
    include: { leader: true },
  });
  if (!house) {
    throw new AppError('NOT_FOUND', 'House not found');
  }

  const [memberCount, activeMemberCount, meetings] = await Promise.all([
    prisma.member.count({ where: { houseId } }),
    prisma.member.count({ where: { houseId, active: true } }),
    prisma.meeting.findMany({
      where: { houseId },
      include: {
        attendances: {
          select: { isGuest: true, isMemberFromOtherHouse: true, present: true },
        },
      },
    }),
  ]);

  const allAttendances = meetings.flatMap((m) => m.attendances);

  return {
    house: {
      id: house.id,
      name: house.name,
      leader: house.leader
        ? { id: house.leader.id, name: house.leader.name, lastName: house.leader.lastName }
        : null,
    },
    members: { total: memberCount, active: activeMemberCount },
    meetings: {
      total: meetings.length,
      byStatus: countBy(meetings, (m) => m.status),
    },
    attendances: summarizeAttendances(allAttendances),
  };
}

/**
 * Tendencia de asistencia por fecha de reunión, opcionalmente filtrada por
 * casa y rango de fechas.
 */
export async function attendanceTrends(filters: {
  houseId?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  const meetings = await prisma.meeting.findMany({
    where: {
      ...(filters.houseId !== undefined ? { houseId: filters.houseId } : {}),
      date: dateRange(filters.startDate, filters.endDate),
    },
    orderBy: { date: 'asc' },
    include: { _count: { select: { attendances: true } } },
  });

  return meetings.map((m) => ({
    meetingId: m.id,
    date: m.date,
    houseId: m.houseId,
    totalAttendance: m._count.attendances,
  }));
}

/**
 * Conversión de visitantes: cuántas personas que asistieron como visitantes
 * externos terminaron convirtiéndose en miembros.
 */
export async function visitorConversion() {
  const externalVisitorPeopleIds = new Set<number>();
  const visitors = await prisma.attendance.findMany({
    where: { isGuest: true, isMemberFromOtherHouse: null },
    select: { peopleId: true },
  });
  for (const v of visitors) externalVisitorPeopleIds.add(v.peopleId);

  const totalVisitors = externalVisitorPeopleIds.size;

  let converted = 0;
  if (totalVisitors > 0) {
    converted = await prisma.member.count({
      where: { personalDataId: { in: [...externalVisitorPeopleIds] } },
    });
  }

  return {
    totalExternalVisitors: totalVisitors,
    convertedToMembers: converted,
    conversionRate: totalVisitors === 0 ? 0 : round(converted / totalVisitors),
  };
}

/**
 * Actividad de miembros: nº de asistencias presentes por persona.
 */
export async function memberActivity(filters: { houseId?: number }) {
  const members = await prisma.member.findMany({
    where: filters.houseId !== undefined ? { houseId: filters.houseId } : {},
    include: { personalData: true },
  });

  const result = await Promise.all(
    members.map(async (member) => {
      const attendanceCount = await prisma.attendance.count({
        where: { peopleId: member.personalDataId, present: true },
      });
      return {
        memberId: member.id,
        personId: member.personalDataId,
        name: member.personalData.name,
        lastName: member.personalData.lastName,
        houseId: member.houseId,
        attendanceCount,
      };
    }),
  );

  return result.sort((a, b) => b.attendanceCount - a.attendanceCount);
}

// ----- helpers -----

function summarizeAttendances(
  records: Array<{ isGuest: boolean; isMemberFromOtherHouse: number | null; present: boolean }>,
) {
  const byType: Record<AttendanceType, number> = {
    regular_member: 0,
    visiting_member: 0,
    external_visitor: 0,
  };
  let present = 0;
  for (const r of records) {
    byType[deriveAttendanceType(r)] += 1;
    if (r.present) present += 1;
  }
  return { total: records.length, present, byType };
}

function dateRange(start?: Date, end?: Date) {
  if (!start && !end) return undefined;
  return {
    ...(start ? { gte: start } : {}),
    ...(end ? { lte: end } : {}),
  };
}

function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const k = key(item);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
}

function round(n: number): number {
  return Math.round(n * 10000) / 10000;
}
