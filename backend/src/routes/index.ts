import { Router } from 'express';
import authRouter from './auth.routes.js';
import userRouter from './user.routes.js';
import projectRouter from './project.routes.js';
import taskRouter from './task.routes.js';
import notificationRouter from './notification.routes.js';
import analyticsRouter from './analytics.routes.js';

const apiRouter = Router();

apiRouter.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the Team Task Tracker API v1. Visit /api-docs for documentation.'
  });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/projects', projectRouter);
apiRouter.use('/tasks', taskRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/analytics', analyticsRouter);

export default apiRouter;
