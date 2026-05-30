import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly title: string;

  constructor(message: string, status: number = 400, code: string = 'BAD_REQUEST', title: string = 'Bad Request') {
    super(message);
    this.status = status;
    this.code = code;
    this.title = title;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let status = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let title = 'Internal Server Error';
  let detail = 'An unexpected internal server error occurred on our systems.';
  let invalidParams: Array<{ name: string; reason: string }> | undefined = undefined;

  if (err instanceof AppError) {
    status = err.status;
    code = err.code;
    title = err.title;
    detail = err.message;
  } else if (err instanceof ZodError) {
    status = 400;
    code = 'VALIDATION_ERROR';
    title = 'Request Validation Failed';
    detail = 'One or more request parameters failed validation constraints.';
    invalidParams = err.errors.map(e => ({
      name: e.path.join('.'),
      reason: e.message
    }));
  } else if (err.code === 'P2002') {
    status = 409;
    code = 'CONFLICT_ERROR';
    title = 'Resource Conflict';
    const fields = (err.meta?.target as string[]) || [];
    detail = `A resource with the specified value(s) for fields [${fields.join(', ')}] already exists.`;
  } else {
    console.error(`💥 Unhandled Server Exception: ${err.message}`, err.stack);
    detail = err.message || detail;
  }

  res.setHeader('Content-Type', 'application/problem+json');

  res.status(status).json({
    type: `/errors/${code.toLowerCase().replace(/_/g, '-')}`,
    title,
    status,
    detail,
    instance: req.originalUrl,
    code,
    timestamp: new Date().toISOString(),
    ...(invalidParams && { invalidParams })
  });
};
