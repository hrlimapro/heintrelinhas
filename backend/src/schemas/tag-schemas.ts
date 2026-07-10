import { z } from 'zod';

export const createTagBodySchema = z.object({
  name: z.string().min(2, 'O nome da tag deve ter pelo menos 2 caracteres'),
});

export const updateTagBodySchema = z.object({
  name: z.string().min(2, 'O nome da tag deve ter pelo menos 2 caracteres'),
});

export type CreateTagBody = z.infer<typeof createTagBodySchema>;
export type UpdateTagBody = z.infer<typeof updateTagBodySchema>;
