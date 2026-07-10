import { FastifyInstance } from 'fastify';
import {
  createPost,
  listPosts,
  getPost,
  updatePost,
  deletePost,
  updatePostStatus,
} from '../controllers/post-controller.js';
import { verifyJWT } from '../middlewares/jwt-auth.js';

export async function postRoutes(app: FastifyInstance) {
  // Public routes (controller handles optional JWT decoding)
  app.get('/', listPosts);
  app.get('/:idOrSlug', getPost);

  // Protected routes (Any authenticated user can create, but updates are author/editor/admin only)
  app.post('/', { onRequest: [verifyJWT] }, createPost);
  app.put('/:id', { onRequest: [verifyJWT] }, updatePost);
  app.delete('/:id', { onRequest: [verifyJWT] }, deletePost);
  app.patch('/:id/status', { onRequest: [verifyJWT] }, updatePostStatus);
}
