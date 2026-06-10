import { z } from 'zod';

/**
 * Base de una asistencia. La coherencia entre isGuest / memberId /
 * isMemberFromOtherHouse (los 3 casos) se valida en attendance.service.ts.
 */
export const createAttendanceSchema = z.object({
  meetingId: z.number().int().positive(),
  memberId: z.number().int().positive().nullable().optional(),
  peopleId: z.number().int().positive(),
  isGuest: z.boolean().optional(),
  isMemberFromOtherHouse: z.number().int().positive().nullable().optional(),
  present: z.boolean().optional(),
  arrivalTime: z.string().optional(),
  notes: z.string().optional(),
});

export const updateAttendanceSchema = createAttendanceSchema.partial();

/**
 * Carga masiva: una reunión y muchas asistencias. Cada item puede omitir
 * meetingId (se toma del nivel superior) o repetirlo.
 */
export const bulkAttendanceSchema = z.object({
  meetingId: z.number().int().positive(),
  attendances: z
    .array(createAttendanceSchema.partial({ meetingId: true }))
    .min(1),
});

export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>;
