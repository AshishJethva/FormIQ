// Form validation schemas
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

export const fieldSchema = z.object({
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
  required: z.boolean().default(false),
  helpText: z.string().optional(),
  placeholder: z.string().optional(),
  labelAlignment: z.enum(['LEFT', 'RIGHT']).default('LEFT'),
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
});

export const pageSchema = z.object({
  id: z.string(),
  fields: z.array(fieldSchema),
});

export const logoSchema = z
  .object({
    src: z.string().nullable(),
    type: z.enum(['uploaded', 'url']).nullable(),
    alignment: z.enum(['LEFT', 'CENTER', 'RIGHT']).default('CENTER'),
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
