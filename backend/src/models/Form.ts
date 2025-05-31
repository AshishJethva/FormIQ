// src/models/Form.ts
import mongoose, { Schema, Document } from 'mongoose';

const OptionSchema = new Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
    type: { type: String }, // Optional type field
  },
  { _id: false } // Don't create _id for options
);

const FieldSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: [
        // Original fields
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
        // NEW: Added 10 new field types
        'shortText',
        'longText',
        'paragraph',
        'dropdown',
        'singleChoice',
        'multipleChoice',
        'number',
        'image',
        'fileUpload',
        'time',
      ],
    },
    label: { type: String, required: true },
    required: {
      type: Boolean,
      default: function () {
        // Only add required property for non-heading fields
        return this.type !== 'heading' ? false : undefined;
      },
    },
    helpText: {
      type: String,
      default: function () {
        // Only add helpText property for non-heading fields
        return this.type !== 'heading' ? '' : undefined;
      },
    },
    labelAlignment: {
      type: String,
      enum: ['LEFT', 'RIGHT'],
      default: 'LEFT',
    },
    // ✅ FIXED: Correct options array definition
    options: {
      type: [OptionSchema],
      default: undefined, // Don't set default empty array
    },
    defaultValue: Schema.Types.Mixed,

    // NEW: Text field properties
    placeholder: { type: String },
    minLength: { type: Number, min: 0 },
    maxLength: { type: Number, min: 1 },

    // NEW: Number field properties
    min: { type: Number },
    max: { type: Number },
    step: { type: Number, default: 1 },

    // NEW: Textarea properties
    rows: { type: Number, min: 1, max: 20, default: 3 },

    // NEW: File upload properties
    multiple: { type: Boolean, default: false },
    accept: { type: String }, // MIME types or file extensions
    propertiesPanelOpen: { type: Boolean, default: false },
  },
  {
    _id: false,
    transform: function (doc, ret) {
      // Remove required and helpText from heading fields
      if (ret.type === 'heading') {
        delete ret.required;
        delete ret.helpText;
      }
      return ret;
    },
  }
);

// Pre-save middleware to clean heading fields
FieldSchema.pre('save', function (next) {
  if (this.type === 'heading') {
    this.required = undefined;
    this.helpText = undefined;
  }
  next();
});

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
    src: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return /^https?:\/\/.+/.test(v) || /^data:image\//.test(v);
        },
        message: 'Logo src must be a valid URL or data URL',
      },
    },
    type: {
      type: String,
      enum: ['uploaded', 'url'],
      required: true,
      default: 'url',
    },
    alignment: {
      type: String,
      enum: ['LEFT', 'CENTER', 'RIGHT'],
      default: 'CENTER',
    },
    size: {
      type: Number,
      min: 10,
      max: 100,
      default: 100, // ✅ Default to maximum size as requested
    },
    publicId: {
      type: String,
      required: false,
    },
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
      default: true,
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
    isEnabled: {
      type: Boolean,
      default: true,
    },
    allowMultipleSubmissions: {
      type: Boolean,
      default: true,
    },
    allowMultipleEmailSubmissions: {
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

    requireEmailVerification: {
      type: Boolean,
      default: false,
    },
    sendSubmissionEmails: {
      type: Boolean,
      default: true,
    },
    submissionLimit: {
      type: Number,
      min: 0,
      default: null, // No limit by default
    },
    submissionDeadline: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

// Pre-save middleware to ensure defaults
SettingsSchema.pre('save', function (next) {
  if (this.allowMultipleSubmissions === undefined) {
    this.allowMultipleSubmissions = true;
  }
  if (this.allowMultipleEmailSubmissions === undefined) {
    this.allowMultipleEmailSubmissions = true;
  }
  next();
});

interface IForm extends Document {
  totalFields: any;
  hasLogo: any;
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  pages: any[];
  selectedFieldId?: string | null;
  selectedPageId?: string | null;
  currentPageIndex?: number;
  propertiesPanelOpen?: boolean;
  logo?: {
    src: string;
    type: 'uploaded' | 'url';
    alignment: 'LEFT' | 'CENTER' | 'RIGHT';
    size: number;
    publicId?: string;
  } | null;
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
  isAIGenerated?: boolean;
  aiPrompt?: string;
  aiModel?: string;
  aiGenerationMetadata?: any;
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
    pages: [PageSchema],
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
    // AI Generation metadata
    isAIGenerated: { type: Boolean, default: false, index: true },
    aiPrompt: { type: String },
    aiModel: { type: String },
    aiGenerationMetadata: {
      promptTokens: { type: Number },
      responseTokens: { type: Number },
      generationTime: { type: Number },
      version: { type: String },
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

        // Clean heading fields in the response
        if (ret.pages) {
          ret.pages.forEach((page: any) => {
            if (page.fields) {
              page.fields.forEach((field: any) => {
                if (field.type === 'heading') {
                  delete field.required;
                  delete field.helpText;
                }
              });
            }
          });
        }

        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
FormSchema.index({ userId: 1, createdAt: -1 });
FormSchema.index({ userId: 1, isPublished: 1 });
FormSchema.index({ userId: 1, isTrashed: 1 });
FormSchema.index({ userId: 1, isArchived: 1 });
FormSchema.index({ userId: 1, isFavorite: 1 });
FormSchema.index({ userId: 1, isAIGenerated: 1 });
FormSchema.index({ title: 'text', description: 'text' });
FormSchema.index({ trashedAt: 1 });
FormSchema.index({ publishedAt: -1 });

// Virtual for form URL
FormSchema.virtual('formUrl').get(function () {
  return `${process.env.FRONTEND_URL || 'http://localhost:3000'}/form/${this._id}`;
});

// Pre-save middleware to ensure required fields
FormSchema.pre<IForm>('save', function (next) {
  // Ensure at least one page exists
  if (!this.pages || this.pages.length === 0) {
    this.pages = [
      {
        id: require('uuid').v4(),
        fields: [],
      },
    ];
  }

  // Set selectedPageId if not set
  if (!this.selectedPageId && this.pages.length > 0) {
    this.selectedPageId = this.pages[0].id;
  }

  next();
});

// Instance methods
FormSchema.methods.getFieldCount = function () {
  return this.pages.reduce((total, page) => {
    return total + (page.fields ? page.fields.length : 0);
  }, 0);
};

FormSchema.methods.getRequiredFieldCount = function () {
  return this.pages.reduce((total, page) => {
    return (
      total +
      (page.fields ? page.fields.filter(field => field.required).length : 0)
    );
  }, 0);
};

// Static method to find AI generated forms
FormSchema.statics.findAIGenerated = function (userId) {
  return this.find({
    userId: userId,
    isAIGenerated: true,
    isTrashed: false,
  }).sort({ createdAt: -1 });
};

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

FormSchema.virtual('totalFields').get(function (this: IForm) {
  return this.pages.reduce(
    (total, page) => total + (page.fields?.length || 0),
    0
  );
});

FormSchema.virtual('hasLogo').get(function (this: IForm) {
  return !!this.logo;
});

FormSchema.virtual('isMultiPage').get(function (this: IForm) {
  return this.pages.length > 1;
});

FormSchema.virtual('submissionRate').get(function (this: IForm) {
  // This would need actual view tracking to be meaningful
  return this.submissions > 0
    ? (this.submissions / Math.max(this.submissions * 2, 10)) * 100
    : 0;
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

// ✅ Pre-save middleware
FormSchema.pre<IForm>('save', function (next) {
  this.lastSaved = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // ✅ Auto-enable logo display if logo is present
  if (this.logo && this.settings) {
    this.settings.showLogo = true;
  }

  // ✅ Ensure proper AI metadata
  if (this.isAIGenerated && this.aiGenerationMetadata) {
    this.aiGenerationMetadata.totalFields = this.totalFields;
    this.aiGenerationMetadata.hasLogo = this.hasLogo;
  }

  // ✅ Set trash date when moving to trash
  if (this.isTrashed && !this.trashedAt) {
    this.trashedAt = new Date();
  } else if (!this.isTrashed) {
    this.trashedAt = undefined;
  }

  next();
});

// ✅ Pre-findOneAndUpdate middleware
FormSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as any;

  if (update) {
    update.lastSaved = new Date();

    // ✅ Handle logo updates
    if (update.logo) {
      if (!update.settings) update.settings = {};
      update['settings.showLogo'] = true;
    }

    // ✅ Handle trash operations
    if (update.isTrashed && !update.trashedAt) {
      update.trashedAt = new Date();
    } else if (update.isTrashed === false) {
      update.trashedAt = null;
    }
  }

  next();
});

FormSchema.methods.addLogo = function (logoData: {
  src: string;
  type: 'uploaded' | 'url';
  alignment?: 'LEFT' | 'CENTER' | 'RIGHT';
  size?: number;
  publicId?: string;
}) {
  this.logo = {
    src: logoData.src,
    type: logoData.type,
    alignment: logoData.alignment || 'CENTER',
    size: logoData.size || 100,
    publicId: logoData.publicId,
  };

  if (!this.settings) this.settings = {};
  this.settings.showLogo = true;

  return this.save();
};

FormSchema.methods.removeLogo = function () {
  this.logo = null;
  if (this.settings) {
    this.settings.showLogo = false;
  }
  return this.save();
};

FormSchema.methods.updateSettings = function (newSettings: any) {
  this.settings = { ...this.settings, ...newSettings };
  return this.save();
};

FormSchema.methods.addField = function (pageId: string, field: any) {
  const page = this.pages.find(p => p.id === pageId);
  if (!page) throw new Error('Page not found');

  if (!page.fields) page.fields = [];
  page.fields.push(field);

  return this.save();
};

FormSchema.methods.removeField = function (pageId: string, fieldId: string) {
  const page = this.pages.find(p => p.id === pageId);
  if (!page) throw new Error('Page not found');

  page.fields = page.fields.filter(f => f.id !== fieldId);
  return this.save();
};

FormSchema.methods.moveToTrash = function () {
  this.isTrashed = true;
  this.trashedAt = new Date();
  this.isPublished = false; // Unpublish when trashed
  return this.save();
};

FormSchema.methods.restoreFromTrash = function () {
  this.isTrashed = false;
  this.trashedAt = undefined;
  return this.save();
};

FormSchema.methods.archive = function () {
  this.isArchived = true;
  this.isPublished = false; // Unpublish when archived
  return this.save();
};

FormSchema.methods.unarchive = function () {
  this.isArchived = false;
  return this.save();
};

FormSchema.methods.publish = function () {
  if (this.isTrashed) throw new Error('Cannot publish trashed form');
  if (this.isArchived) throw new Error('Cannot publish archived form');

  this.isPublished = true;
  return this.save();
};

FormSchema.methods.unpublish = function () {
  this.isPublished = false;
  return this.save();
};

// ✅ Static methods for enhanced queries
FormSchema.statics.findAIGenerated = function (
  userId: string,
  options: any = {}
) {
  const query = {
    userId,
    isAIGenerated: true,
    isTrashed: false,
    ...options,
  };
  return this.find(query).sort({ createdAt: -1 });
};

FormSchema.statics.findWithLogo = function (userId: string) {
  return this.find({
    userId,
    logo: { $ne: null },
    isTrashed: false,
  }).sort({ createdAt: -1 });
};

FormSchema.statics.findByStatus = function (userId: string, status: string) {
  const query: any = { userId };

  switch (status) {
    case 'published':
      query.isPublished = true;
      query.isTrashed = false;
      break;
    case 'draft':
      query.isPublished = false;
      query.isTrashed = false;
      query.isArchived = false;
      break;
    case 'archived':
      query.isArchived = true;
      break;
    case 'trashed':
      query.isTrashed = true;
      break;
    case 'favorites':
      query.isFavorite = true;
      query.isTrashed = false;
      break;
    default:
      query.isTrashed = false;
  }

  return this.find(query).sort({ createdAt: -1 });
};

FormSchema.statics.getAIStats = function (userId: string) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalForms: { $sum: 1 },
        aiForms: { $sum: { $cond: ['$isAIGenerated', 1, 0] } },
        aiFormsWithLogo: {
          $sum: {
            $cond: [
              { $and: ['$isAIGenerated', { $ne: ['$logo', null] }] },
              1,
              0,
            ],
          },
        },
        avgGenerationTime: {
          $avg: {
            $cond: [
              '$isAIGenerated',
              '$aiGenerationMetadata.generationTime',
              null,
            ],
          },
        },
        avgFieldsPerAIForm: {
          $avg: {
            $cond: [
              '$isAIGenerated',
              {
                $sum: {
                  $map: {
                    input: '$pages',
                    as: 'page',
                    in: { $size: '$page.fields' },
                  },
                },
              },
              null,
            ],
          },
        },
      },
    },
  ]);
};

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
        page.fields?.map((field: any) => {
          const newField = {
            ...field,
            id: new mongoose.Types.ObjectId().toString(),
          };

          // Clean heading fields during duplication
          if (field.type === 'heading') {
            delete newField.required;
            delete newField.helpText;
          }

          return newField;
        }) || [],
    })),
    logo: this.logo,
    settings: this.settings,
    labels: this.labels,
    isPublished: false,
  });

  return duplicatedForm.save();
};

export default mongoose.model<IForm>('Form', FormSchema);
