// src/models/Submission.ts - Submission Model
import mongoose, { Schema, Document } from 'mongoose';

interface ISubmission extends Document {
  formId: mongoose.Types.ObjectId;
  data: Record<string, any>;
  submittedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  status: 'pending' | 'processed' | 'failed';
  isRead: boolean;
  tags: string[];
  metadata?: Record<string, any>;
}

const submissionSchema = new Schema<ISubmission>(
  {
    formId: {
      type: Schema.Types.ObjectId,
      ref: 'Form',
      required: [true, 'Form ID is required'],
      index: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: [true, 'Submission data is required'],
      validate: {
        validator: function (data: any) {
          return data && typeof data === 'object';
        },
        message: 'Submission data must be an object',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'processed',
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ipAddress: {
      type: String,
      index: true, // For duplicate submission checks
    },
    userAgent: { type: String },
    referrer: { type: String },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for efficient queries
submissionSchema.index({ formId: 1, submittedAt: -1 });
submissionSchema.index({ formId: 1, createdAt: -1 });
submissionSchema.index({ formId: 1, isRead: 1 });
submissionSchema.index({ formId: 1, status: 1 });
submissionSchema.index({ ipAddress: 1, submittedAt: -1 }); // For duplicate checks

export default mongoose.model<ISubmission>('Submission', submissionSchema);
