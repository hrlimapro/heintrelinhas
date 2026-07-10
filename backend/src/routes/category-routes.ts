import { FastifyInstance } from 'fastify';
import {
  createCategory,
  listCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category-controller.js';
import { verifyJWT } from '../middlewares/jwt-auth.js';
import { verifyUserRole } from '../middlewares/rbac.js';

export async function categoryRoutes(app: FastifyInstance) {
  // Public routes
  app.get('/', listCategories);
  app.get('/:id', getCategory);

  // Protected routes (Admin & Editor only)
  app.post('/', { onRequest: [verifyJWT, verifyUserRole(['ADMIN', 'EDITOR'])] }, createCategory);
  app.put('/:id', { onRequest: [verifyJWT, verifyUserRole(['ADMIN', 'EDITOR'])] }, updateCategory);
  app.delete('/:id', { onRequest: [verifyJWT, verifyUserRole(['ADMIN', 'EDITOR'])] }, deleteCategory);
}
