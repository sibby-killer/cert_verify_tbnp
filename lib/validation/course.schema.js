import { z } from 'zod';

export const CreateCourseSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  deptCode: z.string().min(1).max(20).trim().toUpperCase(),
});

export const UpdateCourseSchema = z.object({
  name: z.string().min(2).max(200).trim().optional(),
  deptCode: z.string().min(1).max(20).trim().toUpperCase().optional(),
});
