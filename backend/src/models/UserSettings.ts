import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSettings extends Document {
  userId: mongoose.Types.ObjectId;
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

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
      trim: true,
    },
    language: {
      type: String,
      default: 'English',
      enum: [
        'English',
        'Hindi',
        'Spanish',
        'French',
        'German',
        'Chinese',
        'Japanese',
      ],
    },
    darkMode: {
      type: Boolean,
      default: false,
    },
    notifications: {
      email: {
        type: Boolean,
        default: true,
      },
      browser: {
        type: Boolean,
        default: true,
      },
      mobile: {
        type: Boolean,
        default: false,
      },
    },
    emailPreferences: {
      updates: {
        type: Boolean,
        default: true,
      },
      marketing: {
        type: Boolean,
        default: false,
      },
      newsletter: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUserSettings>(
  'UserSettings',
  UserSettingsSchema
);
