// src/routes/userProfile.ts
import express from 'express';
import { Request, Response } from 'express';
import { protect } from '../middleware/protect';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiBasicError';
import User from '../models/User';
import UserProfile from '../models/UserProfile';
import UserSettings from '../models/UserSettings';
import ActivityLog from '../models/ActivityLog';
import Form from '../models/Form';
import { uploadLogo } from '../services/cloudinaryService';
import multer from 'multer';
import mongoose from 'mongoose';

const router = express.Router();

// Configure multer for avatar uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
});

// Helper function to log activity
const logActivity = async (
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

// @desc    Get user profile with forms count
// @route   GET /api/user/profile
// @access  Private
router.get(
  '/profile',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Get user basic info
    const user = await User.findById(userId).select(
      'name email createdAt updatedAt'
    );
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Get or create user profile
    let userProfile = await UserProfile.findOne({ userId });
    if (!userProfile) {
      // Create default profile
      userProfile = await UserProfile.create({
        userId,
        username:
          user.name.toLowerCase().replace(/\s+/g, '') +
          Math.floor(Math.random() * 1000),
        plan: {
          type: 'STARTER',
          formsLimit: 5,
          formsUsed: 0,
        },
      });
    }

    // Get current forms count for accuracy
    const actualFormsCount = await Form.countDocuments({
      userId,
      isTrashed: false,
    });

    // Update forms used if different
    if (userProfile.plan.formsUsed !== actualFormsCount) {
      userProfile.plan.formsUsed = actualFormsCount;
      await userProfile.save();
    }

    // Get user settings
    let userSettings = await UserSettings.findOne({ userId });
    if (!userSettings) {
      userSettings = await UserSettings.create({ userId });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        profile: {
          username: userProfile.username,
          phoneNumber: userProfile.phoneNumber,
          website: userProfile.website,
          avatar: userProfile.avatar,
          plan: {
            type: userProfile.plan.type,
            formsLimit: userProfile.plan.formsLimit,
            formsUsed: userProfile.plan.formsUsed,
            canCreateForms: userProfile.canCreateForms,
            remainingForms: userProfile.remainingForms,
          },
        },
        settings: userSettings,
      },
    });
  })
);

// @desc    Update user basic info
// @route   PUT /api/user/profile/basic
// @access  Private
router.put(
  '/profile/basic',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { name, email } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.trim().toLowerCase();

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select('name email');

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Log activity
    await logActivity(
      req.user.id,
      'updated profile information',
      'account',
      'basic_info',
      req,
      { updatedFields: Object.keys(updateData) }
    );

    res.status(200).json({
      success: true,
      data: user,
      message: 'Profile updated successfully',
    });
  })
);

// @desc    Update user profile details
// @route   PUT /api/user/profile/details
// @access  Private
router.put(
  '/profile/details',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { username, phoneNumber, website } = req.body;

    // Check if username is already taken
    if (username) {
      const existingProfile = await UserProfile.findOne({
        username: username.trim(),
        userId: { $ne: userId },
      });
      if (existingProfile) {
        throw new ApiError('Username is already taken', 400);
      }
    }

    const updateData: any = {};
    if (username) updateData.username = username.trim();
    if (phoneNumber !== undefined) {
      updateData.phoneNumber = phoneNumber ? phoneNumber.trim() : null;
    }
    if (website !== undefined) {
      updateData.website = website ? website.trim() : null;
    }

    const userProfile = await UserProfile.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!userProfile) {
      throw new ApiError('User profile not found', 404);
    }

    // Log activity
    await logActivity(
      req.user.id,
      'updated profile details',
      'account',
      'profile_details',
      req,
      { updatedFields: Object.keys(updateData) }
    );

    res.status(200).json({
      success: true,
      data: userProfile,
      message: 'Profile details updated successfully',
    });
  })
);

// @desc    Upload user avatar
// @route   POST /api/user/profile/avatar
// @access  Private
router.post(
  '/profile/avatar',
  protect,
  upload.single('avatar'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    if (!req.file) {
      throw new ApiError('No avatar file uploaded', 400);
    }

    try {
      // Upload to Cloudinary
      const uploadResult = await uploadLogo(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Update user profile
      const userProfile = await UserProfile.findOneAndUpdate(
        { userId },
        {
          avatar: {
            src: uploadResult.url,
            publicId: uploadResult.publicId,
            uploadedAt: new Date(),
          },
        },
        { new: true, upsert: true }
      );

      // Log activity
      await logActivity(
        req.user.id,
        'uploaded avatar',
        'account',
        'avatar',
        req
      );

      res.status(200).json({
        success: true,
        data: {
          avatar: userProfile!.avatar,
        },
        message: 'Avatar uploaded successfully',
      });
    } catch (error: any) {
      throw new ApiError(error.message || 'Failed to upload avatar', 500);
    }
  })
);

// @desc    Get user settings
// @route   GET /api/user/settings
// @access  Private
router.get(
  '/settings',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    let userSettings = await UserSettings.findOne({ userId });
    if (!userSettings) {
      userSettings = await UserSettings.create({ userId });
    }

    res.status(200).json({
      success: true,
      data: userSettings,
    });
  })
);

// @desc    Update user settings
// @route   PUT /api/user/settings
// @access  Private
router.put(
  '/settings',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { timezone, language, darkMode, notifications, emailPreferences } =
      req.body;

    const updateData: any = {};
    if (timezone) updateData.timezone = timezone;
    if (language) updateData.language = language;
    if (typeof darkMode === 'boolean') updateData.darkMode = darkMode;
    if (notifications) updateData.notifications = notifications;
    if (emailPreferences) updateData.emailPreferences = emailPreferences;

    const userSettings = await UserSettings.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, upsert: true, runValidators: true }
    );

    // Log activity
    await logActivity(
      req.user.id,
      'updated settings',
      'settings',
      'user_preferences',
      req,
      { updatedFields: Object.keys(updateData) }
    );

    res.status(200).json({
      success: true,
      data: userSettings,
      message: 'Settings updated successfully',
    });
  })
);

// @desc    Get activity logs with filtering
// @route   GET /api/user/activity
// @access  Private
router.get(
  '/activity',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const {
      page = 1,
      limit = 20,
      targetType,
      action,
      dateFrom,
      dateTo,
      search,
    } = req.query;

    // Build query
    const query: any = { userId };

    if (targetType) {
      query.targetType = targetType;
    }

    if (action) {
      query.action = { $regex: action, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { target: { $regex: search, $options: 'i' } },
      ];
    }

    // Date filtering
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        const endDate = new Date(dateTo as string);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ActivityLog.countDocuments(query),
    ]);

    // Format logs for frontend
    const formattedLogs = logs.map(log => ({
      id: log._id.toString(),
      date: log.createdAt.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: '2-digit',
      }),
      time: log.createdAt.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      action: log.action,
      target: log.target || '',
      ipAddress: log.ipAddress,
      timestamp: log.createdAt.getTime(),
    }));

    res.status(200).json({
      success: true,
      data: formattedLogs,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum,
      },
    });
  })
);

// @desc    Get account overview stats
// @route   GET /api/user/stats
// @access  Private
router.get(
  '/stats',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const [
      user,
      profile,
      totalForms,
      totalSubmissions,
      recentActivity,
      lastIpActivity,
    ] = await Promise.all([
      User.findById(userId).select('createdAt'),
      UserProfile.findOne({ userId }),
      Form.countDocuments({ userId, isTrashed: false }),
      Form.aggregate([
        { $match: { userId, isTrashed: false } },
        { $group: { _id: null, total: { $sum: '$submissions' } } },
      ]),
      ActivityLog.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('action createdAt')
        .lean(),
      // Get the most recent activity log with an IP address
      ActivityLog.findOne({
        userId,
        ipAddress: { $exists: true, $ne: null, $nin: ['', null] },
      })
        .sort({ createdAt: -1 })
        .select('ipAddress createdAt')
        .lean(),
    ]);

    const stats = {
      accountAge: user
        ? Math.floor(
            (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          )
        : 0,
      totalForms,
      totalSubmissions: totalSubmissions[0]?.total || 0,
      planType: profile?.plan.type || 'STARTER',
      formsUsed: profile?.plan.formsUsed || 0,
      formsLimit: profile?.plan.formsLimit || 5,
      lastIpAddress: lastIpActivity?.ipAddress || 'Not available',
      lastSeenDate: lastIpActivity?.createdAt || new Date(),
      recentActivity: recentActivity.map(activity => ({
        action: activity.action,
        date: activity.createdAt.toLocaleDateString(),
      })),
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  })
);

// @desc    Delete user avatar
// @route   DELETE /api/user/profile/avatar
// @access  Private
router.delete(
  '/profile/avatar',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Get current profile to check if avatar exists
    const userProfile = await UserProfile.findOne({ userId });
    if (!userProfile || !userProfile.avatar) {
      throw new ApiError('No avatar found to delete', 404);
    }

    try {
      // Delete from Cloudinary if publicId exists
      if (userProfile.avatar.publicId) {
        const { deleteImage } = require('../services/cloudinaryService');
        await deleteImage(userProfile.avatar.publicId);
      }

      // Remove avatar from database
      await UserProfile.findOneAndUpdate(
        { userId },
        { $unset: { avatar: 1 } },
        { new: true }
      );

      // Log activity
      await logActivity(
        req.user.id,
        'deleted avatar',
        'account',
        'avatar',
        req
      );

      res.status(200).json({
        success: true,
        message: 'Avatar deleted successfully',
      });
    } catch (error: any) {
      throw new ApiError(error.message || 'Failed to delete avatar', 500);
    }
  })
);

export default router;
