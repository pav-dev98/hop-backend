import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  lastName: z.string().min(1),
  phoneNumber: z.string().optional(),
  birthDate: z.coerce.date().optional(),
  address: z.string().optional(),
  role: z.enum(['ADMIN', 'LEADER']).optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// El refresh token es opcional en logout para no romper clientes viejos que
// no envían body; sin token la revocación simplemente no aplica.
export const logoutSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
