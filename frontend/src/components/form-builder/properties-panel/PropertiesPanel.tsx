// // src/components/form-builder/properties-panel/PropertiesPanel.tsx
// 'use client';

// import { useSelector, useDispatch } from 'react-redux';
// import { RootState } from '@/redux/store';
// import {
//   updateField,
//   removeField,
//   duplicateField,
//   togglePropertiesPanel,
//   updateFormSettings,
// } from '@/redux/slices/formBuilder/formBuilderSlice';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { X, Trash, Copy, Settings as SettingsIcon } from 'lucide-react';
// import { useState, useEffect, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { toast } from 'sonner';
// import { FieldType } from '@/types/form';

// // Include CENTER alignment to match your backend
// type LabelAlignmentType = 'LEFT' | 'RIGHT';

// export default function PropertiesPanel() {
//   const dispatch = useDispatch();
//   const form = useSelector((state: RootState) => state.formBuilder.form);
//   const panelRef = useRef<HTMLDivElement>(null);

//   // Move ALL useState hooks to the top, before any conditional logic
//   const [labelAlignment, setLabelAlignment] =
//     useState<LabelAlignmentType>('LEFT');
//   const [isRequired, setIsRequired] = useState(false);
//   const [helpText, setHelpText] = useState('');
//   const [useAsDefault, setUseAsDefault] = useState(false);
//   const [options, setOptions] = useState([
//     { label: 'Option 1', value: 'option1' },
//     { label: 'Option 2', value: 'option2' },
//     { label: 'Option 3', value: 'option3' },
//   ]);

//   // Find the selected field from the correct page
//   const getSelectedField = () => {
//     if (!form?.selectedFieldId || !form.pages) return null;

//     for (const page of form.pages) {
//       if (!page || !page.fields) continue;
//       const foundField = page.fields.find(
//         field => field.id === form.selectedFieldId
//       );
//       if (foundField) {
//         return {
//           field: foundField,
//           pageId: page.id,
//         };
//       }
//     }
//     return null;
//   };

//   const selectedFieldData = getSelectedField();
//   const field = selectedFieldData?.field;
//   const pageId = selectedFieldData?.pageId;

//   const isHeadingField = field?.type === 'heading';
//   const isChoiceField =
//     field?.type === FieldType.DROPDOWN ||
//     field?.type === FieldType.SINGLE_CHOICE ||
//     field?.type === FieldType.MULTIPLE_CHOICE;

//   // Update local state when selected field changes
//   useEffect(() => {
//     if (field) {
//       setLabelAlignment((field.labelAlignment as LabelAlignmentType) || 'LEFT');
//       setIsRequired(field.required || false);
//       setHelpText(field.helpText || '');

//       // Update options for choice fields
//       if (isChoiceField && field.options) {
//         setOptions(field.options);
//       } else if (isChoiceField && !field.options) {
//         // Set default options for choice fields without options
//         const defaultOptions = [
//           { label: 'Option 1', value: 'option1' },
//           { label: 'Option 2', value: 'option2' },
//           { label: 'Option 3', value: 'option3' },
//         ];
//         setOptions(defaultOptions);
//       }
//     }
//   }, [field, isHeadingField, isChoiceField]);

//   // Prevent panel from closing when clicking inside it
//   useEffect(() => {
//     const handleClickInside = (e: MouseEvent) => {
//       if (panelRef.current && panelRef.current.contains(e.target as Node)) {
//         e.stopPropagation();
//       }
//     };

//     document.addEventListener('mousedown', handleClickInside, true);
//     return () => {
//       document.removeEventListener('mousedown', handleClickInside, true);
//     };
//   }, []);

//   //  : Early return AFTER all hooks
//   if (!form || !field || !form.propertiesPanelOpen) return null;

//   const handleClosePanel = () => {
//     dispatch(togglePropertiesPanel(false));
//   };

//   const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (!pageId) return;

//     dispatch(
//       updateField({
//         id: field.id,
//         updates: { label: e.target.value },
//         pageId,
//       })
//     );
//   };

//   const handleLabelAlignmentChange = (alignment: LabelAlignmentType) => {
//     if (!pageId) return;

//     setLabelAlignment(alignment);
//     dispatch(
//       updateField({
//         id: field.id,
//         updates: { labelAlignment: alignment },
//         pageId,
//       })
//     );
//   };

//   const handleRequiredToggle = () => {
//     if (!pageId || isHeadingField) return;

//     const newValue = !isRequired;
//     setIsRequired(newValue);
//     dispatch(
//       updateField({
//         id: field.id,
//         updates: { required: newValue },
//         pageId,
//       })
//     );
//   };

//   const handleHelpTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (!pageId || isHeadingField) return;

//     const text = e.target.value;
//     setHelpText(text);
//     dispatch(
//       updateField({
//         id: field.id,
//         updates: { helpText: text },
//         pageId,
//       })
//     );
//   };

//   const handleSetAsDefault = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const checked = e.target.checked;
//     setUseAsDefault(checked);
//     if (checked) {
//       dispatch(
//         updateFormSettings({
//           defaultLabelAlignment: labelAlignment,
//         })
//       );
//     }
//   };

//   const handleDuplicateField = () => {
//     dispatch(duplicateField(field.id));
//     toast.success(`${field.label} field duplicated`);
//   };

//   const handleDeleteField = () => {
//     if (!pageId) return;

//     dispatch(removeField({ fieldId: field.id, pageId }));
//     dispatch(togglePropertiesPanel(false));
//     toast.info(`${field.label} field removed`);
//   };

//   //  ENHANCED: Option management functions (now properly after hooks)
//   const addOption = () => {
//     const newOption = {
//       label: `Option ${options.length + 1}`,
//       value: `option${options.length + 1}`,
//     };
//     const updatedOptions = [...options, newOption];
//     setOptions(updatedOptions);

//     if (pageId) {
//       dispatch(
//         updateField({
//           id: field.id,
//           updates: { options: updatedOptions },
//           pageId,
//         })
//       );
//     }
//   };

//   const removeOption = (index: number) => {
//     if (options.length <= 1) return; // Keep at least one option

//     const updatedOptions = options.filter((_, i) => i !== index);
//     setOptions(updatedOptions);

//     if (pageId) {
//       dispatch(
//         updateField({
//           id: field.id,
//           updates: { options: updatedOptions },
//           pageId,
//         })
//       );
//     }
//   };

//   const updateOption = (
//     index: number,
//     key: 'label' | 'value',
//     value: string
//   ) => {
//     const updatedOptions = options.map((option, i) =>
//       i === index ? { ...option, [key]: value } : option
//     );
//     setOptions(updatedOptions);

//     if (pageId) {
//       dispatch(
//         updateField({
//           id: field.id,
//           updates: { options: updatedOptions },
//           pageId,
//         })
//       );
//     }
//   };

//   //  ENHANCED: Better field title formatting
//   const getFieldTitle = (fieldType: string): string => {
//     const fieldTitles: Record<string, string> = {
//       shortText: 'Short Text',
//       longText: 'Long Text',
//       paragraph: 'Paragraph',
//       dropdown: 'Dropdown',
//       singleChoice: 'Single Choice',
//       multipleChoice: 'Multiple Choice',
//       number: 'Number',
//       image: 'Image',
//       fileUpload: 'File Upload',
//       time: 'Time',
//       heading: 'Heading',
//       fullName: 'Full Name',
//       email: 'Email',
//       address: 'Address',
//       phone: 'Phone',
//       datePicker: 'Date Picker',
//       appointment: 'Appointment',
//       signature: 'Signature',
//       fillBlank: 'Fill in the Blank',
//       productList: 'Product List',
//     };

//     return (
//       fieldTitles[fieldType] ||
//       fieldType.charAt(0).toUpperCase() + fieldType.slice(1)
//     );
//   };

//   const fieldTitle = getFieldTitle(field.type);

//   // Panel animation variants
//   const panelVariants = {
//     hidden: { x: '100%', opacity: 0 },
//     visible: {
//       x: 0,
//       opacity: 1,
//       transition: {
//         type: 'spring',
//         stiffness: 300,
//         damping: 30,
//         duration: 0.3,
//       },
//     },
//     exit: {
//       x: '100%',
//       opacity: 0,
//       transition: {
//         duration: 0.2,
//         ease: 'easeInOut',
//       },
//     },
//   };

//   return (
//     <AnimatePresence>
//       {form.propertiesPanelOpen && (
//         <motion.div
//           ref={panelRef}
//           className='properties-panel pb-20 w-[335px] h-[90%] mt-29 fixed right-0 top-0 bg-gray-800 text-white overflow-y-auto shadow-lg z-30 border-l border-gray-700'
//           initial='hidden'
//           animate='visible'
//           exit='exit'
//           variants={panelVariants}
//         >
//           {/* Header */}
//           <div className='flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900'>
//             <h3 className='font-medium flex items-center'>
//               <span className='w-5 h-5 mr-2 flex items-center justify-center bg-blue-500 rounded-md'>
//                 <SettingsIcon className='w-3 h-3' />
//               </span>
//               {fieldTitle} Properties
//             </h3>
//             <button
//               onClick={handleClosePanel}
//               className='text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700 cursor-pointer'
//             >
//               <X className='h-5 w-5' />
//             </button>
//           </div>

//           {/* Content */}
//           <div className='p-4 space-y-6'>
//             {/* Field Label */}
//             <div className='group'>
//               <Label
//                 htmlFor='field-label'
//                 className='text-sm text-gray-300 mb-1 block group-hover:text-white transition-colors'
//               >
//                 {isHeadingField ? 'Heading Text' : 'Field Label'}
//               </Label>
//               <Input
//                 id='field-label'
//                 value={field.label}
//                 onChange={handleLabelChange}
//                 className='bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 transition-all'
//                 placeholder={
//                   isHeadingField ? 'Enter heading text' : 'Enter field label'
//                 }
//               />
//             </div>

//             {/* Label/Text Alignment */}
//             <div className='group pt-2'>
//               <Label className='text-sm text-gray-300 mb-2 block group-hover:text-white transition-colors'>
//                 {isHeadingField ? 'Text Alignment' : 'Label Alignment'}
//               </Label>
//               <div className='flex space-x-2'>
//                 <button
//                   className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
//                     labelAlignment === 'LEFT'
//                       ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
//                       : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
//                   }`}
//                   onClick={() => handleLabelAlignmentChange('LEFT')}
//                 >
//                   LEFT
//                 </button>

//                 <button
//                   className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
//                     labelAlignment === 'RIGHT'
//                       ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
//                       : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
//                   }`}
//                   onClick={() => handleLabelAlignmentChange('RIGHT')}
//                 >
//                   RIGHT
//                 </button>
//               </div>

//               {/* Set as Default - Only show for non-heading fields */}
//               {!isHeadingField && (
//                 <div className='mt-2 flex items-center space-x-2'>
//                   <label className='flex items-center space-x-2 cursor-pointer'>
//                     <input
//                       type='checkbox'
//                       className='h-4 w-4 rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-blue-500'
//                       checked={useAsDefault}
//                       onChange={handleSetAsDefault}
//                     />
//                     <span className='text-sm text-gray-300'>
//                       Set as form default
//                     </span>
//                   </label>
//                 </div>
//               )}

//               <p className='text-xs text-gray-400 mt-1'>
//                 {isHeadingField
//                   ? 'Select how the heading text is aligned horizontally'
//                   : 'Select how the label text is aligned horizontally'}
//               </p>
//             </div>

//             {/* Required Field - Only show for non-heading fields */}
//             {!isHeadingField && (
//               <div className='group border-t border-gray-700 mt-6 pt-6'>
//                 <div className='flex justify-between items-center mb-1'>
//                   <Label
//                     htmlFor='field-required'
//                     className='text-sm text-gray-300 group-hover:text-white transition-colors'
//                   >
//                     Required
//                   </Label>
//                   <div
//                     className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
//                       isRequired ? 'bg-blue-500' : 'bg-gray-600'
//                     }`}
//                     onClick={handleRequiredToggle}
//                   >
//                     <div
//                       className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
//                         isRequired ? 'translate-x-6' : 'translate-x-1'
//                       }`}
//                     />
//                   </div>
//                 </div>
//                 <p className='text-xs text-gray-400'>
//                   Prevent submission if this field is empty
//                 </p>
//               </div>
//             )}

//             {/* Help Text / Sublabel - Only show for non-heading fields */}
//             {!isHeadingField && (
//               <div className='group pt-6 border-t border-gray-700 mt-6'>
//                 <Label
//                   htmlFor='field-helptext'
//                   className='text-sm text-gray-300 mb-1 block group-hover:text-white transition-colors'
//                 >
//                   Help Text
//                 </Label>
//                 <Input
//                   id='field-helptext'
//                   value={helpText}
//                   onChange={handleHelpTextChange}
//                   className='bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 transition-all'
//                   placeholder='Add helpful instructions or examples'
//                 />
//                 <p className='text-xs text-gray-400 mt-1'>
//                   Add a short description below the field
//                 </p>
//               </div>
//             )}

//             {/* Options - Only show for choice fields */}
//             {isChoiceField && (
//               <div className='group pt-6 border-t border-gray-700 mt-6'>
//                 <div className='flex justify-between items-center mb-3'>
//                   <Label className='text-sm text-gray-300 group-hover:text-white transition-colors'>
//                     Options
//                   </Label>
//                   <button
//                     onClick={addOption}
//                     className='text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors cursor-pointer'
//                   >
//                     + Add Option
//                   </button>
//                 </div>

//                 <div className='space-y-2 max-h-48 overflow-y-auto'>
//                   {options.map((option, index) => (
//                     <div key={index} className='flex items-center space-x-2'>
//                       <Input
//                         value={option.label}
//                         onChange={e =>
//                           updateOption(index, 'label', e.target.value)
//                         }
//                         placeholder={`Option ${index + 1}`}
//                         className='flex-1 bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 text-sm'
//                       />
//                       {options.length > 1 && (
//                         <button
//                           onClick={() => removeOption(index)}
//                           className='text-red-400 hover:text-red-300 p-1 hover:bg-red-900/20 rounded transition-colors cursor-pointer'
//                           title='Remove option'
//                         >
//                           ✕
//                         </button>
//                       )}
//                     </div>
//                   ))}
//                 </div>

//                 <p className='text-xs text-gray-400 mt-2'>
//                   Add options for users to choose from. At least one option is
//                   required.
//                 </p>
//               </div>
//             )}

//             {/* Additional Field Properties */}
//             {field.type === FieldType.NUMBER && (
//               <div className='group pt-6 border-t border-gray-700 mt-6'>
//                 <Label className='text-sm text-gray-300 mb-3 block group-hover:text-white transition-colors'>
//                   Number Constraints
//                 </Label>
//                 <div className='grid grid-cols-2 gap-3'>
//                   <div>
//                     <Label
//                       htmlFor='field-min'
//                       className='text-xs text-gray-400 mb-1 block'
//                     >
//                       Minimum
//                     </Label>
//                     <Input
//                       id='field-min'
//                       type='number'
//                       placeholder='Min value'
//                       className='bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 text-sm'
//                       onChange={e => {
//                         if (pageId) {
//                           dispatch(
//                             updateField({
//                               id: field.id,
//                               updates: {
//                                 min: e.target.value
//                                   ? Number(e.target.value)
//                                   : undefined,
//                               },
//                               pageId,
//                             })
//                           );
//                         }
//                       }}
//                     />
//                   </div>
//                   <div>
//                     <Label
//                       htmlFor='field-max'
//                       className='text-xs text-gray-400 mb-1 block'
//                     >
//                       Maximum
//                     </Label>
//                     <Input
//                       id='field-max'
//                       type='number'
//                       placeholder='Max value'
//                       className='bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 text-sm'
//                       onChange={e => {
//                         if (pageId) {
//                           dispatch(
//                             updateField({
//                               id: field.id,
//                               updates: {
//                                 max: e.target.value
//                                   ? Number(e.target.value)
//                                   : undefined,
//                               },
//                               pageId,
//                             })
//                           );
//                         }
//                       }}
//                     />
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Action Buttons */}
//             <div className='flex flex-wrap gap-2 border-t border-gray-700 mt-6 pt-6'>
//               <button
//                 className='flex items-center px-3 py-2 rounded-md text-xs font-medium transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600 cursor-pointer'
//                 onClick={handleDuplicateField}
//               >
//                 <Copy size={14} className='mr-1.5' />
//                 Duplicate
//               </button>

//               <button
//                 className='flex items-center px-3 py-2 rounded-md text-xs font-medium transition-colors bg-red-900/40 text-red-400 hover:bg-red-900/60 cursor-pointer'
//                 onClick={handleDeleteField}
//               >
//                 <Trash size={14} className='mr-1.5' />
//                 Delete
//               </button>
//             </div>
//           </div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// }

// src/components/form-builder/properties-panel/PropertiesPanel.tsx
'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import {
  updateField,
  removeField,
  duplicateField,
  togglePropertiesPanel,
  updateFormSettings,
} from '@/redux/slices/formBuilder/formBuilderSlice';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Trash, Copy, Settings as SettingsIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { FieldType } from '@/types/form';

// Include CENTER alignment to match your backend
type LabelAlignmentType = 'LEFT' | 'RIGHT';

export default function PropertiesPanel() {
  const dispatch = useDispatch();
  const form = useSelector((state: RootState) => state.formBuilder.form);
  const panelRef = useRef<HTMLDivElement>(null);

  //  : Move ALL useState hooks to the top, before any conditional logic
  const [labelAlignment, setLabelAlignment] =
    useState<LabelAlignmentType>('LEFT');
  const [isRequired, setIsRequired] = useState(false);
  const [helpText, setHelpText] = useState('');
  const [useAsDefault, setUseAsDefault] = useState(false);
  const [options, setOptions] = useState([
    { label: 'Option 1', value: 'option1' },
    { label: 'Option 2', value: 'option2' },
    { label: 'Option 3', value: 'option3' },
  ]);

  // Find the selected field from the correct page
  const getSelectedField = () => {
    if (!form?.selectedFieldId || !form.pages) return null;

    for (const page of form.pages) {
      if (!page || !page.fields) continue;
      const foundField = page.fields.find(
        field => field.id === form.selectedFieldId
      );
      if (foundField) {
        return {
          field: foundField,
          pageId: page.id,
        };
      }
    }
    return null;
  };

  const selectedFieldData = getSelectedField();
  const field = selectedFieldData?.field;
  const pageId = selectedFieldData?.pageId;

  const isHeadingField = field?.type === 'heading';
  const isChoiceField =
    field?.type === FieldType.DROPDOWN ||
    field?.type === FieldType.SINGLE_CHOICE ||
    field?.type === FieldType.MULTIPLE_CHOICE;

  // Update local state when selected field changes
  useEffect(() => {
    if (field) {
      setLabelAlignment((field.labelAlignment as LabelAlignmentType) || 'LEFT');
      setIsRequired(field.required || false);
      setHelpText(field.helpText || '');

      // Update options for choice fields
      if (isChoiceField && field.options) {
        setOptions(field.options);
      } else if (isChoiceField && !field.options) {
        // Set default options for choice fields without options
        const defaultOptions = [
          { label: 'Option 1', value: 'option1' },
          { label: 'Option 2', value: 'option2' },
          { label: 'Option 3', value: 'option3' },
        ];
        setOptions(defaultOptions);
      }
    }
  }, [field, isHeadingField, isChoiceField]);

  // Prevent panel from closing when clicking inside it
  useEffect(() => {
    const handleClickInside = (e: MouseEvent) => {
      if (panelRef.current && panelRef.current.contains(e.target as Node)) {
        e.stopPropagation();
      }
    };

    document.addEventListener('mousedown', handleClickInside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickInside, true);
    };
  }, []);

  //  : Early return AFTER all hooks
  if (!form || !field || !form.propertiesPanelOpen) return null;

  const handleClosePanel = () => {
    dispatch(togglePropertiesPanel(false));
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!pageId) return;

    dispatch(
      updateField({
        id: field.id,
        updates: { label: e.target.value },
        pageId,
      })
    );
  };

  const handleLabelAlignmentChange = (alignment: LabelAlignmentType) => {
    if (!pageId) return;

    setLabelAlignment(alignment);
    dispatch(
      updateField({
        id: field.id,
        updates: { labelAlignment: alignment },
        pageId,
      })
    );
  };

  const handleRequiredToggle = () => {
    if (!pageId || isHeadingField) return;

    const newValue = !isRequired;
    setIsRequired(newValue);
    dispatch(
      updateField({
        id: field.id,
        updates: { required: newValue },
        pageId,
      })
    );
  };

  const handleHelpTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!pageId || isHeadingField) return;

    const text = e.target.value;
    setHelpText(text);
    dispatch(
      updateField({
        id: field.id,
        updates: { helpText: text },
        pageId,
      })
    );
  };

  const handleSetAsDefault = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setUseAsDefault(checked);
    if (checked) {
      dispatch(
        updateFormSettings({
          defaultLabelAlignment: labelAlignment,
        })
      );
    }
  };

  const handleDuplicateField = () => {
    dispatch(duplicateField(field.id));
    toast.success(`${field.label} field duplicated`);
  };

  const handleDeleteField = () => {
    if (!pageId) return;

    dispatch(removeField({ fieldId: field.id, pageId }));
    dispatch(togglePropertiesPanel(false));
    toast.info(`${field.label} field removed`);
  };

  //  ENHANCED: Option management functions (now properly after hooks)
  const addOption = () => {
    const newOption = {
      label: `Option ${options.length + 1}`,
      value: `option${options.length + 1}`,
    };
    const updatedOptions = [...options, newOption];
    setOptions(updatedOptions);

    if (pageId) {
      dispatch(
        updateField({
          id: field.id,
          updates: { options: updatedOptions },
          pageId,
        })
      );
    }
  };

  const removeOption = (index: number) => {
    if (options.length <= 1) return; // Keep at least one option

    const updatedOptions = options.filter((_, i) => i !== index);
    setOptions(updatedOptions);

    if (pageId) {
      dispatch(
        updateField({
          id: field.id,
          updates: { options: updatedOptions },
          pageId,
        })
      );
    }
  };

  const updateOption = (
    index: number,
    key: 'label' | 'value',
    value: string
  ) => {
    const updatedOptions = options.map((option, i) =>
      i === index ? { ...option, [key]: value } : option
    );
    setOptions(updatedOptions);

    if (pageId) {
      dispatch(
        updateField({
          id: field.id,
          updates: { options: updatedOptions },
          pageId,
        })
      );
    }
  };

  //  ENHANCED: Better field title formatting
  const getFieldTitle = (fieldType: string): string => {
    const fieldTitles: Record<string, string> = {
      shortText: 'Short Text',
      longText: 'Long Text',
      paragraph: 'Paragraph',
      dropdown: 'Dropdown',
      singleChoice: 'Single Choice',
      multipleChoice: 'Multiple Choice',
      number: 'Number',
      image: 'Image',
      fileUpload: 'File Upload',
      time: 'Time',
      heading: 'Heading',
      fullName: 'Full Name',
      email: 'Email',
      address: 'Address',
      phone: 'Phone',
      datePicker: 'Date Picker',
      appointment: 'Appointment',
      signature: 'Signature',
      fillBlank: 'Fill in the Blank',
      productList: 'Product List',
    };

    return (
      fieldTitles[fieldType] ||
      fieldType.charAt(0).toUpperCase() + fieldType.slice(1)
    );
  };

  const fieldTitle = getFieldTitle(field.type);

  // Panel animation variants - Enhanced for mobile
  const panelVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        duration: 0.3,
      },
    },
    exit: {
      x: '100%',
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: 'easeInOut',
      },
    },
  };

  // Mobile overlay variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <AnimatePresence>
      {form.propertiesPanelOpen && (
        <>
          {/* Mobile Overlay - Only show on mobile */}
          <motion.div
            className='fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden'
            initial='hidden'
            animate='visible'
            exit='exit'
            variants={overlayVariants}
            onClick={handleClosePanel}
          />

          <motion.div
            ref={panelRef}
            className='properties-panel
              /* Mobile: Full width sliding panel from right */
              fixed top-23 right-0 h-full pb-10 w-full bg-gray-800 text-white 
              overflow-y-auto shadow-lg z-50 border-l border-gray-700
              
              /* Tablet: Partial width */
              sm:w-[400px] 
              
              /* Desktop: Fixed width */
              lg:w-[335px] lg:h-[90%] lg:mt-[29px] lg:z-30
              
              /* Scrollbar styling */
              scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800'
            initial='hidden'
            animate='visible'
            exit='exit'
            variants={panelVariants}
          >
            {/* Header */}
            <div
              className='flex justify-between items-center p-4 sm:p-6 lg:p-4 
              border-b border-gray-700 bg-gray-900 sticky top-0 z-10'
            >
              <h3 className='font-medium flex items-center text-sm sm:text-base lg:text-sm'>
                <span
                  className='w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5 mr-2 
                  flex items-center justify-center bg-blue-500 rounded-md'
                >
                  <SettingsIcon className='w-3 h-3 sm:w-4 sm:h-4 lg:w-3 lg:h-3' />
                </span>
                <span className='truncate'>{fieldTitle} Properties</span>
              </h3>
              <button
                onClick={handleClosePanel}
                className='text-gray-400 hover:text-white transition-colors 
                  p-1 sm:p-2 lg:p-1 rounded-full hover:bg-gray-700 cursor-pointer
                  flex-shrink-0'
              >
                <X className='h-5 w-5 sm:h-6 sm:w-6 lg:h-5 lg:w-5' />
              </button>
            </div>

            {/* Content */}
            <div className='p-4 sm:p-6 lg:p-4 space-y-6 pb-20 sm:pb-24 lg:pb-20'>
              {/* Field Label */}
              <div className='group'>
                <Label
                  htmlFor='field-label'
                  className='text-sm sm:text-base lg:text-sm text-gray-300 mb-2 sm:mb-3 lg:mb-1 
                    block group-hover:text-white transition-colors'
                >
                  {isHeadingField ? 'Heading Text' : 'Field Label'}
                </Label>
                <Input
                  id='field-label'
                  value={field.label}
                  onChange={handleLabelChange}
                  className='bg-gray-700 border-gray-600 text-white 
                    focus:ring-blue-500 focus:border-blue-500 transition-all
                    text-base sm:text-lg lg:text-base p-3 sm:p-4 lg:p-3
                    rounded-md sm:rounded-lg lg:rounded-md'
                  placeholder={
                    isHeadingField ? 'Enter heading text' : 'Enter field label'
                  }
                />
              </div>

              {/* Label/Text Alignment */}
              <div className='group pt-2'>
                <Label
                  className='text-sm sm:text-base lg:text-sm text-gray-300 mb-2 sm:mb-3 lg:mb-2 
                  block group-hover:text-white transition-colors'
                >
                  {isHeadingField ? 'Text Alignment' : 'Label Alignment'}
                </Label>
                <div className='flex space-x-2 sm:space-x-3 lg:space-x-2'>
                  <button
                    className={`flex-1 sm:flex-none sm:px-6 sm:py-3 lg:px-3 lg:py-1.5 
                      px-4 py-2 text-xs sm:text-sm lg:text-xs font-medium 
                      rounded-md sm:rounded-lg lg:rounded-md transition-colors cursor-pointer ${
                        labelAlignment === 'LEFT'
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    onClick={() => handleLabelAlignmentChange('LEFT')}
                  >
                    LEFT
                  </button>

                  <button
                    className={`flex-1 sm:flex-none sm:px-6 sm:py-3 lg:px-3 lg:py-1.5 
                      px-4 py-2 text-xs sm:text-sm lg:text-xs font-medium 
                      rounded-md sm:rounded-lg lg:rounded-md transition-colors cursor-pointer ${
                        labelAlignment === 'RIGHT'
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    onClick={() => handleLabelAlignmentChange('RIGHT')}
                  >
                    RIGHT
                  </button>
                </div>

                {/* Set as Default - Only show for non-heading fields */}
                {!isHeadingField && (
                  <div className='mt-3 sm:mt-4 lg:mt-2 flex items-center space-x-2 sm:space-x-3 lg:space-x-2'>
                    <label className='flex items-center space-x-2 sm:space-x-3 lg:space-x-2 cursor-pointer'>
                      <input
                        type='checkbox'
                        className='h-4 w-4 sm:h-5 sm:w-5 lg:h-4 lg:w-4 rounded 
                          border-gray-700 bg-gray-800 text-blue-500 focus:ring-blue-500'
                        checked={useAsDefault}
                        onChange={handleSetAsDefault}
                      />
                      <span className='text-sm sm:text-base lg:text-sm text-gray-300'>
                        Set as form default
                      </span>
                    </label>
                  </div>
                )}

                <p className='text-xs sm:text-sm lg:text-xs text-gray-400 mt-2 sm:mt-3 lg:mt-1'>
                  {isHeadingField
                    ? 'Select how the heading text is aligned horizontally'
                    : 'Select how the label text is aligned horizontally'}
                </p>
              </div>

              {/* Required Field - Only show for non-heading fields */}
              {!isHeadingField && (
                <div className='group border-t border-gray-700 mt-6 pt-6'>
                  <div className='flex justify-between items-center mb-2 sm:mb-3 lg:mb-1'>
                    <Label
                      htmlFor='field-required'
                      className='text-sm sm:text-base lg:text-sm text-gray-300 
                        group-hover:text-white transition-colors'
                    >
                      Required
                    </Label>
                    <div
                      className={`relative w-12 h-6 sm:w-14 sm:h-7 lg:w-12 lg:h-6 
                        rounded-full transition-colors cursor-pointer ${
                          isRequired ? 'bg-blue-500' : 'bg-gray-600'
                        }`}
                      onClick={handleRequiredToggle}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 sm:w-5 sm:h-5 lg:w-4 lg:h-4 
                          bg-white rounded-full transition-transform ${
                            isRequired
                              ? 'translate-x-6 sm:translate-x-7 lg:translate-x-6'
                              : 'translate-x-1'
                          }`}
                      />
                    </div>
                  </div>
                  <p className='text-xs sm:text-sm lg:text-xs text-gray-400'>
                    Prevent submission if this field is empty
                  </p>
                </div>
              )}

              {/* Help Text / Sublabel - Only show for non-heading fields */}
              {!isHeadingField && (
                <div className='group pt-6 border-t border-gray-700 mt-6'>
                  <Label
                    htmlFor='field-helptext'
                    className='text-sm sm:text-base lg:text-sm text-gray-300 mb-2 sm:mb-3 lg:mb-1 
                      block group-hover:text-white transition-colors'
                  >
                    Help Text
                  </Label>
                  <Input
                    id='field-helptext'
                    value={helpText}
                    onChange={handleHelpTextChange}
                    className='bg-gray-700 border-gray-600 text-white 
                      focus:ring-blue-500 focus:border-blue-500 transition-all
                      text-base sm:text-base lg:text-base p-3 sm:p-4 lg:p-3
                      rounded-md sm:rounded-lg lg:rounded-md'
                  />
                  <p className='text-xs sm:text-sm lg:text-xs text-gray-400 mt-2 sm:mt-3 lg:mt-1'>
                    Add a short description below the field
                  </p>
                </div>
              )}

              {/* Options - Only show for choice fields */}
              {isChoiceField && (
                <div className='group pt-6 border-t border-gray-700 mt-6'>
                  <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-3 sm:mb-4 lg:mb-3'>
                    <Label
                      className='text-sm sm:text-base lg:text-sm text-gray-300 
                      group-hover:text-white transition-colors'
                    >
                      Options
                    </Label>
                    <button
                      onClick={addOption}
                      className='w-full sm:w-auto px-4 py-2 sm:px-3 sm:py-1.5 lg:px-3 lg:py-1.5
                        text-blue-400 hover:text-blue-300 text-sm sm:text-base lg:text-sm 
                        font-medium transition-colors cursor-pointer
                        bg-blue-500/10 hover:bg-blue-500/20 rounded-md sm:rounded lg:rounded-md
                        border border-blue-500/20 hover:border-blue-500/30'
                    >
                      + Add Option
                    </button>
                  </div>

                  <div
                    className='space-y-3 sm:space-y-4 lg:space-y-2 
                    max-h-48 sm:max-h-60 lg:max-h-48 overflow-y-auto'
                  >
                    {options.map((option, index) => (
                      <div
                        key={index}
                        className='flex items-center space-x-2 sm:space-x-3 lg:space-x-2'
                      >
                        <div className='flex-1'>
                          <Input
                            value={option.label}
                            onChange={e =>
                              updateOption(index, 'label', e.target.value)
                            }
                            placeholder={`Option ${index + 1}`}
                            className='bg-gray-700 border-gray-600 text-white 
                              focus:ring-blue-500 focus:border-blue-500 
                              text-sm sm:text-base lg:text-sm
                              p-3 sm:p-4 lg:p-2'
                          />
                        </div>
                        {options.length > 1 && (
                          <button
                            onClick={() => removeOption(index)}
                            className='text-red-400 hover:text-red-300 
                              p-2 sm:p-3 lg:p-1 hover:bg-red-900/20 rounded 
                              transition-colors cursor-pointer flex-shrink-0'
                            title='Remove option'
                          >
                            <span className='text-lg sm:text-xl lg:text-base'>
                              ✕
                            </span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className='text-xs sm:text-sm lg:text-xs text-gray-400 mt-3 sm:mt-4 lg:mt-2'>
                    Add options for users to choose from. At least one option is
                    required.
                  </p>
                </div>
              )}

              {/* Additional Field Properties */}
              {field.type === FieldType.NUMBER && (
                <div className='group pt-6 border-t border-gray-700 mt-6'>
                  <Label
                    className='text-sm sm:text-base lg:text-sm text-gray-300 mb-3 sm:mb-4 lg:mb-3 
                    block group-hover:text-white transition-colors'
                  >
                    Number Constraints
                  </Label>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-3'>
                    <div>
                      <Label
                        htmlFor='field-min'
                        className='text-xs sm:text-sm lg:text-xs text-gray-400 mb-2 sm:mb-3 lg:mb-1 block'
                      >
                        Minimum
                      </Label>
                      <Input
                        id='field-min'
                        type='number'
                        placeholder='Min value'
                        className='bg-gray-700 border-gray-600 text-white 
                          focus:ring-blue-500 focus:border-blue-500 
                          text-sm sm:text-base lg:text-sm
                          p-3 sm:p-4 lg:p-2'
                        onChange={e => {
                          if (pageId) {
                            dispatch(
                              updateField({
                                id: field.id,
                                updates: {
                                  min: e.target.value
                                    ? Number(e.target.value)
                                    : undefined,
                                },
                                pageId,
                              })
                            );
                          }
                        }}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor='field-max'
                        className='text-xs sm:text-sm lg:text-xs text-gray-400 mb-2 sm:mb-3 lg:mb-1 block'
                      >
                        Maximum
                      </Label>
                      <Input
                        id='field-max'
                        type='number'
                        placeholder='Max value'
                        className='bg-gray-700 border-gray-600 text-white 
                          focus:ring-blue-500 focus:border-blue-500 
                          text-sm sm:text-base lg:text-sm
                          p-3 sm:p-4 lg:p-2'
                        onChange={e => {
                          if (pageId) {
                            dispatch(
                              updateField({
                                id: field.id,
                                updates: {
                                  max: e.target.value
                                    ? Number(e.target.value)
                                    : undefined,
                                },
                                pageId,
                              })
                            );
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div
                className='flex flex-col sm:flex-row gap-3 sm:gap-2 lg:gap-2 
                border-t border-gray-700 mt-6 pt-6'
              >
                <button
                  className='flex items-center justify-center sm:justify-start 
                    px-4 py-3 sm:px-3 sm:py-2 lg:px-3 lg:py-2 
                    rounded-md sm:rounded lg:rounded-md 
                    text-sm sm:text-xs lg:text-xs font-medium 
                    transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600 cursor-pointer
                    space-x-2'
                  onClick={handleDuplicateField}
                >
                  <Copy
                    size={16}
                    className='sm:w-[14px] sm:h-[14px] lg:w-[14px] lg:h-[14px]'
                  />
                  <span>Duplicate</span>
                </button>

                <button
                  className='flex items-center justify-center sm:justify-start 
                    px-4 py-3 sm:px-3 sm:py-2 lg:px-3 lg:py-2 
                    rounded-md sm:rounded lg:rounded-md 
                    text-sm sm:text-xs lg:text-xs font-medium 
                    transition-colors bg-red-900/40 text-red-400 hover:bg-red-900/60 cursor-pointer
                    space-x-2'
                  onClick={handleDeleteField}
                >
                  <Trash
                    size={16}
                    className='sm:w-[14px] sm:h-[14px] lg:w-[14px] lg:h-[14px]'
                  />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
