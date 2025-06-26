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
      model: 'gemini-2.0-flash-lite',
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 8192,
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

      // Detect intended form type from user prompt BEFORE generation
      const intendedFormType = this.detectIntendedFormType(prompt.trim());

      // Generate form config with explicit form type guidance
      const systemPrompt = this.buildSystemPrompt(
        prompt.trim(),
        intendedFormType
      );
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

      // Clean and enhance form config with EXPLICIT form type
      let formConfig = parseResult.data;
      formConfig = this.cleanFormConfigForMongoDB(formConfig, intendedFormType);
      formConfig = this.addUniqueIds(formConfig);
      formConfig = this.enforceFormTypeStructure(
        formConfig,
        intendedFormType,
        prompt
      );
      formConfig.title = await this.generateUniqueTitle(
        formConfig.title,
        userId
      );

      const generationTime = Date.now() - startTime;

      return {
        success: true,
        data: formConfig,
        generationTime,
      };
    } catch (error: any) {
      const generationTime = Date.now() - startTime;
      console.error('❌ AI generation failed:', error);

      return {
        success: false,
        error: error.message || 'AI generation failed',
        generationTime,
      };
    }
  }

  private async generateUniqueTitle(
    baseTitle: string,
    userId: string
  ): Promise<string> {
    try {
      // First, check if the base title is available
      const existingForm = await this.checkTitleExists(baseTitle, userId);
      if (!existingForm) {
        return baseTitle;
      }

      // If title exists, generate variations
      let uniqueTitle = baseTitle;
      let counter = 1;
      let maxAttempts = 50;

      while (counter <= maxAttempts) {
        // Strategy 1: Add incremental number (1, 2, 3...)
        if (counter <= 20) {
          uniqueTitle = `${baseTitle} ${counter}`;
        }
        // Strategy 2: Add timestamp-based suffix
        else if (counter <= 30) {
          const timestamp = new Date()
            .toISOString()
            .slice(5, 16)
            .replace(/[-:]/g, '');
          uniqueTitle = `${baseTitle} ${timestamp}`;
        }
        // Strategy 3: Add descriptive suffix
        else if (counter <= 40) {
          const suffixes = ['Copy', 'Version', 'Draft', 'New'];
          const suffix = suffixes[(counter - 31) % suffixes.length];
          uniqueTitle = `${baseTitle} ${suffix} ${counter - 30}`;
        }
        // Strategy 4: Add random suffix
        else {
          const randomSuffix = Math.random().toString(36).substring(2, 6);
          uniqueTitle = `${baseTitle} ${randomSuffix}`;
        }

        // Check if this variation is available
        const exists = await this.checkTitleExists(uniqueTitle, userId);
        if (!exists) {
          return uniqueTitle;
        }

        counter++;
      }

      // Fallback: Add UUID if all attempts failed
      const uuid = require('crypto').randomUUID().substring(0, 8);
      uniqueTitle = `${baseTitle} ${uuid}`;

      return uniqueTitle;
    } catch (error) {
      console.error('❌ Error generating unique title:', error);
      // Fallback to timestamp
      const timestamp = Date.now();
      return `${baseTitle} ${timestamp}`;
    }
  }

  private async checkTitleExists(
    title: string,
    userId: string
  ): Promise<boolean> {
    try {
      // This would connect to your database to check
      // You'll need to import your Form model here
      const Form = require('../models/Form'); // Adjust path as needed

      const existingForm = await Form.findOne({
        title: title,
        userId: userId,
      });

      return !!existingForm;
    } catch (error) {
      console.error('❌ Error checking title existence:', error);
      return false; // Assume it doesn't exist if check fails
    }
  }

  private detectIntendedFormType(
    prompt: string
  ): 'quiz' | 'survey' | 'feedback' | 'general' {
    const lowerPrompt = prompt.toLowerCase();

    // FEEDBACK DETECTION
    const feedbackKeywords = [
      'feedback',
      'review',
      'comment',
      'experience',
      'opinion',
      'tell us what you think',
      'share your thoughts',
      'how was your',
      'improvement',
      'suggestion',
      'testimonial',
      'rating experience',
      'customer feedback',
      'user experience',
      'service review',
      'product review',
      'how did we do',
      'rate our service',
      'what did you think',
      'any suggestions',
      'how can we improve',
      'feedback form',
      'review form',
      'experience form',
      'thoughts on',
      'opinion about',
      'what could we',
      'better experience',
      'customer experience',
      'user feedback',
    ];

    // Check for feedback keywords first (higher priority)
    for (const keyword of feedbackKeywords) {
      if (lowerPrompt.includes(keyword)) {
        return 'feedback';
      }
    }

    // QUIZ DETECTION
    const quizKeywords = [
      'quiz',
      'test',
      'assessment',
      'exam',
      'evaluation',
      'question',
      'correct answer',
      'multiple choice questions',
      'true or false',
      'choose the correct',
      'select the right',
      'knowledge test',
      'academic',
      'learning',
      'educational',
      'course quiz',
    ];

    for (const keyword of quizKeywords) {
      if (lowerPrompt.includes(keyword)) {
        return 'quiz';
      }
    }

    // SURVEY DETECTION
    const surveyKeywords = [
      'survey',
      'poll',
      'research',
      'study',
      'questionnaire',
      'data collection',
      'market research',
      'satisfaction survey',
      'demographic',
      'statistical',
      'analysis',
      'respondent',
      'participant',
      'census',
      'opinion poll',
      'customer survey',
    ];

    for (const keyword of surveyKeywords) {
      if (lowerPrompt.includes(keyword)) {
        return 'survey';
      }
    }

    return 'general';
  }

  // Enforce form structure based on intended type
  private enforceFormTypeStructure(
    config: any,
    intendedType: string,
    originalPrompt: string
  ): any {
    switch (intendedType) {
      case 'quiz':
        return this.enforceQuizStructure(config, originalPrompt);
      case 'feedback':
        return this.enforceFeedbackStructure(config, originalPrompt);
      case 'survey':
        return this.enforceSurveyStructure(config, originalPrompt);
      default:
        return config;
    }
  }

  // QUIZ STRUCTURE ENFORCER
  private enforceQuizStructure(config: any, prompt: string): any {
    if (!config.pages || !Array.isArray(config.pages)) {
      config.pages = [{ id: uuidv4(), fields: [] }];
    }

    let singleChoiceCount = 0;
    let totalQuestions = 0;

    // Count existing single choice questions
    config.pages.forEach((page: any) => {
      if (page.fields) {
        page.fields.forEach((field: any) => {
          if (field.type === 'singleChoice' || field.type === 'dropdown') {
            singleChoiceCount++;
            totalQuestions++;
          } else if (field.type === 'multipleChoice') {
            totalQuestions++;
          }
        });
      }
    });

    // Ensure minimum 5 single choice questions for quiz classification
    if (singleChoiceCount < 5) {
      const questionsToAdd = 5 - singleChoiceCount;

      const quizQuestions = this.generateQuizQuestions(prompt, questionsToAdd);

      // Add to first page
      if (!config.pages[0].fields) {
        config.pages[0].fields = [];
      }

      config.pages[0].fields.push(...quizQuestions);
    }

    // Ensure all choice fields have correct answers
    config.pages.forEach((page: any) => {
      if (page.fields) {
        page.fields.forEach((field: any) => {
          if (
            ['singleChoice', 'multipleChoice', 'dropdown'].includes(field.type)
          ) {
            if (
              !field.correctAnswer &&
              field.options &&
              field.options.length > 0
            ) {
              // Set second option as correct by default
              field.options[1] = field.options[1] || {
                label: 'Correct Option',
                value: 'correct',
              };
              field.options[1].isCorrect = true;
              field.correctAnswer = field.options[1].value;
            }
          }
        });
      }
    });

    // Update title to reflect quiz nature if not already
    if (
      !config.title.toLowerCase().includes('quiz') &&
      !config.title.toLowerCase().includes('test') &&
      !config.title.toLowerCase().includes('assessment')
    ) {
      config.title = config.title + ' Quiz';
    }

    return config;
  }

  private enforceFeedbackStructure(config: any, prompt: string): any {
    if (!config.pages || !Array.isArray(config.pages)) {
      config.pages = [{ id: uuidv4(), fields: [] }];
    }

    let feedbackFieldCount = 0;
    let textFieldCount = 0;
    let experienceFieldCount = 0;

    // Count existing feedback-related fields
    config.pages.forEach((page: any) => {
      if (page.fields) {
        page.fields.forEach((field: any) => {
          const fieldLabel = field.label?.toLowerCase() || '';

          if (field.type === 'longText' || field.type === 'paragraph') {
            textFieldCount++;

            // feedback pattern detection
            if (
              /feedback|comment|improve|experience.*with|how.*was.*your|tell.*us.*about|share.*your.*thoughts|what.*did.*you.*think|any.*suggestions|what.*could.*we|how.*can.*we.*improve|describe.*your.*experience|thoughts.*on|opinion.*about|better.*experience/.test(
                fieldLabel
              )
            ) {
              feedbackFieldCount++;
            }

            // Experience-specific patterns
            if (
              /experience|how.*was|describe.*your|tell.*us.*about|thoughts.*on|what.*did.*you.*think/.test(
                fieldLabel
              )
            ) {
              experienceFieldCount++;
            }
          }
        });
      }
    });

    // Ensure sufficient feedback fields (at least 3 feedback-specific fields)
    if (feedbackFieldCount < 3 || textFieldCount < 4) {
      const feedbackFields = this.generateEnhancedFeedbackFields(prompt);

      if (!config.pages[0].fields) {
        config.pages[0].fields = [];
      }

      // Add new feedback fields
      config.pages[0].fields.push(...feedbackFields);
    }

    // Remove or convert quiz-like fields and rating scales that might confuse detection
    config.pages.forEach((page: any) => {
      if (page.fields) {
        page.fields = page.fields.map((field: any) => {
          // Remove correctAnswer from choice fields in feedback forms
          if (
            ['singleChoice', 'multipleChoice', 'dropdown'].includes(field.type)
          ) {
            delete field.correctAnswer;
            if (field.options) {
              field.options.forEach((option: any) => {
                delete option.isCorrect;
              });
            }
          }

          // Convert rating fields to text fields to avoid survey classification
          if (field.type === 'rating' || field.type === 'scale') {
            field.type = 'longText';
            field.rows = 3;
            if (
              field.label &&
              !field.label.toLowerCase().includes('feedback')
            ) {
              field.label = field.label + ' - Please share your feedback';
            }
            delete field.min;
            delete field.max;
          }

          return field;
        });
      }
    });

    // Update title to reflect feedback nature if not already
    if (
      !config.title.toLowerCase().includes('feedback') &&
      !config.title.toLowerCase().includes('review') &&
      !config.title.toLowerCase().includes('experience')
    ) {
      config.title = config.title + ' Feedback';
    }

    // Update description to emphasize feedback collection
    if (
      !config.description ||
      !config.description.toLowerCase().includes('feedback')
    ) {
      config.description = config.description
        ? config.description +
          ' Please share your valuable feedback and experience with us.'
        : 'Please share your valuable feedback and experience with us.';
    }

    return config;
  }

  private generateEnhancedFeedbackFields(prompt: string): any[] {
    return [
      {
        id: uuidv4(),
        type: 'longText',
        label: 'How was your overall experience?',
        labelAlignment: 'LEFT',
        required: true,
        helpText: 'Please describe your overall experience in detail',
        rows: 4,
      },
      {
        id: uuidv4(),
        type: 'paragraph',
        label: 'What did you think about our service?',
        labelAlignment: 'LEFT',
        required: true,
        helpText: 'Share your thoughts and opinions about our service',
        rows: 4,
      },
      {
        id: uuidv4(),
        type: 'longText',
        label: 'What could we improve?',
        labelAlignment: 'LEFT',
        required: false,
        helpText: 'Please share any suggestions for improvement',
        rows: 4,
      },
      {
        id: uuidv4(),
        type: 'paragraph',
        label: 'Any additional feedback or comments?',
        labelAlignment: 'LEFT',
        required: false,
        helpText: 'Feel free to share any other thoughts or feedback',
        rows: 3,
      },
      {
        id: uuidv4(),
        type: 'longText',
        label: 'How can we better serve you in the future?',
        labelAlignment: 'LEFT',
        required: false,
        helpText: 'Tell us about your expectations and how we can meet them',
        rows: 3,
      },
    ];
  }

  // SURVEY STRUCTURE ENFORCER
  private enforceSurveyStructure(config: any, prompt: string): any {
    if (!config.pages || !Array.isArray(config.pages)) {
      config.pages = [{ id: uuidv4(), fields: [] }];
    }

    let ratingFieldCount = 0;
    let choiceFieldCount = 0;

    // Count existing survey-related fields (including rating-like choice fields)
    config.pages.forEach((page: any) => {
      if (page.fields) {
        page.fields.forEach((field: any) => {
          const fieldLabel = field.label?.toLowerCase() || '';

          // Count rating-like patterns in choice fields or actual rating fields
          if (
            field.type === 'rating' ||
            field.type === 'scale' ||
            /rate|rating|satisfaction|quality|likely|recommend|score|scale|strongly.*agree|very.*satisfied/.test(
              fieldLabel
            )
          ) {
            ratingFieldCount++;
          }

          // Count choice fields that could be rating-like
          if (
            ['singleChoice', 'multipleChoice', 'dropdown'].includes(field.type)
          ) {
            choiceFieldCount++;
            // If it has rating-like labels, count as rating field
            if (
              field.options &&
              field.options.some((opt: any) =>
                /satisfied|excellent|poor|star|rate|quality|likely/.test(
                  opt.label?.toLowerCase() || ''
                )
              )
            ) {
              ratingFieldCount++;
            }
          }
        });
      }
    });

    // Ensure sufficient rating/evaluation fields for survey
    if (ratingFieldCount < 3) {
      const surveyFields = this.generateSurveyFields(prompt);

      if (!config.pages[0].fields) {
        config.pages[0].fields = [];
      }

      config.pages[0].fields.push(...surveyFields);
    }

    // Remove correctAnswer from choice fields in surveys (no right/wrong answers)
    config.pages.forEach((page: any) => {
      if (page.fields) {
        page.fields = page.fields.map((field: any) => {
          if (
            ['singleChoice', 'multipleChoice', 'dropdown'].includes(field.type)
          ) {
            delete field.correctAnswer;
            if (field.options) {
              field.options.forEach((option: any) => {
                delete option.isCorrect;
              });
            }
          }
          return field;
        });
      }
    });

    return config;
  }

  // Generate quiz questions
  private generateQuizQuestions(prompt: string, count: number): any[] {
    const questions = [];

    for (let i = 0; i < count; i++) {
      questions.push({
        id: uuidv4(),
        type: 'singleChoice',
        label: `Question ${i + 1}: Choose the correct answer`,
        labelAlignment: 'LEFT',
        required: true,
        helpText: 'Select the most appropriate answer',
        options: [
          { label: 'Option A', value: 'a' },
          { label: 'Option B (Correct)', value: 'b', isCorrect: true },
          { label: 'Option C', value: 'c' },
          { label: 'Option D', value: 'd' },
        ],
        correctAnswer: 'b',
      });
    }

    return questions;
  }

  // Generate feedback fields
  private generateFeedbackFields(prompt: string): any[] {
    return [
      {
        id: uuidv4(),
        type: 'longText',
        label: 'How was your overall experience?',
        labelAlignment: 'LEFT',
        required: true,
        helpText: 'Please describe your experience in detail',
        rows: 4,
      },
      {
        id: uuidv4(),
        type: 'paragraph',
        label: 'What could we improve?',
        labelAlignment: 'LEFT',
        required: false,
        helpText: 'Share any suggestions for improvement',
        rows: 4,
      },
      {
        id: uuidv4(),
        type: 'longText',
        label: 'Any additional feedback or comments?',
        labelAlignment: 'LEFT',
        required: false,
        helpText: 'Feel free to share any other thoughts',
        rows: 3,
      },
    ];
  }

  // Generate survey fields
  private generateSurveyFields(prompt: string): any[] {
    return [
      {
        id: uuidv4(),
        type: 'singleChoice', // Use singleChoice instead of rating
        label: 'How would you rate your satisfaction?',
        labelAlignment: 'LEFT',
        required: true,
        helpText: 'Select your satisfaction level',
        options: [
          { label: '⭐ Very Dissatisfied', value: '1' },
          { label: '⭐⭐ Dissatisfied', value: '2' },
          { label: '⭐⭐⭐ Neutral', value: '3' },
          { label: '⭐⭐⭐⭐ Satisfied', value: '4' },
          { label: '⭐⭐⭐⭐⭐ Very Satisfied', value: '5' },
        ],
      },
      {
        id: uuidv4(),
        type: 'singleChoice',
        label: 'How likely are you to recommend us?',
        labelAlignment: 'LEFT',
        required: true,
        helpText: 'Select the option that best describes your likelihood',
        options: [
          { label: 'Very Likely', value: 'very_likely' },
          { label: 'Likely', value: 'likely' },
          { label: 'Neutral', value: 'neutral' },
          { label: 'Unlikely', value: 'unlikely' },
          { label: 'Very Unlikely', value: 'very_unlikely' },
        ],
      },
      {
        id: uuidv4(),
        type: 'singleChoice', // Use singleChoice instead of rating
        label: 'Rate the quality of our service',
        labelAlignment: 'LEFT',
        required: true,
        helpText: 'Choose a rating from 1 (poor) to 10 (excellent)',
        options: [
          { label: '1 - Very Poor', value: '1' },
          { label: '2 - Poor', value: '2' },
          { label: '3 - Below Average', value: '3' },
          { label: '4 - Fair', value: '4' },
          { label: '5 - Average', value: '5' },
          { label: '6 - Above Average', value: '6' },
          { label: '7 - Good', value: '7' },
          { label: '8 - Very Good', value: '8' },
          { label: '9 - Excellent', value: '9' },
          { label: '10 - Outstanding', value: '10' },
        ],
      },
    ];
  }

  private hasQuizFields(config: any): boolean {
    if (!config.pages) return false;

    for (const page of config.pages) {
      if (page.fields) {
        for (const field of page.fields) {
          if (field.correctAnswer) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Updated system prompt with explicit form type guidance
  private buildSystemPrompt(
    userPrompt: string,
    intendedFormType?: string
  ): string {
    const typeSpecificInstructions = intendedFormType
      ? this.getTypeSpecificInstructions(intendedFormType)
      : '';

    const formTypeHeader = intendedFormType
      ? `CRITICAL: This MUST be a ${intendedFormType.toUpperCase()} form type. Follow the specific requirements below:\n\n${typeSpecificInstructions}\n\n`
      : '';

    return `
You are an expert form builder AI assistant. Create a professional form configuration based on the user's requirements.

${formTypeHeader}CRITICAL INSTRUCTIONS:
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
- "signature": Digital signature capture with customizable instructions
- "fillBlank": Fill-in-the-blank text with customizable template
- "productList": Product catalog with pricing and quantity selection

IMPORTANT: For rating/satisfaction questions, use "singleChoice" with star/number options like:
{
  "type": "singleChoice",
  "label": "How satisfied are you?",
  "options": [
    {"label": "⭐", "value": "1"},
    {"label": "⭐⭐", "value": "2"},
    {"label": "⭐⭐⭐", "value": "3"},
    {"label": "⭐⭐⭐⭐", "value": "4"},
    {"label": "⭐⭐⭐⭐⭐", "value": "5"}
  ]
}

ENHANCED FIELD CONFIGURATIONS:

SIGNATURE Field:
{
  "id": "auto-generated",
  "type": "signature",
  "label": "Digital Signature",
  "labelAlignment": "LEFT",
  "required": true,
  "helpText": "Please sign below to confirm your agreement",
  "signatureConfig": {
    "instructionText": "Please provide your digital signature below",
    "clearButtonText": "Clear Signature",
    "signHereText": "Sign here",
    "width": 400,
    "height": 150,
    "backgroundColor": "#ffffff",
    "penColor": "#000000"
  }
}

FILL_BLANK Field:
{
  "id": "auto-generated",
  "type": "fillBlank",
  "label": "Agreement Statement",
  "labelAlignment": "LEFT",
  "required": true,
  "helpText": "Complete the statement by filling in the blank",
  "fillBlankTemplate": {
    "beforeText": "I, ",
    "blankPlaceholder": "your full name",
    "afterText": ", hereby agree to the terms and conditions stated above."
  }
}

PRODUCT_LIST Field:
{
  "id": "auto-generated",
  "type": "productList",
  "label": "Select Products",
  "labelAlignment": "LEFT",
  "required": false,
  "helpText": "Choose your products and specify quantities",
  "productListConfig": {
    "allowQuantityEdit": true,
    "showTotalPrice": true,
    "currency": "USD",
    "currencySymbol": "$",
    "products": [
      {
        "id": "prod1",
        "name": "Basic Package",
        "description": "Essential features for getting started",
        "price": 29.99,
        "quantity": 1,
        "category": "packages"
      },
      {
        "id": "prod2",
        "name": "Premium Package",
        "description": "Advanced features with priority support",
        "price": 79.99,
        "quantity": 1,
        "category": "packages"
      }
    ]
  }
}

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
            {"label": "Option 2", "value": "option2", "isCorrect": true},
            {"label": "Option 3", "value": "option3"}
          ],
          "correctAnswer": "option2"
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

CRITICAL QUIZ/TEST FORM RULES:
- Detect quiz context from these keywords: quiz, test, assessment, exam, evaluation, question, correct, answer, choose, select
- For ANY form containing these keywords in title, description, or field labels, ALWAYS add correctAnswer
- For choice fields (dropdown, singleChoice, multipleChoice) in quiz forms:
  1. Mark ONE option as "isCorrect": true
  2. Set "correctAnswer" field to match the correct option's value
  3. Make the correct answer logical and educational

Example quiz field structure:
{
  "type": "singleChoice",
  "label": "What is the capital of France?",
  "options": [
    {"label": "London", "value": "london"},
    {"label": "Paris", "value": "paris", "isCorrect": true},
    {"label": "Berlin", "value": "berlin"}
  ],
  "correctAnswer": "paris"
}

SMART QUIZ DETECTION:
- If user prompt contains: "quiz", "test", "assessment", "exam", "evaluation"
- If any field label contains: "correct", "answer", "choose", "select", "what is", "which"
- If form is educational: ALWAYS add correctAnswer to choice fields

IMPORTANT RULES:
- "heading" fields should NOT have "required", "helpText", or "correctAnswer" properties
- All other field types should have "required" and "helpText" properties
- Choice fields (dropdown, singleChoice, multipleChoice) MUST include "options" array
- Each option must have both "label" and "value" properties
- For quiz/test forms, mark correct options with "isCorrect": true
- For quiz/test forms, set "correctAnswer" to the value of the correct option
- Set showLogo to true and allowMultipleSubmissions/allowMultipleEmailSubmissions to true by default
- Generate realistic, contextual field options
- For signature fields, customize instructionText based on context
- For fillBlank fields, create meaningful templates that match the form purpose
- For productList fields, generate relevant products with realistic pricing

USER REQUEST: "${userPrompt}"

Generate the form configuration now:`;
  }

  private getTypeSpecificInstructions(formType: string): string {
    switch (formType) {
      case 'quiz':
        return `
QUIZ FORM REQUIREMENTS:
- MUST include at least 5 single choice questions (singleChoice or dropdown type)
- EVERY choice field MUST have "correctAnswer" property set
- EVERY choice field MUST have at least one option marked with "isCorrect": true
- Questions should test knowledge, understanding, or learning
- Use clear, educational question formats like "What is...", "Which of the following...", "Choose the correct..."
- Include explanatory help text for complex questions
- Title should include words like "Quiz", "Test", "Assessment", or "Evaluation"

Example quiz field:
{
  "type": "singleChoice",
  "label": "What is the capital of France?",
  "options": [
    {"label": "London", "value": "london"},
    {"label": "Paris", "value": "paris", "isCorrect": true},
    {"label": "Berlin", "value": "berlin"}
  ],
  "correctAnswer": "paris",
  "required": true,
  "helpText": "Choose the correct capital city"
}`;

      case 'feedback':
        return `
💬 FEEDBACK FORM REQUIREMENTS - CRITICAL:
- MUST include at least 4-5 text fields (longText, paragraph types) 
- MUST focus on collecting opinions, experiences, and suggestions
- MUST use feedback-specific question patterns like:
  * "How was your overall experience?"
  * "What did you think about our service?"
  * "What could we improve?"
  * "Any additional feedback or comments?"
  * "How can we better serve you?"
  * "Share your thoughts about..."
  * "Tell us about your experience with..."
- NO correctAnswer properties on any fields
- NO rating or scale fields (use longText instead)
- NO single choice fields with rating options
- Use longText and paragraph field types exclusively for main questions
- Title should include words like "Feedback", "Review", "Experience", "Tell us"
- Description should emphasize feedback collection and experience sharing

Example feedback field structure:
{
  "type": "longText",
  "label": "How was your overall experience with our service?",
  "required": true,
  "helpText": "Please describe your experience in detail",
  "rows": 4
}

AVOID these patterns for feedback forms:
- Rating scales or numerical ratings
- Multiple choice questions with satisfaction levels
- Any fields that look like survey research questions
- Fields with correctAnswer properties`;

      case 'survey':
        return `
📊 SURVEY FORM REQUIREMENTS:
- MUST include at least 3 rating/satisfaction questions using singleChoice with star/number options
- Include demographic or preference questions (singleChoice, multipleChoice)
- Focus on data collection, research, and statistical analysis
- NO correctAnswer properties on any fields
- Use singleChoice fields with rating scales, satisfaction measures, likelihood questions
- Include both quantitative (rating scales) and qualitative (text) questions
- Title should include words like "Survey", "Research", "Study", "Poll"

Example survey rating field:
{
  "type": "singleChoice",
  "label": "How satisfied are you with our service?",
  "options": [
    {"label": "⭐", "value": "1"},
    {"label": "⭐⭐", "value": "2"},
    {"label": "⭐⭐⭐", "value": "3"},
    {"label": "⭐⭐⭐⭐", "value": "4"},
    {"label": "⭐⭐⭐⭐⭐", "value": "5"}
  ]
}`;

      default:
        return `
📝 GENERAL FORM REQUIREMENTS:
- Include a mix of relevant field types based on the prompt
- Focus on data collection and user input
- Use appropriate field types for the specific use case
- No specific structural requirements
`;
    }
  }

  private cleanFormConfigForMongoDB(config: any, intendedType?: string): any {
    // Detect if this is a quiz form
    const isQuizForm = intendedType === 'quiz' || this.detectQuizForm(config);

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

          // Only add properties that exist for non-heading fields
          if (field.type !== 'heading') {
            cleanField.required = Boolean(field.required);
            cleanField.helpText = field.helpText || '';

            // Handle signature field configuration
            if (field.type === 'signature') {
              cleanField.signatureConfig = {
                instructionText:
                  field.signatureConfig?.instructionText ||
                  'Please provide your digital signature below',
                clearButtonText:
                  field.signatureConfig?.clearButtonText || 'Clear Signature',
                signHereText:
                  field.signatureConfig?.signHereText || 'Sign here',
                width: Number(field.signatureConfig?.width) || 400,
                height: Number(field.signatureConfig?.height) || 150,
                backgroundColor:
                  field.signatureConfig?.backgroundColor || '#ffffff',
                penColor: field.signatureConfig?.penColor || '#000000',
                ...field.signatureConfig,
              };
            }

            // Handle fillBlank field configuration
            if (field.type === 'fillBlank') {
              cleanField.fillBlankTemplate = {
                beforeText:
                  field.fillBlankTemplate?.beforeText || 'I agree to the',
                blankPlaceholder:
                  field.fillBlankTemplate?.blankPlaceholder || 'terms',
                afterText:
                  field.fillBlankTemplate?.afterText || 'and conditions.',
                ...field.fillBlankTemplate,
              };
            }

            // Handle productList field configuration
            if (field.type === 'productList') {
              const products = field.productListConfig?.products || [];
              cleanField.productListConfig = {
                allowQuantityEdit: Boolean(
                  field.productListConfig?.allowQuantityEdit !== false
                ),
                showTotalPrice: Boolean(
                  field.productListConfig?.showTotalPrice !== false
                ),
                currency: field.productListConfig?.currency || 'USD',
                currencySymbol: field.productListConfig?.currencySymbol || '$',
                products: products.map((product: any) => ({
                  id: product.id || uuidv4(),
                  name: String(product.name || 'Product'),
                  description: String(product.description || ''),
                  price: Number(product.price) || 0,
                  quantity: Number(product.quantity) || 1,
                  category: String(product.category || 'general'),
                  ...product,
                })),
                ...field.productListConfig,
              };

              // Ensure at least one product exists
              if (cleanField.productListConfig.products.length === 0) {
                cleanField.productListConfig.products =
                  this.generateDefaultProducts(field.label);
              }
            }

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
                    isCorrect: Boolean(option.isCorrect), // Preserve isCorrect flag
                  }))
                  .filter((option: any) => option.label && option.value);

                // Handle correctAnswer properly based on intended type
                if (field.correctAnswer) {
                  cleanField.correctAnswer = String(field.correctAnswer);
                } else {
                  // Find the option marked as correct
                  const correctOption = cleanField.options.find(
                    (opt: any) => opt.isCorrect
                  );
                  if (correctOption) {
                    cleanField.correctAnswer = correctOption.value;
                  } else if (isQuizForm || intendedType === 'quiz') {
                    // For quiz forms, force a correct answer
                    if (cleanField.options.length > 1) {
                      cleanField.options[1].isCorrect = true; // Make second option correct
                      cleanField.correctAnswer = cleanField.options[1].value;
                    }
                  }
                }

                // Remove correctAnswer for feedback/survey forms
                if (intendedType === 'feedback' || intendedType === 'survey') {
                  delete cleanField.correctAnswer;
                  cleanField.options.forEach((option: any) => {
                    delete option.isCorrect;
                  });
                }

                // If no valid options, create defaults with correct answer
                if (cleanField.options.length === 0) {
                  const defaultOptions =
                    this.generateDefaultOptionsWithCorrectAnswer(
                      field.label,
                      field.type,
                      isQuizForm
                    );
                  cleanField.options = defaultOptions.options;
                  if (isQuizForm) {
                    cleanField.correctAnswer = defaultOptions.correctAnswer;
                  }
                }
              } else {
                // Generate default options if missing
                const defaultOptions =
                  this.generateDefaultOptionsWithCorrectAnswer(
                    field.label,
                    field.type,
                    isQuizForm
                  );
                cleanField.options = defaultOptions.options;
                if (
                  isQuizForm &&
                  intendedType !== 'feedback' &&
                  intendedType !== 'survey'
                ) {
                  cleanField.correctAnswer = defaultOptions.correctAnswer;
                }
              }
            }

            // Handle other field-specific properties...
            if (field.type === 'number') {
              if (field.min !== undefined) cleanField.min = Number(field.min);
              if (field.max !== undefined) cleanField.max = Number(field.max);
              if (field.step !== undefined)
                cleanField.step = Number(field.step);
            }

            if (field.type === 'rating' || field.type === 'scale') {
              if (field.min !== undefined) cleanField.min = Number(field.min);
              if (field.max !== undefined) cleanField.max = Number(field.max);
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

          return cleanField;
        }),
      }));
    }

    return config;
  }

  private detectQuizForm(config: any): boolean {
    const formTitle = config.title?.toLowerCase() || '';
    const formDescription = config.description?.toLowerCase() || '';

    // Check title and description for quiz keywords
    const quizKeywords = [
      'quiz',
      'test',
      'assessment',
      'exam',
      'evaluation',
      'question',
    ];
    const hasQuizKeywords = quizKeywords.some(
      keyword =>
        formTitle.includes(keyword) || formDescription.includes(keyword)
    );

    if (hasQuizKeywords) {
      return true;
    }

    // Check field labels for quiz patterns
    if (config.pages && Array.isArray(config.pages)) {
      for (const page of config.pages) {
        if (page.fields && Array.isArray(page.fields)) {
          for (const field of page.fields) {
            const fieldLabel = field.label?.toLowerCase() || '';
            const questionPatterns = [
              'what is',
              'which',
              'choose',
              'select',
              'correct',
              'answer',
              'true or false',
              'pick the',
              'identify',
            ];

            if (
              questionPatterns.some(pattern => fieldLabel.includes(pattern))
            ) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  // Generate default products for productList fields
  private generateDefaultProducts(label: string): Array<any> {
    const lowerLabel = label.toLowerCase();

    if (lowerLabel.includes('package') || lowerLabel.includes('plan')) {
      return [
        {
          id: uuidv4(),
          name: 'Basic Package',
          description: 'Essential features to get started',
          price: 29.99,
          quantity: 1,
          category: 'packages',
        },
        {
          id: uuidv4(),
          name: 'Premium Package',
          description: 'Advanced features with priority support',
          price: 79.99,
          quantity: 1,
          category: 'packages',
        },
      ];
    }

    if (lowerLabel.includes('service')) {
      return [
        {
          id: uuidv4(),
          name: 'Consultation Service',
          description: '1-hour professional consultation',
          price: 99.0,
          quantity: 1,
          category: 'services',
        },
        {
          id: uuidv4(),
          name: 'Full Service Package',
          description: 'Complete service implementation',
          price: 299.0,
          quantity: 1,
          category: 'services',
        },
      ];
    }

    if (lowerLabel.includes('product') || lowerLabel.includes('item')) {
      return [
        {
          id: uuidv4(),
          name: 'Product A',
          description: 'High-quality standard product',
          price: 19.99,
          quantity: 1,
          category: 'products',
        },
        {
          id: uuidv4(),
          name: 'Product B',
          description: 'Premium quality with extra features',
          price: 39.99,
          quantity: 1,
          category: 'products',
        },
      ];
    }

    if (lowerLabel.includes('course') || lowerLabel.includes('training')) {
      return [
        {
          id: uuidv4(),
          name: 'Beginner Course',
          description: 'Foundation level training course',
          price: 149.0,
          quantity: 1,
          category: 'courses',
        },
        {
          id: uuidv4(),
          name: 'Advanced Course',
          description: 'Expert level comprehensive training',
          price: 399.0,
          quantity: 1,
          category: 'courses',
        },
      ];
    }

    // Default generic products
    return [
      {
        id: uuidv4(),
        name: 'Standard Option',
        description: 'Our most popular choice',
        price: 49.99,
        quantity: 1,
        category: 'general',
      },
      {
        id: uuidv4(),
        name: 'Premium Option',
        description: 'Enhanced features and benefits',
        price: 99.99,
        quantity: 1,
        category: 'general',
      },
    ];
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
      // logo selection logic for professional web app forms
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

  // logo selection for professional web apps with 900x265 images
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

    //  Professional 900x265 logos for different form categories
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
            url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
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
          'signature', // Added for contract/purchase agreements
          'productlist', // Added for product selection
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
          'agreement', // Added for fillBlank/signature contexts
          'contract',
          'legal',
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

    //  Find the most appropriate category
    let bestMatch = { category: '', score: 0 };

    for (const [category, data] of Object.entries(professionalLogos)) {
      const matchingKeywords = data.keywords.filter(keyword =>
        content.includes(keyword)
      );

      if (matchingKeywords.length > bestMatch.score) {
        bestMatch = { category, score: matchingKeywords.length };
      }
    }

    //  Only return logo if we have a strong match (at least 1 keyword match)
    if (bestMatch.score > 0 && bestMatch.category) {
      const categoryData =
        professionalLogos[bestMatch.category as keyof typeof professionalLogos];
      const selectedLogo =
        categoryData.logos[
          Math.floor(Math.random() * categoryData.logos.length)
        ];

      return {
        isAppropriate: true,
        logoUrl: selectedLogo.url,
        publicId: selectedLogo.publicId,
        category: bestMatch.category,
      };
    }

    // Only use generic business logo for clearly business-related forms
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

      return {
        isAppropriate: true,
        logoUrl: businessLogo.url,
        publicId: businessLogo.publicId,
        category: 'business-fallback',
      };
    }

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

        // All field types
        const validTypes = [
          'shortText',
          'longText',
          'paragraph',
          'dropdown',
          'singleChoice',
          'multipleChoice',
          'number',
          'rating',
          'scale',
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
      }
    }

    return { isValid: true };
  }

  private enhanceFormConfig(config: any, originalPrompt: string): any {
    const formTitle = config.title?.toLowerCase() || '';
    const formDescription = config.description?.toLowerCase() || '';
    const promptLower = originalPrompt.toLowerCase();

    const isQuizForm = /quiz|test|assessment|exam|evaluation|question/.test(
      formTitle + ' ' + formDescription + ' ' + promptLower
    );

    // default settings with required configurations
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
      fields: page.fields.map((field: any) => {
        const enhancedField = { ...field };

        // Add required and helpText for non-heading fields
        if (field.type !== 'heading') {
          enhancedField.required =
            field.required !== undefined ? field.required : false;
          enhancedField.helpText =
            field.helpText ||
            this.generateHelpText(field.type, field.label, originalPrompt);

          // Generate contextual configurations for new field types
          if (field.type === 'signature') {
            enhancedField.signatureConfig = {
              instructionText: this.generateSignatureInstructions(
                field.label,
                originalPrompt
              ),
              clearButtonText: 'Clear Signature',
              signHereText: 'Sign here',
              width: 400,
              height: 150,
              backgroundColor: '#ffffff',
              penColor: '#000000',
              ...field.signatureConfig,
            };
          }

          if (field.type === 'fillBlank') {
            enhancedField.fillBlankTemplate = this.generateFillBlankTemplate(
              field.label,
              originalPrompt,
              field.fillBlankTemplate
            );
          }

          if (field.type === 'productList') {
            if (
              !field.productListConfig ||
              !field.productListConfig.products ||
              field.productListConfig.products.length === 0
            ) {
              enhancedField.productListConfig = {
                allowQuantityEdit: true,
                showTotalPrice: true,
                currency: 'USD',
                currencySymbol: '$',
                products: this.generateContextualProducts(
                  field.label,
                  originalPrompt
                ),
                ...field.productListConfig,
              };
            }
          }

          // Add default options for choice fields if missing
          const choiceFields = ['dropdown', 'singleChoice', 'multipleChoice'];
          if (choiceFields.includes(field.type)) {
            if (
              !field.options ||
              !Array.isArray(field.options) ||
              field.options.length === 0
            ) {
              const defaultOptionsWithAnswer =
                this.generateDefaultOptionsWithCorrectAnswer(
                  field.label,
                  field.type
                );
              enhancedField.options = defaultOptionsWithAnswer.options;

              // Force correct answer for quiz forms
              if (isQuizForm && defaultOptionsWithAnswer.correctAnswer) {
                enhancedField.correctAnswer =
                  defaultOptionsWithAnswer.correctAnswer;
              }
            } else if (isQuizForm && !field.correctAnswer) {
              // Find or set a correct answer for existing options
              const correctOption = field.options.find(
                (opt: any) => opt.isCorrect
              );
              if (correctOption) {
                enhancedField.correctAnswer = correctOption.value;
              } else {
                // Set first option as correct if none specified
                enhancedField.options[0].isCorrect = true;
                enhancedField.correctAnswer = enhancedField.options[0].value;
              }
            }
          }
        }

        return enhancedField;
      }),
    }));

    return config;
  }

  //   Generate contextual signature instructions
  private generateSignatureInstructions(label: string, prompt: string): string {
    const lowerLabel = label.toLowerCase();
    const lowerPrompt = prompt.toLowerCase();

    if (lowerLabel.includes('agreement') || lowerPrompt.includes('agreement')) {
      return 'Please sign below to confirm your agreement to the terms and conditions';
    }

    if (
      lowerLabel.includes('authorization') ||
      lowerPrompt.includes('authorization')
    ) {
      return 'Please provide your digital signature to authorize this request';
    }

    if (lowerLabel.includes('consent') || lowerPrompt.includes('consent')) {
      return 'Please sign to provide your consent for the stated purposes';
    }

    if (lowerLabel.includes('witness') || lowerPrompt.includes('witness')) {
      return 'Please sign as a witness to validate this document';
    }

    if (lowerPrompt.includes('contract') || lowerPrompt.includes('legal')) {
      return 'Please provide your legally binding digital signature';
    }

    if (lowerPrompt.includes('purchase') || lowerPrompt.includes('order')) {
      return 'Please sign to confirm your purchase and acceptance of terms';
    }

    return 'Please provide your digital signature below';
  }

  //   Generate contextual fill blank templates
  private generateFillBlankTemplate(
    label: string,
    prompt: string,
    existing?: any
  ): any {
    if (existing && existing.beforeText && existing.afterText) {
      return existing;
    }

    const lowerLabel = label.toLowerCase();
    const lowerPrompt = prompt.toLowerCase();

    if (lowerLabel.includes('agreement') || lowerPrompt.includes('agreement')) {
      return {
        beforeText: 'I, ',
        blankPlaceholder: 'your full name',
        afterText: ', hereby agree to the terms and conditions stated above.',
      };
    }

    if (
      lowerLabel.includes('authorization') ||
      lowerPrompt.includes('authorization')
    ) {
      return {
        beforeText: 'I authorize ',
        blankPlaceholder: 'company/person name',
        afterText: ' to proceed with the requested action on my behalf.',
      };
    }

    if (
      lowerLabel.includes('declaration') ||
      lowerPrompt.includes('declaration')
    ) {
      return {
        beforeText: 'I declare that the information provided is ',
        blankPlaceholder: 'true and accurate',
        afterText: ' to the best of my knowledge.',
      };
    }

    if (lowerLabel.includes('witness') || lowerPrompt.includes('witness')) {
      return {
        beforeText: 'I, ',
        blankPlaceholder: 'witness name',
        afterText: ', hereby witness the signing of this document.',
      };
    }

    if (lowerPrompt.includes('emergency') || lowerLabel.includes('emergency')) {
      return {
        beforeText: 'In case of emergency, please contact ',
        blankPlaceholder: 'emergency contact name',
        afterText: ' at the provided phone number.',
      };
    }

    // Default template
    return {
      beforeText: 'I confirm that ',
      blankPlaceholder: 'your response',
      afterText: ' is accurate and complete.',
    };
  }

  //   Generate contextual products based on form purpose
  private generateContextualProducts(
    label: string,
    prompt: string
  ): Array<any> {
    const lowerLabel = label.toLowerCase();
    const lowerPrompt = prompt.toLowerCase();

    if (
      lowerPrompt.includes('course') ||
      lowerPrompt.includes('training') ||
      lowerPrompt.includes('education')
    ) {
      return [
        {
          id: uuidv4(),
          name: 'Beginner Course',
          description: 'Perfect for those just starting out',
          price: 99.0,
          quantity: 1,
          category: 'courses',
        },
        {
          id: uuidv4(),
          name: 'Intermediate Course',
          description: 'Build on your existing knowledge',
          price: 199.0,
          quantity: 1,
          category: 'courses',
        },
        {
          id: uuidv4(),
          name: 'Advanced Certification',
          description: 'Master-level training with certification',
          price: 399.0,
          quantity: 1,
          category: 'courses',
        },
      ];
    }

    if (
      lowerPrompt.includes('subscription') ||
      lowerPrompt.includes('membership')
    ) {
      return [
        {
          id: uuidv4(),
          name: 'Basic Membership',
          description: 'Essential features and support',
          price: 9.99,
          quantity: 1,
          category: 'subscriptions',
        },
        {
          id: uuidv4(),
          name: 'Pro Membership',
          description: 'Advanced features and priority support',
          price: 29.99,
          quantity: 1,
          category: 'subscriptions',
        },
        {
          id: uuidv4(),
          name: 'Enterprise Membership',
          description: 'Full access with dedicated support',
          price: 99.99,
          quantity: 1,
          category: 'subscriptions',
        },
      ];
    }

    if (
      lowerPrompt.includes('consultation') ||
      lowerPrompt.includes('service')
    ) {
      return [
        {
          id: uuidv4(),
          name: 'Initial Consultation',
          description: '60-minute discovery session',
          price: 150.0,
          quantity: 1,
          category: 'services',
        },
        {
          id: uuidv4(),
          name: 'Strategy Package',
          description: 'Comprehensive strategy development',
          price: 500.0,
          quantity: 1,
          category: 'services',
        },
        {
          id: uuidv4(),
          name: 'Implementation Support',
          description: 'Full implementation with ongoing support',
          price: 1500.0,
          quantity: 1,
          category: 'services',
        },
      ];
    }

    if (
      lowerPrompt.includes('software') ||
      lowerPrompt.includes('app') ||
      lowerPrompt.includes('digital')
    ) {
      return [
        {
          id: uuidv4(),
          name: 'Starter Plan',
          description: 'Basic features for small teams',
          price: 19.99,
          quantity: 1,
          category: 'software',
        },
        {
          id: uuidv4(),
          name: 'Professional Plan',
          description: 'Advanced features for growing businesses',
          price: 49.99,
          quantity: 1,
          category: 'software',
        },
        {
          id: uuidv4(),
          name: 'Enterprise Plan',
          description: 'Full feature set with enterprise support',
          price: 149.99,
          quantity: 1,
          category: 'software',
        },
      ];
    }

    if (
      lowerPrompt.includes('event') ||
      lowerPrompt.includes('conference') ||
      lowerPrompt.includes('workshop')
    ) {
      return [
        {
          id: uuidv4(),
          name: 'Early Bird Ticket',
          description: 'Limited time special pricing',
          price: 299.0,
          quantity: 1,
          category: 'events',
        },
        {
          id: uuidv4(),
          name: 'Regular Ticket',
          description: 'Standard conference access',
          price: 399.0,
          quantity: 1,
          category: 'events',
        },
        {
          id: uuidv4(),
          name: 'VIP Package',
          description: 'Premium access with networking events',
          price: 699.0,
          quantity: 1,
          category: 'events',
        },
      ];
    }

    // Return the default products from the existing method
    return this.generateDefaultProducts(label);
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
    } else if (formType.includes('order') || formType.includes('purchase')) {
      return "Thank you for your order! You'll receive a confirmation email with your order details and next steps.";
    } else if (
      formType.includes('signature') ||
      formType.includes('agreement')
    ) {
      return "Thank you for completing the agreement. Your signature has been recorded and you'll receive a copy via email.";
    }

    return "Thank you for your submission! We've received your information and will be in touch soon.";
  }

  private generateHelpText(
    fieldType: string,
    label: string,
    prompt: string = ''
  ): string {
    const lowerLabel = label.toLowerCase();
    const lowerPrompt = prompt.toLowerCase();

    switch (fieldType) {
      case 'email':
        return 'example@company.com';
      case 'phone':
        return 'Enter your 10-digit mobile number';
      case 'signature':
        if (lowerPrompt.includes('legal') || lowerPrompt.includes('contract')) {
          return 'Your digital signature will be legally binding';
        }
        return 'Draw your signature using your mouse or touch screen';
      case 'fillBlank':
        return 'Complete the statement by filling in the blank space';
      case 'productList':
        if (lowerPrompt.includes('order') || lowerPrompt.includes('purchase')) {
          return 'Select products and specify quantities for your order';
        }
        return 'Choose your preferred options from the available products';
      case 'rating':
      case 'scale':
        return 'Rate based on your experience';
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

  private generateDefaultOptionsWithCorrectAnswer(
    label: string,
    fieldType: string,
    forceCorrectAnswer: boolean = false
  ): {
    options: Array<{ label: string; value: string; isCorrect?: boolean }>;
    correctAnswer?: string;
  } {
    const lowerLabel = label.toLowerCase();

    // Determine if this should have a correct answer based on context
    const isQuizField =
      forceCorrectAnswer ||
      lowerLabel.includes('correct') ||
      lowerLabel.includes('answer') ||
      lowerLabel.includes('question') ||
      lowerLabel.includes('quiz') ||
      lowerLabel.includes('test') ||
      lowerLabel.includes('assessment') ||
      lowerLabel.includes('choose') ||
      lowerLabel.includes('select') ||
      lowerLabel.includes('which') ||
      lowerLabel.includes('what') ||
      lowerLabel.includes('true') ||
      lowerLabel.includes('false');

    if (lowerLabel.includes('experience') || lowerLabel.includes('level')) {
      const options = [
        { label: 'Beginner (0-2 years)', value: 'beginner' },
        {
          label: 'Intermediate (2-5 years)',
          value: 'intermediate',
          isCorrect: isQuizField,
        },
        { label: 'Advanced (5+ years)', value: 'advanced' },
        { label: 'Expert (10+ years)', value: 'expert' },
      ];
      return {
        options,
        correctAnswer: isQuizField ? 'intermediate' : undefined,
      };
    }

    if (lowerLabel.includes('satisfaction') || lowerLabel.includes('rating')) {
      const options = [
        { label: 'Excellent', value: 'excellent', isCorrect: isQuizField },
        { label: 'Good', value: 'good' },
        { label: 'Average', value: 'average' },
        { label: 'Poor', value: 'poor' },
      ];
      return {
        options,
        correctAnswer: isQuizField ? 'excellent' : undefined,
      };
    }

    if (lowerLabel.includes('capital') || lowerLabel.includes('geography')) {
      const options = [
        { label: 'London', value: 'london' },
        { label: 'Paris', value: 'paris', isCorrect: isQuizField },
        { label: 'Berlin', value: 'berlin' },
        { label: 'Madrid', value: 'madrid' },
      ];
      return {
        options,
        correctAnswer: isQuizField ? 'paris' : undefined,
      };
    }

    if (lowerLabel.includes('math') || lowerLabel.includes('calculation')) {
      const options = [
        { label: '4', value: '4', isCorrect: isQuizField },
        { label: '5', value: '5' },
        { label: '6', value: '6' },
        { label: '7', value: '7' },
      ];
      return {
        options,
        correctAnswer: isQuizField ? '4' : undefined,
      };
    }

    // Default options with quiz support
    const options = [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2', isCorrect: isQuizField },
      { label: 'Option 3', value: 'option3' },
    ];

    const result = {
      options,
      correctAnswer: isQuizField ? 'option2' : undefined,
    };

    return result;
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
        'Enhanced signature field configurations',
        'Contextual fill-blank templates',
        'Smart product list generation',
        'Form type detection and enforcement',
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

  //  Method to get field-specific enhancements
  getFieldEnhancements(): {
    signature: string[];
    fillBlank: string[];
    productList: string[];
  } {
    return {
      signature: [
        'Contextual instruction text generation',
        'Customizable signature canvas dimensions',
        'Professional styling with clear/sign prompts',
        'Legal and business context awareness',
      ],
      fillBlank: [
        'Smart template generation based on context',
        'Multiple template patterns (agreements, declarations, etc.)',
        'Contextual placeholder text',
        'Professional statement formatting',
      ],
      productList: [
        'Context-aware product generation',
        'Realistic pricing based on industry',
        'Category-specific product types',
        'Quantity management and total calculation',
        'Support for courses, services, software, events',
      ],
    };
  }

  // Method to test field generation
  async testFieldGeneration(fieldType: string, context: string): Promise<any> {
    try {
      switch (fieldType) {
        case 'signature':
          return {
            type: 'signature',
            label: 'Digital Signature',
            signatureConfig: {
              instructionText: this.generateSignatureInstructions(
                'signature',
                context
              ),
              clearButtonText: 'Clear Signature',
              signHereText: 'Sign here',
              width: 400,
              height: 150,
              backgroundColor: '#ffffff',
              penColor: '#000000',
            },
          };

        case 'fillBlank':
          return {
            type: 'fillBlank',
            label: 'Agreement Statement',
            fillBlankTemplate: this.generateFillBlankTemplate(
              'agreement',
              context
            ),
          };

        case 'productList':
          return {
            type: 'productList',
            label: 'Select Products',
            productListConfig: {
              allowQuantityEdit: true,
              showTotalPrice: true,
              currency: 'USD',
              currencySymbol: '$',
              products: this.generateContextualProducts('products', context),
            },
          };

        default:
          return { error: 'Unsupported field type for testing' };
      }
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Method to test form type detection
  testFormTypeDetection(prompt: string): {
    detectedType: string;
    confidence: string;
    keywords: string[];
  } {
    const detectedType = this.detectIntendedFormType(prompt);

    // Simple confidence calculation based on keyword matching
    const lowerPrompt = prompt.toLowerCase();
    let matchedKeywords: string[] = [];
    let confidence = 'medium';

    const allKeywords = {
      quiz: ['quiz', 'test', 'assessment', 'exam', 'evaluation', 'question'],
      feedback: ['feedback', 'review', 'comment', 'experience', 'opinion'],
      survey: ['survey', 'poll', 'research', 'study', 'questionnaire'],
    };

    if (detectedType !== 'general') {
      matchedKeywords = allKeywords[
        detectedType as keyof typeof allKeywords
      ].filter(keyword => lowerPrompt.includes(keyword));

      if (matchedKeywords.length >= 2) {
        confidence = 'high';
      } else if (matchedKeywords.length === 1) {
        confidence = 'medium';
      } else {
        confidence = 'low';
      }
    }

    return {
      detectedType,
      confidence,
      keywords: matchedKeywords,
    };
  }
}

export default AIFormGeneratorService;
