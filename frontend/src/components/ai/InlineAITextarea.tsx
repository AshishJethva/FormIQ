// src/components/ai/InlineAITextarea.tsx

'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useAISuggestions } from '@/hooks/useAISuggestions';

interface InlineAITextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
}

export const InlineAITextarea: React.FC<InlineAITextareaProps> = ({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className,
  disabled,
  maxLength,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [currentSuggestion, setCurrentSuggestion] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [lastAcceptedPosition, setLastAcceptedPosition] = useState(0);

  // FIXED: Clean suggestion extraction - never returns "..."
  const extractSuggestionText = useCallback(
    (suggestion: string, userText: string): string => {
      if (!suggestion || !userText) return '';

      // FIXED: Clean suggestion and remove any ellipsis
      const cleanSuggestion = suggestion
        .replace(/^['"`\s]+|['"`\s]+$/g, '')
        .replace(/^["']|["']$/g, '')
        .replace(/\.{3,}/g, '') // FIXED: Remove any ellipsis
        .trim();

      const userTextTrimmed = userText.trim();
      const suggestionLower = cleanSuggestion.toLowerCase();
      const userTextLower = userTextTrimmed.toLowerCase();

      console.log('🔧 Extraction Input:');
      console.log('User text:', `"${userTextTrimmed}"`);
      console.log('Original suggestion:', `"${suggestion}"`);
      console.log('Cleaned suggestion:', `"${cleanSuggestion}"`);

      // CASE 1: Direct continuation (AI suggests something completely new)
      if (!suggestionLower.includes(userTextLower)) {
        console.log('✅ Direct continuation - using as is');
        return cleanSuggestion;
      }

      // CASE 2: AI repeats user text + continuation
      if (suggestionLower.includes(userTextLower)) {
        const userTextIndex = suggestionLower.indexOf(userTextLower);
        if (userTextIndex !== -1) {
          const extractedPart = cleanSuggestion
            .substring(userTextIndex + userTextTrimmed.length)
            .trim();

          console.log('✅ Extracted after user text:', `"${extractedPart}"`);

          // FIXED: Only return if we have substantial content
          if (extractedPart.length > 3) {
            return extractedPart;
          }
        }
      }

      // CASE 3: Word-by-word overlap detection (more sophisticated)
      const userWords = userTextTrimmed.split(' ').filter(w => w.length > 0);
      const suggestionWords = cleanSuggestion
        .split(' ')
        .filter(w => w.length > 0);

      // FIXED: Try to find the best overlap point
      let bestExtraction = '';
      let maxOverlapLength = 0;

      // Check for word overlap from the end of user text
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
        console.log('✅ Word overlap extraction:', `"${bestExtraction}"`);
        return bestExtraction.trim();
      }

      // CASE 4: Fallback - check if suggestion starts with a logical continuation word
      const continuationWords = [
        'with',
        'and',
        'for',
        'including',
        'featuring',
        'containing',
        'that',
        'which',
      ];
      const startsWithContinuation = continuationWords.some(word =>
        suggestionLower.startsWith(word + ' ')
      );

      if (
        startsWithContinuation &&
        cleanSuggestion.length > userTextTrimmed.length
      ) {
        console.log('✅ Logical continuation detected');
        return cleanSuggestion;
      }

      // FINAL FALLBACK: If all else fails, return clean suggestion
      // This ensures we never return empty or "..." content
      console.log('⚠️ Fallback: using cleaned suggestion');
      return cleanSuggestion.length > 3 ? cleanSuggestion : '';
    },
    []
  );

  const handleSuggestionAccepted = useCallback(
    (suggestion: string) => {
      if (!textareaRef.current) return;

      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const beforeCursor = value.substring(0, start);
      const afterCursor = value.substring(end);
      const suggestionToAdd = extractSuggestionText(suggestion, beforeCursor);

      if (!suggestionToAdd || suggestionToAdd.length < 2) {
        setCurrentSuggestion('');
        setShowSuggestion(false);
        return;
      }

      const needsSpace = beforeCursor.length > 0 && !beforeCursor.endsWith(' ');
      const separator = needsSpace ? ' ' : '';
      const newText = beforeCursor + separator + suggestionToAdd + afterCursor;
      const newCursorPosition =
        beforeCursor.length + separator.length + suggestionToAdd.length;

      setLastAcceptedPosition(newCursorPosition);

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
    [value, onChange, extractSuggestionText]
  );

  const { suggestions, isLoading, generateSuggestions, clearSuggestions } =
    useAISuggestions();

  useEffect(() => {
    if (suggestions.length > 0) {
      const suggestion = suggestions[0];
      const cleanedSuggestion = suggestion
        .replace(/^['"`\s]+|['"`\s]+$/g, '')
        .replace(/^["']|["']$/g, '')
        .trim();

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
  }, [suggestions]);

  // COMPLETELY FIXED: Precise overflow prevention using hidden measurer
  const getSuggestionDisplay = useCallback(() => {
    if (
      !showSuggestion ||
      !currentSuggestion ||
      !textareaRef.current ||
      !measureRef.current
    ) {
      return { beforeSuggestion: '', suggestionText: '', afterSuggestion: '' };
    }

    const textarea = textareaRef.current;
    const measurer = measureRef.current;
    const start = textarea.selectionStart;
    const beforeCursor = value.substring(0, start);
    const afterCursor = value.substring(start);

    let suggestionToShow = extractSuggestionText(
      currentSuggestion,
      beforeCursor
    );

    try {
      // Copy exact textarea styles to measurer for precise calculation
      const textareaStyles = getComputedStyle(textarea);
      const copyProps = [
        'fontFamily',
        'fontSize',
        'fontWeight',
        'lineHeight',
        'letterSpacing',
        'wordSpacing',
        'padding',
        'border',
        'boxSizing',
        'width',
      ];

      copyProps.forEach(prop => {
        measurer.style[prop as any] = textareaStyles[prop as any];
      });

      measurer.style.position = 'absolute';
      measurer.style.visibility = 'hidden';
      measurer.style.height = 'auto';
      measurer.style.maxHeight = 'none';
      measurer.style.whiteSpace = 'pre-wrap';
      measurer.style.wordWrap = 'break-word';
      measurer.style.overflow = 'hidden';

      // Get textarea's exact dimensions and scroll state
      const paddingTop = parseInt(textareaStyles.paddingTop) || 12;
      const paddingBottom = parseInt(textareaStyles.paddingBottom) || 12;
      const borderTop = parseInt(textareaStyles.borderTopWidth) || 1;
      const borderBottom = parseInt(textareaStyles.borderBottomWidth) || 1;

      // FIXED: Calculate exact available space considering scroll and max-height
      const textareaMaxHeight = parseInt(textareaStyles.maxHeight) || 200; // Default from CSS
      const textareaCurrentHeight = textarea.offsetHeight;
      const scrollTop = textarea.scrollTop;

      // Available content area
      const contentAreaHeight =
        Math.min(textareaMaxHeight, textareaCurrentHeight) -
        paddingTop -
        paddingBottom -
        borderTop -
        borderBottom;

      // Calculate visible bottom boundary
      const visibleContentBottom = scrollTop + contentAreaHeight;

      // Measure current text height up to cursor
      measurer.textContent = beforeCursor;
      const beforeCursorHeight =
        measurer.offsetHeight - paddingTop - paddingBottom;

      // Calculate available space for suggestion
      const availableSpace = Math.max(
        0,
        visibleContentBottom - beforeCursorHeight
      );

      // If less than 1 line of space available, don't show suggestion
      const lineHeight = parseInt(textareaStyles.lineHeight) || 20;
      if (availableSpace < lineHeight * 0.8) {
        return {
          beforeSuggestion: '',
          suggestionText: '',
          afterSuggestion: '',
        };
      }

      // Test if full suggestion fits
      const needsSpace = beforeCursor.length > 0 && !beforeCursor.endsWith(' ');
      const separator = needsSpace ? ' ' : '';
      const testText = beforeCursor + separator + suggestionToShow;

      measurer.textContent = testText;
      const testHeight = measurer.offsetHeight - paddingTop - paddingBottom;

      // If suggestion fits within visible area, use it as is
      if (testHeight <= visibleContentBottom) {
        const words = suggestionToShow.split(' ').filter(w => w.length > 0);
        if (words.length <= 10) {
          return {
            beforeSuggestion: beforeCursor + separator,
            suggestionText: suggestionToShow,
            afterSuggestion: afterCursor,
          };
        } else {
          // Limit to 10 words even if it fits
          suggestionToShow = words.slice(0, 10).join(' ');
        }
      } else {
        // Binary search to find maximum suggestion that fits
        const words = suggestionToShow.split(' ').filter(w => w.length > 0);
        let maxWords = Math.min(words.length, 10);
        let minWords = 3;
        let bestWordCount = minWords;

        while (minWords <= maxWords) {
          const testWordCount = Math.floor((minWords + maxWords) / 2);
          const testSuggestion = words.slice(0, testWordCount).join(' ');
          const testTextWithSuggestion =
            beforeCursor + separator + testSuggestion;

          measurer.textContent = testTextWithSuggestion;
          const testTextHeight =
            measurer.offsetHeight - paddingTop - paddingBottom;

          if (testTextHeight <= visibleContentBottom) {
            bestWordCount = testWordCount;
            minWords = testWordCount + 1;
          } else {
            maxWords = testWordCount - 1;
          }
        }

        if (bestWordCount >= 3) {
          suggestionToShow = words.slice(0, bestWordCount).join(' ');
        } else {
          // If even 3 words don't fit, don't show suggestion
          return {
            beforeSuggestion: '',
            suggestionText: '',
            afterSuggestion: '',
          };
        }
      }

      console.log('📏 Overflow calculation:');
      console.log('Available space:', availableSpace);
      console.log('Test height:', testHeight);
      console.log('Visible bottom:', visibleContentBottom);
      console.log(
        'Final suggestion words:',
        suggestionToShow.split(' ').length
      );
    } catch (error) {
      console.error('Error in overflow calculation:', error);
      // Fallback: simple word limiting
      const words = suggestionToShow.split(' ').filter(w => w.length > 0);
      if (words.length > 8) {
        suggestionToShow = words.slice(0, 8).join(' ');
      }
    }

    const needsSpace =
      beforeCursor.length > 0 &&
      !beforeCursor.endsWith(' ') &&
      suggestionToShow.length > 0;
    const separator = needsSpace ? ' ' : '';

    return {
      beforeSuggestion: beforeCursor + separator,
      suggestionText: suggestionToShow,
      afterSuggestion: afterCursor,
    };
  }, [showSuggestion, currentSuggestion, value, extractSuggestionText]);

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const newCursorPosition = e.target.selectionStart;

      onChange(e);
      setCursorPosition(newCursorPosition);

      const isAtEnd = newCursorPosition === newValue.length;

      if (isAtEnd && newValue.length > value.length) {
        const distanceFromLastAccepted =
          newCursorPosition - lastAcceptedPosition;

        const shouldTriggerNewSuggestion =
          distanceFromLastAccepted >= 1 ||
          lastAcceptedPosition === 0 ||
          newValue.length < 10;

        if (shouldTriggerNewSuggestion) {
          generateSuggestions(newValue, newCursorPosition);
        }
      } else if (newValue.length === 0) {
        setLastAcceptedPosition(0);
        clearSuggestions();
        setShowSuggestion(false);
      } else if (!isAtEnd) {
        clearSuggestions();
        setShowSuggestion(false);
      }
    },
    [
      onChange,
      value.length,
      lastAcceptedPosition,
      generateSuggestions,
      clearSuggestions,
    ]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
    ]
  );

  const handleFocus = useCallback(() => {
    const isAtEnd = cursorPosition === value.length;
    if (value.trim().length > 0 && isAtEnd) {
      const distanceFromLastAccepted = cursorPosition - lastAcceptedPosition;
      if (distanceFromLastAccepted >= 1 || lastAcceptedPosition === 0) {
        generateSuggestions(value, cursorPosition);
      }
    }
  }, [value, cursorPosition, lastAcceptedPosition, generateSuggestions]);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setCurrentSuggestion('');
      setShowSuggestion(false);
      clearSuggestions();
    }, 150);
  }, [clearSuggestions]);

  const handleClick = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const newCursorPosition = textarea.selectionStart;
      setCursorPosition(newCursorPosition);

      const isAtEnd = newCursorPosition === value.length;
      if (value.trim().length > 0 && isAtEnd) {
        const distanceFromLastAccepted =
          newCursorPosition - lastAcceptedPosition;
        if (distanceFromLastAccepted >= 1 || lastAcceptedPosition === 0) {
          generateSuggestions(value, newCursorPosition);
        }
      } else {
        clearSuggestions();
        setShowSuggestion(false);
      }
    }
  }, [value, lastAcceptedPosition, generateSuggestions, clearSuggestions]);

  const { beforeSuggestion, suggestionText } = getSuggestionDisplay();

  return (
    <div className='relative'>
      {/* FIXED: Hidden measurer with exact textarea styles */}
      <div
        ref={measureRef}
        className='absolute invisible pointer-events-none top-0 left-0 z-[-1]'
        style={{
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          overflow: 'hidden',
        }}
        aria-hidden='true'
      />

      {/* FIXED: Overlay that exactly matches textarea bounds */}
      <div
        ref={overlayRef}
        className='absolute inset-0 pointer-events-none'
        style={{
          font: 'inherit',
          fontSize: 'inherit',
          lineHeight: 'inherit',
          padding: '12px 16px',
          border: '1px solid transparent',
          borderRadius: '12px',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          // FIXED: Exact same overflow behavior as textarea
          overflow: 'hidden',
          maxHeight: '200px', // FIXED: Match textarea's max-height
          boxSizing: 'border-box',
          // FIXED: Ensure overlay clips at exact same boundaries
          clipPath: 'inset(0)',
        }}
      >
        <span
          className='text-transparent select-none'
          style={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
          }}
        >
          {beforeSuggestion}
        </span>
        {suggestionText && (
          <span
            className='text-gray-400 select-none'
            style={{
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              display: 'inline',
            }}
          >
            {suggestionText}
          </span>
        )}
      </div>

      {/* Main textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleClick}
        placeholder={placeholder}
        className={`${className} relative z-10 bg-transparent resize-none`}
        disabled={disabled}
        maxLength={maxLength}
        style={{
          caretColor: 'rgb(17, 24, 39)',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          overflow: 'auto',
        }}
      />

      {isLoading && (
        <div className='absolute top-2 right-2 z-20'>
          <div className='w-4 h-4 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin'></div>
        </div>
      )}

      {/* UPDATED: Always show instruction text, conditionally show word count */}
      <div className='absolute -bottom-6 left-0 text-xs text-gray-500 flex items-center gap-2'>
        <span>💡 Tab to accept</span>
        <span>•</span>
        <span>Esc to dismiss</span>
        {showSuggestion && suggestionText && (
          <>
            <span>•</span>
            <span>{suggestionText.split(' ').length} words</span>
          </>
        )}
      </div>
    </div>
  );
};
