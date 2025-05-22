// src/models/Label.ts - Label Model
import mongoose, { Schema, Document } from 'mongoose';

interface ILabel extends Document {
  name: string;
  color: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const labelSchema = new Schema<ILabel>(
  {
    name: {
      type: String,
      required: [true, 'Label name is required'],
      trim: true,
      maxlength: [50, 'Label name cannot exceed 50 characters'],
    },
    color: {
      type: String,
      required: [true, 'Label color is required'],
      match: [
        /^#[0-9A-F]{6}$/i,
        'Invalid color format. Use hex format like #FF0000',
      ],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
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
    toObject: { virtuals: true },
  }
);

// Virtual for id field
labelSchema.virtual('id').get(function () {
  return this._id.toString();
});

// Compound index for user and label name uniqueness
labelSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model<ILabel>('Label', labelSchema);
