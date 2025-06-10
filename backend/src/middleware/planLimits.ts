// src/middleware/planLimits.ts

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import UserProfile from '../models/UserProfile';
import Form from '../models/Form';
import mongoose from 'mongoose';

export const checkFormCreationLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      return next(new ApiError('User not authenticated', 401));
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Get user profile
    const userProfile = await UserProfile.findOne({ userId });

    if (!userProfile) {
      // Create default profile if it doesn't exist
      await UserProfile.create({
        userId,
        username: `user_${Date.now()}`,
        plan: {
          type: 'STARTER',
          formsLimit: 5,
          formsUsed: 0,
        },
      });
      return next();
    }

    // Check if user can create more forms
    if (!userProfile.canCreateForms) {
      return next(
        new ApiError(
          `Form limit reached. You can create up to ${userProfile.plan.formsLimit} forms with your ${userProfile.plan.type} plan. Please upgrade to create more forms.`,
          403
        )
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
