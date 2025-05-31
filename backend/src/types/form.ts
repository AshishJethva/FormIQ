// src/types/form.ts - Backend TypeScript Types
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
  allowMultipleSubmissions?: boolean;
  allowMultipleEmailSubmissions?: boolean;
  collectIpAddress?: boolean;
  enableCaptcha?: boolean;
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

// ✅ NEW: JWT Payload interface
export interface JwtPayload {
  id: string;
  email: string;
  iat: number;
  exp: number;
}

// ✅ NEW: User interface
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  changedPasswordAfter: (timestamp: number) => boolean;
}

// ✅ NEW: API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination?: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
}

// ✅ NEW: Submission interfaces
export interface SubmissionData {
  [fieldId: string]: any;
}

export interface Submission {
  id: string;
  formId: string;
  data: SubmissionData;
  submittedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  status: 'pending' | 'processed' | 'failed';
  isRead: boolean;
  tags: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ✅ NEW: Field validation rules
export interface FieldValidationRule {
  fieldId: string;
  fieldType: FieldType;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  options?: string[];
}

// ✅ NEW: Form validation context
export interface FormValidationContext {
  form: Form;
  fieldRules: FieldValidationRule[];
  submissionData: SubmissionData;
}

// ✅ NEW: Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  fieldId: string;
  fieldLabel: string;
  message: string;
  code: string;
}

// Request interfaces
export interface CreateFormRequest {
  name: string;
  description?: string;
}

export interface UpdateFormRequest {
  title?: string;
  description?: string;
  pages?: FormPage[];
  selectedFieldId?: string | null;
  selectedPageId?: string | null;
  currentPageIndex?: number;
  propertiesPanelOpen?: boolean;
  logo?: LogoState | null;
  settings?: Partial<FormSettings>;
  isPublished?: boolean;
  labels?: string[];
}

export interface SubmitFormRequest {
  data: SubmissionData;
}

// Filter and query interfaces
export interface FormFilters {
  search?: string;
  labels?: string[];
  status?: 'published' | 'draft' | 'archived' | 'trashed' | 'favorites' | 'all';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SubmissionFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  isRead?: string;
}

// Statistics interfaces
export interface FormStats {
  totalForms: number;
  publishedForms: number;
  draftForms: number;
  archivedForms: number;
  trashedForms: number;
  totalSubmissions: number;
  totalViews: number;
  averageSubmissionRate: number;
}

export interface SubmissionStats {
  total: number;
  unread: number;
  pending: number;
  processed: number;
  failed: number;
  todayCount: number;
  weekCount: number;
  monthCount: number;
}

// Export interfaces
export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  dateFrom?: string;
  dateTo?: string;
  includeMetadata?: boolean;
  fieldMapping?: Record<string, string>;
}

export interface ExportResult {
  filename: string;
  downloadUrl: string;
  fileSize: number;
  recordCount: number;
  createdAt: Date;
}

// Email notification interfaces
export interface EmailNotification {
  id: string;
  formId: string;
  type: 'submission' | 'weekly_summary' | 'monthly_report';
  recipient: string;
  subject: string;
  content: string;
  sentAt: Date;
  status: 'pending' | 'sent' | 'failed';
}

export interface NotificationSettings {
  enableSubmissionNotifications: boolean;
  submissionNotificationEmail?: string;
  enableWeeklySummary: boolean;
  enableMonthlyReport: boolean;
  notificationFrequency: 'immediate' | 'hourly' | 'daily';
}

// Analytics interfaces
export interface FormAnalytics {
  formId: string;
  views: number;
  submissions: number;
  submissionRate: number;
  averageCompletionTime: number;
  bounceRate: number;
  topReferrers: Array<{ source: string; count: number }>;
  deviceBreakdown: Array<{ device: string; count: number }>;
  geographicData: Array<{ country: string; count: number }>;
  dailyStats: Array<{ date: string; views: number; submissions: number }>;
}

export interface FieldAnalytics {
  fieldId: string;
  fieldType: FieldType;
  fieldLabel: string;
  responseCount: number;
  skipRate: number;
  averageResponseTime: number;
  topResponses?: Array<{ value: string; count: number }>;
  validationErrors: number;
}

// Rate limiting interfaces
export interface RateLimit {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: Date;
  retryAfter?: number;
}

// File upload interfaces
export interface UploadedFile {
  id: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  uploadedAt: Date;
  formId?: string;
  submissionId?: string;
}

export interface FileUploadOptions {
  maxSize: number;
  allowedMimeTypes: string[];
  maxFiles: number;
  destination: string;
}

// Webhook interfaces
export interface Webhook {
  id: string;
  formId: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum WebhookEvent {
  FORM_SUBMITTED = 'form.submitted',
  FORM_PUBLISHED = 'form.published',
  FORM_UNPUBLISHED = 'form.unpublished',
  SUBMISSION_UPDATED = 'submission.updated',
}

export interface WebhookPayload {
  event: WebhookEvent;
  formId: string;
  timestamp: Date;
  data: any;
  signature?: string;
}

// ✅ NEW: Integration interfaces
export interface Integration {
  id: string;
  name: string;
  type: 'zapier' | 'webhook' | 'email' | 'slack' | 'teams';
  config: Record<string, any>;
  isActive: boolean;
  formIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationConfig {
  [key: string]: any;
}

// ✅ NEW: Template interfaces
export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  structure: {
    pages: FormPage[];
    settings: FormSettings;
  };
  isPublic: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  templateCount: number;
}

// Error interfaces
export interface AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp: Date;
  path: string;
  method: string;
}

// Helper type guards
export const isTextField = (fieldType: FieldType): boolean => {
  return [
    FieldType.SHORT_TEXT,
    FieldType.LONG_TEXT,
    FieldType.PARAGRAPH,
  ].includes(fieldType);
};

export const isChoiceField = (fieldType: FieldType): boolean => {
  return [
    FieldType.DROPDOWN,
    FieldType.SINGLE_CHOICE,
    FieldType.MULTIPLE_CHOICE,
  ].includes(fieldType);
};

export const isFileField = (fieldType: FieldType): boolean => {
  return [FieldType.IMAGE, FieldType.FILE_UPLOAD].includes(fieldType);
};

export const isDateField = (fieldType: FieldType): boolean => {
  return [FieldType.DATE_PICKER, FieldType.APPOINTMENT].includes(fieldType);
};

export const requiresValidation = (fieldType: FieldType): boolean => {
  return ![FieldType.HEADING].includes(fieldType);
};

export const supportsOptions = (fieldType: FieldType): boolean => {
  return isChoiceField(fieldType);
};

export const supportsMinMax = (fieldType: FieldType): boolean => {
  return fieldType === FieldType.NUMBER;
};

export const supportsTextLength = (fieldType: FieldType): boolean => {
  return isTextField(fieldType);
};

// Default configurations
export const DEFAULT_FIELD_CONFIGS: Record<FieldType, Partial<Field>> = {
  [FieldType.HEADING]: {
    labelAlignment: 'LEFT',
  },
  [FieldType.SHORT_TEXT]: {
    placeholder: 'Enter your answer',
    labelAlignment: 'LEFT',
    required: false,
    helpText: '',
  },
  [FieldType.LONG_TEXT]: {
    placeholder: 'Enter your detailed response...',
    rows: 3,
    labelAlignment: 'LEFT',
    required: false,
    helpText: '',
  },
  [FieldType.PARAGRAPH]: {
    placeholder: 'Share your thoughts, feedback, or detailed information...',
    rows: 5,
    labelAlignment: 'LEFT',
    required: false,
    helpText: '',
  },
  [FieldType.NUMBER]: {
    placeholder: 'Enter a number',
    step: 1,
    labelAlignment: 'LEFT',
    required: false,
    helpText: '',
  },
  [FieldType.EMAIL]: {
    placeholder: 'your.email@example.com',
    labelAlignment: 'LEFT',
    required: false,
    helpText: "We'll never share your email",
  },
  [FieldType.PHONE]: {
    placeholder: '99999 00000',
    labelAlignment: 'LEFT',
    required: false,
    helpText: '',
  },
  [FieldType.TIME]: {
    placeholder: 'Select time',
    labelAlignment: 'LEFT',
    required: false,
    helpText: '',
  },
  [FieldType.DROPDOWN]: {
    options: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
      { label: 'Option 3', value: 'option3' },
    ],
    labelAlignment: 'LEFT',
    required: false,
    helpText: '',
  },
  [FieldType.SINGLE_CHOICE]: {
    options: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
      { label: 'Option 3', value: 'option3' },
    ],
    labelAlignment: 'LEFT',
    required: false,
    helpText: '',
  },
  [FieldType.MULTIPLE_CHOICE]: {
    options: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
      { label: 'Option 3', value: 'option3' },
    ],
    labelAlignment: 'LEFT',
    required: false,
    helpText: '',
  },
  [FieldType.FILE_UPLOAD]: {
    accept: '*/*',
    multiple: false,
    labelAlignment: 'LEFT',
    required: false,
    helpText: '',
  },
  [FieldType.IMAGE]: {
    accept: 'image/*',
    multiple: false,
    labelAlignment: 'LEFT',
    required: false,
    helpText: '',
  },
  [FieldType.FULL_NAME]: {
    labelAlignment: 'LEFT',
    required: false,
    helpText: '',
  },
  [FieldType.ADDRESS]: {
    labelAlignment: 'LEFT',
    required: false,
    helpText: '',
  },
  [FieldType.DATE_PICKER]: {
    labelAlignment: 'LEFT',
    required: false,
    helpText: '',
  },
  [FieldType.APPOINTMENT]: {
    labelAlignment: 'LEFT',
    required: false,
    helpText: '',
  },
  [FieldType.SIGNATURE]: {
    labelAlignment: 'LEFT',
    required: false,
    helpText: '',
  },
  [FieldType.FILL_BLANK]: {
    labelAlignment: 'LEFT',
    required: false,
    helpText: '',
  },
  [FieldType.PRODUCT_LIST]: {
    labelAlignment: 'LEFT',
    required: false,
    helpText: '',
  },
};
