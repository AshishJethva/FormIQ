// src/models/UserProfile.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IUserProfile extends Document {
  userId: mongoose.Types.ObjectId;
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
    canCreateForms: boolean;
    remainingForms: number;
    upgradeDate?: Date;
    expiresAt?: Date;
    billingCycle?: 'monthly' | 'yearly';
  };
  createdAt: Date;
  updatedAt: Date;
  canCreateForms: boolean;
  remainingForms: number;
  incrementFormsUsed(): Promise<IUserProfile>;
  decrementFormsUsed(): Promise<IUserProfile>;
  upgradePlan(newPlan: string, newLimit: number): Promise<IUserProfile>;
}

const UserProfileSchema = new Schema<IUserProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-zA-Z0-9_]+$/,
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: /^[+]?[\d\s\-\(\)]{10,15}$/,
    },
    website: {
      type: String,
      trim: true,
      match: /^https?:\/\/.+\..+/,
      default: null,
    },
    avatar: {
      src: {
        type: String,
        required: false,
      },
      publicId: {
        type: String,
        required: false,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
    plan: {
      type: {
        type: String,
        enum: ['STARTER', 'BRONZE', 'SILVER', 'GOLD'],
        default: 'STARTER',
      },
      formsLimit: {
        type: Number,
        default: 5,
      },
      formsUsed: {
        type: Number,
        default: 0,
      },
      canCreateForms: {
        type: Boolean,
        default: true,
      },
      remainingForms: {
        type: Number,
        default: 5,
      },
      upgradeDate: Date,
      expiresAt: Date,
      billingCycle: {
        type: String,
        enum: ['monthly', 'yearly'],
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to check if user can create more forms
UserProfileSchema.virtual('canCreateForms').get(function () {
  return this.plan.formsUsed < this.plan.formsLimit;
});

// Virtual to get remaining forms
UserProfileSchema.virtual('remainingForms').get(function () {
  return Math.max(0, this.plan.formsLimit - this.plan.formsUsed);
});

// Method to increment forms used
UserProfileSchema.methods.incrementFormsUsed = function () {
  if (this.plan.formsUsed < this.plan.formsLimit) {
    this.plan.formsUsed += 1;
    return this.save();
  }
  throw new Error('Form limit reached');
};

// Method to decrement forms used
UserProfileSchema.methods.decrementFormsUsed = function () {
  if (this.plan.formsUsed > 0) {
    this.plan.formsUsed -= 1;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to upgrade plan
UserProfileSchema.methods.upgradePlan = function (
  newPlan: string,
  newLimit: number
) {
  this.plan.type = newPlan;
  this.plan.formsLimit = newLimit;
  this.plan.upgradeDate = new Date();
  // Set expiry to 1 year from now for paid plans
  if (newPlan !== 'STARTER') {
    this.plan.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  }
  return this.save();
};

// Pre-save middleware to calculate remaining forms
UserProfileSchema.pre('save', function (next) {
  if (this.plan) {
    this.plan.remainingForms = Math.max(
      0,
      this.plan.formsLimit - this.plan.formsUsed
    );
    this.plan.canCreateForms = this.plan.formsUsed < this.plan.formsLimit;
  }
  next();
});

export default mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);
