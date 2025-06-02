// src/services/aiFormGeneratorService.ts
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
      formConfig = this.cleanFormConfigForMongoDB(formConfig);

      console.log('🎨 Generating 900x265 logo for form...');
      const logoResult = await this.generateFormLogo(
        formConfig.title,
        formConfig.description,
        prompt
      );

      if (logoResult.success && logoResult.logoUrl) {
        formConfig.logo = {
          src: logoResult.logoUrl,
          type: 'url',
          alignment: 'CENTER',
          size: 100, // Maximum size (100%)
          publicId: logoResult.publicId || null,
        };
        console.log('✅ Logo generated successfully:', logoResult.logoUrl);
      } else {
        console.log('⚠️ No appropriate logo found, proceeding without logo');
        formConfig.logo = null; // Don't set logo if not appropriate
      }

      // Add unique IDs
      formConfig = this.addUniqueIds(formConfig);

      const generationTime = Date.now() - startTime;

      console.log('✅ AI Generation Success:', {
        userId,
        prompt: prompt.substring(0, 50) + '...',
        generationTime,
        fieldCount: this.countFields(formConfig),
        hasLogo: !!formConfig.logo,
        logoUrl: formConfig.logo?.src
          ? formConfig.logo.src.substring(0, 50) + '...'
          : 'None',
      });

      return {
        success: true,
        data: formConfig,
        generationTime,
      };
    } catch (error: any) {
      const generationTime = Date.now() - startTime;

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
- Each option must have both "label" and "value" properties
- Set showLogo to true and allowMultipleSubmissions/allowMultipleEmailSubmissions to true by default
- Generate realistic, contextual field options

USER REQUEST: "${userPrompt}"

Generate the form configuration now:`;
  }

  private cleanFormConfigForMongoDB(config: any): any {
    console.log('🧹 Cleaning form config for MongoDB compatibility...');

    // Clean pages and fields
    if (config.pages && Array.isArray(config.pages)) {
      config.pages = config.pages.map((page: any) => ({
        ...page,
        fields: (page.fields || []).map((field: any) => {
          const cleanField: any = {
            id: field.id,
            type: field.type,
            label: field.label,
            labelAlignment: field.labelAlignment || 'LEFT',
          };

          // ✅ FIXED: Only add properties that exist for non-heading fields
          if (field.type !== 'heading') {
            cleanField.required = Boolean(field.required);
            cleanField.helpText = field.helpText || '';

            // ✅ FIXED: Handle options array properly for choice fields
            const choiceFields = ['dropdown', 'singleChoice', 'multipleChoice'];
            if (choiceFields.includes(field.type)) {
              if (
                field.options &&
                Array.isArray(field.options) &&
                field.options.length > 0
              ) {
                // Ensure each option has proper structure
                cleanField.options = field.options
                  .map((option: any) => ({
                    label: String(option.label || option),
                    value: String(option.value || option.label || option),
                    type: option.type || undefined,
                  }))
                  .filter((option: any) => option.label && option.value);

                // If no valid options, create defaults
                if (cleanField.options.length === 0) {
                  cleanField.options = this.generateDefaultOptions(
                    field.label,
                    field.type
                  );
                }
              } else {
                // Generate default options if missing
                cleanField.options = this.generateDefaultOptions(
                  field.label,
                  field.type
                );
              }
            }

            // ✅ FIXED: Handle other field-specific properties
            if (field.type === 'number') {
              if (field.min !== undefined) cleanField.min = Number(field.min);
              if (field.max !== undefined) cleanField.max = Number(field.max);
              if (field.step !== undefined)
                cleanField.step = Number(field.step);
            }

            if (field.type === 'longText' || field.type === 'paragraph') {
              if (field.rows !== undefined)
                cleanField.rows = Number(field.rows);
            }

            if (
              field.type === 'shortText' ||
              field.type === 'longText' ||
              field.type === 'paragraph'
            ) {
              if (field.placeholder)
                cleanField.placeholder = String(field.placeholder);
              if (field.minLength !== undefined)
                cleanField.minLength = Number(field.minLength);
              if (field.maxLength !== undefined)
                cleanField.maxLength = Number(field.maxLength);
            }

            if (field.type === 'fileUpload') {
              if (field.multiple !== undefined)
                cleanField.multiple = Boolean(field.multiple);
              if (field.accept) cleanField.accept = String(field.accept);
            }

            if (field.defaultValue !== undefined) {
              cleanField.defaultValue = field.defaultValue;
            }
          }

          console.log(`🔧 Cleaned field: ${field.type} - ${field.label}`, {
            hasOptions: !!cleanField.options,
            optionsCount: cleanField.options?.length || 0,
          });

          return cleanField;
        }),
      }));
    }

    console.log('✅ Form config cleaned for MongoDB compatibility');
    return config;
  }

  private async generateFormLogo(
    title: string,
    description: string = '',
    originalPrompt: string = ''
  ): Promise<{
    success: boolean;
    logoUrl?: string;
    publicId?: string;
    error?: string;
  }> {
    try {
      // ✅ Enhanced logo selection logic for professional web app forms
      const logoResult = this.selectAppropriateLogoForWebApp(
        title,
        description,
        originalPrompt
      );

      if (logoResult.isAppropriate) {
        return {
          success: true,
          logoUrl: logoResult.logoUrl,
          publicId: logoResult.publicId,
        };
      } else {
        console.log(
          '⚠️ No appropriate professional logo found for this form type'
        );
        return {
          success: false,
          error:
            'No appropriate professional logo available for this form type',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Enhanced logo selection for professional web apps with 900x265 images
  private selectAppropriateLogoForWebApp(
    title: string,
    description: string,
    prompt: string
  ): {
    isAppropriate: boolean;
    logoUrl?: string;
    publicId?: string;
    category?: string;
  } {
    const content = (title + ' ' + description + ' ' + prompt).toLowerCase();

    // ✅ Professional 900x265 logos for different form categories
    const professionalLogos = {
      contact: {
        keywords: [
          'contact',
          'inquiry',
          'get in touch',
          'reach out',
          'message',
          'support',
        ],
        logos: [
          {
            url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=900&h=265&fit=crop&crop=center',
            publicId: 'contact_form_900x265_1',
            description: 'Professional contact form header',
          },
          {
            url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=900&h=265&fit=crop&crop=center',
            publicId: 'contact_form_900x265_2',
            description: 'Business communication header',
          },
        ],
      },
      registration: {
        keywords: [
          'registration',
          'signup',
          'sign up',
          'register',
          'account',
          'join',
          'membership',
        ],
        logos: [
          {
            url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=900&h=265&fit=crop&crop=center',
            publicId: 'registration_900x265_1',
            description: 'Professional registration header',
          },
          {
            url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=900&h=265&fit=crop&crop=center',
            publicId: 'registration_900x265_2',
            description: 'Account signup header',
          },
        ],
      },
      application: {
        keywords: [
          'application',
          'apply',
          'job',
          'career',
          'hiring',
          'recruitment',
          'position',
        ],
        logos: [
          {
            url: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=900&h=265&fit=crop&crop=center',
            publicId: 'application_900x265_1',
            description: 'Job application header',
          },
          {
            url: 'https://images.unsplash.com/photo-1554774853-719586f82d77?w=900&h=265&fit=crop&crop=center',
            publicId: 'application_900x265_2',
            description: 'Career opportunity header',
          },
        ],
      },
      feedback: {
        keywords: [
          'feedback',
          'survey',
          'review',
          'rating',
          'opinion',
          'evaluation',
        ],
        logos: [
          {
            url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&h=265&fit=crop&crop=center',
            publicId: 'feedback_900x265_1',
            description: 'Feedback collection header',
          },
          {
            url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&h=265&fit=crop&crop=center',
            publicId: 'feedback_900x265_2',
            description: 'Survey analytics header',
          },
        ],
      },
      booking: {
        keywords: [
          'booking',
          'appointment',
          'schedule',
          'reservation',
          'book',
          'meeting',
        ],
        logos: [
          {
            url: 'https://images.unsplash.com/photo-1564979045531-fa386a275b27?w=900&h=265&fit=crop&crop=center',
            publicId: 'booking_900x265_1',
            description: 'Appointment booking header',
          },
          {
            url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&h=265&fit=crop&crop=center',
            publicId: 'booking_900x265_2',
            description: 'Schedule management header',
          },
        ],
      },
      ecommerce: {
        keywords: [
          'order',
          'purchase',
          'buy',
          'shopping',
          'product',
          'checkout',
          'payment',
        ],
        logos: [
          {
            url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=900&h=265&fit=crop&crop=center',
            publicId: 'ecommerce_900x265_1',
            description: 'E-commerce order header',
          },
          {
            url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&h=265&fit=crop&crop=center',
            publicId: 'ecommerce_900x265_2',
            description: 'Online shopping header',
          },
        ],
      },
      event: {
        keywords: [
          'event',
          'rsvp',
          'conference',
          'workshop',
          'seminar',
          'celebration',
        ],
        logos: [
          {
            url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=900&h=265&fit=crop&crop=center',
            publicId: 'event_900x265_1',
            description: 'Event management header',
          },
          {
            url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&h=265&fit=crop&crop=center',
            publicId: 'event_900x265_2',
            description: 'Conference registration header',
          },
        ],
      },
      business: {
        keywords: [
          'business',
          'corporate',
          'company',
          'professional',
          'service',
          'consultation',
        ],
        logos: [
          {
            url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&h=265&fit=crop&crop=center',
            publicId: 'business_900x265_1',
            description: 'Professional business header',
          },
          {
            url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=900&h=265&fit=crop&crop=center',
            publicId: 'business_900x265_2',
            description: 'Corporate form header',
          },
        ],
      },
    };

    // ✅ Find the most appropriate category
    let bestMatch = { category: '', score: 0 };

    for (const [category, data] of Object.entries(professionalLogos)) {
      const matchingKeywords = data.keywords.filter(keyword =>
        content.includes(keyword)
      );

      if (matchingKeywords.length > bestMatch.score) {
        bestMatch = { category, score: matchingKeywords.length };
      }
    }

    // ✅ Only return logo if we have a strong match (at least 1 keyword match)
    if (bestMatch.score > 0 && bestMatch.category) {
      const categoryData =
        professionalLogos[bestMatch.category as keyof typeof professionalLogos];
      const selectedLogo =
        categoryData.logos[
          Math.floor(Math.random() * categoryData.logos.length)
        ];

      console.log('✅ Found appropriate professional logo:', {
        category: bestMatch.category,
        matchScore: bestMatch.score,
        logoUrl: selectedLogo.url,
        description: selectedLogo.description,
      });

      return {
        isAppropriate: true,
        logoUrl: selectedLogo.url,
        publicId: selectedLogo.publicId,
        category: bestMatch.category,
      };
    }

    // ✅ Fallback: Only use generic business logo for clearly business-related forms
    const businessTerms = [
      'form',
      'submit',
      'application',
      'request',
      'information',
    ];
    const hasBusinessContext = businessTerms.some(term =>
      content.includes(term)
    );

    if (
      hasBusinessContext &&
      (content.includes('business') || content.includes('professional'))
    ) {
      const businessLogo = professionalLogos.business.logos[0];
      console.log('✅ Using fallback business logo for professional context');

      return {
        isAppropriate: true,
        logoUrl: businessLogo.url,
        publicId: businessLogo.publicId,
        category: 'business-fallback',
      };
    }

    console.log(
      '❌ No appropriate professional logo found - will proceed without logo'
    );
    return { isAppropriate: false };
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

        // All 20 field types
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
            // Will be fixed in cleanFormConfigForMongoDB
            console.log(
              `⚠️ Field "${field.label}" missing options - will be generated`
            );
          } else {
            // Validate option structure
            for (const option of field.options) {
              if (!option.label || !option.value) {
                console.log(
                  `⚠️ Field "${field.label}" has invalid option structure - will be fixed`
                );
              }
            }
          }
        }
      }
    }

    return { isValid: true };
  }

  private enhanceFormConfig(config: any, originalPrompt: string): any {
    // ✅ Enhanced default settings with required configurations
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
          enhancedField.helpText =
            field.helpText || this.generateHelpText(field.type, field.label);

          // Add default options for choice fields if missing
          const choiceFields = ['dropdown', 'singleChoice', 'multipleChoice'];
          if (choiceFields.includes(field.type)) {
            if (
              !field.options ||
              !Array.isArray(field.options) ||
              field.options.length === 0
            ) {
              enhancedField.options = this.generateDefaultOptions(
                field.label,
                field.type
              );
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
        return 'Enter a valid number';
      case 'dropdown':
      case 'singleChoice':
        return 'Choose one option from the list';
      case 'multipleChoice':
        return 'Select all options that apply';
      default:
        return 'Please complete this field';
    }
  }

  private generateDefaultOptions(
    label: string,
    fieldType: string
  ): Array<{ label: string; value: string }> {
    const lowerLabel = label.toLowerCase();

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

  // Public method to generate logos for existing forms
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

  // Method to validate form configuration
  validateFormConfigPublic(config: any): { isValid: boolean; error?: string } {
    return this.validateFormConfig(config);
  }

  // Method to enhance existing form configurations
  enhanceFormConfigPublic(config: any, prompt: string = ''): any {
    return this.enhanceFormConfig(config, prompt);
  }

  // Method to get form generation statistics
  getGenerationStats(): {
    supportedFieldTypes: number;
    logoCategories: number;
    defaultOptions: string[];
  } {
    return {
      supportedFieldTypes: this.getAvailableFieldTypes().length,
      logoCategories: 8, // contact, registration, application, feedback, booking, ecommerce, event, business
      defaultOptions: [
        'Multiple submissions enabled by default',
        'Logo generation included when appropriate',
        'Smart field validation and cleanup',
        'Context-aware help text generation',
        'Professional 900x265 logo sizing',
        'MongoDB-compatible field structures',
      ],
    };
  }

  // Method to validate environment setup
  validateEnvironment(): { isValid: boolean; missing: string[] } {
    const missing = [];

    if (!process.env.GEMINI_API_KEY) {
      missing.push('GEMINI_API_KEY');
    }

    return {
      isValid: missing.length === 0,
      missing,
    };
  }

  // Method to get available field types
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
}

export default AIFormGeneratorService;
