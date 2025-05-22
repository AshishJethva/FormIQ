// Label validation schemas

import { z } from 'zod';

export const createLabelSchema = z.object({
  name: z
    .string()
    .min(1, 'Label name is required')
    .max(50, 'Label name cannot exceed 50 characters'),
  color: z
    .string()
    .regex(
      /^#[0-9A-F]{6}$/i,
      'Invalid color format. Use hex format like #FF0000'
    ),
});

export const updateLabelSchema = z.object({
  name: z
    .string()
    .min(1, 'Label name is required')
    .max(50, 'Label name cannot exceed 50 characters')
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
    .optional(),
});
