import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { createCategoryBodySchema, updateCategoryBodySchema } from '../schemas/category-schemas.js';
import { slugify } from '../utils/slugify.js';

async function generateUniqueCategorySlug(name: string): Promise<string> {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let count = 0;

  while (true) {
    const checkSlug = count === 0 ? slug : `${slug}-${count}`;
    const existing = await prisma.category.findUnique({
      where: { slug: checkSlug },
    });

    if (!existing) {
      return checkSlug;
    }
    count++;
  }
}

export async function createCategory(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { name } = createCategoryBodySchema.parse(request.body);
    const slug = await generateUniqueCategorySlug(name);

    const category = await prisma.category.create({
      data: {
        name,
        slug,
      },
    });

    return reply.status(201).send(category);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return reply.status(400).send({ message: 'Erro de validação.', errors: error.format() });
    }
    return reply.status(500).send({ message: 'Erro interno do servidor.' });
  }
}

export async function listCategories(request: FastifyRequest, reply: FastifyReply) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    return reply.status(200).send(categories);
  } catch (error) {
    return reply.status(500).send({ message: 'Erro interno do servidor.' });
  }
}

export async function getCategory(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return reply.status(404).send({ message: 'Categoria não encontrada.' });
    }

    return reply.status(200).send(category);
  } catch (error) {
    return reply.status(500).send({ message: 'Erro interno do servidor.' });
  }
}

export async function updateCategory(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const { name } = updateCategoryBodySchema.parse(request.body);

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return reply.status(404).send({ message: 'Categoria não encontrada.' });
    }

    // Only generate new slug if name has changed
    let slug = category.slug;
    if (category.name !== name) {
      slug = await generateUniqueCategorySlug(name);
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
      },
    });

    return reply.status(200).send(updatedCategory);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return reply.status(400).send({ message: 'Erro de validação.', errors: error.format() });
    }
    return reply.status(500).send({ message: 'Erro interno do servidor.' });
  }
}

export async function deleteCategory(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return reply.status(404).send({ message: 'Categoria não encontrada.' });
    }

    // Check if category has associated posts (onDelete: Restrict)
    const postsCount = await prisma.post.count({
      where: { categoryId: id },
    });

    if (postsCount > 0) {
      return reply.status(400).send({
        message: 'Não é possível excluir uma categoria que possui posts vinculados.',
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    return reply.status(204).send();
  } catch (error) {
    return reply.status(500).send({ message: 'Erro interno do servidor.' });
  }
}
