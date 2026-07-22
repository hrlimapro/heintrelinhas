// Rotas de autenticação (prefixo /api/auth registrado em app.ts).
// Todas são públicas: refresh e logout se autenticam pelo cookie httpOnly
// de refresh token, não pelo Bearer token.
import { FastifyInstance } from 'fastify';
import { register, login, refresh, logout } from '../controllers/auth-controller.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', register);
  app.post('/login', login);
  app.post('/refresh', refresh);
  app.post('/logout', logout);
}
