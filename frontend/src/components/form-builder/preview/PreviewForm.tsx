// src/components/form-builder/preview/PreviewForm.tsx
'use client';

import { Form, Field, FieldType } from '@/types/form';
import { Input } from '@/components/ui/input';
import FormLogo from '../logo/FormLogo';
import FileUploadField from '@/components/form-builder/canvas/FileUploadField';
import SignatureField from '@/components/form-builder/canvas/SignatureField';

interface PreviewFormProps {
  form: Form;
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  fileData: Record<string, any>; //  ADD: Accept fileData from parent
  setFileData: (data: Record<string, any>) => void; //  ADD: Accept setFileData from parent
  currentPageIndex: number;
  setCurrentPageIndex: (index: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  errors: Record<string, string>; //  ADD: Accept errors from parent
}

export default function PreviewForm({
  form,
  formData,
  setFormData,
  fileData, //  USE: fileData from parent
  setFileData, //  USE: setFileData from parent
  currentPageIndex,
  setCurrentPageIndex,
  onSubmit,
  isSubmitting,
  errors, //  USE: errors from parent
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
    console.log(' Preview form submitting with files:', {
      formData,
      fileData,
      totalFiles: Object.values(fileData).reduce(
        (total: number, files: any) => {
          if (Array.isArray(files)) return total + files.length;
          return total + (files ? 1 : 0);
        },
        0
      ),
    });

    onSubmit();
  };

  const renderField = (field: Field) => {
    const value = formData[field.id] || '';
    const fieldError = errors[field.id];

    switch (field.type) {
      case FieldType.IMAGE:
        return (
          <FileUploadField
            key={field.id}
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
        );

      case FieldType.FILE_UPLOAD:
        return (
          <FileUploadField
            key={field.id}
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
        );

      case FieldType.SHORT_TEXT:
        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <Input
              placeholder={field.placeholder || 'Enter your answer'}
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              className={`w-full ${
                fieldError ? 'border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {fieldError && (
              <div className='text-red-500 text-sm mt-2'>{fieldError}</div>
            )}
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.LONG_TEXT:
        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2 font-medium'>
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
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                fieldError ? 'border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {fieldError && (
              <div className='text-red-500 text-sm mt-2'>{fieldError}</div>
            )}
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.PARAGRAPH:
        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2 font-medium'>
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
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                fieldError ? 'border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {fieldError && (
              <div className='text-red-500 text-sm mt-2'>{fieldError}</div>
            )}
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.DROPDOWN:
        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <select
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${
                fieldError ? 'border-red-500 focus:ring-red-500' : ''
              }`}
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
            {fieldError && (
              <div className='text-red-500 text-sm mt-2'>{fieldError}</div>
            )}
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.SINGLE_CHOICE:
        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <div className='space-y-2'>
              {field.options && field.options.length > 0 ? (
                field.options.map((option, index) => (
                  <label
                    key={index}
                    className='flex items-center space-x-2 cursor-pointer'
                  >
                    <input
                      type='radio'
                      name={field.id}
                      value={option.value}
                      checked={value === option.value}
                      onChange={e =>
                        handleInputChange(field.id, e.target.value)
                      }
                      className='text-blue-500 focus:ring-blue-500'
                    />
                    <span>{option.label}</span>
                  </label>
                ))
              ) : (
                <>
                  <label className='flex items-center space-x-2 cursor-pointer'>
                    <input
                      type='radio'
                      name={field.id}
                      value='option1'
                      checked={value === 'option1'}
                      onChange={e =>
                        handleInputChange(field.id, e.target.value)
                      }
                      className='text-blue-500 focus:ring-blue-500'
                    />
                    <span>Option 1</span>
                  </label>
                  <label className='flex items-center space-x-2 cursor-pointer'>
                    <input
                      type='radio'
                      name={field.id}
                      value='option2'
                      checked={value === 'option2'}
                      onChange={e =>
                        handleInputChange(field.id, e.target.value)
                      }
                      className='text-blue-500 focus:ring-blue-500'
                    />
                    <span>Option 2</span>
                  </label>
                  <label className='flex items-center space-x-2 cursor-pointer'>
                    <input
                      type='radio'
                      name={field.id}
                      value='option3'
                      checked={value === 'option3'}
                      onChange={e =>
                        handleInputChange(field.id, e.target.value)
                      }
                      className='text-blue-500 focus:ring-blue-500'
                    />
                    <span>Option 3</span>
                  </label>
                </>
              )}
            </div>
            {fieldError && (
              <div className='text-red-500 text-sm mt-2'>{fieldError}</div>
            )}
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.MULTIPLE_CHOICE:
        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <div className='space-y-2'>
              {field.options && field.options.length > 0 ? (
                field.options.map((option, index) => (
                  <label
                    key={index}
                    className='flex items-center space-x-2 cursor-pointer'
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
                      className='text-blue-500 focus:ring-blue-500'
                    />
                    <span>{option.label}</span>
                  </label>
                ))
              ) : (
                <>
                  <label className='flex items-center space-x-2 cursor-pointer'>
                    <input
                      type='checkbox'
                      value='option1'
                      checked={
                        Array.isArray(value) && value.includes('option1')
                      }
                      onChange={e => {
                        const currentValues = Array.isArray(value) ? value : [];
                        if (e.target.checked) {
                          handleInputChange(field.id, [
                            ...currentValues,
                            'option1',
                          ]);
                        } else {
                          handleInputChange(
                            field.id,
                            currentValues.filter(v => v !== 'option1')
                          );
                        }
                      }}
                      className='text-blue-500 focus:ring-blue-500'
                    />
                    <span>Option 1</span>
                  </label>
                  <label className='flex items-center space-x-2 cursor-pointer'>
                    <input
                      type='checkbox'
                      value='option2'
                      checked={
                        Array.isArray(value) && value.includes('option2')
                      }
                      onChange={e => {
                        const currentValues = Array.isArray(value) ? value : [];
                        if (e.target.checked) {
                          handleInputChange(field.id, [
                            ...currentValues,
                            'option2',
                          ]);
                        } else {
                          handleInputChange(
                            field.id,
                            currentValues.filter(v => v !== 'option2')
                          );
                        }
                      }}
                      className='text-blue-500 focus:ring-blue-500'
                    />
                    <span>Option 2</span>
                  </label>
                  <label className='flex items-center space-x-2 cursor-pointer'>
                    <input
                      type='checkbox'
                      value='option3'
                      checked={
                        Array.isArray(value) && value.includes('option3')
                      }
                      onChange={e => {
                        const currentValues = Array.isArray(value) ? value : [];
                        if (e.target.checked) {
                          handleInputChange(field.id, [
                            ...currentValues,
                            'option3',
                          ]);
                        } else {
                          handleInputChange(
                            field.id,
                            currentValues.filter(v => v !== 'option3')
                          );
                        }
                      }}
                      className='text-blue-500 focus:ring-blue-500'
                    />
                    <span>Option 3</span>
                  </label>
                </>
              )}
            </div>
            {fieldError && (
              <div className='text-red-500 text-sm mt-2'>{fieldError}</div>
            )}
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.NUMBER:
        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2 font-medium'>
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
              className={`w-full ${
                fieldError ? 'border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {fieldError && (
              <div className='text-red-500 text-sm mt-2'>{fieldError}</div>
            )}
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.TIME:
        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <Input
              type='time'
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              className={`w-full ${
                fieldError ? 'border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {fieldError && (
              <div className='text-red-500 text-sm mt-2'>{fieldError}</div>
            )}
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.HEADING:
        return (
          <div key={field.id} className='mb-6'>
            <h3
              className={`text-3xl font-semibold text-gray-700 border-b border-gray-200 pb-4 ${
                field.labelAlignment === 'RIGHT' ? 'text-right' : 'text-left'
              }`}
            >
              {field.label}
            </h3>
          </div>
        );

      case FieldType.FULL_NAME:
        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
                  className={`w-full ${
                    fieldError ? 'border-red-500 focus:ring-red-500' : ''
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
                  className={`w-full ${
                    fieldError ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                />
              </div>
            </div>
            {fieldError && (
              <div className='text-red-500 text-sm mt-2'>{fieldError}</div>
            )}
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.EMAIL:
        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <Input
              type='email'
              placeholder={field.placeholder || 'your.email@example.com'}
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              className={`w-full ${
                fieldError ? 'border-red-500 focus:ring-red-500' : ''
              }`}
              autoComplete='email'
            />
            {fieldError && (
              <div className='text-red-500 text-sm mt-2'>{fieldError}</div>
            )}
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.PHONE:
        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2 font-medium'>
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
              className={`w-full ${
                fieldError ? 'border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {fieldError && (
              <div className='text-red-500 text-sm mt-2'>{fieldError}</div>
            )}
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.ADDRESS:
        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <div className='space-y-3'>
              <Input
                placeholder='Street Address'
                value={value.street || ''}
                onChange={e =>
                  handleInputChange(field.id, {
                    ...value,
                    street: e.target.value,
                  })
                }
                className={`w-full ${
                  fieldError ? 'border-red-500 focus:ring-red-500' : ''
                }`}
              />
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                <Input
                  placeholder='City'
                  value={value.city || ''}
                  onChange={e =>
                    handleInputChange(field.id, {
                      ...value,
                      city: e.target.value,
                    })
                  }
                  className={`w-full ${
                    fieldError ? 'border-red-500 focus:ring-red-500' : ''
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
                  className={`w-full ${
                    fieldError ? 'border-red-500 focus:ring-red-500' : ''
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
                className={`w-full ${
                  fieldError ? 'border-red-500 focus:ring-red-500' : ''
                }`}
              />
            </div>
            {fieldError && (
              <div className='text-red-500 text-sm mt-2'>{fieldError}</div>
            )}
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.DATE_PICKER:
        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <Input
              type='date'
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              className={`w-full ${
                fieldError ? 'border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {fieldError && (
              <div className='text-red-500 text-sm mt-2'>{fieldError}</div>
            )}
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.APPOINTMENT:
        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
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
                  className={`w-full ${
                    fieldError ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                />
                <span className='text-sm text-gray-500 mt-1'>Date</span>
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
                  className={`w-full ${
                    fieldError ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                />
                <span className='text-sm text-gray-500 mt-1'>Time</span>
              </div>
            </div>
            {fieldError && (
              <div className='text-red-500 text-sm mt-2'>{fieldError}</div>
            )}
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <div className='border border-gray-300 rounded-md overflow-hidden'>
              <div className='flex bg-gray-100 p-3 border-b border-gray-300'>
                <div className='flex-1 font-medium text-gray-700'>Product</div>
                <div className='w-24 font-medium text-gray-700 text-center'>
                  Price
                </div>
                <div className='w-24 font-medium text-gray-700 text-center'>
                  Qty
                </div>
              </div>
              <div className='p-3 flex items-center border-b border-gray-200'>
                <div className='flex-1 text-gray-700'>Sample Product</div>
                <div className='w-24 text-center'>$19.99</div>
                <div className='w-24 text-center'>
                  <Input
                    type='number'
                    min='0'
                    defaultValue='1'
                    onChange={e =>
                      handleInputChange(field.id, { quantity: e.target.value })
                    }
                    className='w-16 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
              </div>
              <div className='p-3 flex justify-between bg-gray-50'>
                <span className='font-medium text-gray-700'>Total:</span>
                <span className='font-medium text-gray-700'>$19.99</span>
              </div>
            </div>
            {fieldError && (
              <div className='text-red-500 text-sm mt-2'>{fieldError}</div>
            )}
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.SIGNATURE:
        return (
          <SignatureField
            key={field.id}
            fieldId={field.id}
            label={field.label}
            required={field.required}
            helpText={field.helpText}
            value={value}
            onChange={value => handleInputChange(field.id, value)}
            error={fieldError}
            readOnly={false}
          />
        );

      case FieldType.FILL_BLANK: {
        //  USE ACTUAL FIELD CONFIGURATION from builder
        const beforeText =
          field.fillBlankTemplate?.beforeText || 'I agree to the';
        const blankPlaceholder =
          field.fillBlankTemplate?.blankPlaceholder || 'terms';
        const afterText =
          field.fillBlankTemplate?.afterText || 'and conditions.';

        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>

            {/*  PREVIEW: Show the configured template with interactive blank */}
            <div className='border border-gray-300 rounded-lg p-4 bg-gray-50'>
              <div className='flex flex-wrap items-center gap-2 text-gray-700 mb-3'>
                <span className='text-base'>{beforeText}</span>
                <input
                  type='text'
                  placeholder={blankPlaceholder}
                  value={value || ''}
                  onChange={e => handleInputChange(field.id, e.target.value)}
                  className={`px-3 py-2 border-b-2 border-blue-500 bg-blue-50 text-blue-700 min-w-[120px] focus:outline-none focus:bg-white focus:border-blue-600 text-center ${
                    fieldError ? 'border-red-500 bg-red-50' : ''
                  }`}
                />
                <span className='text-base'>{afterText}</span>
              </div>

              {/*  Show what user typed */}
              {value && (
                <div className='text-sm text-green-600 mt-2'>
                  ✓ Your answer: &quot;{value}&quot;
                </div>
              )}
            </div>

            {fieldError && (
              <div className='text-red-500 text-sm mt-2'>{fieldError}</div>
            )}
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );
      }

      case FieldType.PRODUCT_LIST: {
        //  USE ACTUAL PRODUCT CONFIGURATION from builder
        const products = field.productListConfig?.products || [
          { id: '1', name: 'Sample Product', price: 19.99, quantity: 1 },
        ];

        // Initialize value as object if not already
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

        // Calculate total
        const calculateTotal = () => {
          return products.reduce((total, product) => {
            const quantity = currentSelections[product.id] || 0;
            return total + product.price * quantity;
          }, 0);
        };

        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>

            {/*  PREVIEW: Show configured products with quantity selectors */}
            <div className='border border-gray-300 rounded-md overflow-hidden bg-white'>
              {/* Header */}
              <div className='bg-gray-100 p-3 border-b border-gray-300'>
                <div className='grid grid-cols-12 gap-2 font-medium text-gray-700 text-sm'>
                  <div className='col-span-6'>Product</div>
                  <div className='col-span-3 text-center'>Price</div>
                  <div className='col-span-3 text-center'>Quantity</div>
                </div>
              </div>

              {/*  Product List from Builder Configuration */}
              <div className='divide-y divide-gray-200'>
                {products.map(product => (
                  <div key={product.id} className='p-3'>
                    <div className='grid grid-cols-12 gap-2 items-center'>
                      <div className='col-span-6'>
                        <div className='text-gray-900 font-medium'>
                          {product.name}
                        </div>
                      </div>
                      <div className='col-span-3 text-center text-gray-700'>
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
                          className={`w-16 px-2 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            fieldError ? 'border-red-500' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/*  Total Section */}
              <div className='bg-gray-50 p-3 border-t border-gray-300'>
                <div className='flex justify-between items-center'>
                  <span className='font-medium text-gray-700'>Total:</span>
                  <span className='font-bold text-lg text-green-600'>
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>

                {/*  Show selected items summary */}
                {Object.keys(currentSelections).length > 0 && (
                  <div className='mt-2 text-sm text-gray-600'>
                    {Object.keys(currentSelections).map(productId => {
                      const product = products.find(p => p.id === productId);
                      const quantity = currentSelections[productId];
                      return quantity > 0 && product ? (
                        <div key={productId} className='flex justify-between'>
                          <span>
                            {product.name} (×{quantity})
                          </span>
                          <span>${(product.price * quantity).toFixed(2)}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>

            {fieldError && (
              <div className='text-red-500 text-sm mt-2'>{fieldError}</div>
            )}
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );
      }

      default:
        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <Input
              placeholder={field.placeholder || field.label}
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              className={`w-full ${
                fieldError ? 'border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {fieldError && (
              <div className='text-red-500 text-sm mt-2'>{fieldError}</div>
            )}
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );
    }
  };

  return (
    <div className='max-w-3xl mx-auto p-8'>
      {/* Logo */}
      {form.logo && form.logo.src && (
        <div className='mb-8 w-full'>
          <FormLogo />
        </div>
      )}

      {/* Form Title */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>{form.title}</h1>
        {form.description && (
          <p className='text-gray-600 mt-2'>{form.description}</p>
        )}
      </div>

      {/* Form Fields */}
      <div className='space-y-6'>
        {currentPage?.fields?.map(field => renderField(field))}
      </div>

      {/* Navigation Buttons */}
      <div className='flex justify-between items-center mt-8 pt-6 border-t border-gray-200'>
        {!isFirstPage ? (
          <button
            onClick={handleBack}
            className='px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors'
          >
            Back
          </button>
        ) : (
          <div></div>
        )}

        {!isLastPage ? (
          <button
            onClick={handleNext}
            className='px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors'
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className='px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isSubmitting
              ? 'Submitting...'
              : form.settings?.submitButtonText || 'Submit'}
          </button>
        )}
      </div>

      {/* Page Indicator */}
      {form.pages.length > 1 && (
        <div className='flex justify-center items-center mt-4 space-x-2'>
          {form.pages.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === currentPageIndex ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
