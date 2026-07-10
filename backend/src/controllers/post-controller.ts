import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { createPostBodySchema, updatePostBodySchema, updatePostStatusBodySchema } from '../schemas/post-schemas.js';
import { slugify } from '../utils/slugify.js';

function calculateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/);
  const wordCount = words.length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

async function generateUniquePostSlug(title: string): Promise<string> {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let count = 0;

  while (true) {
    const checkSlug = count === 0 ? slug : `${slug}-${count}`;
    const existing = await prisma.post.findUnique({
      where: { slug: checkSlug },
    });

    if (!existing) {
      return checkSlug;
    }
    count++;
  }
}

export async function createPost(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { title, summary, content, readingTime, categoryId, tagIds, status } = createPostBodySchema.parse(request.body);
    const userId = request.user.sub;
    const userRole = request.user.role;

    // Check if WRITER is trying to publish directly
    if (userRole === 'WRITER' && (status === 'PUBLISHED' || status === 'REJECTED')) {
      return reply.status(403).send({ message: 'Apenas editores ou administradores podem publicar posts.' });
    }

    // Verify category exists
    const categoryExists = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!categoryExists) {
      return reply.status(400).send({ message: 'Categoria não encontrada.' });
    }

    // Verify tags exist if provided
    if (tagIds.length > 0) {
      const existingTagsCount = await prisma.tag.count({
        where: { id: { in: tagIds } },
      });

      if (existingTagsCount !== tagIds.length) {
        return reply.status(400).send({ message: 'Uma ou mais tags fornecidas não existem.' });
      }
    }

    const slug = await generateUniquePostSlug(title);
    const finalReadingTime = readingTime ?? calculateReadingTime(content);

    const post = await prisma.post.create({
      data: {
        title,
        summary,
        content,
        slug,
        readingTime: finalReadingTime,
        status,
        authorId: userId,
        categoryId,
        tags: {
          connect: tagIds.map((id) => ({ id })),
        },
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
      },
      include: {
        category: true,
        tags: true,
        author: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return reply.status(201).send(post);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return reply.status(400).send({ message: 'Erro de validação.', errors: error.format() });
    }
    return reply.status(500).send({ message: 'Erro interno do servidor.' });
  }
}

export async function listPosts(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Manually verify JWT optional authentication to implement visibility rules
    if (request.headers.authorization) {
      try {
        await request.jwtVerify();
      } catch (err) {
        // Ignore invalid JWT and treat request as public
      }
    }

    const { authorId, categoryId, tagId, status } = request.query as {
      authorId?: string;
      categoryId?: string;
      tagId?: string;
      status?: string;
    };

    const where: any = {};

    // 1. Visibility rules
    if (!request.user) {
      where.status = 'PUBLISHED';
    } else {
      const { role, sub: userId } = request.user;
      if (role === 'WRITER') {
        where.OR = [
          { status: 'PUBLISHED' },
          { authorId: userId },
        ];
      }
      // EDITORS and ADMINS can see all posts by default
    }

    // 2. Apply query filters
    if (authorId) {
      where.authorId = authorId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (tagId) {
      where.tags = {
        some: { id: tagId },
      };
    }

    // Apply specific status filter with permission check
    if (status) {
      if (!request.user) {
        where.status = 'PUBLISHED';
      } else {
        const { role, sub: userId } = request.user;
        if (role === 'WRITER') {
          if (status !== 'PUBLISHED') {
            where.status = status;
            where.authorId = userId; // WRITER can only filter by non-published status if it's their own
            delete where.OR;
          } else {
            where.status = 'PUBLISHED';
          }
        } else {
          where.status = status;
        }
      }
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        category: true,
        tags: true,
        author: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.status(200).send(posts);
  } catch (error) {
    return reply.status(500).send({ message: 'Erro interno do servidor.' });
  }
}

export async function getPost(request: FastifyRequest, reply: FastifyReply) {
  try {
    if (request.headers.authorization) {
      try {
        await request.jwtVerify();
      } catch (err) {
        // Ignore invalid JWT
      }
    }

    const { idOrSlug } = request.params as { idOrSlug: string };
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const post = await prisma.post.findUnique({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        category: true,
        tags: true,
        author: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!post) {
      return reply.status(404).send({ message: 'Publicação não encontrada.' });
    }

    // Visibility rules check
    if (post.status !== 'PUBLISHED') {
      if (!request.user) {
        return reply.status(403).send({ message: 'Você não tem permissão para visualizar esta publicação.' });
      }

      const { role, sub: userId } = request.user;
      if (role === 'WRITER' && post.authorId !== userId) {
        return reply.status(403).send({ message: 'Você não tem permissão para visualizar esta publicação.' });
      }
    }

    return reply.status(200).send(post);
  } catch (error) {
    return reply.status(500).send({ message: 'Erro interno do servidor.' });
  }
}

export async function updatePost(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const userId = request.user.sub;
    const userRole = request.user.role;

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return reply.status(404).send({ message: 'Publicação não encontrada.' });
    }

    // Authorization check
    if (userRole === 'WRITER' && post.authorId !== userId) {
      return reply.status(403).send({ message: 'Você não tem permissão para editar esta publicação.' });
    }

    const { title, summary, content, readingTime, categoryId, tagIds, status } = updatePostBodySchema.parse(request.body);

    const updateData: any = {};

    if (title !== undefined) {
      updateData.title = title;
      if (title !== post.title) {
        updateData.slug = await generateUniquePostSlug(title);
      }
    }

    if (summary !== undefined) {
      updateData.summary = summary;
    }

    if (content !== undefined) {
      updateData.content = content;
      if (readingTime === undefined) {
        updateData.readingTime = calculateReadingTime(content);
      }
    }

    if (readingTime !== undefined) {
      updateData.readingTime = readingTime;
    }

    if (categoryId !== undefined) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!categoryExists) {
        return reply.status(400).send({ message: 'Categoria não encontrada.' });
      }
      updateData.categoryId = categoryId;
    }

    if (tagIds !== undefined) {
      if (tagIds.length > 0) {
        const existingTagsCount = await prisma.tag.count({
          where: { id: { in: tagIds } },
        });
        if (existingTagsCount !== tagIds.length) {
          return reply.status(400).send({ message: 'Uma ou mais tags fornecidas não existem.' });
        }
      }
      updateData.tags = {
        set: tagIds.map((id) => ({ id })),
      };
    }

    if (status !== undefined) {
      if (userRole === 'WRITER' && (status === 'PUBLISHED' || status === 'REJECTED')) {
        return reply.status(403).send({ message: 'Apenas editores ou administradores podem publicar posts.' });
      }
      updateData.status = status;
      if (status === 'PUBLISHED' && post.status !== 'PUBLISHED') {
        updateData.publishedAt = new Date();
      }
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        tags: true,
        author: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return reply.status(200).send(updatedPost);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return reply.status(400).send({ message: 'Erro de validação.', errors: error.format() });
    }
    return reply.status(500).send({ message: 'Erro interno do servidor.' });
  }
}

export async function deletePost(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const userId = request.user.sub;
    const userRole = request.user.role;

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return reply.status(404).send({ message: 'Publicação não encontrada.' });
    }

    // Authorization check
    if (userRole === 'WRITER' && post.authorId !== userId) {
      return reply.status(403).send({ message: 'Você não tem permissão para excluir esta publicação.' });
    }

    await prisma.post.delete({
      where: { id },
    });

    return reply.status(204).send();
  } catch (error) {
    return reply.status(500).send({ message: 'Erro interno do servidor.' });
  }
}

export async function updatePostStatus(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const userId = request.user.sub;
    const userRole = request.user.role;

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return reply.status(404).send({ message: 'Publicação não encontrada.' });
    }

    // Authorization check (must be author or editor/admin)
    if (userRole === 'WRITER' && post.authorId !== userId) {
      return reply.status(403).send({ message: 'Você não tem permissão para alterar o status desta publicação.' });
    }

    const { status } = updatePostStatusBodySchema.parse(request.body);

    // WRITER can only set status to DRAFT or PENDING_REVIEW
    if (userRole === 'WRITER' && (status === 'PUBLISHED' || status === 'REJECTED')) {
      return reply.status(403).send({ message: 'Apenas editores ou administradores podem publicar ou rejeitar posts.' });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        status,
        publishedAt: status === 'PUBLISHED' && post.status !== 'PUBLISHED' ? new Date() : post.publishedAt,
      },
      include: {
        category: true,
        tags: true,
        author: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return reply.status(200).send(updatedPost);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return reply.status(400).send({ message: 'Erro de validação.', errors: error.format() });
    }
    return reply.status(500).send({ message: 'Erro interno do servidor.' });
  }
}
