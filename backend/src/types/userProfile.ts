import { Document } from 'mongoose';

// ==================== USER PROFILE MODEL TYPES ====================
export interface IUserProfile extends Document {
  userId: string;
  username: string;
  phoneNumber?: string;
  website?: string;
  avatar?: {
    src: string;
    publicId: string;
    uploadedAt: Date;
  };
  plan: {
    type: 'STARTER' | 'BRONZE' | 'SILVER' | 'GOLD';
    formsLimit: number;
    formsUsed: number;
    upgradeDate?: Date;
    expiresAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  // Virtual fields
  canCreateForms: boolean;
  remainingForms: number;
}

// ==================== USER SETTINGS MODEL TYPES ====================
export interface IUserSettings extends Document {
  userId: string;
  timezone: string;
  language: string;
  darkMode: boolean;
  notifications: {
    email: boolean;
    browser: boolean;
    mobile: boolean;
  };
  emailPreferences: {
    updates: boolean;
    marketing: boolean;
    newsletter: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ==================== ACTIVITY LOG MODEL TYPES ====================
export interface IActivityLog extends Document {
  userId: string;
  action: string;
  target?: string;
  targetType: 'form' | 'submission' | 'account' | 'settings';
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// ==================== REQUEST TYPES ====================
export interface UpdateBasicInfoRequest {
  name?: string;
  email?: string;
}

export interface UpdateProfileDetailsRequest {
  username?: string;
  phoneNumber?: string;
  website?: string;
}

export interface UpdateSettingsRequest {
  timezone?: string;
  language?: string;
  darkMode?: boolean;
  notifications?: {
    email?: boolean;
    browser?: boolean;
    mobile?: boolean;
  };
  emailPreferences?: {
    updates?: boolean;
    marketing?: boolean;
    newsletter?: boolean;
  };
}

// ==================== MIDDLEWARE TYPES ====================
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface ActivityLoggerOptions {
  action: string;
  targetType: 'form' | 'submission' | 'account' | 'settings';
}

// ==================== UTILITY TYPES ====================
export type PlanType = 'STARTER' | 'BRONZE' | 'SILVER' | 'GOLD';
export type ActivityType = 'form' | 'submission' | 'account' | 'settings';
