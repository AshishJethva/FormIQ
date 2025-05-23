// src/types/index.ts - Type Definitions
export interface Field {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  helpText?: string;
  placeholder?: string;
  labelAlignment?: LabelAlignment;
  options?: { label: string; value: string }[];
  defaultValue?: string | string[] | number;
  propertiesPanelOpen?: boolean;
}

export interface FormPage {
  id: string;
  fields: Field[];
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
}

export type LabelAlignment = 'LEFT' | 'RIGHT';

export interface Label {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
  userId: string;
}

export interface Form {
  title: string;
  description?: string;
  pages: FormPage[];
  selectedFieldId?: string | null;
  selectedPageId?: string | null;
  currentPageIndex?: number;
  propertiesPanelOpen?: boolean;
  logo?: LogoState | null;
  settings?: FormSettings;
  lastSaved?: string;
  userId: string | any;
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
  daysRemaining?: number;
  submissions: number;
  labels?: string[];
  isFavorite: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  trashedAt?: Date;
}
