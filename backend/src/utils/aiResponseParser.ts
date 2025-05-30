// Backend: src/utils/aiResponseParser.ts
export class AIResponseParser {
  static parseFormConfig(rawResponse: string): {
    success: boolean;
    data?: any;
    error?: string;
  } {
    try {
      // Multiple cleaning strategies
      let cleanedResponse = rawResponse;

      // Remove markdown code blocks
      cleanedResponse = cleanedResponse
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      // Remove any text before the first { and after the last }
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;

      if (jsonStart === -1 || jsonEnd <= jsonStart) {
        return { success: false, error: 'No valid JSON found in response' };
      }

      cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd);

      // Parse JSON
      const formConfig = JSON.parse(cleanedResponse);

      // Validate structure
      const validation = this.validateFormConfig(formConfig);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      return { success: true, data: formConfig };
    } catch (error) {
      console.error('JSON Parse Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Failed to parse AI response: ${errorMessage}`,
      };
    }
  }

  private static validateFormConfig(config: any): {
    isValid: boolean;
    error?: string;
  } {
    // Required fields validation
    if (!config.title || typeof config.title !== 'string') {
      return { isValid: false, error: 'Missing or invalid form title' };
    }

    if (
      !config.pages ||
      !Array.isArray(config.pages) ||
      config.pages.length === 0
    ) {
      return { isValid: false, error: 'Missing or invalid pages array' };
    }

    // Validate each page
    for (let i = 0; i < config.pages.length; i++) {
      const page = config.pages[i];

      if (!page.fields || !Array.isArray(page.fields)) {
        return {
          isValid: false,
          error: `Page ${i + 1} has invalid fields array`,
        };
      }

      // Validate each field
      for (let j = 0; j < page.fields.length; j++) {
        const field = page.fields[j];

        if (!field.type || !field.label) {
          return {
            isValid: false,
            error: `Field ${j + 1} in page ${i + 1} is missing type or label`,
          };
        }

        // Validate field type
        const validTypes = [
          'HEADING',
          'FULL_NAME',
          'EMAIL',
          'PHONE',
          'ADDRESS',
          'DATE_PICKER',
          'APPOINTMENT',
          'SIGNATURE',
          'FILL_BLANK',
          'PRODUCT_LIST',
        ];

        if (!validTypes.includes(field.type)) {
          return { isValid: false, error: `Invalid field type: ${field.type}` };
        }
      }
    }

    // Validate settings
    if (config.settings && typeof config.settings !== 'object') {
      return { isValid: false, error: 'Invalid settings object' };
    }

    return { isValid: true };
  }

  static enhanceFormConfig(config: any): any {
    // Add default settings if missing
    config.settings = {
      submitButtonText: 'Submit',
      defaultLabelAlignment: 'LEFT',
      thankyouMessage: 'Thank you for your submission!',
      defaultRequiredField: false,
      isEnabled: true,
      allowMultipleSubmissions: true,
      allowMultipleEmailSubmissions: true,
      collectIpAddress: true,
      enableCaptcha: false,
      showLogo: false,
      ...config.settings,
    };

    // Enhance each page and field
    config.pages = config.pages.map((page: any) => ({
      ...page,
      fields: (page.fields || []).map((field: any) => {
        const enhancedField = {
          ...field,
          labelAlignment: field.labelAlignment || 'LEFT',
        };

        // Add required and helpText for non-heading fields
        if (field.type !== 'HEADING') {
          enhancedField.required = field.required || false;
          enhancedField.helpText = field.helpText || '';

          // Set default helpText for email fields
          if (field.type === 'EMAIL' && !field.helpText) {
            enhancedField.helpText = 'example@example.com';
          }
        }

        return enhancedField;
      }),
    }));

    return config;
  }
}
