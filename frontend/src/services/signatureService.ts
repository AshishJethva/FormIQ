import {
  createFieldLabelsMap,
  escapeCSVValue,
  formatSubmissionDate,
  formatSubmissionValueSimplified,
  getFieldDisplayLabel,
} from './../../../backend/src/routes/submissions';

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
