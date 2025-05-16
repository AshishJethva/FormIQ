'use client';
import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
  Plus,
  MoreVertical,
  ChevronDown,
  ChevronRight,
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
  createLabel,
  updateLabel,
  deleteLabel,
  selectLabels,
  Label,
} from '@/redux/features/formsSlice';

// Import utility for class name merging
import { cn } from '@/lib/utils';

// Interface for sidebar props
interface SidebarProps {
  onSectionChange?: (section: string, data?: Label | undefined) => void;
  activeTab?: string;
}

const Sidebar = ({ onSectionChange }: SidebarProps = {}) => {
  const dispatch = useDispatch();
  const labels = useSelector(selectLabels);

  const [activeTab, setActiveTab] = useState('All');
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3B82F6'); // Default blue
  const [editLabelId, setEditLabelId] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [showCreateActions, setShowCreateActions] = useState(false);

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

  // Close create actions dropdown when clicking outside
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        showCreateActions &&
        !(e.target as Element).closest('#create-button')
      ) {
        setShowCreateActions(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showCreateActions]);

  // Handle tab change and pass to parent if callback exists
  const handleTabChange = (tab: string, data?: Label | undefined) => {
    setActiveTab(tab);
    if (onSectionChange) {
      onSectionChange(tab, data);
    }
  };

  // Handle create/edit label form submission
  const handleCreateLabel = (e: React.FormEvent) => {
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

    // Simulate API call with timeout
    setTimeout(() => {
      if (editLabelId) {
        // Update existing label using Redux
        dispatch(
          updateLabel({
            id: editLabelId,
            name: newLabelName,
            color: selectedColor,
          })
        );

        toast.success(`Label updated`, {
          description: `"${newLabelName}" has been updated successfully`,
        });
      } else {
        // Create new label using Redux
        dispatch(
          createLabel({
            name: newLabelName,
            color: selectedColor,
          })
        );

        toast.success(`Label created`, {
          description: `"${newLabelName}" has been created successfully`,
        });
      }

      // Reset form and state
      setNewLabelName('');
      setSelectedColor('#3B82F6');
      setEditLabelId(null);
      setShowLabelModal(false);
      setIsCreatingLabel(false);
    }, 600); // Short delay for UX feedback
  };

  // Handle delete label
  const handleDeleteLabel = (id: string, name: string) => {
    dispatch(deleteLabel(id));

    // If we're currently viewing this label, switch to All
    if (activeTab === `label-${id}`) {
      handleTabChange('All');
    }

    toast.success(`Label deleted`, {
      description: `"${name}" has been removed`,
    });
  };

  // Handle edit label
  const handleEditLabel = (label: Label) => {
    setNewLabelName(label.name);
    setSelectedColor(label.color);
    setEditLabelId(label.id);
    setShowLabelModal(true);
  };

  // Filter labels based on search term
  const filteredLabels = searchTerm
    ? labels.filter(label =>
        label.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : labels;

  // Sort labels by newest first
  const sortedLabels = [...filteredLabels].sort(
    (a, b) => b.createdAt - a.createdAt
  );

  return (
    <div className='w-64 bg-[#F6F8FA] border-r border-gray-200 overflow-y-auto'>
      {/* Create button */}
      <div className='p-4' id='create-button'>
        <div className='relative'>
          <Button
            className='w-full bg-[#ff6100] hover:bg-[#E65700] text-white shadow-sm hover:shadow-md transition-all duration-200'
            onClick={() => setShowCreateActions(!showCreateActions)}
          >
            <Plus className='mr-2 h-4 w-4' /> CREATE
          </Button>

          {/* Create Actions Dropdown */}
          {showCreateActions && (
            <div className='absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10'>
              <div className='py-1'>
                <button
                  className='flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors'
                  onClick={() => {
                    setShowCreateActions(false);
                    handleTabChange('CreateForm');
                    toast.success('Create a new form');
                  }}
                >
                  <Tag className='h-4 w-4 mr-2 text-blue-500' />
                  New Form
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* My Workspace section */}
      <div className='px-4 py-2'>
        <div className='flex justify-between items-center mb-2'>
          <p className='text-sm text-gray-600'>My Workspace</p>
        </div>

        <div
          className={cn(
            `flex items-center p-3 rounded-md cursor-pointer transition-colors`,
            activeTab === 'All' ? 'bg-blue-100' : 'hover:bg-gray-100'
          )}
          onClick={() => handleTabChange('All')}
        >
          <LayoutGrid className='mr-3 h-4 w-4' />
          <span className='text-sm'>All</span>
        </div>

        {/* Labels section with toggle */}
        <div className='mt-4'>
          <div
            className='flex items-center justify-between mb-1 cursor-pointer px-1'
            onClick={() => setShowLabels(!showLabels)}
          >
            <div className='flex items-center'>
              {showLabels ? (
                <ChevronDown className='h-4 w-4 text-gray-500 mr-1' />
              ) : (
                <ChevronRight className='h-4 w-4 text-gray-500 mr-1' />
              )}
              <p className='text-sm text-gray-600'>Labels</p>
            </div>
            <Button
              variant='ghost'
              size='icon'
              className='h-6 w-6 p-0 hover:bg-gray-200 rounded-full'
              onClick={e => {
                e.stopPropagation();
                setShowLabelModal(true);
              }}
            >
              <Plus className='h-3.5 w-3.5 text-gray-500' />
            </Button>
          </div>

          {/* Labels list */}
          {showLabels && (
            <>
              {/* Search input - only shown when there are multiple labels */}
              {labels.length > 3 && (
                <div className='mb-2 px-2 flex items-center'>
                  <div className='relative'>
                    <Search className='absolute left-2 top-2.5 h-4 w-4 text-gray-400 ' />
                    <Input
                      ref={searchInputRef}
                      type='text'
                      placeholder='Search labels...'
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className='h-8 py-1 pl-8 pr-8 text-xs focus-visible:ring-1'
                    />
                    {searchTerm && (
                      <Button
                        variant='ghost'
                        size='icon'
                        className='absolute right-1 top-1 h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-transparent'
                        onClick={() => setSearchTerm('')}
                      >
                        <X className='h-3 w-3' />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Labels list */}
              <div
                className={`mb-2 max-h-[40vh] overflow-y-auto custom-scrollbar ${
                  filteredLabels.length > 8 ? 'pr-1' : ''
                }`}
              >
                {/* No labels message */}
                {filteredLabels.length === 0 && searchTerm && (
                  <div className='px-3 py-2 text-xs text-gray-500 text-center'>
                    No labels found
                  </div>
                )}

                {/* Create label option when no labels exist */}
                {labels.length === 0 && !searchTerm && (
                  <div
                    className='p-3 rounded-md cursor-pointer hover:bg-gray-100 transition-colors'
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
                {sortedLabels.map(label => (
                  <div
                    key={label.id}
                    className={cn(
                      'group flex items-center justify-between p-3 rounded-md cursor-pointer transition-all my-0.5',
                      activeTab === `label-${label.id}`
                        ? 'bg-blue-100'
                        : 'hover:bg-gray-100'
                    )}
                    onClick={() => handleTabChange(`label-${label.id}`, label)}
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
                    <div className='flex items-center opacity-0 group-hover:opacity-100 transition-opacity '>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-6 w-6 p-0 hover:bg-gray-200'
                            onClick={e => e.stopPropagation()}
                          >
                            <MoreVertical className='h-3 w-3 text-gray-500' />
                          </Button>
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
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className='border-t border-gray-200 my-2'></div>

      {/* Essential options */}
      <div className='px-4 py-2 space-y-1'>
        <div
          className={cn(
            'flex items-center p-3 rounded-md cursor-pointer transition-colors',
            activeTab === 'Favorites' ? 'bg-blue-100' : 'hover:bg-gray-100'
          )}
          onClick={() => handleTabChange('Favorites')}
        >
          <Star className='mr-3 h-4 w-4' />
          <span className='text-sm'>Favorites</span>
        </div>

        <div
          className={cn(
            'flex items-center p-3 rounded-md cursor-pointer transition-colors',
            activeTab === 'Drafts' ? 'bg-blue-100' : 'hover:bg-gray-100'
          )}
          onClick={() => handleTabChange('Drafts')}
        >
          <FileEdit className='mr-3 h-4 w-4' />
          <span className='text-sm'>Drafts</span>
        </div>

        <div
          className={cn(
            'flex items-center p-3 rounded-md cursor-pointer transition-colors',
            activeTab === 'Archive' ? 'bg-blue-100' : 'hover:bg-gray-100'
          )}
          onClick={() => handleTabChange('Archive')}
        >
          <Archive className='mr-3 h-4 w-4' />
          <span className='text-sm'>Archive</span>
        </div>

        <div
          className={cn(
            'flex items-center p-3 rounded-md cursor-pointer transition-colors',
            activeTab === 'Trash' ? 'bg-blue-100' : 'hover:bg-gray-100'
          )}
          onClick={() => handleTabChange('Trash')}
        >
          <Trash2 className='mr-3 h-4 w-4' />
          <span className='text-sm'>Trash</span>
        </div>
      </div>

      {/* Create/Edit Label Modal */}
      <Dialog open={showLabelModal} onOpenChange={setShowLabelModal}>
        <DialogContent className='sm:max-w-[400px] bg-[#ffffff]'>
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
                {colorOptions.map(color => (
                  <button
                    key={color}
                    type='button'
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      'w-6 h-6 rounded-full cursor-pointer transition-all mt-1.5 ml-1',
                      selectedColor === color
                        ? 'ring-2 ring-offset-2 ring-blue-500 scale-100'
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
              <Button
                type='submit'
                disabled={isCreatingLabel}
                className={cn(
                  'bg-blue-600 hover:bg-blue-700 text-white',
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
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
    </div>
  );
};

export default Sidebar;
