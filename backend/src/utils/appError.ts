export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public isOperational = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleError = (err: any) => {
  if (err.name === 'ValidationError') {
    return new AppError(err.message, 400);
  }
  
  if (err.name === 'CastError') {
    return new AppError('Invalid ID format', 400);
  }
  
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return new AppError(`Duplicate ${field}`, 400);
  }
  
  return err;
};