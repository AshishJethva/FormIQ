// // Backend: src/services/aiFormGeneratorService.ts
// import { GoogleGenerativeAI } from '@google/generative-ai';
// import { v4 as uuidv4 } from 'uuid';

// export class AIFormGeneratorService {
//   private genAI: GoogleGenerativeAI;
//   private model: any;

//   constructor() {
//     if (!process.env.GEMINI_API_KEY) {
//       throw new Error('GEMINI_API_KEY environment variable is required');
//     }

//     this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
//     this.model = this.genAI.getGenerativeModel({
//       model: 'gemini-2.0-flash-exp',
//       generationConfig: {
//         temperature: 0.3,
//         topK: 40,
//         topP: 0.8,
//         maxOutputTokens: 4096,
//       },
//     });
//   }

//   async generateForm(
//     prompt: string,
//     userId: string
//   ): Promise<{
//     success: boolean;
//     data?: any;
//     error?: string;
//     generationTime: number;
//   }> {
//     const startTime = Date.now();

//     try {
//       // Validate prompt
//       if (!prompt || prompt.trim().length < 10) {
//         return {
//           success: false,
//           error: 'Prompt must be at least 10 characters long',
//           generationTime: Date.now() - startTime,
//         };
//       }

//       if (prompt.trim().length > 1000) {
//         return {
//           success: false,
//           error: 'Prompt must not exceed 1000 characters',
//           generationTime: Date.now() - startTime,
//         };
//       }

//       // Generate form config
//       const systemPrompt = this.buildSystemPrompt(prompt.trim());
//       const result = await this.model.generateContent(systemPrompt);
//       const response = await result.response;
//       const generatedText = response.text();

//       // Parse response
//       const parseResult = this.parseFormConfig(generatedText);
//       if (!parseResult.success) {
//         return {
//           success: false,
//           error: parseResult.error,
//           generationTime: Date.now() - startTime,
//         };
//       }

//       // Enhance and finalize config
//       let formConfig = this.enhanceFormConfig(parseResult.data);
//       formConfig = this.addUniqueIds(formConfig);

//       const generationTime = Date.now() - startTime;

//       console.log('✅ AI Generation Success:', {
//         userId,
//         prompt: prompt.substring(0, 50) + '...',
//         generationTime,
//         fieldCount: this.countFields(formConfig),
//       });

//       return {
//         success: true,
//         data: formConfig,
//         generationTime,
//       };
//     } catch (error: any) {
//       const generationTime = Date.now() - startTime;

//       console.error('❌ AI Generation Error:', {
//         userId,
//         error: error.message,
//         generationTime,
//       });

//       return {
//         success: false,
//         error: error.message,
//         generationTime,
//       };
//     }
//   }

//   private buildSystemPrompt(userPrompt: string): string {
//     return `
// You are an expert form builder AI assistant. Create a professional form configuration based on the user's requirements.

// CRITICAL INSTRUCTIONS:
// 1. Return ONLY valid JSON - no explanations, markdown, or extra text
// 2. Follow the exact structure and field types provided
// 3. Generate logical, user-friendly field labels
// 4. Use appropriate field types for the requested data
// 5. Include helpful helpText for complex fields

// AVAILABLE FIELD TYPES (use exact values):
// - "heading": Section headers and titles (NO required or helpText properties)
// - "shortText": Short single-line text input
// - "longText": Multi-line text input (3-4 lines)
// - "paragraph": Large text area for detailed responses
// - "dropdown": Select from predefined options (must include options array)
// - "singleChoice": Radio buttons for single selection (must include options array)
// - "multipleChoice": Checkboxes for multiple selections (must include options array)
// - "number": Numeric input with validation (can include min/max)
// - "image": Image upload field
// - "fileUpload": General file upload
// - "time": Time picker
// - "fullName": Complete name collection
// - "email": Email address with validation
// - "phone": Phone number collection
// - "address": Complete address with street, city, state
// - "datePicker": Date selection
// - "appointment": Date and time booking
// - "signature": Digital signature capture
// - "fillBlank": Fill-in-the-blank text inputs
// - "productList": Product catalog with pricing

// FORM STRUCTURE (EXACT FORMAT REQUIRED):
// {
//   "title": "Professional Form Title",
//   "description": "Clear description of form purpose",
//   "pages": [
//     {
//       "id": "auto-generated",
//       "fields": [
//         {
//           "id": "auto-generated",
//           "type": "heading",
//           "label": "Section Title",
//           "labelAlignment": "LEFT"
//         },
//         {
//           "id": "auto-generated",
//           "type": "shortText",
//           "label": "Your Answer",
//           "labelAlignment": "LEFT",
//           "required": true,
//           "helpText": "Enter your response here"
//         },
//         {
//           "id": "auto-generated",
//           "type": "dropdown",
//           "label": "Select Option",
//           "labelAlignment": "LEFT",
//           "required": false,
//           "helpText": "Choose from the available options",
//           "options": [
//             {"label": "Option 1", "value": "option1"},
//             {"label": "Option 2", "value": "option2"},
//             {"label": "Option 3", "value": "option3"}
//           ]
//         },
//         {
//           "id": "auto-generated",
//           "type": "number",
//           "label": "Age",
//           "labelAlignment": "LEFT",
//           "required": true,
//           "helpText": "Enter your age in years",
//           "min": 0,
//           "max": 120
//         },
//         {
//           "id": "auto-generated",
//           "type": "email",
//           "label": "Email Address",
//           "labelAlignment": "LEFT",
//           "required": true,
//           "helpText": "example@example.com"
//         }
//       ]
//     }
//   ],
//   "settings": {
//     "submitButtonText": "Submit Form",
//     "showLogo": false,
//     "thankyouMessage": "Thank you for your submission!",
//     "defaultLabelAlignment": "LEFT",
//     "defaultRequiredField": false,
//     "isEnabled": true,
//     "allowMultipleSubmissions": true,
//     "allowMultipleEmailSubmissions": true,
//     "collectIpAddress": true,
//     "enableCaptcha": false
//   }
// }

// IMPORTANT RULES:
// - "heading" fields should NOT have "required" or "helpText" properties
// - All other field types should have "required" and "helpText" properties
// - Choice fields (dropdown, singleChoice, multipleChoice) MUST include "options" array
// - Number fields can include "min" and "max" properties
// - Text fields (longText, paragraph) can include "rows" property
// - Use "email" type for email fields and set helpText to "example@example.com"
// - Group related fields logically
// - Start sections with "heading" fields
// - Mark essential fields as required: true
// - Generate realistic options for choice fields

// USER REQUEST: "${userPrompt}"

// Generate the form configuration now:`;
//   }

//   private parseFormConfig(rawResponse: string): {
//     success: boolean;
//     data?: any;
//     error?: string;
//   } {
//     try {
//       // Clean the response
//       let cleanedResponse = rawResponse
//         .replace(/```json\s*/g, '')
//         .replace(/```\s*/g, '')
//         .trim();

//       // Find JSON boundaries
//       const jsonStart = cleanedResponse.indexOf('{');
//       const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;

//       if (jsonStart === -1 || jsonEnd <= jsonStart) {
//         return { success: false, error: 'No valid JSON found in AI response' };
//       }

//       cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd);

//       // Parse JSON
//       const formConfig = JSON.parse(cleanedResponse);

//       // Validate structure
//       const validation = this.validateFormConfig(formConfig);
//       if (!validation.isValid) {
//         return { success: false, error: validation.error };
//       }

//       return { success: true, data: formConfig };
//     } catch (error: any) {
//       return {
//         success: false,
//         error: `Failed to parse AI response: ${error.message}`,
//       };
//     }
//   }

//   private validateFormConfig(config: any): {
//     isValid: boolean;
//     error?: string;
//   } {
//     // Required fields validation
//     if (!config.title || typeof config.title !== 'string') {
//       return { isValid: false, error: 'Missing or invalid form title' };
//     }

//     if (
//       !config.pages ||
//       !Array.isArray(config.pages) ||
//       config.pages.length === 0
//     ) {
//       return { isValid: false, error: 'Missing or invalid pages array' };
//     }

//     // Validate each page
//     for (let i = 0; i < config.pages.length; i++) {
//       const page = config.pages[i];

//       if (!page.fields || !Array.isArray(page.fields)) {
//         return {
//           isValid: false,
//           error: `Page ${i + 1} has invalid fields array`,
//         };
//       }

//       // Validate each field
//       for (let j = 0; j < page.fields.length; j++) {
//         const field = page.fields[j];

//         if (!field.type || !field.label) {
//           return {
//             isValid: false,
//             error: `Field ${j + 1} in page ${i + 1} is missing type or label`,
//           };
//         }

//         // ✅ FIXED: Updated to include all 20 field types
//         const validTypes = [
//           // Basic Elements
//           'shortText',
//           'longText',
//           'paragraph',
//           'dropdown',
//           'singleChoice',
//           'multipleChoice',
//           'number',
//           'image',
//           'fileUpload',
//           'time',
//           // Advanced Elements
//           'heading',
//           'fullName',
//           'email',
//           'phone',
//           'address',
//           'datePicker',
//           'appointment',
//           'signature',
//           'fillBlank',
//           'productList',
//         ];

//         if (!validTypes.includes(field.type)) {
//           return { isValid: false, error: `Invalid field type: ${field.type}` };
//         }

//         // ✅ NEW: Validate choice fields have options
//         const choiceFields = ['dropdown', 'singleChoice', 'multipleChoice'];
//         if (choiceFields.includes(field.type)) {
//           if (
//             !field.options ||
//             !Array.isArray(field.options) ||
//             field.options.length === 0
//           ) {
//             return {
//               isValid: false,
//               error: `Field "${field.label}" of type "${field.type}" must have options array`,
//             };
//           }

//           // Validate option structure
//           for (const option of field.options) {
//             if (!option.label || !option.value) {
//               return {
//                 isValid: false,
//                 error: `Field "${field.label}" has invalid option structure. Each option must have label and value`,
//               };
//             }
//           }
//         }

//         // ✅ NEW: Validate number fields
//         if (field.type === 'number') {
//           if (field.min !== undefined && typeof field.min !== 'number') {
//             return {
//               isValid: false,
//               error: `Field "${field.label}" min value must be a number`,
//             };
//           }
//           if (field.max !== undefined && typeof field.max !== 'number') {
//             return {
//               isValid: false,
//               error: `Field "${field.label}" max value must be a number`,
//             };
//           }
//           if (
//             field.min !== undefined &&
//             field.max !== undefined &&
//             field.min > field.max
//           ) {
//             return {
//               isValid: false,
//               error: `Field "${field.label}" min value cannot be greater than max value`,
//             };
//           }
//         }
//       }
//     }

//     return { isValid: true };
//   }

//   private enhanceFormConfig(config: any): any {
//     // Add default settings if missing
//     config.settings = {
//       submitButtonText: 'Submit',
//       showLogo: false,
//       thankyouMessage: 'Thank you for your submission!',
//       defaultLabelAlignment: 'LEFT',
//       defaultRequiredField: false,
//       isEnabled: true,
//       allowMultipleSubmissions: true,
//       allowMultipleEmailSubmissions: true,
//       collectIpAddress: true,
//       enableCaptcha: false,
//       ...config.settings,
//     };

//     // Enhance each page and field
//     config.pages = config.pages.map((page: any) => ({
//       ...page,
//       fields: (page.fields || []).map((field: any) => {
//         const enhancedField = {
//           ...field,
//           labelAlignment: field.labelAlignment || 'LEFT',
//         };

//         // Add required and helpText for non-heading fields
//         if (field.type !== 'heading') {
//           enhancedField.required =
//             field.required !== undefined ? field.required : false;
//           enhancedField.helpText = field.helpText || '';

//           // ✅ ENHANCED: Set default helpText based on field type
//           if (!enhancedField.helpText) {
//             switch (field.type) {
//               case 'email':
//                 enhancedField.helpText = 'example@example.com';
//                 break;
//               case 'phone':
//                 enhancedField.helpText = 'Enter your 10-digit mobile number';
//                 break;
//               case 'shortText':
//                 enhancedField.helpText = 'Enter your answer';
//                 break;
//               case 'longText':
//                 enhancedField.helpText = 'Enter your detailed response';
//                 break;
//               case 'paragraph':
//                 enhancedField.helpText = 'Share your thoughts or feedback';
//                 break;
//               case 'number':
//                 enhancedField.helpText = 'Enter a valid number';
//                 break;
//               case 'time':
//                 enhancedField.helpText = 'Select time in HH:MM format';
//                 break;
//               case 'datePicker':
//                 enhancedField.helpText = 'Select a date';
//                 break;
//               case 'dropdown':
//               case 'singleChoice':
//                 enhancedField.helpText = 'Choose one option';
//                 break;
//               case 'multipleChoice':
//                 enhancedField.helpText = 'Select all that apply';
//                 break;
//               case 'image':
//                 enhancedField.helpText = 'Upload an image file (PNG, JPG, GIF)';
//                 break;
//               case 'fileUpload':
//                 enhancedField.helpText = 'Upload your file';
//                 break;
//               default:
//                 enhancedField.helpText = 'Please fill out this field';
//             }
//           }

//           // ✅ NEW: Add default options for choice fields if missing
//           const choiceFields = ['dropdown', 'singleChoice', 'multipleChoice'];
//           if (
//             choiceFields.includes(field.type) &&
//             (!field.options || field.options.length === 0)
//           ) {
//             enhancedField.options = [
//               { label: 'Option 1', value: 'option1' },
//               { label: 'Option 2', value: 'option2' },
//               { label: 'Option 3', value: 'option3' },
//             ];
//           }

//           // ✅ NEW: Add default properties for specific field types
//           if (field.type === 'longText' && !field.rows) {
//             enhancedField.rows = 3;
//           }

//           if (field.type === 'paragraph' && !field.rows) {
//             enhancedField.rows = 5;
//           }

//           if (field.type === 'number') {
//             if (field.min === undefined && field.max === undefined) {
//               // Add reasonable defaults for common number fields
//               if (field.label.toLowerCase().includes('age')) {
//                 enhancedField.min = 0;
//                 enhancedField.max = 120;
//               } else if (field.label.toLowerCase().includes('year')) {
//                 enhancedField.min = 1900;
//                 enhancedField.max = new Date().getFullYear() + 10;
//               }
//             }
//           }
//         }

//         return enhancedField;
//       }),
//     }));

//     return config;
//   }

//   private addUniqueIds(config: any): any {
//     config.pages = config.pages.map((page: any) => ({
//       ...page,
//       id: uuidv4(),
//       fields: (page.fields || []).map((field: any) => ({
//         ...field,
//         id: uuidv4(),
//       })),
//     }));

//     return config;
//   }

//   private countFields(config: any): number {
//     return config.pages.reduce(
//       (total: number, page: any) => total + (page.fields?.length || 0),
//       0
//     );
//   }
// }

// export default AIFormGeneratorService;

// Backend: src/services/aiFormGeneratorService.ts - Complete Working Code
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

      console.log('🤖 Starting AI form generation:', {
        userId,
        promptLength: prompt.trim().length,
        timestamp: new Date().toISOString(),
      });

      // Generate form config with logo
      const systemPrompt = this.buildSystemPrompt(prompt.trim());
      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      const generatedText = response.text();

      console.log('📝 AI response received, parsing...', {
        responseLength: generatedText.length,
      });

      // Parse response
      const parseResult = this.parseFormConfig(generatedText);
      if (!parseResult.success) {
        return {
          success: false,
          error: parseResult.error,
          generationTime: Date.now() - startTime,
        };
      }

      // Enhance form config with logo and settings
      let formConfig = this.enhanceFormConfig(parseResult.data, prompt);

      // Generate appropriate logo
      console.log('🎨 Generating logo for form...');
      const logoResult = await this.generateFormLogo(
        formConfig.title,
        formConfig.description
      );
      if (logoResult.success && logoResult.logoUrl) {
        formConfig.logo = {
          src: logoResult.logoUrl,
          type: 'url',
          alignment: 'CENTER',
          size: 100, // Maximum size as requested
          publicId: logoResult.publicId || null,
        };
        console.log('✅ Logo generated successfully:', logoResult.logoUrl);
      } else {
        console.log(
          '⚠️ Logo generation failed, proceeding without logo:',
          logoResult.error
        );
      }

      // Add unique IDs
      formConfig = this.addUniqueIds(formConfig);

      const generationTime = Date.now() - startTime;

      console.log('✅ AI Generation Success with Logo:', {
        userId,
        prompt: prompt.substring(0, 50) + '...',
        generationTime,
        fieldCount: this.countFields(formConfig),
        hasLogo: !!formConfig.logo,
        logoUrl: formConfig.logo?.src?.substring(0, 50) + '...',
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
        stack: error.stack,
        generationTime,
      });

      return {
        success: false,
        error: error.message || 'AI generation failed',
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
6. Create professional, descriptive form titles and descriptions

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
  "title": "Professional, Descriptive Form Title",
  "description": "Clear, engaging description explaining the form's purpose and benefits",
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
    "showLogo": true,
    "thankyouMessage": "Thank you for your submission! We'll get back to you soon.",
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
- Create engaging, descriptive titles and descriptions
- Set showLogo to true and allowMultipleSubmissions/allowMultipleEmailSubmissions to true
- Include appropriate thank you messages

USER REQUEST: "${userPrompt}"

Generate the form configuration now:`;
  }

  private async generateFormLogo(
    title: string,
    description: string = ''
  ): Promise<{
    success: boolean;
    logoUrl?: string;
    publicId?: string;
    error?: string;
  }> {
    try {
      // Extract key concepts from title and description for logo generation
      const logoPrompt = this.createLogoPrompt(title, description);

      console.log('🎨 Logo prompt created:', logoPrompt);

      // Use predefined professional logos based on form type
      const logoResult = await this.generateLogoFromPrompt(logoPrompt);

      return logoResult;
    } catch (error: any) {
      console.error('❌ Logo generation failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private createLogoPrompt(title: string, description: string): string {
    // Extract key words and concepts
    const formContext = (title + ' ' + description).toLowerCase();

    // Determine form category and style
    let logoStyle = 'modern, professional, minimalist';
    let logoElements = 'clean, corporate';
    let colors = 'blue and white';

    // Customize based on form type
    if (formContext.includes('contact') || formContext.includes('inquiry')) {
      logoElements = 'communication, envelope, speech bubble';
      colors = 'blue and gray';
    } else if (
      formContext.includes('registration') ||
      formContext.includes('signup')
    ) {
      logoElements = 'checkmark, user profile, document';
      colors = 'green and blue';
    } else if (
      formContext.includes('application') ||
      formContext.includes('job')
    ) {
      logoElements = 'briefcase, document, professional';
      colors = 'navy blue and gray';
    } else if (
      formContext.includes('feedback') ||
      formContext.includes('survey')
    ) {
      logoElements = 'star, thumbs up, chart';
      colors = 'orange and blue';
    } else if (
      formContext.includes('booking') ||
      formContext.includes('appointment')
    ) {
      logoElements = 'calendar, clock, schedule';
      colors = 'purple and white';
    } else if (
      formContext.includes('order') ||
      formContext.includes('purchase')
    ) {
      logoElements = 'shopping cart, package, commerce';
      colors = 'green and blue';
    } else if (formContext.includes('event') || formContext.includes('rsvp')) {
      logoElements = 'event, celebration, ticket';
      colors = 'purple and gold';
    } else if (
      formContext.includes('support') ||
      formContext.includes('help')
    ) {
      logoElements = 'help, support, question mark';
      colors = 'blue and white';
    }

    return `Create a ${logoStyle} logo with ${logoElements} in ${colors} colors, suitable for a business form titled "${title}"`;
  }

  private async generateLogoFromPrompt(prompt: string): Promise<{
    success: boolean;
    logoUrl?: string;
    publicId?: string;
    error?: string;
  }> {
    try {
      // Use predefined professional logos based on form type
      const logoCategories = this.getPredefinedLogos();
      const selectedLogo = this.selectAppropriateLogoFromPrompt(
        prompt,
        logoCategories
      );

      if (selectedLogo) {
        return {
          success: true,
          logoUrl: selectedLogo.url,
          publicId: selectedLogo.publicId,
        };
      }

      // Fallback to default logo
      return {
        success: true,
        logoUrl:
          'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop&crop=center',
        publicId: 'default_form_logo',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private getPredefinedLogos() {
    return {
      contact: [
        {
          url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=200&fit=crop&crop=center',
          publicId: 'contact_logo_1',
          keywords: ['contact', 'communication', 'inquiry', 'message'],
        },
        {
          url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200&h=200&fit=crop&crop=center',
          publicId: 'contact_logo_2',
          keywords: ['contact', 'envelope', 'mail'],
        },
      ],
      registration: [
        {
          url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=200&h=200&fit=crop&crop=center',
          publicId: 'registration_logo_1',
          keywords: ['registration', 'signup', 'account', 'user'],
        },
        {
          url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=center',
          publicId: 'registration_logo_2',
          keywords: ['registration', 'form', 'document'],
        },
      ],
      application: [
        {
          url: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=200&h=200&fit=crop&crop=center',
          publicId: 'application_logo_1',
          keywords: ['application', 'job', 'career', 'professional'],
        },
        {
          url: 'https://images.unsplash.com/photo-1554774853-719586f82d77?w=200&h=200&fit=crop&crop=center',
          publicId: 'application_logo_2',
          keywords: ['application', 'business', 'work'],
        },
      ],
      feedback: [
        {
          url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=200&fit=crop&crop=center',
          publicId: 'feedback_logo_1',
          keywords: ['feedback', 'survey', 'review', 'rating'],
        },
        {
          url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=200&fit=crop&crop=center',
          publicId: 'feedback_logo_2',
          keywords: ['feedback', 'analytics', 'chart'],
        },
      ],
      booking: [
        {
          url: 'https://images.unsplash.com/photo-1564979045531-fa386a275b27?w=200&h=200&fit=crop&crop=center',
          publicId: 'booking_logo_1',
          keywords: ['booking', 'appointment', 'schedule', 'calendar'],
        },
        {
          url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=center',
          publicId: 'booking_logo_2',
          keywords: ['booking', 'time', 'clock'],
        },
      ],
      order: [
        {
          url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&h=200&fit=crop&crop=center',
          publicId: 'order_logo_1',
          keywords: ['order', 'purchase', 'shopping', 'ecommerce'],
        },
        {
          url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&h=200&fit=crop&crop=center',
          publicId: 'order_logo_2',
          keywords: ['order', 'package', 'delivery'],
        },
      ],
      event: [
        {
          url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=200&h=200&fit=crop&crop=center',
          publicId: 'event_logo_1',
          keywords: ['event', 'celebration', 'party', 'rsvp'],
        },
        {
          url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200&h=200&fit=crop&crop=center',
          publicId: 'event_logo_2',
          keywords: ['event', 'gathering', 'meeting'],
        },
      ],
      support: [
        {
          url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop&crop=center',
          publicId: 'support_logo_1',
          keywords: ['support', 'help', 'assistance', 'customer service'],
        },
        {
          url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=200&fit=crop&crop=center',
          publicId: 'support_logo_2',
          keywords: ['support', 'headset', 'communication'],
        },
      ],
      default: [
        {
          url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=center',
          publicId: 'default_logo_1',
          keywords: ['form', 'document', 'paper', 'professional'],
        },
        {
          url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=200&h=200&fit=crop&crop=center',
          publicId: 'default_logo_2',
          keywords: ['business', 'professional', 'clean'],
        },
      ],
    };
  }

  private selectAppropriateLogoFromPrompt(prompt: string, logoCategories: any) {
    const lowerPrompt = prompt.toLowerCase();

    // Find the best matching category
    for (const [category, logos] of Object.entries(logoCategories)) {
      if (category === 'default') continue;

      const categoryLogos = logos as any[];
      const matchingLogo = categoryLogos.find(logo =>
        logo.keywords.some((keyword: string) => lowerPrompt.includes(keyword))
      );

      if (matchingLogo) {
        return matchingLogo;
      }
    }

    // Return random default logo if no match found
    const defaultLogos = logoCategories.default;
    return defaultLogos[Math.floor(Math.random() * defaultLogos.length)];
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

        // Updated to include all 20 field types
        const validTypes = [
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

        // Validate choice fields have options
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

        // Validate number fields
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

  private enhanceFormConfig(config: any, originalPrompt: string): any {
    // Enhanced default settings with your requirements
    config.settings = {
      submitButtonText: 'Submit Form',
      showLogo: true, // Enable logo by default
      thankyouMessage: this.generateThankYouMessage(
        config.title,
        originalPrompt
      ),
      defaultLabelAlignment: 'LEFT',
      defaultRequiredField: false,
      isEnabled: true,
      allowMultipleSubmissions: true, // Enable multiple submissions
      allowMultipleEmailSubmissions: true, // Enable multiple email submissions
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
          enhancedField.helpText =
            field.helpText || this.generateHelpText(field.type, field.label);

          // Add default options for choice fields if missing
          const choiceFields = ['dropdown', 'singleChoice', 'multipleChoice'];
          if (
            choiceFields.includes(field.type) &&
            (!field.options || field.options.length === 0)
          ) {
            enhancedField.options = this.generateDefaultOptions(
              field.label,
              field.type
            );
          }

          // Add default properties for specific field types
          if (field.type === 'longText' && !field.rows) {
            enhancedField.rows = 3;
          }

          if (field.type === 'paragraph' && !field.rows) {
            enhancedField.rows = 5;
          }

          // Smart number field defaults
          if (field.type === 'number') {
            if (field.min === undefined && field.max === undefined) {
              const defaults = this.getNumberFieldDefaults(field.label);
              if (defaults.min !== undefined) enhancedField.min = defaults.min;
              if (defaults.max !== undefined) enhancedField.max = defaults.max;
            }
          }
        }

        return enhancedField;
      }),
    }));

    return config;
  }

  private generateThankYouMessage(title: string, prompt: string): string {
    const formType = prompt.toLowerCase();

    if (formType.includes('contact') || formType.includes('inquiry')) {
      return "Thank you for reaching out! We've received your message and will get back to you within 24 hours.";
    } else if (formType.includes('application') || formType.includes('job')) {
      return "Thank you for your application! We'll review your submission and contact you if you're selected for the next step.";
    } else if (
      formType.includes('registration') ||
      formType.includes('signup')
    ) {
      return "Registration successful! Welcome aboard. You'll receive a confirmation email shortly.";
    } else if (formType.includes('feedback') || formType.includes('survey')) {
      return 'Thank you for your valuable feedback! Your input helps us improve our services.';
    } else if (
      formType.includes('booking') ||
      formType.includes('appointment')
    ) {
      return "Your booking has been confirmed! You'll receive a confirmation email with all the details.";
    } else if (formType.includes('support') || formType.includes('help')) {
      return "Thank you for contacting support! We've received your request and will assist you shortly.";
    }

    return "Thank you for your submission! We've received your information and will be in touch soon.";
  }

  private generateHelpText(fieldType: string, label: string): string {
    const lowerLabel = label.toLowerCase();

    switch (fieldType) {
      case 'email':
        return 'example@company.com';
      case 'phone':
        return 'Enter your 10-digit mobile number';
      case 'shortText':
        if (lowerLabel.includes('name')) return 'Enter your full name';
        if (lowerLabel.includes('company')) return 'Enter your company name';
        return 'Enter your answer';
      case 'longText':
        return 'Please provide detailed information';
      case 'paragraph':
        return 'Share your thoughts, experiences, or detailed feedback';
      case 'number':
        if (lowerLabel.includes('age')) return 'Enter your age in years';
        if (lowerLabel.includes('year')) return 'Enter the year (YYYY)';
        if (lowerLabel.includes('experience'))
          return 'Number of years of experience';
        return 'Enter a valid number';
      case 'datePicker':
        return 'Select a date from the calendar';
      case 'time':
        return 'Select time in HH:MM format';
      case 'dropdown':
      case 'singleChoice':
        return 'Choose one option from the list';
      case 'multipleChoice':
        return 'Select all options that apply';
      case 'image':
        return 'Upload an image (PNG, JPG, GIF up to 10MB)';
      case 'fileUpload':
        return 'Upload your files (up to 25MB each)';
      default:
        return 'Please complete this field';
    }
  }

  private generateDefaultOptions(
    label: string,
    fieldType: string
  ): Array<{ label: string; value: string }> {
    const lowerLabel = label.toLowerCase();

    // Context-specific options
    if (lowerLabel.includes('experience') || lowerLabel.includes('level')) {
      return [
        { label: 'Beginner (0-2 years)', value: 'beginner' },
        { label: 'Intermediate (2-5 years)', value: 'intermediate' },
        { label: 'Advanced (5+ years)', value: 'advanced' },
        { label: 'Expert (10+ years)', value: 'expert' },
      ];
    }

    if (lowerLabel.includes('satisfaction') || lowerLabel.includes('rating')) {
      return [
        { label: 'Excellent', value: 'excellent' },
        { label: 'Good', value: 'good' },
        { label: 'Average', value: 'average' },
        { label: 'Poor', value: 'poor' },
      ];
    }

    if (lowerLabel.includes('size') || lowerLabel.includes('company')) {
      return [
        { label: 'Small (1-50 employees)', value: 'small' },
        { label: 'Medium (51-500 employees)', value: 'medium' },
        { label: 'Large (500+ employees)', value: 'large' },
      ];
    }

    if (lowerLabel.includes('priority') || lowerLabel.includes('urgency')) {
      return [
        { label: 'High Priority', value: 'high' },
        { label: 'Medium Priority', value: 'medium' },
        { label: 'Low Priority', value: 'low' },
      ];
    }

    if (lowerLabel.includes('frequency') || lowerLabel.includes('often')) {
      return [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Rarely', value: 'rarely' },
      ];
    }

    if (lowerLabel.includes('budget') || lowerLabel.includes('price')) {
      return [
        { label: 'Under ₹50,000', value: 'under_50k' },
        { label: '₹50,000 - ₹2,00,000', value: '50k_200k' },
        { label: '₹2,00,000 - ₹5,00,000', value: '200k_500k' },
        { label: 'Above ₹5,00,000', value: 'above_500k' },
      ];
    }

    if (lowerLabel.includes('gender')) {
      return [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
        { label: 'Other', value: 'other' },
        { label: 'Prefer not to say', value: 'prefer_not_to_say' },
      ];
    }

    if (
      lowerLabel.includes('education') ||
      lowerLabel.includes('qualification')
    ) {
      return [
        { label: 'High School', value: 'high_school' },
        { label: "Bachelor's Degree", value: 'bachelors' },
        { label: "Master's Degree", value: 'masters' },
        { label: 'PhD', value: 'phd' },
      ];
    }

    if (lowerLabel.includes('country') || lowerLabel.includes('location')) {
      return [
        { label: 'India', value: 'india' },
        { label: 'United States', value: 'usa' },
        { label: 'United Kingdom', value: 'uk' },
        { label: 'Canada', value: 'canada' },
        { label: 'Other', value: 'other' },
      ];
    }

    if (lowerLabel.includes('industry') || lowerLabel.includes('sector')) {
      return [
        { label: 'Technology', value: 'technology' },
        { label: 'Healthcare', value: 'healthcare' },
        { label: 'Finance', value: 'finance' },
        { label: 'Education', value: 'education' },
        { label: 'Other', value: 'other' },
      ];
    }

    // Default options
    return [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
      { label: 'Option 3', value: 'option3' },
    ];
  }

  private getNumberFieldDefaults(label: string): {
    min?: number;
    max?: number;
  } {
    const lowerLabel = label.toLowerCase();

    if (lowerLabel.includes('age')) {
      return { min: 0, max: 120 };
    }

    if (
      lowerLabel.includes('year') &&
      (lowerLabel.includes('passing') || lowerLabel.includes('graduation'))
    ) {
      return { min: 1950, max: new Date().getFullYear() };
    }

    if (lowerLabel.includes('year') && lowerLabel.includes('experience')) {
      return { min: 0, max: 50 };
    }

    if (lowerLabel.includes('rating') || lowerLabel.includes('score')) {
      return { min: 1, max: 10 };
    }

    if (lowerLabel.includes('percentage') || lowerLabel.includes('marks')) {
      return { min: 0, max: 100 };
    }

    if (lowerLabel.includes('salary') || lowerLabel.includes('income')) {
      return { min: 0, max: 10000000 }; // 1 crore max
    }

    if (lowerLabel.includes('phone') || lowerLabel.includes('mobile')) {
      return { min: 1000000000, max: 9999999999 }; // 10-digit phone numbers
    }

    if (lowerLabel.includes('zip') || lowerLabel.includes('pin')) {
      return { min: 100000, max: 999999 }; // 6-digit PIN codes
    }

    return {};
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

  // ✅ New method: Get logo suggestions for different form types
  async getLogoSuggestions(
    formType?: string,
    title?: string,
    description?: string
  ): Promise<{
    suggestions: Array<{
      category: string;
      logos: Array<{
        url: string;
        publicId: string;
        description: string;
      }>;
    }>;
  }> {
    try {
      const logoCategories = this.getPredefinedLogos();
      const suggestions = [];

      // If form type is specified, prioritize that category
      if (formType && logoCategories[formType]) {
        suggestions.push({
          category: formType,
          logos: logoCategories[formType].map((logo: any) => ({
            url: logo.url,
            publicId: logo.publicId,
            description: `${formType} themed logo`,
          })),
        });
      }

      // If title/description provided, find matching categories
      if (title || description) {
        const content = (title + ' ' + description).toLowerCase();

        for (const [category, logos] of Object.entries(logoCategories)) {
          if (category === 'default' || (formType && category === formType))
            continue;

          const categoryLogos = logos as any[];
          const isMatch = categoryLogos.some(logo =>
            logo.keywords.some((keyword: string) => content.includes(keyword))
          );

          if (isMatch) {
            suggestions.push({
              category,
              logos: categoryLogos.map(logo => ({
                url: logo.url,
                publicId: logo.publicId,
                description: `${category} style logo`,
              })),
            });
          }
        }
      }

      // Always include some default options
      if (suggestions.length === 0 || suggestions.length < 3) {
        suggestions.push({
          category: 'professional',
          logos: logoCategories.default.map((logo: any) => ({
            url: logo.url,
            publicId: logo.publicId,
            description: 'Professional business logo',
          })),
        });
      }

      return { suggestions: suggestions.slice(0, 5) }; // Limit to 5 categories
    } catch (error) {
      console.error('❌ Error getting logo suggestions:', error);
      return { suggestions: [] };
    }
  }

  // ✅ Public method to generate logos for existing forms
  async generateFormLogoPublic(
    title: string,
    description: string = ''
  ): Promise<{
    success: boolean;
    logoUrl?: string;
    publicId?: string;
    error?: string;
  }> {
    return this.generateFormLogo(title, description);
  }

  // ✅ Method to validate form configuration
  validateFormConfigPublic(config: any): { isValid: boolean; error?: string } {
    return this.validateFormConfig(config);
  }

  // ✅ Method to enhance existing form configurations
  enhanceFormConfigPublic(config: any, prompt: string = ''): any {
    return this.enhanceFormConfig(config, prompt);
  }

  // ✅ Method to get available field types
  getAvailableFieldTypes(): string[] {
    return [
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
  }

  // ✅ Method to get form generation statistics
  getGenerationStats(): {
    supportedFieldTypes: number;
    logoCategories: number;
    defaultOptions: string[];
  } {
    const logoCategories = this.getPredefinedLogos();
    return {
      supportedFieldTypes: this.getAvailableFieldTypes().length,
      logoCategories: Object.keys(logoCategories).length,
      defaultOptions: [
        'Multiple submissions enabled',
        'Logo generation included',
        'Smart field validation',
        'Context-aware help text',
        'Professional styling',
      ],
    };
  }

  // ✅ Method to cleanup and format AI responses
  private cleanAIResponse(response: string): string {
    return response
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .replace(/^\s*[\r\n]/gm, '') // Remove empty lines
      .trim();
  }

  // ✅ Method to handle AI generation errors gracefully
  private handleGenerationError(error: any, context: string): string {
    console.error(`❌ ${context} Error:`, error);

    if (error.message.includes('quota')) {
      return 'API quota exceeded. Please try again later.';
    } else if (error.message.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    } else if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again with a shorter prompt.';
    } else if (error.message.includes('invalid')) {
      return 'Invalid request. Please check your input and try again.';
    }

    return 'An unexpected error occurred during generation.';
  }

  // ✅ Method to validate environment setup
  validateEnvironment(): { isValid: boolean; missing: string[] } {
    const missing = [];

    if (!process.env.GEMINI_API_KEY) {
      missing.push('GEMINI_API_KEY');
    }

    // Add other required environment variables here
    // if (!process.env.LOGO_API_KEY) missing.push('LOGO_API_KEY');

    return {
      isValid: missing.length === 0,
      missing,
    };
  }
}

export default AIFormGeneratorService;
