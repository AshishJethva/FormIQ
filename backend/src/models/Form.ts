// src/models/Form.ts
import mongoose, { Schema, Document } from 'mongoose';
import { Form, FormPage, Field, LogoState, FormSettings } from '../types/form';

interface IForm extends Document, Omit<Form, 'id'> {}

const fieldSchema = new Schema<Field>({
  id: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: [
      'heading',
      'fullName',
      'email',
      'address',
      'phone',
      'datePicker',
      'appointment',
      'signature',
      'fillBlank',
      'productList',
    ],
  },
  label: { type: String, required: true },
  required: { type: Boolean, default: false },
  helpText: { type: String },
  placeholder: { type: String },
  labelAlignment: {
    type: String,
    enum: ['LEFT', 'RIGHT'],
    default: 'LEFT',
  },
  options: [
    {
      label: { type: String, required: true },
      value: { type: String, required: true },
    },
  ],
  defaultValue: { type: Schema.Types.Mixed },
  propertiesPanelOpen: { type: Boolean, default: false },
});

const pageSchema = new Schema<FormPage>({
  id: { type: String, required: true },
  fields: [fieldSchema],
});

const logoSchema = new Schema<LogoState>({
  src: { type: String },
  type: {
    type: String,
    enum: ['uploaded', 'url', null],
    default: null,
  },
  alignment: {
    type: String,
    enum: ['LEFT', 'CENTER', 'RIGHT'],
    default: 'CENTER',
  },
  size: { type: Number, default: 50, min: 10, max: 200 },
  publicId: { type: String },
});

const settingsSchema = new Schema<FormSettings>({
  submitButtonText: { type: String, default: 'Submit' },
  showLogo: { type: Boolean, default: false },
  thankyouMessage: {
    type: String,
    default: 'Thank you for your submission!',
  },
  defaultLabelAlignment: {
    type: String,
    enum: ['LEFT', 'RIGHT'],
    default: 'LEFT',
  },
  defaultRequiredField: { type: Boolean, default: false },
});

const formSchema = new Schema<IForm>(
  {
    title: {
      type: String,
      required: [true, 'Form title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      minlength: [1, 'Title must be at least 1 character long'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      trim: true,
    },
    pages: {
      type: [pageSchema],
      default: [],
      validate: {
        validator: function (pages: FormPage[]) {
          return pages.length >= 0;
        },
        message: 'Form must have at least one page when not empty',
      },
    },
    selectedFieldId: { type: String, default: null },
    selectedPageId: { type: String, default: null },
    currentPageIndex: { type: Number, default: 0, min: 0 },
    propertiesPanelOpen: { type: Boolean, default: false },
    logo: { type: logoSchema, default: null },
    settings: { type: settingsSchema, default: () => ({}) },
    lastSaved: { type: String },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    isPublished: { type: Boolean, default: false },
    submissions: { type: Number, default: 0, min: 0 },
    labels: {
      type: [String],
      default: [],
      validate: {
        validator: function (labels: string[]) {
          return labels.every(
            label => typeof label === 'string' && label.length > 0
          );
        },
        message: 'All labels must be non-empty strings',
      },
    },
    isFavorite: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    isTrashed: { type: Boolean, default: false },
    trashedAt: {
      type: Date,
      default: null,
      index: { expireAfterSeconds: 30 * 24 * 60 * 60 }, // 30 days
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

// Indexes for performance
formSchema.index({ userId: 1, isPublished: 1 });
formSchema.index({ userId: 1, isTrashed: 1 });
formSchema.index({ userId: 1, isArchived: 1 });
formSchema.index({ userId: 1, isFavorite: 1 });
formSchema.index({ userId: 1, createdAt: -1 });

// Virtual for id field
formSchema.virtual('id').get(function () {
  return this._id.toString();
});

// Pre-save middleware to update lastSaved
formSchema.pre<IForm>('save', function (next) {
  if (this.isModified() && !this.isNew) {
    this.lastSaved = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  next();
});

// Pre-save middleware for trash handling
formSchema.pre<IForm>('save', function (next) {
  if (this.isModified('isTrashed') && this.isTrashed && !this.trashedAt) {
    this.trashedAt = new Date();
  } else if (this.isModified('isTrashed') && !this.isTrashed) {
    this.trashedAt = null;
  }
  next();
});

export default mongoose.model<IForm>('Form', formSchema);
