import { Request } from 'express';
import mongoose from 'mongoose';
import ActivityLog from '../models/ActivityLog';
import UserProfile from '../models/UserProfile';

export const logActivity = async (
  userId: string,
  action: string,
  targetType: 'form' | 'submission' | 'account' | 'settings',
  target?: string,
  req?: Request,
  metadata?: Record<string, any>
) => {
  try {
    await ActivityLog.create({
      userId: new mongoose.Types.ObjectId(userId),
      action,
      target,
      targetType,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('User-Agent'),
      metadata,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

export const updateFormsUsed = async (
  userId: string,
  increment: boolean = true
) => {
  try {
    const userProfile = await UserProfile.findOne({ userId });
    if (userProfile) {
      if (increment) {
        await userProfile.incrementFormsUsed();
      } else {
        await userProfile.decrementFormsUsed();
      }
    }
  } catch (error) {
    console.error('Failed to update forms used count:', error);
  }
};
