// src/types/form.ts - Frontend Types
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
}

export enum FieldType {
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

// ✅ ADDED: Public form access types
export interface PublicFormAccess {
  available: boolean;
  reason: string;
  formTitle?: string;
  isPublished?: boolean;
  isEnabled?: boolean;
  isArchived?: boolean;
  isTrashed?: boolean;
}

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
