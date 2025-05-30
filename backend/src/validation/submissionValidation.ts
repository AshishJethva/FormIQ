// src/validation/submissionValidation.ts

import { z } from 'zod';

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
        // Enhanced validation for all field types
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'string') {
            // Phone number validation
            const hasPhonePattern =
              /[\d\(\)\-\s\.\+]/.test(value) && value.length >= 10;
            if (hasPhonePattern) {
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
            // Ensure all array items are valid strings
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
