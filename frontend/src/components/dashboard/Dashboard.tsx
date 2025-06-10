// src/components/dashboard/Dashboard.tsx
'use client';

import { StoreDispatch } from '@/redux/store';

import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CreateFormModal from '@/components/modals/CreateFormModal';
import { useRouter, useSearchParams } from 'next/navigation';
import { FilterBar, Navbar, FormsList, Sidebar } from '@/components/dashboard';
import {
  AlertCircle,
  FileText,
  Star,
  Archive,
  Trash2,
  Circle,
  PlusSquare,
  Loader2,
} from 'lucide-react';

// Import Redux actions and selectors
import {
  selectForms,
  Label,
  fetchLabels,
  fetchForms,
  createFormAsync,
  selectFormsLoading,
} from '@/redux/slices/dashboard/formsSlice';

// Import UI components
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useFormData } from '@/hooks/useFormData';
import { fetchUserProfile } from '@/redux/slices/userProfileSlice';

// Define CustomLabel to match the Sidebar's interface
interface CustomLabel {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  userId: string;
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch: StoreDispatch = useDispatch();

  // Use the custom hook to load data
  useFormData();

  // Check if the create modal should be shown
  const showCreateModal = searchParams.get('modal') === 'create';

  // Redux selectors
  const forms = useSelector(selectForms);
  const formsLoading = useSelector(selectFormsLoading);

  // Local state for UI
  const [activeSection, setActiveSection] = useState('All');
  const [activeSectionData, setActiveSectionData] = useState<Label | null>(
    null
  );
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isCreatingForm, setIsCreatingForm] = useState(false);

  // : Single function to fetch forms for current section
  const fetchFormsForCurrentSection = useCallback(() => {
    let filters: any = {};

    console.log(
      '🔄 fetchFormsForCurrentSection called with activeSection:',
      activeSection
    );

    switch (activeSection) {
      case 'All':
        filters = { status: 'all' };
        break;
      case 'Favorites':
        filters = { status: 'favorites' };
        break;
      case 'Drafts':
        filters = { status: 'draft' };
        break;
      case 'Archive':
        filters = { status: 'archived' };
        break;
      case 'Trash':
        filters = { status: 'trashed' };
        break;
      default:
        if (activeSection.startsWith('label-')) {
          const labelId = activeSection.replace('label-', '');

          console.log('🏷️ Processing label section:', {
            activeSection,
            extractedLabelId: labelId,
            labelIdTrimmed: labelId.trim(),
          });

          // Ensure labelId is valid
          if (labelId && labelId.trim()) {
            filters = {
              labels: [labelId.trim()],
              status: 'all',
            };
            console.log(' Created filters for label:', filters);
          } else {
            console.error('❌ Invalid label ID extracted:', labelId);
            filters = { status: 'all' };
          }
        } else {
          filters = { status: 'all' };
        }
    }

    dispatch(fetchForms(filters) as any);
  }, [activeSection, dispatch]);

  // If Escape key is pressed, close the modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCreateModal) {
        router.push('/dashboard');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCreateModal, router]);

  useEffect(() => {
    dispatch(fetchLabels() as any);
    dispatch(fetchForms({}) as any);
  }, [dispatch]);

  useEffect(() => {
    fetchFormsForCurrentSection();
  }, [activeSection, dispatch, fetchFormsForCurrentSection]);

  const handleSectionChange = (section: string, data?: CustomLabel | Label) => {
    console.log('Section changed from', activeSection, 'to', section);
    setActiveSection(section);
    setActiveSectionData(data || null);
  };

  const handleCreateForm = async () => {
    if (!formName.trim()) {
      toast.error('Form name is required');
      return;
    }

    setIsCreatingForm(true);

    try {
      await dispatch(
        createFormAsync({
          name: formName,
          description: formDescription,
        }) as any
      ).unwrap();
      await dispatch(fetchUserProfile());

      toast.success('Form created successfully');
      setFormName('');
      setFormDescription('');
      handleSectionChange('All');

      // Refresh forms list
      setTimeout(() => {
        fetchFormsForCurrentSection();
      }, 100);
    } catch (error: any) {
      toast.error('Failed to create form', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsCreatingForm(false);
    }
  };

  // Check if there are forms in the current section
  const hasFormsInSection = forms.length > 0;

  // For empty states
  const getEmptyStateContent = () => {
    switch (activeSection) {
      case 'Favorites':
        return {
          icon: <Star className='h-12 w-12 mx-auto mb-4 text-gray-300' />,
          title: 'No Favorite Forms',
          description: 'Star forms to add them to your favorites',
        };
      case 'Drafts':
        return {
          icon: <FileText className='h-12 w-12 mx-auto mb-4 text-gray-300' />,
          title: 'No Draft Forms',
          description: "Forms you haven't published yet will appear here",
        };
      case 'Archive':
        return {
          icon: <Archive className='h-12 w-12 mx-auto mb-4 text-gray-300' />,
          title: 'No Archived Forms',
          description: 'Forms you archive will appear here',
        };
      case 'Trash':
        return {
          icon: <Trash2 className='h-12 w-12 mx-auto mb-4 text-gray-300' />,
          title: 'Trash is Empty',
          description: 'Deleted forms will appear here',
        };
      default:
        if (activeSection.startsWith('label-') && activeSectionData) {
          return {
            icon: (
              <div
                className='h-12 w-12 mx-auto mb-4 rounded-full'
                style={{ backgroundColor: activeSectionData.color }}
              ></div>
            ),
            title: `No Forms with "${activeSectionData.name}" Label`,
            description: 'Forms tagged with this label will appear here',
          };
        }
        return {
          icon: <FileText className='h-12 w-12 mx-auto mb-4 text-gray-300' />,
          title: 'No Forms Found',
          description: 'Create your first form to get started',
        };
    }
  };

  const renderContent = () => {
    if (activeSection === 'CreateForm') {
      return (
        <>
          <div className='bg-white border-b border-gray-200 px-6 py-4'>
            <div className='flex items-center'>
              <PlusSquare className='h-5 w-5 text-green-500 mr-2' />
              <h1 className='text-xl font-semibold'>Create New Form</h1>
            </div>
          </div>
          <main className='flex-1 overflow-y-auto p-6'>
            <div className='bg-white border border-gray-200 rounded-md p-6 max-w-3xl mx-auto'>
              <h2 className='text-lg font-semibold mb-4'>Form Details</h2>

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Form Name
                  </label>
                  <input
                    type='text'
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Enter form name'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Description (optional)
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    rows={3}
                    placeholder='Describe your form'
                  ></textarea>
                </div>

                <div className='pt-4 flex justify-end'>
                  <Button
                    className='bg-[#ff6100] hover:bg-[#E65700] text-white cursor-pointer'
                    onClick={handleCreateForm}
                    disabled={isCreatingForm || !formName.trim()}
                  >
                    {isCreatingForm ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Creating...
                      </>
                    ) : (
                      'Create Form'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </>
      );
    }

    // Special header for Trash section
    const isTrash = activeSection === 'Trash';
    return (
      <>
        <div className='bg-white border-b border-gray-200 px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              {activeSection === 'All' ? null : activeSection ===
                'Favorites' ? (
                <Star className='h-5 w-5 text-amber-400 mr-2' />
              ) : activeSection === 'Drafts' ? (
                <FileText className='h-5 w-5 text-blue-500 mr-2' />
              ) : activeSection === 'Archive' ? (
                <Archive className='h-5 w-5 text-purple-500 mr-2' />
              ) : activeSection === 'Trash' ? (
                <Trash2 className='h-5 w-5 text-red-500 mr-2' />
              ) : activeSection.startsWith('label-') && activeSectionData ? (
                <Circle
                  className='h-5 w-5 mr-2'
                  fill={activeSectionData.color}
                  color={activeSectionData.color}
                />
              ) : null}
              <h1 className='text-xl font-semibold'>
                {activeSection === 'All'
                  ? 'All Forms'
                  : activeSection === 'Favorites'
                  ? 'Favorites'
                  : activeSection === 'Drafts'
                  ? 'Draft Forms'
                  : activeSection === 'Archive'
                  ? 'Archive'
                  : activeSection === 'Trash'
                  ? 'Trash'
                  : activeSection.startsWith('label-') && activeSectionData
                  ? activeSectionData.name
                  : 'Dashboard'}
              </h1>
            </div>
            {!isTrash && <FilterBar activeSection={activeSection} />}
            {isTrash && (
              <div className='text-sm text-gray-500'>
                Forms are permanently deleted after 30 days
              </div>
            )}
          </div>
        </div>
        <main className='flex-1 overflow-y-auto p-6'>
          {/* Warning for trash section */}
          {isTrash && (
            <div className='bg-amber-50 border border-amber-200 rounded-md mb-4 p-4 flex items-center text-amber-800'>
              <AlertCircle className='h-5 w-5 mr-2 flex-shrink-0' />
              <p>Deleted forms will be permanently removed after 30 days.</p>
            </div>
          )}

          {/* Loading state */}
          {formsLoading && (
            <div className='text-center py-12'>
              <Loader2 className='h-8 w-8 mx-auto mb-4 animate-spin text-gray-400' />
              <p className='text-gray-500'>Loading forms...</p>
            </div>
          )}

          {/* Forms list or empty state */}
          {!formsLoading &&
            (hasFormsInSection ? (
              <FormsList
                activeSection={activeSection}
                onFormAction={fetchFormsForCurrentSection}
              />
            ) : (
              <div className='text-center py-12 text-gray-500'>
                {getEmptyStateContent().icon}
                <p className='text-lg mb-2'>{getEmptyStateContent().title}</p>
                <p>{getEmptyStateContent().description}</p>
              </div>
            ))}
        </main>
      </>
    );
  };

  return (
    <div className='flex flex-col h-screen bg-gray-50'>
      <Navbar />

      <div className='flex flex-1 overflow-hidden'>
        <Sidebar onSectionChange={handleSectionChange} />

        <div className='flex-1 flex flex-col overflow-hidden'>
          {renderContent()}
        </div>
      </div>

      {showCreateModal && <CreateFormModal />}
    </div>
  );
}
