import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { ZodError } from 'zod';
import logger from '../utils/logger';

interface ValidationError {
  field: string;
  message: string;
  code: string;
}

interface ErrorResponse {
  status: string;
  message: string;
  errors?: ValidationError[];
  stack?: string;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const error = err instanceof AppError ? err : new AppError(err.message || 'Something went wrong', 500);
  
  // Log error with context
  logger.error('Request error', {
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    },
    request: {
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      body: req.body
    }
  });
  
  // Format response
  const response: ErrorResponse = {
    status: error.statusCode >= 500 ? 'error' : 'fail',
    message: error.message
  };

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    response.status = 'fail';
    response.message = 'Validation error';
    // @ts-expect-error: Zod error format is known and safe
    response.errors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    error.statusCode = 400;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    response.status = 'fail';
    response.message = 'Validation error';
    response.errors = Object.values((err as any).errors).map((e: any) => ({
      field: e.path,
      message: e.message,
      code: 'VALIDATION_ERROR'
    }));
    error.statusCode = 400;
  }

  // Handle Mongoose cast errors
  if (err.name === 'CastError') {
    response.status = 'fail';
    response.message = 'Invalid ID format';
    error.statusCode = 400;
  }

  // Handle duplicate key errors
  if ((err as any).code === 11000) {
    response.status = 'fail';
    response.message = 'Duplicate field value';
    response.errors = [{
      field: Object.keys((err as any).keyValue)[0],
      message: `Duplicate value for field ${Object.keys((err as any).keyValue)[0]}`,
      code: 'DUPLICATE_FIELD'
    }];
    error.statusCode = 400;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(error.statusCode).json(response);
};