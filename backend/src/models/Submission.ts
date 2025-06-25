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
  files?: Array<{
    fieldId: string;
    originalName: string;
    fileName: string;
    url: string;
    publicId: string;
    size: number;
    mimeType: string;
    uploadedAt: Date;
  }>;
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
      index: true,
    },
    userAgent: { type: String },
    referrer: { type: String },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    // Array to store file upload information
    files: {
      type: [
        {
          fieldId: { type: String, required: true },
          originalName: { type: String, required: true },
          fileName: { type: String, required: true },
          url: { type: String, required: true },
          publicId: { type: String, required: true },
          size: { type: Number, required: true },
          mimeType: { type: String, required: true },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
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
submissionSchema.index({ ipAddress: 1, submittedAt: -1 });

// Virtual for total file size
submissionSchema.virtual('totalFileSize').get(function (this: ISubmission) {
  if (!this.files || this.files.length === 0) return 0;
  return this.files.reduce((total, file) => total + file.size, 0);
});

// Virtual for file count
submissionSchema.virtual('fileCount').get(function (this: ISubmission) {
  return this.files ? this.files.length : 0;
});

// Pre-save middleware to update file metadata
submissionSchema.pre<ISubmission>('save', function (next) {
  if (this.files && this.files.length > 0) {
    this.files.forEach(file => {
      if (!file.uploadedAt) {
        file.uploadedAt = new Date();
      }
    });
  }
  next();
});

export default mongoose.model<ISubmission>('Submission', submissionSchema);
