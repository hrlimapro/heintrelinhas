// Schemas Zod para validação dos bodies das rotas de autenticação.
// As mensagens de erro são em português e retornadas ao cliente em falhas 400.
import { z } from 'zod';

// Cadastro: o papel (role) é opcional e assume WRITER por padrão.
// Atenção: aceitar role no cadastro é adequado apenas para demonstração.
export const registerBodySchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['WRITER', 'EDITOR', 'ADMIN']).default('WRITER'),
});

export const loginBodySchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
