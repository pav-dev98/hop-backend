import { z } from 'zod';

export const createPeopleSchema = z.object({
  name: z.string().min(1),
  lastName: z.string().min(1),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  birthDate: z.coerce.date().optional(),
  address: z.string().optional(),
});

export const updatePeopleSchema = createPeopleSchema.partial();

export type CreatePeopleInput = z.infer<typeof createPeopleSchema>;
export type UpdatePeopleInput = z.infer<typeof updatePeopleSchema>;
