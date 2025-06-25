'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { generateFormWithAI, clearError } from '@/redux/slices/ai/aiFormSlice';
import { RootState, StoreDispatch } from '@/redux/store';
import { CombinedAITextarea } from '@/components/ai/CombinedAITextarea';

export default function AIFormBuilderPage() {
  const router = useRouter();
  const dispatch: StoreDispatch = useDispatch();

  const [prompt, setPrompt] = useState('');
  const aiFormState = useSelector((state: RootState) => state.aiForm);
  const isGenerating = aiFormState?.isGenerating || false;
  const error = aiFormState?.error || null;

  const maxCharacters = 500;

  const animatedMessages = [
    {
      text: 'I want to build a comprehensive job application form for my company with sections for personal information, work experience history, education background, resume file upload and cover letter submission.',
      delay: 42,
    },
    {
      text: 'I want to build a detailed student event registration form with participant information, emergency contact details, dietary restrictions and allergies, accommodation preferences and payment processing options.',
      delay: 45,
    },
    {
      text: 'I want to build an advanced customer feedback form for my business with multi-level satisfaction ratings, service quality evaluation metrics and product improvement suggestions.',
      delay: 48,
    },
    {
      text: 'I want to build an interactive quiz form with automatic scoring capabilities featuring multiple choice questions, true/false statements, fill-in-the-blank sections, image-based questions and time limits.',
      delay: 40,
    },
    {
      text: 'I want to build a comprehensive market research survey form with demographic profiling questions, consumer preference ratings, behavioral analysis sections and statistical data collection.',
      delay: 46,
    },
    {
      text: 'I want to build a professional contact form for website visitors with intelligent inquiry categorization, priority level selection, file attachment capabilities and automated response system.',
      delay: 44,
    },
    {
      text: 'I want to build a medical patient intake form with comprehensive health history, current medications list, allergy information, insurance details, emergency contacts and appointment scheduling preferences.',
      delay: 43,
    },
    {
      text: 'I want to build an event planning questionnaire with venue requirements, catering preferences, guest count estimation, budget constraints, timeline planning and special accommodations.',
      delay: 47,
    },
  ];

  const handleBack = () => {
    router.push('/dashboard');
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= maxCharacters) {
      setPrompt(e.target.value);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.defaultPrevented) {
      e.preventDefault();
      handleCreateForm();
    }
  };

  const handleCreateForm = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a description for your form');
      return;
    }

    // Don't proceed if already generating
    if (isGenerating) {
      return;
    }

    try {
      // Clear any previous errors
      dispatch(clearError());

      // Generate form with AI
      const result = await dispatch(generateFormWithAI(prompt.trim())).unwrap();

      // Show success message
      toast.success('🎉 AI form generated successfully!', {
        description: 'Redirecting to form builder...',
      });

      // Redirect to form builder with the generated form ID
      setTimeout(() => {
        router.push(`/build/${result.id}`);
      }, 500);
    } catch (error: any) {
      toast.error('Failed to generate form', {
        description: error || 'Please try again with a different description',
      });
    }
  };

  const quickTemplates = [
    'Quiz Assessment',
    'Job Application',
    'Customer Survey',
    'Customer Feedback',
  ];

  const handleTemplateClick = (template: string) => {
    const templatePrompts: { [key: string]: string } = {
      'Quiz Assessment':
        'I want to build a comprehensive knowledge assessment quiz form with 10-12 single choice questions, each with predefined correct answers, multiple choice scenarios with detailed explanations and fill-in-the-blank questions for key concepts.',

      'Job Application':
        'I need a detailed job application form with complete personal information section with resume file upload and cover letter submission.',

      'Customer Survey':
        'I want to build a comprehensive customer survey form with 8-10 rating scale fields, satisfaction level dropdowns with options like Excellent/Very Good/Good/Fair/Poor.',

      'Customer Feedback':
        'I want to build a detailed customer feedback form with comprehensive comment sections asking How was your overall experience, What specific aspects could we improve and customer relationship management.',
    };

    setPrompt(templatePrompts[template] || '');
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-[#FAFAFF] via-[#F8FAFF] to-[#F3F4FF]'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-8xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center ml-4'>
              <button
                onClick={handleBack}
                className='flex items-center text-gray-600 hover:text-gray-900 transition-colors cursor-pointer px-3 py-2 rounded-md text-md font-medium'
                disabled={isGenerating}
              >
                <ArrowLeft size={20} className='mr-2' />
                Back to Dashboard
              </button>
            </div>
            {/* FormIQ Logo */}
            <div
              className='flex items-center cursor-pointer mr-30'
              onClick={() => router.push('/dashboard')}
            >
              <div className='flex items-center space-x-2'>
                <Image
                  src='/LOGO.png'
                  alt='LogoImg'
                  priority
                  width={40}
                  height={40}
                  className='bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center'
                />

                <span className='text-4xl font-bold bg-gradient-to-r ml-2 from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                  FormIQ
                </span>
              </div>
            </div>
            <div className='w-32'></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        {/* Logo and Title Section */}
        <div className='text-center mb-12'>
          {/* Decorative Elements */}
          <div className='flex justify-center mb-6'>
            <div className='relative'>
              <div className='w-3 h-3 bg-blue-400 transform rotate-45 absolute -top-2 -left-2'></div>
              <div className='w-4 h-4 bg-orange-400 transform rotate-45'></div>
              <div className='w-2 h-2 bg-yellow-400 transform rotate-45 absolute -bottom-1 -right-1'></div>
            </div>
          </div>

          <h1 className='text-5xl font-bold mb-6'>
            <span className='bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent'>
              FormIQ AI Form Generator
            </span>
          </h1>

          <p className='text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed'>
            The way you create forms is about to change.{' '}
            <span className='font-semibold text-gray-900'>
              FormIQ&apos;s AI form builder
            </span>{' '}
            can{' '}
            <span className='font-semibold text-gray-900'>
              design and customize your form
            </span>
            , cutting out manual tasks and streamlining your workflows.
          </p>
        </div>

        <div className='bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8'>
          <div className='flex flex-col lg:flex-row gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <CombinedAITextarea
                  value={prompt}
                  onChange={handlePromptChange}
                  onKeyDown={handleKeyDown}
                  messages={animatedMessages}
                  className='w-full min-h-[112px] max-h-[200px] px-3 py-3 pb-6 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 transition-all duration-200 overflow-y-auto'
                  disabled={isGenerating}
                  maxLength={maxCharacters}
                />
              </div>

              <div className='flex justify-end items-center mt-3'>
                <span className='text-sm text-gray-500'>
                  {prompt.length}/{maxCharacters}
                </span>
              </div>
            </div>

            <div className='lg:self-start'>
              <button
                onClick={handleCreateForm}
                disabled={!prompt.trim() || isGenerating}
                className='w-full lg:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:cursor-not-allowed cursor-pointer'
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={20} className='animate-spin' />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Create Form
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className='mb-6 max-w-2xl mx-auto'>
            <div className='bg-red-50 border border-red-200 rounded-xl p-4 flex items-start'>
              <AlertCircle className='w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0' />
              <div>
                <h4 className='text-red-800 font-medium'>
                  Failed to generate form
                </h4>
                <p className='text-red-700 text-sm mt-1'>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Templates */}
        <div className='text-center'>
          <p className='text-gray-600 mb-6 text-lg'>
            Or get started with a quick template:
          </p>
          <div className='flex flex-wrap justify-center gap-3'>
            {quickTemplates.map(template => (
              <button
                key={template}
                onClick={() => handleTemplateClick(template)}
                disabled={isGenerating}
                className='bg-white hover:bg-gray-50 border border-gray-300 hover:border-purple-300 text-gray-700 hover:text-purple-700 px-6 py-3 rounded-full font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
              >
                {template}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section with additional info */}
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12'>
        <div className='text-center text-gray-500 text-sm'>
          <p>
            ✨ Powered by advanced AI technology to create intelligent,
            customized forms in seconds
          </p>
        </div>
      </div>
    </div>
  );
}
