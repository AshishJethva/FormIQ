// src/hooks/useAISuggestions.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { apiConfig } from '@/config/api';

interface SuggestionState {
  suggestions: string[];
  isLoading: boolean;
  error: string | null;
}

interface UseAISuggestionsReturn {
  suggestions: string[];
  isLoading: boolean;
  error: string | null;
  generateSuggestions: (text: string, cursorPosition: number) => void;
  clearSuggestions: () => void;
}

export const useAISuggestions = (): UseAISuggestionsReturn => {
  const [state, setState] = useState<SuggestionState>({
    suggestions: [],
    isLoading: false,
    error: null,
  });

  const abortController = useRef<AbortController | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const extractContext = useCallback((text: string, cursorPosition: number) => {
    const beforeCursor = text.substring(0, cursorPosition);
    const afterCursor = text.substring(cursorPosition);

    const lastWordMatch = beforeCursor.match(/\b(\w*)$/);
    const lastWord = lastWordMatch ? lastWordMatch[1] : '';

    // Get last 80 characters for context
    const contextStart = Math.max(0, cursorPosition - 80);
    const context = beforeCursor.substring(contextStart);

    return {
      context,
      lastWord,
      beforeCursor,
      afterCursor,
      isAtWordEnd: /\s$/.test(beforeCursor) || beforeCursor.length === 0,
    };
  }, []);

  // FIXED: Clean fallback suggestions without ellipsis
  const getFastFallbackSuggestions = useCallback(
    (text: string, cursorPosition: number): string[] => {
      const beforeCursor = text
        .substring(0, cursorPosition)
        .toLowerCase()
        .trim();

      // FIXED: Clean, complete suggestions without truncation
      const suggestionMap = new Map([
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

        // ADDED: More specific continuations
        ['feedback form with', 'rating scales and detailed comment sections'],
        ['registration form with', 'user verification and contact information'],
        ['application form with', 'file uploads and personal details'],
        ['survey form with', 'multiple choice and rating questions'],
        ['contact form with', 'name email phone and message fields'],
        ['quiz form with', 'multiple choice questions and automatic scoring'],
        ['booking form with', 'date selection and customer details'],

        // ADDED: Common continuation patterns
        ['with rating scales', 'and detailed comment sections for feedback'],
        ['with multiple choice', 'questions and automatic scoring system'],
        ['with file uploads', 'and personal information collection fields'],
        ['with user verification', 'and secure login authentication system'],
        ['with contact details', 'and communication preference settings'],
        ['with date selection', 'and time slot booking options'],
      ]);

      // Check exact matches first
      for (const [key, value] of suggestionMap) {
        if (beforeCursor.endsWith(key) || beforeCursor.endsWith(key + ' ')) {
          return [value];
        }
      }

      // FIXED: Clean keyword fallbacks
      const keywordMap = new Map([
        ['feedback', 'with detailed comment sections and rating scales'],
        ['quiz', 'with multiple choice questions and automatic scoring'],
        ['survey', 'with rating scales and demographic questions'],
        ['application', 'with file uploads and personal information fields'],
        ['contact', 'with inquiry categories and message areas'],
        ['registration', 'with user verification and contact information'],
        ['booking', 'with date selection and customer details'],
        ['customer', 'feedback form with satisfaction ratings and comments'],
        ['rating', 'scales and detailed comment sections'],
        ['multiple', 'choice questions with automatic scoring'],
        ['choice', 'questions with clear answer options'],
        ['upload', 'functionality for documents and files'],
        ['verification', 'system with secure authentication'],
        ['selection', 'options with clear categories'],
      ]);

      for (const [keyword, suggestion] of keywordMap) {
        if (beforeCursor.includes(keyword)) {
          return [suggestion];
        }
      }

      return ['with custom fields and validation rules'];
    },
    []
  );

  const generateSuggestions = useCallback(
    async (text: string, cursorPosition: number) => {
      const beforeCursor = text.substring(0, cursorPosition);
      const lastChar = beforeCursor.slice(-1);

      // Check if we should trigger
      if (
        lastChar &&
        lastChar !== ' ' &&
        !beforeCursor.endsWith('. ') &&
        beforeCursor.length > 0
      ) {
        const triggers = new Set([
          'i want to',
          'create a',
          'i need a',
          'build a',
          'make a',
          'design a',
          'generate a',
          'i want to create',
          'i need to build',
          'i want to make',
          'build a customer',
          'create a customer',
          'make a customer',
          'with',
          'and',
          'including',
          'featuring',
        ]);

        const lowerText = beforeCursor.toLowerCase().trim();
        const shouldTrigger = Array.from(triggers).some(
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

      // FIXED: Immediate response for better UX
      debounceTimer.current = setTimeout(async () => {
        try {
          setState(prev => ({ ...prev, isLoading: true, error: null }));

          abortController.current = new AbortController();

          const { context } = extractContext(text, cursorPosition);

          const token = localStorage.getItem('token');
          if (!token) {
            const fallbackSuggestions = getFastFallbackSuggestions(
              text,
              cursorPosition
            );
            setState(prev => ({
              ...prev,
              suggestions: fallbackSuggestions,
              isLoading: false,
            }));
            return;
          }

          const response = await axios.post(
            `${apiConfig.url}/ai/suggestions`,
            {
              text,
              cursorPosition,
              context,
              maxLength: 80, // Keep short for 8-10 words
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

          const { suggestions = [] } = response.data.data || {};

          // FIXED: Clean suggestions and remove any ellipsis completely
          const cleanedSuggestions = suggestions
            .map((s: string) => s.replace(/^['"`\s]+|['"`\s]+$/g, '').trim())
            .map((s: string) => {
              // FIXED: Remove any ellipsis patterns completely
              return s
                .replace(/\.{3,}/g, '')
                .replace(/…/g, '')
                .trim();
            })
            .filter((s: string) => {
              const words = s.split(' ').filter(w => w.length > 0);
              return words.length >= 3 && words.length <= 12 && s.length > 10;
            })
            .map((s: string) => {
              // FIXED: Ensure max 10 words without any truncation symbols
              const words = s.split(' ').filter(w => w.length > 0);
              const limitedWords = words.slice(0, 10);
              return limitedWords.join(' ');
            });

          console.log('🔧 Cleaned suggestions:', cleanedSuggestions);

          setState(prev => ({
            ...prev,
            suggestions: cleanedSuggestions.slice(0, 1),
            isLoading: false,
          }));
        } catch (error: any) {
          if (error.name === 'AbortError' || axios.isCancel(error)) {
            return;
          }

          console.error('AI suggestion generation failed:', error);

          const fallbackSuggestions = getFastFallbackSuggestions(
            text,
            cursorPosition
          );

          setState(prev => ({
            ...prev,
            suggestions: fallbackSuggestions.slice(0, 1),
            isLoading: false,
            error: null,
          }));
        }
      }, 20); // FIXED: Very fast response
    },
    [extractContext, getFastFallbackSuggestions]
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
    generateSuggestions,
    clearSuggestions,
  };
};
