// middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Schema } from 'zod';
import { ApiError } from '../utils/apiBasicError';

export const validate = (schema: Schema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error: any) {
      next(new ApiError(error.message || 'Validation Error', 400));
    }
  };
};

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const errorMessage = errors
    .array()
    .map(error => error.msg)
    .join(', ');

  return next(new ApiError(`Validation failed: ${errorMessage}`, 400));
};
