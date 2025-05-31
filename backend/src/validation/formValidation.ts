// src/validation/formValidation.ts
import { z } from 'zod';

export const createFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Form name is required')
    .max(200, 'Form name cannot exceed 200 characters')
    .refine(name => name.trim().length >= 2, {
      message: 'Form name must be at least 2 characters long',
    }),

  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional(),
});

export const fieldSchema = z
  .object({
    id: z.string().min(1, 'Field ID is required'),
    type: z.enum([
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
      // ✅ NEW: Added all 10 new field types
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
    ]),
    label: z
      .string()
      .min(1, 'Field label is required')
      .max(200, 'Field label cannot exceed 200 characters')
      .refine(label => label.trim().length >= 2, {
        message: 'Field label must be at least 2 characters long',
      }),
    required: z.boolean().optional(),
    helpText: z
      .string()
      .max(500, 'Help text cannot exceed 500 characters')
      .optional(),
    placeholder: z
      .string()
      .max(100, 'Placeholder cannot exceed 100 characters')
      .optional(),
    labelAlignment: z.enum(['LEFT', 'RIGHT']).default('LEFT'),

    // ✅ NEW: Choice field options
    options: z
      .array(
        z.object({
          label: z.string().min(1, 'Option label is required'),
          value: z.string().min(1, 'Option value is required'),
        })
      )
      .optional(),

    // ✅ NEW: Default values for all field types
    defaultValue: z
      .union([
        z.string(),
        z.array(z.string()),
        z.number(),
        z.object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          street: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          date: z.string().optional(),
          time: z.string().optional(),
        }),
      ])
      .optional(),

    // ✅ NEW: Number field constraints
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),

    // ✅ NEW: Text field constraints
    minLength: z.number().min(0).optional(),
    maxLength: z.number().min(1).optional(),

    // ✅ NEW: Textarea properties
    rows: z.number().min(1).max(20).optional(),

    // ✅ NEW: File upload properties
    multiple: z.boolean().optional(),
    accept: z.string().optional(),

    propertiesPanelOpen: z.boolean().default(false),
  })
  .refine(
    field => {
      if (field.type === 'heading') {
        // Heading fields should not have required or helpText properties
        return field.required === undefined && field.helpText === undefined;
      }
      return true;
    },
    {
      message: 'Heading fields should not have required or helpText properties',
      path: ['type'],
    }
  )
  .refine(
    field => {
      if (['dropdown', 'singleChoice', 'multipleChoice'].includes(field.type)) {
        return field.options && field.options.length > 0;
      }
      return true;
    },
    {
      message: 'Choice fields must have at least one option',
      path: ['options'],
    }
  )
  .refine(
    field => {
      if (field.type === 'number') {
        if (field.min !== undefined && field.max !== undefined) {
          return field.min <= field.max;
        }
      }
      return true;
    },
    {
      message: 'Minimum value must be less than or equal to maximum value',
      path: ['min'],
    }
  )
  .refine(
    field => {
      if (['shortText', 'longText', 'paragraph'].includes(field.type)) {
        if (field.minLength !== undefined && field.maxLength !== undefined) {
          return field.minLength <= field.maxLength;
        }
      }
      return true;
    },
    {
      message: 'Minimum length must be less than or equal to maximum length',
      path: ['minLength'],
    }
  )
  .refine(
    field => {
      if (field.type === 'fileUpload' && field.accept) {
        // Basic validation for MIME type format
        const validFormats =
          /^[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*(\s*,\s*[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*)*$|^\*\/\*$|^\.[a-zA-Z0-9]+(\s*,\s*\.[a-zA-Z0-9]+)*$/;
        return validFormats.test(field.accept);
      }
      return true;
    },
    {
      message:
        'Invalid file type format. Use MIME types (e.g., image/*, .pdf) or file extensions',
      path: ['accept'],
    }
  )
  .refine(
    field => {
      if (field.type === 'phone' && field.placeholder) {
        return field.placeholder.length <= 20;
      }
      return true;
    },
    {
      message: 'Phone field placeholder should be concise',
      path: ['placeholder'],
    }
  )
  .refine(
    field => {
      if (field.type === 'email' && field.placeholder) {
        const isExample = field.placeholder.includes('@');
        if (isExample) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(field.placeholder);
        }
      }
      return true;
    },
    {
      message: 'Email placeholder should be a valid email if it contains @',
      path: ['placeholder'],
    }
  );

export const pageSchema = z.object({
  id: z.string().min(1, 'Page ID is required'),
  fields: z.array(fieldSchema).default([]),
});

export const logoSchema = z
  .object({
    src: z.string().url('Logo source must be a valid URL').nullable(),
    type: z.enum(['uploaded', 'url']).nullable(),
    alignment: z.enum(['LEFT', 'CENTER', 'RIGHT']).default('CENTER'),
    size: z
      .number()
      .min(5, 'Logo size must be at least 5%')
      .max(100, 'Logo size cannot exceed 100%')
      .default(50),
    publicId: z.string().optional(),
  })
  .nullable();

export const settingsSchema = z.object({
  submitButtonText: z
    .string()
    .min(1, 'Submit button text is required')
    .max(50, 'Submit button text cannot exceed 50 characters')
    .default('Submit'),
  showLogo: z.boolean().default(false),
  thankyouMessage: z
    .string()
    .min(1, 'Thank you message is required')
    .max(500, 'Thank you message cannot exceed 500 characters')
    .default('Thank you for your submission!'),
  defaultLabelAlignment: z.enum(['LEFT', 'RIGHT']).default('LEFT'),
  defaultRequiredField: z.boolean().default(false),
  isEnabled: z.boolean().default(true),
  allowMultipleSubmissions: z.boolean().default(true),
  allowMultipleEmailSubmissions: z.boolean().default(true),
  collectIpAddress: z.boolean().default(true),
  enableCaptcha: z.boolean().default(false),
});

export const updateFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Form title is required')
    .max(200, 'Form title cannot exceed 200 characters')
    .refine(title => title.trim().length >= 2, {
      message: 'Form title must be at least 2 characters long',
    })
    .optional(),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional(),
  pages: z
    .array(pageSchema)
    .min(1, 'Form must have at least one page')
    .optional(),
  selectedFieldId: z.string().nullable().optional(),
  selectedPageId: z.string().nullable().optional(),
  currentPageIndex: z
    .number()
    .min(0, 'Page index must be non-negative')
    .optional(),
  propertiesPanelOpen: z.boolean().optional(),
  logo: logoSchema.optional(),
  settings: settingsSchema.optional(),
  isPublished: z.boolean().optional(),
  labels: z
    .array(
      z
        .string()
        .min(1, 'Label cannot be empty')
        .max(50, 'Label cannot exceed 50 characters')
    )
    .optional(),
});

// ✅ ENHANCED: Complete submission validation for all field types
export const submitFormSchema = z.object({
  data: z
    .record(z.any())
    .refine(
      data => {
        // Allow empty submissions for forms with no required fields
        return true;
      },
      {
        message: 'Form data validation failed',
      }
    )
    .refine(
      data => {
        // ✅ ENHANCED: Comprehensive validation for all field types
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'string') {
            // Phone number validation
            const hasPhonePattern =
              /[\d\(\)\-\s\.\+]/.test(value) && value.length >= 10;
            if (hasPhonePattern) {
              let phoneDigits = value.replace(/\D/g, '');

              if (phoneDigits.startsWith('91') && phoneDigits.length === 12) {
                phoneDigits = phoneDigits.substring(2);
              }

              if (phoneDigits.length !== 10) {
                return false;
              }

              const firstDigit = phoneDigits.charAt(0);
              if (!['6', '7', '8', '9'].includes(firstDigit)) {
                return false;
              }

              if (!/^\d{10}$/.test(phoneDigits)) {
                return false;
              }
            }

            // Email validation
            if (value.includes('@')) {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(value)) {
                return false;
              }
            }

            // Time validation
            if (/^\d{2}:\d{2}$/.test(value)) {
              const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
              if (!timeRegex.test(value)) {
                return false;
              }
            }

            // Date validation
            if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
              const date = new Date(value);
              if (isNaN(date.getTime())) {
                return false;
              }
            }
          }

          // Number validation
          if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value)) {
            const numValue = Number(value);
            if (isNaN(numValue)) {
              return false;
            }
          }

          // Array validation for multiple choice
          if (Array.isArray(value)) {
            const hasInvalidItems = value.some(
              item => typeof item !== 'string' || item.trim() === ''
            );
            if (hasInvalidItems) {
              return false;
            }
          }
        }
        return true;
      },
      {
        message: 'Invalid field data format',
      }
    ),
});

// ✅ NEW: Helper functions for field creation with all types
export function createHeadingField(id: string, label: string) {
  return {
    id,
    type: 'heading' as const,
    label: label.trim(),
    labelAlignment: 'LEFT' as const,
  };
}

export function createRegularField(
  id: string,
  type: string,
  label: string,
  required: boolean = false
) {
  const baseField = {
    id,
    type,
    label: label.trim(),
    required,
    helpText: '',
    labelAlignment: 'LEFT' as const,
    placeholder: getDefaultPlaceholder(type),
  };

  // Add field-specific properties based on type
  switch (type) {
    case 'longText':
      return { ...baseField, rows: 3 };
    case 'paragraph':
      return { ...baseField, rows: 5 };
    case 'number':
      return { ...baseField, min: undefined, max: undefined, step: 1 };
    case 'dropdown':
    case 'singleChoice':
    case 'multipleChoice':
      return {
        ...baseField,
        options: [
          { label: 'Option 1', value: 'option1' },
          { label: 'Option 2', value: 'option2' },
          { label: 'Option 3', value: 'option3' },
        ],
      };
    case 'fileUpload':
      return { ...baseField, accept: '*/*', multiple: false };
    case 'image':
      return { ...baseField, accept: 'image/*', multiple: false };
    default:
      return baseField;
  }
}

function getDefaultPlaceholder(fieldType: string): string {
  switch (fieldType) {
    case 'shortText':
      return 'Enter your answer';
    case 'longText':
      return 'Enter your detailed response...';
    case 'paragraph':
      return 'Share your thoughts, feedback, or detailed information...';
    case 'email':
      return 'your.email@example.com';
    case 'phone':
      return '99999 00000';
    case 'fullName':
      return 'Enter your full name';
    case 'address':
      return 'Enter your address';
    case 'datePicker':
      return 'Select a date';
    case 'appointment':
      return 'Choose date and time';
    case 'signature':
      return 'Click to sign';
    case 'fillBlank':
      return 'Fill in the blank';
    case 'number':
      return 'Enter a number';
    case 'time':
      return 'Select time';
    case 'dropdown':
      return 'Select an option...';
    default:
      return '';
  }
}

export const validationHelpers = {
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidPhone: (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
  },

  isValidIndianPhone: (phone: string): boolean => {
    let phoneDigits = phone.replace(/\D/g, '');

    if (phoneDigits.startsWith('91') && phoneDigits.length === 12) {
      phoneDigits = phoneDigits.substring(2);
    }

    return (
      phoneDigits.length === 10 &&
      ['6', '7', '8', '9'].includes(phoneDigits.charAt(0))
    );
  },

  isValidTime: (time: string): boolean => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  },

  isValidNumber: (value: string): boolean => {
    const num = Number(value);
    return !isNaN(num) && isFinite(num);
  },

  formatPhoneNumber: (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 10) {
      return digits.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  },

  sanitizeLabel: (label: string): string => {
    return label.trim().replace(/\s+/g, ' ');
  },

  validateFieldLabel: (label: string, fieldType: string): string => {
    if (!label || label.trim() === '') {
      return 'Label is required';
    }
    if (label.length > 200) {
      return 'Label cannot exceed 200 characters';
    }
    if (label.trim().length < 2) {
      return 'Label must be at least 2 characters long';
    }
    return '';
  },

  validateFieldOptions: (
    options: Array<{ label: string; value: string }>
  ): string[] => {
    const errors: string[] = [];

    if (!options || options.length === 0) {
      errors.push('At least one option is required');
      return errors;
    }

    options.forEach((option, index) => {
      if (!option.label || option.label.trim() === '') {
        errors.push(`Option ${index + 1} label is required`);
      }
      if (!option.value || option.value.trim() === '') {
        errors.push(`Option ${index + 1} value is required`);
      }
    });

    // Check for duplicate values
    const values = options.map(opt => opt.value);
    const duplicates = values.filter(
      (value, index) => values.indexOf(value) !== index
    );
    if (duplicates.length > 0) {
      errors.push('Option values must be unique');
    }

    return errors;
  },

  getFieldTypeDisplayName: (fieldType: string): string => {
    const displayNames: Record<string, string> = {
      shortText: 'Short Text',
      longText: 'Long Text',
      paragraph: 'Paragraph',
      dropdown: 'Dropdown',
      singleChoice: 'Single Choice',
      multipleChoice: 'Multiple Choice',
      number: 'Number',
      image: 'Image',
      fileUpload: 'File Upload',
      time: 'Time',
      heading: 'Heading',
      fullName: 'Full Name',
      email: 'Email',
      address: 'Address',
      phone: 'Phone',
      datePicker: 'Date Picker',
      appointment: 'Appointment',
      signature: 'Signature',
      fillBlank: 'Fill in the Blank',
      productList: 'Product List',
    };

    return displayNames[fieldType] || fieldType;
  },
};
