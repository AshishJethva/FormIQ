// src/components/form-builder/preview/PreviewForm.tsx
'use client';

import { Form, Field, FieldType } from '@/types/form';
import { Input } from '@/components/ui/input';
import FormLogo from '../logo/FormLogo';

interface PreviewFormProps {
  form: Form;
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  currentPageIndex: number;
  setCurrentPageIndex: (index: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function PreviewForm({
  form,
  formData,
  setFormData,
  currentPageIndex,
  setCurrentPageIndex,
  onSubmit,
  isSubmitting,
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

  const renderField = (field: Field) => {
    const value = formData[field.id] || '';

    switch (field.type) {
      case FieldType.HEADING:
        return (
          <div key={field.id} className='mb-6'>
            <h3 className='text-3xl font-semibold text-gray-700 border-b border-gray-200 pb-4'>
              {field.label}
            </h3>
          </div>
        );

      case FieldType.FULL_NAME:
        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <div className='grid grid-cols-2 gap-4'>
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
                  className='w-full'
                />
                <span className='text-sm text-gray-500 mt-1'>First Name</span>
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
                  className='w-full'
                />
                <span className='text-sm text-gray-500 mt-1'>Last Name</span>
              </div>
            </div>
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.EMAIL:
        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <Input
              type='email'
              placeholder={'Email address'}
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              className='w-full'
            />
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.PHONE:
        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <Input
              type='number'
              placeholder='9876543210'
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              className='w-full'
              pattern='[6-9]\d{9}'
              maxLength={10}
              minLength={10}
            />
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.ADDRESS:
        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <div className='space-y-2'>
              <Input
                placeholder='Street Address'
                value={value.street || ''}
                onChange={e =>
                  handleInputChange(field.id, {
                    ...value,
                    street: e.target.value,
                  })
                }
                className='w-full'
              />
              <div className='grid grid-cols-2 gap-2'>
                <Input
                  placeholder='City'
                  value={value.city || ''}
                  onChange={e =>
                    handleInputChange(field.id, {
                      ...value,
                      city: e.target.value,
                    })
                  }
                  className='w-full'
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
                  className='w-full'
                />
              </div>
            </div>
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.DATE_PICKER:
        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <Input
              type='date'
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              className='w-full'
            />
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.APPOINTMENT:
        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <div className='grid grid-cols-2 gap-2'>
              <Input
                type='date'
                value={value.date || ''}
                onChange={e =>
                  handleInputChange(field.id, {
                    ...value,
                    date: e.target.value,
                  })
                }
                className='w-full'
              />
              <Input
                type='time'
                value={value.time || ''}
                onChange={e =>
                  handleInputChange(field.id, {
                    ...value,
                    time: e.target.value,
                  })
                }
                className='w-full'
              />
            </div>
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.SIGNATURE:
        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <div className='h-32 border-2 border-dashed border-gray-300 rounded-md bg-gray-50 flex items-center justify-center text-gray-400 cursor-pointer hover:border-gray-400 transition-colors'>
              {value ? (
                <span className='text-gray-600'>Signature added</span>
              ) : (
                <span>Click to sign</span>
              )}
            </div>
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.FILL_BLANK:
        return (
          <div key={field.id} className='mb-6'>
            <div className='flex items-center flex-wrap gap-2'>
              <span className='text-gray-700'>I agree to the</span>
              <Input
                className='w-32 inline-block'
                placeholder='terms'
                value={value}
                onChange={e => handleInputChange(field.id, e.target.value)}
              />
              <span className='text-gray-700'>and conditions.</span>
            </div>
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
            )}
          </div>
        );

      default:
        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <Input
              placeholder={field.label}
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              className='w-full'
            />
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
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
            onClick={onSubmit}
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
