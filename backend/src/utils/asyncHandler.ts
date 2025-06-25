import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const authenticatedAsyncHandler = (
  fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as AuthenticatedRequest, res, next)).catch(next);
  };
};