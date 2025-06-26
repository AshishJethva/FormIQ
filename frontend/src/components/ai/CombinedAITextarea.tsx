'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useAISuggestions } from '@/hooks/useAISuggestions';

interface AnimatedMessage {
  text: string;
  delay?: number;
}

interface CombinedAITextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
  messages?: AnimatedMessage[];
}

const defaultMessages: AnimatedMessage[] = [
  {
    text: 'I want to build a comprehensive job application form for my company with sections for personal information, work experience, education background, skills assessment, and professional references with document upload capabilities',
    delay: 42,
  },
  {
    text: 'I want to create a detailed student event registration form with participant information, emergency contacts, dietary preferences, accommodation requirements, payment processing, and event-specific questionnaires',
    delay: 45,
  },
  {
    text: 'I want to build an advanced customer feedback form for my business with multi-level satisfaction ratings, service quality evaluation, improvement suggestions, detailed comment sections, and recommendation scoring',
    delay: 48,
  },
  {
    text: 'I want to create an interactive quiz assessment form with automatic scoring featuring multiple choice questions, true false statements, fill-in-the-blank sections, image-based questions, and instant results calculation',
    delay: 44,
  },
  {
    text: 'I want to build a comprehensive market research survey form with demographic questions, preference ratings, behavioral analysis, brand awareness assessment, competitor comparison, and statistical data collection',
    delay: 46,
  },
  {
    text: 'I want to create a professional contact form for website visitors with inquiry categorization, urgency levels, file attachment options, automated response system, and department routing capabilities',
    delay: 43,
  },
  {
    text: 'I want to build a medical patient intake form with comprehensive health history, current medications, allergy information, insurance details, emergency contacts, symptom descriptions, and appointment scheduling',
    delay: 47,
  },
  {
    text: 'I want to create a booking reservation form with date and time selection, service categories, customer details, special requests, payment processing, cancellation policies, and confirmation notifications',
    delay: 45,
  },
];

export const CombinedAITextarea: React.FC<CombinedAITextareaProps> = ({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className,
  disabled,
  maxLength,
  messages = defaultMessages,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // AI Suggestions state
  const [cursorPosition, setCursorPosition] = useState(0);
  const [currentSuggestion, setCurrentSuggestion] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [lastAcceptedPosition, setLastAcceptedPosition] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [lastSuggestionTextLength, setLastSuggestionTextLength] = useState(0);
  const [isFormContent, setIsFormContent] = useState(true);

  // Animated Placeholder state
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [hasUserTyped, setHasUserTyped] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Form content detection
  const detectFormContent = useCallback((text: string): boolean => {
    const lowerText = text.toLowerCase();

    // Strong form indicators
    const formKeywords = [
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
    ];

    const strongFormIndicators = [
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
      'application form',
      'registration form',
      'contact form',
      'feedback form',
      'survey form',
      'quiz form',
      'booking form',
    ];

    // Check for strong indicators first
    const hasStrongIndicator = strongFormIndicators.some(indicator =>
      lowerText.includes(indicator)
    );

    if (hasStrongIndicator) return true;

    // Check for form keywords
    const keywordCount = formKeywords.filter(keyword =>
      lowerText.includes(keyword)
    ).length;

    // Non-form patterns to avoid
    const nonFormPatterns = [
      /\b(website|webpage|blog|article|video|music|game|social media|marketing|business strategy|company|startup|app|software|platform|system|database)\b/,
      /\b(create (a company|a business|a startup|an organization|a team|a brand|a logo|a presentation))\b/,
      /\b(build (an app|a website|a platform|software|a system|a business))\b/,
      /\b(write (a book|an article|content|copy|text|a story|a blog))\b/,
    ];

    const hasNonFormPattern = nonFormPatterns.some(pattern =>
      pattern.test(lowerText)
    );

    return keywordCount >= 1 && !hasNonFormPattern;
  }, []);

  const removeAllQuotes = useCallback((text: string): string => {
    if (!text) return '';

    return text
      .replace(/'/g, '')
      .replace(/'/g, '')
      .replace(/'/g, '')
      .replace(/"/g, '')
      .replace(/"/g, '')
      .replace(/"/g, '')
      .replace(/`/g, '')
      .replace(/["""''`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  // Extract suggestion text function with quote removal
  const extractSuggestionText = useCallback(
    (suggestion: string, userText: string): string => {
      if (!suggestion || !userText) return '';

      const cleanSuggestion = removeAllQuotes(suggestion)
        .replace(/^[\s]+|[\s]+$/g, '')
        .replace(/\.{3,}/g, '')
        .trim();

      const userTextTrimmed = userText.trim();
      const suggestionLower = cleanSuggestion.toLowerCase();
      const userTextLower = userTextTrimmed.toLowerCase();

      // Direct continuation
      if (!suggestionLower.includes(userTextLower)) {
        return cleanSuggestion;
      }

      // AI repeats user text + continuation
      if (suggestionLower.includes(userTextLower)) {
        const userTextIndex = suggestionLower.indexOf(userTextLower);
        if (userTextIndex !== -1) {
          const extractedPart = cleanSuggestion
            .substring(userTextIndex + userTextTrimmed.length)
            .trim();
          if (extractedPart.length > 3) {
            return extractedPart;
          }
        }
      }

      // Word overlap detection
      const userWords = userTextTrimmed.split(' ').filter(w => w.length > 0);
      const suggestionWords = cleanSuggestion
        .split(' ')
        .filter(w => w.length > 0);

      let bestExtraction = '';
      let maxOverlapLength = 0;

      for (
        let i = 1;
        i <= Math.min(userWords.length, suggestionWords.length);
        i++
      ) {
        const userSuffix = userWords.slice(-i).join(' ').toLowerCase();
        const suggestionPrefix = suggestionWords
          .slice(0, i)
          .join(' ')
          .toLowerCase();

        if (userSuffix === suggestionPrefix) {
          const extraction = suggestionWords.slice(i).join(' ');
          if (extraction.length > maxOverlapLength) {
            maxOverlapLength = extraction.length;
            bestExtraction = extraction;
          }
        }
      }

      if (bestExtraction.length > 3) {
        return bestExtraction.trim();
      }

      // Fallback for continuation words
      const continuationWords = [
        'with',
        'and',
        'for',
        'including',
        'featuring',
        'containing',
        'that',
        'which',
        'having',
        'providing',
      ];

      const startsWithContinuation = continuationWords.some(word =>
        suggestionLower.startsWith(word + ' ')
      );

      if (
        startsWithContinuation &&
        cleanSuggestion.length > userTextTrimmed.length
      ) {
        return cleanSuggestion;
      }

      return cleanSuggestion.length > 3 ? cleanSuggestion : '';
    },
    [removeAllQuotes]
  );

  const handleSuggestionAccepted = useCallback(
    (suggestion: string) => {
      if (!textareaRef.current) return;

      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const beforeCursor = value.substring(0, start);
      const afterCursor = value.substring(end);

      const cleanedSuggestion = removeAllQuotes(suggestion);
      const suggestionToAdd = extractSuggestionText(
        cleanedSuggestion,
        beforeCursor
      );

      if (!suggestionToAdd || suggestionToAdd.length < 2) {
        setCurrentSuggestion('');
        setShowSuggestion(false);
        return;
      }

      const needsSpace =
        beforeCursor.length > 0 &&
        !beforeCursor.endsWith(' ') &&
        !suggestionToAdd.startsWith(' ');

      const separator = needsSpace ? ' ' : '';
      const newText = beforeCursor + separator + suggestionToAdd + afterCursor;
      const newCursorPosition =
        beforeCursor.length + separator.length + suggestionToAdd.length;

      setLastAcceptedPosition(newCursorPosition);
      setLastSuggestionTextLength(newText.length);

      const syntheticEvent = {
        target: { value: newText },
      } as React.ChangeEvent<HTMLTextAreaElement>;

      onChange(syntheticEvent);
      setCurrentSuggestion('');
      setShowSuggestion(false);

      setTimeout(() => {
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(newCursorPosition, newCursorPosition);
        }
      }, 0);
    },
    [value, onChange, extractSuggestionText, removeAllQuotes]
  );

  const { suggestions, isLoading, generateSuggestions, clearSuggestions } =
    useAISuggestions();

  useEffect(() => {
    if (suggestions.length > 0) {
      const suggestion = suggestions[0];
      const cleanedSuggestion = removeAllQuotes(suggestion).trim();

      if (cleanedSuggestion.length > 2) {
        setCurrentSuggestion(cleanedSuggestion);
        setShowSuggestion(true);
      } else {
        setCurrentSuggestion('');
        setShowSuggestion(false);
      }
    } else {
      setCurrentSuggestion('');
      setShowSuggestion(false);
    }
  }, [suggestions, removeAllQuotes]);

  const getSuggestionDisplay = useCallback(() => {
    if (!showSuggestion || !currentSuggestion || !textareaRef.current) {
      return { beforeSuggestion: '', suggestionText: '', afterSuggestion: '' };
    }

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const beforeCursor = value.substring(0, start);
    const afterCursor = value.substring(start);

    let suggestionToShow = removeAllQuotes(
      extractSuggestionText(currentSuggestion, beforeCursor)
    );

    if (!suggestionToShow || suggestionToShow.length < 3) {
      return { beforeSuggestion: '', suggestionText: '', afterSuggestion: '' };
    }

    // Word count limiting for 500 words max
    const totalWords = value
      .split(/\s+/)
      .filter(word => word.length > 0).length;
    const maxAllowedWords = 500;

    if (totalWords >= maxAllowedWords) {
      return { beforeSuggestion: '', suggestionText: '', afterSuggestion: '' };
    }

    const remainingWords = maxAllowedWords - totalWords;
    const suggestionWords = suggestionToShow
      .split(' ')
      .filter(w => w.length > 0);

    const scrollTop = textarea.scrollTop;
    const lineHeight = 24;
    const fourLinesHeight = lineHeight * 4;

    // Calculate cursor position
    const textLines = beforeCursor.split('\n');
    const lineNumber = textLines.length;
    const estimatedCursorTop = (lineNumber - 1) * lineHeight;
    const cursorViewportPosition = estimatedCursorTop - scrollTop;

    // Hide suggestions if cursor is beyond 4 lines
    if (
      estimatedCursorTop >= fourLinesHeight &&
      cursorViewportPosition >= fourLinesHeight
    ) {
      return { beforeSuggestion: '', suggestionText: '', afterSuggestion: '' };
    }

    // Calculate remaining space within 4-line boundary
    const remainingSpace = fourLinesHeight - cursorViewportPosition;
    const maxVisibleLines = Math.max(
      0,
      Math.floor(remainingSpace / lineHeight)
    );

    // Limit suggestion words based on available space
    let maxDisplayWords = Math.min(suggestionWords.length, remainingWords, 15);

    if (maxVisibleLines <= 1) {
      maxDisplayWords = Math.min(maxDisplayWords, 6);
    } else if (maxVisibleLines <= 2) {
      maxDisplayWords = Math.min(maxDisplayWords, 10);
    }

    if (maxDisplayWords >= 3) {
      suggestionToShow = suggestionWords.slice(0, maxDisplayWords).join(' ');
    } else {
      return { beforeSuggestion: '', suggestionText: '', afterSuggestion: '' };
    }

    // Check if we need space
    const lastChar = beforeCursor.slice(-1);
    const firstSuggestionChar = suggestionToShow.charAt(0);

    const needsSpace =
      beforeCursor.length > 0 &&
      lastChar !== ' ' &&
      firstSuggestionChar !== ' ' &&
      /[a-zA-Z0-9]/.test(lastChar);

    const separator = needsSpace ? ' ' : '';

    return {
      beforeSuggestion: beforeCursor + separator,
      suggestionText: suggestionToShow,
      afterSuggestion: afterCursor,
    };
  }, [
    showSuggestion,
    currentSuggestion,
    value,
    extractSuggestionText,
    removeAllQuotes,
  ]);

  // Animated Placeholder functionality
  useEffect(() => {
    if (!showPlaceholder || hasUserTyped) return;

    const currentMessage = messages[currentMessageIndex];
    const targetText = currentMessage.text;
    const typingSpeed = currentMessage.delay || 50;

    setIsTyping(true);
    setDisplayedText('');

    let charIndex = 0;

    const typeChar = () => {
      if (charIndex < targetText.length) {
        setDisplayedText(targetText.substring(0, charIndex + 1));
        charIndex++;
        typingTimeoutRef.current = setTimeout(typeChar, typingSpeed);
      } else {
        setIsTyping(false);
        messageTimeoutRef.current = setTimeout(() => {
          setCurrentMessageIndex(prev => (prev + 1) % messages.length);
        }, 100);
      }
    };

    typingTimeoutRef.current = setTimeout(typeChar, 100);

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    };
  }, [currentMessageIndex, showPlaceholder, hasUserTyped, messages]);

  useEffect(() => {
    if (value.length === 0 && hasUserTyped) {
      setHasUserTyped(false);
      setShowPlaceholder(true);
      setCurrentMessageIndex(0);
    }
  }, [value.length, hasUserTyped]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);

    if (overlayRef.current) {
      requestAnimationFrame(() => {
        const overlayInner = overlayRef.current?.querySelector(
          '.suggestion-inner'
        ) as HTMLDivElement;
        if (overlayInner) {
          overlayInner.style.transform = `translateY(-${newScrollTop}px)`;
        }
      });
    }
  }, []);

  const shouldTriggerSuggestion = useCallback(
    (newValue: string, newCursorPosition: number): boolean => {
      // First check if content is form-related
      if (!detectFormContent(newValue)) {
        return false;
      }

      const isAtEnd = newCursorPosition === newValue.length;
      const textLength = newValue.length;

      // Always trigger if at the end and typing
      if (isAtEnd && textLength > value.length) {
        return true;
      }

      // Trigger if user has modified accepted suggestion and is at the end
      if (isAtEnd && textLength !== lastSuggestionTextLength) {
        const changesSinceLastAccepted = Math.abs(
          newCursorPosition - lastAcceptedPosition
        );
        const changesSinceLastSuggestion = Math.abs(
          textLength - lastSuggestionTextLength
        );

        if (changesSinceLastAccepted >= 3 || changesSinceLastSuggestion >= 2) {
          return true;
        }
      }

      // Trigger for new users
      if (isAtEnd && lastAcceptedPosition === 0 && textLength > 5) {
        return true;
      }

      return false;
    },
    [
      value.length,
      lastAcceptedPosition,
      lastSuggestionTextLength,
      detectFormContent,
    ]
  );

  // Event handlers
  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const newCursorPosition = e.target.selectionStart;

      if (!hasUserTyped && newValue.length > 0) {
        setHasUserTyped(true);
        setShowPlaceholder(false);
      }

      // Update form content detection
      const isFormRelated = detectFormContent(newValue);
      setIsFormContent(isFormRelated);

      onChange(e);
      setCursorPosition(newCursorPosition);

      if (shouldTriggerSuggestion(newValue, newCursorPosition)) {
        generateSuggestions(newValue, newCursorPosition);
        setLastSuggestionTextLength(newValue.length);
      } else if (newValue.length === 0) {
        setLastAcceptedPosition(0);
        setLastSuggestionTextLength(0);
        clearSuggestions();
        setShowSuggestion(false);
      } else if (newCursorPosition !== newValue.length || !isFormRelated) {
        clearSuggestions();
        setShowSuggestion(false);
      }
    },
    [
      onChange,
      hasUserTyped,
      shouldTriggerSuggestion,
      generateSuggestions,
      clearSuggestions,
      detectFormContent,
    ]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!hasUserTyped && e.key.length === 1) {
        setHasUserTyped(true);
        setShowPlaceholder(false);
      }

      if (showSuggestion && currentSuggestion) {
        switch (e.key) {
          case 'Tab':
          case 'ArrowRight':
            if (e.key === 'Tab' || (e.key === 'ArrowRight' && e.ctrlKey)) {
              e.preventDefault();
              handleSuggestionAccepted(currentSuggestion);
              return;
            }
            break;
          case 'Escape':
            setCurrentSuggestion('');
            setShowSuggestion(false);
            clearSuggestions();
            return;
        }
      }

      if (onKeyDown) {
        onKeyDown(e);
      }
    },
    [
      showSuggestion,
      currentSuggestion,
      handleSuggestionAccepted,
      clearSuggestions,
      onKeyDown,
      hasUserTyped,
    ]
  );

  const handleFocus = () => {
    const isAtEnd = cursorPosition === value.length;
    if (value.trim().length > 0 && isAtEnd && detectFormContent(value)) {
      if (shouldTriggerSuggestion(value, cursorPosition)) {
        generateSuggestions(value, cursorPosition);
        setLastSuggestionTextLength(value.length);
      }
    }
  };

  const handleClick = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const newCursorPosition = textarea.selectionStart;
      setCursorPosition(newCursorPosition);

      const isAtEnd = newCursorPosition === value.length;
      if (value.trim().length > 0 && isAtEnd && detectFormContent(value)) {
        if (shouldTriggerSuggestion(value, newCursorPosition)) {
          generateSuggestions(value, newCursorPosition);
          setLastSuggestionTextLength(value.length);
        }
      } else {
        clearSuggestions();
        setShowSuggestion(false);
      }
    }
  };

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setCurrentSuggestion('');
      setShowSuggestion(false);
      clearSuggestions();
    }, 150);
  }, [clearSuggestions]);

  const { beforeSuggestion, suggestionText } = getSuggestionDisplay();

  return (
    <div ref={containerRef} className='relative'>
      {/* Hidden measurer */}
      <div
        ref={measureRef}
        className='absolute invisible pointer-events-none'
        style={{
          top: 0,
          left: 0,
          zIndex: -1,
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          overflow: 'hidden',
          resize: 'none',
        }}
        aria-hidden='true'
      />

      {/* Animated Placeholder Overlay */}
      {showPlaceholder && !hasUserTyped && value.length === 0 && (
        <div
          className='absolute inset-0 pointer-events-none flex items-start'
          style={{
            padding: '12px 12px',
            fontSize: 'inherit',
            lineHeight: 'inherit',
            fontFamily: 'inherit',
            zIndex: 10,
          }}
        >
          <span className='text-[#6C73A8] select-none leading-relaxed'>
            {displayedText}
            {isTyping && (
              <span className='animate-pulse text-[#6C73A8] ml-1'>|</span>
            )}
          </span>
        </div>
      )}

      {/* AI Suggestions Overlay with 4-line boundary control */}
      {showSuggestion && suggestionText && isFormContent && (
        <div
          ref={overlayRef}
          className='absolute pointer-events-none'
          style={{
            top: '12px',
            left: '12px',
            right: '12px',
            height: '96px',
            fontSize: 'inherit',
            lineHeight: 'inherit',
            fontFamily: 'inherit',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflow: 'hidden',
            zIndex: 5,
            clipPath: 'inset(0px)',
          }}
        >
          <div
            className='suggestion-inner'
            style={{
              transform: `translateY(-${scrollTop}px)`,
              width: '100%',
              minHeight: `${Math.max(
                (textareaRef.current?.scrollHeight || 200) - 24,
                200
              )}px`,
              transition: 'transform 0.1s ease-out',
            }}
          >
            {/* Invisible text up to cursor */}
            <span
              style={{
                opacity: 0,
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                fontSize: 'inherit',
                lineHeight: 'inherit',
                fontFamily: 'inherit',
                letterSpacing: 'inherit',
                wordSpacing: 'inherit',
              }}
            >
              {beforeSuggestion}
            </span>
            {/* Visible suggestion text */}
            <span
              style={{
                color: '#9CA3AF',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                fontSize: 'inherit',
                lineHeight: 'inherit',
                fontFamily: 'inherit',
                letterSpacing: 'inherit',
                wordSpacing: 'inherit',
                display: 'inline',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                boxShadow: 'none',
                maxWidth: '100%',
                overflowWrap: 'break-word',
              }}
            >
              {removeAllQuotes(suggestionText)}
            </span>
          </div>
        </div>
      )}

      {/* Main textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleClick}
        onScroll={handleScroll}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        maxLength={maxLength}
        style={{
          caretColor: 'rgb(17, 24, 39)',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          overflow: 'auto',
          background: 'transparent',
          resize: 'none',
          position: 'relative',
          zIndex: 10,
          scrollBehavior: 'smooth',
        }}
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className='absolute top-2 right-2' style={{ zIndex: 20 }}>
          <div className='w-4 h-4 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin'></div>
        </div>
      )}

      <div className='absolute -bottom-6 left-0 text-xs text-gray-500 flex items-center gap-2'>
        <span>💡 Tab to accept</span>
        <span>•</span>
        <span>Esc to dismiss</span>
        {showSuggestion && suggestionText && (
          <>
            <span>•</span>
            <span>
              {removeAllQuotes(suggestionText).split(' ').length} words
            </span>
          </>
        )}
      </div>
    </div>
  );
};
