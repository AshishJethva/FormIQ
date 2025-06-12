export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = 'ApiError';

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  // Static methods for common errors
  static badRequest(message: string = 'Bad Request'): ApiError {
    return new ApiError(message, 400);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(message, 401);
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(message, 403);
  }

  static notFound(message: string = 'Not Found'): ApiError {
    return new ApiError(message, 404);
  }

  static internal(message: string = 'Internal Server Error'): ApiError {
    return new ApiError(message, 500);
  }
}
