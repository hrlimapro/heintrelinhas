// Rotas de autenticação (prefixo /api/auth registrado em app.ts).
// Ambas são públicas: cadastro e login não exigem token.
import { FastifyInstance } from 'fastify';
import { register, login } from '../controllers/auth-controller.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', register);
  app.post('/login', login);
}
