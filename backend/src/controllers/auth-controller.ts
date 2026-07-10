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

    if (!user) {
      return reply.status(401).send({ message: 'Credenciais inválidas.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return reply.status(401).send({ message: 'Credenciais inválidas.' });
    }

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
