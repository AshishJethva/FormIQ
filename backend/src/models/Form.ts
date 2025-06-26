// src/models/Form.ts

import mongoose, { Schema, Document } from 'mongoose';

const OptionSchema = new Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    value: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    type: {
      type: String,
      maxlength: 50,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
    strict: true,
  }
);

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
    label: { type: String, required: true, trim: true, maxlength: 200 },
    required: {
      type: Boolean,
      default: function (this: any) {
        return this.type !== 'heading' ? false : undefined;
      },
    },
    helpText: {
      type: String,
      default: function (this: any) {
        return this.type !== 'heading' ? '' : undefined;
      },
    },
    labelAlignment: {
      type: String,
      enum: ['LEFT', 'RIGHT'],
      default: 'LEFT',
    },
    options: {
      type: [OptionSchema],
      default: undefined,
      validate: {
        validator: function (this: any, options: any[]) {
          if (!options) return true;

          const choiceFields = ['dropdown', 'singleChoice', 'multipleChoice'];
          if (choiceFields.includes(this.type)) {
            if (!Array.isArray(options) || options.length === 0) {
              return false;
            }

            return options.every(
              option =>
                option &&
                typeof option === 'object' &&
                option.label &&
                option.value &&
                typeof option.label === 'string' &&
                typeof option.value === 'string'
            );
          }
          return true;
        },
        message:
          'Choice fields must have at least one valid option with label and value',
      },
    },

    correctAnswer: {
      type: String,
      default: undefined,
      validate: {
        validator: function (this: any, correctAnswer: string) {
          // Only validate correctAnswer if it exists
          if (!correctAnswer) return true;

          const choiceFields = ['dropdown', 'singleChoice', 'multipleChoice'];
          if (choiceFields.includes(this.type)) {
            // Check if correctAnswer matches one of the option values
            const options = this.options;
            if (options && Array.isArray(options)) {
              return options.some(
                (option: any) => option.value === correctAnswer
              );
            }
          }
          return true;
        },
        message: 'correctAnswer must match one of the option values',
      },
    },

    defaultValue: Schema.Types.Mixed,

    // Text field properties
    placeholder: { type: String, maxlength: 100 },
    minLength: { type: Number, min: 0, max: 1000 },
    maxLength: { type: Number, min: 1, max: 10000 },

    // Number field properties
    min: { type: Number },
    max: { type: Number },
    step: { type: Number, default: 1, min: 0.01 },

    // Textarea properties
    rows: { type: Number, min: 1, max: 20, default: 3 },

    // File upload properties
    multiple: { type: Boolean, default: false },
    accept: { type: String, maxlength: 200 }, // MIME types or file extensions

    // Fill blank template configuration
    fillBlankTemplate: {
      beforeText: { type: String, maxlength: 500, default: 'I agree to the' },
      blankPlaceholder: { type: String, maxlength: 100, default: 'terms' },
      afterText: { type: String, maxlength: 500, default: 'and conditions.' },
    },

    // Product list configuration
    productListConfig: {
      products: [
        {
          id: { type: String, required: true },
          name: { type: String, required: true, maxlength: 200 },
          price: { type: Number, required: true, min: 0 },
          quantity: { type: Number, default: 1, min: 0 },
          _id: false,
        },
      ],
    },

    propertiesPanelOpen: { type: Boolean, default: false },
  },
  {
    _id: false,
    strict: true,
    transform: function (ret: {
      type: string;
      required: any;
      helpText: any;
      correctAnswer: any;
    }) {
      if (ret.type === 'heading') {
        delete ret.required;
        delete ret.helpText;
        delete ret.correctAnswer;
      }
      return ret;
    },
  }
);

// Pre-save middleware to clean heading fields
FieldSchema.pre('save', function (next) {
  if (this.type === 'heading') {
    this.required = null;
    this.helpText = null;
    this.options = null;
    this.correctAnswer = null;
  }

  // Validate choice fields have options
  const choiceFields = ['dropdown', 'singleChoice', 'multipleChoice'];
  if (choiceFields.includes(this.type)) {
    if (
      !this.options ||
      !Array.isArray(this.options) ||
      this.options.length === 0
    ) {
      // Auto-generate default options if missing
      this.options = [
        { label: 'Option 1', value: 'option1', isCorrect: false },
        { label: 'Option 2', value: 'option2', isCorrect: true },
        { label: 'Option 3', value: 'option3', isCorrect: false },
      ] as any;
      this.correctAnswer = 'option2'; // Set default correct answer
    } else {
      // If options exist, ensure correctAnswer is set if any option is marked correct
      const correctOption = this.options.find((opt: any) => opt.isCorrect);
      if (correctOption && !this.correctAnswer) {
        this.correctAnswer = correctOption.value;
      }
      // If correctAnswer is set, mark the corresponding option as correct
      if (this.correctAnswer && !correctOption) {
        const targetOption = this.options.find(
          (opt: any) => opt.value === this.correctAnswer
        );
        if (targetOption) {
          targetOption.isCorrect = true;
        }
      }
    }
  }

  next();
});

// Page Schema
const PageSchema = new Schema(
  {
    id: { type: String, required: true },
    fields: [FieldSchema],
  },
  { _id: false, strict: true }
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
      default: 100,
    },
    publicId: {
      type: String,
      required: false,
    },
  },
  { _id: false, strict: true }
);

// Settings Schema
const SettingsSchema = new Schema(
  {
    submitButtonText: {
      type: String,
      default: 'Submit',
      maxlength: 50,
    },
    showLogo: {
      type: Boolean,
      default: true,
    },
    thankyouMessage: {
      type: String,
      default: 'Thank you for your submission!',
      maxlength: 1000,
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
  { _id: false, strict: true }
);

// Pre-save middleware to ensure defaults
SettingsSchema.pre('save', function (next) {
  // Ensure multiple submissions defaults
  if (this.allowMultipleSubmissions === undefined) {
    this.allowMultipleSubmissions = true;
  }
  if (this.allowMultipleEmailSubmissions === undefined) {
    this.allowMultipleEmailSubmissions = true;
  }
  // Ensure logo is shown by default
  if (this.showLogo === undefined) {
    this.showLogo = true;
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
  aiUpdateHistory?: {
    prompt: string;
    summary: string;
    timestamp: Date;
    model: string;
    fieldsAdded: number;
    fieldsModified: number;
    fieldsRemoved: number;
  }[];
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
      default: () => ({
        submitButtonText: 'Submit',
        showLogo: true,
        thankyouMessage: 'Thank you for your submission!',
        defaultLabelAlignment: 'LEFT',
        defaultRequiredField: false,
        isEnabled: true,
        allowMultipleSubmissions: true,
        allowMultipleEmailSubmissions: true,
        collectIpAddress: true,
        enableCaptcha: false,
        requireEmailVerification: false,
        sendSubmissionEmails: true,
        submissionLimit: null,
        submissionDeadline: null,
      }),
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
    aiPrompt: { type: String, maxlength: 2000 },
    aiModel: { type: String, maxlength: 100 },
    aiGenerationMetadata: {
      promptTokens: { type: Number },
      responseTokens: { type: Number },
      generationTime: { type: Number },
      version: { type: String, maxlength: 50 },
      hasLogo: { type: Boolean },
      logoSource: { type: String, maxlength: 500 },
      logoType: { type: String, maxlength: 50 },
      contentConfidence: Number,
      attempts: Number,
      nameChanged: Boolean,
      originalName: String,
      finalName: String,
      // Add update tracking
      totalUpdates: {
        type: Number,
        default: 0,
      },
      lastUpdateAt: Date,
      updateMethods: [
        {
          type: String,
          enum: ['ai_prompt', 'manual_edit', 'ai_regeneration'],
        },
      ],
    },
    aiUpdateHistory: [
      {
        prompt: {
          type: String,
          required: true,
        },
        summary: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        model: {
          type: String,
          default: 'gemini-2.0-flash-lite',
        },
        fieldsAdded: {
          type: Number,
          default: 0,
        },
        fieldsModified: {
          type: Number,
          default: 0,
        },
        fieldsRemoved: {
          type: Number,
          default: 0,
        },
      },
    ],
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
                  delete field.options;
                  delete field.correctAnswer;
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
FormSchema.index({ 'aiUpdateHistory.timestamp': -1 });

// Virtual for form URL
FormSchema.virtual('formUrl').get(function () {
  return `${
    process.env.FRONTEND_URL || 'http://localhost:3000'
  }/form/${this._id}`;
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

  if (!this.settings) {
    this.settings = {
      submitButtonText: 'Submit',
      showLogo: true,
      thankyouMessage: 'Thank you for your submission!',
      defaultLabelAlignment: 'LEFT',
      defaultRequiredField: false,
      isEnabled: true,
      allowMultipleSubmissions: true,
      allowMultipleEmailSubmissions: true,
      collectIpAddress: true,
      enableCaptcha: false,
      requireEmailVerification: false,
      sendSubmissionEmails: true,
      submissionLimit: null,
      submissionDeadline: null,
    };
  } else {
    if (this.settings.allowMultipleSubmissions === undefined) {
      this.settings.allowMultipleSubmissions = true;
    }
    if (this.settings.allowMultipleEmailSubmissions === undefined) {
      this.settings.allowMultipleEmailSubmissions = true;
    }
    if (this.settings.showLogo === undefined) {
      this.settings.showLogo = true;
    }
    if (this.settings.isEnabled === undefined) {
      this.settings.isEnabled = true;
    }
  }

  // Auto-enable logo display if logo is present
  if (this.logo && this.settings) {
    this.settings.showLogo = true;
  }

  // Update lastSaved timestamp
  this.lastSaved = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

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

// Instance methods
FormSchema.methods.getFieldCount = function () {
  return this.pages.reduce((total: any, page: { fields: string | any[] }) => {
    return total + (page.fields ? page.fields.length : 0);
  }, 0);
};

FormSchema.methods.getRequiredFieldCount = function () {
  return this.pages.reduce(
    (
      total: any,
      page: {
        fields: {
          filter: (arg0: (field: any) => any) => {
            (): any;
            new (): any;
            length: any;
          };
        };
      }
    ) => {
      return (
        total +
        (page.fields
          ? page.fields.filter((field: { required: any }) => field.required)
              .length
          : 0)
      );
    },
    0
  );
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

// Pre-save middleware
FormSchema.pre<IForm>('save', function (next) {
  this.lastSaved = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Auto-enable logo display if logo is present
  if (this.logo && this.settings) {
    this.settings.showLogo = true;
  }

  // Ensure proper AI metadata
  if (this.isAIGenerated && this.aiGenerationMetadata) {
    this.aiGenerationMetadata.totalFields = this.totalFields;
    this.aiGenerationMetadata.hasLogo = this.hasLogo;
  }

  // Set trash date when moving to trash
  if (this.isTrashed && !this.trashedAt) {
    this.trashedAt = new Date();
  } else if (!this.isTrashed) {
    this.trashedAt = undefined;
  }

  next();
});

// Pre-findOneAndUpdate middleware
FormSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as any;

  if (update) {
    update.lastSaved = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Handle logo updates
    if (update.logo) {
      if (!update.settings) update.settings = {};
      update['settings.showLogo'] = true;
    }

    // Ensure defaults for submission controls in updates
    if (update.settings) {
      if (update.settings.allowMultipleSubmissions === undefined) {
        update.settings.allowMultipleSubmissions = true;
      }
      if (update.settings.allowMultipleEmailSubmissions === undefined) {
        update.settings.allowMultipleEmailSubmissions = true;
      }
      if (update.settings.showLogo === undefined) {
        update.settings.showLogo = true;
      }
    }

    // Handle trash operations
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

  if (!this.settings) {
    this.settings = {
      submitButtonText: 'Submit',
      showLogo: true,
      thankyouMessage: 'Thank you for your submission!',
      defaultLabelAlignment: 'LEFT',
      defaultRequiredField: false,
      isEnabled: true,
      allowMultipleSubmissions: true,
      allowMultipleEmailSubmissions: true,
      collectIpAddress: true,
      enableCaptcha: false,
      requireEmailVerification: false,
      sendSubmissionEmails: true,
      submissionLimit: null,
      submissionDeadline: null,
    };
  }

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
  const defaultSettings = {
    submitButtonText: 'Submit',
    showLogo: true,
    thankyouMessage: 'Thank you for your submission!',
    defaultLabelAlignment: 'LEFT',
    defaultRequiredField: false,
    isEnabled: true,
    allowMultipleSubmissions: true,
    allowMultipleEmailSubmissions: true,
    collectIpAddress: true,
    enableCaptcha: false,
    requireEmailVerification: false,
    sendSubmissionEmails: true,
    submissionLimit: null,
    submissionDeadline: null,
  };

  this.settings = {
    ...defaultSettings,
    ...this.settings,
    ...newSettings,
  };

  return this.save();
};

FormSchema.methods.addField = function (pageId: string, field: any) {
  const page = this.pages.find((p: { id: string }) => p.id === pageId);
  if (!page) throw new Error('Page not found');

  if (!page.fields) page.fields = [];
  page.fields.push(field);

  return this.save();
};

FormSchema.methods.removeField = function (pageId: string, fieldId: string) {
  const page = this.pages.find((p: { id: string }) => p.id === pageId);
  if (!page) throw new Error('Page not found');

  page.fields = page.fields.filter((f: { id: string }) => f.id !== fieldId);
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

// Static method for creating forms with proper defaults
FormSchema.statics.createWithDefaults = function (formData: any) {
  const defaultSettings = {
    submitButtonText: 'Submit',
    showLogo: true,
    thankyouMessage: 'Thank you for your submission!',
    defaultLabelAlignment: 'LEFT',
    defaultRequiredField: false,
    isEnabled: true,
    allowMultipleSubmissions: true,
    allowMultipleEmailSubmissions: true,
    collectIpAddress: true,
    enableCaptcha: false,
    requireEmailVerification: false,
    sendSubmissionEmails: true,
    submissionLimit: null,
    submissionDeadline: null,
  };

  const formWithDefaults = {
    ...formData,
    settings: {
      ...defaultSettings,
      ...(formData.settings || {}),
    },
  };

  return this.create(formWithDefaults);
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
