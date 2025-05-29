// // Form validation schemas - UPDATED
// import { z } from 'zod';

// export const createFormSchema = z.object({
//   name: z
//     .string()
//     .min(1, 'Form name is required')
//     .max(200, 'Form name cannot exceed 200 characters'),

//   description: z
//     .string()
//     .max(1000, 'Description cannot exceed 1000 characters')
//     .optional(),
// });

// // ✅ UPDATED: Field schema with conditional validation
// export const fieldSchema = z
//   .object({
//     id: z.string(),
//     type: z.enum([
//       'heading',
//       'fullName',
//       'email',
//       'address',
//       'phone',
//       'datePicker',
//       'appointment',
//       'signature',
//       'fillBlank',
//       'productList',
//     ]),
//     label: z.string().min(1, 'Field label is required'),
//     // ✅ FIXED: Make required and helpText optional for all fields
//     required: z.boolean().optional(),
//     helpText: z.string().optional(),
//     labelAlignment: z.enum(['LEFT', 'RIGHT']).default('LEFT'), // ✅ Added CENTER
//     options: z
//       .array(
//         z.object({
//           label: z.string(),
//           value: z.string(),
//         })
//       )
//       .optional(),
//     defaultValue: z
//       .union([z.string(), z.array(z.string()), z.number()])
//       .optional(),
//     propertiesPanelOpen: z.boolean().default(false),
//   })
//   .refine(
//     // ✅ ADDED: Custom validation to ensure heading fields don't have required/helpText
//     field => {
//       if (field.type === 'heading') {
//         return field.required === undefined && field.helpText === undefined;
//       }
//       return true;
//     },
//     {
//       message: 'Heading fields should not have required or helpText properties',
//     }
//   );

// export const pageSchema = z.object({
//   id: z.string(),
//   fields: z.array(fieldSchema),
// });

// export const logoSchema = z
//   .object({
//     src: z.string().nullable(),
//     type: z.enum(['uploaded', 'url']).nullable(),
//     alignment: z.enum(['LEFT', 'CENTER', 'RIGHT']).default('CENTER'), // ✅ Added CENTER
//     size: z.number().min(10).max(200).default(50),
//     publicId: z.string().optional(),
//   })
//   .nullable();

// export const settingsSchema = z.object({
//   submitButtonText: z.string().default('Submit'),
//   showLogo: z.boolean().default(false),
//   thankyouMessage: z.string().default('Thank you for your submission!'),
//   defaultLabelAlignment: z.enum(['LEFT', 'RIGHT']).default('LEFT'),
//   defaultRequiredField: z.boolean().default(false),
//   isEnabled: z.boolean().default(true),
//   allowMultipleSubmissions: z.boolean().default(true),
//   allowMultipleEmailSubmissions: z.boolean().default(true),
//   collectIpAddress: z.boolean().default(true),
//   enableCaptcha: z.boolean().default(false),
// });

// export const updateFormSchema = z.object({
//   title: z
//     .string()
//     .min(1, 'Form title is required')
//     .max(200, 'Form title cannot exceed 200 characters')
//     .optional(),
//   description: z
//     .string()
//     .max(1000, 'Description cannot exceed 1000 characters')
//     .optional(),
//   pages: z.array(pageSchema).optional(),
//   selectedFieldId: z.string().nullable().optional(),
//   selectedPageId: z.string().nullable().optional(),
//   currentPageIndex: z.number().min(0).optional(),
//   propertiesPanelOpen: z.boolean().optional(),
//   logo: logoSchema.optional(),
//   settings: settingsSchema.optional(),
//   isPublished: z.boolean().optional(),
//   labels: z.array(z.string()).optional(),
// });

// // ✅ ADDED: Helper function to create clean heading fields
// export function createHeadingField(id: string, label: string) {
//   return {
//     id,
//     type: 'heading' as const,
//     label,
//     labelAlignment: 'LEFT' as const,
//     // Explicitly do NOT include required or helpText
//   };
// }

// // ✅ ADDED: Helper function to create regular fields
// export function createRegularField(
//   id: string,
//   type: string,
//   label: string,
//   required: boolean = false
// ) {
//   return {
//     id,
//     type,
//     label,
//     required,
//     helpText: '',
//     labelAlignment: 'LEFT' as const,
//   };
// }

// src/validation/formValidation.ts - Enhanced Form validation schemas
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

// ✅ ENHANCED: Field schema with comprehensive validation
export const fieldSchema = z
  .object({
    id: z.string().min(1, 'Field ID is required'),
    type: z.enum([
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
    ]),
    label: z
      .string()
      .min(1, 'Field label is required')
      .max(200, 'Field label cannot exceed 200 characters')
      .refine(label => label.trim().length >= 2, {
        message: 'Field label must be at least 2 characters long',
      }),
    // ✅ FIXED: Make required and helpText optional for all fields
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
    options: z
      .array(
        z.object({
          label: z.string().min(1, 'Option label is required'),
          value: z.string().min(1, 'Option value is required'),
        })
      )
      .optional(),
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
    propertiesPanelOpen: z.boolean().default(false),
  })
  .refine(
    // ✅ ENHANCED: Custom validation for heading fields
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
    // ✅ NEW: Validate phone field constraints
    field => {
      if (field.type === 'phone' && field.placeholder) {
        // Phone placeholder should be reasonable
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
    // ✅ NEW: Validate email field constraints
    field => {
      if (field.type === 'email' && field.placeholder) {
        // Email placeholder should contain @ if it's meant to be an example
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

// ✅ ENHANCED: Submission validation schema
export const submitFormSchema = z.object({
  data: z
    .record(z.any())
    .refine(
      data => {
        // Ensure data is not empty object
        return Object.keys(data).length > 0;
      },
      {
        message: 'Form data cannot be empty',
      }
    )
    .refine(
      data => {
        // Validate Indian phone numbers in submission data - only allow 10 digits
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'string') {
            // Check if this looks like a phone field (contains digits and common phone separators)
            const hasPhonePattern =
              /[\d\(\)\-\s\.\+]/.test(value) && value.length >= 10;
            if (hasPhonePattern) {
              // Extract only digits, removing country code if present
              let phoneDigits = value.replace(/\D/g, '');

              // Remove Indian country code (91) if present
              if (phoneDigits.startsWith('91') && phoneDigits.length === 12) {
                phoneDigits = phoneDigits.substring(2);
              }

              // Must be exactly 10 digits for Indian mobile numbers
              if (phoneDigits.length !== 10) {
                return false;
              }

              // Indian mobile numbers start with 6, 7, 8, or 9
              const firstDigit = phoneDigits.charAt(0);
              if (!['6', '7', '8', '9'].includes(firstDigit)) {
                return false;
              }

              // Ensure all characters are numeric
              if (!/^\d{10}$/.test(phoneDigits)) {
                return false;
              }
            }
          }
        }
        return true;
      },
      {
        message:
          'Phone number must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9',
      }
    )
    .refine(
      data => {
        // Validate email addresses in submission data
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'string' && value.includes('@')) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              return false;
            }
          }
        }
        return true;
      },
      {
        message: 'Invalid email format in submission data',
      }
    ),
});

// ✅ ADDED: Helper functions for field creation
export function createHeadingField(id: string, label: string) {
  return {
    id,
    type: 'heading' as const,
    label: label.trim(),
    labelAlignment: 'LEFT' as const,
    // Explicitly do NOT include required or helpText
  };
}

export function createRegularField(
  id: string,
  type: string,
  label: string,
  required: boolean = false
) {
  return {
    id,
    type,
    label: label.trim(),
    required,
    helpText: '',
    labelAlignment: 'LEFT' as const,
    placeholder: getDefaultPlaceholder(type),
  };
}

// ✅ NEW: Helper function for default placeholders
function getDefaultPlaceholder(fieldType: string): string {
  switch (fieldType) {
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
    default:
      return '';
  }
}

// ✅ NEW: Validation helper functions
export const validationHelpers = {
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidPhone: (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
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
};
