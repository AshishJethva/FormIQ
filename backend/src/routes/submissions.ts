// src/routes/submissions.ts
import express from 'express';
import { Request, Response } from 'express';
import { protect } from '../middleware/protect';
import Submission from '../models/Submission';
import Form from '../models/Form';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiBasicError';
import mongoose from 'mongoose';
import {
  debugFormSubmission,
  handleFormSubmissionError,
  monitorFormSubmissionPerformance,
} from '../middleware/debugMiddleware';
import { uploadFormFile } from '../services/cloudinaryService';
import { deleteSubmissionFiles } from '../services/cloudinaryService';
import { deleteFormFile } from '../services/cloudinaryService';

const router = express.Router();

// Helper function to create field labels map from form structure
export const createFieldLabelsMap = (formData: any): Record<string, string> => {
  const labelsMap: Record<string, string> = {};

  if (formData?.pages && Array.isArray(formData.pages)) {
    formData.pages.forEach((page: any) => {
      if (page.fields && Array.isArray(page.fields)) {
        page.fields.forEach((field: any) => {
          if (field.id && field.label && field.type !== 'heading') {
            labelsMap[field.id] = field.label;
          }
        });
      }
    });
  }

  return labelsMap;
};

// Helper function to get a user-friendly field label
export const getFieldDisplayLabel = (
  fieldId: string,
  fieldLabelsMap: Record<string, string>
): string => {
  // First check if we have a label from the form structure
  if (fieldLabelsMap[fieldId]) {
    return fieldLabelsMap[fieldId];
  }

  // Fallback to common field patterns
  const commonFields: Record<string, string> = {
    name: 'Name',
    fullName: 'Full Name',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    emailAddress: 'Email Address',
    phone: 'Phone Number',
    phoneNumber: 'Phone Number',
    address: 'Address',
    message: 'Message',
    subject: 'Subject',
    company: 'Company',
    website: 'Website',
    city: 'City',
    state: 'State',
    zipCode: 'Zip Code',
    country: 'Country',
    dateOfBirth: 'Date of Birth',
    age: 'Age',
    gender: 'Gender',
    occupation: 'Occupation',
    comments: 'Comments',
    feedback: 'Feedback',
    signature: 'Digital Signature',
    image: 'Image Upload',
    file: 'File Upload',
    document: 'Document',
    attachment: 'Attachment',
  };

  const lowerFieldId = fieldId.toLowerCase();
  for (const [key, label] of Object.entries(commonFields)) {
    if (lowerFieldId.includes(key)) {
      return label;
    }
  }

  // Special handling for signature fields
  if (lowerFieldId.includes('sign') || lowerFieldId.includes('signature')) {
    return 'Digital Signature (URL)';
  }

  // If it looks like a UUID, show a user-friendly fallback
  if (
    fieldId.match(
      /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
    )
  ) {
    return 'Custom Field';
  }

  // Convert camelCase or snake_case to readable format
  return fieldId
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
};

// Helper function to format date for CSV
export const formatSubmissionDate = (dateString: string): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
};

// Helper function to escape CSV values
export const escapeCSVValue = (value: string): string => {
  if (!value && value !== '0') return '';

  let escapedValue = String(value).trim();

  // If the value contains comma, quote, newline, or starts/ends with whitespace, wrap it in quotes
  if (
    escapedValue.includes(',') ||
    escapedValue.includes('"') ||
    escapedValue.includes('\n') ||
    escapedValue.includes('\r') ||
    escapedValue !== escapedValue.trim()
  ) {
    // Escape existing quotes by doubling them
    escapedValue = escapedValue.replace(/"/g, '""');
    // Wrap in quotes
    escapedValue = `"${escapedValue}"`;
  }

  return escapedValue;
};

export const formatSubmissionValueSimplified = (
  value: any,
  fieldKey: string,
  fieldLabelsMap: Record<string, string>
): string => {
  if (value === null || value === undefined) {
    return '';
  }

  const fieldLabel = fieldLabelsMap[fieldKey] || fieldKey;

  //  : Handle signature fields - return meaningful text
  if (typeof value === 'string' && value.startsWith('data:image/')) {
    return '[Digital Signature Captured]';
  }

  // Handle file objects (legacy format) - Extract only Cloudinary URLs
  if (typeof value === 'object' && value !== null) {
    // Single file object
    if (value.url && typeof value.url === 'string') {
      return value.url.trim();
    }

    // Array of files
    if (Array.isArray(value)) {
      const fileUrls = value
        .map(item => {
          if (item && typeof item === 'object' && item.url) {
            return item.url.trim();
          }
          //  : Handle base64 signatures in arrays
          if (typeof item === 'string' && item.startsWith('data:image/')) {
            return '[Digital Signature Captured]';
          }
          return '';
        })
        .filter(url => url !== '');

      return fileUrls.join('; ');
    }

    // Complex objects (fullName, address, etc.)
    if (value.firstName && value.lastName) {
      return `${value.firstName} ${value.lastName}`.trim();
    }

    if (value.street || value.city || value.state || value.zipCode) {
      const addressParts = [
        value.street,
        value.city,
        value.state,
        value.zipCode,
        value.country,
      ].filter(part => part && part.trim());
      return addressParts.join(', ');
    }

    if (value.countryCode && value.number) {
      return `${value.countryCode} ${value.number}`;
    }

    if (value.date && value.time) {
      const datePart = value.date
        ? new Date(value.date).toLocaleDateString()
        : '';
      const timePart = value.time || '';
      return `${datePart} ${timePart}`.trim();
    }

    if (value.label && value.value !== undefined) {
      return value.label;
    }

    // Handle fill blank template
    if (value.beforeText && value.afterText && value.userInput) {
      return `${value.beforeText} "${value.userInput}" ${value.afterText}`;
    }

    // Handle product list
    if (value.selectedProducts && typeof value.selectedProducts === 'object') {
      const products = [];
      for (const [productId, quantity] of Object.entries(
        value.selectedProducts
      )) {
        if (quantity && typeof quantity === 'number' && quantity > 0) {
          const product = value.products?.find((p: any) => p.id === productId);
          const productName = product?.name || `Product ${productId}`;
          products.push(`${productName} (x${quantity})`);
        }
      }
      return products.join(', ');
    }

    // Generic object handling
    const meaningfulValues = Object.entries(value)
      .filter(
        ([key, val]) =>
          val !== null &&
          val !== undefined &&
          val !== '' &&
          !key.startsWith('_') &&
          key !== 'id' &&
          key !== 'createdAt' &&
          key !== 'updatedAt'
      )
      .map(([, val]) => formatSingleValueSimplified(val))
      .filter(val => val && val !== '');

    return meaningfulValues.length > 0 ? meaningfulValues.join(', ') : '';
  }

  return formatSingleValueSimplified(value);
};

export const formatDisplayValueWithChoiceLabels = (
  value: any,
  fieldId: string,
  formStructure: any
): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  // Get field definition from form structure for choice fields
  let fieldDefinition = null;
  if (fieldId && formStructure?.pages) {
    for (const page of formStructure.pages) {
      if (page?.fields) {
        fieldDefinition = page.fields.find(
          (field: any) => field.id === fieldId
        );
        if (fieldDefinition) break;
      }
    }
  }

  // Handle choice fields - convert value to label
  if (
    fieldDefinition &&
    ['dropdown', 'singleChoice', 'multipleChoice'].includes(
      fieldDefinition.type
    )
  ) {
    if (typeof value === 'string') {
      // Single choice - find the option with this value
      const option = fieldDefinition.options?.find(
        (opt: any) => opt.value === value
      );
      if (option) {
        return option.label; // Return the actual label instead of value
      }
      // Fallback to original value if option not found
      return value;
    }

    if (Array.isArray(value)) {
      // Multiple choice - map each value to its label
      const labels = value.map((val: string) => {
        const option = fieldDefinition.options?.find(
          (opt: any) => opt.value === val
        );
        return option ? option.label : val; // Return label instead of value
      });
      return labels.join(', ');
    }
  }

  // Handle other field types (existing logic)
  if (typeof value === 'string') {
    // Handle signature fields
    if (value.startsWith('data:image/')) {
      return '[Digital Signature Captured]';
    }
    // Handle Cloudinary URLs
    if (value.includes('cloudinary.com') || value.startsWith('http')) {
      return value.trim();
    }
    return value.trim();
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    return value
      .map(item => {
        if (typeof item === 'object' && item !== null) {
          if (item.label && item.value) {
            return item.label;
          }
          if (item.firstName && item.lastName) {
            return `${item.firstName} ${item.lastName}`;
          }
          if (item.originalName) {
            return item.originalName;
          }
          return Object.values(item).join(' ');
        }
        return String(item);
      })
      .join(', ');
  }

  if (typeof value === 'object') {
    // Handle file objects
    if (value.url && typeof value.url === 'string') {
      return value.url.trim();
    }

    // Handle complex objects (fullName, address, etc.)
    if (value.firstName && value.lastName) {
      return `${value.firstName} ${value.lastName}`.trim();
    }

    if (value.street || value.city || value.state || value.zipCode) {
      const addressParts = [
        value.street,
        value.city,
        value.state,
        value.zipCode,
        value.country,
      ].filter(part => part && part.trim());
      return addressParts.join(', ');
    }

    if (value.countryCode && value.number) {
      return `${value.countryCode} ${value.number}`;
    }

    if (value.date || value.time) {
      const datePart = value.date
        ? new Date(value.date).toLocaleDateString()
        : '';
      const timePart = value.time || '';
      return `${datePart} ${timePart}`.trim();
    }

    if (value.label && value.value !== undefined) {
      return value.label;
    }

    // Handle fill blank template
    if (value.beforeText && value.afterText && value.userInput) {
      return `${value.beforeText} "${value.userInput}" ${value.afterText}`;
    }

    // Handle product list
    if (value.selectedProducts && typeof value.selectedProducts === 'object') {
      const products = [];
      for (const [productId, quantity] of Object.entries(
        value.selectedProducts
      )) {
        if (quantity && typeof quantity === 'number' && quantity > 0) {
          const product = value.products?.find((p: any) => p.id === productId);
          const productName = product?.name || `Product ${productId}`;
          products.push(`${productName} (x${quantity})`);
        }
      }
      return products.join(', ');
    }

    // Generic object handling
    const meaningfulValues = Object.entries(value)
      .filter(
        ([key, val]) =>
          val !== null &&
          val !== undefined &&
          val !== '' &&
          !key.startsWith('_') &&
          key !== 'id' &&
          key !== 'createdAt' &&
          key !== 'updatedAt'
      )
      .map(([, val]) =>
        formatDisplayValueWithChoiceLabels(val, fieldId, formStructure)
      )
      .filter(val => val && val !== '');

    return meaningfulValues.length > 0 ? meaningfulValues.join(', ') : '';
  }

  return String(value);
};

// Helper function to format single values
const formatSingleValue = (value: any): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    return value
      .map(item => formatSingleValue(item))
      .filter(v => v !== '')
      .join(', ');
  }

  return String(value);
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to get all searchable field IDs from form
const getSearchableFieldIds = (formData: any): string[] => {
  const fieldIds: string[] = [];

  if (formData?.pages && Array.isArray(formData.pages)) {
    formData.pages.forEach((page: any) => {
      if (page.fields && Array.isArray(page.fields)) {
        page.fields.forEach((field: any) => {
          // Include all fields except headings for search
          if (field.id && field.type !== 'heading') {
            fieldIds.push(field.id);
          }
        });
      }
    });
  }

  return fieldIds;
};

// Enhanced CSV export function with proper formatting
const generateEnhancedCSVExport = (submissions: any[], form: any): string => {
  if (!submissions || submissions.length === 0) {
    return 'Submission Date,No Data\n"No submissions found",""';
  }

  // Create field labels map from form structure
  const fieldLabelsMap = createFieldLabelsMap(form);

  // Get all unique field keys from submissions and files
  const allFieldKeys = new Set<string>();
  const fileFieldKeys = new Set<string>();

  submissions.forEach(submission => {
    // Regular data fields
    if (submission.data && typeof submission.data === 'object') {
      Object.keys(submission.data).forEach(key => {
        if (key && typeof key === 'string' && key.trim().length > 0) {
          allFieldKeys.add(key);
        }
      });
    }

    // File fields from files array
    if (submission.files && Array.isArray(submission.files)) {
      submission.files.forEach((file: any) => {
        if (file.fieldId) {
          fileFieldKeys.add(file.fieldId);
          allFieldKeys.add(file.fieldId);
        }
      });
    }
  });

  // Sort field keys for consistent column order
  const sortedFieldKeys = Array.from(allFieldKeys).sort((a, b) => {
    const commonFieldOrder = [
      'name',
      'fullName',
      'firstName',
      'lastName',
      'email',
      'emailAddress',
      'phone',
      'phoneNumber',
      'company',
      'subject',
      'message',
      'address',
    ];

    const aIndex = commonFieldOrder.findIndex(field =>
      a.toLowerCase().includes(field.toLowerCase())
    );
    const bIndex = commonFieldOrder.findIndex(field =>
      b.toLowerCase().includes(field.toLowerCase())
    );

    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    } else if (aIndex !== -1) {
      return -1;
    } else if (bIndex !== -1) {
      return 1;
    } else {
      return a.localeCompare(b);
    }
  });

  // Define CSV headers - Submission Date first, then all form fields
  const headers = [
    'Submission Date',
    ...sortedFieldKeys.map(key => getFieldDisplayLabel(key, fieldLabelsMap)),
  ];

  // Generate CSV content
  let csvContent = '';

  // Add headers
  csvContent += headers.map(header => escapeCSVValue(header)).join(',') + '\n';

  // Add data rows
  submissions.forEach((submission, index) => {
    const rowData = [];

    // First column: Submission Date (properly formatted)
    const formattedDate = formatSubmissionDate(
      submission.submittedAt || submission.createdAt || ''
    );
    rowData.push(escapeCSVValue(formattedDate));

    // Remaining columns: All form field values
    sortedFieldKeys.forEach(fieldKey => {
      let fieldValue = '';

      // Check if this is a file field from files array
      if (fileFieldKeys.has(fieldKey)) {
        // Handle file fields - extract only Cloudinary URLs
        const fieldFiles =
          submission.files?.filter((file: any) => file.fieldId === fieldKey) ||
          [];

        if (fieldFiles.length > 0) {
          // Get only the URLs, no file details
          const fileUrls = fieldFiles
            .map((file: any) => file.url || '')
            .filter(url => url.trim() !== '');

          fieldValue = fileUrls.join('; ');
        } else {
          // Check data object for legacy file storage
          const dataValue = submission.data?.[fieldKey];
          fieldValue = formatValueCloudinaryOnly(dataValue);
        }
      } else {
        // Handle regular data fields
        const dataValue = submission.data?.[fieldKey];
        fieldValue = formatValueCloudinaryOnly(dataValue);
      }

      rowData.push(escapeCSVValue(fieldValue));
    });

    // Add the complete row to CSV
    csvContent += rowData.join(',') + '\n';
  });

  return csvContent;
};

// Format values - Cloudinary URLs only for files/images/signatures
const formatValueCloudinaryOnly = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }

  // Handle direct Cloudinary URLs (including uploaded signatures)
  if (typeof value === 'string') {
    // If it's a Cloudinary URL, return it
    if (
      value.includes('cloudinary.com') ||
      value.includes('res.cloudinary.com')
    ) {
      return value.trim();
    }

    //  UPDATED: Still handle base64 signatures as fallback but show URL indicator
    if (value.startsWith('data:image/')) {
      console.warn(
        '⚠️ Found base64 signature in export - should be Cloudinary URL'
      );
      return '[Digital Signature - Base64 Data]';
    }

    // Regular text values
    return value.trim();
  }

  // Rest of your existing code...
  // Handle file objects with URLs
  if (typeof value === 'object' && value !== null) {
    // Single file object
    if (value.url && typeof value.url === 'string') {
      return value.url.trim();
    }
    // ... rest of existing object handling code
  }

  // Handle other primitive types
  if (typeof value === 'number') {
    return value.toString();
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value).trim();
};

const generateEnhancedCSVExportWithLabels = (
  submissions: any[],
  form: any
): string => {
  if (!submissions || submissions.length === 0) {
    return 'Submission Date,No Data\n"No submissions found",""';
  }

  // Create field labels map from form structure
  const fieldLabelsMap = createFieldLabelsMap(form);

  // Get all unique field keys from submissions and files
  const allFieldKeys = new Set<string>();
  const fileFieldKeys = new Set<string>();

  submissions.forEach(submission => {
    // Regular data fields
    if (submission.data && typeof submission.data === 'object') {
      Object.keys(submission.data).forEach(key => {
        if (key && typeof key === 'string' && key.trim().length > 0) {
          allFieldKeys.add(key);
        }
      });
    }

    // File fields from files array
    if (submission.files && Array.isArray(submission.files)) {
      submission.files.forEach((file: any) => {
        if (file.fieldId) {
          fileFieldKeys.add(file.fieldId);
          allFieldKeys.add(file.fieldId);
        }
      });
    }
  });

  // Sort field keys for consistent column order
  const sortedFieldKeys = Array.from(allFieldKeys).sort((a, b) => {
    const commonFieldOrder = [
      'name',
      'fullName',
      'firstName',
      'lastName',
      'email',
      'emailAddress',
      'phone',
      'phoneNumber',
      'company',
      'subject',
      'message',
      'address',
    ];

    const aIndex = commonFieldOrder.findIndex(field =>
      a.toLowerCase().includes(field.toLowerCase())
    );
    const bIndex = commonFieldOrder.findIndex(field =>
      b.toLowerCase().includes(field.toLowerCase())
    );

    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    } else if (aIndex !== -1) {
      return -1;
    } else if (bIndex !== -1) {
      return 1;
    } else {
      return a.localeCompare(b);
    }
  });

  // Define CSV headers
  const headers = [
    'Submission Date',
    ...sortedFieldKeys.map(key => getFieldDisplayLabel(key, fieldLabelsMap)),
  ];

  // Generate CSV content
  let csvContent = '';

  // Add headers
  csvContent += headers.map(header => escapeCSVValue(header)).join(',') + '\n';

  // Add data rows
  submissions.forEach((submission, index) => {
    const rowData = [];

    // First column: Submission Date
    const formattedDate = formatSubmissionDate(
      submission.submittedAt || submission.createdAt || ''
    );
    rowData.push(escapeCSVValue(formattedDate));

    // Remaining columns: All form field values with choice label mapping
    sortedFieldKeys.forEach(fieldKey => {
      let fieldValue = '';

      // Check if this is a file field
      if (fileFieldKeys.has(fieldKey)) {
        // Handle file fields - extract only Cloudinary URLs
        const fieldFiles =
          submission.files?.filter((file: any) => file.fieldId === fieldKey) ||
          [];

        if (fieldFiles.length > 0) {
          const fileUrls = fieldFiles
            .map((file: any) => file.url || '')
            .filter(url => url.trim() !== '');
          fieldValue = fileUrls.join('; ');
        } else {
          // Check data object for legacy file storage
          const dataValue = submission.data?.[fieldKey];
          if (dataValue) {
            fieldValue = formatDisplayValueWithChoiceLabels(
              dataValue,
              fieldKey,
              form
            );
          }
        }
      } else {
        // Handle regular data fields with choice label mapping
        const dataValue = submission.data?.[fieldKey];
        fieldValue = formatDisplayValueWithChoiceLabels(
          dataValue,
          fieldKey,
          form
        );
      }

      rowData.push(escapeCSVValue(fieldValue));
    });

    // Add the complete row to CSV
    csvContent += rowData.join(',') + '\n';
  });

  return csvContent;
};

// Helper function to format single values (simplified)
const formatSingleValueSimplified = (value: any): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    return value
      .map(item => formatSingleValueSimplified(item))
      .filter(v => v !== '')
      .join(', ');
  }

  return String(value);
};

// Helper function to validate submission data with file support
function validateSubmissionData(
  submissionData: any,
  pages: any[],
  files: any[]
): string[] {
  const errors: string[] = [];

  if (!pages || !Array.isArray(pages)) {
    return errors;
  }

  pages.forEach((page, pageIndex) => {
    if (!page?.fields || !Array.isArray(page.fields)) return;

    page.fields.forEach((field, fieldIndex) => {
      if (!field?.id || !field?.type) return;

      // Skip heading fields completely
      if (field.type === 'heading') {
        return;
      }

      const fieldValue = submissionData[field.id];
      const fieldFiles = files.filter(file => file.fieldId === field.id);

      // Required field validation
      if (field.required === true) {
        if (field.type === 'fileUpload' || field.type === 'image') {
          if (fieldFiles.length === 0) {
            errors.push(
              `${field.label || field.id} requires a file to be uploaded`
            );
            return;
          }
        } else {
          const isEmpty =
            fieldValue === undefined ||
            fieldValue === null ||
            fieldValue === '' ||
            (Array.isArray(fieldValue) && fieldValue.length === 0);

          if (isEmpty) {
            errors.push(`${field.label || field.id} is required`);
            return;
          }

          // Special validation for complex required fields
          if (field.type === 'fullName' && typeof fieldValue === 'object') {
            if (!fieldValue.firstName?.trim() || !fieldValue.lastName?.trim()) {
              errors.push(
                `${field.label || field.id} requires both first and last name`
              );
              return;
            }
          }

          if (field.type === 'address' && typeof fieldValue === 'object') {
            if (
              !fieldValue.street?.trim() ||
              !fieldValue.city?.trim() ||
              !fieldValue.state?.trim()
            ) {
              errors.push(
                `${field.label || field.id} requires street address, city, and state`
              );
              return;
            }
          }

          if (field.type === 'appointment' && typeof fieldValue === 'object') {
            if (!fieldValue.date || !fieldValue.time) {
              errors.push(
                `${field.label || field.id} requires both date and time`
              );
              return;
            }
          }
        }
      }

      // Skip further validation if field is empty and not required
      const isEmpty =
        fieldValue === undefined ||
        fieldValue === null ||
        fieldValue === '' ||
        (Array.isArray(fieldValue) && fieldValue.length === 0);

      if (isEmpty && field.required !== true) {
        return;
      }

      // Field-specific validation for all 19+ field types
      try {
        switch (field.type) {
          case 'shortText':
          case 'longText':
          case 'paragraph':
            if (fieldValue && typeof fieldValue === 'string') {
              const textValue = fieldValue.trim();
              if (field.minLength && textValue.length < field.minLength) {
                errors.push(
                  `${field.label || field.id} must be at least ${field.minLength} characters long`
                );
              }
              if (field.maxLength && textValue.length > field.maxLength) {
                errors.push(
                  `${field.label || field.id} must be no more than ${field.maxLength} characters long`
                );
              }
            }
            break;

          case 'number':
            if (
              fieldValue !== undefined &&
              fieldValue !== null &&
              fieldValue !== ''
            ) {
              const numValue = Number(fieldValue);
              if (isNaN(numValue)) {
                errors.push(
                  `${field.label || field.id} must be a valid number`
                );
              } else {
                if (field.min !== undefined && numValue < field.min) {
                  errors.push(
                    `${field.label || field.id} must be at least ${field.min}`
                  );
                }
                if (field.max !== undefined && numValue > field.max) {
                  errors.push(
                    `${field.label || field.id} must be no more than ${field.max}`
                  );
                }
              }
            }
            break;

          case 'dropdown':
          case 'singleChoice':
            if (fieldValue && field.options && Array.isArray(field.options)) {
              const validOptions = field.options.map(
                (opt: any) => opt.value || opt
              );
              if (!validOptions.includes(fieldValue)) {
                errors.push(
                  `${field.label || field.id} contains an invalid option`
                );
              }
            }
            break;

          case 'multipleChoice':
            if (fieldValue) {
              if (Array.isArray(fieldValue)) {
                if (field.options && Array.isArray(field.options)) {
                  const validOptions = field.options.map(
                    (opt: any) => opt.value || opt
                  );
                  const invalidOptions = fieldValue.filter(
                    (val: any) => !validOptions.includes(val)
                  );
                  if (invalidOptions.length > 0) {
                    errors.push(
                      `${field.label || field.id} contains invalid options: ${invalidOptions.join(', ')}`
                    );
                  }
                }
              } else {
                errors.push(
                  `${field.label || field.id} must be an array for multiple choice`
                );
              }
            }
            break;

          case 'email':
            if (fieldValue && typeof fieldValue === 'string') {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(fieldValue.trim())) {
                errors.push(
                  `${field.label || field.id} must be a valid email address`
                );
              }
            }
            break;

          case 'phone':
            if (fieldValue && typeof fieldValue === 'string') {
              const cleanPhone = fieldValue.replace(/\D/g, '');
              let phoneDigits = cleanPhone;

              // Handle Indian country code
              if (phoneDigits.startsWith('91') && phoneDigits.length === 12) {
                phoneDigits = phoneDigits.substring(2);
              }

              // Flexible phone validation - accept 10 digits starting with common prefixes
              if (phoneDigits.length !== 10) {
                errors.push(
                  `${field.label || field.id} must be a valid 10-digit phone number`
                );
              } else {
                const firstDigit = phoneDigits.charAt(0);
                if (
                  !['6', '7', '8', '9', '2', '3', '4', '5'].includes(firstDigit)
                ) {
                  errors.push(
                    `${field.label || field.id} must start with a valid digit (2-9)`
                  );
                }
              }
            }
            break;

          case 'time':
            if (fieldValue && typeof fieldValue === 'string') {
              const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
              if (!timeRegex.test(fieldValue)) {
                errors.push(
                  `${field.label || field.id} must be a valid time format (HH:MM)`
                );
              }
            }
            break;

          case 'datePicker':
            if (fieldValue && typeof fieldValue === 'string') {
              const date = new Date(fieldValue);
              if (isNaN(date.getTime())) {
                errors.push(`${field.label || field.id} must be a valid date`);
              }
            }
            break;

          case 'fullName':
            if (fieldValue) {
              if (typeof fieldValue === 'object') {
                const firstName = fieldValue.firstName?.trim() || '';
                const lastName = fieldValue.lastName?.trim() || '';

                if (!firstName || !lastName) {
                  errors.push(
                    `${field.label || field.id} requires both first and last name`
                  );
                } else {
                  // Validate name format (only letters, spaces, apostrophes, hyphens)
                  const namePattern = /^[a-zA-Z\s'-]+$/;

                  if (!namePattern.test(firstName)) {
                    errors.push(
                      `${field.label || field.id} first name can only contain letters, spaces, apostrophes, and hyphens`
                    );
                  }

                  if (!namePattern.test(lastName)) {
                    errors.push(
                      `${field.label || field.id} last name can only contain letters, spaces, apostrophes, and hyphens`
                    );
                  }

                  // Check minimum length
                  if (firstName.length < 2) {
                    errors.push(
                      `${field.label || field.id} first name must be at least 2 characters long`
                    );
                  }

                  if (lastName.length < 2) {
                    errors.push(
                      `${field.label || field.id} last name must be at least 2 characters long`
                    );
                  }

                  // Check for excessive spaces
                  if (firstName.includes('  ') || lastName.includes('  ')) {
                    errors.push(
                      `${field.label || field.id} names cannot contain multiple consecutive spaces`
                    );
                  }
                }
              }
            }
            break;

          case 'address':
            if (fieldValue && typeof fieldValue === 'object') {
              if (
                !fieldValue.street?.trim() ||
                !fieldValue.city?.trim() ||
                !fieldValue.state?.trim()
              ) {
                errors.push(
                  `${field.label || field.id} requires street address, city, and state`
                );
              } else {
                // Validate city and state don't contain numbers
                const city = fieldValue.city?.trim() || '';
                const state = fieldValue.state?.trim() || '';
                const country = fieldValue.country?.trim() || '';

                const namePattern = /^[a-zA-Z\s'-]+$/;

                if (city && !namePattern.test(city)) {
                  errors.push(
                    `${field.label || field.id} city name can only contain letters, spaces, apostrophes, and hyphens`
                  );
                }

                if (state && !namePattern.test(state)) {
                  errors.push(
                    `${field.label || field.id} state/province name can only contain letters, spaces, apostrophes, and hyphens`
                  );
                }

                if (country && !namePattern.test(country)) {
                  errors.push(
                    `${field.label || field.id} country name can only contain letters, spaces, apostrophes, and hyphens`
                  );
                }

                // Check minimum lengths
                if (city.length < 2) {
                  errors.push(
                    `${field.label || field.id} city name must be at least 2 characters long`
                  );
                }

                if (state.length < 2) {
                  errors.push(
                    `${field.label || field.id} state/province name must be at least 2 characters long`
                  );
                }
              }
            }
            break;

          case 'appointment':
            if (fieldValue && typeof fieldValue === 'object') {
              if (!fieldValue.date || !fieldValue.time) {
                errors.push(
                  `${field.label || field.id} requires both date and time`
                );
              } else {
                // Validate date format
                const date = new Date(fieldValue.date);
                if (isNaN(date.getTime())) {
                  errors.push(`${field.label || field.id} has invalid date`);
                }
                // Validate time format
                const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
                if (!timeRegex.test(fieldValue.time)) {
                  errors.push(
                    `${field.label || field.id} has invalid time format`
                  );
                }
              }
            }
            break;

          case 'signature':
            if (fieldValue && typeof fieldValue === 'string') {
              // Check if it's a valid data URL for canvas signature
              if (fieldValue.startsWith('data:image/')) {
                // Validate data URL format
                const dataUrlRegex = /^data:image\/(png|jpeg|jpg);base64,/;
                if (!dataUrlRegex.test(fieldValue)) {
                  errors.push(
                    `${field.label || field.id} contains an invalid signature format`
                  );
                }
                // Check size (base64 encoded signatures shouldn't be too large)
                if (fieldValue.length > 500000) {
                  // ~375KB limit for base64
                  errors.push(
                    `${field.label || field.id} signature is too large`
                  );
                }
              } else if (fieldValue.trim().length === 0) {
                errors.push(
                  `${field.label || field.id} signature cannot be empty`
                );
              }
            }
            break;

          case 'fillBlank':
            if (fieldValue) {
              if (typeof fieldValue === 'object') {
                // New format with template and user input
                if (
                  !fieldValue.userInput ||
                  fieldValue.userInput.trim() === ''
                ) {
                  if (field.required) {
                    errors.push(
                      `${field.label || field.id} requires completion of the blank`
                    );
                  }
                } else {
                  // Validate user input length
                  const userInput = fieldValue.userInput.trim();
                  if (userInput.length > 200) {
                    errors.push(
                      `${field.label || field.id} input cannot exceed 200 characters`
                    );
                  }
                }

                // Validate template structure if provided
                if (
                  fieldValue.beforeText &&
                  fieldValue.beforeText.length > 500
                ) {
                  errors.push(
                    `${field.label || field.id} template text is too long`
                  );
                }
                if (fieldValue.afterText && fieldValue.afterText.length > 500) {
                  errors.push(
                    `${field.label || field.id} template text is too long`
                  );
                }
              } else if (typeof fieldValue === 'string') {
                // Legacy format - just the filled value
                if (fieldValue.trim().length === 0) {
                  errors.push(`${field.label || field.id} cannot be empty`);
                } else if (fieldValue.length > 200) {
                  errors.push(
                    `${field.label || field.id} cannot exceed 200 characters`
                  );
                }
              }
            }
            break;

          case 'productList':
            if (fieldValue) {
              if (typeof fieldValue === 'object') {
                const { products, selectedProducts } = fieldValue;

                // Validate products structure
                if (products && Array.isArray(products)) {
                  products.forEach((product: any, index: number) => {
                    if (!product.id || !product.name) {
                      errors.push(
                        `${field.label || field.id} has invalid product at position ${index + 1}`
                      );
                    }
                    if (
                      typeof product.price !== 'number' ||
                      product.price < 0
                    ) {
                      errors.push(
                        `${field.label || field.id} has invalid price for product "${product.name}"`
                      );
                    }
                  });
                }

                // Validate selections
                if (selectedProducts && typeof selectedProducts === 'object') {
                  const hasSelections = Object.values(selectedProducts).some(
                    (qty: any) => qty && qty > 0
                  );

                  if (field.required && !hasSelections) {
                    errors.push(
                      `${field.label || field.id} requires at least one product to be selected`
                    );
                  }

                  // Validate quantities
                  Object.entries(selectedProducts).forEach(
                    ([productId, quantity]) => {
                      if (typeof quantity !== 'number' || quantity < 0) {
                        errors.push(
                          `${field.label || field.id} has invalid quantity for product`
                        );
                      }
                      if (typeof quantity === 'number' && quantity > 1000) {
                        errors.push(
                          `${field.label || field.id} quantity cannot exceed 1000 per product`
                        );
                      }
                    }
                  );
                }
              } else {
                errors.push(
                  `${field.label || field.id} must be a valid product selection`
                );
              }
            }
            break;

          // File upload validations
          case 'image':
            if (fieldFiles.length > 0) {
              fieldFiles.forEach((file: any) => {
                if (!file.mimeType || !file.mimeType.startsWith('image/')) {
                  errors.push(
                    `${field.label || field.id} only accepts image files`
                  );
                }
                if (file.size && file.size > 10 * 1024 * 1024) {
                  errors.push(
                    `Image in ${field.label || field.id} exceeds 10MB limit`
                  );
                }
              });

              if (!field.multiple && fieldFiles.length > 1) {
                errors.push(`${field.label || field.id} only allows one image`);
              }
            }
            break;

          case 'fileUpload':
            if (fieldFiles.length > 0) {
              fieldFiles.forEach((file: any) => {
                if (field.accept && field.accept !== '*/*') {
                  const allowedTypes = field.accept
                    .split(',')
                    .map((type: string) => type.trim());
                  const isTypeAllowed = allowedTypes.some((type: string) => {
                    if (type.startsWith('.')) {
                      return (
                        file.originalName &&
                        file.originalName
                          .toLowerCase()
                          .endsWith(type.toLowerCase())
                      );
                    } else if (type.endsWith('/*')) {
                      const baseType = type.slice(0, -2);
                      return (
                        file.mimeType && file.mimeType.startsWith(baseType)
                      );
                    } else {
                      return file.mimeType === type;
                    }
                  });

                  if (!isTypeAllowed) {
                    errors.push(
                      `File "${file.originalName}" in ${field.label || field.id} is not an allowed file type`
                    );
                  }
                }

                if (file.size && file.size > 25 * 1024 * 1024) {
                  errors.push(
                    `File "${file.originalName}" in ${field.label || field.id} exceeds 25MB limit`
                  );
                }
              });

              if (!field.multiple && fieldFiles.length > 1) {
                errors.push(`${field.label || field.id} only allows one file`);
              }
            }
            break;

          default:
            break;
        }
      } catch (validationError: any) {
        // console.error(
        //   `❌ Validation error for field ${field.id}:`,
        //   validationError
        // );
        errors.push(
          `${field.label || field.id} validation failed: ${validationError.message}`
        );
      }
    });
  });

  return errors;
}

// ===== ROUTE HANDLERS =====

// @desc    Get all submissions for a form
// @route   GET /api/submissions/form/:formId
// @access  Private
router.get(
  '/form/:formId',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { formId } = req.params;
    const {
      page = '1',
      limit = '20',
      sortBy = 'submittedAt',
      sortOrder = 'desc',
      search,
      dateFrom,
      dateTo,
      status,
      isRead,
    } = req.query;

    // Validate formId
    if (!mongoose.Types.ObjectId.isValid(formId)) {
      throw new ApiError('Invalid form ID format', 400);
    }

    // Verify form belongs to user and get form structure for dynamic search
    const form = await Form.findOne({ _id: formId, userId: req.user.id });
    if (!form) {
      throw new ApiError('Form not found', 404);
    }

    // Build query
    const query: any = { formId };

    // Date range filter
    if (dateFrom || dateTo) {
      query.submittedAt = {};
      if (dateFrom) {
        query.submittedAt.$gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        const endDate = new Date(dateTo as string);
        endDate.setHours(23, 59, 59, 999); // End of day
        query.submittedAt.$lte = endDate;
      }
    }

    // Status filter
    if (
      status &&
      ['pending', 'processed', 'failed'].includes(status as string)
    ) {
      query.status = status;
    }

    // Read status filter
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    // Dynamic search across all form fields
    if (search && search.toString().trim()) {
      const searchTerm = search.toString().trim();
      

      const searchFields = [];

      // Add default/common searchable fields
      searchFields.push(
        { 'data.email': { $regex: searchTerm, $options: 'i' } },
        { 'data.name': { $regex: searchTerm, $options: 'i' } },
        { 'data.fullName.firstName': { $regex: searchTerm, $options: 'i' } },
        { 'data.fullName.lastName': { $regex: searchTerm, $options: 'i' } },
        { 'data.phone': { $regex: searchTerm, $options: 'i' } },
        { 'data.phoneNumber': { $regex: searchTerm, $options: 'i' } },
        { 'data.emailAddress': { $regex: searchTerm, $options: 'i' } },
        { 'data.firstName': { $regex: searchTerm, $options: 'i' } },
        { 'data.lastName': { $regex: searchTerm, $options: 'i' } },
        { 'data.company': { $regex: searchTerm, $options: 'i' } },
        { 'data.message': { $regex: searchTerm, $options: 'i' } },
        { 'data.subject': { $regex: searchTerm, $options: 'i' } }
      );

      // Add ALL dynamic form fields to search
      const dynamicFieldIds = getSearchableFieldIds(form);
     

      dynamicFieldIds.forEach(fieldId => {
        // Search in simple string fields
        searchFields.push({
          [`data.${fieldId}`]: { $regex: searchTerm, $options: 'i' },
        });

        // Search in complex object fields (like fullName: {firstName, lastName})
        searchFields.push({
          [`data.${fieldId}.firstName`]: { $regex: searchTerm, $options: 'i' },
        });
        searchFields.push({
          [`data.${fieldId}.lastName`]: { $regex: searchTerm, $options: 'i' },
        });
        searchFields.push({
          [`data.${fieldId}.street`]: { $regex: searchTerm, $options: 'i' },
        });
        searchFields.push({
          [`data.${fieldId}.city`]: { $regex: searchTerm, $options: 'i' },
        });
        searchFields.push({
          [`data.${fieldId}.state`]: { $regex: searchTerm, $options: 'i' },
        });
      });

      query.$or = searchFields;
      
    }

    // Pagination
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = Math.min(parseInt(limit as string, 10) || 20, 100); // Max 100 per page
    const skip = (pageNum - 1) * limitNum;

    // Sort options
    const sortObj: any = {};
    const validSortFields = ['submittedAt', 'createdAt', 'status', 'isRead'];
    const sortField = validSortFields.includes(sortBy as string)
      ? (sortBy as string)
      : 'submittedAt';
    sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;

    const [submissions, total] = await Promise.all([
      Submission.find(query).sort(sortObj).skip(skip).limit(limitNum).lean(),
      Submission.countDocuments(query),
    ]);

    

    // Get submission statistics
    const stats = await Submission.aggregate([
      { $match: { formId: new mongoose.Types.ObjectId(formId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          processed: {
            $sum: { $cond: [{ $eq: ['$status', 'processed'] }, 1, 0] },
          },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        submissions,
        stats: stats[0] || {
          total: 0,
          unread: 0,
          pending: 0,
          processed: 0,
          failed: 0,
        },
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total,
          limit: limitNum,
        },
      },
    });
  })
);

// @desc    Get single submission
// @route   GET /api/submissions/:id
// @access  Private
router.get(
  '/:id',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid submission ID format', 400);
    }

    const submission = await Submission.findById(id).populate('formId');

    if (!submission) {
      throw new ApiError('Submission not found', 404);
    }

    // Verify form belongs to user
    const form = await Form.findOne({
      _id: submission.formId,
      userId: req.user.id,
    });
    if (!form) {
      throw new ApiError('Not authorized to access this submission', 403);
    }

    // Mark as read if not already
    if (!(submission as any).isRead) {
      await Submission.findByIdAndUpdate(id, { isRead: true });
    }

    res.status(200).json({
      success: true,
      data: submission,
    });
  })
);

// @desc    Submit form data (public endpoint) - COMPLETE  VERSION
// @route   POST /api/submissions/:formId/submit
// @access  Public
router.post(
  '/:formId/submit',
  monitorFormSubmissionPerformance,
  debugFormSubmission,
  asyncHandler(async (req: Request, res: Response) => {
    const { formId } = req.params;
    const requestBody = req.body;

  

    // STEP 1: Validate Form ID
    if (!mongoose.Types.ObjectId.isValid(formId)) {
      // console.error('❌ Invalid form ID format:', formId);
      return res.status(400).json({
        success: false,
        error: 'INVALID_FORM_ID',
        message: 'Invalid form ID format',
        details: { formId },
      });
    }

    // STEP 2: Find and validate form
    const form = await Form.findById(formId);
    if (!form) {
      // console.error('❌ Form not found:', formId);
      return res.status(404).json({
        success: false,
        error: 'FORM_NOT_FOUND',
        message: 'Form not found',
      });
    }

    // STEP 3: Check form availability
    if (!form.isPublished) {
      return res.status(403).json({
        success: false,
        error: 'FORM_NOT_PUBLISHED',
        message: 'This form is not currently accepting submissions',
      });
    }

    if (form.settings?.isEnabled === false) {
      return res.status(403).json({
        success: false,
        error: 'FORM_DISABLED',
        message: 'This form is currently disabled',
      });
    }

    if (form.isTrashed || form.isArchived) {
      return res.status(403).json({
        success: false,
        error: 'FORM_UNAVAILABLE',
        message: 'This form is no longer available',
      });
    }

    // STEP 4: Extract and validate request data
    const submissionData = requestBody.data || {};
    const fileData = requestBody.files || {};

    
    // STEP 5: Process files
    const processedFiles: Array<{
      fieldId: string;
      originalName: string;
      fileName: string;
      url: string;
      publicId: string;
      size: number;
      mimeType: string;
      uploadedAt: Date;
    }> = [];

    if (submissionData && typeof submissionData === 'object') {
      for (const [fieldId, value] of Object.entries(submissionData)) {
        // Check if this is a signature field with base64 data
        if (typeof value === 'string' && value.startsWith('data:image/')) {
         

          try {
            // Convert base64 to buffer
            const base64Data = value.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');

            // Upload signature to Cloudinary
            const uploadResult = await uploadFormFile(
              buffer,
              `signature_${fieldId}_${Date.now()}.png`,
              'image/png',
              fieldId,
              formId
            );

            // Replace base64 data with Cloudinary URL in submission data
            submissionData[fieldId] = uploadResult.url;

            // Also add to processed files for consistency
            processedFiles.push({
              fieldId,
              originalName: `signature_${fieldId}.png`,
              fileName: uploadResult.fileName,
              url: uploadResult.url,
              publicId: uploadResult.publicId,
              size: uploadResult.size,
              mimeType: 'image/png',
              uploadedAt: new Date(),
            });

            
          } catch (error) {
            console.error(
              `❌ Failed to upload signature for field ${fieldId}:`,
              error
            );
            // Keep the base64 as fallback
          }
        }
      }
    }

    if (fileData && typeof fileData === 'object') {
      for (const [fieldId, fieldFiles] of Object.entries(fileData)) {
        if (!fieldFiles) continue;

        if (Array.isArray(fieldFiles)) {
          // Multiple files
          fieldFiles.forEach((file: any) => {
            if (file && file.url && file.publicId) {
              processedFiles.push({
                fieldId,
                originalName: file.originalName || 'uploaded_file',
                fileName: file.fileName || file.originalName || 'uploaded_file',
                url: file.url,
                publicId: file.publicId,
                size: file.size || 0,
                mimeType: file.mimeType || 'application/octet-stream',
                uploadedAt: file.uploadedAt
                  ? new Date(file.uploadedAt)
                  : new Date(),
              });
            }
          });
        } else if (fieldFiles && typeof fieldFiles === 'object') {
          // Single file
          const fileObj = fieldFiles as any;
          if (fileObj.url && fileObj.publicId) {
            processedFiles.push({
              fieldId,
              originalName: fileObj.originalName || 'uploaded_file',
              fileName:
                fileObj.fileName || fileObj.originalName || 'uploaded_file',
              url: fileObj.url,
              publicId: fileObj.publicId,
              size: fileObj.size || 0,
              mimeType: fileObj.mimeType || 'application/octet-stream',
              uploadedAt: fileObj.uploadedAt
                ? new Date(fileObj.uploadedAt)
                : new Date(),
            });
          }
        }
      }
    }

   

    // STEP 6: Validate form structure and data
    const hasFormFields = form.pages?.some(
      page =>
        page.fields && Array.isArray(page.fields) && page.fields.length > 0
    );

    if (!hasFormFields) {
      console.error('Form has no fields - allowing submission');
    } else {
     

      const validationErrors = validateSubmissionData(
        submissionData,
        form.pages || [],
        processedFiles
      );

      if (validationErrors.length > 0) {
        // console.error('❌ Validation errors:', validationErrors);
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_FAILED',
          message: `Validation failed: ${validationErrors.join('; ')}`,
          errors: validationErrors,
        });
      }
    }

    // STEP 7: Check for duplicate submissions (if configured)
    if (!form.settings?.allowMultipleSubmissions) {
      const clientIp = req.ip || req.connection.remoteAddress;
      if (clientIp) {
        const recentSubmission = await Submission.findOne({
          formId,
          ipAddress: clientIp,
          submittedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        });

        if (recentSubmission) {
          return res.status(429).json({
            success: false,
            error: 'DUPLICATE_SUBMISSION',
            message: 'You have already submitted this form recently',
          });
        }
      }
    }

    // STEP 8: Create submission record
    try {
      const submissionPayload = {
        formId: new mongoose.Types.ObjectId(formId),
        data: submissionData,
        files: processedFiles,
        submittedAt: new Date(),
        status: 'processed' as const,
        ipAddress:
          form.settings?.collectIpAddress !== false
            ? req.ip || req.connection.remoteAddress
            : undefined,
        userAgent: req.get('User-Agent'),
        referrer: req.get('Referer'),
        metadata: {
          timestamp: new Date().toISOString(),
          formVersion: form.updatedAt,
          fileCount: processedFiles.length,
          totalFileSize: processedFiles.reduce(
            (sum, file) => sum + file.size,
            0
          ),
          fieldCount: Object.keys(submissionData).length,
          hasFiles: processedFiles.length > 0,
        },
      };

     

      const submission = await Submission.create(submissionPayload);

      // STEP 9: Update form submission counter
      await Form.findByIdAndUpdate(formId, {
        $inc: { submissions: 1 },
        $set: { updatedAt: new Date() },
      });

     

      //  STEP 10: Return success response
      return res.status(201).json({
        success: true,
        data: {
          submissionId: submission._id,
          message:
            form.settings?.thankyouMessage || 'Thank you for your submission!',
          submittedAt: submission.submittedAt,
          fileCount: processedFiles.length,
        },
        message: 'Form submitted successfully',
      });
    } catch (saveError: any) {
      console.error('❌ Failed to save submission:', {
        error: saveError.message,
        stack: saveError.stack,
        formId,
      });

      return res.status(500).json({
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to save form submission. Please try again.',
        ...(process.env.NODE_ENV === 'development' && {
          details: saveError.message,
        }),
      });
    }
  })
);

// @desc    Update submission status
// @route   PATCH /api/submissions/:id/status
// @access  Private
router.patch(
  '/:id/status',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid submission ID format', 400);
    }

    if (!['pending', 'processed', 'failed'].includes(status)) {
      throw new ApiError('Invalid status value', 400);
    }

    const submission = await Submission.findById(id);
    if (!submission) {
      throw new ApiError('Submission not found', 404);
    }

    // Verify form ownership
    const form = await Form.findOne({
      _id: submission.formId,
      userId: req.user.id,
    });
    if (!form) {
      throw new ApiError('Not authorized to update this submission', 403);
    }

    await Submission.findByIdAndUpdate(id, { status });

    res.status(200).json({
      success: true,
      data: { status: status },
      message: 'Submission status updated successfully',
    });
  })
);

// @desc    Mark submission as read/unread
// @route   PATCH /api/submissions/:id/read
// @access  Private
router.patch(
  '/:id/read',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isRead } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid submission ID format', 400);
    }

    const submission = await Submission.findById(id);
    if (!submission) {
      throw new ApiError('Submission not found', 404);
    }

    // Verify form ownership
    const form = await Form.findOne({
      _id: submission.formId,
      userId: req.user.id,
    });
    if (!form) {
      throw new ApiError('Not authorized to update this submission', 403);
    }

    await Submission.findByIdAndUpdate(id, { isRead: Boolean(isRead) });

    res.status(200).json({
      success: true,
      data: { isRead: Boolean(isRead) },
      message: `Submission marked as ${Boolean(isRead) ? 'read' : 'unread'}`,
    });
  })
);

// @desc    Add tag to submission
// @route   POST /api/submissions/:id/tags
// @access  Private
router.post(
  '/:id/tags',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { tag } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid submission ID format', 400);
    }

    if (!tag || typeof tag !== 'string' || tag.trim().length === 0) {
      throw new ApiError('Tag is required and must be a non-empty string', 400);
    }

    const submission = await Submission.findById(id);
    if (!submission) {
      throw new ApiError('Submission not found', 404);
    }

    // Verify form ownership
    const form = await Form.findOne({
      _id: submission.formId,
      userId: req.user.id,
    });
    if (!form) {
      throw new ApiError('Not authorized to update this submission', 403);
    }

    await Submission.findByIdAndUpdate(id, {
      $addToSet: { tags: tag.trim() },
    });

    // Fetch updated submission to get the tags
    const updatedSubmission = await Submission.findById(id);

    res.status(200).json({
      success: true,
      data: { tags: (updatedSubmission as any)?.tags || [] },
      message: 'Tag added successfully',
    });
  })
);

// @desc    Validate export request
// @route   POST /api/submissions/form/:formId/validate-export
// @access  Private
router.post(
  '/form/:formId/validate-export',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { formId } = req.params;
    const { filters = {} } = req.body;

    if (!mongoose.Types.ObjectId.isValid(formId)) {
      throw new ApiError('Invalid form ID format', 400);
    }

    // Verify form belongs to user
    const form = await Form.findOne({ _id: formId, userId: req.user.id });
    if (!form) {
      throw new ApiError('Form not found', 404);
    }

    // Build query based on filters
    const query: any = { formId };

    // Apply filters similar to main export
    if (filters.dateFrom || filters.dateTo) {
      query.submittedAt = {};
      if (filters.dateFrom) query.submittedAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.submittedAt.$lte = endDate;
      }
    }

    if (
      filters.status &&
      ['pending', 'processed', 'failed'].includes(filters.status)
    ) {
      query.status = filters.status;
    }

    if (filters.isRead !== undefined) {
      query.isRead = filters.isRead === 'true';
    }

    // Get estimated counts
    const estimatedRows = await Submission.countDocuments(query);

    // Calculate warnings and errors
    const warnings: string[] = [];
    const errors: string[] = [];

    // Size warnings
    if (estimatedRows > 10000) {
      warnings.push(
        `Large export: ${estimatedRows} submissions. This may take several minutes.`
      );
    }

    if (estimatedRows > 50000) {
      warnings.push(
        'Very large export. Consider filtering by date range or status.'
      );
    }

    // File size estimation
    const avgRowSize = 150; // Conservative estimate including file URLs
    const estimatedSizeBytes = estimatedRows * avgRowSize;
    const estimatedSizeMB = estimatedSizeBytes / (1024 * 1024);

    if (estimatedSizeMB > 50) {
      warnings.push(
        `Estimated file size: ${Math.round(estimatedSizeMB)}MB. Large files may be slow to download.`
      );
    }

    // Validation errors
    if (estimatedRows === 0) {
      errors.push('No submissions match the specified filters.');
    }

    if (estimatedSizeMB > 100) {
      errors.push(
        'Export too large (>100MB). Please filter your data to reduce size.'
      );
    }

    // Form validation
    if (!form.pages || form.pages.length === 0) {
      warnings.push(
        'Form has no fields defined. Export will only contain submission dates.'
      );
    }

    res.status(200).json({
      success: true,
      data: {
        isValid: errors.length === 0,
        estimatedRows,
        estimatedSize: formatFileSize(estimatedSizeBytes),
        warnings,
        errors,
        recommendations:
          estimatedRows > 5000
            ? [
                'Consider filtering by date range to reduce export size',
                'Large exports may take several minutes to complete',
                'Ensure stable internet connection for large downloads',
              ]
            : [],
      },
    });
  })
);

// @desc    Remove tag from submission
// @route   DELETE /api/submissions/:id/tags/:tag
// @access  Private
router.delete(
  '/:id/tags/:tag',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { id, tag } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid submission ID format', 400);
    }

    const submission = await Submission.findById(id);
    if (!submission) {
      throw new ApiError('Submission not found', 404);
    }

    // Verify form ownership
    const form = await Form.findOne({
      _id: submission.formId,
      userId: req.user.id,
    });
    if (!form) {
      throw new ApiError('Not authorized to update this submission', 403);
    }

    await Submission.findByIdAndUpdate(id, {
      $pull: { tags: decodeURIComponent(tag) },
    });

    // Fetch updated submission to get the tags
    const updatedSubmission = await Submission.findById(id);

    res.status(200).json({
      success: true,
      data: { tags: (updatedSubmission as any)?.tags || [] },
      message: 'Tag removed successfully',
    });
  })
);

// @desc    Delete submission permanently with all associated files
// @route   DELETE /api/submissions/:id
// @access  Private
router.delete(
  '/:id',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

  

    // Validate submission ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid submission ID format', 400);
    }

    // Step 1: Find and verify submission
    const submission = await Submission.findById(id);
    if (!submission) {
     
      throw new ApiError('Submission not found', 404);
    }

    // Step 2: Verify form ownership
    const form = await Form.findOne({
      _id: submission.formId,
      userId: req.user.id,
    });
    if (!form) {
      
      throw new ApiError('Not authorized to delete this submission', 403);
    }

   

    // Step 3: Collect all files to delete
    const filesToDelete: any[] = [];

    // Files from submission.files array
    if (submission.files && Array.isArray(submission.files)) {
      filesToDelete.push(...submission.files);
      
    }

    // Files from submission.data (legacy format and base64 signatures)
    if (submission.data && typeof submission.data === 'object') {
      Object.entries(submission.data).forEach(([fieldId, value]) => {
        if (value && typeof value === 'object') {
          // Single file object
          if (value.publicId && value.url) {
            filesToDelete.push(value);
          }
          // Array of file objects
          if (Array.isArray(value)) {
            value.forEach(item => {
              if (item && item.publicId && item.url) {
                filesToDelete.push(item);
              }
            });
          }
        }
        // Handle base64 signatures stored as URLs
        if (typeof value === 'string' && value.includes('cloudinary.com')) {
          // Extract public ID from Cloudinary URL if needed
          const urlParts = value.split('/');
          const publicIdWithFormat = urlParts[urlParts.length - 1];
          const publicId = publicIdWithFormat.split('.')[0];

          if (publicId) {
            filesToDelete.push({
              publicId,
              mimeType: 'image/png', // Assume signature is PNG
              url: value,
              fieldId,
            });
          }
        }
      });
    }



    // Step 4: Delete files from Cloudinary
    let fileCleanupResult;
    if (filesToDelete.length > 0) {
      try {
       
        fileCleanupResult = await deleteSubmissionFiles(filesToDelete);

       
      } catch (fileError: any) {
        console.error(
          `⚠️ File cleanup failed (continuing with database cleanup):`,
          fileError
        );
        // Continue with database cleanup even if file cleanup fails
      }
    } 
    // Step 5: Delete submission from database
    try {
      await Submission.findByIdAndDelete(id);
     
    } catch (dbError: any) {
      console.error(`❌ Failed to delete submission from database:`, dbError);
      throw new ApiError('Failed to delete submission from database', 500);
    }

    // Step 6: Update form submission count
    try {
      await Form.findByIdAndUpdate(submission.formId, {
        $inc: { submissions: -1 },
        $set: { updatedAt: new Date() },
      });
      
    } catch (countError: any) {
      console.warn(`⚠️ Failed to update form submission count:`, countError);
    }

    // Step 7: Prepare response
    const response = {
      success: true,
      message: 'Submission and associated files permanently deleted',
      details: {
        submissionId: id,
        formId: submission.formId.toString(),
        formTitle: form.title,
        filesProcessed: fileCleanupResult?.total || 0,
        filesDeleted: fileCleanupResult?.successCount || 0,
        filesFailed: fileCleanupResult?.failureCount || 0,
        timestamp: new Date().toISOString(),
      },
    };

   

    res.status(200).json(response);
  })
);

// @desc    Delete specific file from submission
// @route   DELETE /api/submissions/:submissionId/files/:fieldId/:publicId
// @access  Private
router.delete(
  '/:submissionId/files/:fieldId/:publicId',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { submissionId, fieldId, publicId } = req.params;

    

    // Validate submission ID
    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      throw new ApiError('Invalid submission ID format', 400);
    }

    // Decode the public ID (in case it was URL encoded)
    const decodedPublicId = decodeURIComponent(publicId);

    // Step 1: Find and verify submission
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      throw new ApiError('Submission not found', 404);
    }

    // Step 2: Verify form ownership
    const form = await Form.findOne({
      _id: submission.formId,
      userId: req.user.id,
    });
    if (!form) {
      throw new ApiError('Not authorized to modify this submission', 403);
    }

    // Step 3: Find the file to delete
    let fileToDelete: any = null;
    let fileLocation: 'files_array' | 'data_object' | 'not_found' = 'not_found';

    // Check in submission.files array
    if (submission.files && Array.isArray(submission.files)) {
      fileToDelete = submission.files.find(
        file => file.fieldId === fieldId && file.publicId === decodedPublicId
      );
      if (fileToDelete) {
        fileLocation = 'files_array';
      }
    }

    // Check in submission.data object (legacy storage)
    if (!fileToDelete && submission.data && submission.data[fieldId]) {
      const fieldValue = submission.data[fieldId];

      // Single file object
      if (fieldValue.publicId === decodedPublicId) {
        fileToDelete = fieldValue;
        fileLocation = 'data_object';
      }

      // Array of file objects
      if (Array.isArray(fieldValue)) {
        fileToDelete = fieldValue.find(
          file => file.publicId === decodedPublicId
        );
        if (fileToDelete) {
          fileLocation = 'data_object';
        }
      }
    }

    if (!fileToDelete) {
      throw new ApiError('File not found in submission', 404);
    }

    

    // Step 4: Delete file from Cloudinary
    let cloudinarySuccess = false;
    try {
      const resourceType = fileToDelete.mimeType?.startsWith('image/')
        ? 'image'
        : 'raw';
      const deleteResult = await deleteFormFile(decodedPublicId, resourceType);

      cloudinarySuccess = deleteResult.success;

      if (!cloudinarySuccess) {
        console.warn(`⚠️ Cloudinary deletion failed: ${deleteResult.error}`);
        // Continue with database cleanup even if Cloudinary fails
      } 
    } catch (cloudinaryError: any) {
      console.error(`❌ Cloudinary deletion error:`, cloudinaryError);
      // Continue with database cleanup
    }

    // Step 5: Remove file from submission in database
    let databaseSuccess = false;
    try {
      if (fileLocation === 'files_array') {
        // Remove from files array
        await Submission.findByIdAndUpdate(submissionId, {
          $pull: {
            files: {
              fieldId: fieldId,
              publicId: decodedPublicId,
            },
          },
          $set: {
            updatedAt: new Date(),
          },
        });

       
        databaseSuccess = true;
      } else if (fileLocation === 'data_object') {
        // Update data object
        const fieldValue = submission.data[fieldId];

        if (Array.isArray(fieldValue)) {
          // Remove from array
          const updatedArray = fieldValue.filter(
            file => file.publicId !== decodedPublicId
          );

          const updateQuery =
            updatedArray.length > 0
              ? { [`data.${fieldId}`]: updatedArray }
              : { $unset: { [`data.${fieldId}`]: 1 } };

          await Submission.findByIdAndUpdate(submissionId, {
            ...updateQuery,
            $set: { updatedAt: new Date() },
          });
        } else {
          // Remove single file field
          await Submission.findByIdAndUpdate(submissionId, {
            $unset: { [`data.${fieldId}`]: 1 },
            $set: { updatedAt: new Date() },
          });
        }

        
        databaseSuccess = true;
      }
    } catch (dbError: any) {
      console.error(`❌ Database update failed:`, dbError);
      throw new ApiError('Failed to update submission in database', 500);
    }

    // Step 6: Prepare response
    const response = {
      success: true,
      message: `File "${fileToDelete.originalName}" deleted successfully`,
      details: {
        submissionId,
        fieldId,
        publicId: decodedPublicId,
        fileName: fileToDelete.originalName,
        fileSize: fileToDelete.size,
        cloudinaryDeleted: cloudinarySuccess,
        databaseUpdated: databaseSuccess,
        location: fileLocation,
        timestamp: new Date().toISOString(),
      },
    };

   

    res.status(200).json(response);
  })
);

// @desc    Delete all files from a specific field in submission
// @route   DELETE /api/submissions/:submissionId/files/:fieldId
// @access  Private
router.delete(
  '/:submissionId/files/:fieldId',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { submissionId, fieldId } = req.params;

    

    // Validate submission ID
    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      throw new ApiError('Invalid submission ID format', 400);
    }

    // Step 1: Find and verify submission
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      throw new ApiError('Submission not found', 404);
    }

    // Step 2: Verify form ownership
    const form = await Form.findOne({
      _id: submission.formId,
      userId: req.user.id,
    });
    if (!form) {
      throw new ApiError('Not authorized to modify this submission', 403);
    }

    // Step 3: Collect all files for this field
    const filesToDelete: any[] = [];

    // From files array
    if (submission.files && Array.isArray(submission.files)) {
      const fieldFiles = submission.files.filter(
        file => file.fieldId === fieldId
      );
      filesToDelete.push(...fieldFiles);
    }

    // From data object
    if (submission.data && submission.data[fieldId]) {
      const fieldValue = submission.data[fieldId];

      if (Array.isArray(fieldValue)) {
        fieldValue.forEach(file => {
          if (file.publicId) filesToDelete.push(file);
        });
      } else if (fieldValue.publicId) {
        filesToDelete.push(fieldValue);
      }
    }

    if (filesToDelete.length === 0) {
      throw new ApiError('No files found for this field', 404);
    }

   

    // Step 4: Delete files from Cloudinary
    const cloudinaryResults: Array<{
      publicId: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const file of filesToDelete) {
      try {
        const resourceType = file.mimeType?.startsWith('image/')
          ? 'image'
          : 'raw';
        const deleteResult = await deleteFormFile(file.publicId, resourceType);

        cloudinaryResults.push({
          publicId: file.publicId,
          success: deleteResult.success,
          error: deleteResult.error,
        });
      } catch (error: any) {
        cloudinaryResults.push({
          publicId: file.publicId,
          success: false,
          error: error.message,
        });
      }
    }

    const cloudinarySuccessCount = cloudinaryResults.filter(
      r => r.success
    ).length;

    // Step 5: Remove files from submission in database
    try {
      // Remove from files array
      await Submission.findByIdAndUpdate(submissionId, {
        $pull: {
          files: { fieldId: fieldId },
        },
        $unset: {
          [`data.${fieldId}`]: 1,
        },
        $set: {
          updatedAt: new Date(),
        },
      });

      
    } catch (dbError: any) {
      console.error(`❌ Database update failed:`, dbError);
      throw new ApiError('Failed to update submission in database', 500);
    }

    // Step 6: Prepare response
    const response = {
      success: true,
      message: `All files deleted from field "${fieldId}"`,
      details: {
        submissionId,
        fieldId,
        totalFiles: filesToDelete.length,
        cloudinaryDeleted: cloudinarySuccessCount,
        cloudinaryFailed: filesToDelete.length - cloudinarySuccessCount,
        databaseCleared: true,
        timestamp: new Date().toISOString(),
        cloudinaryResults,
      },
    };

   

    res.status(200).json(response);
  })
);

// @desc    Bulk operations on submissions
// @route   PATCH /api/submissions/bulk
// @access  Private
router.patch(
  '/bulk',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { submissionIds, action, value } = req.body;

    if (!submissionIds || !Array.isArray(submissionIds) || !action) {
      throw new ApiError('Submission IDs and action are required', 400);
    }

    if (submissionIds.length === 0) {
      throw new ApiError('At least one submission ID is required', 400);
    }

    // Validate all submission IDs
    const invalidIds = submissionIds.filter(
      id => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      throw new ApiError(
        `Invalid submission IDs: ${invalidIds.join(', ')}`,
        400
      );
    }

    // Verify all submissions belong to user's forms
    const submissions = await Submission.find({ _id: { $in: submissionIds } });
    if (submissions.length !== submissionIds.length) {
      throw new ApiError('Some submissions not found', 404);
    }

    const formIds = [...new Set(submissions.map(s => s.formId.toString()))];
    const userForms = await Form.find({
      _id: { $in: formIds },
      userId: req.user.id,
    });

    if (userForms.length !== formIds.length) {
      throw new ApiError('Not authorized to modify some submissions', 403);
    }

    let updateData: any = {};
    let message = '';

    switch (action) {
      case 'markRead':
        updateData = { isRead: true };
        message = 'Submissions marked as read';
        break;
      case 'markUnread':
        updateData = { isRead: false };
        message = 'Submissions marked as unread';
        break;
      case 'setStatus':
        if (!['pending', 'processed', 'failed'].includes(value)) {
          throw new ApiError('Invalid status value', 400);
        }
        updateData = { status: value };
        message = `Submissions status set to ${value}`;
        break;
      case 'addTag':
        if (!value || typeof value !== 'string') {
          throw new ApiError('Tag value is required', 400);
        }
        // For adding tags, we need to use a different approach
        await Submission.updateMany(
          { _id: { $in: submissionIds } },
          { $addToSet: { tags: value.trim() } }
        );
        res.status(200).json({
          success: true,
          message: 'Tag added to submissions',
        });
        return;
      case 'delete':
        // Delete multiple submissions
        const deleteResult = await Submission.deleteMany({
          _id: { $in: submissionIds },
        });

        // Update form submission counts
        const formUpdates = formIds.map(formId =>
          Form.findByIdAndUpdate(formId, {
            $inc: { submissions: -deleteResult.deletedCount },
          })
        );
        await Promise.all(formUpdates);

        res.status(200).json({
          success: true,
          message: `${deleteResult.deletedCount} submissions deleted successfully`,
          deleted: deleteResult.deletedCount,
        });
        return;
      default:
        throw new ApiError('Invalid action', 400);
    }

    const result = await Submission.updateMany(
      { _id: { $in: submissionIds } },
      updateData
    );

    res.status(200).json({
      success: true,
      message: `${message} (${result.modifiedCount} updated)`,
      modified: result.modifiedCount,
    });
  })
);

// Export submissions with proper field labels and clean CSV format
// @desc    Export submissions
// @route   GET /api/submissions/form/:formId/export
// @access  Private
router.get(
  '/form/:formId/export',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { formId } = req.params;
    const { format = 'csv', dateFrom, dateTo, status, isRead } = req.query;

   

    if (!mongoose.Types.ObjectId.isValid(formId)) {
      throw new ApiError('Invalid form ID format', 400);
    }

    // Verify form belongs to user and get form structure
    const form = await Form.findOne({ _id: formId, userId: req.user.id });
    if (!form) {
      throw new ApiError('Form not found', 404);
    }

    

    // Build query for filtering (existing logic)
    const query: any = { formId };

    // Apply existing filters...
    if (dateFrom || dateTo) {
      query.submittedAt = {};
      if (dateFrom) query.submittedAt.$gte = new Date(dateFrom as string);
      if (dateTo) {
        const endDate = new Date(dateTo as string);
        endDate.setHours(23, 59, 59, 999);
        query.submittedAt.$lte = endDate;
      }
    }

    if (
      status &&
      ['pending', 'processed', 'failed'].includes(status as string)
    ) {
      query.status = status;
    }

    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    // Fetch submissions
    const submissions = await Submission.find(query)
      .sort({ submittedAt: -1 })
      .lean();

   

    if (format === 'csv') {
      // Generate enhanced CSV with choice field labels
      const csvData = generateEnhancedCSVExportWithLabels(submissions, form);

      // Create filename
      const formTitleSafe = form.title.replace(/[^a-zA-Z0-9]/g, '_');
      const dateStamp = new Date().toISOString().split('T')[0];
      const filename = `${formTitleSafe}-submissions-with-labels-${dateStamp}.csv`;


      // Set headers for CSV download
      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
        'Content-Length': Buffer.byteLength(csvData, 'utf8').toString(),
      });

      res.status(200).send(csvData);
    } else {
      // Handle other formats (existing logic)
      throw new ApiError(
        'Invalid export format. Supported formats: csv, json',
        400
      );
    }

    
  })
);

// @desc    Get submission analytics/statistics
// @route   GET /api/submissions/form/:formId/analytics
// @access  Private
router.get(
  '/form/:formId/analytics',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { formId } = req.params;
    const { period = '30d' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(formId)) {
      throw new ApiError('Invalid form ID format', 400);
    }

    // Verify form belongs to user
    const form = await Form.findOne({ _id: formId, userId: req.user.id });
    if (!form) {
      throw new ApiError('Form not found', 404);
    }

    // Calculate date range based on period
    let startDate: Date;
    const endDate = new Date();

    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get overall statistics
    const [totalStats, periodStats, dailyStats] = await Promise.all([
      // Total statistics (all time)
      Submission.aggregate([
        { $match: { formId: new mongoose.Types.ObjectId(formId) } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
            pending: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
            },
            processed: {
              $sum: { $cond: [{ $eq: ['$status', 'processed'] }, 1, 0] },
            },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
            firstSubmission: { $min: '$submittedAt' },
            lastSubmission: { $max: '$submittedAt' },
          },
        },
      ]),

      // Period statistics
      Submission.aggregate([
        {
          $match: {
            formId: new mongoose.Types.ObjectId(formId),
            submittedAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
            pending: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
            },
            processed: {
              $sum: { $cond: [{ $eq: ['$status', 'processed'] }, 1, 0] },
            },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          },
        },
      ]),

      // Daily breakdown
      Submission.aggregate([
        {
          $match: {
            formId: new mongoose.Types.ObjectId(formId),
            submittedAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$submittedAt',
              },
            },
            count: { $sum: 1 },
            processed: {
              $sum: { $cond: [{ $eq: ['$status', 'processed'] }, 1, 0] },
            },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        period,
        startDate,
        endDate,
        total: totalStats[0] || {
          total: 0,
          unread: 0,
          pending: 0,
          processed: 0,
          failed: 0,
          firstSubmission: null,
          lastSubmission: null,
        },
        periodStats: periodStats[0] || {
          total: 0,
          unread: 0,
          pending: 0,
          processed: 0,
          failed: 0,
        },
        dailyBreakdown: dailyStats,
      },
    });
  })
);

// @desc    Get export statistics for a form
// @route   GET /api/submissions/form/:formId/export-stats
// @access  Private
router.get(
  '/form/:formId/export-stats',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { formId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(formId)) {
      throw new ApiError('Invalid form ID format', 400);
    }

    // Verify form belongs to user
    const form = await Form.findOne({ _id: formId, userId: req.user.id });
    if (!form) {
      throw new ApiError('Form not found', 404);
    }

    // Get comprehensive statistics
    const [submissionStats, fileStats] = await Promise.all([
      // Basic submission statistics
      Submission.aggregate([
        { $match: { formId: new mongoose.Types.ObjectId(formId) } },
        {
          $group: {
            _id: null,
            totalSubmissions: { $sum: 1 },
            totalFiles: { $sum: { $size: { $ifNull: ['$files', []] } } },
            totalFileSize: {
              $sum: {
                $reduce: {
                  input: { $ifNull: ['$files', []] },
                  initialValue: 0,
                  in: { $add: ['$$value', { $ifNull: ['$$this.size', 0] }] },
                },
              },
            },
            avgFilesPerSubmission: {
              $avg: { $size: { $ifNull: ['$files', []] } },
            },
          },
        },
      ]),

      // File type breakdown
      Submission.aggregate([
        { $match: { formId: new mongoose.Types.ObjectId(formId) } },
        { $unwind: { path: '$files', preserveNullAndEmptyArrays: false } },
        {
          $group: {
            _id: '$files.mimeType',
            count: { $sum: 1 },
            totalSize: { $sum: '$files.size' },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    const stats = submissionStats[0] || {
      totalSubmissions: 0,
      totalFiles: 0,
      totalFileSize: 0,
      avgFilesPerSubmission: 0,
    };

    // Create field labels map
    const fieldLabelsMap = createFieldLabelsMap(form);
    const fieldCount = Object.keys(fieldLabelsMap).length;

    // Estimate CSV size (rough calculation)
    const avgRowSize = 100; // Average bytes per row (conservative estimate)
    const headerSize = fieldCount * 20; // Average header size
    const estimatedSize = headerSize + stats.totalSubmissions * avgRowSize;
    const estimatedSizeFormatted = formatFileSize(estimatedSize);

    res.status(200).json({
      success: true,
      data: {
        totalSubmissions: stats.totalSubmissions,
        totalFiles: stats.totalFiles,
        totalFileSize: stats.totalFileSize,
        avgFilesPerSubmission:
          Math.round(stats.avgFilesPerSubmission * 10) / 10,
        estimatedCsvSize: estimatedSizeFormatted,
        fieldCount,
        fieldLabels: fieldLabelsMap,
        fileTypeBreakdown: fileStats,
        formInfo: {
          title: form.title,
          createdAt: form.createdAt,
          isPublished: form.isPublished,
        },
      },
    });
  })
);

// @desc    Get export preview (first few rows)
// @route   GET /api/submissions/form/:formId/export-preview
// @access  Private
router.get(
  '/form/:formId/export-preview',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { formId } = req.params;
    const { limit = '5' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(formId)) {
      throw new ApiError('Invalid form ID format', 400);
    }

    const limitNum = Math.min(parseInt(limit as string, 10) || 5, 20); // Max 20 for preview

    // Verify form belongs to user
    const form = await Form.findOne({ _id: formId, userId: req.user.id });
    if (!form) {
      throw new ApiError('Form not found', 404);
    }

    // Get preview submissions
    const submissions = await Submission.find({ formId })
      .sort({ submittedAt: -1 })
      .limit(limitNum)
      .lean();

    // Get total count
    const totalSubmissions = await Submission.countDocuments({ formId });

    if (submissions.length === 0) {
      res.status(200).json({
        success: true,
        data: {
          headers: ['Submission Date'],
          rows: [],
          totalSubmissions: 0,
          previewCount: 0,
        },
      });
      return;
    }

    // Generate preview using the same logic as full export
    const csvContent = generateEnhancedCSVExport(submissions, form);
    const lines = csvContent.split('\n').filter(line => line.trim());

    const headers = lines[0]
      ? lines[0].split(',').map(h => h.replace(/"/g, ''))
      : [];
    const rows = lines
      .slice(1, limitNum + 1)
      .map(line => line.split(',').map(cell => cell.replace(/"/g, '')));

    res.status(200).json({
      success: true,
      data: {
        headers,
        rows,
        totalSubmissions,
        previewCount: submissions.length,
      },
    });
  })
);

// @desc    Get recent submissions activity
// @route   GET /api/submissions/recent
// @access  Private
router.get(
  '/recent',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { limit = '10' } = req.query;
    const limitNum = Math.min(parseInt(limit as string, 10) || 10, 50);

    // Get user's forms first
    const userForms = await Form.find({ userId: req.user.id }).select(
      '_id title'
    );
    const formIds = userForms.map(form => form._id);

    if (formIds.length === 0) {
      res.status(200).json({
        success: true,
        data: {
          submissions: [],
          total: 0,
        },
      });
      return;
    }

    // Get recent submissions across all user's forms
    const submissions = await Submission.find({
      formId: { $in: formIds },
    })
      .populate('formId', 'title')
      .sort({ submittedAt: -1 })
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        submissions,
        total: submissions.length,
      },
    });
  })
);

// @desc    Search submissions across all forms
// @route   GET /api/submissions/search
// @access  Private
router.get(
  '/search',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { q, limit = '20', page = '1' } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      throw new ApiError('Search query is required', 400);
    }

    const searchTerm = q.toString().trim();
    const limitNum = Math.min(parseInt(limit as string, 10) || 20, 100);
    const pageNum = parseInt(page as string, 10) || 1;
    const skip = (pageNum - 1) * limitNum;

    // Get user's forms first
    const userForms = await Form.find({ userId: req.user.id }).select(
      '_id title'
    );
    const formIds = userForms.map(form => form._id);

    if (formIds.length === 0) {
      res.status(200).json({
        success: true,
        data: {
          submissions: [],
          total: 0,
          pagination: {
            current: pageNum,
            pages: 0,
            total: 0,
            limit: limitNum,
          },
        },
      });
      return;
    }

    // Build search query
    const searchFields = [
      { 'data.email': { $regex: searchTerm, $options: 'i' } },
      { 'data.name': { $regex: searchTerm, $options: 'i' } },
      { 'data.firstName': { $regex: searchTerm, $options: 'i' } },
      { 'data.lastName': { $regex: searchTerm, $options: 'i' } },
      { 'data.phone': { $regex: searchTerm, $options: 'i' } },
      { 'data.company': { $regex: searchTerm, $options: 'i' } },
      { 'data.message': { $regex: searchTerm, $options: 'i' } },
      { 'data.subject': { $regex: searchTerm, $options: 'i' } },
    ];

    const query = {
      formId: { $in: formIds },
      $or: searchFields,
    };

    const [submissions, total] = await Promise.all([
      Submission.find(query)
        .populate('formId', 'title')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Submission.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        submissions,
        total,
        searchTerm,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total,
          limit: limitNum,
        },
      },
    });
  })
);

// Add error handling middleware
router.use(handleFormSubmissionError);

export default router;
