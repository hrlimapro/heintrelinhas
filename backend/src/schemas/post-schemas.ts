// Schemas Zod para validação dos bodies das rotas de posts.
// - create: campos obrigatórios; readingTime opcional (calculado no controller se ausente).
// - update: todos os campos opcionais (atualização parcial via PUT).
// - status: usado pelo PATCH /:id/status do fluxo editorial.
import { z } from 'zod';

export const createPostBodySchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  summary: z.string().min(5, 'O resumo deve ter pelo menos 5 caracteres'),
  content: z.string().min(10, 'O conteúdo deve ter pelo menos 10 caracteres'),
  readingTime: z.number().int().min(1, 'Tempo de leitura deve ser de pelo menos 1 minuto').optional(),
  categoryId: z.string().uuid('ID de categoria inválido (deve ser UUID)'),
  tagIds: z.array(z.string().uuid('ID de tag inválido (deve ser UUID)')).optional().default([]),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED']).optional().default('DRAFT'),
});

export const updatePostBodySchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres').optional(),
  summary: z.string().min(5, 'O resumo deve ter pelo menos 5 caracteres').optional(),
  content: z.string().min(10, 'O conteúdo deve ter pelo menos 10 caracteres').optional(),
  readingTime: z.number().int().min(1).optional(),
  categoryId: z.string().uuid('ID de categoria inválido').optional(),
  tagIds: z.array(z.string().uuid('ID de tag inválido')).optional(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED']).optional(),
});

export const updatePostStatusBodySchema = z.object({
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED'], {
    errorMap: () => ({ message: 'Status inválido. Deve ser DRAFT, PENDING_REVIEW, PUBLISHED ou REJECTED.' }),
  }),
});

export type CreatePostBody = z.infer<typeof createPostBodySchema>;
export type UpdatePostBody = z.infer<typeof updatePostBodySchema>;
export type UpdatePostStatusBody = z.infer<typeof updatePostStatusBodySchema>;
