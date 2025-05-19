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
  propertiesPanelOpen?: boolean;
  // Add more field-specific properties as needed
}

export interface FormSettings {
  submitButtonText: string;
  thankyouMessage: string;
  defaultLabelAlignment: LabelAlignment;
  defaultRequiredField: boolean;
  // Add more form settings as needed
}

export interface Form {
  id: string;
  title: string;
  description?: string;
  fields: Field[];
  settings: FormSettings;
  selectedFieldId: string | null;
  propertiesPanelOpen: boolean;
  lastSaved: string;
  logo?: Logo;
}
export interface DragItem {
  id: string;
  type: string;
  index: number;
  fieldType?: FieldType;
}
export interface Logo {
  src: string;
  type: 'uploaded' | 'url';
  size?: number;
  alignment?: 'LEFT' | 'CENTER' | 'RIGHT';
}
