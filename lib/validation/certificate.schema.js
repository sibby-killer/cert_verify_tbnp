import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const IssueCertificateSchema = z.object({
  studentId: z.string().uuid('Invalid studentId'),
  courseId: z.string().uuid('Invalid courseId'),
  graduationYear: z
    .number()
    .int()
    .min(2000, 'Year must be 2000 or later')
    .max(currentYear + 2, `Year cannot exceed ${currentYear + 2}`),
});

export const RevokeCertificateSchema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(500).trim(),
});
