// src/controllers/dashboard.controller.ts
import { Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { RequestWithUser } from '../types/index';

export const getDashboard = catchAsync(
  async (req: RequestWithUser, res: Response) => {
    // The user is available on req.user thanks to the protect middleware
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user,
        message: 'Welcome to your dashboard!',
        stats: {
          forms: 12, // Example data, replace with real data
          submissions: 245,
          completionRate: '76%',
        },
      },
    });
  }
);
