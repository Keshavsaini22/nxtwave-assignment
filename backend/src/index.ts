import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Load OpenAPI specifications safely
try {
  const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'openapi.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (error) {
  console.error('Failed to load swagger documentation:', error);
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Basic welcome route
app.get('/', (req: Request, res: Response) => {
  res.redirect('/api-docs');
});

// Base API route placeholder
app.get('/api/v1', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to the Team Task Tracker API v1. Visit /api-docs for documentation.'
  });
});

// Standardized 404 Route Not Found
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    status: 404,
    code: 'NOT_FOUND',
    message: `Resource not found: ${req.method} ${req.url}`
  });
});

// Global Error Handler Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`Unhandled error inside application: ${err.message}`, err.stack);
  res.status(500).json({
    status: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected internal server error occurred.'
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Swagger Docs available at http://localhost:${PORT}/api-docs`);
  console.log(`====================================================`);
});
