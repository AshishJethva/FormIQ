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

// Helper function to format single values
export const formatSingleValue = (value: any): string => {
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
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to get all searchable field IDs from form
export const getSearchableFieldIds = (formData: any): string[] => {
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
export const generateEnhancedCSVExport = (
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
export const formatValueCloudinaryOnly = (value: any): string => {
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
        ' Found base64 signature in export - should be Cloudinary URL'
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

export const generateEnhancedCSVExportWithLabels = (
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
export const formatSingleValueSimplified = (value: any): string => {
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
export const validateSubmissionData = (
  submissionData: any,
  pages: any[],
  files: any[]
): string[] => {
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
        errors.push(
          `${field.label || field.id} validation failed: ${validationError.message}`
        );
      }
    });
  });

  return errors;
};

// PRIVATE FUNCTIONS - Only used internally

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

const formatSubmissionDate = (dateString: string): string => {
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

const escapeCSVValue = (value: string): string => {
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

const formatDisplayValueWithChoiceLabels = (
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
