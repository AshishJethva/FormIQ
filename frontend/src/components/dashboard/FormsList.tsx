// // src/components/dashboard/FormsList.tsx - Improved UX for Click Handling
// 'use client';
// import React, { useState, useRef, useCallback } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { motion } from 'framer-motion';
// import { toast } from 'sonner';
// import { useRouter } from 'next/navigation';
// import {
//   Star,
//   MoreHorizontal,
//   Edit,
//   Eye,
//   Settings,
//   Share,
//   FileText,
//   FileCog,
//   Trash2,
//   Archive,
//   Tag,
//   ChevronRight,
// } from 'lucide-react';
// import { Checkbox } from '@/components/ui/checkbox';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuGroup,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { Button } from '@/components/ui/button';
// import {
//   selectLabels,
//   selectForms,
//   selectFormsLoading,
//   selectFormsError,
//   toggleFormFavorite,
//   archiveFormAsync,
//   trashFormAsync,
//   restoreFormAsync,
//   deleteFormAsync,
//   bulkArchiveFormsAsync,
//   bulkTrashFormsAsync,
//   bulkAddLabelToFormsAsync,
//   bulkRemoveLabelFromFormsAsync,
//   toggleFavoriteOptimistic,
// } from '@/redux/slices/dashboard/formsSlice';

// // Dialog for label selection
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from '@/components/ui/dialog';

// interface FormsListProps {
//   activeSection?: string;
// }

// const FormsList: React.FC<FormsListProps> = () => {
//   const dispatch = useDispatch();
//   const router = useRouter();
//   const forms = useSelector(selectForms);
//   const labels = useSelector(selectLabels);
//   const isLoading = useSelector(selectFormsLoading);
//   const error = useSelector(selectFormsError);

//   const [selectedForms, setSelectedForms] = useState<string[]>([]);
//   const [showLabelDialog, setShowLabelDialog] = useState(false);
//   const [labelOperations, setLabelOperations] = useState<
//     Record<string, 'add' | 'remove'>
//   >({});

//   // Click handling state
//   const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const [clickedFormId, setClickedFormId] = useState<string | null>(null);

//   // Improved click handling - distinguish between single and double clicks
//   const handleFormClick = useCallback(
//     (e: React.MouseEvent, formId: string) => {
//       e.stopPropagation();

//       // If clicking on the same form within double-click timeframe
//       if (clickedFormId === formId && clickTimeoutRef.current) {
//         // This is a double-click - clear timeout and open form
//         clearTimeout(clickTimeoutRef.current);
//         clickTimeoutRef.current = null;
//         setClickedFormId(null);

//         // Navigate to form builder
//         router.push(`/build/${formId}`);
//         return;
//       }

//       // Clear any existing timeout
//       if (clickTimeoutRef.current) {
//         clearTimeout(clickTimeoutRef.current);
//       }

//       // Set the clicked form
//       setClickedFormId(formId);

//       // Set timeout for single click action (selection)
//       clickTimeoutRef.current = setTimeout(() => {
//         // This is a single click - handle selection
//         setSelectedForms(prev =>
//           prev.includes(formId)
//             ? prev.filter(id => id !== formId)
//             : [...prev, formId]
//         );

//         setClickedFormId(null);
//         clickTimeoutRef.current = null;
//       }, 200); // 200ms delay for distinguishing single vs double click
//     },
//     [clickedFormId, router]
//   );

//   // Clean up timeout on unmount
//   React.useEffect(() => {
//     return () => {
//       if (clickTimeoutRef.current) {
//         clearTimeout(clickTimeoutRef.current);
//       }
//     };
//   }, []);

//   // Handle checkbox click separately
//   const handleCheckboxClick = (e: React.MouseEvent, formId: string) => {
//     e.stopPropagation();
//     setSelectedForms(prev =>
//       prev.includes(formId)
//         ? prev.filter(id => id !== formId)
//         : [...prev, formId]
//     );
//   };

//   // Handle form actions with backend calls
//   const handleToggleFavorite = async (e: React.MouseEvent, formId: string) => {
//     e.stopPropagation();

//     // Optimistic update
//     dispatch(toggleFavoriteOptimistic(formId));

//     try {
//       await dispatch(toggleFormFavorite(formId) as any).unwrap();
//       toast.success('Form favorite status updated');
//     } catch {
//       // Revert optimistic update on error
//       dispatch(toggleFormFavorite(formId) as any);
//       toast.error('Failed to update favorite status');
//     }
//   };

//   const handleFormAction = async (action: string, formId: string) => {
//     try {
//       switch (action) {
//         case 'Edit':
//           // Navigate to form builder for editing
//           router.push(`/build/${formId}`);
//           break;

//         case 'View':
//           // Navigate to form preview/view
//           window.open(`/form/${formId}`, '_blank');
//           break;

//         case 'Settings':
//           // Navigate to form settings (could be a tab in form builder)
//           router.push(`/build/${formId}?tab=settings`);
//           break;

//         case 'Publish Form':
//           // Handle publish logic
//           toast.success('Form publishing feature coming soon');
//           break;

//         case 'Move to Trash':
//           await dispatch(trashFormAsync(formId) as any).unwrap();
//           toast.success('Form moved to Trash');
//           break;

//         case 'Archive':
//           await dispatch(archiveFormAsync(formId) as any).unwrap();
//           toast.success('Form archived');
//           break;

//         case 'Restore':
//           await dispatch(restoreFormAsync(formId) as any).unwrap();
//           toast.success('Form restored');
//           break;

//         case 'Delete Permanently':
//           await dispatch(deleteFormAsync(formId) as any).unwrap();
//           toast.success('Form permanently deleted');
//           break;

//         case 'Add Label':
//         case 'Manage Labels':
//           setShowLabelDialog(true);
//           setSelectedForms([formId]);
//           setLabelOperations({});
//           return;

//         case 'Rename':
//           // Handle rename logic
//           toast.success('Rename feature coming soon');
//           return;

//         default:
//           toast.success(`${action} action triggered for form`);
//           return;
//       }

//       // Remove from selection if it was selected
//       if (selectedForms.includes(formId)) {
//         setSelectedForms(prev => prev.filter(id => id !== formId));
//       }
//     } catch {
//       toast.error(`Failed to ${action.toLowerCase()}`);
//     }
//   };

//   const handleBulkAction = async (action: string) => {
//     try {
//       switch (action) {
//         case 'Move to Trash':
//           await dispatch(bulkTrashFormsAsync(selectedForms) as any).unwrap();
//           toast.success(`${selectedForms.length} forms moved to Trash`);
//           break;

//         case 'Archive':
//           await dispatch(bulkArchiveFormsAsync(selectedForms) as any).unwrap();
//           toast.success(`${selectedForms.length} forms archived`);
//           break;

//         case 'Label as':
//         case 'Manage Labels':
//           setShowLabelDialog(true);
//           setLabelOperations({});
//           return;

//         default:
//           toast.success(`${action} action triggered for selected forms`);
//           return;
//       }

//       setSelectedForms([]);
//     } catch {
//       toast.error(`Failed to ${action.toLowerCase()} forms`);
//     }
//   };

//   const handleApplyLabels = async () => {
//     try {
//       const addPromises: Promise<any>[] = [];
//       const removePromises: Promise<any>[] = [];

//       Object.entries(labelOperations).forEach(([labelId, operation]) => {
//         if (operation === 'add') {
//           addPromises.push(
//             dispatch(
//               bulkAddLabelToFormsAsync({
//                 formIds: selectedForms,
//                 labelId,
//               }) as any
//             ).unwrap()
//           );
//         } else {
//           removePromises.push(
//             dispatch(
//               bulkRemoveLabelFromFormsAsync({
//                 formIds: selectedForms,
//                 labelId,
//               }) as any
//             ).unwrap()
//           );
//         }
//       });

//       await Promise.all([...addPromises, ...removePromises]);

//       toast.success('Labels updated successfully');
//       setLabelOperations({});
//       setShowLabelDialog(false);
//     } catch {
//       toast.error('Failed to update labels');
//     }
//   };

//   // Select all visible forms
//   const handleSelectAll = () => {
//     const allIds = forms.map(form => form.id);
//     setSelectedForms(allIds);
//   };

//   // Deselect all forms
//   const handleDeselectAll = () => {
//     setSelectedForms([]);
//   };

//   // Helper functions for label management
//   const allFormsHaveLabel = (labelId: string) => {
//     return selectedForms.every(formId => {
//       const form = forms.find(f => f.id === formId);
//       return form?.labels?.includes(labelId);
//     });
//   };

//   const anyFormsHaveLabel = (labelId: string) => {
//     return selectedForms.some(formId => {
//       const form = forms.find(f => f.id === formId);
//       return form?.labels?.includes(labelId);
//     });
//   };

//   const handleLabelCheckboxChange = (labelId: string, checked: boolean) => {
//     setLabelOperations(prev => ({
//       ...prev,
//       [labelId]: checked ? 'add' : 'remove',
//     }));
//   };

//   // Format date for display
//   const getFormattedDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       month: 'short',
//       day: 'numeric',
//       year: 'numeric',
//     });
//   };

//   if (isLoading) {
//     return (
//       <div className='flex items-center justify-center py-10'>
//         <div className='text-gray-500'>Loading forms...</div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className='flex items-center justify-center py-10'>
//         <div className='text-red-500'>Error: {error}</div>
//       </div>
//     );
//   }

//   return (
//     <div className='space-y-2'>
//       {/* Selection Actions Bar - shown when forms are selected */}
//       {selectedForms.length > 0 && (
//         <div className='flex items-center justify-between p-3 bg-[#EDF8FF] border border-blue-300 rounded-md mb-2'>
//           <div className='flex items-center'>
//             <Checkbox
//               checked={
//                 selectedForms.length === forms.length && forms.length > 0
//               }
//               onCheckedChange={() => {
//                 if (selectedForms.length === forms.length) {
//                   handleDeselectAll();
//                 } else {
//                   handleSelectAll();
//                 }
//               }}
//               className='ml-1 mr-3'
//             />
//             <span className='text-sm text-gray-700 font-medium'>
//               {selectedForms.length} selected
//             </span>
//           </div>

//           <div className='flex items-center space-x-2'>
//             <Button
//               variant='outline'
//               size='sm'
//               className='text-gray-700 border-gray-300 hover:bg-gray-100'
//               onClick={() => handleBulkAction('Label as')}
//             >
//               <Tag className='mr-2 h-4 w-4' />
//               Label as
//             </Button>

//             <Button
//               variant='outline'
//               size='sm'
//               className='text-gray-700 border-gray-300 hover:bg-gray-100'
//               onClick={() => handleBulkAction('Archive')}
//             >
//               <Archive className='mr-2 h-4 w-4' />
//               Archive
//             </Button>

//             <Button
//               variant='outline'
//               size='sm'
//               className='text-red-600 border-gray-300 hover:bg-red-50'
//               onClick={() => handleBulkAction('Move to Trash')}
//             >
//               <Trash2 className='mr-2 h-4 w-4' />
//               Move to Trash
//             </Button>

//             <Button
//               variant='ghost'
//               size='sm'
//               className='text-gray-500 hover:bg-gray-100'
//               onClick={handleDeselectAll}
//             >
//               Cancel
//             </Button>
//           </div>
//         </div>
//       )}

//       {/* Forms List */}
//       {forms.length === 0 ? (
//         <div className='text-center py-10'>
//           <p className='text-gray-500'>No forms found in this section.</p>
//         </div>
//       ) : (
//         forms.map(form => (
//           <motion.div
//             key={form.id}
//             initial={{ opacity: 0, y: 5 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.2 }}
//             className={`flex items-center p-3 border rounded-md transition-all duration-200 cursor-pointer select-none
//               ${
//                 selectedForms.includes(form.id)
//                   ? 'border-blue-500 bg-[#EDF8FF] shadow-sm'
//                   : 'border-gray-200'
//               }
//               ${clickedFormId === form.id ? 'bg-blue-50' : ''}
//               hover:bg-[#F3F3FE] hover:border-gray-300 hover:shadow-sm`}
//             onClick={e => handleFormClick(e, form.id)}
//           >
//             <div className='flex items-center space-x-3 min-w-0'>
//               <Checkbox
//                 checked={selectedForms.includes(form.id)}
//                 onCheckedChange={() => {}}
//                 onClick={e => handleCheckboxClick(e, form.id)}
//                 className='ml-1'
//               />

//               <button
//                 onClick={e => handleToggleFavorite(e, form.id)}
//                 className='focus:outline-none'
//               >
//                 <Star
//                   className={`h-5 w-5 transition-colors ${
//                     form.isFavorite
//                       ? 'fill-yellow-400 text-yellow-400'
//                       : 'text-gray-300 hover:text-yellow-300'
//                   }`}
//                 />
//               </button>

//               <div className='h-10 w-10 bg-orange-500 flex items-center justify-center rounded text-white shrink-0'>
//                 <FileText className='h-5 w-5' />
//               </div>

//               <div className='min-w-0 flex-1'>
//                 <h3 className='font-medium text-sm truncate'>{form.name}</h3>
//                 <p className='text-xs text-gray-500 truncate'>
//                   {form.submissions}{' '}
//                   {form.submissions === 1 ? 'Submission' : 'Submissions'}.
//                   Created on {getFormattedDate(form.createdAt)}
//                 </p>
//               </div>
//             </div>

//             <div className='ml-auto flex items-center'>
//               {/* Display labels if they exist */}
//               {form.labels && form.labels.length > 0 && (
//                 <div className='flex mr-2 max-w-[120px] overflow-hidden'>
//                   {form.labels.slice(0, 2).map(labelId => {
//                     const label = labels.find(l => l.id === labelId);
//                     return label ? (
//                       <div
//                         key={label.id}
//                         className='mr-1 px-2 py-0.5 text-xs rounded-full truncate'
//                         style={{
//                           backgroundColor: `${label.color}20`,
//                           color: label.color,
//                           maxWidth: '60px',
//                         }}
//                       >
//                         {label.name}
//                       </div>
//                     ) : null;
//                   })}
//                   {form.labels.length > 2 && (
//                     <div className='text-xs text-gray-500 flex items-center'>
//                       <ChevronRight className='h-3 w-3' />
//                       {form.labels.length - 2}
//                     </div>
//                   )}
//                 </div>
//               )}

//               {/* Show remaining days in trash */}
//               {form.isTrashed && form.daysRemaining && (
//                 <div className='mr-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-md'>
//                   {form.daysRemaining} days
//                 </div>
//               )}

//               <DropdownMenu>
//                 <DropdownMenuTrigger asChild>
//                   <Button
//                     variant='ghost'
//                     size='sm'
//                     className='h-8 w-8 p-0 hover:bg-gray-200'
//                     onClick={e => e.stopPropagation()}
//                   >
//                     <MoreHorizontal className='h-4 w-4' />
//                   </Button>
//                 </DropdownMenuTrigger>
//                 <DropdownMenuContent
//                   align='end'
//                   className='w-56 bg-[#102035] text-white'
//                 >
//                   <DropdownMenuGroup>
//                     <DropdownMenuLabel className='font-bold text-lg'>
//                       Form Actions
//                     </DropdownMenuLabel>
//                     <DropdownMenuItem
//                       onClick={e => {
//                         e.stopPropagation();
//                         handleFormAction('Edit', form.id);
//                       }}
//                     >
//                       <Edit className='mr-2 h-4 w-4' />
//                       <span>Edit Form</span>
//                     </DropdownMenuItem>
//                     <DropdownMenuItem
//                       onClick={e => {
//                         e.stopPropagation();
//                         handleFormAction('View', form.id);
//                       }}
//                     >
//                       <Eye className='mr-2 h-4 w-4' />
//                       <span>Preview</span>
//                     </DropdownMenuItem>
//                     {!form.isArchived && !form.isTrashed && (
//                       <>
//                         <DropdownMenuItem
//                           onClick={e => {
//                             e.stopPropagation();
//                             handleFormAction('Settings', form.id);
//                           }}
//                         >
//                           <Settings className='mr-2 h-4 w-4' />
//                           <span>Settings</span>
//                         </DropdownMenuItem>
//                         <DropdownMenuItem
//                           onClick={e => {
//                             e.stopPropagation();
//                             handleFormAction('Rename', form.id);
//                           }}
//                         >
//                           <FileCog className='mr-2 h-4 w-4' />
//                           <span>Rename</span>
//                         </DropdownMenuItem>
//                         <DropdownMenuItem
//                           onClick={e => {
//                             e.stopPropagation();
//                             handleFormAction('Manage Labels', form.id);
//                           }}
//                         >
//                           <Tag className='mr-2 h-4 w-4' />
//                           <span>Manage Labels</span>
//                         </DropdownMenuItem>
//                       </>
//                     )}

//                     {!form.isArchived && !form.isTrashed && (
//                       <DropdownMenuItem
//                         onClick={e => {
//                           e.stopPropagation();
//                           handleFormAction('Archive', form.id);
//                         }}
//                       >
//                         <Archive className='mr-2 h-4 w-4' />
//                         <span>Archive</span>
//                       </DropdownMenuItem>
//                     )}

//                     {(form.isArchived || form.isTrashed) && (
//                       <DropdownMenuItem
//                         onClick={e => {
//                           e.stopPropagation();
//                           handleFormAction('Restore', form.id);
//                         }}
//                       >
//                         <Archive className='mr-2 h-4 w-4' />
//                         <span>Restore</span>
//                       </DropdownMenuItem>
//                     )}

//                     {!form.isTrashed && (
//                       <DropdownMenuItem
//                         onClick={e => {
//                           e.stopPropagation();
//                           handleFormAction('Move to Trash', form.id);
//                         }}
//                         className='text-red-400 focus:text-red-400'
//                       >
//                         <Trash2 className='mr-2 h-4 w-4' />
//                         <span>Move to Trash</span>
//                       </DropdownMenuItem>
//                     )}

//                     {form.isTrashed && (
//                       <DropdownMenuItem
//                         onClick={e => {
//                           e.stopPropagation();
//                           handleFormAction('Delete Permanently', form.id);
//                         }}
//                         className='text-red-400 focus:text-red-400'
//                       >
//                         <Trash2 className='mr-2 h-4 w-4' />
//                         <span>Delete Permanently</span>
//                       </DropdownMenuItem>
//                     )}
//                   </DropdownMenuGroup>

//                   {!form.isArchived && !form.isTrashed && (
//                     <DropdownMenuGroup>
//                       <DropdownMenuLabel className='font-bold text-md'>
//                         Publish
//                       </DropdownMenuLabel>
//                       <DropdownMenuItem
//                         onClick={e => {
//                           e.stopPropagation();
//                           handleFormAction('Publish Form', form.id);
//                         }}
//                       >
//                         <Share className='mr-2 h-4 w-4' />
//                         <span>Publish Form</span>
//                       </DropdownMenuItem>
//                     </DropdownMenuGroup>
//                   )}
//                 </DropdownMenuContent>
//               </DropdownMenu>
//             </div>
//           </motion.div>
//         ))
//       )}

//       {/* Enhanced Label Selection Dialog */}
//       <Dialog
//         open={showLabelDialog}
//         onOpenChange={open => {
//           setShowLabelDialog(open);
//           if (!open) {
//             setLabelOperations({});
//           }
//         }}
//       >
//         <DialogContent className='sm:max-w-[425px] bg-white text-black'>
//           <DialogHeader>
//             <DialogTitle>Manage Labels</DialogTitle>
//           </DialogHeader>
//           <div className='grid gap-4 py-4'>
//             {labels.length === 0 ? (
//               <p className='text-center text-gray-500'>
//                 No labels available. Create a label first.
//               </p>
//             ) : (
//               <div className='grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2'>
//                 {labels.map(label => {
//                   // Determine if all or some forms have this label
//                   const allHaveLabel = allFormsHaveLabel(label.id);
//                   const someHaveLabel = anyFormsHaveLabel(label.id);

//                   // Determine checkbox state based on current operations or existing labels
//                   const isChecked =
//                     labelOperations[label.id] === 'add' ||
//                     (labelOperations[label.id] === undefined && allHaveLabel);

//                   // Show mixed state when some forms have the label but not all
//                   const showMixedState =
//                     labelOperations[label.id] === undefined &&
//                     someHaveLabel &&
//                     !allHaveLabel;

//                   return (
//                     <div
//                       key={label.id}
//                       className={`flex items-center p-3 rounded-md border
//                         ${
//                           isChecked
//                             ? 'border-blue-500 bg-blue-50'
//                             : 'border-gray-200'
//                         }
//                         hover:bg-gray-50 cursor-pointer transition-colors`}
//                       onClick={() =>
//                         handleLabelCheckboxChange(label.id, !isChecked)
//                       }
//                     >
//                       <div className='flex items-center space-x-3 w-full'>
//                         <Checkbox
//                           id={`label-${label.id}`}
//                           checked={isChecked}
//                           data-state={
//                             showMixedState
//                               ? 'indeterminate'
//                               : isChecked
//                               ? 'checked'
//                               : 'unchecked'
//                           }
//                           onCheckedChange={checked =>
//                             handleLabelCheckboxChange(label.id, !!checked)
//                           }
//                           className={showMixedState ? 'opacity-60' : ''}
//                         />
//                         <div
//                           className='w-4 h-4 rounded-full mr-2'
//                           style={{ backgroundColor: label.color }}
//                         />
//                         <span className='flex-1'>{label.name}</span>

//                         {/* Show status indicator */}
//                         {labelOperations[label.id] === undefined &&
//                           someHaveLabel && (
//                             <span className='text-xs text-gray-500'>
//                               {allHaveLabel ? 'Applied' : 'Applied to some'}
//                             </span>
//                           )}

//                         {labelOperations[label.id] === 'add' &&
//                           !allHaveLabel && (
//                             <span className='text-xs text-green-600'>
//                               Will be added
//                             </span>
//                           )}

//                         {labelOperations[label.id] === 'remove' && (
//                           <span className='text-xs text-red-600'>
//                             Will be removed
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </div>
//           <DialogFooter>
//             <Button
//               variant='outline'
//               onClick={() => {
//                 setShowLabelDialog(false);
//                 setLabelOperations({});
//               }}
//             >
//               Cancel
//             </Button>
//             <Button
//               onClick={handleApplyLabels}
//               disabled={
//                 labels.length === 0 || Object.keys(labelOperations).length === 0
//               }
//               className={
//                 labels.length === 0 || Object.keys(labelOperations).length === 0
//                   ? 'opacity-50'
//                   : ''
//               }
//             >
//               Apply Changes
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default FormsList;

// src/components/dashboard/FormsList.tsx
'use client';
import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Star,
  MoreHorizontal,
  Edit,
  Eye,
  Settings,
  Share,
  FileText,
  FileCog,
  Trash2,
  Archive,
  Tag,
  ChevronRight,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  selectLabels,
  selectForms,
  selectFormsLoading,
  selectFormsError,
  toggleFormFavorite,
  archiveFormAsync,
  trashFormAsync,
  restoreFormAsync,
  deleteFormAsync,
  bulkArchiveFormsAsync,
  bulkTrashFormsAsync,
  bulkAddLabelToFormsAsync,
  bulkRemoveLabelFromFormsAsync,
  toggleFavoriteOptimistic,
  fetchForms,
} from '@/redux/slices/dashboard/formsSlice';

// Dialog for label selection
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface FormsListProps {
  activeSection?: string;
  filteredForms?: any[];
  onFormsChange?: () => void;
}

// Memoized components for better performance
const FormItem = React.memo(
  ({
    form,
    labels,
    selectedForms,
    onToggleSelection,
    onToggleFavorite,
    onFormAction,
    onFormClick,
  }: {
    form: any;
    labels: any[];
    selectedForms: string[];
    onToggleSelection: (formId: string) => void;
    onToggleFavorite: (e: React.MouseEvent, formId: string) => void;
    onFormAction: (action: string, formId: string) => void;
    onFormClick: (e: React.MouseEvent, formId: string) => void;
  }) => {
    const getFormattedDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    const handleCheckboxClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleSelection(form.id);
      },
      [form.id, onToggleSelection]
    );

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.2 }}
        className={`flex items-center p-3 border rounded-md transition-all duration-200 cursor-pointer select-none
        ${
          selectedForms.includes(form.id)
            ? 'border-blue-500 bg-[#EDF8FF] shadow-sm'
            : 'border-gray-200'
        }
        hover:bg-[#F3F3FE] hover:border-gray-300 hover:shadow-sm`}
        onClick={e => onFormClick(e, form.id)}
      >
        <div className='flex items-center space-x-3 min-w-0'>
          <Checkbox
            checked={selectedForms.includes(form.id)}
            onCheckedChange={() => {}}
            onClick={handleCheckboxClick}
            className='ml-1'
          />

          <button
            onClick={e => onToggleFavorite(e, form.id)}
            className='focus:outline-none'
          >
            <Star
              className={`h-5 w-5 transition-colors ${
                form.isFavorite
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-300'
              }`}
            />
          </button>

          <div className='h-10 w-10 bg-orange-500 flex items-center justify-center rounded text-white shrink-0'>
            <FileText className='h-5 w-5' />
          </div>

          <div className='min-w-0 flex-1'>
            <h3 className='font-medium text-sm truncate'>{form.name}</h3>
            <p className='text-xs text-gray-500 truncate'>
              {form.submissions}{' '}
              {form.submissions === 1 ? 'Submission' : 'Submissions'}. Created
              on {getFormattedDate(form.createdAt)}
            </p>
          </div>
        </div>

        <div className='ml-auto flex items-center'>
          {/* Display labels if they exist */}
          {form.labels && form.labels.length > 0 && (
            <div className='flex mr-2 max-w-[120px] overflow-hidden'>
              {form.labels.slice(0, 2).map((labelId: string) => {
                const label = labels.find(l => l.id === labelId);
                return label ? (
                  <div
                    key={label.id}
                    className='mr-1 px-2 py-0.5 text-xs rounded-full truncate'
                    style={{
                      backgroundColor: `${label.color}20`,
                      color: label.color,
                      maxWidth: '60px',
                    }}
                  >
                    {label.name}
                  </div>
                ) : null;
              })}
              {form.labels.length > 2 && (
                <div className='text-xs text-gray-500 flex items-center'>
                  <ChevronRight className='h-3 w-3' />
                  {form.labels.length - 2}
                </div>
              )}
            </div>
          )}

          {/* Show remaining days in trash */}
          {form.isTrashed && form.daysRemaining && (
            <div className='mr-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-md'>
              {form.daysRemaining} days
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='h-8 w-8 p-0 hover:bg-gray-200'
                onClick={e => e.stopPropagation()}
              >
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              className='w-56 bg-[#102035] text-white'
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className='font-bold text-lg'>
                  Form Actions
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={e => {
                    e.stopPropagation();
                    onFormAction('Edit', form.id);
                  }}
                >
                  <Edit className='mr-2 h-4 w-4' />
                  <span>Edit Form</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={e => {
                    e.stopPropagation();
                    onFormAction('View', form.id);
                  }}
                >
                  <Eye className='mr-2 h-4 w-4' />
                  <span>Preview</span>
                </DropdownMenuItem>
                {!form.isArchived && !form.isTrashed && (
                  <>
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        onFormAction('Settings', form.id);
                      }}
                    >
                      <Settings className='mr-2 h-4 w-4' />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        onFormAction('Rename', form.id);
                      }}
                    >
                      <FileCog className='mr-2 h-4 w-4' />
                      <span>Rename</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        onFormAction('Manage Labels', form.id);
                      }}
                    >
                      <Tag className='mr-2 h-4 w-4' />
                      <span>Manage Labels</span>
                    </DropdownMenuItem>
                  </>
                )}

                {!form.isArchived && !form.isTrashed && (
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      onFormAction('Archive', form.id);
                    }}
                  >
                    <Archive className='mr-2 h-4 w-4' />
                    <span>Archive</span>
                  </DropdownMenuItem>
                )}

                {(form.isArchived || form.isTrashed) && (
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      onFormAction('Restore', form.id);
                    }}
                  >
                    <Archive className='mr-2 h-4 w-4' />
                    <span>Restore</span>
                  </DropdownMenuItem>
                )}

                {!form.isTrashed && (
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      onFormAction('Move to Trash', form.id);
                    }}
                    className='text-red-400 focus:text-red-400'
                  >
                    <Trash2 className='mr-2 h-4 w-4' />
                    <span>Move to Trash</span>
                  </DropdownMenuItem>
                )}

                {form.isTrashed && (
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      onFormAction('Delete Permanently', form.id);
                    }}
                    className='text-red-400 focus:text-red-400'
                  >
                    <Trash2 className='mr-2 h-4 w-4' />
                    <span>Delete Permanently</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>

              {!form.isArchived && !form.isTrashed && (
                <DropdownMenuGroup>
                  <DropdownMenuLabel className='font-bold text-md'>
                    Publish
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      onFormAction('Publish Form', form.id);
                    }}
                  >
                    <Share className='mr-2 h-4 w-4' />
                    <span>Publish Form</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    );
  }
);

FormItem.displayName = 'FormItem';

const FormsList: React.FC<FormsListProps> = ({
  activeSection = 'All',
  filteredForms,
  onFormsChange,
}) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const allForms = useSelector(selectForms);
  const labels = useSelector(selectLabels);
  const isLoading = useSelector(selectFormsLoading);
  const error = useSelector(selectFormsError);

  // Use filtered forms if provided, otherwise use all forms
  const forms = filteredForms || allForms;

  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [showLabelDialog, setShowLabelDialog] = useState(false);
  const [labelOperations, setLabelOperations] = useState<
    Record<string, 'add' | 'remove'>
  >({});

  // Click handling state
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [clickedFormId, setClickedFormId] = useState<string | null>(null);

  // Helper function to refresh forms data
  const refreshForms = useCallback(() => {
    if (onFormsChange) {
      onFormsChange();
    } else {
      // Fallback: refresh based on active section
      switch (activeSection) {
        case 'All':
          dispatch(fetchForms({ status: 'all' }) as any);
          break;
        case 'Favorites':
          dispatch(fetchForms({ status: 'favorites' }) as any);
          break;
        case 'Drafts':
          dispatch(fetchForms({ status: 'draft' }) as any);
          break;
        case 'Archive':
          dispatch(fetchForms({ status: 'archived' }) as any);
          break;
        case 'Trash':
          dispatch(fetchForms({ status: 'trashed' }) as any);
          break;
        default:
          dispatch(fetchForms({}) as any);
      }
    }
  }, [activeSection, dispatch, onFormsChange]);

  // Optimized click handling
  const handleFormClick = useCallback(
    (e: React.MouseEvent, formId: string) => {
      e.stopPropagation();

      if (clickedFormId === formId && clickTimeoutRef.current) {
        // Double-click - open form
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
        setClickedFormId(null);
        router.push(`/build/${formId}`);
        return;
      }

      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }

      setClickedFormId(formId);

      clickTimeoutRef.current = setTimeout(() => {
        // Single click - toggle selection
        setSelectedForms(prev =>
          prev.includes(formId)
            ? prev.filter(id => id !== formId)
            : [...prev, formId]
        );
        setClickedFormId(null);
        clickTimeoutRef.current = null;
      }, 200);
    },
    [clickedFormId, router]
  );

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // Optimized selection handlers
  const handleToggleSelection = useCallback((formId: string) => {
    setSelectedForms(prev =>
      prev.includes(formId)
        ? prev.filter(id => id !== formId)
        : [...prev, formId]
    );
  }, []);

  // Enhanced favorite toggle with optimistic updates
  const handleToggleFavorite = useCallback(
    async (e: React.MouseEvent, formId: string) => {
      e.stopPropagation();

      // Optimistic update
      dispatch(toggleFavoriteOptimistic(formId));

      try {
        await dispatch(toggleFormFavorite(formId) as any).unwrap();
        toast.success('Form favorite status updated');

        // Refresh after a short delay
        setTimeout(() => refreshForms(), 500);
      } catch {
        // Revert optimistic update on error
        dispatch(toggleFavoriteOptimistic(formId));
        toast.error('Failed to update favorite status');
      }
    },
    [dispatch, refreshForms]
  );

  // Optimized form actions with better error handling
  const handleFormAction = useCallback(
    async (action: string, formId: string) => {
      try {
        switch (action) {
          case 'Edit':
            router.push(`/build/${formId}`);
            break;

          case 'View':
            window.open(`/form/${formId}`, '_blank');
            break;

          case 'Settings':
            router.push(`/build/${formId}?tab=settings`);
            break;

          case 'Publish Form':
            toast.success('Form publishing feature coming soon');
            break;

          case 'Move to Trash':
            await dispatch(trashFormAsync(formId) as any).unwrap();
            toast.success('Form moved to Trash');
            setSelectedForms(prev => prev.filter(id => id !== formId));
            setTimeout(() => refreshForms(), 500);
            break;

          case 'Archive':
            await dispatch(archiveFormAsync(formId) as any).unwrap();
            toast.success('Form archived');
            setSelectedForms(prev => prev.filter(id => id !== formId));
            setTimeout(() => refreshForms(), 500);
            break;

          case 'Restore':
            await dispatch(restoreFormAsync(formId) as any).unwrap();
            toast.success('Form restored');
            setSelectedForms(prev => prev.filter(id => id !== formId));
            setTimeout(() => refreshForms(), 500);
            break;

          case 'Delete Permanently':
            await dispatch(deleteFormAsync(formId) as any).unwrap();
            toast.success('Form permanently deleted');
            setSelectedForms(prev => prev.filter(id => id !== formId));
            setTimeout(() => refreshForms(), 500);
            break;

          case 'Add Label':
          case 'Manage Labels':
            setShowLabelDialog(true);
            setSelectedForms([formId]);
            setLabelOperations({});
            return;

          case 'Rename':
            toast.success('Rename feature coming soon');
            return;

          default:
            toast.success(`${action} action triggered for form`);
            return;
        }
      } catch {
        toast.error(`Failed to ${action.toLowerCase()}`);
      }
    },
    [dispatch, router, refreshForms]
  );

  // Optimized bulk actions
  const handleBulkAction = useCallback(
    async (action: string) => {
      try {
        switch (action) {
          case 'Move to Trash':
            await dispatch(bulkTrashFormsAsync(selectedForms) as any).unwrap();
            toast.success(`${selectedForms.length} forms moved to Trash`);
            break;

          case 'Archive':
            await dispatch(
              bulkArchiveFormsAsync(selectedForms) as any
            ).unwrap();
            toast.success(`${selectedForms.length} forms archived`);
            break;

          case 'Label as':
          case 'Manage Labels':
            setShowLabelDialog(true);
            setLabelOperations({});
            return;

          default:
            toast.success(`${action} action triggered for selected forms`);
            return;
        }

        setSelectedForms([]);
        setTimeout(() => refreshForms(), 500);
      } catch {
        toast.error(`Failed to ${action.toLowerCase()} forms`);
      }
    },
    [dispatch, selectedForms, refreshForms]
  );

  // Optimized label operations
  const handleApplyLabels = useCallback(async () => {
    try {
      const addPromises: Promise<any>[] = [];
      const removePromises: Promise<any>[] = [];

      Object.entries(labelOperations).forEach(([labelId, operation]) => {
        if (operation === 'add') {
          addPromises.push(
            dispatch(
              bulkAddLabelToFormsAsync({
                formIds: selectedForms,
                labelId,
              }) as any
            ).unwrap()
          );
        } else {
          removePromises.push(
            dispatch(
              bulkRemoveLabelFromFormsAsync({
                formIds: selectedForms,
                labelId,
              }) as any
            ).unwrap()
          );
        }
      });

      await Promise.all([...addPromises, ...removePromises]);

      toast.success('Labels updated successfully');
      setLabelOperations({});
      setShowLabelDialog(false);

      setTimeout(() => refreshForms(), 500);
    } catch {
      toast.error('Failed to update labels');
    }
  }, [dispatch, selectedForms, labelOperations, refreshForms]);

  // Selection handlers
  const handleSelectAll = useCallback(() => {
    const allIds = forms.map(form => form.id);
    setSelectedForms(allIds);
  }, [forms]);

  const handleDeselectAll = useCallback(() => {
    setSelectedForms([]);
  }, []);

  // Memoized label helper functions
  const labelHelpers = useMemo(() => {
    const allFormsHaveLabel = (labelId: string) => {
      return selectedForms.every(formId => {
        const form = forms.find(f => f.id === formId);
        return form?.labels?.includes(labelId);
      });
    };

    const anyFormsHaveLabel = (labelId: string) => {
      return selectedForms.some(formId => {
        const form = forms.find(f => f.id === formId);
        return form?.labels?.includes(labelId);
      });
    };

    return { allFormsHaveLabel, anyFormsHaveLabel };
  }, [selectedForms, forms]);

  const handleLabelCheckboxChange = useCallback(
    (labelId: string, checked: boolean) => {
      setLabelOperations(prev => ({
        ...prev,
        [labelId]: checked ? 'add' : 'remove',
      }));
    },
    []
  );

  // Memoized forms list for better performance
  const memoizedForms = useMemo(() => {
    return forms.map(form => (
      <FormItem
        key={form.id}
        form={form}
        labels={labels}
        selectedForms={selectedForms}
        onToggleSelection={handleToggleSelection}
        onToggleFavorite={handleToggleFavorite}
        onFormAction={handleFormAction}
        onFormClick={handleFormClick}
      />
    ));
  }, [
    forms,
    labels,
    selectedForms,
    handleToggleSelection,
    handleToggleFavorite,
    handleFormAction,
    handleFormClick,
  ]);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-10'>
        <div className='text-gray-500'>Loading forms...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center py-10'>
        <div className='text-red-500'>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      {/* Selection Actions Bar */}
      <AnimatePresence>
        {selectedForms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='flex items-center justify-between p-3 bg-[#EDF8FF] border border-blue-300 rounded-md mb-2'
          >
            <div className='flex items-center'>
              <Checkbox
                checked={
                  selectedForms.length === forms.length && forms.length > 0
                }
                onCheckedChange={() => {
                  if (selectedForms.length === forms.length) {
                    handleDeselectAll();
                  } else {
                    handleSelectAll();
                  }
                }}
                className='ml-1 mr-3'
              />
              <span className='text-sm text-gray-700 font-medium'>
                {selectedForms.length} selected
              </span>
            </div>

            <div className='flex items-center space-x-2'>
              <Button
                variant='outline'
                size='sm'
                className='text-gray-700 border-gray-300 hover:bg-gray-100'
                onClick={() => handleBulkAction('Label as')}
              >
                <Tag className='mr-2 h-4 w-4' />
                Label as
              </Button>

              <Button
                variant='outline'
                size='sm'
                className='text-gray-700 border-gray-300 hover:bg-gray-100'
                onClick={() => handleBulkAction('Archive')}
              >
                <Archive className='mr-2 h-4 w-4' />
                Archive
              </Button>

              <Button
                variant='outline'
                size='sm'
                className='text-red-600 border-gray-300 hover:bg-red-50'
                onClick={() => handleBulkAction('Move to Trash')}
              >
                <Trash2 className='mr-2 h-4 w-4' />
                Move to Trash
              </Button>

              <Button
                variant='ghost'
                size='sm'
                className='text-gray-500 hover:bg-gray-100'
                onClick={handleDeselectAll}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help text */}
      {selectedForms.length === 0 && (
        <div className='text-xs text-gray-500 mb-2 px-1'>
          💡 <strong>Tip:</strong> Single click to select, double click to open
          form
        </div>
      )}

      {/* Forms List with AnimatePresence for smooth transitions */}
      {forms.length === 0 ? (
        <div className='text-center py-10'>
          <p className='text-gray-500'>No forms found in this section.</p>
        </div>
      ) : (
        <AnimatePresence mode='popLayout'>{memoizedForms}</AnimatePresence>
      )}

      {/* Enhanced Label Selection Dialog */}
      <Dialog
        open={showLabelDialog}
        onOpenChange={open => {
          setShowLabelDialog(open);
          if (!open) {
            setLabelOperations({});
          }
        }}
      >
        <DialogContent className='sm:max-w-[425px] bg-white text-black'>
          <DialogHeader>
            <DialogTitle>Manage Labels</DialogTitle>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            {labels.length === 0 ? (
              <p className='text-center text-gray-500'>
                No labels available. Create a label first.
              </p>
            ) : (
              <div className='grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2'>
                {labels.map(label => {
                  const allHaveLabel = labelHelpers.allFormsHaveLabel(label.id);
                  const someHaveLabel = labelHelpers.anyFormsHaveLabel(
                    label.id
                  );

                  const isChecked =
                    labelOperations[label.id] === 'add' ||
                    (labelOperations[label.id] === undefined && allHaveLabel);

                  const showMixedState =
                    labelOperations[label.id] === undefined &&
                    someHaveLabel &&
                    !allHaveLabel;

                  return (
                    <div
                      key={label.id}
                      className={`flex items-center p-3 rounded-md border
                        ${
                          isChecked
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200'
                        }
                        hover:bg-gray-50 cursor-pointer transition-colors`}
                      onClick={() =>
                        handleLabelCheckboxChange(label.id, !isChecked)
                      }
                    >
                      <div className='flex items-center space-x-3 w-full'>
                        <Checkbox
                          id={`label-${label.id}`}
                          checked={isChecked}
                          data-state={
                            showMixedState
                              ? 'indeterminate'
                              : isChecked
                              ? 'checked'
                              : 'unchecked'
                          }
                          onCheckedChange={checked =>
                            handleLabelCheckboxChange(label.id, !!checked)
                          }
                          className={showMixedState ? 'opacity-60' : ''}
                        />
                        <div
                          className='w-4 h-4 rounded-full mr-2'
                          style={{ backgroundColor: label.color }}
                        />
                        <span className='flex-1'>{label.name}</span>

                        {/* Status indicators */}
                        {labelOperations[label.id] === undefined &&
                          someHaveLabel && (
                            <span className='text-xs text-gray-500'>
                              {allHaveLabel ? 'Applied' : 'Applied to some'}
                            </span>
                          )}

                        {labelOperations[label.id] === 'add' &&
                          !allHaveLabel && (
                            <span className='text-xs text-green-600'>
                              Will be added
                            </span>
                          )}

                        {labelOperations[label.id] === 'remove' && (
                          <span className='text-xs text-red-600'>
                            Will be removed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setShowLabelDialog(false);
                setLabelOperations({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyLabels}
              disabled={
                labels.length === 0 || Object.keys(labelOperations).length === 0
              }
              className={
                labels.length === 0 || Object.keys(labelOperations).length === 0
                  ? 'opacity-50'
                  : ''
              }
            >
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormsList;
