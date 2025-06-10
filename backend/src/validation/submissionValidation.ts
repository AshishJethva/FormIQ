// src/validation/submissionValidation.ts

import { z } from 'zod';

// Enhanced file data schema
const FileDataSchema = z.object({
  originalName: z.string(),
  fileName: z.string(),
  url: z.string().url(),
  publicId: z.string(),
  size: z.number().positive(),
  mimeType: z.string(),
  uploadedAt: z.string().optional(),
});

// Schema for form data (flexible for all field types)
const FormDataSchema = z
  .record(
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.array(z.string()),
      z
        .object({
          firstName: z.string().trim().optional(),
          lastName: z.string().trim().optional(),
          street: z.string().trim().optional(),
          city: z.string().trim().optional(),
          state: z.string().trim().optional(),
          zipCode: z.string().trim().optional(),
          date: z.string().trim().optional(),
          time: z.string().trim().optional(),
        })
        .passthrough(), // Allow additional properties
      z.null(),
      z.undefined(),
    ])
  )
  .optional();

// Schema for file data
const FilesDataSchema = z
  .record(z.union([FileDataSchema, z.array(FileDataSchema)]))
  .optional();

// Main submission schema with enhanced validation
export const submitFormSchema = z
  .object({
    data: FormDataSchema,
    files: FilesDataSchema,
  })
  .refine(
    submission => {
      // Only validate if there's actual data to validate
      if (!submission.data && !submission.files) {
        return true; // Allow empty submissions
      }

      // If data exists, validate specific field types
      if (submission.data) {
        for (const [fieldId, value] of Object.entries(submission.data)) {
          // Skip null/undefined values
          if (value === null || value === undefined) continue;

          // Email validation (more permissive)
          if (
            typeof value === 'string' &&
            value.includes('@') &&
            value.length > 5
          ) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value.trim())) {
              console.warn(`Invalid email format for field ${fieldId}:`, value);
              return false;
            }
          }

          // Phone number validation (more flexible)
          if (
            typeof value === 'string' &&
            /^[\d\+\-\s\(\)\.]+$/.test(value) &&
            value.replace(/\D/g, '').length >= 10
          ) {
            let phoneDigits = value.replace(/\D/g, '');

            // Handle country codes
            if (phoneDigits.startsWith('91') && phoneDigits.length === 12) {
              phoneDigits = phoneDigits.substring(2);
            }
            if (phoneDigits.startsWith('1') && phoneDigits.length === 11) {
              phoneDigits = phoneDigits.substring(1);
            }

            // Validate 10-digit numbers
            if (phoneDigits.length === 10) {
              // For Indian numbers, check first digit
              const firstDigit = phoneDigits.charAt(0);
              if (
                !['6', '7', '8', '9', '2', '3', '4', '5'].includes(firstDigit)
              ) {
                console.warn(
                  `Invalid phone number format for field ${fieldId}:`,
                  value
                );
                return false;
              }
            }
          }

          // Time validation
          if (typeof value === 'string' && /^\d{1,2}:\d{2}/.test(value)) {
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(value)) {
              console.warn(`Invalid time format for field ${fieldId}:`, value);
              return false;
            }
          }

          // Date validation (flexible)
          if (
            typeof value === 'string' &&
            /^\d{4}-\d{1,2}-\d{1,2}$/.test(value)
          ) {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              console.warn(`Invalid date format for field ${fieldId}:`, value);
              return false;
            }
          }

          // Array validation
          if (Array.isArray(value)) {
            const hasInvalidItems = value.some(
              item =>
                typeof item !== 'string' ||
                (typeof item === 'string' && item.trim() === '')
            );
            if (hasInvalidItems) {
              console.warn(`Invalid array items for field ${fieldId}:`, value);
              return false;
            }
          }

          // Object validation (for complex fields like fullName, address)
          if (
            typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value)
          ) {
            // Allow objects but ensure they have at least one non-empty value
            const hasValidValue = Object.values(value).some(
              v => v !== null && v !== undefined && v !== ''
            );
            if (!hasValidValue) {
              console.warn(`Empty object for field ${fieldId}:`, value);
              return false;
            }
          }
        }
      }

      return true;
    },
    {
      message: 'Form validation failed - please check your input data',
    }
  );

// Alternative simpler schema for troubleshooting
export const submitFormSchemaSimple = z.object({
  data: z.record(z.any()).optional().default({}),
  files: z.record(z.any()).optional().default({}),
});

// Validation helper functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const validatePhoneNumber = (phone: string): boolean => {
  let phoneDigits = phone.replace(/\D/g, '');

  // Handle country codes
  if (phoneDigits.startsWith('91') && phoneDigits.length === 12) {
    phoneDigits = phoneDigits.substring(2);
  }
  if (phoneDigits.startsWith('1') && phoneDigits.length === 11) {
    phoneDigits = phoneDigits.substring(1);
  }

  // Must be 10 digits
  if (phoneDigits.length !== 10) return false;

  // First digit should be valid
  const firstDigit = phoneDigits.charAt(0);
  return ['6', '7', '8', '9', '2', '3', '4', '5'].includes(firstDigit);
};

export const validateTime = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

export const validateDate = (date: string): boolean => {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};
