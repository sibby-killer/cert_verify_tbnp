import { z } from 'zod';

export const ForgeryReportSchema = z.object({
  securityNumber: z.string().min(5).max(100).trim(),
  details: z.string().min(10, 'Please provide at least 10 characters of detail').max(2000).trim(),
});

export const UpdateReportSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'dismissed'], {
    errorMap: () => ({ message: 'Status must be pending, reviewed, or dismissed' }),
  }),
});

export const InstitutionSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  address: z.string().max(500).trim().optional().or(z.literal('')),
  phone: z.string().max(30).trim().optional().or(z.literal('')),
  email: z.string().email().max(120).optional().or(z.literal('')),
});
