// src/components/dashboard/FormsList.tsx
'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useDeletion } from '@/hooks/useDeletion';
import { formsService } from '@/services/forms';
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
  ExternalLink,
  Loader2,
  AlertTriangle,
  XCircle,
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
  bulkArchiveFormsAsync,
  bulkTrashFormsAsync,
  bulkAddLabelToFormsAsync,
  bulkRemoveLabelFromFormsAsync,
  toggleFavoriteOptimistic,
  renameFormAsync,
  renameFormOptimistic,
} from '@/redux/slices/dashboard/formsSlice';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

interface FormsListProps {
  activeSection?: string;
  onFormAction?: () => void;
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

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<
    Array<{
      id: string;
      name: string;
      submissions: number;
      files: number;
    }>
  >([]);
  const [isDeletingCustom, setIsDeletingCustom] = useState(false);

  const [renamingFormId, setRenamingFormId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [clickedFormId, setClickedFormId] = useState<string | null>(null);

  const isTrashSection = activeSection === 'Trash';
  const isArchiveSection = activeSection === 'Archive';
  const isNormalSection = !isTrashSection && !isArchiveSection;

  const { isDeleting, progress } = useDeletion({
    type: 'form',
    requireConfirmation: true,
    onSuccess: result => {
      console.log(' Forms deletion completed:', result);
      triggerRefetch();
      setSelectedForms([]);
    },
    onError: error => {
      console.error('❌ Forms deletion failed:', error);
    },
  });

  const handleDeleteFormPermanently = async (formId: string) => {
    const form = forms.find(f => f.id === formId);
    if (!form) return;

    const items = [
      {
        id: formId,
        name: form.name,
        submissions: form.submissions,
        files: form.submissions * 2,
      },
    ];

    setItemsToDelete(items);
    setShowDeleteConfirmModal(true);
  };

  const handleBulkDeleteForms = async () => {
    const selectedFormData = forms.filter(form =>
      selectedForms.includes(form.id)
    );

    const items = selectedFormData.map(form => ({
      id: form.id,
      name: form.name,
      submissions: form.submissions,
      files: form.submissions * 2,
    }));

    setItemsToDelete(items);
    setShowDeleteConfirmModal(true);
  };

  const performDeletion = async () => {
    setIsDeletingCustom(true);

    try {
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      for (const item of itemsToDelete) {
        try {
          await formsService.deleteForm(item.id);
          successCount++;
        } catch (error: any) {
          console.error(`Failed to delete form ${item.id}:`, error);
          failCount++;
          errors.push(`${item.name}: ${error.message}`);
        }
      }

      if (successCount === itemsToDelete.length) {
        toast.success(
          `${successCount} Form${
            successCount > 1 ? 's' : ''
          } Permanently Deleted`,
          {
            description:
              'Successfully removed all forms, submissions, and associated files',
            duration: 2000,
          }
        );
      } else if (successCount > 0) {
        toast.warning('Partial Success', {
          description: `${successCount} forms deleted, ${failCount} failed. Check console for details.`,
          duration: 10000,
        });
      } else {
        toast.error('All Deletions Failed', {
          description: `Failed to delete any of the ${itemsToDelete.length} forms. Please try again.`,
          duration: 10000,
        });
      }

      if (itemsToDelete.length > 1) {
        setSelectedForms([]);
      }
      triggerRefetch();
    } catch (error: any) {
      toast.error('Deletion Error', {
        description: error.message || 'An unexpected error occurred',
        duration: 3000,
      });
    } finally {
      setIsDeletingCustom(false);
      setShowDeleteConfirmModal(false);
      setItemsToDelete([]);
    }
  };

  const triggerRefetch = useCallback(() => {
    if (onFormAction) {
      onFormAction();
    }
  }, [onFormAction]);

  const handleSubmissionsClick = (e: React.MouseEvent, formId: string) => {
    e.stopPropagation();
    router.push(`/build/${formId}/submissions`);
  };

  const handleRenameStart = (formId: string, currentName: string) => {
    setRenamingFormId(formId);
    setRenameValue(currentName);
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
      dispatch(
        renameFormOptimistic({
          formId: renamingFormId,
          newName: renameValue.trim(),
        })
      );

      await dispatch(
        renameFormAsync({
          formId: renamingFormId,
          newName: renameValue.trim(),
        }) as any
      ).unwrap();

      toast.success('Form renamed successfully');
      triggerRefetch();

      setRenamingFormId(null);
      setRenameValue('');
    } catch {
      toast.error('Failed to rename form');
      triggerRefetch();
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

  const handleFormClick = useCallback(
    (e: React.MouseEvent, formId: string) => {
      e.stopPropagation();

      if (renamingFormId) return;

      if (clickedFormId === formId && clickTimeoutRef.current) {
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
        setSelectedForms(prev =>
          prev.includes(formId)
            ? prev.filter(id => id !== formId)
            : [...prev, formId]
        );

        setClickedFormId(null);
        clickTimeoutRef.current = null;
      }, 200);
    },
    [clickedFormId, router, renamingFormId]
  );

  React.useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

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

  const handleCheckboxClick = (e: React.MouseEvent, formId: string) => {
    e.stopPropagation();
    setSelectedForms(prev =>
      prev.includes(formId)
        ? prev.filter(id => id !== formId)
        : [...prev, formId]
    );
  };

  const handleToggleFavorite = async (e: React.MouseEvent, formId: string) => {
    e.stopPropagation();

    dispatch(toggleFavoriteOptimistic(formId));

    try {
      await dispatch(toggleFormFavorite(formId) as any).unwrap();
      toast.success('Form favorite status updated');
      if (activeSection === 'Favorites') {
        triggerRefetch();
      }
    } catch {
      dispatch(toggleFormFavorite(formId) as any);
      toast.error('Failed to update favorite status');
    }
  };

  const handleFormAction = async (action: string, formId: string) => {
    try {
      switch (action) {
        case 'Edit':
          router.push(`/build/${formId}`);
          break;

        case 'View':
          window.open(`/form/${formId}`, '_blank');
          break;

        case 'Settings':
          router.push(`/build/${formId}/settings`);
          break;

        case 'Publish Form':
          router.push(`/build/${formId}/publish`);
          break;

        case 'Move to Trash':
          await dispatch(trashFormAsync(formId) as any).unwrap();
          toast.success('Form moved to Trash');
          triggerRefetch();
          break;

        case 'Archive':
          await dispatch(archiveFormAsync(formId) as any).unwrap();
          toast.success('Form archived');
          triggerRefetch();
          break;

        case 'Restore':
          await dispatch(restoreFormAsync(formId) as any).unwrap();
          toast.success('Form restored');
          triggerRefetch();
          break;

        case 'Delete Permanently':
          await handleDeleteFormPermanently(formId);
          return;

        case 'Add Label':
        case 'Manage Labels':
          setShowLabelDialog(true);
          setSelectedForms([formId]);
          setLabelOperations({});
          return;

        case 'Rename':
          const form = forms.find(f => f.id === formId);
          if (form) {
            handleRenameStart(formId, form.name);
          }
          return;

        default:
          toast.success(`${action} action triggered for form`);
          return;
      }

      if (selectedForms.includes(formId)) {
        setSelectedForms(prev => prev.filter(id => id !== formId));
      }
    } catch (error: any) {
      console.error('Action failed:', error);
      toast.error(`Failed to ${action.toLowerCase()}`, {
        description: error.message || 'An unexpected error occurred',
        duration: 3000,
      });
    }
  };

  const handleBulkAction = async (action: string) => {
    try {
      switch (action) {
        case 'Move to Trash':
          await dispatch(bulkTrashFormsAsync(selectedForms) as any).unwrap();
          toast.success(`${selectedForms.length} forms moved to Trash`);
          triggerRefetch();
          break;

        case 'Archive':
          await dispatch(bulkArchiveFormsAsync(selectedForms) as any).unwrap();
          toast.success(`${selectedForms.length} forms archived`);
          triggerRefetch();
          break;

        case 'Restore':
          for (const formId of selectedForms) {
            await dispatch(restoreFormAsync(formId) as any).unwrap();
          }
          toast.success(`${selectedForms.length} forms restored`);
          triggerRefetch();
          break;

        case 'Delete Permanently':
          await handleBulkDeleteForms();
          return;

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
    } catch (error: any) {
      toast.error(`Bulk ${action.toLowerCase()} failed`, {
        description: error.message || 'An unexpected error occurred',
        duration: 3000,
      });
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

      triggerRefetch();
    } catch {
      toast.error('Failed to update labels');
    }
  };

  const handleSelectAll = () => {
    const allIds = forms.map(form => form.id);
    setSelectedForms(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedForms([]);
  };

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

  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

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
      {/* Show deletion progress if active */}
      {isDeleting && progress && (
        <div className='bg-blue-50 border border-blue-200 rounded-md p-3 mb-4'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-blue-900'>
              Deleting forms... ({progress.completed + (progress.failed || 0)}/
              {progress.total})
            </span>
            <div className='text-xs text-blue-700'>
              {progress.current && `Current: ${progress.current}`}
            </div>
          </div>
          <div className='mt-2 bg-blue-200 rounded-full h-2'>
            <div
              className='bg-blue-600 h-2 rounded-full transition-all duration-300'
              style={{
                width: `${
                  ((progress.completed + (progress.failed || 0)) /
                    progress.total) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Selection Actions Bar */}
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
          <span className='text-gray-500'>No forms found in this section.</span>
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
                  <div className='font-medium text-sm truncate'>
                    {form.name}
                  </div>
                )}
                <div className='text-xs text-gray-500 truncate flex items-center gap-1'>
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
                          onClick={() =>
                            handleFormAction('Delete Permanently', form.id)
                          }
                          disabled={isDeleting}
                          className={`text-red-600 border-gray-300 hover:bg-red-50 ${
                            isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className='mr-2 h-4 w-4' />
                              Delete Permanently
                            </>
                          )}
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
              <div className='text-center text-gray-500'>
                No labels available. Create a label first.
              </div>
            ) : (
              <div className='grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2'>
                {labels.map(label => {
                  const allHaveLabel = allFormsHaveLabel(label.id);
                  const someHaveLabel = anyFormsHaveLabel(label.id);

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

      {/* Custom Deletion Confirmation Modal -  VERSION */}
      <AlertDialog
        open={showDeleteConfirmModal}
        onOpenChange={setShowDeleteConfirmModal}
      >
        <AlertDialogContent className='max-w-2xl bg-white text-gray-900'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-red-600 font-bold flex items-center gap-2 text-xl'>
              <AlertTriangle className='w-6 h-6' />
              Permanent Deletion Warning
            </AlertDialogTitle>
          </AlertDialogHeader>

          {/* : Use a separate container instead of AlertDialogDescription to avoid nesting issues */}
          <div className='text-gray-700 space-y-4 px-6'>
            <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
              <span className='font-semibold text-red-800 mb-3 flex items-center gap-2'>
                <AlertTriangle className='w-4 h-4' />
                This will permanently delete:
              </span>

              {/* Impact Summary */}
              <div className='bg-yellow-50 border border-yellow-200 rounded p-3'>
                <span className='font-medium text-yellow-800 mb-2 flex items-center gap-1'>
                  📊 Deletion Impact:
                </span>
                <div className='text-sm text-yellow-700 space-y-1 mt-2'>
                  <span className='block'>
                    • {itemsToDelete.length} form
                    {itemsToDelete.length > 1 ? 's' : ''}
                  </span>
                  <span className='block'>
                    •{' '}
                    {itemsToDelete.reduce(
                      (sum, item) => sum + item.submissions,
                      0
                    )}{' '}
                    total submission
                    {itemsToDelete.reduce(
                      (sum, item) => sum + item.submissions,
                      0
                    ) !== 1
                      ? 's'
                      : ''}
                  </span>
                  <span className='block'>
                    • {itemsToDelete.reduce((sum, item) => sum + item.files, 0)}{' '}
                    estimated file
                    {itemsToDelete.reduce(
                      (sum, item) => sum + item.files,
                      0
                    ) !== 1
                      ? 's'
                      : ''}{' '}
                    from cloud storage
                  </span>
                  <span className='block'>• All form logos and assets</span>
                </div>
              </div>
            </div>

            <div className='bg-gray-100 border-l-4 border-red-500 p-4'>
              <span className='font-bold text-red-700 flex items-center gap-2'>
                <XCircle className='w-5 h-5' />
                THIS ACTION CANNOT BE UNDONE
              </span>
              <span className='text-gray-700 mt-2 block'>
                All data will be permanently removed from our servers and cannot
                be recovered.
              </span>
            </div>

            <span className='text-center font-medium text-gray-900 block'>
              Are you sure you want to permanently delete{' '}
              {itemsToDelete.length > 1 ? 'these forms' : 'this form'}?
            </span>
          </div>

          <AlertDialogFooter className='gap-3'>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteConfirmModal(false);
                setItemsToDelete([]);
              }}
              disabled={isDeletingCustom}
              className='border-gray-300 hover:bg-gray-50 px-6'
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={performDeletion}
              disabled={isDeletingCustom}
              className='bg-red-600 hover:bg-red-700 text-white px-6'
            >
              {isDeletingCustom ? (
                <span className='flex items-center gap-2'>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  Deleting...
                </span>
              ) : (
                <span className='flex items-center gap-2'>
                  <Trash2 className='w-4 h-4' />
                  Delete Permanently
                </span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FormsList;
