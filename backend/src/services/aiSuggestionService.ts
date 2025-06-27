import { GoogleGenerativeAI } from '@google/generative-ai';

interface SuggestionRequest {
  text: string;
  cursorPosition: number;
  context?: string;
  maxLength?: number;
  suggestionType?: 'progressive' | 'standard';
}

interface SuggestionResponse {
  suggestions: string[];
  isWordCompletion: boolean;
  confidence: number;
  formType?: string;
}

export class AISuggestionService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private formKeywords: Set<string>;
  private formTypes: Map<string, string[]>;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      generationConfig: {
        temperature: 0.4,
        topK: 10,
        topP: 0.7,
        maxOutputTokens: 80,
      },
    });

    this.initializeFormTrainingData();
  }

  private initializeFormTrainingData() {
    // Core form-related keywords
    this.formKeywords = new Set([
      'form',
      'field',
      'input',
      'question',
      'survey',
      'quiz',
      'feedback',
      'application',
      'registration',
      'contact',
      'booking',
      'order',
      'subscription',
      'evaluation',
      'assessment',
      'questionnaire',
      'poll',
      'interview',
      'screening',
      'onboarding',
      'checkout',
      'payment',
      'upload',
      'file',
      'attachment',
      'validation',
      'required',
      'optional',
      'multiple',
      'choice',
      'radio',
      'checkbox',
      'dropdown',
      'select',
      'text',
      'textarea',
      'email',
      'phone',
      'date',
      'time',
      'number',
      'rating',
      'scale',
      'slider',
      'toggle',
      'button',
      'submit',
      'personal',
      'information',
      'details',
      'address',
      'name',
      'age',
      'experience',
      'education',
      'skills',
      'references',
      'portfolio',
      'medical',
      'health',
      'insurance',
      'emergency',
      'contact',
      'preferences',
      'settings',
      'notification',
      'consent',
      'agreement',
    ]);

    // Form type specific continuations
    this.formTypes = new Map([
      [
        'job_application',
        [
          'with personal information and work experience sections',
          'with resume upload and cover letter fields',
          'with education background and skills assessment',
          'with professional references and contact details',
          'with portfolio links and certification uploads',
          'with salary expectations and availability dates',
          'with technical skills and proficiency levels',
        ],
      ],
      [
        'customer_feedback',
        [
          'with satisfaction rating scales and comment sections',
          'with service quality evaluation and improvement suggestions',
          'with experience ratings and detailed feedback areas',
          'with product quality assessment and recommendations',
          'with overall satisfaction and likelihood to recommend',
          'with specific service areas and staff performance ratings',
          'with complaint categories and resolution preferences',
        ],
      ],
      [
        'quiz_assessment',
        [
          'with multiple choice questions and automatic scoring',
          'with true false statements and instant feedback',
          'with fill in the blank questions and hints',
          'with image based questions and visual elements',
          'with time limits and progress tracking',
          'with difficulty levels and adaptive questioning',
          'with explanations and learning resources',
        ],
      ],
      [
        'survey_research',
        [
          'with demographic questions and statistical analysis',
          'with opinion ratings and preference selections',
          'with behavioral analysis and usage patterns',
          'with market research and consumer insights',
          'with brand awareness and competitor comparison',
          'with satisfaction metrics and loyalty indicators',
          'with trend analysis and future predictions',
        ],
      ],
      [
        'registration_form',
        [
          'with user account creation and password setup',
          'with personal details and contact information',
          'with event selection and payment processing',
          'with accommodation preferences and dietary restrictions',
          'with emergency contacts and medical information',
          'with group registration and team assignments',
          'with confirmation emails and calendar integration',
        ],
      ],
      [
        'contact_inquiry',
        [
          'with inquiry categories and urgency levels',
          'with contact details and preferred response method',
          'with file attachments and supporting documents',
          'with department routing and subject classification',
          'with automated responses and ticket tracking',
          'with business hours and response time expectations',
          'with follow up preferences and communication settings',
        ],
      ],
      [
        'booking_reservation',
        [
          'with date and time selection options',
          'with service categories and duration choices',
          'with customer details and special requests',
          'with payment processing and confirmation',
          'with cancellation policies and rescheduling options',
          'with location selection and directions',
          'with reminder notifications and calendar sync',
        ],
      ],
      [
        'medical_intake',
        [
          'with patient information and insurance details',
          'with medical history and current medications',
          'with symptom descriptions and pain scales',
          'with allergies and emergency contact information',
          'with appointment scheduling and doctor preferences',
          'with consent forms and privacy agreements',
          'with health questionnaires and risk assessments',
        ],
      ],
      [
        'event_planning',
        [
          'with event details and venue requirements',
          'with guest list management and RSVP tracking',
          'with catering preferences and dietary restrictions',
          'with budget planning and expense tracking',
          'with vendor coordination and service bookings',
          'with timeline planning and milestone tracking',
          'with invitation management and communication',
        ],
      ],
      [
        'order_checkout',
        [
          'with product selection and quantity options',
          'with shipping address and delivery preferences',
          'with payment processing and billing information',
          'with discount codes and promotional offers',
          'with order summary and item customization',
          'with guest checkout and account creation options',
          'with order tracking and delivery notifications',
        ],
      ],
    ]);
  }

  private removeAllQuotes(text: string): string {
    if (!text) return '';
    return text
      .replace(/["""''`′″‚„‛‟‹›«»]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private detectFormType(text: string): string {
    const lowerText = text.toLowerCase();

    // Form type detection patterns
    const patterns = [
      {
        type: 'job_application',
        keywords: [
          'job',
          'application',
          'resume',
          'career',
          'employment',
          'position',
          'hire',
          'candidate',
        ],
      },
      {
        type: 'customer_feedback',
        keywords: [
          'feedback',
          'review',
          'satisfaction',
          'experience',
          'service',
          'customer',
          'rating',
        ],
      },
      {
        type: 'quiz_assessment',
        keywords: [
          'quiz',
          'test',
          'assessment',
          'exam',
          'question',
          'score',
          'knowledge',
          'evaluation',
        ],
      },
      {
        type: 'survey_research',
        keywords: [
          'survey',
          'research',
          'opinion',
          'poll',
          'study',
          'market',
          'demographic',
          'analysis',
        ],
      },
      {
        type: 'registration_form',
        keywords: [
          'registration',
          'signup',
          'register',
          'account',
          'member',
          'enrollment',
          'join',
        ],
      },
      {
        type: 'contact_inquiry',
        keywords: [
          'contact',
          'inquiry',
          'message',
          'support',
          'help',
          'question',
          'assistance',
        ],
      },
      {
        type: 'booking_reservation',
        keywords: [
          'booking',
          'reservation',
          'appointment',
          'schedule',
          'book',
          'reserve',
          'availability',
        ],
      },
      {
        type: 'medical_intake',
        keywords: [
          'medical',
          'patient',
          'health',
          'doctor',
          'clinic',
          'treatment',
          'symptoms',
          'healthcare',
        ],
      },
      {
        type: 'event_planning',
        keywords: [
          'event',
          'planning',
          'party',
          'wedding',
          'conference',
          'meeting',
          'celebration',
        ],
      },
      {
        type: 'order_checkout',
        keywords: [
          'order',
          'checkout',
          'purchase',
          'buy',
          'cart',
          'payment',
          'shipping',
          'product',
        ],
      },
    ];

    for (const pattern of patterns) {
      const matchCount = pattern.keywords.filter(keyword =>
        lowerText.includes(keyword)
      ).length;
      if (matchCount >= 1) {
        return pattern.type;
      }
    }

    return 'general_form';
  }

  private buildFormFocusedPrompt(
    context: string,
    lastWord: string,
    isWordCompletion: boolean,
    beforeCursor: string,
    suggestionType: string,
    detectedFormType: string
  ): string {
    const formExamples =
      this.formTypes.get(detectedFormType) ||
      this.formTypes.get('general_form') ||
      [];
    const exampleText = formExamples.slice(0, 3).join('\n- ');

    if (isWordCompletion) {
      return `Complete the word "${lastWord}" in the context of form building.
Context: "${context}"

RULES:
- Only suggest form-related word completions
- Focus on form fields, features, or components
- Return 1-2 words separated by commas
- NO quotes, just plain words

Examples for ${detectedFormType}:
${exampleText}

Complete "${lastWord}":`;
    }

    const basePrompt = `You are a specialized form building assistant. Continue the user's sentence about creating forms.

User is typing: "${beforeCursor.trim()}"
Detected form type: ${detectedFormType}

STRICT RULES:
1. ONLY suggest form-related continuations
2. Focus on form fields, components, features, or functionality
3. DO NOT suggest non-form content (websites, apps, documents, etc.)
4. Continue naturally with 6-10 words
5. NO quotes or formatting marks
6. Return plain text only

Form-specific examples for ${detectedFormType}:
- ${exampleText}

VALID form continuations include:
- Form fields: "with name email phone fields"
- Form features: "with file upload capabilities"
- Form functionality: "with automatic validation rules"
- Form sections: "with personal information section"
- Form components: "with dropdown menus and checkboxes"

Your form-focused continuation (6-10 words):`;

    return basePrompt;
  }

  private validateFormRelevance(suggestion: string): boolean {
    const lowerSuggestion = suggestion.toLowerCase();

    // Must contain at least one form-related keyword
    const hasFormKeyword = Array.from(this.formKeywords).some(keyword =>
      lowerSuggestion.includes(keyword)
    );

    // Common form-related patterns
    const formPatterns = [
      /\b(with|including|featuring|containing)\s+(field|input|question|section|option|choice|upload|validation|rating|scale|dropdown|checkbox|radio|button|form|area|box|selection|picker|slider|toggle)\b/,
      /\b(personal|contact|user|customer|participant|applicant|patient|client)\s+(information|details|data|profile|background)\b/,
      /\b(multiple|single)\s+(choice|select|option)\b/,
      /\b(file|document|image|photo|resume|cv|portfolio)\s+(upload|attachment|submission)\b/,
      /\b(email|phone|address|name|age|date|time|number|text|message)\s+(field|input|validation|format|requirement)\b/,
      /\b(rating|scale|score|point|star|feedback|review|evaluation|assessment)\b/,
      /\b(required|optional|mandatory|validation|verification|confirmation)\b/,
      /\b(submit|save|cancel|reset|clear|next|previous|finish|complete)\s+(button|action|step)\b/,
    ];

    const hasFormPattern = formPatterns.some(pattern =>
      pattern.test(lowerSuggestion)
    );

    // Reject non-form suggestions - simplified patterns
    const nonFormPatterns = [
      /\b(website|webpage|blog|article|video|music|game|social media|marketing|business strategy)\b/,
      /\b(create a (company|business|startup|organization|team))\b/,
      /\b(build (an app|a website|a platform|software|a system))\b/,
      /\b(develop (a product|a service|a brand|a strategy))\b/,
      /\b(design (a logo|graphics|artwork|presentation))\b/,
      /\b(write (a book|an article|content|copy|text))\b/,
      /\b(make (money|profit|sales|revenue|business))\b/,
    ];

    const hasNonFormPattern = nonFormPatterns.some(pattern =>
      pattern.test(lowerSuggestion)
    );

    return (hasFormKeyword || hasFormPattern) && !hasNonFormPattern;
  }

  async generateSuggestions(
    request: SuggestionRequest
  ): Promise<SuggestionResponse> {
    try {
      const {
        text,
        cursorPosition,
        maxLength = 80,
        suggestionType = 'standard',
      } = request;

      if (text.length > 600) {
        const trimmedText = text.substring(text.length - 600);
        const adjustedPosition = Math.min(cursorPosition, 600);
        return this.generateSuggestions({
          text: trimmedText,
          cursorPosition: adjustedPosition,
          context: request.context,
          maxLength,
          suggestionType,
        });
      }

      const beforeCursor = text.substring(0, cursorPosition);
      const lastWordMatch = beforeCursor.match(/\b(\w*)$/);
      const lastWord = lastWordMatch ? lastWordMatch[1] : '';
      const isWordCompletion = lastWord.length > 0;

      // Detect form type from context
      const detectedFormType = this.detectFormType(text);

      const contextStart = Math.max(0, cursorPosition - 80);
      const context = beforeCursor.substring(contextStart);

      // Build form-focused prompt
      const prompt = this.buildFormFocusedPrompt(
        context,
        lastWord,
        isWordCompletion,
        beforeCursor,
        suggestionType,
        detectedFormType
      );

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI timeout')), 2500)
      );

      const aiPromise = this.model.generateContent(prompt);
      const result = await Promise.race([aiPromise, timeoutPromise]);
      const response = await (result as any).response;
      const responseText = response.text();

      let suggestions = this.parseFormFocusedResponse(
        responseText,
        lastWord,
        isWordCompletion,
        beforeCursor,
        suggestionType,
        detectedFormType
      );

      // Validate form relevance
      suggestions = suggestions.filter(suggestion =>
        this.validateFormRelevance(suggestion)
      );

      // If no valid suggestions, use form-specific fallbacks
      if (suggestions.length === 0) {
        suggestions = this.getFormSpecificFallbacks(
          text,
          cursorPosition,
          detectedFormType
        );
      }

      return {
        suggestions,
        isWordCompletion,
        confidence: this.calculateFormFocusedConfidence(
          suggestions,
          context,
          detectedFormType
        ),
        formType: detectedFormType,
      };
    } catch (error: any) {
      console.error('AI suggestion generation failed:', error);

      const detectedFormType = this.detectFormType(request.text);
      return {
        suggestions: this.getFormSpecificFallbacks(
          request.text,
          request.cursorPosition,
          detectedFormType
        ),
        isWordCompletion: false,
        confidence: 75,
        formType: detectedFormType,
      };
    }
  }

  private parseFormFocusedResponse(
    responseText: string,
    lastWord: string,
    isWordCompletion: boolean,
    beforeCursor: string,
    suggestionType: string,
    detectedFormType: string
  ): string[] {
    try {
      let cleaned = responseText
        .trim()
        .replace(/```json\n?|\n?```/g, '')
        .replace(/```\n?|\n?```/g, '')
        .trim();

      cleaned = this.removeAllQuotes(cleaned);

      if (isWordCompletion) {
        const completions = cleaned
          .split(',')
          .map(s => this.removeAllQuotes(s.trim()))
          .filter(s => s.length > 0 && this.validateFormRelevance(s))
          .slice(0, 2);
        return completions;
      } else {
        let suggestion = cleaned
          .replace(/\n+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        suggestion = this.removeAllQuotes(suggestion)
          .replace(/\.{3,}/g, '')
          .trim();

        // Validate form relevance
        if (!this.validateFormRelevance(suggestion)) {
          return [];
        }

        if (suggestion.length > 5) {
          const words = suggestion.split(' ').filter(w => w.length > 0);

          if (suggestionType === 'progressive') {
            if (words.length >= 6 && words.length <= 10) {
              return [this.removeAllQuotes(suggestion)];
            } else if (words.length > 10) {
              const result = words.slice(0, 10).join(' ');
              return [this.removeAllQuotes(result)];
            }
          } else {
            if (words.length >= 6 && words.length <= 12) {
              return [this.removeAllQuotes(suggestion)];
            } else if (words.length > 12) {
              const result = words.slice(0, 12).join(' ');
              return [this.removeAllQuotes(result)];
            }
          }
        }
      }

      return [];
    } catch (error) {
      console.error('Failed to parse response:', error);
      return [];
    }
  }

  private getFormSpecificFallbacks(
    text: string,
    cursorPosition: number,
    detectedFormType: string
  ): string[] {
    const beforeCursor = text.substring(0, cursorPosition).toLowerCase().trim();

    // Form-specific fallback mappings
    const formSpecificFallbacks = new Map([
      [
        'job_application',
        new Map([
          [
            'build a job',
            'application form with resume upload and experience fields',
          ],
          [
            'create a job',
            'application form with personal details and work history',
          ],
          [
            'make a job',
            'application form with skills assessment and references',
          ],
          [
            'job application with',
            'personal information and professional experience sections',
          ],
          ['application form with', 'resume upload and cover letter fields'],
          ['with resume', 'upload and professional references section'],
          ['with experience', 'history and education background fields'],
        ]),
      ],
      [
        'customer_feedback',
        new Map([
          [
            'build a feedback',
            'form with satisfaction ratings and comment sections',
          ],
          ['create a feedback', 'form with service quality evaluation fields'],
          [
            'make a feedback',
            'form with experience ratings and suggestion areas',
          ],
          ['feedback form with', 'rating scales and detailed comment sections'],
          [
            'customer feedback with',
            'satisfaction metrics and improvement suggestions',
          ],
          ['with rating', 'scales and detailed feedback comment sections'],
          [
            'with satisfaction',
            'ratings and service quality evaluation fields',
          ],
        ]),
      ],
      [
        'quiz_assessment',
        new Map([
          [
            'build a quiz',
            'form with multiple choice questions and automatic scoring',
          ],
          [
            'create a quiz',
            'form with true false questions and instant feedback',
          ],
          ['make a quiz', 'form with fill in blank questions and explanations'],
          [
            'quiz form with',
            'multiple choice questions and automatic scoring system',
          ],
          ['assessment form with', 'graded questions and performance tracking'],
          [
            'with multiple choice',
            'questions and automatic scoring capabilities',
          ],
          ['with questions', 'and automatic grading system for assessments'],
        ]),
      ],
      [
        'survey_research',
        new Map([
          [
            'build a survey',
            'form with demographic questions and rating scales',
          ],
          [
            'create a survey',
            'form with opinion ratings and preference selections',
          ],
          ['make a survey', 'form with market research and consumer insights'],
          [
            'survey form with',
            'demographic questions and statistical analysis',
          ],
          [
            'research survey with',
            'behavioral analysis and preference ratings',
          ],
          ['with demographic', 'questions and consumer preference analysis'],
          ['with opinion', 'ratings and market research insights'],
        ]),
      ],
      [
        'registration_form',
        new Map([
          [
            'build a registration',
            'form with user account creation and verification',
          ],
          [
            'create a registration',
            'form with personal details and contact information',
          ],
          [
            'make a registration',
            'form with event selection and payment processing',
          ],
          [
            'registration form with',
            'user verification and contact information',
          ],
          ['signup form with', 'account creation and password setup fields'],
          ['with user', 'verification and secure registration process'],
          ['with account', 'creation and personal information fields'],
        ]),
      ],
    ]);

    const typeSpecificMap = formSpecificFallbacks.get(detectedFormType);
    if (typeSpecificMap) {
      for (const [key, value] of typeSpecificMap) {
        if (beforeCursor.endsWith(key) || beforeCursor.endsWith(key + ' ')) {
          return [value];
        }
      }
    }

    // General form fallbacks
    const generalFormFallbacks = new Map([
      ['build a form', 'with custom fields and validation rules'],
      ['create a form', 'with multiple sections and user-friendly interface'],
      ['make a form', 'with responsive design and mobile compatibility'],
      ['design a form', 'with intuitive layout and clear instructions'],
      ['form with', 'required fields and input validation'],
      ['with fields', 'for data collection and user input'],
      ['with validation', 'rules and error handling mechanisms'],
      ['with sections', 'for organized data collection and user experience'],
    ]);

    for (const [key, value] of generalFormFallbacks) {
      if (beforeCursor.endsWith(key) || beforeCursor.endsWith(key + ' ')) {
        return [value];
      }
    }

    // Keyword-based fallbacks specific to forms
    const formKeywordFallbacks = new Map([
      ['customer', 'information form with contact details and preferences'],
      ['personal', 'information form with name email and address fields'],
      ['contact', 'form with inquiry categories and message areas'],
      ['upload', 'functionality for files and document attachments'],
      ['validation', 'rules for required fields and data formats'],
      ['required', 'fields with proper validation and error messages'],
      ['optional', 'fields with clear labeling and user guidance'],
      ['multiple', 'choice questions with radio button selections'],
      ['checkbox', 'options for multiple selections and preferences'],
      ['dropdown', 'menus with predefined options and categories'],
      ['rating', 'scales for feedback and satisfaction measurement'],
      ['comment', 'sections for detailed user feedback and suggestions'],
    ]);

    for (const [keyword, suggestion] of formKeywordFallbacks) {
      if (beforeCursor.includes(keyword)) {
        return [suggestion];
      }
    }

    // Default form-focused fallback
    return ['with custom fields and validation for user input'];
  }

  private calculateFormFocusedConfidence(
    suggestions: string[],
    context: string,
    detectedFormType: string
  ): number {
    if (suggestions.length === 0) return 0;

    const suggestion = suggestions[0];
    const words = suggestion.split(' ').filter(w => w.length > 0);

    // Form-specific confidence factors
    const hasFormKeywords = Array.from(this.formKeywords).some(keyword =>
      suggestion.toLowerCase().includes(keyword)
    );
    const hasQuotes = /["'`]/.test(suggestion);
    const goodWordCount = words.length >= 6 && words.length <= 12;
    const properLength = suggestion.length > 20 && suggestion.length < 120;
    const matchesFormType =
      this.formTypes
        .get(detectedFormType)
        ?.some(example =>
          example
            .toLowerCase()
            .includes(suggestion.toLowerCase().substring(0, 10))
        ) || false;
    const hasFormPattern =
      /\b(with|including|featuring|containing)\s+(field|form|section|question|input|validation|upload|selection|option|choice|rating|scale)\b/i.test(
        suggestion
      );

    let score = 40; // Lower base score, require form relevance
    if (hasFormKeywords) score += 30;
    if (hasFormPattern) score += 20;
    if (goodWordCount) score += 15;
    if (properLength) score += 10;
    if (matchesFormType) score += 15;
    if (hasQuotes) score -= 30; // Heavy penalty for quotes
    if (context.length > 30) score += 5;
    if (detectedFormType !== 'general_form') score += 5; // Bonus for specific form type detection

    return Math.max(0, Math.min(100, score));
  }

  getDefaultSuggestions(
    category:
      | 'quiz'
      | 'survey'
      | 'feedback'
      | 'application'
      | 'contact'
      | 'general'
  ): string[] {
    const categoryToFormType = {
      quiz: 'quiz_assessment',
      survey: 'survey_research',
      feedback: 'customer_feedback',
      application: 'job_application',
      contact: 'contact_inquiry',
      general: 'general_form',
    };

    const formType = categoryToFormType[category];
    const suggestions = this.formTypes.get(formType) || [
      'with custom fields and validation rules for user input',
    ];

    return [this.removeAllQuotes(suggestions[0])];
  }

  validateRequest(request: SuggestionRequest): {
    isValid: boolean;
    error?: string;
  } {
    if (!request.text || typeof request.text !== 'string') {
      return { isValid: false, error: 'Text is required and must be a string' };
    }

    if (
      typeof request.cursorPosition !== 'number' ||
      request.cursorPosition < 0
    ) {
      return {
        isValid: false,
        error: 'Cursor position must be a non-negative number',
      };
    }

    if (request.cursorPosition > request.text.length) {
      return {
        isValid: false,
        error: 'Cursor position cannot exceed text length',
      };
    }

    if (
      request.maxLength &&
      (request.maxLength < 10 || request.maxLength > 150)
    ) {
      return {
        isValid: false,
        error:
          'Max length must be between 10 and 150 characters for progressive suggestions',
      };
    }

    return { isValid: true };
  }
}

export default AISuggestionService;
