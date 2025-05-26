// middleware/validation.ts
import { Request, Response, NextFunction } from 'express';

import { Schema } from 'zod';
import { ApiError } from '../utils/ApiError';

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
