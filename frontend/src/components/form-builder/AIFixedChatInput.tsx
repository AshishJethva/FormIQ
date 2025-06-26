// components/form-builder/AIFixedChatInput.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { Button } from '@/components/ui/button';
import {
  Bot,
  Send,
  Loader2,
  Minimize2,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { updateFormWithAI } from '@/redux/slices/formBuilder/aiFormUpdateSlice';

interface AIFixedChatInputProps {
  formId: string;
  isVisible: boolean;
}

export default function AIFixedChatInput({
  formId,
  isVisible,
}: AIFixedChatInputProps) {
  const dispatch = useDispatch<AppDispatch>();
  const form = useSelector((state: RootState) => state.formBuilder.form);
  const aiUpdateState = useSelector((state: RootState) => state.aiFormUpdate);

  const [prompt, setPrompt] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const maxCharacters = 300;
  const isUpdating = aiUpdateState?.isUpdating || false;
  const error = aiUpdateState?.error || null;
  const lastUpdate = aiUpdateState?.lastUpdateSummary || null;

  const quickSuggestions = [
    'Add a phone number field after email',
    'Add 2 more multiple choice questions',
    'Change form title to "Registration Form"',
    'Add a file upload field at the end',
    'Make the email field required',
    'Remove the last optional field',
  ];

  const handleSubmit = async () => {
    if (!prompt?.trim()) {
      toast.error('Please enter an update instruction');
      return;
    }

    if (!form) {
      toast.error('Form data is not available');
      return;
    }

    if (!formId) {
      toast.error('Form ID is missing');
      return;
    }

    if (isUpdating) return;

    if (!form.pages || form.pages.length === 0) {
      toast.error('Form data is incomplete - no pages found');
      return;
    }

    try {
      const currentFormData = {
        id: form.id || formId,
        _id: form._id || formId,
        title: form.title || 'Untitled Form',
        description: form.description || '',
        pages: form.pages || [],
        settings: form.settings || {
          submitButtonText: 'Submit',
          defaultLabelAlignment: 'LEFT',
          thankyouMessage: 'Thank you for your submission!',
          defaultRequiredField: false,
          showLogo: false,
          isEnabled: true,
          allowMultipleSubmissions: true,
          allowMultipleEmailSubmissions: true,
          collectIpAddress: true,
          enableCaptcha: false,
        },
        logo: form.logo || null,
        selectedPageId: form.selectedPageId || form.pages?.[0]?.id,
        selectedFieldId: form.selectedFieldId || null,
        currentPageIndex: form.currentPageIndex || 0,
        propertiesPanelOpen: form.propertiesPanelOpen || false,
        isPublished: form.isPublished || false,
        submissions: form.submissions || 0,
        userId: form.userId,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
      };

      await dispatch(
        updateFormWithAI({
          formId,
          updatePrompt: prompt.trim(),
          currentForm: currentFormData,
        })
      ).unwrap();

      setPrompt('');
      setIsExpanded(false);
    } catch (error: any) {
      let errorMessage = 'Please try again with a different instruction';

      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error('Failed to update form', {
        description: errorMessage,
        duration: 7000,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(
        inputRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [prompt]);

  if (!isVisible || !form) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className='fixed bottom-6 left-6 z-50'
    >
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className='relative'
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleExpanded}
              className='w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center group'
            >
              {isUpdating ? (
                <Loader2 className='w-6 h-6 text-white animate-spin' />
              ) : (
                <Bot className='w-6 h-6 text-white group-hover:scale-110 transition-transform' />
              )}
            </motion.button>

            {error && (
              <div className='absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center'>
                <AlertCircle className='w-2.5 h-2.5 text-white' />
              </div>
            )}

            {lastUpdate && !error && (
              <div className='absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center'>
                <CheckCircle2 className='w-2.5 h-2.5 text-white' />
              </div>
            )}

            {isUpdating && (
              <div className='absolute inset-0 rounded-full bg-purple-600 animate-ping opacity-20'></div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className='bg-white rounded-2xl shadow-2xl border border-gray-200 w-96 max-h-96 flex flex-col overflow-hidden'
          >
            <div className='bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-white'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center'>
                    {isUpdating ? (
                      <Loader2 className='w-4 h-4 animate-spin' />
                    ) : (
                      <Bot className='w-4 h-4' />
                    )}
                  </div>
                  <div>
                    <h3 className='font-semibold text-sm'>AI Assistant</h3>
                    <p className='text-xs text-white/80'>
                      {isUpdating ? 'Updating form...' : 'Update using AI'}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-1'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className='text-white hover:bg-white/20 p-1'
                  >
                    <Lightbulb className='w-4 h-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={toggleExpanded}
                    className='text-white hover:bg-white/20 p-1'
                  >
                    <Minimize2 className='w-4 h-4' />
                  </Button>
                </div>
              </div>
            </div>

            <div className='px-4 py-2 bg-gray-50 border-b border-gray-200'>
              <div className='text-xs text-gray-600'>
                <span className='font-medium'>
                  {form?.title || 'Untitled Form'}
                </span>
                {' • '}
                <span>
                  {form?.pages?.reduce(
                    (total, page) => total + (page.fields?.length || 0),
                    0
                  )}{' '}
                  fields
                </span>
                {' • '}
                <span>{form?.pages?.length} page(s)</span>
              </div>
            </div>

            {error && (
              <div className='mx-4 mt-3'>
                <div className='bg-red-50 border border-red-200 rounded-md p-2'>
                  <div className='flex items-start gap-2'>
                    <AlertCircle className='w-3 h-3 text-red-500 mt-0.5 flex-shrink-0' />
                    <div>
                      <p className='text-red-800 font-medium text-xs'>
                        Update Failed
                      </p>
                      <p className='text-red-700 text-xs'>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {lastUpdate && !error && (
              <div className='mx-4 mt-3'>
                <div className='bg-green-50 border border-green-200 rounded-md p-2'>
                  <div className='flex items-start gap-2'>
                    <CheckCircle2 className='w-3 h-3 text-green-500 mt-0.5 flex-shrink-0' />
                    <div>
                      <p className='text-green-800 font-medium text-xs'>
                        Last Update
                      </p>
                      <p className='text-green-700 text-xs'>{lastUpdate}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className='border-b border-gray-200 overflow-hidden'
                >
                  <div className='p-3 bg-blue-50'>
                    <h4 className='text-xs font-medium text-gray-700 mb-2'>
                      Quick Examples:
                    </h4>
                    <div className='space-y-1'>
                      {quickSuggestions.slice(0, 3).map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className='text-left w-full text-xs text-gray-600 hover:text-purple-600 hover:bg-white rounded px-2 py-1 transition-colors'
                          disabled={isUpdating}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className='p-4 flex-1'>
              <div className='relative'>
                <textarea
                  ref={inputRef}
                  value={prompt}
                  onChange={e => {
                    if (e.target.value.length <= maxCharacters) {
                      setPrompt(e.target.value);
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Tell me what you'd like to change... (e.g., Add a phone field)"
                  className='w-full min-h-[60px] max-h-[120px] p-3 pr-10 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm placeholder-gray-500'
                  disabled={isUpdating}
                  maxLength={maxCharacters}
                />

                <Button
                  onClick={handleSubmit}
                  disabled={!prompt?.trim() || isUpdating || !form}
                  size='sm'
                  className='absolute bottom-2 right-2 w-8 h-8 p-0 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50'
                >
                  {isUpdating ? (
                    <Loader2 className='w-3 h-3 animate-spin' />
                  ) : (
                    <Send className='w-3 h-3' />
                  )}
                </Button>
              </div>

              <div className='flex justify-between items-center mt-2'>
                <span className='text-xs text-gray-500'>
                  {prompt?.length || 0}/{maxCharacters}
                </span>
                <span className='text-xs text-gray-500'>
                  Ctrl+Enter to send
                </span>
              </div>
            </div>

            <div className='px-4 py-2 bg-gray-50 border-t border-gray-200'>
              <div className='flex items-center gap-2'>
                <Sparkles className='w-3 h-3 text-purple-500' />
                <p className='text-xs text-gray-600'>
                  Be specific about field types and positions
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
