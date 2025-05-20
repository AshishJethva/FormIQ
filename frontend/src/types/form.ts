// src/types/form.ts
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

export type LabelAlignment = 'LEFT' | 'RIGHT' | 'TOP';

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
  // Add more field-specific properties as needed
}

export interface FormSettings {
  submitButtonText: string;
  showLogo?: boolean;
  thankyouMessage: string;
  defaultLabelAlignment: LabelAlignment;
  defaultRequiredField: boolean;
  // Add more form settings as needed
}

export interface LogoState {
  src: string | null;
  type: 'uploaded' | 'url' | null;
  alignment: 'LEFT' | 'CENTER' | 'RIGHT';
  size: number;
  publicId?: string;
}
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
}
export interface DragItem {
  id: string;
  type: string;
  index: number;
  fieldType?: FieldType;
}
export interface FormPage {
  id: string;
  fields: Field[];
}
