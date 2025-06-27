// src/models/FormHistorySnapshot.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFormHistorySnapshot extends Document {
  formId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  snapshotData: {
    title: string;
    description?: string;
    pages: any[];
    settings: any;
    logo?: any;
    selectedPageId?: string;
    currentPageIndex?: number;
  };
  metadata: {
    changeType: 'ai_update' | 'manual_edit' | 'initial_state' | 'restore';
    updatePrompt?: string;
    updateSummary?: string;
    aiModel?: string;
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
  };
  snapshotIndex: number;
  isActive: boolean;
  parentSnapshotId?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

// Interface for static methods
export interface IFormHistorySnapshotModel extends Model<IFormHistorySnapshot> {
  getFormHistory(
    formId: string,
    userId: string,
    limit?: number
  ): Promise<IFormHistorySnapshot[]>;

  getCurrentSnapshot(
    formId: string,
    userId: string
  ): Promise<IFormHistorySnapshot | null>;

  getSnapshotAtIndex(
    formId: string,
    userId: string,
    index: number
  ): Promise<IFormHistorySnapshot | null>;

  cleanupOldSnapshots(
    formId: string,
    userId: string,
    keepCount?: number
  ): Promise<any>;

  getHistoryStats(formId: string, userId: string): Promise<any[]>;
}

const FormHistorySnapshotSchema = new Schema<IFormHistorySnapshot>(
  {
    formId: {
      type: Schema.Types.ObjectId,
      ref: 'Form',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    snapshotData: {
      title: { type: String, required: true },
      description: { type: String, default: '' },
      pages: { type: [Schema.Types.Mixed], required: true },
      settings: { type: Schema.Types.Mixed, required: true },
      logo: { type: Schema.Types.Mixed, default: null },
      selectedPageId: { type: String },
      currentPageIndex: { type: Number, default: 0 },
    },
    metadata: {
      changeType: {
        type: String,
        enum: ['ai_update', 'manual_edit', 'initial_state', 'restore'],
        required: true,
      },
      updatePrompt: { type: String },
      updateSummary: { type: String },
      aiModel: { type: String, default: 'gemini-2.0-flash-lite' },
      userAgent: { type: String },
      ipAddress: { type: String },
      sessionId: { type: String },
    },
    snapshotIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    parentSnapshotId: {
      type: Schema.Types.ObjectId,
      ref: 'FormHistorySnapshot',
      default: null,
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

// Compound indexes for performance
FormHistorySnapshotSchema.index({ formId: 1, snapshotIndex: 1 });
FormHistorySnapshotSchema.index({ formId: 1, createdAt: -1 });
FormHistorySnapshotSchema.index({ userId: 1, createdAt: -1 });
FormHistorySnapshotSchema.index({ formId: 1, isActive: 1, snapshotIndex: -1 });

// Virtual for snapshot age
FormHistorySnapshotSchema.virtual('age').get(function (
  this: IFormHistorySnapshot
) {
  return Date.now() - this.createdAt.getTime();
});

// Static method implementations
FormHistorySnapshotSchema.statics.getFormHistory = function (
  formId: string,
  userId: string,
  limit: number = 50
) {
  return this.find({
    formId: new mongoose.Types.ObjectId(formId),
    userId: new mongoose.Types.ObjectId(userId),
    isActive: true,
  })
    .sort({ snapshotIndex: -1 })
    .limit(limit)
    .lean();
};

FormHistorySnapshotSchema.statics.getCurrentSnapshot = function (
  formId: string,
  userId: string
) {
  return this.findOne({
    formId: new mongoose.Types.ObjectId(formId),
    userId: new mongoose.Types.ObjectId(userId),
    isActive: true,
  })
    .sort({ snapshotIndex: -1 })
    .lean();
};

FormHistorySnapshotSchema.statics.getSnapshotAtIndex = function (
  formId: string,
  userId: string,
  index: number
) {
  return this.findOne({
    formId: new mongoose.Types.ObjectId(formId),
    userId: new mongoose.Types.ObjectId(userId),
    snapshotIndex: index,
    isActive: true,
  }).lean();
};

FormHistorySnapshotSchema.statics.cleanupOldSnapshots = function (
  formId: string,
  userId: string,
  keepCount: number = 50
) {
  return this.updateMany(
    {
      formId: new mongoose.Types.ObjectId(formId),
      userId: new mongoose.Types.ObjectId(userId),
      snapshotIndex: { $lt: -keepCount }, // Keep last 'keepCount' snapshots
    },
    { isActive: false }
  );
};

FormHistorySnapshotSchema.statics.getHistoryStats = function (
  formId: string,
  userId: string
) {
  return this.aggregate([
    {
      $match: {
        formId: new mongoose.Types.ObjectId(formId),
        userId: new mongoose.Types.ObjectId(userId),
        isActive: true,
      },
    },
    {
      $group: {
        _id: null,
        totalSnapshots: { $sum: 1 },
        aiUpdates: {
          $sum: {
            $cond: [{ $eq: ['$metadata.changeType', 'ai_update'] }, 1, 0],
          },
        },
        manualEdits: {
          $sum: {
            $cond: [{ $eq: ['$metadata.changeType', 'manual_edit'] }, 1, 0],
          },
        },
        maxIndex: { $max: '$snapshotIndex' },
        minIndex: { $min: '$snapshotIndex' },
        lastUpdate: { $max: '$createdAt' },
      },
    },
  ]);
};

// Pre-save middleware for automatic cleanup
FormHistorySnapshotSchema.pre('save', async function (next) {
  if (this.isNew) {
    // Auto-cleanup old snapshots when creating new ones
    const MAX_SNAPSHOTS_PER_FORM = 100;
    const Model = this.constructor as IFormHistorySnapshotModel;
    const count = await Model.countDocuments({
      formId: this.formId,
      userId: this.userId,
      isActive: true,
    });

    if (count >= MAX_SNAPSHOTS_PER_FORM) {
      // Deactivate oldest snapshots
      await Model.updateMany(
        {
          formId: this.formId,
          userId: this.userId,
          isActive: true,
        },
        { isActive: false },
        {
          sort: { snapshotIndex: 1 },
          limit: count - MAX_SNAPSHOTS_PER_FORM + 1,
        }
      );
    }
  }
  next();
});

const FormHistorySnapshot = mongoose.model<
  IFormHistorySnapshot,
  IFormHistorySnapshotModel
>('FormHistorySnapshot', FormHistorySnapshotSchema);

export default FormHistorySnapshot;
