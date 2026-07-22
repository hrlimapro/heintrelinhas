// Controller de autenticação: cadastro (register), login, refresh e logout.
// A senha nunca é armazenada em texto puro — apenas o hash bcrypt vai para o banco,
// e o hash nunca é retornado nas respostas da API.
//
// Modelo de sessão: access token JWT curto (15 min) no corpo da resposta +
// refresh token opaco (7 dias) em cookie httpOnly restrito a /api/auth.
// O refresh token é rotacionado a cada uso e só o hash SHA-256 vai para o banco.
import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { registerBodySchema, loginBodySchema } from '../schemas/auth-schemas.js';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_DAYS = 7;
const REFRESH_COOKIE = 'refreshToken';

// path restrito: o cookie só é enviado para as rotas de auth, nunca junto
// com as demais requisições da API (essas usam o Bearer token).
const refreshCookieOptions = {
  path: '/api/auth',
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
};

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Cria uma sessão de refresh: o token puro vai no cookie httpOnly do cliente;
// no banco fica apenas o hash (vazamento do banco não expõe sessões válidas).
async function createRefreshSession(userId: string, reply: FastifyReply) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { tokenHash: hashToken(token), userId, expiresAt },
  });

  reply.setCookie(REFRESH_COOKIE, token, { ...refreshCookieOptions, expires: expiresAt });
}

async function signAccessToken(reply: FastifyReply, userId: string, role: string) {
  return reply.jwtSign(
    { role },
    { sign: { sub: userId, expiresIn: ACCESS_TOKEN_TTL } }
  );
}

export async function register(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { name, email, password } = registerBodySchema.parse(request.body);

    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return reply.status(409).send({ message: 'E-mail já cadastrado.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // role omitido de propósito: o schema do Prisma aplica o padrão WRITER.
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
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

    const token = await signAccessToken(reply, user.id, user.role);
    await createRefreshSession(user.id, reply);

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

// Troca o refresh token (cookie) por um novo access token. A sessão usada é
// sempre rotacionada: a linha antiga sai do banco e uma nova entra no lugar.
export async function refresh(request: FastifyRequest, reply: FastifyReply) {
  try {
    const rawToken = request.cookies[REFRESH_COOKIE];

    if (!rawToken) {
      return reply.status(401).send({ message: 'Sessão expirada. Faça login novamente.' });
    }

    const session = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.refreshToken.delete({ where: { id: session.id } });
      }
      reply.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
      return reply.status(401).send({ message: 'Sessão expirada. Faça login novamente.' });
    }

    await prisma.refreshToken.delete({ where: { id: session.id } });
    await createRefreshSession(session.user.id, reply);

    const token = await signAccessToken(reply, session.user.id, session.user.role);

    return reply.status(200).send({ token });
  } catch (error) {
    return reply.status(500).send({ message: 'Erro interno do servidor.' });
  }
}

// Encerra a sessão: revoga o refresh token no banco e limpa o cookie.
export async function logout(request: FastifyRequest, reply: FastifyReply) {
  try {
    const rawToken = request.cookies[REFRESH_COOKIE];

    if (rawToken) {
      await prisma.refreshToken.deleteMany({ where: { tokenHash: hashToken(rawToken) } });
    }

    reply.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
    return reply.status(204).send();
  } catch (error) {
    return reply.status(500).send({ message: 'Erro interno do servidor.' });
  }
}
