import { Router } from 'express';
import { TaskController } from '../controllers/task.controller.js';
import { authenticateJWT, authorizeRBAC, validateRequest } from '../middlewares/index.js';
import { createTaskSchema, updateTaskSchema, updateTaskStatusSchema, listTasksQuerySchema, uuidParamSchema } from '../validations/index.js';

const router = Router();

router.use(authenticateJWT);

router.post('/', validateRequest(createTaskSchema), authorizeRBAC, TaskController.createTask);
router.get('/', validateRequest(listTasksQuerySchema), authorizeRBAC, TaskController.listTasks);

router.get('/:id', validateRequest(uuidParamSchema), authorizeRBAC, TaskController.getTask);
router.patch('/:id', validateRequest(uuidParamSchema), validateRequest(updateTaskSchema), authorizeRBAC, TaskController.updateTask);
router.delete('/:id', validateRequest(uuidParamSchema), authorizeRBAC, TaskController.deleteTask);

router.patch('/:id/status', validateRequest(uuidParamSchema), validateRequest(updateTaskStatusSchema), authorizeRBAC, TaskController.updateTaskStatus);

export default router;
