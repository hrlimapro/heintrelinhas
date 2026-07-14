// Instância única (singleton) do PrismaClient compartilhada por toda a aplicação.
// Evita abrir múltiplos pools de conexão com o PostgreSQL.
import { PrismaClient } from '@prisma/client';

// Em desenvolvimento loga também as queries SQL; em produção, apenas erros.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
