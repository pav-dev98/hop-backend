import { z } from 'zod';

export const createHouseSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  leaderId: z.number().int().positive().optional(),
  meetingDay: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  active: z.boolean().optional(),
});

export const updateHouseSchema = createHouseSchema.partial();

export type CreateHouseInput = z.infer<typeof createHouseSchema>;
export type UpdateHouseInput = z.infer<typeof updateHouseSchema>;
