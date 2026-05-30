import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticateJWT, authorizeRBAC, validateRequest } from '../middlewares/index.js';
import { createUserSchema, updateUserSchema } from '../validations/index.js';

const router = Router();

router.use(authenticateJWT);

router.post('/', validateRequest(createUserSchema), authorizeRBAC, UserController.createUser);
router.get('/', authorizeRBAC, UserController.listUsers);
router.patch('/:id', validateRequest(updateUserSchema), authorizeRBAC, UserController.updateUser);
router.delete('/:id', authorizeRBAC, UserController.deleteUser);

export default router;
