import { z } from 'zod';

export const createLabelSchema = z.object({
  name: z
    .string()
    .min(1, 'Label name is required')
    .max(50, 'Label name cannot exceed 50 characters')
    .trim(),
  color: z
    .string()
    .regex(
      /^#[0-9A-F]{6}$/i,
      'Invalid color format. Use hex format like #FF0000'
    ),
});

export const updateLabelSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Label name is required')
      .max(50, 'Label name cannot exceed 50 characters')
      .trim()
      .optional(),
    color: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
      .optional(),
  })
  .refine(data => data.name !== undefined || data.color !== undefined, {
    message: 'At least one field (name or color) must be provided',
  });
