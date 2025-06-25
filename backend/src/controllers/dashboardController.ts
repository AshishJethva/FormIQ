import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AuthUser } from '../types/express';

export const getDashboard = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user as AuthUser,
      message: 'Welcome to your dashboard!',
      stats: {
        forms: 12,
        submissions: 245,
        completionRate: '76%',
      },
    },
  });
});
