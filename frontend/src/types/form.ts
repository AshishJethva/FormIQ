// src/types/form.ts - Complete Frontend Types with All Field Types

import { Submission } from '@/services/submissions';

export interface Form {
  id: string;
  title: string;
  description?: string;
  pages: FormPage[];
  selectedFieldId: string | null;
  selectedPageId: string | null;
  currentPageIndex: number;
  propertiesPanelOpen: boolean;
  logo?: LogoState | null;
  settings?: FormSettings;
  lastSaved?: string;
  isPublished?: boolean;
  submissions?: number;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  labels?: string[];
  isFavorite?: boolean;
  isArchived?: boolean;
  isTrashed?: boolean;
}
export interface FileData {
  originalName: string;
  fileName: string;
  url: string;
  publicId: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  dimensions?: { width: number; height: number };
}

export interface SubmissionWithFiles extends Submission {
  files?: Record<string, FileData | FileData[]>;
}

export interface FormPage {
  id: string;
  fields: Field[];
}

export interface Field {
  id: string;
  type: FieldType;
  label: string;
  required?: boolean;
  helpText?: string;
  labelAlignment?: LabelAlignment;
  options?: { label: string; value: string }[];
  defaultValue?: string | string[] | number;
  propertiesPanelOpen?: boolean;
  placeholder?: string;

  // ✅ NEW: Text field properties
  minLength?: number;
  maxLength?: number;

  // ✅ NEW: Number field properties
  min?: number;
  max?: number;
  step?: number;

  // ✅ NEW: Textarea properties
  rows?: number;

  // ✅ NEW: File upload properties
  multiple?: boolean;
  accept?: string;
}

// ✅ COMPLETE: All field types including new ones
export enum FieldType {
  // Original fields
  HEADING = 'heading',
  FULL_NAME = 'fullName',
  EMAIL = 'email',
  ADDRESS = 'address',
  PHONE = 'phone',
  DATE_PICKER = 'datePicker',
  APPOINTMENT = 'appointment',
  SIGNATURE = 'signature',
  FILL_BLANK = 'fillBlank',
  PRODUCT_LIST = 'productList',

  // ✅ NEW: Added 10 new field types
  SHORT_TEXT = 'shortText',
  LONG_TEXT = 'longText',
  PARAGRAPH = 'paragraph',
  DROPDOWN = 'dropdown',
  SINGLE_CHOICE = 'singleChoice',
  MULTIPLE_CHOICE = 'multipleChoice',
  NUMBER = 'number',
  IMAGE = 'image',
  FILE_UPLOAD = 'fileUpload',
  TIME = 'time',
}

export interface LogoState {
  src: string | null;
  type: 'uploaded' | 'url' | null;
  alignment: 'LEFT' | 'CENTER' | 'RIGHT';
  size: number;
  publicId?: string;
}

export interface FormSettings {
  submitButtonText: string;
  showLogo?: boolean;
  thankyouMessage: string;
  defaultLabelAlignment: LabelAlignment;
  defaultRequiredField: boolean;
  isEnabled?: boolean;
  allowMultipleEmailSubmissions?: boolean;
  allowMultipleSubmissions?: boolean;
  collectIpAddress?: boolean;
  enableCaptcha?: boolean;
}

export type LabelAlignment = 'LEFT' | 'RIGHT';

export interface DragItem {
  id: string;
  type: string;
  index: number;
  fieldType?: FieldType;
}

export type HeadingField = Omit<Field, 'required' | 'helpText'> & {
  type: FieldType.HEADING;
};

export type RegularField = Field & {
  type: Exclude<FieldType, FieldType.HEADING>;
  required: boolean;
  helpText: string;
};

// ✅ NEW: Specific field type interfaces
export interface DropdownField extends Field {
  type: FieldType.DROPDOWN;
  options: { label: string; value: string }[];
}

export interface ChoiceField extends Field {
  type: FieldType.SINGLE_CHOICE | FieldType.MULTIPLE_CHOICE;
  options: { label: string; value: string }[];
}

export interface NumberField extends Field {
  type: FieldType.NUMBER;
  min?: number;
  max?: number;
  step?: number;
}

export interface FileUploadField extends Field {
  type: FieldType.FILE_UPLOAD | FieldType.IMAGE;
  accept?: string;
  multiple?: boolean;
}

export interface TextAreaField extends Field {
  type: FieldType.LONG_TEXT | FieldType.PARAGRAPH;
  rows?: number;
  minLength?: number;
  maxLength?: number;
}

export interface ShortTextField extends Field {
  type: FieldType.SHORT_TEXT;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
}

export interface TimeField extends Field {
  type: FieldType.TIME;
  placeholder?: string;
}

export interface FormStatus {
  isPublished: boolean;
  isEnabled: boolean;
  isAccessible: boolean;
}

export interface PublishFormRequest {
  formId: string;
  isPublished: boolean;
}

export interface PublishFormResponse {
  success: boolean;
  data: {
    isPublished: boolean;
    publishedAt?: string;
  };
  message: string;
}

export interface FormValidation {
  isValid: boolean;
  errors: FormValidationError[];
}

export interface FormValidationError {
  type: 'NO_FIELDS' | 'NO_TITLE' | 'INVALID_TITLE';
  message: string;
}

export interface PublicFormAccess {
  available: boolean;
  reason: string;
  formTitle?: string;
  isPublished?: boolean;
  isEnabled?: boolean;
  isArchived?: boolean;
  isTrashed?: boolean;
}

// ✅ NEW: Field validation helpers
export interface FieldValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern';
  value?: any;
  message: string;
}

export interface FieldValidationResult {
  isValid: boolean;
  errors: string[];
}

// ✅ NEW: Field type categories for organization
export const FIELD_CATEGORIES = {
  BASIC: [
    FieldType.SHORT_TEXT,
    FieldType.LONG_TEXT,
    FieldType.PARAGRAPH,
    FieldType.NUMBER,
    FieldType.EMAIL,
    FieldType.PHONE,
    FieldType.TIME,
  ],
  CHOICE: [
    FieldType.DROPDOWN,
    FieldType.SINGLE_CHOICE,
    FieldType.MULTIPLE_CHOICE,
  ],
  ADVANCED: [
    FieldType.DATE_PICKER,
    FieldType.APPOINTMENT,
    FieldType.SIGNATURE,
    FieldType.ADDRESS,
    FieldType.FULL_NAME,
  ],
  MEDIA: [FieldType.IMAGE, FieldType.FILE_UPLOAD],
  LAYOUT: [FieldType.HEADING],
  SPECIAL: [FieldType.FILL_BLANK, FieldType.PRODUCT_LIST],
} as const;

// ✅ NEW: Helper functions
export const getFieldCategory = (
  fieldType: FieldType
): keyof typeof FIELD_CATEGORIES => {
  for (const [category, types] of Object.entries(FIELD_CATEGORIES)) {
    if ((types as readonly FieldType[]).includes(fieldType)) {
      return category as keyof typeof FIELD_CATEGORIES;
    }
  }
  return 'BASIC';
};

export const isChoiceField = (fieldType: FieldType): boolean => {
  return (FIELD_CATEGORIES.CHOICE as readonly FieldType[]).includes(fieldType);
};

export const isTextField = (fieldType: FieldType): boolean => {
  return [
    FieldType.SHORT_TEXT,
    FieldType.LONG_TEXT,
    FieldType.PARAGRAPH,
  ].includes(fieldType);
};

export const isFileField = (fieldType: FieldType): boolean => {
  return (FIELD_CATEGORIES.MEDIA as readonly FieldType[]).includes(fieldType);
};

export const requiresOptions = (fieldType: FieldType): boolean => {
  return isChoiceField(fieldType);
};

export const supportsPlaceholder = (fieldType: FieldType): boolean => {
  return [
    FieldType.SHORT_TEXT,
    FieldType.LONG_TEXT,
    FieldType.PARAGRAPH,
    FieldType.EMAIL,
    FieldType.PHONE,
    FieldType.NUMBER,
    FieldType.TIME,
  ].includes(fieldType);
};

export const supportsMinMaxLength = (fieldType: FieldType): boolean => {
  return isTextField(fieldType);
};

export const supportsMinMaxValue = (fieldType: FieldType): boolean => {
  return fieldType === FieldType.NUMBER;
};

export const supportsRows = (fieldType: FieldType): boolean => {
  return [FieldType.LONG_TEXT, FieldType.PARAGRAPH].includes(fieldType);
};

export const supportsMultiple = (fieldType: FieldType): boolean => {
  return fieldType === FieldType.FILE_UPLOAD;
};

export const supportsAccept = (fieldType: FieldType): boolean => {
  return isFileField(fieldType);
};

// ✅ NEW: Field type display names
export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  [FieldType.HEADING]: 'Heading',
  [FieldType.SHORT_TEXT]: 'Short Text',
  [FieldType.LONG_TEXT]: 'Long Text',
  [FieldType.PARAGRAPH]: 'Paragraph',
  [FieldType.DROPDOWN]: 'Dropdown',
  [FieldType.SINGLE_CHOICE]: 'Single Choice',
  [FieldType.MULTIPLE_CHOICE]: 'Multiple Choice',
  [FieldType.NUMBER]: 'Number',
  [FieldType.EMAIL]: 'Email',
  [FieldType.PHONE]: 'Phone',
  [FieldType.TIME]: 'Time',
  [FieldType.DATE_PICKER]: 'Date Picker',
  [FieldType.APPOINTMENT]: 'Appointment',
  [FieldType.SIGNATURE]: 'Signature',
  [FieldType.ADDRESS]: 'Address',
  [FieldType.FULL_NAME]: 'Full Name',
  [FieldType.IMAGE]: 'Image Upload',
  [FieldType.FILE_UPLOAD]: 'File Upload',
  [FieldType.FILL_BLANK]: 'Fill in the Blank',
  [FieldType.PRODUCT_LIST]: 'Product List',
};

// ✅ NEW: Default field configurations
export const getDefaultFieldConfig = (fieldType: FieldType): Partial<Field> => {
  const baseConfig: Partial<Field> = {
    labelAlignment: 'LEFT',
    required: false,
    helpText: '',
  };

  switch (fieldType) {
    case FieldType.HEADING:
      return {
        labelAlignment: 'LEFT',
        // No required or helpText for headings
      };

    case FieldType.SHORT_TEXT:
      return {
        ...baseConfig,
        placeholder: 'Enter your answer',
        minLength: undefined,
        maxLength: undefined,
      };

    case FieldType.LONG_TEXT:
      return {
        ...baseConfig,
        placeholder: 'Enter your detailed response...',
        rows: 3,
        minLength: undefined,
        maxLength: undefined,
      };

    case FieldType.PARAGRAPH:
      return {
        ...baseConfig,
        placeholder:
          'Share your thoughts, feedback, or detailed information...',
        rows: 5,
        minLength: undefined,
        maxLength: undefined,
      };

    case FieldType.NUMBER:
      return {
        ...baseConfig,
        placeholder: 'Enter a number',
        min: undefined,
        max: undefined,
        step: 1,
      };

    case FieldType.EMAIL:
      return {
        ...baseConfig,
        placeholder: 'your.email@example.com',
        helpText: "We'll never share your email",
      };

    case FieldType.PHONE:
      return {
        ...baseConfig,
        placeholder: '99999 00000',
      };

    case FieldType.TIME:
      return {
        ...baseConfig,
        placeholder: 'Select time',
      };

    case FieldType.DROPDOWN:
    case FieldType.SINGLE_CHOICE:
    case FieldType.MULTIPLE_CHOICE:
      return {
        ...baseConfig,
        options: [
          { label: 'Option 1', value: 'option1' },
          { label: 'Option 2', value: 'option2' },
          { label: 'Option 3', value: 'option3' },
        ],
      };

    case FieldType.FILE_UPLOAD:
      return {
        ...baseConfig,
        accept: '*/*',
        multiple: false,
      };

    case FieldType.IMAGE:
      return {
        ...baseConfig,
        accept: 'image/*',
        multiple: false,
      };

    default:
      return baseConfig;
  }
};

// ✅ NEW: Utility functions
export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'Unknown';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
};

export const formatDateTime = (dateString: string | undefined): string => {
  if (!dateString) return 'Unknown';
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return 'Invalid Date';
  }
};

export const isDateValid = (dateString: string | undefined): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export const validateField = (
  field: Field,
  value: any
): FieldValidationResult => {
  const errors: string[] = [];

  // Required validation
  if (field.required && (!value || value.toString().trim() === '')) {
    errors.push(`${field.label} is required`);
    return { isValid: false, errors };
  }

  // Skip other validations if field is empty and not required
  if (!value || value.toString().trim() === '') {
    return { isValid: true, errors: [] };
  }

  // Type-specific validations
  switch (field.type) {
    case FieldType.EMAIL:
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push(`${field.label} must be a valid email address`);
      }
      break;

    case FieldType.PHONE:
      const phoneRegex = /^[6-9]\d{9}$/;
      const cleanPhone = value.toString().replace(/\D/g, '');
      let phoneDigits = cleanPhone;
      if (phoneDigits.startsWith('91') && phoneDigits.length === 12) {
        phoneDigits = phoneDigits.substring(2);
      }
      if (!phoneRegex.test(phoneDigits)) {
        errors.push(`${field.label} must be a valid 10-digit phone number`);
      }
      break;

    case FieldType.NUMBER:
      const numValue = Number(value);
      if (isNaN(numValue)) {
        errors.push(`${field.label} must be a valid number`);
      } else {
        if (field.min !== undefined && numValue < field.min) {
          errors.push(`${field.label} must be at least ${field.min}`);
        }
        if (field.max !== undefined && numValue > field.max) {
          errors.push(`${field.label} must be no more than ${field.max}`);
        }
      }
      break;

    case FieldType.SHORT_TEXT:
    case FieldType.LONG_TEXT:
    case FieldType.PARAGRAPH:
      const textValue = value.toString();
      if (field.minLength !== undefined && textValue.length < field.minLength) {
        errors.push(
          `${field.label} must be at least ${field.minLength} characters long`
        );
      }
      if (field.maxLength !== undefined && textValue.length > field.maxLength) {
        errors.push(
          `${field.label} must be no more than ${field.maxLength} characters long`
        );
      }
      break;

    case FieldType.TIME:
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(value.toString())) {
        errors.push(`${field.label} must be a valid time format (HH:MM)`);
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
