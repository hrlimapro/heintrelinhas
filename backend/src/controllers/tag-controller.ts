import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { createTagBodySchema, updateTagBodySchema } from '../schemas/tag-schemas.js';
import { slugify } from '../utils/slugify.js';

async function generateUniqueTagSlug(name: string): Promise<string> {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let count = 0;

  while (true) {
    const checkSlug = count === 0 ? slug : `${slug}-${count}`;
    const existing = await prisma.tag.findUnique({
      where: { slug: checkSlug },
    });

    if (!existing) {
      return checkSlug;
    }
    count++;
  }
}

export async function createTag(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { name } = createTagBodySchema.parse(request.body);
    const slug = await generateUniqueTagSlug(name);

    const tag = await prisma.tag.create({
      data: {
        name,
        slug,
      },
    });

    return reply.status(201).send(tag);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return reply.status(400).send({ message: 'Erro de validação.', errors: error.format() });
    }
    return reply.status(500).send({ message: 'Erro interno do servidor.' });
  }
}

export async function listTags(request: FastifyRequest, reply: FastifyReply) {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });

    return reply.status(200).send(tags);
  } catch (error) {
    return reply.status(500).send({ message: 'Erro interno do servidor.' });
  }
}

export async function getTag(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };

    const tag = await prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      return reply.status(404).send({ message: 'Tag não encontrada.' });
    }

    return reply.status(200).send(tag);
  } catch (error) {
    return reply.status(500).send({ message: 'Erro interno do servidor.' });
  }
}

export async function updateTag(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const { name } = updateTagBodySchema.parse(request.body);

    const tag = await prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      return reply.status(404).send({ message: 'Tag não encontrada.' });
    }

    // Only generate new slug if name has changed
    let slug = tag.slug;
    if (tag.name !== name) {
      slug = await generateUniqueTagSlug(name);
    }

    const updatedTag = await prisma.tag.update({
      where: { id },
      data: {
        name,
        slug,
      },
    });

    return reply.status(200).send(updatedTag);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return reply.status(400).send({ message: 'Erro de validação.', errors: error.format() });
    }
    return reply.status(500).send({ message: 'Erro interno do servidor.' });
  }
}

export async function deleteTag(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };

    const tag = await prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      return reply.status(404).send({ message: 'Tag não encontrada.' });
    }

    await prisma.tag.delete({
      where: { id },
    });

    return reply.status(204).send();
  } catch (error) {
    return reply.status(500).send({ message: 'Erro interno do servidor.' });
  }
}
