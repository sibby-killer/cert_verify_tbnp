import { z } from 'zod';

const ROLES = ['data_entry', 'admin', 'superadmin'];

export const CreateUserSchema = z.object({
  username: z.string().min(2).max(64).trim(),
  password: z.string().min(8).max(256),
  email: z.string().email().max(120).optional().or(z.literal('')),
  role: z.enum(ROLES, { errorMap: () => ({ message: `Role must be one of: ${ROLES.join(', ')}` }) }),
});

export const UpdateUserSchema = z.object({
  email: z.string().email().max(120).optional().or(z.literal('')),
  role: z.enum(ROLES).optional(),
  isActive: z.boolean().optional(),
});
