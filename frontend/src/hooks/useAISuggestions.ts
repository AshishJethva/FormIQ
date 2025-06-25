import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { apiConfig } from '@/config/api';

interface SuggestionState {
  suggestions: string[];
  isLoading: boolean;
  error: string | null;
  formType?: string;
}

interface UseAISuggestionsReturn {
  suggestions: string[];
  isLoading: boolean;
  error: string | null;
  formType?: string;
  generateSuggestions: (text: string, cursorPosition: number) => void;
  clearSuggestions: () => void;
}

export const useAISuggestions = (): UseAISuggestionsReturn => {
  const [state, setState] = useState<SuggestionState>({
    suggestions: [],
    isLoading: false,
    error: null,
    formType: undefined,
  });

  const abortController = useRef<AbortController | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Form-specific keywords for trigger detection
  const formTriggerKeywords = new Set([
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
    'upload',
    'validation',
    'required',
    'optional',
    'multiple',
    'choice',
    'rating',
    'scale',
    'dropdown',
    'checkbox',
    'radio',
    'button',
    'personal',
    'information',
    'details',
    'address',
    'name',
    'email',
    'phone',
    'date',
    'time',
    'number',
    'text',
    'message',
    'comment',
  ]);

  const detectFormIntent = useCallback((text: string): boolean => {
    const lowerText = text.toLowerCase();

    // Strong form indicators
    const formIndicators = [
      'i want to build a',
      'i want to create a',
      'i need to build a',
      'i need to create a',
      'i want to make a',
      'create a form',
      'build a form',
      'make a form',
      'design a form',
      'form with',
      'form for',
      'application form',
      'registration form',
      'contact form',
      'feedback form',
      'survey form',
      'quiz form',
      'booking form',
    ];

    const hasFormIndicator = formIndicators.some(indicator =>
      lowerText.includes(indicator)
    );

    // Check for form-related keywords
    const words = lowerText.split(/\s+/);
    const hasFormKeywords = words.some(word => formTriggerKeywords.has(word));

    return hasFormIndicator || hasFormKeywords;
  }, []);

  const getFormFocusedFallbacks = useCallback(
    (text: string, cursorPosition: number): string[] => {
      const beforeCursor = text
        .substring(0, cursorPosition)
        .toLowerCase()
        .trim();

      // Enhanced form-only fallback mappings
      const formOnlyFallbacks = new Map([
        // Job Application Forms
        [
          'build a job application',
          'form with resume upload and experience fields',
        ],
        [
          'create a job application',
          'form with personal details and work history',
        ],
        [
          'job application form with',
          'personal information and professional experience sections',
        ],
        [
          'application form with',
          'resume upload and cover letter submission fields',
        ],

        // Customer Feedback Forms
        [
          'build a customer feedback',
          'form with satisfaction ratings and comment sections',
        ],
        [
          'create a customer feedback',
          'form with service quality evaluation fields',
        ],
        ['feedback form with', 'rating scales and detailed comment sections'],
        [
          'customer feedback with',
          'satisfaction metrics and improvement suggestions',
        ],

        // Quiz and Assessment Forms
        [
          'build a quiz',
          'form with multiple choice questions and automatic scoring',
        ],
        [
          'create a quiz',
          'form with true false questions and instant feedback',
        ],
        [
          'quiz form with',
          'multiple choice questions and automatic scoring system',
        ],
        ['assessment form with', 'graded questions and performance tracking'],

        // Survey Forms
        ['build a survey', 'form with demographic questions and rating scales'],
        [
          'create a survey',
          'form with opinion ratings and preference selections',
        ],
        ['survey form with', 'demographic questions and statistical analysis'],
        ['research survey with', 'behavioral analysis and preference ratings'],

        // Registration Forms
        [
          'build a registration',
          'form with user account creation and verification',
        ],
        [
          'create a registration',
          'form with personal details and contact information',
        ],
        [
          'registration form with',
          'user verification and contact information fields',
        ],
        ['signup form with', 'account creation and password setup fields'],

        // Contact Forms
        ['build a contact', 'form with inquiry categories and message areas'],
        ['create a contact', 'form with name email phone and message fields'],
        [
          'contact form with',
          'inquiry categories and automated response system',
        ],

        // Booking Forms
        ['build a booking', 'form with date selection and customer details'],
        ['create a booking', 'form with time slots and service options'],
        ['booking form with', 'date time selection and customer information'],

        // General Form Continuations
        ['form with', 'custom fields and validation rules for user input'],
        ['with fields', 'for organized data collection and user experience'],
        ['with validation', 'rules and error handling for required fields'],
        [
          'with sections',
          'for structured information gathering and organization',
        ],
        ['with upload', 'functionality for documents and file attachments'],
        ['with rating', 'scales for feedback and satisfaction measurement'],
        ['with multiple choice', 'questions and radio button selections'],
        ['with dropdown', 'menus and predefined option categories'],
        ['with checkbox', 'options for multiple selections and preferences'],
        ['with required', 'fields and proper validation messages'],
        ['with optional', 'fields and clear user guidance labels'],
        ['with personal', 'information fields and contact details'],
        ['with contact', 'details and communication preferences'],
        ['with user', 'verification and secure authentication system'],
        ['with automatic', 'validation and real-time error checking'],
        ['with responsive', 'design for mobile and desktop compatibility'],
        ['with custom', 'styling and branded form appearance'],
      ]);

      // Check exact matches first
      for (const [key, value] of formOnlyFallbacks) {
        if (beforeCursor.endsWith(key) || beforeCursor.endsWith(key + ' ')) {
          return [value];
        }
      }

      // Form-specific keyword fallbacks
      const formKeywordFallbacks = new Map([
        [
          'application',
          'form with personal details and document upload fields',
        ],
        ['feedback', 'form with rating scales and comment sections'],
        ['quiz', 'form with multiple choice questions and scoring'],
        ['survey', 'form with demographic questions and rating scales'],
        ['registration', 'form with user verification and contact information'],
        ['contact', 'form with inquiry categories and message areas'],
        ['booking', 'form with date selection and customer details'],
        ['order', 'form with product selection and payment processing'],
        ['customer', 'information form with contact details and preferences'],
        ['personal', 'information form with name email and address fields'],
        ['upload', 'functionality for files and document attachments'],
        ['validation', 'rules for required fields and data formats'],
        ['required', 'fields with proper validation and error messages'],
        ['optional', 'fields with clear labeling and user guidance'],
        ['multiple', 'choice questions with radio button selections'],
        ['checkbox', 'options for multiple selections and preferences'],
        ['dropdown', 'menus with predefined options and categories'],
        ['rating', 'scales for feedback and satisfaction measurement'],
      ]);

      for (const [keyword, suggestion] of formKeywordFallbacks) {
        if (beforeCursor.includes(keyword)) {
          return [suggestion];
        }
      }

      // Default form-focused fallback
      return [
        'with custom fields and validation for structured data collection',
      ];
    },
    []
  );

  const generateSuggestions = useCallback(
    async (text: string, cursorPosition: number) => {
      // Check if this is form-related content
      if (!detectFormIntent(text)) {
        setState(prev => ({ ...prev, suggestions: [] }));
        return;
      }

      const beforeCursor = text.substring(0, cursorPosition);
      const lastChar = beforeCursor.slice(-1);

      // Enhanced form-specific trigger detection
      if (
        lastChar &&
        lastChar !== ' ' &&
        !beforeCursor.endsWith('. ') &&
        beforeCursor.length > 0
      ) {
        const formTriggers = new Set([
          'i want to build a',
          'i want to create a',
          'i need to build a',
          'i need to create a',
          'i want to make a',
          'create a',
          'build a',
          'make a',
          'design a',
          'generate a',
          'form with',
          'with',
          'and',
          'including',
          'featuring',
          'containing',
          'application form',
          'feedback form',
          'quiz form',
          'survey form',
          'registration form',
          'contact form',
          'booking form',
        ]);

        const lowerText = beforeCursor.toLowerCase().trim();
        const shouldTrigger = Array.from(formTriggers).some(
          phrase =>
            lowerText.endsWith(phrase) || lowerText.endsWith(phrase + ' ')
        );

        if (!shouldTrigger) {
          setState(prev => ({ ...prev, suggestions: [] }));
          return;
        }
      }

      if (text.trim().length < 2) {
        setState(prev => ({ ...prev, suggestions: [] }));
        return;
      }

      if (text.length > 600) {
        const trimmedText = text.substring(text.length - 600);
        const adjustedPosition = Math.min(cursorPosition, 600);
        return generateSuggestions(trimmedText, adjustedPosition);
      }

      if (abortController.current) {
        abortController.current.abort();
      }

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(async () => {
        try {
          setState(prev => ({ ...prev, isLoading: true, error: null }));
          abortController.current = new AbortController();

          const token = localStorage.getItem('token');
          if (!token) {
            const fallbackSuggestions = getFormFocusedFallbacks(
              text,
              cursorPosition
            );
            setState(prev => ({
              ...prev,
              suggestions: fallbackSuggestions,
              isLoading: false,
              formType: 'general_form',
            }));
            return;
          }

          const response = await axios.post(
            `${apiConfig.url}/ai/suggestions`,
            {
              text,
              cursorPosition,
              context: beforeCursor.substring(Math.max(0, cursorPosition - 80)),
              maxLength: 80,
              suggestionType: 'progressive',
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              signal: abortController.current.signal,
              timeout: 3000,
            }
          );

          if (abortController.current?.signal.aborted) {
            return;
          }

          const { suggestions = [], formType = 'general_form' } =
            response.data.data || {};

          // Enhanced cleaning and form validation
          const cleanedSuggestions = suggestions
            .map((s: string) => s.replace(/^['"`\s]+|['"`\s]+$/g, '').trim())
            .map((s: string) =>
              s
                .replace(/\.{3,}/g, '')
                .replace(/…/g, '')
                .trim()
            )
            .filter((s: string) => {
              const words = s.split(' ').filter(w => w.length > 0);
              const isValidLength =
                words.length >= 3 && words.length <= 12 && s.length > 10;

              // Form relevance check
              const hasFormKeywords = Array.from(formTriggerKeywords).some(
                keyword => s.toLowerCase().includes(keyword)
              );

              const hasFormPatterns =
                /\b(with|including|featuring|containing)\s+(field|form|section|question|input|validation|upload|selection|option|choice|rating|scale|dropdown|checkbox|radio|button)\b/i.test(
                  s
                );

              return isValidLength && (hasFormKeywords || hasFormPatterns);
            })
            .map((s: string) => {
              const words = s.split(' ').filter(w => w.length > 0);
              const limitedWords = words.slice(0, 10);
              return limitedWords.join(' ');
            });

          setState(prev => ({
            ...prev,
            suggestions: cleanedSuggestions.slice(0, 1),
            isLoading: false,
            formType,
          }));
        } catch (error: any) {
          if (error.name === 'AbortError' || axios.isCancel(error)) {
            return;
          }

          console.error('AI suggestion generation failed:', error);

          const fallbackSuggestions = getFormFocusedFallbacks(
            text,
            cursorPosition
          );

          setState(prev => ({
            ...prev,
            suggestions: fallbackSuggestions.slice(0, 1),
            isLoading: false,
            error: null,
            formType: 'general_form',
          }));
        }
      }, 20);
    },
    [detectFormIntent, getFormFocusedFallbacks]
  );

  const clearSuggestions = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    if (abortController.current) {
      abortController.current.abort();
    }
    setState(prev => ({
      ...prev,
      suggestions: [],
      isLoading: false,
      formType: undefined,
    }));
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  return {
    suggestions: state.suggestions,
    isLoading: state.isLoading,
    error: state.error,
    formType: state.formType,
    generateSuggestions,
    clearSuggestions,
  };
};
