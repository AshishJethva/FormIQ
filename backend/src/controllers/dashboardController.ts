// src/controllers/dashboard.controller.ts
import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AuthRequest } from '../middleware/auth';
import { AuthUser } from '../types/express';

export const getDashboard = catchAsync(async (req: Request, res: Response) => {
  // The user is available on req.user thanks to the protect middleware
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user as AuthUser,
      message: 'Welcome to your dashboard!',
      stats: {
        forms: 12, // Example data, replace with real data
        submissions: 245,
        completionRate: '76%',
      },
    },
  });
});
