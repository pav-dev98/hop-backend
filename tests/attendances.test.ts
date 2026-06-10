import { describe, it, expect } from 'vitest';
import {
  deriveAttendanceType,
  withAttendanceType,
} from '../src/services/attendance.service';

describe('deriveAttendanceType — los 3 casos', () => {
  it('Caso 1: miembro regular (isGuest=false) → regular_member', () => {
    expect(
      deriveAttendanceType({ isGuest: false, isMemberFromOtherHouse: null }),
    ).toBe('regular_member');
  });

  it('Caso 1: isGuest=false aunque haya valor en isMemberFromOtherHouse → regular_member', () => {
    expect(
      deriveAttendanceType({ isGuest: false, isMemberFromOtherHouse: 5 }),
    ).toBe('regular_member');
  });

  it('Caso 2: invitado con casa de origen → visiting_member', () => {
    expect(
      deriveAttendanceType({ isGuest: true, isMemberFromOtherHouse: 5 }),
    ).toBe('visiting_member');
  });

  it('Caso 3: invitado sin casa de origen → external_visitor', () => {
    expect(
      deriveAttendanceType({ isGuest: true, isMemberFromOtherHouse: null }),
    ).toBe('external_visitor');
  });
});

describe('withAttendanceType', () => {
  it('adjunta el campo attendanceType sin mutar el resto', () => {
    const record = {
      id: 1,
      meetingId: 1,
      peopleId: 10,
      isGuest: true,
      isMemberFromOtherHouse: null,
      present: true,
    };
    const result = withAttendanceType(record);
    expect(result.attendanceType).toBe('external_visitor');
    expect(result.id).toBe(1);
    expect(result.peopleId).toBe(10);
  });
});
