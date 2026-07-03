'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MoreVertical,
  ChevronDown,
  Circle,
  Tag,
  Edit,
  Trash,
  Search,
  X,
  Star,
  FileEdit,
  Archive,
  Trash2,
  Loader2,
  LayoutGrid,
} from 'lucide-react';

// Import UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Import Redux actions and selectors
import {
  selectLabels,
  Label,
  createLabelAsync,
  updateLabelAsync,
  deleteLabelAsync,
  selectLabelsLoading,
  selectLabelsError,
  clearLabelsError,
  fetchLabels,
} from '@/redux/slices/dashboard/formsSlice';

// Import utility for class name merging
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Interface for sidebar props
interface SidebarProps {
  onSectionChange?: (section: string, data?: Label | undefined) => void;
  activeTab?: string;
}

const Sidebar = ({ onSectionChange }: SidebarProps = {}) => {
  const dispatch = useDispatch();
  const labels = useSelector(selectLabels);
  const labelsLoading = useSelector(selectLabelsLoading);
  const labelsError = useSelector(selectLabelsError);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('All');
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [editLabelId, setEditLabelId] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Color options for labels
  const colorOptions = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#6366F1', // Indigo
    '#F97316', // Orange
    '#14B8A6', // Teal
  ];

  useEffect(() => {
    if (debouncedSearchTerm.trim()) {
      dispatch(fetchLabels(debouncedSearchTerm) as any);
    } else {
      dispatch(fetchLabels() as any);
    }
  }, [debouncedSearchTerm, dispatch]);

  // Clear label fetch errors silently (background fetch, no toast needed)
  useEffect(() => {
    if (labelsError) {
      console.error('Failed to fetch labels:', labelsError);
      dispatch(clearLabelsError());
    }
  }, [labelsError, dispatch]);

  // Handle tab change and pass to parent if callback exists
  const handleTabChange = (tab: string, data?: Label | undefined) => {
    setActiveTab(tab);
    if (onSectionChange) {
      onSectionChange(tab, data);
    }
  };

  const handleCreateClick = () => {
    router.push('/dashboard?modal=create');
  };

  // Handle search input change
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchTerm(value);
    },
    []
  );

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  // Handle create/edit label form submission
  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newLabelName.trim()) {
      toast.error('Label name required', {
        description: 'Please enter a name for your label',
      });
      return;
    }

    if (
      labels.some(
        label =>
          label.name.toLowerCase() === newLabelName.toLowerCase() &&
          (!editLabelId || label.id !== editLabelId)
      )
    ) {
      toast.error('Label already exists', {
        description: 'A label with this name already exists',
      });
      return;
    }

    setIsCreatingLabel(true);

    try {
      if (editLabelId) {
        await dispatch(
          updateLabelAsync({
            id: editLabelId,
            data: {
              name: newLabelName,
              color: selectedColor,
            },
          }) as any
        ).unwrap();

        toast.success('Label updated', {
          description: `"${newLabelName}" has been updated successfully`,
        });
      } else {
        await dispatch(
          createLabelAsync({
            name: newLabelName,
            color: selectedColor,
          }) as any
        ).unwrap();

        toast.success('Label created', {
          description: `"${newLabelName}" has been created successfully`,
        });
      }

      setNewLabelName('');
      setSelectedColor('#3B82F6');
      setEditLabelId(null);
      setShowLabelModal(false);
      dispatch(fetchLabels(debouncedSearchTerm || undefined) as any);
    } catch (error: any) {
      toast.error(
        editLabelId ? 'Failed to update label' : 'Failed to create label',
        {
          description: error.message || 'Please try again',
        }
      );
    } finally {
      setIsCreatingLabel(false);
    }
  };

  // Handle delete label
  const handleDeleteLabel = async (id: string, name: string) => {
    try {
      await dispatch(deleteLabelAsync(id) as any).unwrap();

      if (activeTab === `label-${id}`) {
        handleTabChange('All');
      }

      toast.success('Label deleted', {
        description: `"${name}" has been removed`,
      });

      dispatch(fetchLabels(debouncedSearchTerm || undefined) as any);
    } catch (error: any) {
      toast.error('Failed to delete label', {
        description: error.message || 'Please try again',
      });
    }
  };

  // Handle edit label
  const handleEditLabel = (label: Label) => {
    setNewLabelName(label.name);
    setSelectedColor(label.color);
    setEditLabelId(label.id);
    setShowLabelModal(true);
  };

  return (
    <motion.div
      initial={{ x: -280, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{
        duration: 0.08,
        ease: 'easeOut',
      }}
      className='w-70 bg-[#F3F3FE] border-r border-gray-200 overflow-y-auto h-full'
    >
      {/* Create button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.15,
          delay: 0.05,
          ease: 'easeOut',
        }}
        className='p-4 bg-white sticky top-0 z-10'
        id='create-button'
      >
        <div className='relative cursor-pointer'>
          <Button
            className='w-full bg-[#ff6100] hover:bg-[#E65700] text-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer'
            onClick={handleCreateClick}
          >
            <Plus className='h-3 w-3' />
            <span className='font-semibold'>CREATE</span>
          </Button>
        </div>
      </motion.div>

      <div className='border-t border-gray-200'></div>

      {/* My Workspace section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.15,
          delay: 0.08,
          ease: 'easeOut',
        }}
        className='px-4 py-2'
      >
        <div className='flex justify-between items-center mb-2'>
          <p className='text-sm text-gray-600'>My Workspace</p>
        </div>

        <div
          className={cn(
            `flex items-center p-3 rounded-md cursor-pointer transition-all duration-200`,
            activeTab === 'All' ? 'bg-[#C8CEED]' : 'hover:bg-[#DADEF3]'
          )}
          onClick={() => handleTabChange('All')}
        >
          <LayoutGrid className='mr-3 h-4 w-4' />
          <span className='text-sm'>All</span>
        </div>

        <div className='border-t border-gray-200 mt-6'></div>

        {/* Labels section with toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className='mt-4'
        >
          <motion.div
            whileHover={{ backgroundColor: '#f8f9fa' }}
            className='flex items-center justify-between mb-1 cursor-pointer px-1 rounded'
            onClick={() => setShowLabels(!showLabels)}
          >
            <div className='flex items-center'>
              <motion.div
                animate={{ rotate: showLabels ? 0 : -90 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className='h-4 w-4 text-gray-500 mr-1' />
              </motion.div>
              <p className='text-sm text-gray-600'>Labels</p>
              {labelsLoading && (
                <Loader2 className='h-3 w-3 text-gray-400 ml-2 animate-spin' />
              )}
            </div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant='ghost'
                size='icon'
                className='h-6 w-6 p-0 hover:bg-gray-200 rounded-full cursor-pointer'
                onClick={e => {
                  e.stopPropagation();
                  setShowLabelModal(true);
                }}
              >
                <Plus className='h-3.5 w-3.5 text-gray-500' />
              </Button>
            </motion.div>
          </motion.div>

          {/* Labels list */}
          <AnimatePresence>
            {showLabels && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Search input - only shown when there are multiple labels */}
                {labels.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    className='mb-2 px-2 flex items-center'
                  >
                    <div className='relative'>
                      <Search className='absolute left-2 top-2.5 h-4 w-4 text-gray-400' />
                      <Input
                        ref={searchInputRef}
                        type='text'
                        placeholder='Search labels...'
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className='h-8 py-1 pl-8 pr-8 text-xs focus-visible:ring-1'
                      />
                      {searchTerm && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.1 }}
                        >
                          <Button
                            variant='ghost'
                            size='icon'
                            className='absolute right-1 top-1 h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-transparent cursor-pointer'
                            onClick={handleClearSearch}
                          >
                            <X className='h-3 w-3' />
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Labels list */}
                <div
                  className={`mb-2 max-h-[40vh] overflow-y-auto custom-scrollbar ${
                    labels.length > 8 ? 'pr-1' : ''
                  }`}
                >
                  {/* Loading state */}
                  {labelsLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className='px-3 py-2 text-xs text-gray-500 text-center'
                    >
                      {searchTerm ? 'Searching labels...' : 'Loading labels...'}
                    </motion.div>
                  )}

                  {/* No labels found for search */}
                  {!labelsLoading && labels.length === 0 && searchTerm && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='px-3 py-2 text-xs text-gray-500 text-center'
                    >
                      <p>No labels found for &quot;{searchTerm}&quot;</p>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='mt-1 h-6 text-xs text-blue-600 hover:text-blue-700 cursor-pointer'
                        onClick={handleClearSearch}
                      >
                        Clear search
                      </Button>
                    </motion.div>
                  )}

                  {/* Create label option when no labels exist */}
                  {!labelsLoading && labels.length === 0 && !searchTerm && (
                    <div
                      className='p-3 rounded-md cursor-pointer transition-all duration-200 hover:bg-[#f3f4f6]'
                      onClick={() => setShowLabelModal(true)}
                    >
                      <div className='flex items-center'>
                        <Tag className='mr-3 h-4 w-4 text-gray-500' />
                        <span className='text-sm text-gray-600'>
                          Create a label
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Label items */}
                  {!labelsLoading &&
                    labels.map((label, index) => (
                      <motion.div
                        key={label.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={cn(
                          'group flex items-center justify-between p-3 rounded-md cursor-pointer transition-all duration-200 my-0.5',
                          activeTab === `label-${label.id}`
                            ? 'bg-[#C8CEED]'
                            : 'hover:bg-[#DADEF3]'
                        )}
                        onClick={() =>
                          handleTabChange(`label-${label.id}`, label)
                        }
                      >
                        <div className='flex items-center overflow-hidden'>
                          <Circle
                            className='mr-3 h-4 w-4 flex-shrink-0'
                            fill={label.color}
                            color={label.color}
                          />
                          <span className='text-sm truncate'>{label.name}</span>
                        </div>

                        {/* Label actions */}
                        <div className='flex items-center opacity-0 group-hover:opacity-100 transition-opacity'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='h-6 w-6 p-0 hover:bg-gray-200 cursor-pointer'
                                  onClick={e => e.stopPropagation()}
                                >
                                  <MoreVertical className='h-3 w-3 text-gray-500' />
                                </Button>
                              </motion.div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align='end'
                              className='w-35 bg-[#102035] text-white font-bold'
                            >
                              <DropdownMenuItem
                                onClick={e => {
                                  e.stopPropagation();
                                  handleEditLabel(label);
                                }}
                              >
                                <Edit className='mr-2 h-4 w-4' />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={e => {
                                  e.stopPropagation();
                                  handleDeleteLabel(label.id, label.name);
                                }}
                                className='text-red-600 focus:text-red-600'
                              >
                                <Trash className='mr-2 h-4 w-4' />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      <div className='border-t border-gray-200 my-2 mx-4'></div>

      {/* Essential options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className='px-4 py-2 space-y-1'
      >
        {[
          { key: 'Favorites', icon: Star, label: 'Favorites' },
          { key: 'Drafts', icon: FileEdit, label: 'Drafts' },
          { key: 'Archive', icon: Archive, label: 'Archive' },
          { key: 'Trash', icon: Trash2, label: 'Trash' },
        ].map((item, index) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
            className={cn(
              'flex items-center p-3 rounded-md cursor-pointer transition-all duration-200',
              activeTab === item.key ? 'bg-[#C8CEED]' : 'hover:bg-[#DADEF3]'
            )}
            onClick={() => handleTabChange(item.key)}
          >
            <item.icon className='mr-3 h-4 w-4' />
            <span className='text-sm'>{item.label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Create/Edit Label Modal */}
      <AnimatePresence>
        {showLabelModal && (
          <Dialog open={showLabelModal} onOpenChange={setShowLabelModal}>
            <DialogContent className='sm:max-w-[400px] bg-[#ffffff]'>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <DialogHeader>
                  <DialogTitle className='font-semibold'>
                    {editLabelId ? 'Edit Label' : 'Create New Label'}
                  </DialogTitle>
                  <DialogDescription>
                    {editLabelId
                      ? 'Update the label details below.'
                      : 'Create a label to organize your forms.'}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateLabel} className='space-y-4 pt-2'>
                  <div className='space-y-2'>
                    <label htmlFor='label-name' className='text-sm font-medium'>
                      Label Name
                    </label>
                    <Input
                      id='label-name'
                      value={newLabelName}
                      onChange={e => setNewLabelName(e.target.value)}
                      placeholder='Enter label name'
                      className='w-full mt-1 focus-visible:ring-1'
                      autoFocus
                    />
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Label Color</label>
                    <div className='flex flex-wrap gap-2'>
                      {colorOptions.map((color, index) => (
                        <motion.button
                          key={color}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          type='button'
                          onClick={() => setSelectedColor(color)}
                          className={cn(
                            'w-6 h-6 rounded-full cursor-pointer transition-all mt-1.5 ml-1',
                            selectedColor === color
                              ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                              : 'hover:scale-110 hover:ring-1 hover:ring-offset-1 hover:ring-gray-300'
                          )}
                          style={{ backgroundColor: color }}
                          aria-label={`Select color ${color}`}
                        />
                      ))}
                    </div>
                  </div>

                  <DialogFooter className='gap-2 sm:gap-2 pt-0'>
                    <Button
                      type='button'
                      variant='outline'
                      className='cursor-pointer'
                      onClick={() => {
                        setShowLabelModal(false);
                        setNewLabelName('');
                        setSelectedColor('#3B82F6');
                        setEditLabelId(null);
                      }}
                      disabled={isCreatingLabel}
                    >
                      Cancel
                    </Button>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type='submit'
                        disabled={isCreatingLabel}
                        className={cn(
                          'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer',
                          isCreatingLabel ? 'opacity-80' : ''
                        )}
                      >
                        {isCreatingLabel ? (
                          <div className='flex items-center'>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            {editLabelId ? 'Updating...' : 'Creating...'}
                          </div>
                        ) : (
                          <>{editLabelId ? 'Update Label' : 'Create Label'}</>
                        )}
                      </Button>
                    </motion.div>
                  </DialogFooter>
                </form>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Custom scrollbar style */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
      `}</style>
    </motion.div>
  );
};

export default Sidebar;
