// src/models/Submission.ts - Submission Model
import mongoose, { Schema, Document } from 'mongoose';

interface ISubmission extends Document {
  formId: mongoose.Types.ObjectId;
  data: Record<string, any>;
  submittedAt: Date;
  ipAddress?: string;
  userAgent?: string;
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
          return (
            data && typeof data === 'object' && Object.keys(data).length > 0
          );
        },
        message: 'Submission data cannot be empty',
      },
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ipAddress: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
submissionSchema.index({ formId: 1, submittedAt: -1 });
submissionSchema.index({ formId: 1, createdAt: -1 });

export default mongoose.model<ISubmission>('Submission', submissionSchema);
