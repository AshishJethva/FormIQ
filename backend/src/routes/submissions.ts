// src/routes/submissions.ts
import express from 'express';
import { Request, Response } from 'express';
import { protect } from '../middleware/protect';
import Submission from '../models/Submission';
import Form from '../models/Form';
import { validate } from '../middleware/validation';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { submitFormSchema } from '../validation/submissionValidation';
import mongoose from 'mongoose';

const router = express.Router();

// Helper function to create field labels map from form structure
const createFieldLabelsMap = (formData: any): Record<string, string> => {
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

// Helper function to get a user-friendly field label
const getFieldDisplayLabel = (
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
  };

  if (commonFields[fieldId]) {
    return commonFields[fieldId];
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

// Helper function to format submission value for CSV
const formatSubmissionValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }

  // Handle objects (like fullName: {firstName, lastName})
  if (typeof value === 'object' && value !== null) {
    if (value.firstName && value.lastName) {
      return `${value.firstName} ${value.lastName}`.trim();
    } else if (value.street && value.city) {
      const parts = [
        value.street,
        value.city,
        value.state,
        value.zipCode,
      ].filter(Boolean);
      return parts.join(', ');
    } else if (Array.isArray(value)) {
      return value.filter(v => v !== null && v !== undefined).join(', ');
    } else {
      // For other objects, try to extract meaningful values
      const objectValues = Object.values(value).filter(
        v => v !== null && v !== undefined && v !== ''
      );
      return objectValues.length > 0 ? objectValues.join(' ') : '';
    }
  }

  return String(value).trim();
};

// Helper function to format date for CSV
const formatSubmissionDate = (dateString: string): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    // Ensure we have a valid date
    if (isNaN(date.getTime())) return '';

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
};

// Helper function to escape CSV values
const escapeCSVValue = (value: string): string => {
  if (!value && value !== '0') return ''; // Handle '0' as valid value

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

// Enhanced CSV export function with proper formatting
const generateEnhancedCSVExport = (submissions: any[], form: any): string => {
  if (!submissions || submissions.length === 0) {
    return 'No submissions found\n';
  }

  console.log('📊 Generating CSV for', submissions.length, 'submissions');

  // Create field labels map from form structure
  const fieldLabelsMap = createFieldLabelsMap(form);

  // Get all unique field keys from submissions (excluding system fields)
  const allFieldKeys = new Set<string>();
  submissions.forEach(submission => {
    if (submission.data && typeof submission.data === 'object') {
      Object.keys(submission.data).forEach(key => {
        // Only include actual form fields (exclude metadata, system fields, etc.)
        if (key && typeof key === 'string' && key.trim().length > 0) {
          allFieldKeys.add(key);
        }
      });
    }
  });

  console.log('📋 Found form fields:', Array.from(allFieldKeys));

  // Convert to array and sort for consistent column order
  const sortedFieldKeys = Array.from(allFieldKeys).sort((a, b) => {
    // Prioritize common fields first
    const commonFieldOrder = [
      'name',
      'fullName',
      'firstName',
      'lastName',
      'email',
      'emailAddress',
      'phone',
      'phoneNumber',
    ];
    const aIndex = commonFieldOrder.indexOf(a);
    const bIndex = commonFieldOrder.indexOf(b);

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

  console.log('📝 CSV Headers:', headers);

  // Generate CSV content
  let csvContent = '';

  // Add headers
  csvContent += headers.map(header => escapeCSVValue(header)).join(',') + '\n';

  // Add data rows
  submissions.forEach((submission, index) => {
    const rowData = [];

    // First column: Submission Date (properly formatted and escaped)
    const formattedDate = formatSubmissionDate(
      submission.submittedAt || submission.createdAt || ''
    );
    rowData.push(escapeCSVValue(formattedDate));

    // Remaining columns: All form field values
    sortedFieldKeys.forEach(fieldKey => {
      const value = submission.data?.[fieldKey];
      const formattedValue = formatSubmissionValue(value);
      rowData.push(escapeCSVValue(formattedValue));
    });

    // Add the complete row to CSV
    csvContent += rowData.join(',') + '\n';

    // Log first few rows for debugging
    if (index < 3) {
      console.log(`📄 Row ${index + 1}:`, {
        date: formattedDate,
        fields: sortedFieldKeys.slice(0, 3).map(key => ({
          key,
          value: submission.data?.[key],
          formatted: formatSubmissionValue(submission.data?.[key]),
        })),
      });
    }
  });

  console.log('✅ CSV generation completed');
  return csvContent;
};

// Helper function to validate submission data with file support
const validateSubmissionData = (
  submissionData: any,
  pages: any[],
  files: any[]
): string[] => {
  const errors: string[] = [];

  if (!pages || !Array.isArray(pages)) {
    return errors;
  }

  pages.forEach((page: any) => {
    if (page.fields && Array.isArray(page.fields)) {
      page.fields.forEach((field: any) => {
        if (field.type === 'heading') return; // Skip headings

        const fieldValue = submissionData[field.id];
        const fieldFiles = files.filter(file => file.fieldId === field.id);

        // Check required fields
        if (field.required) {
          // For file/image fields, check if files were uploaded
          if (field.type === 'fileUpload' || field.type === 'image') {
            if (fieldFiles.length === 0) {
              errors.push(
                `Field "${field.label || field.id}" requires a file to be uploaded`
              );
              return;
            }
          } else {
            // For other fields, check regular value
            if (!fieldValue || fieldValue.toString().trim() === '') {
              errors.push(`Field "${field.label || field.id}" is required`);
              return;
            }
          }
        }

        // Skip validation if field is empty and not required
        if (!fieldValue || fieldValue.toString().trim() === '') {
          return;
        }

        // Field-specific validation (existing logic)
        switch (field.type) {
          case 'shortText':
          case 'longText':
          case 'paragraph':
            if (
              field.minLength &&
              fieldValue.toString().length < field.minLength
            ) {
              errors.push(
                `Field "${field.label || field.id}" must be at least ${field.minLength} characters long`
              );
            }
            if (
              field.maxLength &&
              fieldValue.toString().length > field.maxLength
            ) {
              errors.push(
                `Field "${field.label || field.id}" must be no more than ${field.maxLength} characters long`
              );
            }
            break;

          case 'number':
            const numValue = Number(fieldValue);
            if (isNaN(numValue)) {
              errors.push(
                `Field "${field.label || field.id}" must be a valid number`
              );
            } else {
              if (field.min !== undefined && numValue < field.min) {
                errors.push(
                  `Field "${field.label || field.id}" must be at least ${field.min}`
                );
              }
              if (field.max !== undefined && numValue > field.max) {
                errors.push(
                  `Field "${field.label || field.id}" must be no more than ${field.max}`
                );
              }
            }
            break;

          case 'dropdown':
          case 'singleChoice':
            if (field.options && Array.isArray(field.options)) {
              const validOptions = field.options.map(
                (opt: any) => opt.value || opt
              );
              if (!validOptions.includes(fieldValue)) {
                errors.push(
                  `Field "${field.label || field.id}" contains an invalid option`
                );
              }
            }
            break;

          case 'multipleChoice':
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
                    `Field "${field.label || field.id}" contains invalid options: ${invalidOptions.join(', ')}`
                  );
                }
              }
            } else if (fieldValue) {
              errors.push(
                `Field "${field.label || field.id}" must be an array for multiple choice`
              );
            }
            break;

          case 'time':
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(fieldValue.toString())) {
              errors.push(
                `Field "${field.label || field.id}" must be a valid time format (HH:MM)`
              );
            }
            break;

          // ✅ ENHANCED: File field validations
          case 'image':
            if (fieldFiles.length > 0) {
              fieldFiles.forEach((file: any) => {
                if (!file.mimeType.startsWith('image/')) {
                  errors.push(
                    `Field "${field.label || field.id}" only accepts image files`
                  );
                }
                // Check image size (10MB max for images)
                if (file.size > 10 * 1024 * 1024) {
                  errors.push(
                    `Image in field "${field.label || field.id}" exceeds 10MB limit`
                  );
                }
              });

              // Check multiple files if not allowed
              if (!field.multiple && fieldFiles.length > 1) {
                errors.push(
                  `Field "${field.label || field.id}" only allows one image`
                );
              }
            }
            break;

          case 'fileUpload':
            if (fieldFiles.length > 0) {
              fieldFiles.forEach((file: any) => {
                // Check file type if accept attribute is specified
                if (field.accept && field.accept !== '*/*') {
                  const allowedTypes = field.accept
                    .split(',')
                    .map((type: string) => type.trim());
                  const isTypeAllowed = allowedTypes.some((type: string) => {
                    if (type.startsWith('.')) {
                      // File extension check
                      return file.originalName
                        .toLowerCase()
                        .endsWith(type.toLowerCase());
                    } else if (type.endsWith('/*')) {
                      // MIME type wildcard check
                      const baseType = type.slice(0, -2);
                      return file.mimeType.startsWith(baseType);
                    } else {
                      // Exact MIME type check
                      return file.mimeType === type;
                    }
                  });

                  if (!isTypeAllowed) {
                    errors.push(
                      `File "${file.originalName}" in field "${field.label || field.id}" is not an allowed file type`
                    );
                  }
                }

                // Check file size (25MB max for general files)
                if (file.size > 25 * 1024 * 1024) {
                  errors.push(
                    `File "${file.originalName}" in field "${field.label || field.id}" exceeds 25MB limit`
                  );
                }
              });

              // Check multiple files if not allowed
              if (!field.multiple && fieldFiles.length > 1) {
                errors.push(
                  `Field "${field.label || field.id}" only allows one file`
                );
              }
            }
            break;

          // Existing validations for other field types...
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(fieldValue.toString())) {
              errors.push(
                `Field "${field.label || field.id}" must be a valid email address`
              );
            }
            break;

          case 'phone':
            const phoneRegex = /^[6-9]\d{9}$/;
            const cleanPhone = fieldValue.toString().replace(/\D/g, '');
            let phoneDigits = cleanPhone;
            if (phoneDigits.startsWith('91') && phoneDigits.length === 12) {
              phoneDigits = phoneDigits.substring(2);
            }
            if (!phoneRegex.test(phoneDigits)) {
              errors.push(
                `Field "${field.label || field.id}" must be a valid 10-digit Indian phone number starting with 6, 7, 8, or 9`
              );
            }
            break;

          case 'fullName':
            if (typeof fieldValue === 'object') {
              if (!fieldValue.firstName || !fieldValue.lastName) {
                errors.push(
                  `Field "${field.label || field.id}" requires both first and last name`
                );
              }
            } else if (
              typeof fieldValue === 'string' &&
              fieldValue.trim().length < 2
            ) {
              errors.push(
                `Field "${field.label || field.id}" must be at least 2 characters long`
              );
            }
            break;

          case 'address':
            if (typeof fieldValue === 'object') {
              if (!fieldValue.street || !fieldValue.city || !fieldValue.state) {
                errors.push(
                  `Field "${field.label || field.id}" requires street address, city, and state`
                );
              }
            }
            break;

          case 'appointment':
            if (typeof fieldValue === 'object') {
              if (!fieldValue.date || !fieldValue.time) {
                errors.push(
                  `Field "${field.label || field.id}" requires both date and time`
                );
              } else {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(fieldValue.date)) {
                  errors.push(
                    `Field "${field.label || field.id}" has invalid date format`
                  );
                }
                const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
                if (!timeRegex.test(fieldValue.time)) {
                  errors.push(
                    `Field "${field.label || field.id}" has invalid time format`
                  );
                }
              }
            }
            break;

          case 'datePicker':
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(fieldValue.toString())) {
              errors.push(
                `Field "${field.label || field.id}" must be a valid date format (YYYY-MM-DD)`
              );
            }
            break;

          case 'signature':
            if (
              field.required &&
              (!fieldValue || fieldValue.toString().trim() === '')
            ) {
              errors.push(
                `Field "${field.label || field.id}" requires a signature`
              );
            }
            break;

          default:
            // Generic text validation for unknown field types
            if (
              field.minLength &&
              fieldValue.toString().length < field.minLength
            ) {
              errors.push(
                `Field "${field.label || field.id}" must be at least ${field.minLength} characters long`
              );
            }
            if (
              field.maxLength &&
              fieldValue.toString().length > field.maxLength
            ) {
              errors.push(
                `Field "${field.label || field.id}" must be no more than ${field.maxLength} characters long`
              );
            }
            break;
        }
      });
    }
  });

  return errors;
};

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

    console.log('📡 Getting submissions with search:', { formId, search });

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

    // ✅ ENHANCED: Dynamic search across all form fields
    if (search && search.toString().trim()) {
      const searchTerm = search.toString().trim();
      console.log('🔍 Building dynamic search for term:', searchTerm);

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
      console.log(
        '🏷️ Adding dynamic fields to search:',
        dynamicFieldIds.length
      );

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
      console.log(
        '🔍 Created search query with',
        searchFields.length,
        'searchable fields'
      );
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

    console.log(
      `📊 Found ${submissions.length} submissions (${total} total) for search:`,
      search
    );

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

// @desc    Submit form data (public endpoint)
// @route   POST /api/submissions/:formId/submit
// @access  Public
router.post(
  '/:formId/submit',
  validate(submitFormSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { formId } = req.params;
    const { data: submissionData, files: fileData } = req.body;

    // Validate formId
    if (!mongoose.Types.ObjectId.isValid(formId)) {
      throw new ApiError('Invalid form ID format', 400);
    }

    // Check if form exists and is published
    const form = await Form.findById(formId);
    if (!form) {
      throw new ApiError('Form not found', 404);
    }

    if (!form.isPublished) {
      throw new ApiError('Form is not published', 400);
    }

    if (form.isTrashed || form.isArchived) {
      throw new ApiError('Form is not available', 400);
    }

    // Check if form is enabled
    if (form.settings?.isEnabled === false) {
      throw new ApiError(
        'Form is currently disabled and not accepting submissions',
        403
      );
    }

    // ✅ ENHANCED: Multiple submission checks (existing logic)
    if (!form.settings?.allowMultipleSubmissions) {
      const clientIp = req.ip || req.connection.remoteAddress;
      if (clientIp) {
        const existingSubmission = await Submission.findOne({
          formId,
          ipAddress: clientIp,
          submittedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        });

        if (existingSubmission) {
          throw new ApiError(
            'You have already submitted this form recently',
            429
          );
        }
      }
    }

    // ✅ ENHANCED: Email-based multiple submission restrictions (existing logic)
    if (
      form.settings?.allowMultipleSubmissions &&
      !form.settings?.allowMultipleEmailSubmissions
    ) {
      let submittedEmail = null;

      for (const [fieldId, value] of Object.entries(submissionData || {})) {
        if (
          typeof value === 'string' &&
          value.includes('@') &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ) {
          submittedEmail = value.toLowerCase().trim();
          break;
        }
      }

      if (submittedEmail) {
        const existingEmailSubmission = await Submission.findOne({
          formId,
          $or: [
            { 'data.email': submittedEmail },
            { 'data.emailAddress': submittedEmail },
            ...Object.keys(submissionData || {}).map(fieldId => ({
              [`data.${fieldId}`]: submittedEmail,
            })),
          ],
          submittedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        });

        if (existingEmailSubmission) {
          throw new ApiError(
            'This email address has already been used to submit this form recently',
            429
          );
        }
      }
    }

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

    if (fileData && typeof fileData === 'object') {
      for (const [fieldId, fileInfo] of Object.entries(fileData)) {
        if (Array.isArray(fileInfo)) {
          // Multiple files for one field
          fileInfo.forEach((file: any) => {
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
        } else if (fileInfo && typeof fileInfo === 'object') {
          // Single file for one field
          if ((fileInfo as any).url && (fileInfo as any).publicId) {
            processedFiles.push({
              fieldId,
              originalName: (fileInfo as any).originalName || 'uploaded_file',
              fileName:
                (fileInfo as any).fileName || (fileInfo as any).originalName || 'uploaded_file',
              url: (fileInfo as any).url,
              publicId: (fileInfo as any).publicId,
              size: (fileInfo as any).size || 0,
              mimeType: (fileInfo as any).mimeType || 'application/octet-stream',
              uploadedAt: (fileInfo as any).uploadedAt
                ? new Date((fileInfo as any).uploadedAt)
                : new Date(),
            });
          }
        }
      }
    }

    console.log('📎 Processed files:', {
      count: processedFiles.length,
      totalSize: processedFiles.reduce((sum, file) => sum + file.size, 0),
    });

    const hasAnyFields = form.pages?.some(
      page =>
        page.fields && Array.isArray(page.fields) && page.fields.length > 0
    );

    if (!hasAnyFields) {
      console.log('⚠️ Form has no fields, allowing empty submission');

      const submissionPayload: any = {
        formId,
        data: submissionData || {},
        files: processedFiles,
        submittedAt: new Date(),
        status: 'processed',
        metadata: {
          timestamp: new Date().toISOString(),
          formVersion: form.updatedAt,
          note: 'Form submitted with no fields',
          fileCount: processedFiles.length,
        },
      };

      if (form.settings?.collectIpAddress !== false) {
        submissionPayload.ipAddress = req.ip || req.connection.remoteAddress;
      }

      submissionPayload.userAgent = req.get('User-Agent');
      submissionPayload.referrer = req.get('Referer');

      const submission = await Submission.create(submissionPayload);

      await Form.findByIdAndUpdate(formId, {
        $inc: { submissions: 1 },
        $set: { updatedAt: new Date() },
      });

      console.log('✅ Empty form submission with files processed successfully');

      res.status(201).json({
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
      return;
    }

    // Validate submission data against form structure
    const validationErrors = validateSubmissionData(
      submissionData || {},
      form.pages || [],
      processedFiles
    );

    if (validationErrors.length > 0) {
      console.log('❌ Validation errors found:', validationErrors);
      throw new ApiError(
        `Validation failed: ${validationErrors.join('; ')}`,
        400
      );
    }

    // Create submission record
    const submissionPayload: any = {
      formId,
      data: submissionData || {},
      files: processedFiles,
      submittedAt: new Date(),
      status: 'processed',
      metadata: {
        timestamp: new Date().toISOString(),
        formVersion: form.updatedAt,
        fileCount: processedFiles.length,
        totalFileSize: processedFiles.reduce((sum, file) => sum + file.size, 0),
      },
    };

    // Add IP address if collection is enabled
    if (form.settings?.collectIpAddress !== false) {
      submissionPayload.ipAddress = req.ip || req.connection.remoteAddress;
    }

    // Add user agent and referrer
    submissionPayload.userAgent = req.get('User-Agent');
    submissionPayload.referrer = req.get('Referer');

    const submission = await Submission.create(submissionPayload);

    // Update form submission count
    await Form.findByIdAndUpdate(formId, {
      $inc: { submissions: 1 },
      $set: { updatedAt: new Date() },
    });

    console.log('✅ Form submission with files processed successfully:', {
      submissionId: submission._id,
      fileCount: processedFiles.length,
    });

    res.status(201).json({
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

// @desc    Delete submission
// @route   DELETE /api/submissions/:id
// @access  Private
router.delete(
  '/:id',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

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
      throw new ApiError('Not authorized to delete this submission', 403);
    }

    await Submission.findByIdAndDelete(id);

    // Update form submission count
    await Form.findByIdAndUpdate(submission.formId, {
      $inc: { submissions: -1 },
    });

    res.status(200).json({
      success: true,
      message: 'Submission deleted successfully',
    });
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

// ✅ ENHANCED: Export submissions with proper field labels and clean CSV format
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

    // Verify form belongs to user and get form structure for field labels
    const form = await Form.findOne({ _id: formId, userId: req.user.id });
    if (!form) {
      throw new ApiError('Form not found', 404);
    }

    // Build query for filtering
    const query: any = { formId };

    // Date range filter
    if (dateFrom || dateTo) {
      query.submittedAt = {};
      if (dateFrom) query.submittedAt.$gte = new Date(dateFrom as string);
      if (dateTo) {
        const endDate = new Date(dateTo as string);
        endDate.setHours(23, 59, 59, 999);
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

    const submissions = await Submission.find(query)
      .sort({ submittedAt: -1 })
      .lean();

    if (format === 'csv') {
      const csvData = generateEnhancedCSVExport(submissions, form);
      const filename = `${form.title.replace(/[^a-zA-Z0-9]/g, '_')}-submissions-${new Date().toISOString().split('T')[0]}.csv`;

      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      });
      res.send(csvData);
    } else if (format === 'json') {
      const filename = `${form.title.replace(/[^a-zA-Z0-9]/g, '_')}-submissions-${new Date().toISOString().split('T')[0]}.json`;

      res.set({
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      });
      res.json({
        success: true,
        data: {
          form: {
            id: form.id,
            title: form.title,
            exportedAt: new Date().toISOString(),
          },
          submissions,
          count: submissions.length,
        },
      });
    } else {
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

export default router;
