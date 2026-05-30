import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticateJWT, authorizeRBAC, validateRequest } from '../middlewares/index.js';
import { createUserSchema, updateUserSchema, paginationQuerySchema, uuidParamSchema } from '../validations/index.js';

const router = Router();

router.use(authenticateJWT);

router.post('/', validateRequest(createUserSchema), authorizeRBAC, UserController.createUser);
router.get('/', validateRequest(paginationQuerySchema), authorizeRBAC, UserController.listUsers);
router.patch('/:id', validateRequest(uuidParamSchema), validateRequest(updateUserSchema), authorizeRBAC, UserController.updateUser);
router.delete('/:id', validateRequest(uuidParamSchema), authorizeRBAC, UserController.deleteUser);

export default router;
