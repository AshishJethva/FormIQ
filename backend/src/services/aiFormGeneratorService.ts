// Backend: src/services/aiFormGeneratorService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';

export class AIFormGeneratorService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 4096,
      },
    });
  }

  async generateForm(
    prompt: string,
    userId: string
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    generationTime: number;
  }> {
    const startTime = Date.now();

    try {
      // Validate prompt
      if (!prompt || prompt.trim().length < 10) {
        return {
          success: false,
          error: 'Prompt must be at least 10 characters long',
          generationTime: Date.now() - startTime,
        };
      }

      if (prompt.trim().length > 1000) {
        return {
          success: false,
          error: 'Prompt must not exceed 1000 characters',
          generationTime: Date.now() - startTime,
        };
      }

      // Generate form config
      const systemPrompt = this.buildSystemPrompt(prompt.trim());
      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      const generatedText = response.text();

      // Parse response
      const parseResult = this.parseFormConfig(generatedText);
      if (!parseResult.success) {
        return {
          success: false,
          error: parseResult.error,
          generationTime: Date.now() - startTime,
        };
      }

      // Enhance and finalize config
      let formConfig = this.enhanceFormConfig(parseResult.data);
      formConfig = this.addUniqueIds(formConfig);

      const generationTime = Date.now() - startTime;

      console.log('✅ AI Generation Success:', {
        userId,
        prompt: prompt.substring(0, 50) + '...',
        generationTime,
        fieldCount: this.countFields(formConfig),
      });

      return {
        success: true,
        data: formConfig,
        generationTime,
      };
    } catch (error: any) {
      const generationTime = Date.now() - startTime;

      console.error('❌ AI Generation Error:', {
        userId,
        error: error.message,
        generationTime,
      });

      return {
        success: false,
        error: error.message,
        generationTime,
      };
    }
  }

  private buildSystemPrompt(userPrompt: string): string {
    return `
You are an expert form builder AI assistant. Create a professional form configuration based on the user's requirements.

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON - no explanations, markdown, or extra text
2. Follow the exact structure and field types provided
3. Generate logical, user-friendly field labels
4. Use appropriate field types for the requested data
5. Include helpful helpText for complex fields

AVAILABLE FIELD TYPES (use exact values):
- "heading": Section headers and titles (NO required or helpText properties)
- "shortText": Short single-line text input
- "longText": Multi-line text input (3-4 lines)
- "paragraph": Large text area for detailed responses
- "dropdown": Select from predefined options (must include options array)
- "singleChoice": Radio buttons for single selection (must include options array)
- "multipleChoice": Checkboxes for multiple selections (must include options array)
- "number": Numeric input with validation (can include min/max)
- "image": Image upload field
- "fileUpload": General file upload
- "time": Time picker
- "fullName": Complete name collection
- "email": Email address with validation  
- "phone": Phone number collection
- "address": Complete address with street, city, state
- "datePicker": Date selection
- "appointment": Date and time booking
- "signature": Digital signature capture
- "fillBlank": Fill-in-the-blank text inputs
- "productList": Product catalog with pricing

FORM STRUCTURE (EXACT FORMAT REQUIRED):
{
  "title": "Professional Form Title",
  "description": "Clear description of form purpose",
  "pages": [
    {
      "id": "auto-generated",
      "fields": [
        {
          "id": "auto-generated",
          "type": "heading",
          "label": "Section Title",
          "labelAlignment": "LEFT"
        },
        {
          "id": "auto-generated",
          "type": "shortText",
          "label": "Your Answer",
          "labelAlignment": "LEFT",
          "required": true,
          "helpText": "Enter your response here"
        },
        {
          "id": "auto-generated",
          "type": "dropdown",
          "label": "Select Option",
          "labelAlignment": "LEFT",
          "required": false,
          "helpText": "Choose from the available options",
          "options": [
            {"label": "Option 1", "value": "option1"},
            {"label": "Option 2", "value": "option2"},
            {"label": "Option 3", "value": "option3"}
          ]
        },
        {
          "id": "auto-generated",
          "type": "number",
          "label": "Age",
          "labelAlignment": "LEFT",
          "required": true,
          "helpText": "Enter your age in years",
          "min": 0,
          "max": 120
        },
        {
          "id": "auto-generated",
          "type": "email",
          "label": "Email Address", 
          "labelAlignment": "LEFT",
          "required": true,
          "helpText": "example@example.com"
        }
      ]
    }
  ],
  "settings": {
    "submitButtonText": "Submit Form",
    "showLogo": false,
    "thankyouMessage": "Thank you for your submission!",
    "defaultLabelAlignment": "LEFT",
    "defaultRequiredField": false,
    "isEnabled": true,
    "allowMultipleSubmissions": true,
    "allowMultipleEmailSubmissions": true,
    "collectIpAddress": true,
    "enableCaptcha": false
  }
}

IMPORTANT RULES:
- "heading" fields should NOT have "required" or "helpText" properties
- All other field types should have "required" and "helpText" properties
- Choice fields (dropdown, singleChoice, multipleChoice) MUST include "options" array
- Number fields can include "min" and "max" properties
- Text fields (longText, paragraph) can include "rows" property
- Use "email" type for email fields and set helpText to "example@example.com"
- Group related fields logically
- Start sections with "heading" fields
- Mark essential fields as required: true
- Generate realistic options for choice fields

USER REQUEST: "${userPrompt}"

Generate the form configuration now:`;
  }

  private parseFormConfig(rawResponse: string): {
    success: boolean;
    data?: any;
    error?: string;
  } {
    try {
      // Clean the response
      let cleanedResponse = rawResponse
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      // Find JSON boundaries
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;

      if (jsonStart === -1 || jsonEnd <= jsonStart) {
        return { success: false, error: 'No valid JSON found in AI response' };
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
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to parse AI response: ${error.message}`,
      };
    }
  }

  private validateFormConfig(config: any): {
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

        // ✅ FIXED: Updated to include all 20 field types
        const validTypes = [
          // Basic Elements
          'shortText',
          'longText',
          'paragraph',
          'dropdown',
          'singleChoice',
          'multipleChoice',
          'number',
          'image',
          'fileUpload',
          'time',
          // Advanced Elements
          'heading',
          'fullName',
          'email',
          'phone',
          'address',
          'datePicker',
          'appointment',
          'signature',
          'fillBlank',
          'productList',
        ];

        if (!validTypes.includes(field.type)) {
          return { isValid: false, error: `Invalid field type: ${field.type}` };
        }

        // ✅ NEW: Validate choice fields have options
        const choiceFields = ['dropdown', 'singleChoice', 'multipleChoice'];
        if (choiceFields.includes(field.type)) {
          if (
            !field.options ||
            !Array.isArray(field.options) ||
            field.options.length === 0
          ) {
            return {
              isValid: false,
              error: `Field "${field.label}" of type "${field.type}" must have options array`,
            };
          }

          // Validate option structure
          for (const option of field.options) {
            if (!option.label || !option.value) {
              return {
                isValid: false,
                error: `Field "${field.label}" has invalid option structure. Each option must have label and value`,
              };
            }
          }
        }

        // ✅ NEW: Validate number fields
        if (field.type === 'number') {
          if (field.min !== undefined && typeof field.min !== 'number') {
            return {
              isValid: false,
              error: `Field "${field.label}" min value must be a number`,
            };
          }
          if (field.max !== undefined && typeof field.max !== 'number') {
            return {
              isValid: false,
              error: `Field "${field.label}" max value must be a number`,
            };
          }
          if (
            field.min !== undefined &&
            field.max !== undefined &&
            field.min > field.max
          ) {
            return {
              isValid: false,
              error: `Field "${field.label}" min value cannot be greater than max value`,
            };
          }
        }
      }
    }

    return { isValid: true };
  }

  private enhanceFormConfig(config: any): any {
    // Add default settings if missing
    config.settings = {
      submitButtonText: 'Submit',
      showLogo: false,
      thankyouMessage: 'Thank you for your submission!',
      defaultLabelAlignment: 'LEFT',
      defaultRequiredField: false,
      isEnabled: true,
      allowMultipleSubmissions: true,
      allowMultipleEmailSubmissions: true,
      collectIpAddress: true,
      enableCaptcha: false,
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
        if (field.type !== 'heading') {
          enhancedField.required =
            field.required !== undefined ? field.required : false;
          enhancedField.helpText = field.helpText || '';

          // ✅ ENHANCED: Set default helpText based on field type
          if (!enhancedField.helpText) {
            switch (field.type) {
              case 'email':
                enhancedField.helpText = 'example@example.com';
                break;
              case 'phone':
                enhancedField.helpText = 'Enter your 10-digit mobile number';
                break;
              case 'shortText':
                enhancedField.helpText = 'Enter your answer';
                break;
              case 'longText':
                enhancedField.helpText = 'Enter your detailed response';
                break;
              case 'paragraph':
                enhancedField.helpText = 'Share your thoughts or feedback';
                break;
              case 'number':
                enhancedField.helpText = 'Enter a valid number';
                break;
              case 'time':
                enhancedField.helpText = 'Select time in HH:MM format';
                break;
              case 'datePicker':
                enhancedField.helpText = 'Select a date';
                break;
              case 'dropdown':
              case 'singleChoice':
                enhancedField.helpText = 'Choose one option';
                break;
              case 'multipleChoice':
                enhancedField.helpText = 'Select all that apply';
                break;
              case 'image':
                enhancedField.helpText = 'Upload an image file (PNG, JPG, GIF)';
                break;
              case 'fileUpload':
                enhancedField.helpText = 'Upload your file';
                break;
              default:
                enhancedField.helpText = 'Please fill out this field';
            }
          }

          // ✅ NEW: Add default options for choice fields if missing
          const choiceFields = ['dropdown', 'singleChoice', 'multipleChoice'];
          if (
            choiceFields.includes(field.type) &&
            (!field.options || field.options.length === 0)
          ) {
            enhancedField.options = [
              { label: 'Option 1', value: 'option1' },
              { label: 'Option 2', value: 'option2' },
              { label: 'Option 3', value: 'option3' },
            ];
          }

          // ✅ NEW: Add default properties for specific field types
          if (field.type === 'longText' && !field.rows) {
            enhancedField.rows = 3;
          }

          if (field.type === 'paragraph' && !field.rows) {
            enhancedField.rows = 5;
          }

          if (field.type === 'number') {
            if (field.min === undefined && field.max === undefined) {
              // Add reasonable defaults for common number fields
              if (field.label.toLowerCase().includes('age')) {
                enhancedField.min = 0;
                enhancedField.max = 120;
              } else if (field.label.toLowerCase().includes('year')) {
                enhancedField.min = 1900;
                enhancedField.max = new Date().getFullYear() + 10;
              }
            }
          }
        }

        return enhancedField;
      }),
    }));

    return config;
  }

  private addUniqueIds(config: any): any {
    config.pages = config.pages.map((page: any) => ({
      ...page,
      id: uuidv4(),
      fields: (page.fields || []).map((field: any) => ({
        ...field,
        id: uuidv4(),
      })),
    }));

    return config;
  }

  private countFields(config: any): number {
    return config.pages.reduce(
      (total: number, page: any) => total + (page.fields?.length || 0),
      0
    );
  }
}

export default AIFormGeneratorService;
