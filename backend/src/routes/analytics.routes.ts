import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { authenticateJWT, authorizeRBAC } from '../middlewares/index.js';

const router = Router();

router.use(authenticateJWT);

router.get('/tasks', authorizeRBAC, AnalyticsController.getTaskAnalytics);

export default router;
