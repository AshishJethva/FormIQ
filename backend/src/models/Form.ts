// // src/models/Form.ts
// import mongoose, { Schema, Document } from 'mongoose';
// import { Form, FormPage, Field, LogoState, FormSettings } from '../types/form';

// interface IForm extends Document, Omit<Form, 'id'> {}

// const fieldSchema = new Schema<Field>({
//   id: { type: String, required: true },
//   type: {
//     type: String,
//     required: true,
//     enum: [
//       'heading',
//       'fullName',
//       'email',
//       'address',
//       'phone',
//       'datePicker',
//       'appointment',
//       'signature',
//       'fillBlank',
//       'productList',
//     ],
//   },
//   label: { type: String, required: true },
//   required: { type: Boolean, default: false },
//   helpText: { type: String },
//   placeholder: { type: String },
//   labelAlignment: {
//     type: String,
//     enum: ['LEFT', 'RIGHT'],
//     default: 'LEFT',
//   },
//   options: [
//     {
//       label: { type: String, required: true },
//       value: { type: String, required: true },
//     },
//   ],
//   defaultValue: { type: Schema.Types.Mixed },
//   propertiesPanelOpen: { type: Boolean, default: false },
// });

// const pageSchema = new Schema<FormPage>({
//   id: { type: String, required: true },
//   fields: [fieldSchema],
// });

// const logoSchema = new Schema<LogoState>({
//   src: { type: String },
//   type: {
//     type: String,
//     enum: ['uploaded', 'url', null],
//     default: null,
//   },
//   alignment: {
//     type: String,
//     enum: ['LEFT', 'CENTER', 'RIGHT'],
//     default: 'CENTER',
//   },
//   size: { type: Number, default: 50, min: 10, max: 200 },
//   publicId: { type: String },
// });

// const settingsSchema = new Schema<FormSettings>({
//   submitButtonText: { type: String, default: 'Submit' },
//   showLogo: { type: Boolean, default: false },
//   thankyouMessage: {
//     type: String,
//     default: 'Thank you for your submission!',
//   },
//   defaultLabelAlignment: {
//     type: String,
//     enum: ['LEFT', 'RIGHT'],
//     default: 'LEFT',
//   },
//   defaultRequiredField: { type: Boolean, default: false },
// });

// const formSchema = new Schema<IForm>(
//   {
//     title: {
//       type: String,
//       required: [true, 'Form title is required'],
//       trim: true,
//       maxlength: [200, 'Title cannot exceed 200 characters'],
//       minlength: [1, 'Title must be at least 1 character long'],
//     },
//     description: {
//       type: String,
//       maxlength: [1000, 'Description cannot exceed 1000 characters'],
//       trim: true,
//     },
//     pages: {
//       type: [pageSchema],
//       default: [],
//       validate: {
//         validator: function (pages: FormPage[]) {
//           return pages.length >= 0;
//         },
//         message: 'Form must have at least one page when not empty',
//       },
//     },
//     selectedFieldId: { type: String, default: null },
//     selectedPageId: { type: String, default: null },
//     currentPageIndex: { type: Number, default: 0, min: 0 },
//     propertiesPanelOpen: { type: Boolean, default: false },
//     logo: { type: logoSchema, default: null },
//     settings: { type: settingsSchema, default: () => ({}) },
//     lastSaved: { type: String },
//     userId: {
//       type: Schema.Types.ObjectId,
//       ref: 'User',
//       required: [true, 'User ID is required'],
//       index: true,
//     },
//     isPublished: { type: Boolean, default: false },
//     submissions: { type: Number, default: 0, min: 0 },
//     labels: {
//       type: [String],
//       default: [],
//       validate: {
//         validator: function (labels: string[]) {
//           return labels.every(
//             label => typeof label === 'string' && label.length > 0
//           );
//         },
//         message: 'All labels must be non-empty strings',
//       },
//     },
//     isFavorite: { type: Boolean, default: false },
//     isArchived: { type: Boolean, default: false },
//     isTrashed: { type: Boolean, default: false },
//     trashedAt: {
//       type: Date,
//       default: null,
//     },
//   },
//   {
//     timestamps: true,
//     toJSON: {
//       virtuals: true,
//       transform: function (doc, ret) {
//         ret.id = ret._id.toString();
//         delete ret._id;
//         delete ret.__v;
//         return ret;
//       },
//     },
//     toObject: { virtuals: true },
//   }
// );

// // Indexes for performance
// formSchema.index({ userId: 1, isPublished: 1 });
// formSchema.index({ userId: 1, isTrashed: 1 });
// formSchema.index({ userId: 1, isArchived: 1 });
// formSchema.index({ userId: 1, isFavorite: 1 });
// formSchema.index({ userId: 1, createdAt: -1 });
// formSchema.index({ trashedAt: 1 });

// // Virtual for id field
// formSchema.virtual('id').get(function () {
//   return this._id.toString();
// });

// // Virtual to calculate days remaining for trashed forms
// formSchema.virtual('daysRemaining').get(function () {
//   if (!this.isTrashed || !this.trashedAt) {
//     return undefined;
//   }

//   const now = new Date();
//   const trashedDate = new Date(this.trashedAt);
//   const daysPassed = Math.floor(
//     (now.getTime() - trashedDate.getTime()) / (1000 * 60 * 60 * 24)
//   );
//   const daysRemaining = Math.max(0, 30 - daysPassed);

//   return daysRemaining;
// });

// // Pre-save middleware to update lastSaved
// formSchema.pre<IForm>('save', function (next) {
//   if (this.isModified() && !this.isNew) {
//     this.lastSaved = new Date().toLocaleTimeString([], {
//       hour: '2-digit',
//       minute: '2-digit',
//     });
//   }
//   next();
// });

// // Pre-save middleware for trash handling
// formSchema.pre<IForm>('save', function (next) {
//   if (this.isModified('isTrashed')) {
//     if (this.isTrashed && !this.trashedAt) {
//       // Form is being moved to trash
//       this.trashedAt = new Date();
//       console.log(`Form ${this._id} moved to trash at ${this.trashedAt}`);
//     } else if (!this.isTrashed) {
//       // Form is being restored from trash
//       this.trashedAt = null;
//       console.log(`Form ${this._id} restored from trash`);
//     }
//   }
//   next();
// });

// export default mongoose.model<IForm>('Form', formSchema);

// src/models/Form.ts - Enhanced Form Model
import mongoose, { Schema, Document } from 'mongoose';
import { pageSchema } from '../validation/formValidation';
import { FormPage } from '../types/form';

// Field Schema
const FieldSchema = new Schema(
  {
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
        label: String,
        value: String,
      },
    ],
    defaultValue: Schema.Types.Mixed,
  },
  { _id: false }
);

// Page Schema
const PageSchema = new Schema(
  {
    id: { type: String, required: true },
    fields: [FieldSchema],
  },
  { _id: false }
);

// Logo Schema
const LogoSchema = new Schema(
  {
    src: { type: String, required: true },
    type: {
      type: String,
      enum: ['uploaded', 'url'],
      required: true,
    },
    alignment: {
      type: String,
      enum: ['LEFT', 'CENTER', 'RIGHT'],
      default: 'CENTER',
    },
    size: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    publicId: String,
  },
  { _id: false }
);

// Settings Schema
const SettingsSchema = new Schema(
  {
    submitButtonText: {
      type: String,
      default: 'Submit',
    },
    showLogo: {
      type: Boolean,
      default: false,
    },
    thankyouMessage: {
      type: String,
      default: 'Thank you for your submission!',
    },
    defaultLabelAlignment: {
      type: String,
      enum: ['LEFT', 'RIGHT'],
      default: 'LEFT',
    },
    defaultRequiredField: {
      type: Boolean,
      default: false,
    },
    allowMultipleSubmissions: {
      type: Boolean,
      default: true,
    },
    collectIpAddress: {
      type: Boolean,
      default: true,
    },
    enableCaptcha: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

// Main Form Interface
interface IForm extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  pages: any[];
  selectedFieldId?: string | null;
  selectedPageId?: string | null;
  currentPageIndex?: number;
  propertiesPanelOpen?: boolean;
  logo?: any | null;
  settings?: any;
  isPublished: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  isFavorite: boolean;
  submissions: number;
  views: number;
  labels: string[];
  lastSaved?: string;
  lastOpenedAt?: Date;
  trashedAt?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Main Form Schema
const FormSchema = new Schema<IForm>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Form title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      minlength: [1, 'Title must be at least 1 character long'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    pages: [
      {
        id: String,
        fields: [
          /* your field schema */
        ],
      },
    ],
    selectedFieldId: {
      type: String,
      default: null,
    },
    selectedPageId: {
      type: String,
      default: null,
    },
    currentPageIndex: {
      type: Number,
      default: 0,
      min: 0,
    },
    propertiesPanelOpen: {
      type: Boolean,
      default: false,
    },
    logo: {
      type: LogoSchema,
      default: null,
    },
    settings: {
      type: SettingsSchema,
      default: () => ({}),
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    isTrashed: {
      type: Boolean,
      default: false,
      index: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
      index: true,
    },
    submissions: {
      type: Number,
      default: 0,
      min: 0,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
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
    lastSaved: {
      type: String,
    },
    lastOpenedAt: {
      type: Date,
      default: Date.now,
    },
    trashedAt: {
      type: Date,
      default: null,
    },
    publishedAt: {
      type: Date,
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
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
FormSchema.index({ userId: 1, createdAt: -1 });
FormSchema.index({ userId: 1, isPublished: 1 });
FormSchema.index({ userId: 1, isTrashed: 1 });
FormSchema.index({ userId: 1, isArchived: 1 });
FormSchema.index({ userId: 1, isFavorite: 1 });
FormSchema.index({ title: 'text', description: 'text' });
FormSchema.index({ trashedAt: 1 });
FormSchema.index({ publishedAt: -1 });

// Virtual for form URL
FormSchema.virtual('formUrl').get(function () {
  return `${process.env.FRONTEND_URL || 'http://localhost:3000'}/form/${this._id}`;
});

// Virtual for days remaining in trash
FormSchema.virtual('daysRemaining').get(function (this: IForm) {
  if (!this.isTrashed || !this.trashedAt) {
    return undefined;
  }
  const now = new Date();
  const trashedDate = new Date(this.trashedAt);
  const daysPassed = Math.floor(
    (now.getTime() - trashedDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0, 30 - daysPassed);
});

// Pre-save middleware to update timestamps
FormSchema.pre<IForm>('save', function (next) {
  if (this.isModified() && !this.isNew) {
    this.lastSaved = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    this.lastOpenedAt = new Date();
  }

  // Handle publish state changes
  if (this.isModified('isPublished')) {
    if (this.isPublished && !this.publishedAt) {
      this.publishedAt = new Date();
    } else if (!this.isPublished) {
      this.publishedAt = null;
    }
  }

  // Handle trash state changes
  if (this.isModified('isTrashed')) {
    if (this.isTrashed && !this.trashedAt) {
      this.trashedAt = new Date();
    } else if (!this.isTrashed) {
      this.trashedAt = null;
    }
  }

  next();
});

// Static methods
FormSchema.statics.getPublished = function () {
  return this.find({
    isPublished: true,
    isTrashed: false,
    isArchived: false,
  });
};

FormSchema.statics.cleanupOldTrashed = function (
  userId: mongoose.Types.ObjectId
) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return this.deleteMany({
    userId,
    isTrashed: true,
    trashedAt: { $lte: thirtyDaysAgo },
  });
};

// Instance methods
FormSchema.methods.getSubmissionRate = function () {
  if (this.views === 0) return 0;
  return (this.submissions / this.views) * 100;
};

FormSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

FormSchema.methods.duplicate = function () {
  const duplicatedForm = new (this.constructor as any)({
    userId: this.userId,
    title: `${this.title} (Copy)`,
    description: this.description,
    pages: this.pages.map((page: any) => ({
      ...page,
      id: new mongoose.Types.ObjectId().toString(),
      fields:
        page.fields?.map((field: any) => ({
          ...field,
          id: new mongoose.Types.ObjectId().toString(),
        })) || [],
    })),
    logo: this.logo,
    settings: this.settings,
    labels: this.labels,
    isPublished: false,
  });

  return duplicatedForm.save();
};

export default mongoose.model<IForm>('Form', FormSchema);
