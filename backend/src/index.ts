import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

try {
  const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'openapi.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (error) {
  console.error('Failed to load swagger documentation:', error);
}

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/', (req: Request, res: Response) => {
  res.redirect('/api-docs');
});

app.use('/api/v1', apiRouter);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    status: 404,
    code: 'NOT_FOUND',
    message: `Resource not found: ${req.method} ${req.url}`
  });
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Swagger Docs available at http://localhost:${PORT}/api-docs`);
  console.log(`====================================================`);
});

const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Initiating graceful shutdown...`);

  server.close(async () => {
    console.log('⚡ HTTP server successfully closed.');

    try {
      const { default: prisma } = await import('./config/prisma.js');
      const { default: redis } = await import('./config/redis.js');

      await prisma.$disconnect();
      console.log('🔌 Prisma client connection disconnected.');

      await redis.quit();
      console.log('🔌 Redis client connection disconnected.');

      console.log('👋 Graceful shutdown finalized successfully.');
      process.exit(0);
    } catch (error) {
      console.error('💥 Error during graceful shutdown execution:', error);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error('⏰ Shutdown timed out. Forcing process exit.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
