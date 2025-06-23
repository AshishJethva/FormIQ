// src/services/aiSuggestionService.ts

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
}

export class AISuggestionService {
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
        temperature: 0.6,
        topK: 15,
        topP: 0.8,
        maxOutputTokens: 100,
      },
    });
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

      const contextStart = Math.max(0, cursorPosition - 80);
      const context = beforeCursor.substring(contextStart);

      const prompt = this.buildProgressivePrompt(
        context,
        lastWord,
        isWordCompletion,
        beforeCursor,
        suggestionType
      );

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI timeout')), 2500)
      );

      const aiPromise = this.model.generateContent(prompt);

      const result = await Promise.race([aiPromise, timeoutPromise]);
      const response = await (result as any).response;
      const responseText = response.text();

      const suggestions = this.parseProgressiveResponse(
        responseText,
        lastWord,
        isWordCompletion,
        beforeCursor,
        suggestionType
      );

      return {
        suggestions,
        isWordCompletion,
        confidence: this.calculateProgressiveConfidence(suggestions, context),
      };
    } catch (error: any) {
      console.error('AI suggestion generation failed:', error);

      return {
        suggestions: this.getProgressiveFallbackSuggestions(
          request.text,
          request.cursorPosition,
          request.suggestionType || 'standard'
        ),
        isWordCompletion: false,
        confidence: 75,
      };
    }
  }

  private getProgressiveFallbackSuggestions(
    text: string,
    cursorPosition: number,
    suggestionType: string = 'standard'
  ): string[] {
    const beforeCursor = text.substring(0, cursorPosition).toLowerCase().trim();

    const fallbackMap = new Map([
      [
        'build a customer',
        'feedback form with rating scales and comment sections',
      ],
      [
        'create a customer',
        'onboarding form with contact details and preferences',
      ],
      [
        'make a customer',
        'service survey with experience ratings and comments',
      ],
      ['build a form', 'with multiple choice questions and rating scales'],
      ['create a form', 'for customer feedback and satisfaction evaluation'],
      ['make a form', 'to collect user information and contact details'],
      ['design a form', 'for event registration and participant management'],
      ['create a', 'customer feedback form with rating scales'],
      ['build a', 'survey form with multiple choice questions'],
      ['make a', 'contact form with name email fields'],
      ['design a', 'booking form with date selection options'],
      ['generate a', 'quiz form with multiple choice questions'],
      ['i want to create', 'a registration form with user details'],
      ['i need to build', 'a job application form with file uploads'],
      ['i want to make', 'a feedback form with rating system'],
      ['i want to', 'build a professional form with validation'],
      ['i need a', 'registration form with user verification features'],

      // Additional continuation patterns
      ['feedback form with', 'rating scales and detailed comment sections'],
      ['registration form with', 'user verification and contact information'],
      ['application form with', 'file uploads and personal details'],
      ['survey form with', 'multiple choice and rating questions'],
      ['contact form with', 'name email phone and message fields'],
      ['quiz form with', 'multiple choice questions and automatic scoring'],
      ['booking form with', 'date selection and customer details'],

      // Common continuation patterns
      ['with rating scales', 'and detailed comment sections for feedback'],
      ['with multiple choice', 'questions and automatic scoring system'],
      ['with file uploads', 'and personal information collection fields'],
      ['with user verification', 'and secure login authentication system'],
      ['with contact details', 'and communication preference settings'],
      ['with date selection', 'and time slot booking options'],
    ]);

    // Check exact matches first
    for (const [key, value] of fallbackMap) {
      if (beforeCursor.endsWith(key) || beforeCursor.endsWith(key + ' ')) {
        return [value];
      }
    }

    // Keyword fallbacks
    const keywordMap = new Map([
      ['feedback', 'with detailed comment sections and rating scales'],
      ['quiz', 'with multiple choice questions and automatic scoring'],
      ['survey', 'with rating scales and demographic questions'],
      ['application', 'with file uploads and personal information fields'],
      ['contact', 'with inquiry categories and message areas'],
      ['registration', 'with user verification and contact information'],
      ['booking', 'with date selection and customer details'],
      ['customer', 'feedback form with satisfaction ratings and comments'],
      ['rating', 'scales and detailed comment sections for feedback'],
      ['multiple', 'choice questions with automatic scoring system'],
      ['choice', 'questions with clear answer options'],
      ['upload', 'functionality for documents and important files'],
      ['verification', 'system with secure user authentication'],
      ['selection', 'options with clear categorized choices'],
    ]);

    for (const [keyword, suggestion] of keywordMap) {
      if (beforeCursor.includes(keyword)) {
        return [suggestion];
      }
    }

    return ['with custom fields and validation rules'];
  }

  private buildProgressivePrompt(
    context: string,
    lastWord: string,
    isWordCompletion: boolean,
    beforeCursor: string,
    suggestionType: string
  ): string {
    if (isWordCompletion) {
      return `Complete "${lastWord}" for form building. Context: "${context}". Return 1-2 completions as: word1, word2`;
    } else {
      if (suggestionType === 'progressive') {
        return `User is typing: "${beforeCursor.trim()}"

Continue their sentence with exactly 8-10 words that naturally follow.

Rules:
1. DO NOT repeat what they already typed
2. Continue naturally from where they left off
3. Focus on form fields, features, or purpose
4. Return ONLY the continuation part (8-10 words)
5. No quotes or formatting
6. Keep it concise and specific
7. Focus on immediate next logical step

Examples:
User: "Create a job application form"
Your response: "with fields for personal details and work experience"

User: "Build a customer feedback form with rating scales"
Your response: "and comment sections for detailed user feedback"

User: "I want to make a survey"
Your response: "with multiple choice questions and rating scales"

Your 8-10 word continuation:`;
      } else {
        return `User is typing: "${beforeCursor.trim()}"

Continue their sentence with what should come next (8-12 words).

Rules:
1. DO NOT repeat what they already typed
2. Continue naturally from where they left off
3. Focus on form fields, features, or purpose
4. Return ONLY the continuation part
5. No quotes or formatting

Your continuation:`;
      }
    }
  }

  private parseProgressiveResponse(
    responseText: string,
    lastWord: string,
    isWordCompletion: boolean,
    beforeCursor: string,
    suggestionType: string
  ): string[] {
    try {
      let cleaned = responseText
        .trim()
        .replace(/```json\n?|\n?```/g, '')
        .replace(/^["'`]+|["'`]+$/g, '')
        .trim();

      if (isWordCompletion) {
        const completions = cleaned
          .split(',')
          .map(s => s.trim().replace(/^["']|["']$/g, ''))
          .filter(s => s.length > 0)
          .slice(0, 2);
        return completions;
      } else {
        let suggestion = cleaned
          .replace(/^["'`\s]+|["'`\s]+$/g, '')
          .replace(/\n+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // Remove any trailing ellipsis from AI response
        suggestion = suggestion.replace(/\.\.\.+$/, '').trim();

        if (suggestion.length > 5) {
          const words = suggestion.split(' ').filter(w => w.length > 0);

          if (suggestionType === 'progressive') {
            // For progressive mode, take up to 10 words without adding ellipsis
            if (words.length > 10) {
              return [words.slice(0, 10).join(' ')];
            } else if (words.length >= 5) {
              return [suggestion];
            }
          } else {
            // For standard mode, allow up to 12 words
            if (words.length > 12) {
              return [words.slice(0, 12).join(' ')];
            } else {
              return [suggestion];
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

  private calculateProgressiveConfidence(
    suggestions: string[],
    context: string
  ): number {
    if (suggestions.length === 0) return 0;

    const suggestion = suggestions[0];
    const words = suggestion.split(' ').filter(w => w.length > 0);

    const hasFormKeywords =
      /form|field|survey|quiz|feedback|application|customer|rating|upload|validation|email/i.test(
        suggestion
      );
    const hasQuotes = /["'`]/.test(suggestion);
    const goodWordCount = words.length >= 6 && words.length <= 12;
    const properLength = suggestion.length > 15 && suggestion.length < 100;
    const startsWithLogicalWord =
      /^(with|and|for|including|featuring|containing|that|which)/i.test(
        suggestion
      );

    let score = 50; // Base score
    if (hasFormKeywords) score += 25;
    if (goodWordCount) score += 20;
    if (properLength) score += 10;
    if (startsWithLogicalWord) score += 10;
    if (hasQuotes) score -= 15;
    if (context.length > 30) score += 5;

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
    const defaults = {
      quiz: ['with multiple choice questions and automatic scoring'],
      survey: ['with rating scales and feedback sections'],
      feedback: ['with satisfaction ratings and comment sections'],
      application: ['with file uploads and personal information fields'],
      contact: ['with name email phone and message fields'],
      general: ['with custom fields and validation rules'],
    };

    return defaults[category] || defaults.general;
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
