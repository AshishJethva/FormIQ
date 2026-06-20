import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { catchAsync } from '../utils/catchAsync';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { JwtPayload, AuthenticatedRequest } from '../types/index';

// Protect routes middleware
export const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get token from authorization header or cookies
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    // Check if token exists
    if (!token) {
      return next(
        new AppError('You are not logged in. Please log in to get access', 401)
      );
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return next(new AppError('Server configuration error', 500));

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError('The user belonging to this token no longer exists', 401)
      );
    }

    // Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError('User recently changed password! Please log in again', 401)
      );
    }

    // Grant access to protected route and add user to request object
    (req as AuthenticatedRequest).user = {
      id: currentUser?._id?.toString() as string,
      email: currentUser?.email as string,
    };
    res.locals.user = currentUser;
    next();
  }
);
