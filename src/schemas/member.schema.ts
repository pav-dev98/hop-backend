import { z } from 'zod';

export const createMemberSchema = z.object({
  personalDataId: z.number().int().positive(),
  houseId: z.number().int().positive(),
  memberType: z.enum(['LEADER', 'MEMBER']).optional(),
  active: z.boolean().optional(),
  joinDate: z.coerce.date().optional(),
});

export const updateMemberSchema = createMemberSchema.partial();

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
