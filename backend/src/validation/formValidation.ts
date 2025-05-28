// Form validation schemas - UPDATED
import { z } from 'zod';

export const createFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Form name is required')
    .max(200, 'Form name cannot exceed 200 characters'),

  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional(),
});

// ✅ UPDATED: Field schema with conditional validation
export const fieldSchema = z
  .object({
    id: z.string(),
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
    label: z.string().min(1, 'Field label is required'),
    // ✅ FIXED: Make required and helpText optional for all fields
    required: z.boolean().optional(),
    helpText: z.string().optional(),
    labelAlignment: z.enum(['LEFT', 'RIGHT']).default('LEFT'), // ✅ Added CENTER
    options: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
        })
      )
      .optional(),
    defaultValue: z
      .union([z.string(), z.array(z.string()), z.number()])
      .optional(),
    propertiesPanelOpen: z.boolean().default(false),
  })
  .refine(
    // ✅ ADDED: Custom validation to ensure heading fields don't have required/helpText
    field => {
      if (field.type === 'heading') {
        return field.required === undefined && field.helpText === undefined;
      }
      return true;
    },
    {
      message: 'Heading fields should not have required or helpText properties',
    }
  );

export const pageSchema = z.object({
  id: z.string(),
  fields: z.array(fieldSchema),
});

export const logoSchema = z
  .object({
    src: z.string().nullable(),
    type: z.enum(['uploaded', 'url']).nullable(),
    alignment: z.enum(['LEFT', 'CENTER', 'RIGHT']).default('CENTER'), // ✅ Added CENTER
    size: z.number().min(10).max(200).default(50),
    publicId: z.string().optional(),
  })
  .nullable();

export const settingsSchema = z.object({
  submitButtonText: z.string().default('Submit'),
  showLogo: z.boolean().default(false),
  thankyouMessage: z.string().default('Thank you for your submission!'),
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
    .optional(),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional(),
  pages: z.array(pageSchema).optional(),
  selectedFieldId: z.string().nullable().optional(),
  selectedPageId: z.string().nullable().optional(),
  currentPageIndex: z.number().min(0).optional(),
  propertiesPanelOpen: z.boolean().optional(),
  logo: logoSchema.optional(),
  settings: settingsSchema.optional(),
  isPublished: z.boolean().optional(),
  labels: z.array(z.string()).optional(),
});

// ✅ ADDED: Helper function to create clean heading fields
export function createHeadingField(id: string, label: string) {
  return {
    id,
    type: 'heading' as const,
    label,
    labelAlignment: 'LEFT' as const,
    // Explicitly do NOT include required or helpText
  };
}

// ✅ ADDED: Helper function to create regular fields
export function createRegularField(
  id: string,
  type: string,
  label: string,
  required: boolean = false
) {
  return {
    id,
    type,
    label,
    required,
    helpText: '',
    labelAlignment: 'LEFT' as const,
  };
}
