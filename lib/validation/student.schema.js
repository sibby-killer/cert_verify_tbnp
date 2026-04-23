import { z } from 'zod';

export const CreateStudentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120).trim(),
  regNumber: z.string().min(2).max(50).trim(),
  email: z.string().email('Invalid email').max(120).optional().or(z.literal('')),
});

export const UpdateStudentSchema = z.object({
  name: z.string().min(2).max(120).trim().optional(),
  regNumber: z.string().min(2).max(50).trim().optional(),
  email: z.string().email().max(120).optional().or(z.literal('')),
});
