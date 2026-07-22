// Schemas Zod para validação dos bodies das rotas de autenticação.
// As mensagens de erro são em português e retornadas ao cliente em falhas 400.
import { z } from 'zod';

// Cadastro público: todo novo usuário nasce WRITER (o campo role não é aceito
// no body). Contas EDITOR/ADMIN vêm do seed ou de promoção direta no banco.
export const registerBodySchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

export const loginBodySchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
