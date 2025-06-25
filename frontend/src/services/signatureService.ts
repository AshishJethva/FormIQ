/* eslint-disable @typescript-eslint/no-unused-vars */
// Service to upload base64 signatures to Cloudinary and return URL
export const signatureCloudinaryService = {
  // Upload base64 signature to Cloudinary
  async uploadSignatureToCloudinary(
    base64Data: string,
    submissionId: string,
    fieldId: string
  ): Promise<string> {
    try {
      // Remove data URL prefix if present
      const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');

      // Create form data for Cloudinary upload
      const formData = new FormData();

      // Convert base64 to blob
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      // Add to form data
      formData.append('file', blob, `signature_${submissionId}_${fieldId}.png`);
      formData.append('upload_preset', 'form_signatures'); // You need to create this preset in Cloudinary
      formData.append('folder', `form_signatures/${submissionId}`);
      formData.append('public_id', `signature_${fieldId}_${Date.now()}`);

      // Upload to Cloudinary
      const response = await fetch(
        'https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Cloudinary upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      return result.secure_url;
    } catch (error: any) {
      console.error('❌ Error uploading signature to Cloudinary:', error);
      throw new Error(`Failed to upload signature: ${error.message}`);
    }
  },

  // Process signatures in submission data
  async processSignaturesInSubmission(
    submissionData: any,
    submissionId: string
  ): Promise<any> {
    const processedData = { ...submissionData };

    for (const [fieldId, value] of Object.entries(submissionData)) {
      if (typeof value === 'string' && value.startsWith('data:image/')) {
        try {
          // Upload signature to Cloudinary
          const cloudinaryUrl = await this.uploadSignatureToCloudinary(
            value,
            submissionId,
            fieldId
          );
          processedData[fieldId] = cloudinaryUrl;
        } catch (error) {
          console.error(
            `❌ Failed to process signature for field ${fieldId}:`,
            error
          );
          // Keep original base64 data as fallback
          processedData[fieldId] = value;
        }
      }
    }

    return processedData;
  },
};

// Enhanced CSV generation with signature processing

// Simplified CSV content generation
const generateSimplifiedCSVContent = (
  submissions: any[],
  form: any
): string => {
  // Create field labels map from form structure
  const fieldLabelsMap = createFieldLabelsMap(form);

  // Get all unique field keys
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

  // Sort field keys
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
      'signature',
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

  // Define headers
  const headers = [
    'Submission Date',
    ...sortedFieldKeys.map(key => getFieldDisplayLabel(key, fieldLabelsMap)),
  ];

  // Generate CSV content
  let csvContent =
    headers.map(header => escapeCSVValue(header)).join(',') + '\n';

  // Add data rows
  submissions.forEach(submission => {
    const rowData = [];

    // First column: Submission Date
    const formattedDate = formatSubmissionDate(
      submission.submittedAt || submission.createdAt || ''
    );
    rowData.push(escapeCSVValue(formattedDate));

    // Remaining columns: All form field values
    sortedFieldKeys.forEach(fieldKey => {
      let fieldValue = '';

      // Check if this is a file field
      if (fileFieldKeys.has(fieldKey)) {
        // Handle file fields - just Cloudinary URLs
        const fieldFiles =
          submission.files?.filter((file: any) => file.fieldId === fieldKey) ||
          [];

        if (fieldFiles.length > 0) {
          const fileUrls = fieldFiles
            .map((file: any) => file.url || '')
            .filter((url: string) => url.trim() !== '');
          fieldValue = fileUrls.join('; ');
        } else {
          // Check data object for legacy files or signatures
          const dataValue = submission.data?.[fieldKey];
          if (dataValue) {
            // For signatures that are now Cloudinary URLs, just return the URL
            if (typeof dataValue === 'string' && dataValue.startsWith('http')) {
              fieldValue = dataValue;
            } else {
              fieldValue = formatSubmissionValueSimplified(
                dataValue,
                fieldKey,
                fieldLabelsMap
              );
            }
          }
        }
      } else {
        // Handle regular data fields
        const dataValue = submission.data?.[fieldKey];
        if (dataValue) {
          // Check if this is a signature URL
          if (typeof dataValue === 'string' && dataValue.startsWith('http')) {
            fieldValue = dataValue;
          } else {
            fieldValue = formatSubmissionValueSimplified(
              dataValue,
              fieldKey,
              fieldLabelsMap
            );
          }
        }
      }

      rowData.push(escapeCSVValue(fieldValue));
    });

    csvContent += rowData.join(',') + '\n';
  });

  return csvContent;
};

// **********************************************************************************

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

// Enhanced CSV generation with signature processing
export const generateEnhancedCSVExportWithSignatures = async (
  submissions: any[],
  form: any
): Promise<string> => {
  if (!submissions || submissions.length === 0) {
    return 'Submission Date,No Data\n"No submissions found",""';
  }

  // Process signatures for all submissions
  const processedSubmissions = await Promise.all(
    submissions.map(async submission => {
      if (submission.data) {
        // Check for signatures in submission data
        const hasSignatures = Object.values(submission.data).some(
          value => typeof value === 'string' && value.startsWith('data:image/')
        );

        if (hasSignatures) {
          const processedData =
            await signatureCloudinaryService.processSignaturesInSubmission(
              submission.data,
              submission._id
            );
          return { ...submission, data: processedData };
        }
      }
      return submission;
    })
  );

  // Now generate CSV with processed data
  return generateSimplifiedCSVContent(processedSubmissions, form);
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
