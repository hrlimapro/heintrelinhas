// Middleware de autenticação: exige um JWT válido no header "Authorization: Bearer <token>".
// Usado como hook onRequest nas rotas protegidas. Em caso de sucesso, o @fastify/jwt
// popula request.user com o payload do token ({ sub: id do usuário, role }).
import { FastifyRequest, FastifyReply } from 'fastify';

export async function verifyJWT(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ message: 'Não autorizado.' });
  }
}
