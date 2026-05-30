import { Router } from 'express';
import authRouter from './auth.routes.js';
import userRouter from './user.routes.js';

const apiRouter = Router();

// Base API v1 endpoint
apiRouter.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the Team Task Tracker API v1. Visit /api-docs for documentation.'
  });
});

// Mount all modular routes
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);

export default apiRouter;
