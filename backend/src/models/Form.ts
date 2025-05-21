// src/models/Form.ts
import mongoose, { Schema } from 'mongoose';
import {
  IForm,
  IPage,
  IField,
  IFormSettings,
  ILogoState,
  FieldType,
} from '../types/form';

const FieldSchema = new Schema<IField>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(FieldType),
      required: true,
    },
    label: { type: String, required: true },
    required: { type: Boolean, default: false },
    helpText: { type: String },
    placeholder: { type: String },
    labelAlignment: {
      type: String,
      enum: ['LEFT', 'CENTER', 'RIGHT', 'TOP'],
      default: 'LEFT',
    },
    options: [{ type: String }],
  },
  { _id: false }
);

const PageSchema = new Schema<IPage>(
  {
    id: { type: String, required: true },
    fields: [FieldSchema],
  },
  { _id: false }
);

const FormSettingsSchema = new Schema<IFormSettings>(
  {
    submitButtonText: { type: String, default: 'Submit' },
    defaultLabelAlignment: {
      type: String,
      enum: ['LEFT', 'CENTER', 'RIGHT', 'TOP'],
      default: 'LEFT',
    },
    thankyouMessage: {
      type: String,
      default: 'Thank you for your submission!',
    },
    defaultRequiredField: { type: Boolean, default: false },
  },
  { _id: false }
);

const LogoStateSchema = new Schema<ILogoState>(
  {
    url: { type: String, required: true },
    size: { type: Number, default: 100 },
    alignment: {
      type: String,
      enum: ['LEFT', 'CENTER', 'RIGHT'],
      default: 'CENTER',
    },
  },
  { _id: false }
);

const FormSchema = new Schema<IForm>(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    pages: [PageSchema],
    selectedFieldId: { type: String, default: null },
    selectedPageId: { type: String, default: null },
    currentPageIndex: { type: Number, default: 0 },
    propertiesPanelOpen: { type: Boolean, default: false },
    settings: { type: FormSettingsSchema, default: () => ({}) },
    lastSaved: { type: String },
    logo: { type: LogoStateSchema, default: null },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

const Form = mongoose.model<IForm>('Form', FormSchema);
export default Form;
