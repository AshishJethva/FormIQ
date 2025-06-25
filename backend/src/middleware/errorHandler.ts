import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';

export const errorHandler = (
  error: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error Handler:', {
    name: error.name,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    path: req.path,
    method: req.method,
    body: req.body,
  });

  // Default error values
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Handle known ApiError instances
  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
  }
  // Handle Mongoose validation errors
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error: ' + error.message;
  }
  // Handle Mongoose duplicate key errors
  else if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }
  // Handle Mongoose cast errors
  else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid data format';
  }
  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  // Handle Razorpay errors
  else if (
    error.message.includes('razorpay') ||
    error.message.includes('payment')
  ) {
    statusCode = 400;
    message = 'Payment processing error: ' + error.message;
  }

  // Create error response
  const errorResponse = new ApiResponse(statusCode, null, message);

  // Add additional error info in development
  if (process.env.NODE_ENV === 'development') {
    (errorResponse as any).error = {
      name: error.name,
      stack: error.stack,
      originalMessage: error.message,
    };
  }

  return res.status(statusCode).json(errorResponse);
};

// Not found handler
export const notFoundHandler = (req: Request, res: Response) => {
  const error = new ApiError(`Route ${req.originalUrl} not found`, 404);
  const errorResponse = new ApiResponse(404, null, error.message);
  return res.status(404).json(errorResponse);
};
