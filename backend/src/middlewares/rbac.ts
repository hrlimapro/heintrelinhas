// Middleware de autorização por papel (RBAC — Role-Based Access Control).
// Complementa o verifyJWT: assume que o token já foi verificado e checa se o
// papel do usuário está na lista de papéis permitidos para a rota.
import { FastifyRequest, FastifyReply } from 'fastify';

// Declaration merging: estende a tipagem do @fastify/jwt para que request.user
// tenha o formato do payload usado neste projeto ({ sub, role }) em todo o código.
declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      sub: string;
      role: 'WRITER' | 'EDITOR' | 'ADMIN';
    };
  }
}

// Fábrica de middleware: recebe os papéis permitidos e devolve o hook onRequest.
// 401 se não autenticado; 403 se autenticado mas sem o papel necessário.
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
