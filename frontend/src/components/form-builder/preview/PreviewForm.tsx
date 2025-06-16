// src/components/form-builder/preview/PreviewForm.tsx
'use client';

import { Form, Field, FieldType } from '@/types/form';
import { Input } from '@/components/ui/input';
import FormLogo from '../logo/FormLogo';
import FileUploadField from '@/components/form-builder/canvas/FileUploadField';
import SignatureField from '@/components/form-builder/canvas/SignatureField';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PreviewFormProps {
  form: Form;
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  fileData: Record<string, any>;
  setFileData: (data: Record<string, any>) => void;
  currentPageIndex: number;
  setCurrentPageIndex: (index: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  errors: Record<string, string>;
}

export default function PreviewForm({
  form,
  formData,
  setFormData,
  fileData,
  setFileData,
  currentPageIndex,
  setCurrentPageIndex,
  onSubmit,
  isSubmitting,
  errors,
}: PreviewFormProps) {
  const currentPage = form.pages[currentPageIndex];
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === form.pages.length - 1;

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleFileChange = (fieldId: string, value: any) => {
    setFileData((prev: any) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleNext = () => {
    if (!isLastPage) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstPage) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const handleSubmit = () => {
    onSubmit();
  };

  const renderField = (field: Field) => {
    const value = formData[field.id] || '';
    const fieldError = errors[field.id];

    const fieldWrapperVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: 'easeOut' },
      },
    };

    switch (field.type) {
      case FieldType.IMAGE:
        return (
          <motion.div
            key={field.id}
            variants={fieldWrapperVariants}
            initial='hidden'
            animate='visible'
          >
            <FileUploadField
              fieldId={field.id}
              formId={form.id || 'preview'}
              label={field.label}
              required={field.required}
              helpText={field.helpText}
              accept={field.accept || 'image/*'}
              multiple={field.multiple || false}
              fieldType='image'
              value={fileData[field.id]}
              onChange={value => handleFileChange(field.id, value)}
              error={fieldError}
              readOnly={false}
            />
          </motion.div>
        );

      case FieldType.FILE_UPLOAD:
        return (
          <motion.div
            key={field.id}
            variants={fieldWrapperVariants}
            initial='hidden'
            animate='visible'
          >
            <FileUploadField
              fieldId={field.id}
              formId={form.id || 'preview'}
              label={field.label}
              required={field.required}
              helpText={field.helpText}
              accept={field.accept || '*/*'}
              multiple={field.multiple || false}
              fieldType='fileUpload'
              value={fileData[field.id]}
              onChange={value => handleFileChange(field.id, value)}
              error={fieldError}
              readOnly={false}
            />
          </motion.div>
        );

      case FieldType.SHORT_TEXT:
        return (
          <motion.div
            key={field.id}
            className='mb-6 sm:mb-8'
            variants={fieldWrapperVariants}
            initial='hidden'
            animate='visible'
          >
            <label className='block text-gray-800 mb-3 font-semibold text-sm sm:text-base'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <Input
              placeholder={field.placeholder || 'Enter your answer'}
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              className={`w-full transition-all duration-200 text-sm sm:text-base py-3 px-4 rounded-lg border-2 focus:ring-4 focus:ring-blue-100 ${
                fieldError
                  ? 'border-red-400 focus:ring-red-100 focus:border-red-500'
                  : 'border-gray-200 focus:border-blue-400 hover:border-gray-300'
              }`}
            />
            <AnimatePresence>
              {fieldError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='text-red-500 text-xs sm:text-sm mt-2 font-medium'
                >
                  {fieldError}
                </motion.div>
              )}
            </AnimatePresence>
            {field.helpText && (
              <div className='text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed'>
                {field.helpText}
              </div>
            )}
          </motion.div>
        );

      case FieldType.LONG_TEXT:
        return (
          <motion.div
            key={field.id}
            className='mb-6 sm:mb-8'
            variants={fieldWrapperVariants}
            initial='hidden'
            animate='visible'
          >
            <label className='block text-gray-800 mb-3 font-semibold text-sm sm:text-base'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <textarea
              placeholder={
                field.placeholder || 'Enter your detailed response...'
              }
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              rows={field.rows || 3}
              className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 resize-none transition-all duration-200 text-sm sm:text-base hover:border-gray-300 ${
                fieldError
                  ? 'border-red-400 focus:ring-red-100 focus:border-red-500'
                  : ''
              }`}
            />
            <AnimatePresence>
              {fieldError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='text-red-500 text-xs sm:text-sm mt-2 font-medium'
                >
                  {fieldError}
                </motion.div>
              )}
            </AnimatePresence>
            {field.helpText && (
              <div className='text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed'>
                {field.helpText}
              </div>
            )}
          </motion.div>
        );

      case FieldType.PARAGRAPH:
        return (
          <motion.div
            key={field.id}
            className='mb-6 sm:mb-8'
            variants={fieldWrapperVariants}
            initial='hidden'
            animate='visible'
          >
            <label className='block text-gray-800 mb-3 font-semibold text-sm sm:text-base'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <textarea
              placeholder={
                field.placeholder ||
                'Share your thoughts, feedback, or detailed information...'
              }
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              rows={field.rows || 5}
              className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 resize-none transition-all duration-200 text-sm sm:text-base hover:border-gray-300 ${
                fieldError
                  ? 'border-red-400 focus:ring-red-100 focus:border-red-500'
                  : ''
              }`}
            />
            <AnimatePresence>
              {fieldError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='text-red-500 text-xs sm:text-sm mt-2 font-medium'
                >
                  {fieldError}
                </motion.div>
              )}
            </AnimatePresence>
            {field.helpText && (
              <div className='text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed'>
                {field.helpText}
              </div>
            )}
          </motion.div>
        );

      case FieldType.DROPDOWN:
        return (
          <motion.div
            key={field.id}
            className='mb-6 sm:mb-8'
            variants={fieldWrapperVariants}
            initial='hidden'
            animate='visible'
          >
            <label className='block text-gray-800 mb-3 font-semibold text-sm sm:text-base'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <select
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 bg-white transition-all duration-200 text-sm sm:text-base hover:border-gray-300 appearance-none bg-no-repeat bg-right bg-[length:16px] ${
                fieldError
                  ? 'border-red-400 focus:ring-red-100 focus:border-red-500'
                  : ''
              }`}
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                backgroundPosition: 'right 0.75rem center',
              }}
            >
              <option value=''>Select an option...</option>
              {field.options && field.options.length > 0 ? (
                field.options.map((option, index) => (
                  <option key={index} value={option.value}>
                    {option.label}
                  </option>
                ))
              ) : (
                <>
                  <option value='option1'>Option 1</option>
                  <option value='option2'>Option 2</option>
                  <option value='option3'>Option 3</option>
                </>
              )}
            </select>
            <AnimatePresence>
              {fieldError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='text-red-500 text-xs sm:text-sm mt-2 font-medium'
                >
                  {fieldError}
                </motion.div>
              )}
            </AnimatePresence>
            {field.helpText && (
              <div className='text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed'>
                {field.helpText}
              </div>
            )}
          </motion.div>
        );

      case FieldType.SINGLE_CHOICE:
        return (
          <motion.div
            key={field.id}
            className='mb-6 sm:mb-8'
            variants={fieldWrapperVariants}
            initial='hidden'
            animate='visible'
          >
            <label className='block text-gray-800 mb-3 font-semibold text-sm sm:text-base'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <div className='space-y-2'>
              {' '}
              {/* Changed from space-y-3 to space-y-2 */}
              {field.options && field.options.length > 0 ? (
                field.options.map((option, index) => (
                  <motion.label
                    key={index}
                    className='flex items-center space-x-2 cursor-pointer p-2 rounded-md border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all duration-200'
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.995 }}
                  >
                    <input
                      type='radio'
                      name={field.id}
                      value={option.value}
                      checked={value === option.value}
                      onChange={e =>
                        handleInputChange(field.id, e.target.value)
                      }
                      className='w-4 h-4 text-blue-600'
                    />
                    <span className='text-sm text-gray-700 font-medium'>
                      {' '}
                      {option.label}
                    </span>
                  </motion.label>
                ))
              ) : (
                <>
                  {['Option 1', 'Option 2', 'Option 3'].map((label, index) => (
                    <motion.label
                      key={index}
                      className='flex items-center space-x-2 cursor-pointer p-2 rounded-md border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all duration-200'
                      whileHover={{ scale: 1.005 }}
                      whileTap={{ scale: 0.995 }}
                    >
                      <input
                        type='radio'
                        name={field.id}
                        value={`option${index + 1}`}
                        checked={value === `option${index + 1}`}
                        onChange={e =>
                          handleInputChange(field.id, e.target.value)
                        }
                        className='w-4 h-4 text-blue-600'
                      />
                      <span className='text-sm text-gray-700 font-medium'>
                        {label}
                      </span>
                    </motion.label>
                  ))}
                </>
              )}
            </div>
            <AnimatePresence>
              {fieldError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='text-red-500 text-xs sm:text-sm mt-2 font-medium'
                >
                  {fieldError}
                </motion.div>
              )}
            </AnimatePresence>
            {field.helpText && (
              <div className='text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed'>
                {field.helpText}
              </div>
            )}
          </motion.div>
        );

      case FieldType.MULTIPLE_CHOICE:
        return (
          <motion.div
            key={field.id}
            className='mb-6 sm:mb-8'
            variants={fieldWrapperVariants}
            initial='hidden'
            animate='visible'
          >
            <label className='block text-gray-800 mb-3 font-semibold text-sm sm:text-base'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <div className='space-y-2'>
              {' '}
              {/* Changed from space-y-3 to space-y-2 */}
              {field.options && field.options.length > 0 ? (
                field.options.map((option, index) => (
                  <motion.label
                    key={index}
                    className='flex items-center space-x-2 cursor-pointer p-2 rounded-md border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all duration-200'
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.995 }}
                  >
                    <input
                      type='checkbox'
                      value={option.value}
                      checked={
                        Array.isArray(value) && value.includes(option.value)
                      }
                      onChange={e => {
                        const currentValues = Array.isArray(value) ? value : [];
                        if (e.target.checked) {
                          handleInputChange(field.id, [
                            ...currentValues,
                            option.value,
                          ]);
                        } else {
                          handleInputChange(
                            field.id,
                            currentValues.filter(v => v !== option.value)
                          );
                        }
                      }}
                      className='w-4 h-4 text-blue-600 '
                    />
                    <span className='text-sm text-gray-700 font-medium'>
                      {option.label}
                    </span>
                  </motion.label>
                ))
              ) : (
                <>
                  {['Option 1', 'Option 2', 'Option 3'].map((label, index) => (
                    <motion.label
                      key={index}
                      className='flex items-center space-x-2 cursor-pointer p-2 rounded-md border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all duration-200'
                      whileHover={{ scale: 1.005 }}
                      whileTap={{ scale: 0.995 }}
                    >
                      <input
                        type='checkbox'
                        value={`option${index + 1}`}
                        checked={
                          Array.isArray(value) &&
                          value.includes(`option${index + 1}`)
                        }
                        onChange={e => {
                          const currentValues = Array.isArray(value)
                            ? value
                            : [];
                          if (e.target.checked) {
                            handleInputChange(field.id, [
                              ...currentValues,
                              `option${index + 1}`,
                            ]);
                          } else {
                            handleInputChange(
                              field.id,
                              currentValues.filter(
                                v => v !== `option${index + 1}`
                              )
                            );
                          }
                        }}
                        className='w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-1 rounded'
                      />
                      <span className='text-sm text-gray-700 font-medium'>
                        {label}
                      </span>
                    </motion.label>
                  ))}
                </>
              )}
            </div>
            <AnimatePresence>
              {fieldError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='text-red-500 text-xs sm:text-sm mt-2 font-medium'
                >
                  {fieldError}
                </motion.div>
              )}
            </AnimatePresence>
            {field.helpText && (
              <div className='text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed'>
                {field.helpText}
              </div>
            )}
          </motion.div>
        );

      case FieldType.NUMBER:
        return (
          <motion.div
            key={field.id}
            className='mb-6 sm:mb-8'
            variants={fieldWrapperVariants}
            initial='hidden'
            animate='visible'
          >
            <label className='block text-gray-800 mb-3 font-semibold text-sm sm:text-base'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <Input
              type='number'
              placeholder={field.placeholder || 'Enter a number'}
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              min={field.min}
              max={field.max}
              step={field.step || 1}
              className={`w-full transition-all duration-200 text-sm sm:text-base py-3 px-4 rounded-lg border-2 focus:ring-4 focus:ring-blue-100 ${
                fieldError
                  ? 'border-red-400 focus:ring-red-100 focus:border-red-500'
                  : 'border-gray-200 focus:border-blue-400 hover:border-gray-300'
              }`}
            />
            <AnimatePresence>
              {fieldError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='text-red-500 text-xs sm:text-sm mt-2 font-medium'
                >
                  {fieldError}
                </motion.div>
              )}
            </AnimatePresence>
            {field.helpText && (
              <div className='text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed'>
                {field.helpText}
              </div>
            )}
          </motion.div>
        );

      case FieldType.TIME:
        return (
          <motion.div
            key={field.id}
            className='mb-6 sm:mb-8'
            variants={fieldWrapperVariants}
            initial='hidden'
            animate='visible'
          >
            <label className='block text-gray-800 mb-3 font-semibold text-sm sm:text-base'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <Input
              type='time'
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              className={`w-full transition-all duration-200 text-sm sm:text-base py-3 px-4 rounded-lg border-2 focus:ring-4 focus:ring-blue-100 ${
                fieldError
                  ? 'border-red-400 focus:ring-red-100 focus:border-red-500'
                  : 'border-gray-200 focus:border-blue-400 hover:border-gray-300'
              }`}
            />
            <AnimatePresence>
              {fieldError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='text-red-500 text-xs sm:text-sm mt-2 font-medium'
                >
                  {fieldError}
                </motion.div>
              )}
            </AnimatePresence>
            {field.helpText && (
              <div className='text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed'>
                {field.helpText}
              </div>
            )}
          </motion.div>
        );

      case FieldType.HEADING:
        return (
          <motion.div
            key={field.id}
            className='mb-8 sm:mb-12'
            variants={fieldWrapperVariants}
            initial='hidden'
            animate='visible'
          >
            <h3
              className={`text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-800 border-b-2 border-gray-200 pb-4 ${
                field.labelAlignment === 'RIGHT' ? 'text-right' : 'text-left'
              }`}
            >
              {field.label}
            </h3>
          </motion.div>
        );

      case FieldType.FULL_NAME:
        return (
          <motion.div
            key={field.id}
            className='mb-6 sm:mb-8'
            variants={fieldWrapperVariants}
            initial='hidden'
            animate='visible'
          >
            <label className='block text-gray-800 mb-3 font-semibold text-sm sm:text-base'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
              <div>
                <Input
                  placeholder='First Name'
                  value={value.firstName || ''}
                  onChange={e =>
                    handleInputChange(field.id, {
                      ...value,
                      firstName: e.target.value,
                    })
                  }
                  className={`w-full transition-all duration-200 text-sm sm:text-base py-3 px-4 rounded-lg border-2 focus:ring-4 focus:ring-blue-100 ${
                    fieldError
                      ? 'border-red-400 focus:ring-red-100 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-400 hover:border-gray-300'
                  }`}
                />
              </div>
              <div>
                <Input
                  placeholder='Last Name'
                  value={value.lastName || ''}
                  onChange={e =>
                    handleInputChange(field.id, {
                      ...value,
                      lastName: e.target.value,
                    })
                  }
                  className={`w-full transition-all duration-200 text-sm sm:text-base py-3 px-4 rounded-lg border-2 focus:ring-4 focus:ring-blue-100 ${
                    fieldError
                      ? 'border-red-400 focus:ring-red-100 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-400 hover:border-gray-300'
                  }`}
                />
              </div>
            </div>
            <AnimatePresence>
              {fieldError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='text-red-500 text-xs sm:text-sm mt-2 font-medium'
                >
                  {fieldError}
                </motion.div>
              )}
            </AnimatePresence>
            {field.helpText && (
              <div className='text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed'>
                {field.helpText}
              </div>
            )}
          </motion.div>
        );

      case FieldType.EMAIL:
        return (
          <motion.div
            key={field.id}
            className='mb-6 sm:mb-8'
            variants={fieldWrapperVariants}
            initial='hidden'
            animate='visible'
          >
            <label className='block text-gray-800 mb-3 font-semibold text-sm sm:text-base'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <Input
              type='email'
              placeholder={field.placeholder || 'your.email@example.com'}
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              className={`w-full transition-all duration-200 text-sm sm:text-base py-3 px-4 rounded-lg border-2 focus:ring-4 focus:ring-blue-100 ${
                fieldError
                  ? 'border-red-400 focus:ring-red-100 focus:border-red-500'
                  : 'border-gray-200 focus:border-blue-400 hover:border-gray-300'
              }`}
              autoComplete='email'
            />
            <AnimatePresence>
              {fieldError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='text-red-500 text-xs sm:text-sm mt-2 font-medium'
                >
                  {fieldError}
                </motion.div>
              )}
            </AnimatePresence>
            {field.helpText && (
              <div className='text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed'>
                {field.helpText}
              </div>
            )}
          </motion.div>
        );

      case FieldType.PHONE:
        return (
          <motion.div
            key={field.id}
            className='mb-6 sm:mb-8'
            variants={fieldWrapperVariants}
            initial='hidden'
            animate='visible'
          >
            <label className='block text-gray-800 mb-3 font-semibold text-sm sm:text-base'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <Input
              type='tel'
              placeholder={field.placeholder || '9876543210'}
              value={value}
              onChange={e => {
                const input = e.target.value;
                const digitsOnly = input.replace(/\D/g, '');
                const limitedDigits = digitsOnly.slice(0, 10);
                handleInputChange(field.id, limitedDigits);
              }}
              onKeyPress={e => {
                if (
                  !/[0-9]/.test(e.key) &&
                  !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)
                ) {
                  e.preventDefault();
                }
              }}
              maxLength={10}
              className={`w-full transition-all duration-200 text-sm sm:text-base py-3 px-4 rounded-lg border-2 focus:ring-4 focus:ring-blue-100 ${
                fieldError
                  ? 'border-red-400 focus:ring-red-100 focus:border-red-500'
                  : 'border-gray-200 focus:border-blue-400 hover:border-gray-300'
              }`}
            />
            <AnimatePresence>
              {fieldError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='text-red-500 text-xs sm:text-sm mt-2 font-medium'
                >
                  {fieldError}
                </motion.div>
              )}
            </AnimatePresence>
            {field.helpText && (
              <div className='text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed'>
                {field.helpText}
              </div>
            )}
          </motion.div>
        );

      case FieldType.ADDRESS:
        return (
          <motion.div
            key={field.id}
            className='mb-6 sm:mb-8'
            variants={fieldWrapperVariants}
            initial='hidden'
            animate='visible'
          >
            <label className='block text-gray-800 mb-3 font-semibold text-sm sm:text-base'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <div className='space-y-3 sm:space-y-4'>
              <Input
                placeholder='Street Address'
                value={value.street || ''}
                onChange={e =>
                  handleInputChange(field.id, {
                    ...value,
                    street: e.target.value,
                  })
                }
                className={`w-full transition-all duration-200 text-sm sm:text-base py-3 px-4 rounded-lg border-2 focus:ring-4 focus:ring-blue-100 ${
                  fieldError
                    ? 'border-red-400 focus:ring-red-100 focus:border-red-500'
                    : 'border-gray-200 focus:border-blue-400 hover:border-gray-300'
                }`}
              />
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
                <Input
                  placeholder='City'
                  value={value.city || ''}
                  onChange={e =>
                    handleInputChange(field.id, {
                      ...value,
                      city: e.target.value,
                    })
                  }
                  className={`w-full transition-all duration-200 text-sm sm:text-base py-3 px-4 rounded-lg border-2 focus:ring-4 focus:ring-blue-100 ${
                    fieldError
                      ? 'border-red-400 focus:ring-red-100 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-400 hover:border-gray-300'
                  }`}
                />
                <Input
                  placeholder='State/Province'
                  value={value.state || ''}
                  onChange={e =>
                    handleInputChange(field.id, {
                      ...value,
                      state: e.target.value,
                    })
                  }
                  className={`w-full transition-all duration-200 text-sm sm:text-base py-3 px-4 rounded-lg border-2 focus:ring-4 focus:ring-blue-100 ${
                    fieldError
                      ? 'border-red-400 focus:ring-red-100 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-400 hover:border-gray-300'
                  }`}
                />
              </div>
              <Input
                placeholder='ZIP/Postal Code (Optional)'
                value={value.zipCode || ''}
                onChange={e =>
                  handleInputChange(field.id, {
                    ...value,
                    zipCode: e.target.value,
                  })
                }
                className={`w-full transition-all duration-200 text-sm sm:text-base py-3 px-4 rounded-lg border-2 focus:ring-4 focus:ring-blue-100 ${
                  fieldError
                    ? 'border-red-400 focus:ring-red-100 focus:border-red-500'
                    : 'border-gray-200 focus:border-blue-400 hover:border-gray-300'
                }`}
              />
            </div>
            <AnimatePresence>
              {fieldError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='text-red-500 text-xs sm:text-sm mt-2 font-medium'
                >
                  {fieldError}
                </motion.div>
              )}
            </AnimatePresence>
            {field.helpText && (
              <div className='text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed'>
                {field.helpText}
              </div>
            )}
          </motion.div>
        );

      case FieldType.DATE_PICKER:
        return (
          <motion.div
            key={field.id}
            className='mb-6 sm:mb-8'
            variants={fieldWrapperVariants}
            initial='hidden'
            animate='visible'
          >
            <label className='block text-gray-800 mb-3 font-semibold text-sm sm:text-base'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <Input
              type='date'
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              className={`w-full transition-all duration-200 text-sm sm:text-base py-3 px-4 rounded-lg border-2 focus:ring-4 focus:ring-blue-100 ${
                fieldError
                  ? 'border-red-400 focus:ring-red-100 focus:border-red-500'
                  : 'border-gray-200 focus:border-blue-400 hover:border-gray-300'
              }`}
            />
            <AnimatePresence>
              {fieldError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='text-red-500 text-xs sm:text-sm mt-2 font-medium'
                >
                  {fieldError}
                </motion.div>
              )}
            </AnimatePresence>
            {field.helpText && (
              <div className='text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed'>
                {field.helpText}
              </div>
            )}
          </motion.div>
        );

      case FieldType.APPOINTMENT:
        return (
          <motion.div
            key={field.id}
            className='mb-6 sm:mb-8'
            variants={fieldWrapperVariants}
            initial='hidden'
            animate='visible'
          >
            <label className='block text-gray-800 mb-3 font-semibold text-sm sm:text-base'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
              <div>
                <Input
                  type='date'
                  value={value.date || ''}
                  onChange={e =>
                    handleInputChange(field.id, {
                      ...value,
                      date: e.target.value,
                    })
                  }
                  className={`w-full transition-all duration-200 text-sm sm:text-base py-3 px-4 rounded-lg border-2 focus:ring-4 focus:ring-blue-100 ${
                    fieldError
                      ? 'border-red-400 focus:ring-red-100 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-400 hover:border-gray-300'
                  }`}
                />
                <span className='text-xs sm:text-sm text-gray-500 mt-1 block'>
                  Date
                </span>
              </div>
              <div>
                <Input
                  type='time'
                  value={value.time || ''}
                  onChange={e =>
                    handleInputChange(field.id, {
                      ...value,
                      time: e.target.value,
                    })
                  }
                  className={`w-full transition-all duration-200 text-sm sm:text-base py-3 px-4 rounded-lg border-2 focus:ring-4 focus:ring-blue-100 ${
                    fieldError
                      ? 'border-red-400 focus:ring-red-100 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-400 hover:border-gray-300'
                  }`}
                />
                <span className='text-xs sm:text-sm text-gray-500 mt-1 block'>
                  Time
                </span>
              </div>
            </div>
            <AnimatePresence>
              {fieldError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='text-red-500 text-xs sm:text-sm mt-2 font-medium'
                >
                  {fieldError}
                </motion.div>
              )}
            </AnimatePresence>
            {field.helpText && (
              <div className='text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed'>
                {field.helpText}
              </div>
            )}
          </motion.div>
        );

      case FieldType.SIGNATURE:
        return (
          <motion.div
            key={field.id}
            variants={fieldWrapperVariants}
            initial='hidden'
            animate='visible'
          >
            <SignatureField
              fieldId={field.id}
              label={field.label}
              required={field.required}
              helpText={field.helpText}
              value={value}
              onChange={value => handleInputChange(field.id, value)}
              error={fieldError}
              readOnly={false}
            />
          </motion.div>
        );

      case FieldType.FILL_BLANK: {
        const beforeText =
          field.fillBlankTemplate?.beforeText || 'I agree to the';
        const blankPlaceholder =
          field.fillBlankTemplate?.blankPlaceholder || 'terms';
        const afterText =
          field.fillBlankTemplate?.afterText || 'and conditions.';

        return (
          <motion.div
            key={field.id}
            className='mb-6 sm:mb-8'
            variants={fieldWrapperVariants}
            initial='hidden'
            animate='visible'
          >
            <label className='block text-gray-800 mb-3 font-semibold text-sm sm:text-base'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>

            <div className='border-2 border-gray-200 rounded-lg p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white transition-all duration-200 hover:border-gray-300'>
              <div className='flex flex-wrap items-center gap-2 text-gray-700 mb-3'>
                <span className='text-sm sm:text-base font-medium'>
                  {beforeText}
                </span>
                <input
                  type='text'
                  placeholder={blankPlaceholder}
                  value={value || ''}
                  onChange={e => handleInputChange(field.id, e.target.value)}
                  className={`px-3 py-2 border-b-2 border-blue-500 bg-blue-50 text-blue-700 min-w-[120px] focus:outline-none focus:bg-white focus:border-blue-600 text-center font-medium text-sm sm:text-base transition-all duration-200 ${
                    fieldError ? 'border-red-500 bg-red-50 text-red-700' : ''
                  }`}
                />
                <span className='text-sm sm:text-base font-medium'>
                  {afterText}
                </span>
              </div>

              {value && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='text-xs sm:text-sm text-green-600 mt-2 font-medium'
                >
                  ✓ Your answer: &quot;{value}&quot;
                </motion.div>
              )}
            </div>

            <AnimatePresence>
              {fieldError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='text-red-500 text-xs sm:text-sm mt-2 font-medium'
                >
                  {fieldError}
                </motion.div>
              )}
            </AnimatePresence>
            {field.helpText && (
              <div className='text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed'>
                {field.helpText}
              </div>
            )}
          </motion.div>
        );
      }

      case FieldType.PRODUCT_LIST: {
        const products = field.productListConfig?.products || [
          { id: '1', name: 'Sample Product', price: 19.99, quantity: 1 },
        ];

        const currentSelections = value || {};

        const handleProductQuantityChange = (
          productId: string,
          quantity: number
        ) => {
          const updatedSelections = { ...currentSelections };
          if (quantity > 0) {
            updatedSelections[productId] = quantity;
          } else {
            delete updatedSelections[productId];
          }
          handleInputChange(field.id, updatedSelections);
        };

        const calculateTotal = () => {
          return products.reduce((total, product) => {
            const quantity = currentSelections[product.id] || 0;
            return total + product.price * quantity;
          }, 0);
        };

        return (
          <motion.div
            key={field.id}
            className='mb-6 sm:mb-8'
            variants={fieldWrapperVariants}
            initial='hidden'
            animate='visible'
          >
            <label className='block text-gray-800 mb-4 font-semibold text-sm sm:text-base'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>

            <div className='border-2 border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm transition-all duration-200 hover:shadow-md'>
              {/* Header */}
              <div className='bg-gradient-to-r from-gray-100 to-gray-50 p-3 sm:p-4 border-b border-gray-200'>
                <div className='hidden sm:grid sm:grid-cols-12 gap-2 font-semibold text-gray-700 text-sm'>
                  <div className='col-span-6'>Product</div>
                  <div className='col-span-3 text-center'>Price</div>
                  <div className='col-span-3 text-center'>Quantity</div>
                </div>
                <div className='sm:hidden text-center font-semibold text-gray-700 text-sm'>
                  Product Selection
                </div>
              </div>

              {/* Product List */}
              <div className='divide-y divide-gray-200'>
                {products.map(product => (
                  <motion.div
                    key={product.id}
                    className='p-3 sm:p-4 hover:bg-gray-50 transition-colors duration-200'
                    whileHover={{ scale: 1.005 }}
                  >
                    {/* Mobile Layout */}
                    <div className='sm:hidden space-y-3'>
                      <div className='text-gray-900 font-semibold text-base'>
                        {product.name}
                      </div>
                      <div className='flex justify-between items-center'>
                        <span className='text-gray-700 font-medium'>
                          ${product.price.toFixed(2)}
                        </span>
                        <div className='flex items-center space-x-2'>
                          <label className='text-sm text-gray-600 font-medium'>
                            Qty:
                          </label>
                          <input
                            type='number'
                            min='0'
                            max='99'
                            value={currentSelections[product.id] || 0}
                            onChange={e =>
                              handleProductQuantityChange(
                                product.id,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className={`w-16 px-2 py-1 border-2 border-gray-200 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                              fieldError ? 'border-red-400' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className='hidden sm:grid sm:grid-cols-12 gap-2 items-center'>
                      <div className='col-span-6'>
                        <div className='text-gray-900 font-semibold text-base'>
                          {product.name}
                        </div>
                      </div>
                      <div className='col-span-3 text-center text-gray-700 font-medium'>
                        ${product.price.toFixed(2)}
                      </div>
                      <div className='col-span-3 text-center'>
                        <input
                          type='number'
                          min='0'
                          max='99'
                          value={currentSelections[product.id] || 0}
                          onChange={e =>
                            handleProductQuantityChange(
                              product.id,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className={`w-16 px-2 py-1 border-2 border-gray-200 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                            fieldError ? 'border-red-400' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Total Section */}
              <div className='bg-gradient-to-r from-gray-50 to-gray-100 p-3 sm:p-4 border-t border-gray-200'>
                <div className='flex justify-between items-center mb-3'>
                  <span className='font-semibold text-gray-800 text-base sm:text-lg'>
                    Total:
                  </span>
                  <span className='font-semibold text-lg sm:text-xl text-green-600'>
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>

                {Object.keys(currentSelections).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className='text-xs sm:text-sm text-gray-600 space-y-1'
                  >
                    {Object.keys(currentSelections).map(productId => {
                      const product = products.find(p => p.id === productId);
                      const quantity = currentSelections[productId];
                      return quantity > 0 && product ? (
                        <div key={productId} className='flex justify-between'>
                          <span>
                            {product.name} (×{quantity})
                          </span>
                          <span className='font-medium'>
                            ${(product.price * quantity).toFixed(2)}
                          </span>
                        </div>
                      ) : null;
                    })}
                  </motion.div>
                )}
              </div>
            </div>

            <AnimatePresence>
              {fieldError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='text-red-500 text-xs sm:text-sm mt-2 font-medium'
                >
                  {fieldError}
                </motion.div>
              )}
            </AnimatePresence>
            {field.helpText && (
              <div className='text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed'>
                {field.helpText}
              </div>
            )}
          </motion.div>
        );
      }

      default:
        return (
          <motion.div
            key={field.id}
            className='mb-6 sm:mb-8'
            variants={fieldWrapperVariants}
            initial='hidden'
            animate='visible'
          >
            <label className='block text-gray-800 mb-3 font-semibold text-sm sm:text-base'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <Input
              placeholder={field.placeholder || field.label}
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              className={`w-full transition-all duration-200 text-sm sm:text-base py-3 px-4 rounded-lg border-2 focus:ring-4 focus:ring-blue-100 ${
                fieldError
                  ? 'border-red-400 focus:ring-red-100 focus:border-red-500'
                  : 'border-gray-200 focus:border-blue-400 hover:border-gray-300'
              }`}
            />
            <AnimatePresence>
              {fieldError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='text-red-500 text-xs sm:text-sm mt-2 font-medium'
                >
                  {fieldError}
                </motion.div>
              )}
            </AnimatePresence>
            {field.helpText && (
              <div className='text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed'>
                {field.helpText}
              </div>
            )}
          </motion.div>
        );
    }
  };

  const pageVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
        when: 'beforeChildren',
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      x: -50,
      transition: { duration: 0.3 },
    },
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-white'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12'>
        {/* Logo */}
        {form.logo && form.logo.src && (
          <motion.div
            style={{ marginBottom: '3rem' }}
            className='mb-6 sm:mb-8 w-full flex justify-center'
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <FormLogo />
          </motion.div>
        )}

        {/* Form Content */}
        <AnimatePresence mode='wait' initial={false}>
          <motion.div
            key={currentPageIndex}
            variants={pageVariants}
            initial='hidden'
            animate='visible'
            exit='exit'
            className='bg-white rounded-sm shadow-lg border border-gray-100 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8'
          >
            {/* Form Fields */}
            <div className='space-y-6 sm:space-y-8'>
              {currentPage?.fields?.map(field => renderField(field))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <motion.div
          className='flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 pt-6 border-t border-gray-200'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {!isFirstPage ? (
            <motion.button
              onClick={handleBack}
              whileHover={{ scale: 1.02, x: -2 }}
              whileTap={{ scale: 0.98 }}
              className='w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium text-sm sm:text-base shadow-sm hover:shadow-md'
            >
              <ChevronLeft className='w-4 h-4 mr-2' />
              Back
            </motion.button>
          ) : (
            <div className='hidden sm:block'></div>
          )}

          {!isLastPage ? (
            <motion.button
              onClick={handleNext}
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              className='w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium text-sm sm:text-base shadow-lg hover:shadow-xl'
            >
              Next
              <ChevronRight className='w-4 h-4 ml-2' />
            </motion.button>
          ) : (
            <motion.button
              onClick={handleSubmit}
              disabled={isSubmitting}
              whileHover={!isSubmitting ? { scale: 1.02 } : {}}
              whileTap={!isSubmitting ? { scale: 0.98 } : {}}
              className='w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base shadow-lg hover:shadow-xl disabled:hover:shadow-lg'
            >
              {isSubmitting ? (
                <div className='flex items-center justify-center'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  Submitting...
                </div>
              ) : (
                form.settings?.submitButtonText || 'Submit Form'
              )}
            </motion.button>
          )}
        </motion.div>

        {/* Page Indicator */}
        {form.pages.length > 1 && (
          <motion.div
            className='flex justify-center items-center mt-6 sm:mt-8 space-x-2 sm:space-x-3'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {form.pages.map((_, index) => (
              <motion.div
                key={index}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 cursor-pointer ${
                  index === currentPageIndex
                    ? 'bg-blue-600 scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                whileHover={{ scale: index === currentPageIndex ? 1.25 : 1.1 }}
                onClick={() => setCurrentPageIndex(index)}
              />
            ))}
            <div className='ml-3 sm:ml-4 text-xs sm:text-sm text-gray-500 font-medium'>
              {currentPageIndex + 1} of {form.pages.length}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
