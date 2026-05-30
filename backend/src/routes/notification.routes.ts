import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { authenticateJWT, validateRequest } from '../middlewares/index.js';
import { paginationQuerySchema, uuidParamSchema } from '../validations/index.js';

const router = Router();

router.use(authenticateJWT);

router.get('/stream', NotificationController.getStream);
router.get('/', validateRequest(paginationQuerySchema), NotificationController.listNotifications);
router.patch('/:id/read', validateRequest(uuidParamSchema), NotificationController.markAsRead);
router.post('/read-all', NotificationController.markAllAsRead);

export default router;
