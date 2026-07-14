// Schemas Zod das rotas de categorias. Apenas o nome é recebido do cliente;
// o slug é sempre gerado no servidor (controller) para garantir unicidade.
import { z } from 'zod';

export const createCategoryBodySchema = z.object({
  name: z.string().min(2, 'O nome da categoria deve ter pelo menos 2 caracteres'),
});

export const updateCategoryBodySchema = z.object({
  name: z.string().min(2, 'O nome da categoria deve ter pelo menos 2 caracteres'),
});

export type CreateCategoryBody = z.infer<typeof createCategoryBodySchema>;
export type UpdateCategoryBody = z.infer<typeof updateCategoryBodySchema>;
