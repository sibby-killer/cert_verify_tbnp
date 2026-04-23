import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string().min(2).max(64).trim(),
  password: z.string().min(6).max(256),
});

export const SetupSchema = z.object({
  username: z.string().min(2).max(64).trim(),
  password: z.string().min(8).max(256),
  email: z.string().email().optional().or(z.literal('')),
});
