import { FastifyInstance } from 'fastify';
import {
  createTag,
  listTags,
  getTag,
  updateTag,
  deleteTag,
} from '../controllers/tag-controller.js';
import { verifyJWT } from '../middlewares/jwt-auth.js';
import { verifyUserRole } from '../middlewares/rbac.js';

export async function tagRoutes(app: FastifyInstance) {
  // Public routes
  app.get('/', listTags);
  app.get('/:id', getTag);

  // Protected routes (Admin & Editor only)
  app.post('/', { onRequest: [verifyJWT, verifyUserRole(['ADMIN', 'EDITOR'])] }, createTag);
  app.put('/:id', { onRequest: [verifyJWT, verifyUserRole(['ADMIN', 'EDITOR'])] }, updateTag);
  app.delete('/:id', { onRequest: [verifyJWT, verifyUserRole(['ADMIN', 'EDITOR'])] }, deleteTag);
}
