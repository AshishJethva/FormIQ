import { Request, Response, NextFunction } from 'express';
import ActivityLog from '../models/ActivityLog';
import mongoose from 'mongoose';

export const activityLogger = (
  action: string,
  targetType: 'form' | 'submission' | 'account' | 'settings'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json;

    // Override json method to log activity after successful response
    res.json = function (data: any) {
      // Only log on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user?.id) {
        setImmediate(async () => {
          try {
            let target = '';
            let metadata: Record<string, any> = {};

            // Extract target and metadata based on response data
            if (data?.data) {
              if (data.data.title || data.data.name) {
                target = data.data.title || data.data.name;
              }
              if (data.data.id) {
                metadata.targetId = data.data.id;
              }
            }

            // Extract additional context from request
            if (req.params.id) {
              metadata.resourceId = req.params.id;
            }

            await ActivityLog.create({
              userId: new mongoose.Types.ObjectId(req.user.id),
              action,
              target,
              targetType,
              ipAddress: req.ip || req.connection?.remoteAddress,
              userAgent: req.get('User-Agent'),
              metadata,
            });
          } catch (error) {
            console.error('Failed to log activity:', error);
          }
        });
      }

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};
