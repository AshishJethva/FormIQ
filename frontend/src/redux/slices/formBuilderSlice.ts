// // src/redux/slices/formBuilderSlice.ts
// import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
// import { v4 as uuidv4 } from 'uuid';
// import { Form, Field, FieldType, FormSettings, LogoState } from '@/types/form';
// import axios from 'axios';
// import { apiConfig } from '@/config/api';

// interface FormBuilderState {
//   form: Form | null;
//   isPreviewMode: boolean;
//   isSaving: boolean;
//   isLoading: boolean;
//   showGridLines: boolean;
//   error: string | null;
//   lastSaveTime: string | null;
// }

// const initialState: FormBuilderState = {
//   form: null,
//   isPreviewMode: false,
//   isSaving: false,
//   isLoading: false,
//   showGridLines: false,
//   error: null,
//   lastSaveTime: null,
// };

// // Async thunk to load form from backend
// export const loadFormAsync = createAsyncThunk(
//   'formBuilder/loadForm',
//   async (formId: string, { rejectWithValue }) => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         throw new Error('No authentication token found');
//       }

//       const response = await axios.get(`${apiConfig.url}/forms/${formId}`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       return response.data.data;
//     } catch (error: any) {
//       return rejectWithValue(
//         error.response?.data?.message || error.message || 'Failed to load form'
//       );
//     }
//   }
// );

// // Async thunk to save form to backend
// export const saveFormAsync = createAsyncThunk(
//   'formBuilder/saveForm',
//   async (formId: string, { getState, rejectWithValue }) => {
//     try {
//       const state = getState() as { formBuilder: FormBuilderState };
//       const form = state.formBuilder.form;

//       if (!form) {
//         throw new Error('No form data to save');
//       }

//       const token = localStorage.getItem('token');
//       if (!token) {
//         throw new Error('No authentication token found');
//       }

//       const response = await axios.put(
//         `${apiConfig.url}/forms/${formId}`,
//         {
//           title: form.title,
//           description: form.description,
//           pages: form.pages,
//           selectedFieldId: form.selectedFieldId,
//           selectedPageId: form.selectedPageId,
//           currentPageIndex: form.currentPageIndex,
//           propertiesPanelOpen: form.propertiesPanelOpen,
//           logo: form.logo,
//           settings: form.settings,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//         }
//       );

//       return response.data.data;
//     } catch (error: any) {
//       return rejectWithValue(
//         error.response?.data?.message || error.message || 'Failed to save form'
//       );
//     }
//   }
// );

// // Async thunk to publish/unpublish form
// export const publishFormAsync = createAsyncThunk(
//   'formBuilder/publishForm',
//   async (
//     { formId, isPublished }: { formId: string; isPublished: boolean },
//     { rejectWithValue }
//   ) => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         throw new Error('No authentication token found');
//       }

//       const response = await axios.patch(
//         `${apiConfig.url}/forms/${formId}/publish`,
//         { isPublished },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//         }
//       );

//       return response.data.data;
//     } catch (error: any) {
//       return rejectWithValue(
//         error.response?.data?.message ||
//           error.message ||
//           'Failed to update form status'
//       );
//     }
//   }
// );

// const formBuilderSlice = createSlice({
//   name: 'formBuilder',
//   initialState,
//   reducers: {
//     initializeForm: state => {
//       if (!state.form) {
//         const pageId = uuidv4();
//         state.form = {
//           id: uuidv4(),
//           title: 'Untitled Form',
//           pages: [
//             {
//               id: pageId,
//               fields: [],
//             },
//           ],
//           selectedFieldId: null,
//           selectedPageId: pageId,
//           currentPageIndex: 0,
//           propertiesPanelOpen: false,
//           settings: {
//             submitButtonText: 'Submit',
//             defaultLabelAlignment: 'LEFT',
//             thankyouMessage: 'Thank you for your submission!',
//             defaultRequiredField: false,
//           },
//           lastSaved: new Date().toLocaleTimeString([], {
//             hour: '2-digit',
//             minute: '2-digit',
//           }),
//         };
//       }
//     },

//     // Action to load form data from backend response
//     loadFormData: (state, action: PayloadAction<any>) => {
//       const formData = action.payload;

//       // Ensure pages exist and are properly structured
//       const pages =
//         formData.pages && Array.isArray(formData.pages)
//           ? formData.pages
//           : [{ id: uuidv4(), fields: [] }];

//       state.form = {
//         id: formData.id || formData._id,
//         title: formData.title || 'Untitled Form',
//         description: formData.description,
//         pages: pages,
//         selectedFieldId: formData.selectedFieldId || null,
//         selectedPageId: formData.selectedPageId || pages[0]?.id,
//         currentPageIndex: formData.currentPageIndex || 0,
//         propertiesPanelOpen: false, // Always start with panel closed
//         logo: formData.logo || null,
//         settings: {
//           submitButtonText: formData.settings?.submitButtonText || 'Submit',
//           defaultLabelAlignment:
//             formData.settings?.defaultLabelAlignment || 'LEFT',
//           thankyouMessage:
//             formData.settings?.thankyouMessage ||
//             'Thank you for your submission!',
//           defaultRequiredField:
//             formData.settings?.defaultRequiredField || false,
//           showLogo: formData.settings?.showLogo || false,
//         },
//         lastSaved: new Date().toLocaleTimeString([], {
//           hour: '2-digit',
//           minute: '2-digit',
//         }),
//       };
//     },

//     setFormTitle: (state, action: PayloadAction<string>) => {
//       if (state.form) {
//         state.form.title = action.payload;
//         state.form.lastSaved = new Date().toLocaleTimeString([], {
//           hour: '2-digit',
//           minute: '2-digit',
//         });
//       }
//     },

//     updateFormSettings: (
//       state,
//       action: PayloadAction<Partial<FormSettings>>
//     ) => {
//       if (!state.form) return;

//       state.form.settings = {
//         ...state.form.settings,
//         ...action.payload,
//       } as FormSettings;
//       state.form.lastSaved = new Date().toLocaleTimeString([], {
//         hour: '2-digit',
//         minute: '2-digit',
//       });
//     },

//     addField: (
//       state,
//       action: PayloadAction<{ type: FieldType; pageId?: string }>
//     ) => {
//       if (!state.form || !state.form.pages) return;

//       // Create new field with default values
//       const newField: Field = {
//         id: uuidv4(),
//         type: action.payload.type,
//         label: getLabelForType(action.payload.type),
//         required: state.form.settings?.defaultRequiredField || false,
//         labelAlignment: state.form.settings?.defaultLabelAlignment || 'LEFT',
//       };

//       // Add default helpText for email fields
//       if (action.payload.type === FieldType.EMAIL) {
//         newField.helpText = 'example@example.com';
//         newField.placeholder = 'example@example.com';
//       }

//       // Determine which page to add the field to
//       const pageId = action.payload.pageId || state.form.selectedPageId;
//       if (!pageId) {
//         // If no page is selected, add to the first page
//         if (state.form.pages.length > 0) {
//           state.form.pages[0].fields.push(newField);
//           state.form.selectedFieldId = newField.id;
//         }
//         return;
//       }

//       const pageIndex = state.form.pages.findIndex(page => page.id === pageId);
//       if (pageIndex !== -1) {
//         if (!state.form.pages[pageIndex].fields) {
//           state.form.pages[pageIndex].fields = [];
//         }
//         state.form.pages[pageIndex].fields.push(newField);
//         state.form.selectedFieldId = newField.id;
//         state.form.lastSaved = new Date().toLocaleTimeString([], {
//           hour: '2-digit',
//           minute: '2-digit',
//         });
//       }
//     },
//     updateField: (
//       state,
//       action: PayloadAction<{
//         id: string;
//         updates: Partial<Field>;
//         pageId?: string;
//       }>
//     ) => {
//       if (!state.form || !state.form.pages) return;

//       const { id, updates, pageId } = action.payload;

//       // Try to find the page containing the field
//       const targetPageId = pageId || state.form.selectedPageId;
//       if (!targetPageId) {
//         // If no page ID is provided, search all pages
//         for (const page of state.form.pages) {
//           if (!page || !page.fields) continue;

//           const fieldIndex = page.fields.findIndex(field => field.id === id);
//           if (fieldIndex !== -1) {
//             page.fields[fieldIndex] = {
//               ...page.fields[fieldIndex],
//               ...updates,
//             };
//             state.form.lastSaved = new Date().toLocaleTimeString([], {
//               hour: '2-digit',
//               minute: '2-digit',
//             });
//             return;
//           }
//         }
//         return;
//       }

//       // If pageId is provided, find that specific page
//       const pageIndex = state.form.pages.findIndex(
//         page => page.id === targetPageId
//       );
//       if (pageIndex !== -1) {
//         const page = state.form.pages[pageIndex];
//         if (!page || !page.fields) return;

//         const fieldIndex = page.fields.findIndex(field => field.id === id);
//         if (fieldIndex !== -1) {
//           page.fields[fieldIndex] = {
//             ...page.fields[fieldIndex],
//             ...updates,
//           };
//           state.form.lastSaved = new Date().toLocaleTimeString([], {
//             hour: '2-digit',
//             minute: '2-digit',
//           });
//         }
//       }
//     },
//     removeField: (
//       state,
//       action: PayloadAction<{ fieldId: string; pageId?: string }>
//     ) => {
//       if (!state.form || !state.form.pages) return;

//       const { fieldId, pageId } = action.payload;

//       // If pageId is provided, only look in that page
//       if (pageId) {
//         const pageIndex = state.form.pages.findIndex(
//           page => page.id === pageId
//         );
//         if (pageIndex !== -1) {
//           const page = state.form.pages[pageIndex];
//           if (!page || !page.fields) return;

//           page.fields = page.fields.filter(field => field.id !== fieldId);
//           if (state.form.selectedFieldId === fieldId) {
//             state.form.selectedFieldId = null;
//           }
//           state.form.lastSaved = new Date().toLocaleTimeString([], {
//             hour: '2-digit',
//             minute: '2-digit',
//           });
//         }
//         return;
//       }

//       // If no pageId, search all pages
//       for (const page of state.form.pages) {
//         if (!page || !page.fields) continue;

//         const fieldIndex = page.fields.findIndex(field => field.id === fieldId);
//         if (fieldIndex !== -1) {
//           page.fields = page.fields.filter(field => field.id !== fieldId);
//           if (state.form.selectedFieldId === fieldId) {
//             state.form.selectedFieldId = null;
//           }
//           state.form.lastSaved = new Date().toLocaleTimeString([], {
//             hour: '2-digit',
//             minute: '2-digit',
//           });
//           return;
//         }
//       }
//     },
//     selectField: (state, action: PayloadAction<string>) => {
//       if (state.form) {
//         state.form.selectedFieldId = action.payload;
//       }
//     },
//     clearSelectedField: state => {
//       if (state.form) {
//         state.form.selectedFieldId = null;
//       }
//     },
//     togglePropertiesPanel: (
//       state,
//       action: PayloadAction<boolean | undefined>
//     ) => {
//       if (state.form) {
//         if (action.payload !== undefined) {
//           state.form.propertiesPanelOpen = action.payload;
//         } else {
//           state.form.propertiesPanelOpen = !state.form.propertiesPanelOpen;
//         }
//       }
//     },
//     setPreviewMode: (state, action: PayloadAction<boolean>) => {
//       state.isPreviewMode = action.payload;

//       // When entering preview mode, clear selection
//       if (state.isPreviewMode && state.form) {
//         state.form.selectedFieldId = null;
//         state.form.propertiesPanelOpen = false;
//       }
//     },
//     duplicateField: (state, action: PayloadAction<string>) => {
//       if (!state.form || !state.form.pages) return;

//       const fieldId = action.payload;

//       // Find the field in all pages
//       for (const page of state.form.pages) {
//         if (!page || !page.fields) continue;

//         const fieldToDuplicate = page.fields.find(
//           field => field.id === fieldId
//         );
//         if (fieldToDuplicate) {
//           const duplicatedField = {
//             ...fieldToDuplicate,
//             id: uuidv4(),
//             label: `${fieldToDuplicate.label} (Copy)`,
//           };

//           // Find the index of the original field
//           const fieldIndex = page.fields.findIndex(
//             field => field.id === fieldId
//           );

//           // Insert the duplicated field right after the original
//           page.fields.splice(fieldIndex + 1, 0, duplicatedField);
//           state.form.selectedFieldId = duplicatedField.id;
//           state.form.lastSaved = new Date().toLocaleTimeString([], {
//             hour: '2-digit',
//             minute: '2-digit',
//           });
//           return;
//         }
//       }
//     },
//     moveField: (
//       state,
//       action: PayloadAction<{
//         dragIndex: number;
//         hoverIndex: number;
//         pageId?: string;
//       }>
//     ) => {
//       if (!state.form || !state.form.pages) return;

//       const { dragIndex, hoverIndex, pageId } = action.payload;

//       // If pageId is provided, only move within that page
//       if (pageId) {
//         const pageIndex = state.form.pages.findIndex(
//           page => page.id === pageId
//         );
//         if (pageIndex !== -1) {
//           const page = state.form.pages[pageIndex];
//           if (!page || !page.fields || !Array.isArray(page.fields)) return;

//           const draggedField = page.fields[dragIndex];
//           if (!draggedField) return;

//           // Remove the dragged item
//           page.fields.splice(dragIndex, 1);
//           // Insert it at the new position
//           page.fields.splice(hoverIndex, 0, draggedField);
//         }
//         return;
//       }

//       // If no pageId provided, assume we're moving within the current active page
//       if (
//         state.form.currentPageIndex !== undefined &&
//         state.form.currentPageIndex >= 0 &&
//         state.form.currentPageIndex < state.form.pages.length
//       ) {
//         const page = state.form.pages[state.form.currentPageIndex];
//         if (!page || !page.fields || !Array.isArray(page.fields)) return;

//         const draggedField = page.fields[dragIndex];
//         if (!draggedField) return;

//         // Remove the dragged item
//         page.fields.splice(dragIndex, 1);
//         // Insert it at the new position
//         page.fields.splice(hoverIndex, 0, draggedField);
//       }
//     },
//     addFieldAtIndex: (
//       state,
//       action: PayloadAction<{
//         type: FieldType;
//         index: number;
//         pageId?: string;
//       }>
//     ) => {
//       if (!state.form || !state.form.pages) return;

//       const { type, index, pageId } = action.payload;

//       // Determine target page
//       let targetPageIndex = state.form.currentPageIndex || 0;

//       if (pageId) {
//         const foundIndex = state.form.pages.findIndex(
//           page => page.id === pageId
//         );
//         if (foundIndex !== -1) {
//           targetPageIndex = foundIndex;
//         }
//       }

//       if (targetPageIndex < 0 || targetPageIndex >= state.form.pages.length)
//         return;

//       const page = state.form.pages[targetPageIndex];
//       if (!page) return;

//       // Initialize fields array if it doesn't exist
//       if (!page.fields) {
//         page.fields = [];
//       }

//       // Generate new field
//       const newId = uuidv4();
//       const newField: Field = {
//         id: newId,
//         type,
//         label: getDefaultLabelForType(type),
//         required: state.form.settings?.defaultRequiredField || false,
//         helpText: '',
//         labelAlignment: state.form.settings?.defaultLabelAlignment || 'LEFT',
//       };

//       // Add default helpText for email fields
//       if (type === FieldType.EMAIL) {
//         newField.helpText = 'example@example.com';
//         newField.placeholder = 'example@example.com';
//       }

//       // Insert at specified index
//       page.fields.splice(index, 0, newField);

//       // Select the new field
//       state.form.selectedFieldId = newId;
//     },
//     togglePreviewMode: state => {
//       state.isPreviewMode = !state.isPreviewMode;

//       // When entering preview mode, clear selection
//       if (state.isPreviewMode && state.form) {
//         state.form.selectedFieldId = null;
//         state.form.propertiesPanelOpen = false;
//       }
//     },
//     setSaving: (state, action: PayloadAction<boolean>) => {
//       state.isSaving = action.payload;
//     },
//     updateLogo: (state, action: PayloadAction<LogoState>) => {
//       if (state.form) {
//         // Ensure size value is properly handled as a number
//         const sizeValue =
//           typeof action.payload.size === 'number' ? action.payload.size : 50; // Default to 50% if not provided

//         // Store the logo state with properly processed size
//         state.form.logo = {
//           ...action.payload,
//           size: sizeValue,
//           alignment: action.payload.alignment || 'CENTER',
//         };

//         // Update last saved timestamp
//         if (state.form.lastSaved !== undefined) {
//           state.form.lastSaved = new Date().toLocaleTimeString([], {
//             hour: '2-digit',
//             minute: '2-digit',
//           });
//         }
//       }
//     },
//     updateLogoSize: (state, action: PayloadAction<number>) => {
//       if (state.form && state.form.logo) {
//         // Ensure size is a valid number
//         const newSize = Math.max(0, Math.min(100, action.payload));

//         state.form.logo = {
//           ...state.form.logo,
//           size: newSize,
//         };

//         // Update last saved timestamp
//         if (state.form.lastSaved !== undefined) {
//           state.form.lastSaved = new Date().toLocaleTimeString([], {
//             hour: '2-digit',
//             minute: '2-digit',
//           });
//         }
//       }
//     },
//     updateLogoAlignment: (
//       state,
//       action: PayloadAction<'LEFT' | 'CENTER' | 'RIGHT'>
//     ) => {
//       if (state.form && state.form.logo) {
//         state.form.logo = {
//           ...state.form.logo,
//           alignment: action.payload,
//         };

//         state.form.lastSaved = new Date().toLocaleTimeString([], {
//           hour: '2-digit',
//           minute: '2-digit',
//         });
//       }
//     },
//     removeLogo: state => {
//       if (state.form) {
//         state.form.logo = null;
//         state.form.lastSaved = new Date().toLocaleTimeString([], {
//           hour: '2-digit',
//           minute: '2-digit',
//         });
//       }
//     },
//     addPage: state => {
//       if (!state.form) return;

//       // Initialize pages array if it doesn't exist
//       if (!state.form.pages) {
//         state.form.pages = [];
//       }

//       const newPageId = uuidv4();
//       state.form.pages.push({
//         id: newPageId,
//         fields: [],
//       });

//       // Update last saved timestamp
//       state.form.lastSaved = new Date().toLocaleTimeString([], {
//         hour: '2-digit',
//         minute: '2-digit',
//       });

//       // Automatically navigate to the new page
//       state.form.currentPageIndex = state.form.pages.length - 1;
//       state.form.selectedPageId = newPageId;
//     },
//     removePage: (state, action: PayloadAction<string>) => {
//       if (!state.form) return;

//       const pageId = action.payload;
//       const pageIndex = state.form.pages.findIndex(page => page.id === pageId);

//       if (pageIndex === -1) return;

//       // Remove the page
//       state.form.pages = state.form.pages.filter(page => page.id !== pageId);

//       // Adjust currentPageIndex if needed
//       if (
//         state.form.currentPageIndex &&
//         state.form.currentPageIndex >= pageIndex
//       ) {
//         state.form.currentPageIndex = Math.max(
//           0,
//           state.form.currentPageIndex - 1
//         );
//       }
//     },
//     setCurrentPage: (state, action: PayloadAction<number>) => {
//       if (!state.form || !state.form.pages) return;

//       const index = action.payload;

//       // Ensure index is within bounds
//       if (index >= 0 && index <= state.form.pages.length) {
//         state.form.currentPageIndex = index;

//         // Update selectedPageId if not on the thank you page
//         if (index < state.form.pages.length && state.form.pages[index]) {
//           state.form.selectedPageId = state.form.pages[index].id;
//         }
//       }
//     },
//     setCurrentPageIndex: (state, action: PayloadAction<number>) => {
//       if (!state.form) return;

//       // Ensure the index is valid
//       const newIndex = action.payload;
//       if (newIndex >= 0 && newIndex <= state.form.pages.length) {
//         state.form.currentPageIndex = newIndex;
//       }
//     },
//     clearError: state => {
//       state.error = null;
//     },
//   },

//   extraReducers: builder => {
//     builder
//       // Load form cases
//       .addCase(loadFormAsync.pending, state => {
//         state.isLoading = true;
//         state.error = null;
//       })
//       .addCase(loadFormAsync.fulfilled, (state, action) => {
//         state.isLoading = false;
//         state.error = null;

//         const formData = action.payload;

//         // Ensure pages exist and are properly structured
//         const pages =
//           formData.pages && Array.isArray(formData.pages)
//             ? formData.pages
//             : [{ id: uuidv4(), fields: [] }];

//         state.form = {
//           id: formData.id || formData._id,
//           title: formData.title || 'Untitled Form',
//           description: formData.description,
//           pages: pages,
//           selectedFieldId: null, // Always start with no field selected
//           selectedPageId: formData.selectedPageId || pages[0]?.id,
//           currentPageIndex: formData.currentPageIndex || 0,
//           propertiesPanelOpen: false, // Always start with panel closed
//           logo: formData.logo || null,
//           settings: {
//             submitButtonText: formData.settings?.submitButtonText || 'Submit',
//             defaultLabelAlignment:
//               formData.settings?.defaultLabelAlignment || 'LEFT',
//             thankyouMessage:
//               formData.settings?.thankyouMessage ||
//               'Thank you for your submission!',
//             defaultRequiredField:
//               formData.settings?.defaultRequiredField || false,
//             showLogo: formData.settings?.showLogo || false,
//           },
//           lastSaved: new Date().toLocaleTimeString([], {
//             hour: '2-digit',
//             minute: '2-digit',
//           }),
//         };
//       })
//       .addCase(loadFormAsync.rejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.payload as string;
//       })

//       // Save form cases
//       .addCase(saveFormAsync.pending, state => {
//         state.isSaving = true;
//       })
//       .addCase(saveFormAsync.fulfilled, state => {
//         state.isSaving = false;
//         state.lastSaveTime = new Date().toLocaleTimeString([], {
//           hour: '2-digit',
//           minute: '2-digit',
//         });
//         if (state.form) {
//           state.form.lastSaved = state.lastSaveTime;
//         }
//       })
//       .addCase(saveFormAsync.rejected, (state, action) => {
//         state.isSaving = false;
//         state.error = action.payload as string;
//       })

//       // Publish form cases
//       .addCase(publishFormAsync.pending, state => {
//         state.isSaving = true;
//       })
//       .addCase(publishFormAsync.fulfilled, (state, action) => {
//         state.isSaving = false;
//         if (state.form) {
//           // Update form publish status from response
//           const updatedData = action.payload;
//           if (updatedData.isPublished !== undefined) {
//             // Update any publish-related state here if needed
//           }
//         }
//       })
//       .addCase(publishFormAsync.rejected, (state, action) => {
//         state.isSaving = false;
//         state.error = action.payload as string;
//       });
//   },
// });

// function getDefaultLabelForType(type: FieldType): string {
//   switch (type) {
//     case FieldType.HEADING:
//       return 'Section Heading';
//     case FieldType.FULL_NAME:
//       return 'Full Name';
//     case FieldType.EMAIL:
//       return 'Email Address';
//     case FieldType.PHONE:
//       return 'Phone Number';
//     case FieldType.ADDRESS:
//       return 'Address';
//     case FieldType.DATE_PICKER:
//       return 'Select Date';
//     case FieldType.APPOINTMENT:
//       return 'Schedule Appointment';
//     case FieldType.SIGNATURE:
//       return 'Signature';
//     case FieldType.FILL_BLANK:
//       return 'Complete the Sentence';
//     case FieldType.PRODUCT_LIST:
//       return 'Products';
//     default:
//       return 'New Field';
//   }
// }

// function getLabelForType(type: FieldType): string {
//   switch (type) {
//     case FieldType.HEADING:
//       return 'Heading';
//     case FieldType.FULL_NAME:
//       return 'Full Name';
//     case FieldType.EMAIL:
//       return 'Email';
//     case FieldType.PHONE:
//       return 'Phone';
//     case FieldType.ADDRESS:
//       return 'Address';
//     case FieldType.DATE_PICKER:
//       return 'Date';
//     case FieldType.APPOINTMENT:
//       return 'Appointment';
//     case FieldType.SIGNATURE:
//       return 'Signature';
//     case FieldType.FILL_BLANK:
//       return 'Fill in the Blank';
//     case FieldType.PRODUCT_LIST:
//       return 'Product List';
//     default:
//       return 'New Field';
//   }
// }

// export const {
//   initializeForm,
//   loadFormData,
//   setFormTitle,
//   addField,
//   updateField,
//   removeField,
//   selectField,
//   clearSelectedField,
//   togglePropertiesPanel,
//   togglePreviewMode,
//   updateFormSettings,
//   setSaving,
//   setPreviewMode,
//   duplicateField,
//   moveField,
//   addFieldAtIndex,
//   updateLogo,
//   updateLogoSize,
//   updateLogoAlignment,
//   removeLogo,
//   addPage,
//   removePage,
//   setCurrentPageIndex,
//   setCurrentPage,
//   clearError,
// } = formBuilderSlice.actions;

// export default formBuilderSlice.reducer;

// src/redux/slices/formBuilderSlice.ts - Enhanced with better persistence
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { Form, Field, FieldType, FormSettings, LogoState } from '@/types/form';
import axios from 'axios';
import { apiConfig } from '@/config/api';

interface FormBuilderState {
  form: Form | null;
  isPreviewMode: boolean;
  isSaving: boolean;
  isLoading: boolean;
  showGridLines: boolean;
  error: string | null;
  lastSaveTime: string | null;
  hasUnsavedChanges: boolean; // Track if there are unsaved changes
}

const initialState: FormBuilderState = {
  form: null,
  isPreviewMode: false,
  isSaving: false,
  isLoading: false,
  showGridLines: false,
  error: null,
  lastSaveTime: null,
  hasUnsavedChanges: false,
};

// Async thunk to load form from backend
export const loadFormAsync = createAsyncThunk(
  'formBuilder/loadForm',
  async (formId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Loading form from backend:', formId);

      const response = await axios.get(`${apiConfig.url}/forms/${formId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Form loaded successfully:', response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to load form:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to load form'
      );
    }
  }
);

// Async thunk to save form to backend
export const saveFormAsync = createAsyncThunk(
  'formBuilder/saveForm',
  async (formId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { formBuilder: FormBuilderState };
      const form = state.formBuilder.form;

      if (!form) {
        throw new Error('No form data to save');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Prepare data for saving - exclude UI state
      const saveData = {
        title: form.title,
        description: form.description,
        pages: form.pages || [],
        selectedFieldId: null, // Don't save UI selection state
        selectedPageId: form.selectedPageId,
        currentPageIndex: form.currentPageIndex || 0,
        propertiesPanelOpen: false, // Don't save UI panel state
        logo: form.logo,
        settings: form.settings || {
          submitButtonText: 'Submit',
          defaultLabelAlignment: 'LEFT',
          thankyouMessage: 'Thank you for your submission!',
          defaultRequiredField: false,
          showLogo: false,
        },
      };

      console.log('Saving form to backend:', {
        formId,
        pageCount: saveData.pages.length,
        title: saveData.title,
      });

      const response = await axios.put(
        `${apiConfig.url}/forms/${formId}`,
        saveData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Form saved successfully');
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to save form:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to save form'
      );
    }
  }
);

// Async thunk to publish/unpublish form
export const publishFormAsync = createAsyncThunk(
  'formBuilder/publishForm',
  async (
    { formId, isPublished }: { formId: string; isPublished: boolean },
    { rejectWithValue }
  ) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.patch(
        `${apiConfig.url}/forms/${formId}/publish`,
        { isPublished },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Failed to update form status'
      );
    }
  }
);

const formBuilderSlice = createSlice({
  name: 'formBuilder',
  initialState,
  reducers: {
    initializeForm: state => {
      if (!state.form) {
        const pageId = uuidv4();
        state.form = {
          id: uuidv4(),
          title: 'Untitled Form',
          pages: [
            {
              id: pageId,
              fields: [],
            },
          ],
          selectedFieldId: null,
          selectedPageId: pageId,
          currentPageIndex: 0,
          propertiesPanelOpen: false,
          settings: {
            submitButtonText: 'Submit',
            defaultLabelAlignment: 'LEFT',
            thankyouMessage: 'Thank you for your submission!',
            defaultRequiredField: false,
          },
          lastSaved: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        state.hasUnsavedChanges = false;
      }
    },
    // Mark changes as saved (used after successful auto-save)
    markChangesSaved: state => {
      state.hasUnsavedChanges = false;
      if (state.form) {
        state.form.lastSaved = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    },

    setFormTitle: (state, action: PayloadAction<string>) => {
      if (state.form) {
        state.form.title = action.payload;
        state.hasUnsavedChanges = true;
        state.form.lastSaved = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    },

    setSelectedPageId: (state, action: PayloadAction<string>) => {
      if (state.form) {
        state.form.selectedPageId = action.payload;
        console.log('🎯 selectedPageId updated to:', action.payload);
        // Don't mark as unsaved changes for page selection UI state
      }
    },

    updateFormSettings: (
      state,
      action: PayloadAction<Partial<FormSettings>>
    ) => {
      if (!state.form) return;

      state.form.settings = {
        ...state.form.settings,
        ...action.payload,
      } as FormSettings;
      state.hasUnsavedChanges = true;
      state.form.lastSaved = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    },

    addField: (
      state,
      action: PayloadAction<{ type: FieldType; pageId?: string }>
    ) => {
      if (!state.form || !state.form.pages) return;

      // Create new field with default values
      const newField: Field = {
        id: uuidv4(),
        type: action.payload.type,
        label: getLabelForType(action.payload.type),
        required: state.form.settings?.defaultRequiredField || false,
        labelAlignment: state.form.settings?.defaultLabelAlignment || 'LEFT',
      };

      // Add default helpText for email fields
      if (action.payload.type === FieldType.EMAIL) {
        newField.helpText = 'example@example.com';
        newField.placeholder = 'example@example.com';
      }

      // Determine which page to add the field to
      const pageId = action.payload.pageId || state.form.selectedPageId;
      if (!pageId) {
        // If no page is selected, add to the first page
        if (state.form.pages.length > 0) {
          state.form.pages[0].fields.push(newField);
          state.form.selectedFieldId = newField.id;
        }
        return;
      }

      const pageIndex = state.form.pages.findIndex(page => page.id === pageId);
      if (pageIndex !== -1) {
        if (!state.form.pages[pageIndex].fields) {
          state.form.pages[pageIndex].fields = [];
        }
        state.form.pages[pageIndex].fields.push(newField);
        state.form.selectedFieldId = newField.id;
        state.hasUnsavedChanges = true;
        state.form.lastSaved = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    },

    updateField: (
      state,
      action: PayloadAction<{
        id: string;
        updates: Partial<Field>;
        pageId?: string;
      }>
    ) => {
      if (!state.form || !state.form.pages) return;

      const { id, updates, pageId } = action.payload;

      // Try to find the page containing the field
      const targetPageId = pageId || state.form.selectedPageId;
      if (!targetPageId) {
        // If no page ID is provided, search all pages
        for (const page of state.form.pages) {
          if (!page || !page.fields) continue;

          const fieldIndex = page.fields.findIndex(field => field.id === id);
          if (fieldIndex !== -1) {
            page.fields[fieldIndex] = {
              ...page.fields[fieldIndex],
              ...updates,
            };
            state.hasUnsavedChanges = true;
            state.form.lastSaved = new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            return;
          }
        }
        return;
      }

      // If pageId is provided, find that specific page
      const pageIndex = state.form.pages.findIndex(
        page => page.id === targetPageId
      );
      if (pageIndex !== -1) {
        const page = state.form.pages[pageIndex];
        if (!page || !page.fields) return;

        const fieldIndex = page.fields.findIndex(field => field.id === id);
        if (fieldIndex !== -1) {
          page.fields[fieldIndex] = {
            ...page.fields[fieldIndex],
            ...updates,
          };
          state.hasUnsavedChanges = true;
          state.form.lastSaved = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      }
    },

    removeField: (
      state,
      action: PayloadAction<{ fieldId: string; pageId?: string }>
    ) => {
      if (!state.form || !state.form.pages) return;

      const { fieldId, pageId } = action.payload;

      // If pageId is provided, only look in that page
      if (pageId) {
        const pageIndex = state.form.pages.findIndex(
          page => page.id === pageId
        );
        if (pageIndex !== -1) {
          const page = state.form.pages[pageIndex];
          if (!page || !page.fields) return;

          page.fields = page.fields.filter(field => field.id !== fieldId);
          if (state.form.selectedFieldId === fieldId) {
            state.form.selectedFieldId = null;
          }
          state.hasUnsavedChanges = true;
          state.form.lastSaved = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
        }
        return;
      }

      // If no pageId, search all pages
      for (const page of state.form.pages) {
        if (!page || !page.fields) continue;

        const fieldIndex = page.fields.findIndex(field => field.id === fieldId);
        if (fieldIndex !== -1) {
          page.fields = page.fields.filter(field => field.id !== fieldId);
          if (state.form.selectedFieldId === fieldId) {
            state.form.selectedFieldId = null;
          }
          state.hasUnsavedChanges = true;
          state.form.lastSaved = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          return;
        }
      }
    },

    selectField: (state, action: PayloadAction<string>) => {
      if (state.form) {
        state.form.selectedFieldId = action.payload;
        // Don't mark as unsaved changes for UI state changes
      }
    },

    clearSelectedField: state => {
      if (state.form) {
        state.form.selectedFieldId = null;
        // Don't mark as unsaved changes for UI state changes
      }
    },

    togglePropertiesPanel: (
      state,
      action: PayloadAction<boolean | undefined>
    ) => {
      if (state.form) {
        if (action.payload !== undefined) {
          state.form.propertiesPanelOpen = action.payload;
        } else {
          state.form.propertiesPanelOpen = !state.form.propertiesPanelOpen;
        }
        // Don't mark as unsaved changes for UI state changes
      }
    },

    setPreviewMode: (state, action: PayloadAction<boolean>) => {
      state.isPreviewMode = action.payload;

      // When entering preview mode, clear selection
      if (state.isPreviewMode && state.form) {
        state.form.selectedFieldId = null;
        state.form.propertiesPanelOpen = false;
      }
      // Don't mark as unsaved changes for UI state changes
    },

    duplicateField: (state, action: PayloadAction<string>) => {
      if (!state.form || !state.form.pages) return;

      const fieldId = action.payload;

      // Find the field in all pages
      for (const page of state.form.pages) {
        if (!page || !page.fields) continue;

        const fieldToDuplicate = page.fields.find(
          field => field.id === fieldId
        );
        if (fieldToDuplicate) {
          const duplicatedField = {
            ...fieldToDuplicate,
            id: uuidv4(),
            label: `${fieldToDuplicate.label} (Copy)`,
          };

          // Find the index of the original field
          const fieldIndex = page.fields.findIndex(
            field => field.id === fieldId
          );

          // Insert the duplicated field right after the original
          page.fields.splice(fieldIndex + 1, 0, duplicatedField);
          state.form.selectedFieldId = duplicatedField.id;
          state.hasUnsavedChanges = true;
          state.form.lastSaved = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          return;
        }
      }
    },

    moveField: (
      state,
      action: PayloadAction<{
        dragIndex: number;
        hoverIndex: number;
        pageId?: string;
      }>
    ) => {
      if (!state.form || !state.form.pages) return;

      const { dragIndex, hoverIndex, pageId } = action.payload;

      // If pageId is provided, only move within that page
      if (pageId) {
        const pageIndex = state.form.pages.findIndex(
          page => page.id === pageId
        );
        if (pageIndex !== -1) {
          const page = state.form.pages[pageIndex];
          if (!page || !page.fields || !Array.isArray(page.fields)) return;

          const draggedField = page.fields[dragIndex];
          if (!draggedField) return;

          // Remove the dragged item
          page.fields.splice(dragIndex, 1);
          // Insert it at the new position
          page.fields.splice(hoverIndex, 0, draggedField);
          state.hasUnsavedChanges = true;
        }
        return;
      }

      // If no pageId provided, assume we're moving within the current active page
      if (
        state.form.currentPageIndex !== undefined &&
        state.form.currentPageIndex >= 0 &&
        state.form.currentPageIndex < state.form.pages.length
      ) {
        const page = state.form.pages[state.form.currentPageIndex];
        if (!page || !page.fields || !Array.isArray(page.fields)) return;

        const draggedField = page.fields[dragIndex];
        if (!draggedField) return;

        // Remove the dragged item
        page.fields.splice(dragIndex, 1);
        // Insert it at the new position
        page.fields.splice(hoverIndex, 0, draggedField);
        state.hasUnsavedChanges = true;
      }
    },

    addFieldAtIndex: (
      state,
      action: PayloadAction<{
        type: FieldType;
        index: number;
        pageId: string;
      }>
    ) => {
      if (!state.form || !state.form.pages) return;

      const { type, index, pageId } = action.payload;

      console.log('🎯 Redux addFieldAtIndex:', {
        type,
        index,
        pageId,
        availablePages: state.form.pages.map(p => ({
          id: p.id,
          fieldsCount: p.fields?.length || 0,
        })),
      });

      // Find the target page by ID
      const targetPageIndex = state.form.pages.findIndex(
        page => page.id === pageId
      );

      if (targetPageIndex === -1) {
        console.error('❌ Page not found:', pageId);
        return;
      }

      const page = state.form.pages[targetPageIndex];
      if (!page) {
        console.error('❌ Invalid page at index:', targetPageIndex);
        return;
      }

      // Initialize fields array if it doesn't exist
      if (!page.fields) {
        page.fields = [];
      }

      // Generate new field
      const newId = uuidv4();
      const newField: Field = {
        id: newId,
        type,
        label: getDefaultLabelForType(type),
        required: state.form.settings?.defaultRequiredField || false,
        helpText: '',
        labelAlignment: state.form.settings?.defaultLabelAlignment || 'LEFT',
      };

      // Add default helpText for email fields
      if (type === FieldType.EMAIL) {
        newField.helpText = 'example@example.com';
        newField.placeholder = 'example@example.com';
      }

      // Insert at specified index
      const insertIndex = Math.min(index, page.fields.length);
      page.fields.splice(insertIndex, 0, newField);

      console.log('✅ Field added successfully:', {
        fieldId: newId,
        fieldType: type,
        pageId,
        insertIndex,
        totalFieldsInPage: page.fields.length,
      });

      // Select the new field
      state.form.selectedFieldId = newId;
      state.hasUnsavedChanges = true;

      // Update last saved timestamp
      state.form.lastSaved = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    },

    togglePreviewMode: state => {
      state.isPreviewMode = !state.isPreviewMode;

      // When entering preview mode, clear selection
      if (state.isPreviewMode && state.form) {
        state.form.selectedFieldId = null;
        state.form.propertiesPanelOpen = false;
      }
      // Don't mark as unsaved changes for UI state changes
    },

    setSaving: (state, action: PayloadAction<boolean>) => {
      state.isSaving = action.payload;
    },

    updateLogo: (state, action: PayloadAction<LogoState>) => {
      if (state.form) {
        // Ensure size value is properly handled as a number
        const sizeValue =
          typeof action.payload.size === 'number' ? action.payload.size : 50;

        // Store the logo state with properly processed size
        state.form.logo = {
          ...action.payload,
          size: sizeValue,
          alignment: action.payload.alignment || 'CENTER',
        };

        state.hasUnsavedChanges = true;
        // Update last saved timestamp
        if (state.form.lastSaved !== undefined) {
          state.form.lastSaved = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      }
    },

    updateLogoSize: (state, action: PayloadAction<number>) => {
      if (state.form && state.form.logo) {
        // Ensure size is a valid number
        const newSize = Math.max(0, Math.min(100, action.payload));

        state.form.logo = {
          ...state.form.logo,
          size: newSize,
        };

        state.hasUnsavedChanges = true;
        // Update last saved timestamp
        if (state.form.lastSaved !== undefined) {
          state.form.lastSaved = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      }
    },

    updateLogoAlignment: (
      state,
      action: PayloadAction<'LEFT' | 'CENTER' | 'RIGHT'>
    ) => {
      if (state.form && state.form.logo) {
        state.form.logo = {
          ...state.form.logo,
          alignment: action.payload,
        };

        state.hasUnsavedChanges = true;
        state.form.lastSaved = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    },

    removeLogo: state => {
      if (state.form) {
        state.form.logo = null;
        state.hasUnsavedChanges = true;
        state.form.lastSaved = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    },

    addPage: state => {
      if (!state.form) return;

      // Initialize pages array if it doesn't exist
      if (!state.form.pages) {
        state.form.pages = [];
      }

      const newPageId = uuidv4();
      state.form.pages.push({
        id: newPageId,
        fields: [],
      });

      // Update last saved timestamp
      state.hasUnsavedChanges = true;
      state.form.lastSaved = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      // Automatically navigate to the new page
      state.form.currentPageIndex = state.form.pages.length - 1;
      state.form.selectedPageId = newPageId;
    },

    removePage: (state, action: PayloadAction<string>) => {
      if (!state.form) return;

      const pageId = action.payload;
      const pageIndex = state.form.pages.findIndex(page => page.id === pageId);

      if (pageIndex === -1) return;

      // Remove the page
      state.form.pages = state.form.pages.filter(page => page.id !== pageId);

      // Adjust currentPageIndex if needed
      if (
        state.form.currentPageIndex &&
        state.form.currentPageIndex >= pageIndex
      ) {
        state.form.currentPageIndex = Math.max(
          0,
          state.form.currentPageIndex - 1
        );
      }

      state.hasUnsavedChanges = true;
    },

    setCurrentPage: (state, action: PayloadAction<number>) => {
      if (!state.form || !state.form.pages) return;

      const index = action.payload;

      // Ensure index is within bounds
      if (index >= 0 && index <= state.form.pages.length) {
        state.form.currentPageIndex = index;

        // Update selectedPageId if not on the thank you page
        if (index < state.form.pages.length && state.form.pages[index]) {
          state.form.selectedPageId = state.form.pages[index].id;
        }
        // Don't mark as unsaved changes for page navigation
      }
    },

    setCurrentPageIndex: (state, action: PayloadAction<number>) => {
      if (!state.form) return;

      // Ensure the index is valid
      const newIndex = action.payload;
      if (newIndex >= 0 && newIndex <= state.form.pages.length) {
        state.form.currentPageIndex = newIndex;
        // Don't mark as unsaved changes for page navigation
      }
    },

    clearError: state => {
      state.error = null;
    },
  },

  extraReducers: builder => {
    builder
      // Load form cases
      .addCase(loadFormAsync.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadFormAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;

        const formData = action.payload;

        // Ensure pages exist and are properly structured
        const pages =
          formData.pages && Array.isArray(formData.pages)
            ? formData.pages
            : [{ id: uuidv4(), fields: [] }];

        state.form = {
          id: formData.id || formData._id,
          title: formData.title || 'Untitled Form',
          description: formData.description,
          pages: pages,
          selectedFieldId: null, // Always start with no field selected
          selectedPageId: formData.selectedPageId || pages[0]?.id,
          currentPageIndex: formData.currentPageIndex || 0,
          propertiesPanelOpen: false, // Always start with panel closed
          logo: formData.logo || null,
          settings: {
            submitButtonText: formData.settings?.submitButtonText || 'Submit',
            defaultLabelAlignment:
              formData.settings?.defaultLabelAlignment || 'LEFT',
            thankyouMessage:
              formData.settings?.thankyouMessage ||
              'Thank you for your submission!',
            defaultRequiredField:
              formData.settings?.defaultRequiredField || false,
            showLogo: formData.settings?.showLogo || false,
          },
          lastSaved: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };

        // Form just loaded, so no unsaved changes
        state.hasUnsavedChanges = false;
      })
      .addCase(loadFormAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Save form cases
      .addCase(saveFormAsync.pending, state => {
        state.isSaving = true;
      })
      .addCase(saveFormAsync.fulfilled, state => {
        state.isSaving = false;
        state.hasUnsavedChanges = false;
        state.lastSaveTime = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        if (state.form) {
          state.form.lastSaved = state.lastSaveTime;
        }
      })
      .addCase(saveFormAsync.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      })

      // Publish form cases
      .addCase(publishFormAsync.pending, state => {
        state.isSaving = true;
      })
      .addCase(publishFormAsync.fulfilled, (state, action) => {
        state.isSaving = false;
        if (state.form) {
          // Update form publish status from response
          const updatedData = action.payload;
          if (updatedData.isPublished !== undefined) {
            // Update any publish-related state here if needed
          }
        }
      })
      .addCase(publishFormAsync.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });
  },
});

function getDefaultLabelForType(type: FieldType): string {
  switch (type) {
    case FieldType.HEADING:
      return 'Section Heading';
    case FieldType.FULL_NAME:
      return 'Full Name';
    case FieldType.EMAIL:
      return 'Email Address';
    case FieldType.PHONE:
      return 'Phone Number';
    case FieldType.ADDRESS:
      return 'Address';
    case FieldType.DATE_PICKER:
      return 'Select Date';
    case FieldType.APPOINTMENT:
      return 'Schedule Appointment';
    case FieldType.SIGNATURE:
      return 'Signature';
    case FieldType.FILL_BLANK:
      return 'Complete the Sentence';
    case FieldType.PRODUCT_LIST:
      return 'Products';
    default:
      return 'New Field';
  }
}

function getLabelForType(type: FieldType): string {
  switch (type) {
    case FieldType.HEADING:
      return 'Heading';
    case FieldType.FULL_NAME:
      return 'Full Name';
    case FieldType.EMAIL:
      return 'Email';
    case FieldType.PHONE:
      return 'Phone';
    case FieldType.ADDRESS:
      return 'Address';
    case FieldType.DATE_PICKER:
      return 'Date';
    case FieldType.APPOINTMENT:
      return 'Appointment';
    case FieldType.SIGNATURE:
      return 'Signature';
    case FieldType.FILL_BLANK:
      return 'Fill in the Blank';
    case FieldType.PRODUCT_LIST:
      return 'Product List';
    default:
      return 'New Field';
  }
}

export const {
  initializeForm,
  markChangesSaved,
  setFormTitle,
  addField,
  updateField,
  removeField,
  selectField,
  clearSelectedField,
  togglePropertiesPanel,
  togglePreviewMode,
  updateFormSettings,
  setSaving,
  setPreviewMode,
  duplicateField,
  moveField,
  addFieldAtIndex,
  updateLogo,
  updateLogoSize,
  updateLogoAlignment,
  removeLogo,
  addPage,
  removePage,
  setCurrentPageIndex,
  setCurrentPage,
  setSelectedPageId,
  clearError,
} = formBuilderSlice.actions;

export default formBuilderSlice.reducer;
