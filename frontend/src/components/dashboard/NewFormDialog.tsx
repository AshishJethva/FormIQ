'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { formsService } from '@/services/forms';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface NewFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewFormDialog({ isOpen, onClose }: NewFormDialogProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Form name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Form name must be at least 2 characters long';
    } else if (formData.name.length > 200) {
      newErrors.name = 'Form name cannot exceed 200 characters';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description cannot exceed 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateForm = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsCreating(true);

      const response = await formsService.createFormWithUniqueTitle({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });

      // Show appropriate success message
      if (response.data.nameChanged) {
        toast.success('Form Created Successfully! 🎉', {
          description: `Created with name "${response.data.finalName}" (original name was already taken)`,
          duration: 5000,
        });
      } else {
        toast.success('Form created successfully! 🎉', {
          description: 'Redirecting to form builder...',
        });
      }

      // Close dialog and reset form
      onClose();
      setFormData({ name: '', description: '' });
      setErrors({});

      // Navigate to form builder
      setTimeout(() => {
        router.push(`/build/${response.data.id}`);
      }, 500);
    } catch (error: any) {
      console.error('Failed to create form:', error);

      let errorMessage = 'Failed to create form';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error('Creation Failed', {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleCreateForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Create New Form</DialogTitle>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>
              Form Name <span className='text-red-500'>*</span>
            </Label>
            <Input
              id='name'
              value={formData.name}
              onChange={e => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                if (errors.name) {
                  setErrors(prev => ({ ...prev, name: undefined }));
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder='Enter form name'
              disabled={isCreating}
              maxLength={200}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className='text-sm text-red-500'>{errors.name}</p>
            )}
            <p className='text-xs text-gray-500'>
              {formData.name.length}/200 characters
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description (Optional)</Label>
            <Textarea
              id='description'
              value={formData.description}
              onChange={e => {
                setFormData(prev => ({ ...prev, description: e.target.value }));
                if (errors.description) {
                  setErrors(prev => ({ ...prev, description: undefined }));
                }
              }}
              placeholder='Describe what this form is for...'
              disabled={isCreating}
              maxLength={1000}
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className='text-sm text-red-500'>{errors.description}</p>
            )}
            <p className='text-xs text-gray-500'>
              {formData.description.length}/1000 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateForm}
            disabled={isCreating || !formData.name.trim()}
            className='cursor-pointer'
          >
            {isCreating ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Creating...
              </>
            ) : (
              'Create Form'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
