import { Document, Types } from 'mongoose';

export enum FieldType {
  HEADING = 'HEADING',
  FULL_NAME = 'FULL_NAME',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  ADDRESS = 'ADDRESS',
  DATE_PICKER = 'DATE_PICKER',
  APPOINTMENT = 'APPOINTMENT',
  SIGNATURE = 'SIGNATURE',
  FILL_BLANK = 'FILL_BLANK',
  PRODUCT_LIST = 'PRODUCT_LIST',
}

export interface IField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  helpText?: string;
  placeholder?: string;
  labelAlignment?: 'LEFT' | 'CENTER' | 'RIGHT' | 'TOP';
  options?: string[];
}

export interface IPage {
  id: string;
  fields: IField[];
}

export interface IFormSettings {
  submitButtonText: string;
  defaultLabelAlignment: 'LEFT' | 'CENTER' | 'RIGHT' | 'TOP';
  thankyouMessage: string;
  defaultRequiredField: boolean;
}

export interface ILogoState {
  url: string;
  size: number;
  alignment: 'LEFT' | 'CENTER' | 'RIGHT';
}

export interface IForm extends Document {
  id: string;
  title: string;
  description: string;
  creator: Types.ObjectId;
  pages: IPage[];
  selectedFieldId: string | null;
  selectedPageId: string | null;
  currentPageIndex: number;
  propertiesPanelOpen: boolean;
  settings: IFormSettings;
  lastSaved: string;
  logo: ILogoState | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFormSubmission extends Document {
  form: Types.ObjectId;
  data: Record<string, any>;
  submittedBy: string | null; // Could be email or null for anonymous
  submittedAt: Date;
}

export type LabelAlignment = 'LEFT' | 'CENTER' | 'RIGHT' | 'TOP';
