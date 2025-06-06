// src/components/dashboard/FormsList.tsx
'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
  RotateCcw,
  ExternalLink, // For restore icon
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
import { Input } from '@/components/ui/input';
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
  renameFormAsync,
  renameFormOptimistic,
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
  onFormAction?: () => void; // Callback to refetch forms after actions
}

const FormsList: React.FC<FormsListProps> = ({
  activeSection = 'All',
  onFormAction,
}) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const forms = useSelector(selectForms);
  const labels = useSelector(selectLabels);
  const isLoading = useSelector(selectFormsLoading);
  const error = useSelector(selectFormsError);

  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [showLabelDialog, setShowLabelDialog] = useState(false);
  const [labelOperations, setLabelOperations] = useState<
    Record<string, 'add' | 'remove'>
  >({});

  // Rename functionality state
  const [renamingFormId, setRenamingFormId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Click handling state
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [clickedFormId, setClickedFormId] = useState<string | null>(null);

  // Helper function to determine current context
  const isTrashSection = activeSection === 'Trash';
  const isArchiveSection = activeSection === 'Archive';
  const isNormalSection = !isTrashSection && !isArchiveSection;

  // Helper function to trigger refetch
  const triggerRefetch = useCallback(() => {
    if (onFormAction) {
      onFormAction();
    }
  }, [onFormAction]);

  // Handle submissions link click
  const handleSubmissionsClick = (e: React.MouseEvent, formId: string) => {
    e.stopPropagation(); // Prevent form selection
    router.push(`/build/${formId}/submissions`);
  };

  // Rename form functionality
  const handleRenameStart = (formId: string, currentName: string) => {
    setRenamingFormId(formId);
    setRenameValue(currentName);
    // Focus the input after a short delay to ensure it's rendered
    setTimeout(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }, 50);
  };

  const handleRenameSubmit = useCallback(async () => {
    if (!renamingFormId || !renameValue.trim()) {
      handleRenameCancel();
      return;
    }

    try {
      // Optimistic update
      dispatch(
        renameFormOptimistic({
          formId: renamingFormId,
          newName: renameValue.trim(),
        })
      );

      // API call
      await dispatch(
        renameFormAsync({
          formId: renamingFormId,
          newName: renameValue.trim(),
        }) as any
      ).unwrap();

      toast.success('Form renamed successfully');
      triggerRefetch();

      // Reset rename state
      setRenamingFormId(null);
      setRenameValue('');
    } catch {
      // Revert optimistic update by refetching or handling error
      toast.error('Failed to rename form');
      triggerRefetch(); // This will revert the optimistic update
      handleRenameCancel();
    }
  }, [renamingFormId, renameValue, dispatch, triggerRefetch]);

  const handleRenameCancel = () => {
    setRenamingFormId(null);
    setRenameValue('');
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleRenameCancel();
    }
  };

  // Improved click handling - distinguish between single and double clicks
  const handleFormClick = useCallback(
    (e: React.MouseEvent, formId: string) => {
      e.stopPropagation();

      // Don't handle clicks if we're in rename mode
      if (renamingFormId) return;

      // If clicking on the same form within double-click timeframe
      if (clickedFormId === formId && clickTimeoutRef.current) {
        // This is a double-click - clear timeout and open form
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
        setClickedFormId(null);

        // Navigate to form builder
        router.push(`/build/${formId}`);
        return;
      }

      // Clear any existing timeout
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }

      // Set the clicked form
      setClickedFormId(formId);

      // Set timeout for single click action (selection)
      clickTimeoutRef.current = setTimeout(() => {
        // This is a single click - handle selection
        setSelectedForms(prev =>
          prev.includes(formId)
            ? prev.filter(id => id !== formId)
            : [...prev, formId]
        );

        setClickedFormId(null);
        clickTimeoutRef.current = null;
      }, 200); // 200ms delay for distinguishing single vs double click
    },
    [clickedFormId, router, renamingFormId]
  );

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // Handle clicks outside rename input to cancel/submit rename
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        renamingFormId &&
        renameInputRef.current &&
        !renameInputRef.current.contains(event.target as Node)
      ) {
        handleRenameSubmit();
      }
    };

    if (renamingFormId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [renamingFormId, handleRenameSubmit]);

  // Handle checkbox click separately
  const handleCheckboxClick = (e: React.MouseEvent, formId: string) => {
    e.stopPropagation();
    setSelectedForms(prev =>
      prev.includes(formId)
        ? prev.filter(id => id !== formId)
        : [...prev, formId]
    );
  };

  // Handle form actions with backend calls
  const handleToggleFavorite = async (e: React.MouseEvent, formId: string) => {
    e.stopPropagation();

    // Optimistic update
    dispatch(toggleFavoriteOptimistic(formId));

    try {
      await dispatch(toggleFormFavorite(formId) as any).unwrap();
      toast.success('Form favorite status updated');
      // Trigger refetch for favorites section
      if (activeSection === 'Favorites') {
        triggerRefetch();
      }
    } catch {
      // Revert optimistic update on error
      dispatch(toggleFormFavorite(formId) as any);
      toast.error('Failed to update favorite status');
    }
  };

  const handleFormAction = async (action: string, formId: string) => {
    try {
      switch (action) {
        case 'Edit':
          // Navigate to form builder for editing
          router.push(`/build/${formId}`);
          break;

        case 'View':
          // Navigate to form preview/view
          window.open(`/form/${formId}`, '_blank');
          break;

        case 'Settings':
          // Navigate to form settings
          router.push(`/build/${formId}/settings`);
          break;

        case 'Publish Form':
          // Navigate to form settings
          router.push(`/build/${formId}/publish`);
          break;

        case 'Move to Trash':
          await dispatch(trashFormAsync(formId) as any).unwrap();
          toast.success('Form moved to Trash');
          // Trigger refetch to remove from current view
          triggerRefetch();
          break;

        case 'Archive':
          await dispatch(archiveFormAsync(formId) as any).unwrap();
          toast.success('Form archived');
          // Trigger refetch to remove from current view
          triggerRefetch();
          break;

        case 'Restore':
          await dispatch(restoreFormAsync(formId) as any).unwrap();
          toast.success('Form restored');
          // Trigger refetch to remove from trash/archive view
          triggerRefetch();
          break;

        case 'Delete Permanently':
          // Get form details for better confirmation message
          const form = forms.find(f => f.id === formId);
          const submissionCount = form?.submissions || 0;

          // Enhanced confirmation message
          const confirmMessage =
            submissionCount > 0
              ? `⚠️ PERMANENT DELETION WARNING ⚠️\n\nThis will permanently delete:\n• The form "${
                  form?.name
                }"\n• All ${submissionCount} submission${
                  submissionCount === 1 ? '' : 's'
                }\n• All uploaded files and attachments\n\nThis action cannot be undone. Are you sure you want to continue?`
              : `This will permanently delete the form "${form?.name}". This action cannot be undone.\n\nAre you sure you want to continue?`;

          if (window.confirm(confirmMessage)) {
            console.log(
              `🗑️ User confirmed deletion of form ${formId} with ${submissionCount} submissions`
            );

            // Show loading toast
            const loadingToast = toast.loading(
              submissionCount > 0
                ? `Deleting form and ${submissionCount} submission${
                    submissionCount === 1 ? '' : 's'
                  }...`
                : 'Deleting form...'
            );

            try {
              await dispatch(deleteFormAsync(formId) as any).unwrap();

              toast.dismiss(loadingToast);
              toast.success(
                submissionCount > 0
                  ? `Form and ${submissionCount} submission${
                      submissionCount === 1 ? '' : 's'
                    } permanently deleted`
                  : 'Form permanently deleted',
                { duration: 5000 }
              );

              triggerRefetch();
            } catch (deleteError: any) {
              toast.dismiss(loadingToast);
              toast.error(`Failed to delete form: ${deleteError.message}`, {
                duration: 7000,
              });
              throw deleteError;
            }
          } else {
            console.log('❌ User cancelled form deletion');
            return; // User cancelled
          }
          break;

        case 'Add Label':
        case 'Manage Labels':
          setShowLabelDialog(true);
          setSelectedForms([formId]);
          setLabelOperations({});
          return;

        case 'Rename':
          // Start rename mode
          if (form) {
            handleRenameStart(formId, form.name);
          }
          return;

        default:
          toast.success(`${action} action triggered for form`);
          return;
      }

      // Remove from selection if it was selected
      if (selectedForms.includes(formId)) {
        setSelectedForms(prev => prev.filter(id => id !== formId));
      }
    } catch {
      toast.error(`Failed to ${action.toLowerCase()}`);
    }
  };

  const handleBulkAction = async (action: string) => {
    try {
      switch (action) {
        case 'Move to Trash':
          await dispatch(bulkTrashFormsAsync(selectedForms) as any).unwrap();
          toast.success(`${selectedForms.length} forms moved to Trash`);
          // Trigger refetch to remove from current view
          triggerRefetch();
          break;

        case 'Archive':
          await dispatch(bulkArchiveFormsAsync(selectedForms) as any).unwrap();
          toast.success(`${selectedForms.length} forms archived`);
          // Trigger refetch to remove from current view
          triggerRefetch();
          break;

        case 'Restore':
          // Handle bulk restore for trashed/archived forms
          for (const formId of selectedForms) {
            await dispatch(restoreFormAsync(formId) as any).unwrap();
          }
          toast.success(`${selectedForms.length} forms restored`);
          // Trigger refetch to remove from trash/archive view
          triggerRefetch();
          break;

        case 'Delete Permanently':
          // Calculate total submissions across selected forms
          const totalSubmissions = selectedForms.reduce((total, formId) => {
            const form = forms.find(f => f.id === formId);
            return total + (form?.submissions || 0);
          }, 0);

          const bulkConfirmMessage =
            totalSubmissions > 0
              ? `⚠️ BULK PERMANENT DELETION WARNING ⚠️\n\nThis will permanently delete:\n• ${
                  selectedForms.length
                } forms\n• ${totalSubmissions} total submission${
                  totalSubmissions === 1 ? '' : 's'
                }\n• All uploaded files and attachments\n\nThis action cannot be undone. Are you sure you want to continue?`
              : `This will permanently delete ${selectedForms.length} forms. This action cannot be undone.\n\nAre you sure you want to continue?`;

          if (window.confirm(bulkConfirmMessage)) {
            console.log(
              `🗑️ User confirmed bulk deletion of ${selectedForms.length} forms with ${totalSubmissions} total submissions`
            );

            const loadingToast = toast.loading(
              `Deleting ${selectedForms.length} forms and ${totalSubmissions} submissions...`
            );

            // Handle bulk permanent delete for trashed forms
            let successCount = 0;
            let failCount = 0;

            for (const formId of selectedForms) {
              try {
                await dispatch(deleteFormAsync(formId) as any).unwrap();
                successCount++;
              } catch (error) {
                console.error(`Failed to delete form ${formId}:`, error);
                failCount++;
              }
            }

            toast.dismiss(loadingToast);

            if (successCount === selectedForms.length) {
              toast.success(
                `Successfully deleted ${successCount} forms and their submissions`
              );
            } else if (successCount > 0) {
              toast.warning(
                `Deleted ${successCount} forms, but ${failCount} failed`
              );
            } else {
              toast.error(`Failed to delete all ${selectedForms.length} forms`);
            }

            triggerRefetch();
          }
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
    } catch {
      toast.error(`Failed to ${action.toLowerCase()} forms`);
    }
  };

  const handleApplyLabels = async () => {
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

      // Trigger refetch to update form labels display
      triggerRefetch();
    } catch {
      toast.error('Failed to update labels');
    }
  };

  // Select all visible forms
  const handleSelectAll = () => {
    const allIds = forms.map(form => form.id);
    setSelectedForms(allIds);
  };

  // Deselect all forms
  const handleDeselectAll = () => {
    setSelectedForms([]);
  };

  // Helper functions for label management
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

  const handleLabelCheckboxChange = (labelId: string, checked: boolean) => {
    setLabelOperations(prev => ({
      ...prev,
      [labelId]: checked ? 'add' : 'remove',
    }));
  };

  // Format date for display
  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get appropriate bulk action buttons based on section
  const getBulkActionButtons = () => {
    if (isTrashSection) {
      return (
        <>
          <Button
            variant='outline'
            size='sm'
            className='text-green-600 border-gray-300 hover:bg-green-50'
            onClick={() => handleBulkAction('Restore')}
          >
            <RotateCcw className='mr-2 h-4 w-4' />
            Restore
          </Button>
          <Button
            variant='outline'
            size='sm'
            className='text-red-600 border-gray-300 hover:bg-red-50'
            onClick={() => handleBulkAction('Delete Permanently')}
          >
            <Trash2 className='mr-2 h-4 w-4' />
            Delete Permanently
          </Button>
        </>
      );
    }

    if (isArchiveSection) {
      return (
        <>
          <Button
            variant='outline'
            size='sm'
            className='text-green-600 border-gray-300 hover:bg-green-50'
            onClick={() => handleBulkAction('Restore')}
          >
            <RotateCcw className='mr-2 h-4 w-4' />
            Restore
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
        </>
      );
    }

    // Normal sections (All, Favorites, Drafts, Labels)
    return (
      <>
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
      </>
    );
  };

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
      {/* Selection Actions Bar - shown when forms are selected */}
      {selectedForms.length > 0 && (
        <div className='flex items-center justify-between p-3 bg-[#EDF8FF] border border-blue-300 rounded-md mb-2'>
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
            {getBulkActionButtons()}

            <Button
              variant='ghost'
              size='sm'
              className='text-gray-500 hover:bg-gray-100'
              onClick={handleDeselectAll}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Forms List */}
      {forms.length === 0 ? (
        <div className='text-center py-10'>
          <p className='text-gray-500'>No forms found in this section.</p>
        </div>
      ) : (
        forms.map(form => (
          <motion.div
            key={form.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center p-3 border rounded-md transition-all duration-200 cursor-pointer select-none
              ${
                selectedForms.includes(form.id)
                  ? 'border-blue-500 bg-[#EDF8FF] shadow-sm'
                  : 'border-gray-200'
              }
              ${clickedFormId === form.id ? 'bg-blue-50' : ''}
              hover:bg-[#F3F3FE] hover:border-gray-300 hover:shadow-sm`}
            onClick={e => handleFormClick(e, form.id)}
          >
            <div className='flex items-center space-x-3 min-w-0'>
              <Checkbox
                checked={selectedForms.includes(form.id)}
                onCheckedChange={() => {}}
                onClick={e => handleCheckboxClick(e, form.id)}
                className='ml-1'
              />

              <button
                onClick={e => handleToggleFavorite(e, form.id)}
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
                {renamingFormId === form.id ? (
                  <Input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={handleRenameKeyDown}
                    className='font-medium text-sm h-6 px-2 py-1 border-none outline-none focus:outline-none focus:ring-0 focus:border-transparent shadow-none focus-visible:ring-1 mb-0.5'
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <h3 className='font-medium text-sm truncate'>{form.name}</h3>
                )}
                <div className='text-xs text-gray-500 truncate flex items-center gap-1'>
                  {/*  NEW: Make submissions count clickable */}
                  <button
                    onClick={e => handleSubmissionsClick(e, form.id)}
                    className='text-[#2E66C3] hover:text-blue-800 hover:underline font-medium transition-colors inline-flex items-center gap-1 cursor-pointer'
                    title={`View ${form.submissions} submission${
                      form.submissions === 1 ? '' : 's'
                    }`}
                  >
                    {form.submissions}{' '}
                    {form.submissions === 1 ? 'Submission' : 'Submissions'}
                    <ExternalLink className='h-3 w-3' />
                  </button>
                  <span>•</span>
                  <span>Created on {getFormattedDate(form.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className='ml-auto flex items-center'>
              {/* Display labels if they exist */}
              {form.labels && form.labels.length > 0 && (
                <div className='flex mr-2 max-w-[120px] overflow-hidden'>
                  {form.labels.slice(0, 2).map(labelId => {
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

                    {/* Always show Edit and Preview */}
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        handleFormAction('Edit', form.id);
                      }}
                    >
                      <Edit className='mr-2 h-4 w-4' />
                      <span>Edit Form</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        handleFormAction('View', form.id);
                      }}
                    >
                      <Eye className='mr-2 h-4 w-4' />
                      <span>Preview</span>
                    </DropdownMenuItem>

                    {/* Context-specific actions */}
                    {isTrashSection ? (
                      // Trash section: only Restore and Delete Permanently
                      <>
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation();
                            handleFormAction('Restore', form.id);
                          }}
                        >
                          <RotateCcw className='mr-2 h-4 w-4' />
                          <span>Restore</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation();
                            handleFormAction('Delete Permanently', form.id);
                          }}
                          className='text-red-400 focus:text-red-400'
                        >
                          <Trash2 className='mr-2 h-4 w-4' />
                          <span>Delete Permanently</span>
                        </DropdownMenuItem>
                      </>
                    ) : isArchiveSection ? (
                      // Archive section: Restore and Move to Trash
                      <>
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation();
                            handleFormAction('Restore', form.id);
                          }}
                        >
                          <RotateCcw className='mr-2 h-4 w-4' />
                          <span>Restore</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation();
                            handleFormAction('Move to Trash', form.id);
                          }}
                          className='text-red-400 focus:text-red-400'
                        >
                          <Trash2 className='mr-2 h-4 w-4' />
                          <span>Move to Trash</span>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      // Normal sections: full menu
                      <>
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation();
                            handleFormAction('Settings', form.id);
                          }}
                        >
                          <Settings className='mr-2 h-4 w-4' />
                          <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation();
                            handleFormAction('Rename', form.id);
                          }}
                        >
                          <FileCog className='mr-2 h-4 w-4' />
                          <span>Rename</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation();
                            handleFormAction('Manage Labels', form.id);
                          }}
                        >
                          <Tag className='mr-2 h-4 w-4' />
                          <span>Manage Labels</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation();
                            handleFormAction('Archive', form.id);
                          }}
                        >
                          <Archive className='mr-2 h-4 w-4' />
                          <span>Archive</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation();
                            handleFormAction('Move to Trash', form.id);
                          }}
                          className='text-red-400 focus:text-red-400'
                        >
                          <Trash2 className='mr-2 h-4 w-4' />
                          <span>Move to Trash</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuGroup>

                  {/* Publish section - only for normal sections */}
                  {isNormalSection && (
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className='font-bold text-md'>
                        Publish
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation();
                          handleFormAction('Publish Form', form.id);
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
        ))
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
                  // Determine if all or some forms have this label
                  const allHaveLabel = allFormsHaveLabel(label.id);
                  const someHaveLabel = anyFormsHaveLabel(label.id);

                  // Determine checkbox state based on current operations or existing labels
                  const isChecked =
                    labelOperations[label.id] === 'add' ||
                    (labelOperations[label.id] === undefined && allHaveLabel);

                  // Show mixed state when some forms have the label but not all
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

                        {/* Show status indicator */}
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
