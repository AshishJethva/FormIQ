// // src/components/form-builder/settings/FormSettingsPage.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { RootState } from '@/redux/store';
// import {
//   updateFormSettings,
//   setFormTitle,
// } from '@/redux/slices/formBuilderSlice';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { Settings, CheckCircle, XCircle } from 'lucide-react';
// import { toast } from 'sonner';
// import { motion } from 'framer-motion';

// export default function FormSettingsPage() {
//   const dispatch = useDispatch();
//   const form = useSelector((state: RootState) => state.formBuilder.form);

//   const [title, setTitle] = useState(form?.title || '');
//   const [description, setDescription] = useState(form?.description || '');
//   const [submitButtonText, setSubmitButtonText] = useState(
//     form?.settings?.submitButtonText || 'Submit'
//   );
//   const [thankyouMessage, setThankyouMessage] = useState(
//     form?.settings?.thankyouMessage || 'Thank you for your submission!'
//   );
//   const [isFormEnabled, setIsFormEnabled] = useState(true);

//   useEffect(() => {
//     if (form) {
//       setTitle(form.title || '');
//       setDescription(form.description || '');
//       setSubmitButtonText(form.settings?.submitButtonText || 'Submit');
//       setThankyouMessage(
//         form.settings?.thankyouMessage || 'Thank you for your submission!'
//       );
//     }
//   }, [form]);

//   const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const newTitle = e.target.value;
//     setTitle(newTitle);
//     dispatch(setFormTitle(newTitle));
//   };

//   const handleDescriptionChange = (
//     e: React.ChangeEvent<HTMLTextAreaElement>
//   ) => {
//     setDescription(e.target.value);
//     // You can dispatch an action to update description if needed
//   };

//   const handleSubmitButtonTextChange = (
//     e: React.ChangeEvent<HTMLInputElement>
//   ) => {
//     const newText = e.target.value;
//     setSubmitButtonText(newText);
//     dispatch(
//       updateFormSettings({
//         submitButtonText: newText,
//       })
//     );
//   };

//   const handleThankyouMessageChange = (
//     e: React.ChangeEvent<HTMLTextAreaElement>
//   ) => {
//     const newMessage = e.target.value;
//     setThankyouMessage(newMessage);
//     dispatch(
//       updateFormSettings({
//         thankyouMessage: newMessage,
//       })
//     );
//   };

//   const handleFormStatusToggle = () => {
//     setIsFormEnabled(!isFormEnabled);
//     toast.success(`Form ${!isFormEnabled ? 'enabled' : 'disabled'}`);
//   };

//   if (!form) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <div className='max-w-4xl mx-auto p-8 bg-white min-h-screen'>
//       {/* Header */}
//       <div className='mb-8'>
//         <div className='flex items-center mb-4'>
//           <div className='w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mr-4'>
//             <Settings className='w-6 h-6 text-white' />
//           </div>
//           <div>
//             <h1 className='text-2xl font-bold text-gray-900'>FORM SETTINGS</h1>
//             <p className='text-gray-600'>
//               Customize form status and properties
//             </p>
//           </div>
//         </div>
//       </div>

//       <div className='space-y-8'>
//         {/* Form Title */}
//         <motion.div
//           className='bg-gray-50 rounded-lg p-6'
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.1 }}
//         >
//           <div className='mb-4'>
//             <Label
//               htmlFor='form-title'
//               className='text-lg font-medium text-gray-900'
//             >
//               Title
//             </Label>
//             <p className='text-sm text-gray-600 mt-1'>
//               Enter a name for your form
//             </p>
//           </div>
//           <Input
//             id='form-title'
//             value={title}
//             onChange={handleTitleChange}
//             placeholder='Enter form title'
//             className='text-lg'
//           />
//         </motion.div>

//         {/* Form Description */}
//         <motion.div
//           className='bg-gray-50 rounded-lg p-6'
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.2 }}
//         >
//           <div className='mb-4'>
//             <Label
//               htmlFor='form-description'
//               className='text-lg font-medium text-gray-900'
//             >
//               Description
//             </Label>
//             <p className='text-sm text-gray-600 mt-1'>
//               Optional description for your form
//             </p>
//           </div>
//           <Textarea
//             id='form-description'
//             value={description}
//             onChange={handleDescriptionChange}
//             placeholder='Enter form description (optional)'
//             rows={3}
//           />
//         </motion.div>

//         {/* Form Status */}
//         <motion.div
//           className='bg-gray-50 rounded-lg p-6'
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.3 }}
//         >
//           <div className='mb-4'>
//             <Label className='text-lg font-medium text-gray-900'>
//               Form Status
//             </Label>
//             <p className='text-sm text-gray-600 mt-1'>
//               Enable, disable, or conditionally enable your form
//             </p>
//           </div>

//           <div
//             className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
//               isFormEnabled
//                 ? 'border-green-200 bg-green-50'
//                 : 'border-red-200 bg-red-50'
//             }`}
//             onClick={handleFormStatusToggle}
//           >
//             <div className='flex items-center'>
//               <div
//                 className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
//                   isFormEnabled ? 'bg-green-500' : 'bg-red-500'
//                 }`}
//               >
//                 {isFormEnabled ? (
//                   <CheckCircle className='w-5 h-5 text-white' />
//                 ) : (
//                   <XCircle className='w-5 h-5 text-white' />
//                 )}
//               </div>
//               <div>
//                 <h3
//                   className={`font-medium ${
//                     isFormEnabled ? 'text-green-800' : 'text-red-800'
//                   }`}
//                 >
//                   {isFormEnabled ? 'ENABLED' : 'DISABLED'}
//                 </h3>
//                 <p
//                   className={`text-sm ${
//                     isFormEnabled ? 'text-green-600' : 'text-red-600'
//                   }`}
//                 >
//                   {isFormEnabled
//                     ? 'Your form is currently visible and able to receive submissions'
//                     : 'Your form is currently disabled and cannot receive submissions'}
//                 </p>
//               </div>
//             </div>
//             <div className='text-gray-400'>
//               <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
//                 <path
//                   fillRule='evenodd'
//                   d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
//                   clipRule='evenodd'
//                 />
//               </svg>
//             </div>
//           </div>
//         </motion.div>

//         {/* Submit Button Text */}
//         <motion.div
//           className='bg-gray-50 rounded-lg p-6'
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.4 }}
//         >
//           <div className='mb-4'>
//             <Label
//               htmlFor='submit-button-text'
//               className='text-lg font-medium text-gray-900'
//             >
//               Submit Button Text
//             </Label>
//             <p className='text-sm text-gray-600 mt-1'>
//               Customize the text on your submit button
//             </p>
//           </div>
//           <Input
//             id='submit-button-text'
//             value={submitButtonText}
//             onChange={handleSubmitButtonTextChange}
//             placeholder='Submit'
//           />
//         </motion.div>

//         {/* Thank You Message */}
//         <motion.div
//           className='bg-gray-50 rounded-lg p-6'
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.5 }}
//         >
//           <div className='mb-4'>
//             <Label
//               htmlFor='thankyou-message'
//               className='text-lg font-medium text-gray-900'
//             >
//               Thank You Message
//             </Label>
//             <p className='text-sm text-gray-600 mt-1'>
//               Message shown after form submission
//             </p>
//           </div>
//           <Textarea
//             id='thankyou-message'
//             value={thankyouMessage}
//             onChange={handleThankyouMessageChange}
//             placeholder='Thank you for your submission!'
//             rows={3}
//           />
//         </motion.div>

//         {/* Save Status */}
//         <div className='text-center'>
//           <p className='text-sm text-green-600 flex items-center justify-center'>
//             <CheckCircle className='w-4 h-4 mr-2' />
//             All changes are automatically saved
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

// src/components/form-builder/settings/FormSettingsPage.tsx - Updated with Auto-Save
'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import {
  updateFormSettings,
  setFormTitle,
} from '@/redux/slices/formBuilderSlice';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Settings, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import useAutoSave from '@/hooks/useAutoSave';
import { useParams } from 'next/navigation';

export default function FormSettingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams();
  const formId = params.formId as string;

  const form = useSelector((state: RootState) => state.formBuilder.form);

  const [title, setTitle] = useState(form?.title || '');
  const [description, setDescription] = useState(form?.description || '');
  const [submitButtonText, setSubmitButtonText] = useState(
    form?.settings?.submitButtonText || 'Submit'
  );
  const [thankyouMessage, setThankyouMessage] = useState(
    form?.settings?.thankyouMessage || 'Thank you for your submission!'
  );
  const [isFormEnabled, setIsFormEnabled] = useState(true);

  // Auto-save hook for settings
  const { isSaving, lastSaved } = useAutoSave(form, formId, !!form, {
    delay: 1500, // Slightly faster for settings
    enableToast: false,
  });

  useEffect(() => {
    if (form) {
      setTitle(form.title || '');
      setDescription(form.description || '');
      setSubmitButtonText(form.settings?.submitButtonText || 'Submit');
      setThankyouMessage(
        form.settings?.thankyouMessage || 'Thank you for your submission!'
      );
    }
  }, [form]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    dispatch(setFormTitle(newTitle));
  };

  const handleSubmitButtonTextChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newText = e.target.value;
    setSubmitButtonText(newText);
    dispatch(
      updateFormSettings({
        submitButtonText: newText,
      })
    );
  };

  const handleThankyouMessageChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newMessage = e.target.value;
    setThankyouMessage(newMessage);
    dispatch(
      updateFormSettings({
        thankyouMessage: newMessage,
      })
    );
  };

  const handleFormStatusToggle = () => {
    setIsFormEnabled(!isFormEnabled);
    toast.success(`Form ${!isFormEnabled ? 'enabled' : 'disabled'}`);
  };

  if (!form) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-gray-500'>Loading form settings...</div>
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto p-8 bg-white min-h-screen'>
      {/* Auto-save indicator */}
      {isSaving && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className='fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
        >
          Saving settings...
        </motion.div>
      )}

      {/* Header */}
      <div className='mb-8'>
        <div className='flex items-center mb-4'>
          <div className='w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mr-4'>
            <Settings className='w-6 h-6 text-white' />
          </div>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>FORM SETTINGS</h1>
            <p className='text-gray-600'>
              Customize form status and properties
            </p>
            {lastSaved && (
              <p className='text-sm text-green-600 mt-1'>
                Last saved: {lastSaved.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className='space-y-8'>
        {/* Form Title */}
        <motion.div
          className='bg-gray-50 rounded-lg p-6'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className='mb-4'>
            <Label
              htmlFor='form-title'
              className='text-lg font-medium text-gray-900'
            >
              Title
            </Label>
            <p className='text-sm text-gray-600 mt-1'>
              Enter a name for your form
            </p>
          </div>
          <Input
            id='form-title'
            value={title}
            onChange={handleTitleChange}
            placeholder='Enter form title'
            className='text-lg'
          />
        </motion.div>

        {/* Form Description */}
        <motion.div
          className='bg-gray-50 rounded-lg p-6'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className='mb-4'>
            <Label
              htmlFor='form-description'
              className='text-lg font-medium text-gray-900'
            >
              Description
            </Label>
            <p className='text-sm text-gray-600 mt-1'>
              Optional description for your form
            </p>
          </div>
          <Textarea
            id='form-description'
            value={description}
            placeholder='Enter form description (optional)'
            rows={3}
          />
        </motion.div>

        {/* Form Status */}
        <motion.div
          className='bg-gray-50 rounded-lg p-6'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className='mb-4'>
            <Label className='text-lg font-medium text-gray-900'>
              Form Status
            </Label>
            <p className='text-sm text-gray-600 mt-1'>
              Enable, disable, or conditionally enable your form
            </p>
          </div>

          <div
            className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
              isFormEnabled
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }`}
            onClick={handleFormStatusToggle}
          >
            <div className='flex items-center'>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                  isFormEnabled ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                {isFormEnabled ? (
                  <CheckCircle className='w-5 h-5 text-white' />
                ) : (
                  <XCircle className='w-5 h-5 text-white' />
                )}
              </div>
              <div>
                <h3
                  className={`font-medium ${
                    isFormEnabled ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {isFormEnabled ? 'ENABLED' : 'DISABLED'}
                </h3>
                <p
                  className={`text-sm ${
                    isFormEnabled ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {isFormEnabled
                    ? 'Your form is currently visible and able to receive submissions'
                    : 'Your form is currently disabled and cannot receive submissions'}
                </p>
              </div>
            </div>
            <div className='text-gray-400'>
              <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Submit Button Text */}
        <motion.div
          className='bg-gray-50 rounded-lg p-6'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className='mb-4'>
            <Label
              htmlFor='submit-button-text'
              className='text-lg font-medium text-gray-900'
            >
              Submit Button Text
            </Label>
            <p className='text-sm text-gray-600 mt-1'>
              Customize the text on your submit button
            </p>
          </div>
          <Input
            id='submit-button-text'
            value={submitButtonText}
            onChange={handleSubmitButtonTextChange}
            placeholder='Submit'
          />
        </motion.div>

        {/* Thank You Message */}
        <motion.div
          className='bg-gray-50 rounded-lg p-6'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className='mb-4'>
            <Label
              htmlFor='thankyou-message'
              className='text-lg font-medium text-gray-900'
            >
              Thank You Message
            </Label>
            <p className='text-sm text-gray-600 mt-1'>
              Message shown after form submission
            </p>
          </div>
          <Textarea
            id='thankyou-message'
            value={thankyouMessage}
            onChange={handleThankyouMessageChange}
            placeholder='Thank you for your submission!'
            rows={3}
          />
        </motion.div>

        {/* Save Status */}
        <div className='text-center'>
          <p className='text-sm text-green-600 flex items-center justify-center'>
            <CheckCircle className='w-4 h-4 mr-2' />
            All changes are automatically saved
            {isSaving && <span className='ml-2'>• Saving...</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
