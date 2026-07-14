// Controller de autenticação: cadastro (register) e login.
// A senha nunca é armazenada em texto puro — apenas o hash bcrypt vai para o banco,
// e o hash nunca é retornado nas respostas da API.
import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { registerBodySchema, loginBodySchema } from '../schemas/auth-schemas.js';

export async function register(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { name, email, password, role } = registerBodySchema.parse(request.body);

    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return reply.status(409).send({ message: 'E-mail já cadastrado.' });
    }

    // Fator de custo 8 do bcrypt: equilíbrio entre segurança e velocidade para o projeto.
    const passwordHash = await bcrypt.hash(password, 8);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
      },
    });

    return reply.status(201).send({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return reply.status(400).send({ message: 'Erro de validação.', errors: error.format() });
    }
    return reply.status(500).send({ message: 'Erro interno do servidor.' });
  }
}

export async function login(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { email, password } = loginBodySchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Mensagem genérica proposital ("Credenciais inválidas") tanto para e-mail
    // inexistente quanto para senha errada — evita enumeração de e-mails cadastrados.
    if (!user) {
      return reply.status(401).send({ message: 'Credenciais inválidas.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return reply.status(401).send({ message: 'Credenciais inválidas.' });
    }

    // Gera o JWT: o payload carrega o papel (role) para o RBAC e o claim padrão
    // "sub" carrega o id do usuário. Validade de 7 dias; não há refresh token.
    const token = await reply.jwtSign(
      { role: user.role },
      { sign: { sub: user.id, expiresIn: '7d' } }
    );

    return reply.status(200).send({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return reply.status(400).send({ message: 'Erro de validação.', errors: error.format() });
    }
    return reply.status(500).send({ message: 'Erro interno do servidor.' });
  }
}
