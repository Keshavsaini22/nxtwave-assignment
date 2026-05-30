import { Router } from 'express';
import { TaskController } from '../controllers/task.controller.js';
import { authenticateJWT, authorizeRBAC, validateRequest } from '../middlewares/index.js';
import { createTaskSchema, updateTaskSchema, updateTaskStatusSchema, listTasksQuerySchema } from '../validations/index.js';

const router = Router();

router.use(authenticateJWT);

router.post('/', validateRequest(createTaskSchema), authorizeRBAC, TaskController.createTask);
router.get('/', validateRequest(listTasksQuerySchema), authorizeRBAC, TaskController.listTasks);

router.get('/:id', authorizeRBAC, TaskController.getTask);
router.patch('/:id', validateRequest(updateTaskSchema), authorizeRBAC, TaskController.updateTask);
router.delete('/:id', authorizeRBAC, TaskController.deleteTask);

router.patch('/:id/status', validateRequest(updateTaskStatusSchema), authorizeRBAC, TaskController.updateTaskStatus);

export default router;
