// // src/components/form-builder/preview/PreviewForm.tsx
// 'use client';

// import { Form, Field, FieldType } from '@/types/form';
// import { Input } from '@/components/ui/input';
// import FormLogo from '../logo/FormLogo';

// interface PreviewFormProps {
//   form: Form;
//   formData: Record<string, any>;
//   setFormData: (data: Record<string, any>) => void;
//   currentPageIndex: number;
//   setCurrentPageIndex: (index: number) => void;
//   onSubmit: () => void;
//   isSubmitting: boolean;
// }

// export default function PreviewForm({
//   form,
//   formData,
//   setFormData,
//   currentPageIndex,
//   setCurrentPageIndex,
//   onSubmit,
//   isSubmitting,
// }: PreviewFormProps) {
//   const currentPage = form.pages[currentPageIndex];
//   const isFirstPage = currentPageIndex === 0;
//   const isLastPage = currentPageIndex === form.pages.length - 1;

//   const handleInputChange = (fieldId: string, value: any) => {
//     setFormData((prev: any) => ({
//       ...prev,
//       [fieldId]: value,
//     }));
//   };

//   const handleNext = () => {
//     if (!isLastPage) {
//       setCurrentPageIndex(currentPageIndex + 1);
//     }
//   };

//   const handleBack = () => {
//     if (!isFirstPage) {
//       setCurrentPageIndex(currentPageIndex - 1);
//     }
//   };

//   const renderField = (field: Field) => {
//     const value = formData[field.id] || '';

//     switch (field.type) {
//       case FieldType.HEADING:
//         return (
//           <div key={field.id} className='mb-6'>
//             <h3 className='text-3xl font-semibold text-gray-700 border-b border-gray-200 pb-4'>
//               {field.label}
//             </h3>
//           </div>
//         );

//       case FieldType.FULL_NAME:
//         return (
//           <div key={field.id} className='mb-6'>
//             <label className='block text-gray-700 mb-2'>
//               {field.label}
//               {field.required && <span className='text-red-500 ml-1'>*</span>}
//             </label>
//             <div className='grid grid-cols-2 gap-4'>
//               <div>
//                 <Input
//                   placeholder='First Name'
//                   value={value.firstName || ''}
//                   onChange={e =>
//                     handleInputChange(field.id, {
//                       ...value,
//                       firstName: e.target.value,
//                     })
//                   }
//                   className='w-full'
//                 />
//                 <span className='text-sm text-gray-500 mt-1'>First Name</span>
//               </div>
//               <div>
//                 <Input
//                   placeholder='Last Name'
//                   value={value.lastName || ''}
//                   onChange={e =>
//                     handleInputChange(field.id, {
//                       ...value,
//                       lastName: e.target.value,
//                     })
//                   }
//                   className='w-full'
//                 />
//                 <span className='text-sm text-gray-500 mt-1'>Last Name</span>
//               </div>
//             </div>
//             {field.helpText && (
//               <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
//             )}
//           </div>
//         );

//       case FieldType.EMAIL:
//         return (
//           <div key={field.id} className='mb-6'>
//             <label className='block text-gray-700 mb-2'>
//               {field.label}
//               {field.required && <span className='text-red-500 ml-1'>*</span>}
//             </label>
//             <Input
//               type='email'
//               placeholder={'Email address'}
//               value={value}
//               onChange={e => handleInputChange(field.id, e.target.value)}
//               className='w-full'
//             />
//             {field.helpText && (
//               <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
//             )}
//           </div>
//         );

//       case FieldType.PHONE:
//         return (
//           <div key={field.id} className='mb-6'>
//             <label className='block text-gray-700 mb-2'>
//               {field.label}
//               {field.required && <span className='text-red-500 ml-1'>*</span>}
//             </label>
//             <Input
//               type='number'
//               placeholder='9876543210'
//               value={value}
//               onChange={e => handleInputChange(field.id, e.target.value)}
//               className='w-full'
//               pattern='[6-9]\d{9}'
//               maxLength={10}
//               minLength={10}
//             />
//             {field.helpText && (
//               <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
//             )}
//           </div>
//         );

//       case FieldType.ADDRESS:
//         return (
//           <div key={field.id} className='mb-6'>
//             <label className='block text-gray-700 mb-2'>
//               {field.label}
//               {field.required && <span className='text-red-500 ml-1'>*</span>}
//             </label>
//             <div className='space-y-2'>
//               <Input
//                 placeholder='Street Address'
//                 value={value.street || ''}
//                 onChange={e =>
//                   handleInputChange(field.id, {
//                     ...value,
//                     street: e.target.value,
//                   })
//                 }
//                 className='w-full'
//               />
//               <div className='grid grid-cols-2 gap-2'>
//                 <Input
//                   placeholder='City'
//                   value={value.city || ''}
//                   onChange={e =>
//                     handleInputChange(field.id, {
//                       ...value,
//                       city: e.target.value,
//                     })
//                   }
//                   className='w-full'
//                 />
//                 <Input
//                   placeholder='State/Province'
//                   value={value.state || ''}
//                   onChange={e =>
//                     handleInputChange(field.id, {
//                       ...value,
//                       state: e.target.value,
//                     })
//                   }
//                   className='w-full'
//                 />
//               </div>
//             </div>
//             {field.helpText && (
//               <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
//             )}
//           </div>
//         );

//       case FieldType.DATE_PICKER:
//         return (
//           <div key={field.id} className='mb-6'>
//             <label className='block text-gray-700 mb-2'>
//               {field.label}
//               {field.required && <span className='text-red-500 ml-1'>*</span>}
//             </label>
//             <Input
//               type='date'
//               value={value}
//               onChange={e => handleInputChange(field.id, e.target.value)}
//               className='w-full'
//             />
//             {field.helpText && (
//               <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
//             )}
//           </div>
//         );

//       case FieldType.APPOINTMENT:
//         return (
//           <div key={field.id} className='mb-6'>
//             <label className='block text-gray-700 mb-2'>
//               {field.label}
//               {field.required && <span className='text-red-500 ml-1'>*</span>}
//             </label>
//             <div className='grid grid-cols-2 gap-2'>
//               <Input
//                 type='date'
//                 value={value.date || ''}
//                 onChange={e =>
//                   handleInputChange(field.id, {
//                     ...value,
//                     date: e.target.value,
//                   })
//                 }
//                 className='w-full'
//               />
//               <Input
//                 type='time'
//                 value={value.time || ''}
//                 onChange={e =>
//                   handleInputChange(field.id, {
//                     ...value,
//                     time: e.target.value,
//                   })
//                 }
//                 className='w-full'
//               />
//             </div>
//             {field.helpText && (
//               <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
//             )}
//           </div>
//         );

//       case FieldType.SIGNATURE:
//         return (
//           <div key={field.id} className='mb-6'>
//             <label className='block text-gray-700 mb-2'>
//               {field.label}
//               {field.required && <span className='text-red-500 ml-1'>*</span>}
//             </label>
//             <div className='h-32 border-2 border-dashed border-gray-300 rounded-md bg-gray-50 flex items-center justify-center text-gray-400 cursor-pointer hover:border-gray-400 transition-colors'>
//               {value ? (
//                 <span className='text-gray-600'>Signature added</span>
//               ) : (
//                 <span>Click to sign</span>
//               )}
//             </div>
//             {field.helpText && (
//               <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
//             )}
//           </div>
//         );

//       case FieldType.FILL_BLANK:
//         return (
//           <div key={field.id} className='mb-6'>
//             <div className='flex items-center flex-wrap gap-2'>
//               <span className='text-gray-700'>I agree to the</span>
//               <Input
//                 className='w-32 inline-block'
//                 placeholder='terms'
//                 value={value}
//                 onChange={e => handleInputChange(field.id, e.target.value)}
//               />
//               <span className='text-gray-700'>and conditions.</span>
//             </div>
//             {field.helpText && (
//               <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
//             )}
//           </div>
//         );

//       default:
//         return (
//           <div key={field.id} className='mb-6'>
//             <label className='block text-gray-700 mb-2'>
//               {field.label}
//               {field.required && <span className='text-red-500 ml-1'>*</span>}
//             </label>
//             <Input
//               placeholder={field.label}
//               value={value}
//               onChange={e => handleInputChange(field.id, e.target.value)}
//               className='w-full'
//             />
//             {field.helpText && (
//               <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
//             )}
//           </div>
//         );
//     }
//   };

//   return (
//     <div className='max-w-3xl mx-auto p-8'>
//       {/* Logo */}
//       {form.logo && form.logo.src && (
//         <div className='mb-8 w-full'>
//           <FormLogo />
//         </div>
//       )}

//       {/* Form Title */}
//       <div className='mb-8'>
//         <h1 className='text-3xl font-bold text-gray-900'>{form.title}</h1>
//         {form.description && (
//           <p className='text-gray-600 mt-2'>{form.description}</p>
//         )}
//       </div>

//       {/* Form Fields */}
//       <div className='space-y-6'>
//         {currentPage?.fields?.map(field => renderField(field))}
//       </div>

//       {/* Navigation Buttons */}
//       <div className='flex justify-between items-center mt-8 pt-6 border-t border-gray-200'>
//         {!isFirstPage ? (
//           <button
//             onClick={handleBack}
//             className='px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors'
//           >
//             Back
//           </button>
//         ) : (
//           <div></div>
//         )}

//         {!isLastPage ? (
//           <button
//             onClick={handleNext}
//             className='px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors'
//           >
//             Next
//           </button>
//         ) : (
//           <button
//             onClick={onSubmit}
//             disabled={isSubmitting}
//             className='px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
//           >
//             {isSubmitting
//               ? 'Submitting...'
//               : form.settings?.submitButtonText || 'Submit'}
//           </button>
//         )}
//       </div>

//       {/* Page Indicator */}
//       {form.pages.length > 1 && (
//         <div className='flex justify-center items-center mt-4 space-x-2'>
//           {form.pages.map((_, index) => (
//             <div
//               key={index}
//               className={`w-2 h-2 rounded-full ${
//                 index === currentPageIndex ? 'bg-blue-500' : 'bg-gray-300'
//               }`}
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

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
      // ✅ NEW: Basic Elements
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
              className='w-full'
            />
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
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none'
            />
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
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none'
            />
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
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white'
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
              className='w-full'
            />
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.IMAGE:
        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <div
              className='border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50'
              onClick={() => handleInputChange(field.id, 'image-uploaded')}
            >
              {value ? (
                <div className='flex items-center justify-center'>
                  <span className='text-green-600 font-medium'>
                    ✓ Image uploaded
                  </span>
                </div>
              ) : (
                <>
                  <div className='text-4xl mb-2'>📷</div>
                  <p className='text-gray-500 text-sm'>
                    Click to upload an image
                  </p>
                  <p className='text-gray-400 text-xs mt-1'>
                    PNG, JPG, GIF up to 10MB
                  </p>
                </>
              )}
            </div>
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.FILE_UPLOAD:
        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <div
              className='border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50'
              onClick={() => handleInputChange(field.id, 'file-uploaded')}
            >
              {value ? (
                <div className='flex items-center justify-center'>
                  <span className='text-green-600 font-medium'>
                    ✓ File uploaded
                  </span>
                </div>
              ) : (
                <>
                  <div className='text-4xl mb-2'>📄</div>
                  <p className='text-gray-500 text-sm'>Click to upload files</p>
                  <p className='text-gray-400 text-xs mt-1'>
                    {field.accept
                      ? `Accepted: ${field.accept}`
                      : 'Any file type up to 25MB'}
                  </p>
                </>
              )}
            </div>
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
              className='w-full'
            />
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      // ✅ EXISTING: Advanced Elements (updated)
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
              className='w-full'
              autoComplete='email'
            />
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
                // Remove all non-digit characters
                const digitsOnly = input.replace(/\D/g, '');
                // Limit to 10 digits
                const limitedDigits = digitsOnly.slice(0, 10);
                handleInputChange(field.id, limitedDigits);
              }}
              onKeyPress={e => {
                // Only allow digits
                if (
                  !/[0-9]/.test(e.key) &&
                  !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)
                ) {
                  e.preventDefault();
                }
              }}
              maxLength={10}
              className='w-full'
            />
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
                className='w-full'
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
              <Input
                placeholder='ZIP/Postal Code (Optional)'
                value={value.zipCode || ''}
                onChange={e =>
                  handleInputChange(field.id, {
                    ...value,
                    zipCode: e.target.value,
                  })
                }
                className='w-full'
              />
            </div>
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
              className='w-full'
            />
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
                  className='w-full'
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
                  className='w-full'
                />
                <span className='text-sm text-gray-500 mt-1'>Time</span>
              </div>
            </div>
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.SIGNATURE:
        return (
          <div key={field.id} className='mb-6'>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <div
              className='h-32 border-2 border-dashed border-gray-300 rounded-md bg-gray-50 flex items-center justify-center text-gray-400 cursor-pointer hover:border-gray-400 transition-colors'
              onClick={() => handleInputChange(field.id, 'Signature added')}
            >
              {value ? (
                <span className='text-gray-700 font-medium'>
                  ✓ Signature added
                </span>
              ) : (
                <span>Click to sign</span>
              )}
            </div>
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.FILL_BLANK:
        return (
          <div key={field.id} className='mb-6'>
            <div className='flex items-center flex-wrap gap-2 text-gray-700'>
              <span>I agree to the</span>
              <Input
                className='w-32 inline-block'
                placeholder='terms'
                value={value}
                onChange={e => handleInputChange(field.id, e.target.value)}
              />
              <span>and conditions.</span>
            </div>
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.PRODUCT_LIST:
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
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

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
              className='w-full'
            />
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
