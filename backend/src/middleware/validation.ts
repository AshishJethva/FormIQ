// middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

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

// // src/middleware/validation.ts
// import { Request, Response, NextFunction } from 'express';
// import { AnyZodObject, ZodError } from 'zod';
// import { ApiError } from '../utils/ApiError';

// export const validate =
//   (schema: AnyZodObject) =>
//   (req: Request, res: Response, next: NextFunction) => {
//     try {
//       schema.parse({
//         body: req.body,
//         query: req.query,
//         params: req.params,
//       });
//       next();
//     } catch (error) {
//       if (error instanceof ZodError) {
//         const errorMessages = error.errors.map((issue: any) => ({
//           path: issue.path.join('.'),
//           message: issue.message,
//         }));
//         const message = `Validation error: ${errorMessages
//           .map(e => `${e.path}: ${e.message}`)
//           .join(', ')}`;
//         return next(new ApiError(message, 400));
//       }
//       next(error);
//     }
//   };
