// Montagem da aplicação Fastify: plugins (CORS, JWT), registro das rotas por
// recurso (com prefixo /api/*) e tratador global de erros. O servidor em si é
// iniciado em server.ts, o que permite importar `app` em testes sem abrir porta.
import fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { authRoutes } from './routes/auth-routes.js';
import { categoryRoutes } from './routes/category-routes.js';
import { tagRoutes } from './routes/tag-routes.js';
import { postRoutes } from './routes/post-routes.js';

export const app = fastify({
  logger: process.env.NODE_ENV !== 'production',
});

// Configure CORS
app.register(cors, {
  origin: true, // In production, replace with specific frontend URL
});

// Configure JWT
// Falha rápido na inicialização se o segredo do JWT não estiver definido —
// melhor que descobrir em runtime ao assinar/verificar tokens.
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in environmental variables.');
}

app.register(jwt, {
  secret: process.env.JWT_SECRET,
});

// Register routes
app.register(authRoutes, { prefix: '/api/auth' });
app.register(categoryRoutes, { prefix: '/api/categories' });
app.register(tagRoutes, { prefix: '/api/tags' });
app.register(postRoutes, { prefix: '/api/posts' });

// Global error handler
// Erros com statusCode (ex.: lançados pelo Fastify/plugins) mantêm o status original;
// qualquer outro erro inesperado vira 500 genérico (sem vazar detalhes internos).
app.setErrorHandler((error, _, reply) => {
  if (error.statusCode) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  app.log.error(error);
  return reply.status(500).send({ message: 'Erro interno do servidor.' });
});
