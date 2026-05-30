import { Router } from 'express';
import authRouter from './auth.routes.js';
import userRouter from './user.routes.js';
import projectRouter from './project.routes.js';

const apiRouter = Router();

apiRouter.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the Team Task Tracker API v1. Visit /api-docs for documentation.'
  });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/projects', projectRouter);

export default apiRouter;
