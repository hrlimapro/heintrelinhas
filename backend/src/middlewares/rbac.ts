import { FastifyRequest, FastifyReply } from 'fastify';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      sub: string;
      role: 'WRITER' | 'EDITOR' | 'ADMIN';
    };
  }
}

export function verifyUserRole(allowedRoles: ('WRITER' | 'EDITOR' | 'ADMIN')[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ message: 'Não autorizado.' });
    }

    const { role } = request.user;

    if (!allowedRoles.includes(role)) {
      return reply.status(403).send({ message: 'Acesso proibido.' });
    }
  };
}
