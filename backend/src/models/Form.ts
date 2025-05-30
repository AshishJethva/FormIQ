// // src/models/Form.ts
// import mongoose, { Schema, Document } from 'mongoose';

// const FieldSchema = new Schema(
//   {
//     id: { type: String, required: true },
//     type: {
//       type: String,
//       required: true,
//       enum: [
//         // Original fields
//         'heading',
//         'fullName',
//         'email',
//         'address',
//         'phone',
//         'datePicker',
//         'appointment',
//         'signature',
//         'fillBlank',
//         'productList',
//         // ✅ NEW: Added 10 new field types
//         'shortText',
//         'longText',
//         'paragraph',
//         'dropdown',
//         'singleChoice',
//         'multipleChoice',
//         'number',
//         'image',
//         'fileUpload',
//         'time',
//       ],
//     },
//     label: { type: String, required: true },
//     required: {
//       type: Boolean,
//       default: function () {
//         // Only add required property for non-heading fields
//         return this.type !== 'heading' ? false : undefined;
//       },
//     },
//     helpText: {
//       type: String,
//       default: function () {
//         // Only add helpText property for non-heading fields
//         return this.type !== 'heading' ? '' : undefined;
//       },
//     },
//     labelAlignment: {
//       type: String,
//       enum: ['LEFT', 'RIGHT'],
//       default: 'LEFT',
//     },
//     // ✅ NEW: Enhanced options for choice fields
//     options: [
//       {
//         label: String,
//         value: String,
//         type: String,
//       },
//     ],
//     defaultValue: Schema.Types.Mixed,

//     // ✅ NEW: Text field properties
//     placeholder: { type: String },
//     minLength: { type: Number, min: 0 },
//     maxLength: { type: Number, min: 1 },

//     // ✅ NEW: Number field properties
//     min: { type: Number },
//     max: { type: Number },
//     step: { type: Number, default: 1 },

//     // ✅ NEW: Textarea properties
//     rows: { type: Number, min: 1, max: 20, default: 3 },

//     // ✅ NEW: File upload properties
//     multiple: { type: Boolean, default: false },
//     accept: { type: String }, // MIME types or file extensions
//   },
//   {
//     _id: false,
//     transform: function (doc, ret) {
//       // Remove required and helpText from heading fields
//       if (ret.type === 'heading') {
//         delete ret.required;
//         delete ret.helpText;
//       }
//       return ret;
//     },
//   }
// );

// // Pre-save middleware to clean heading fields
// FieldSchema.pre('save', function (next) {
//   if (this.type === 'heading') {
//     this.required = undefined;
//     this.helpText = undefined;
//   }
//   next();
// });

// // Page Schema
// const PageSchema = new Schema(
//   {
//     id: { type: String, required: true },
//     fields: [FieldSchema],
//   },
//   { _id: false }
// );

// // Logo Schema
// const LogoSchema = new Schema(
//   {
//     src: { type: String, required: true },
//     type: {
//       type: String,
//       enum: ['uploaded', 'url'],
//       required: true,
//     },
//     alignment: {
//       type: String,
//       enum: ['LEFT', 'CENTER', 'RIGHT'],
//       default: 'CENTER',
//     },
//     size: {
//       type: Number,
//       min: 0,
//       max: 100,
//       default: 50,
//     },
//     publicId: String,
//   },
//   { _id: false }
// );

// // ✅ ENHANCED: Settings Schema with all new options
// const SettingsSchema = new Schema(
//   {
//     submitButtonText: {
//       type: String,
//       default: 'Submit',
//     },
//     showLogo: {
//       type: Boolean,
//       default: false,
//     },
//     thankyouMessage: {
//       type: String,
//       default: 'Thank you for your submission!',
//     },
//     defaultLabelAlignment: {
//       type: String,
//       enum: ['LEFT', 'RIGHT'],
//       default: 'LEFT',
//     },
//     defaultRequiredField: {
//       type: Boolean,
//       default: false,
//     },
//     isEnabled: {
//       type: Boolean,
//       default: true,
//     },
//     allowMultipleSubmissions: {
//       type: Boolean,
//       default: true,
//     },
//     allowMultipleEmailSubmissions: {
//       type: Boolean,
//       default: true,
//     },
//     collectIpAddress: {
//       type: Boolean,
//       default: true,
//     },
//     enableCaptcha: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   { _id: false }
// );

// // Pre-save middleware to ensure defaults
// SettingsSchema.pre('save', function (next) {
//   if (this.allowMultipleSubmissions === undefined) {
//     this.allowMultipleSubmissions = true;
//   }
//   if (this.allowMultipleEmailSubmissions === undefined) {
//     this.allowMultipleEmailSubmissions = true;
//   }
//   next();
// });

// interface IForm extends Document {
//   userId: mongoose.Types.ObjectId;
//   title: string;
//   description?: string;
//   pages: any[];
//   selectedFieldId?: string | null;
//   selectedPageId?: string | null;
//   currentPageIndex?: number;
//   propertiesPanelOpen?: boolean;
//   logo?: any | null;
//   settings?: any;
//   isPublished: boolean;
//   isArchived: boolean;
//   isTrashed: boolean;
//   isFavorite: boolean;
//   submissions: number;
//   views: number;
//   labels: string[];
//   lastSaved?: string;
//   lastOpenedAt?: Date;
//   trashedAt?: Date;
//   publishedAt?: Date;
//   createdAt: Date;
//   updatedAt: Date;
//   isAIGenerated?: boolean;
//   aiPrompt?: string;
//   aiModel?: string;
//   aiGenerationMetadata?: {
//     promptTokens?: number;
//     responseTokens?: number;
//     generationTime?: number;
//     version?: string;
//   };
// }

// // Main Form Schema
// const FormSchema = new Schema<IForm>(
//   {
//     userId: {
//       type: Schema.Types.ObjectId,
//       ref: 'User',
//       required: [true, 'User ID is required'],
//       index: true,
//     },
//     title: {
//       type: String,
//       required: [true, 'Form title is required'],
//       trim: true,
//       maxlength: [200, 'Title cannot exceed 200 characters'],
//       minlength: [1, 'Title must be at least 1 character long'],
//     },
//     description: {
//       type: String,
//       trim: true,
//       maxlength: [1000, 'Description cannot exceed 1000 characters'],
//     },
//     pages: [PageSchema],
//     selectedFieldId: {
//       type: String,
//       default: null,
//     },
//     selectedPageId: {
//       type: String,
//       default: null,
//     },
//     currentPageIndex: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },
//     propertiesPanelOpen: {
//       type: Boolean,
//       default: false,
//     },
//     logo: {
//       type: LogoSchema,
//       default: null,
//     },
//     settings: {
//       type: SettingsSchema,
//       default: () => ({}),
//     },
//     isPublished: {
//       type: Boolean,
//       default: false,
//       index: true,
//     },
//     isArchived: {
//       type: Boolean,
//       default: false,
//       index: true,
//     },
//     isTrashed: {
//       type: Boolean,
//       default: false,
//       index: true,
//     },
//     isFavorite: {
//       type: Boolean,
//       default: false,
//       index: true,
//     },
//     submissions: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },
//     views: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },
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
//     lastSaved: {
//       type: String,
//     },
//     lastOpenedAt: {
//       type: Date,
//       default: Date.now,
//     },
//     trashedAt: {
//       type: Date,
//       default: null,
//     },
//     publishedAt: {
//       type: Date,
//       default: null,
//     },
//     // AI Generation metadata
//     isAIGenerated: { type: Boolean, default: false },
//     aiPrompt: { type: String },
//     aiModel: { type: String },
//     aiGenerationMetadata: {
//       promptTokens: { type: Number },
//       responseTokens: { type: Number },
//       generationTime: { type: Number },
//       version: { type: String },
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

//         // Clean heading fields in the response
//         if (ret.pages) {
//           ret.pages.forEach((page: any) => {
//             if (page.fields) {
//               page.fields.forEach((field: any) => {
//                 if (field.type === 'heading') {
//                   delete field.required;
//                   delete field.helpText;
//                 }
//               });
//             }
//           });
//         }

//         return ret;
//       },
//     },
//     toObject: { virtuals: true },
//   }
// );

// // Indexes for performance
// FormSchema.index({ userId: 1, createdAt: -1 });
// FormSchema.index({ userId: 1, isPublished: 1 });
// FormSchema.index({ userId: 1, isTrashed: 1 });
// FormSchema.index({ userId: 1, isArchived: 1 });
// FormSchema.index({ userId: 1, isFavorite: 1 });
// FormSchema.index({ userId: 1, isAIGenerated: 1 });
// FormSchema.index({ title: 'text', description: 'text' });
// FormSchema.index({ trashedAt: 1 });
// FormSchema.index({ publishedAt: -1 });

// // Virtual for form URL
// FormSchema.virtual('formUrl').get(function () {
//   return `${process.env.FRONTEND_URL || 'http://localhost:3000'}/form/${this._id}`;
// });

// // Pre-save middleware to ensure required fields
// FormSchema.pre<IForm>('save', function (next) {
//   // Ensure at least one page exists
//   if (!this.pages || this.pages.length === 0) {
//     this.pages = [
//       {
//         id: require('uuid').v4(),
//         fields: [],
//       },
//     ];
//   }

//   // Set selectedPageId if not set
//   if (!this.selectedPageId && this.pages.length > 0) {
//     this.selectedPageId = this.pages[0].id;
//   }

//   next();
// });

// // Instance methods
// FormSchema.methods.getFieldCount = function () {
//   return this.pages.reduce((total, page) => {
//     return total + (page.fields ? page.fields.length : 0);
//   }, 0);
// };

// FormSchema.methods.getRequiredFieldCount = function () {
//   return this.pages.reduce((total, page) => {
//     return (
//       total +
//       (page.fields ? page.fields.filter(field => field.required).length : 0)
//     );
//   }, 0);
// };

// // Static method to find AI generated forms
// FormSchema.statics.findAIGenerated = function (userId) {
//   return this.find({
//     userId: userId,
//     isAIGenerated: true,
//     isTrashed: false,
//   }).sort({ createdAt: -1 });
// };

// // Virtual for days remaining in trash
// FormSchema.virtual('daysRemaining').get(function (this: IForm) {
//   if (!this.isTrashed || !this.trashedAt) {
//     return undefined;
//   }
//   const now = new Date();
//   const trashedDate = new Date(this.trashedAt);
//   const daysPassed = Math.floor(
//     (now.getTime() - trashedDate.getTime()) / (1000 * 60 * 60 * 24)
//   );
//   return Math.max(0, 30 - daysPassed);
// });

// // Pre-save middleware to update timestamps
// FormSchema.pre<IForm>('save', function (next) {
//   if (this.isModified() && !this.isNew) {
//     this.lastSaved = new Date().toLocaleTimeString([], {
//       hour: '2-digit',
//       minute: '2-digit',
//     });
//     this.lastOpenedAt = new Date();
//   }

//   // Handle publish state changes
//   if (this.isModified('isPublished')) {
//     if (this.isPublished && !this.publishedAt) {
//       this.publishedAt = new Date();
//     } else if (!this.isPublished) {
//       this.publishedAt = null;
//     }
//   }

//   // Handle trash state changes
//   if (this.isModified('isTrashed')) {
//     if (this.isTrashed && !this.trashedAt) {
//       this.trashedAt = new Date();
//     } else if (!this.isTrashed) {
//       this.trashedAt = null;
//     }
//   }

//   next();
// });

// // Static methods
// FormSchema.statics.getPublished = function () {
//   return this.find({
//     isPublished: true,
//     isTrashed: false,
//     isArchived: false,
//   });
// };

// FormSchema.statics.cleanupOldTrashed = function (
//   userId: mongoose.Types.ObjectId
// ) {
//   const thirtyDaysAgo = new Date();
//   thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

//   return this.deleteMany({
//     userId,
//     isTrashed: true,
//     trashedAt: { $lte: thirtyDaysAgo },
//   });
// };

// // Instance methods
// FormSchema.methods.getSubmissionRate = function () {
//   if (this.views === 0) return 0;
//   return (this.submissions / this.views) * 100;
// };

// FormSchema.methods.incrementViews = function () {
//   this.views += 1;
//   return this.save();
// };

// FormSchema.methods.duplicate = function () {
//   const duplicatedForm = new (this.constructor as any)({
//     userId: this.userId,
//     title: `${this.title} (Copy)`,
//     description: this.description,
//     pages: this.pages.map((page: any) => ({
//       ...page,
//       id: new mongoose.Types.ObjectId().toString(),
//       fields:
//         page.fields?.map((field: any) => {
//           const newField = {
//             ...field,
//             id: new mongoose.Types.ObjectId().toString(),
//           };

//           // Clean heading fields during duplication
//           if (field.type === 'heading') {
//             delete newField.required;
//             delete newField.helpText;
//           }

//           return newField;
//         }) || [],
//     })),
//     logo: this.logo,
//     settings: this.settings,
//     labels: this.labels,
//     isPublished: false,
//   });

//   return duplicatedForm.save();
// };

// export default mongoose.model<IForm>('Form', FormSchema);

// src/models/Form.ts
import mongoose, { Schema, Document } from 'mongoose';

// ✅ FIXED: Proper option schema definition
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
  isAIGenerated?: boolean;
  aiPrompt?: string;
  aiModel?: string;
  aiGenerationMetadata?: {
    promptTokens?: number;
    responseTokens?: number;
    generationTime?: number;
    version?: string;
  };
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
    isAIGenerated: { type: Boolean, default: false },
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
