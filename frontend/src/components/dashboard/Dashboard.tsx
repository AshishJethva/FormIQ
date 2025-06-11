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
  CreditCard,
  Zap,
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

// Import user profile selectors
import {
  fetchUserProfile,
  selectUserProfile,
  incrementFormsUsed,
} from '@/redux/slices/userProfile/userProfileSlice';

// Import UI components
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useFormData } from '@/hooks/useFormData';

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
  const userProfile = useSelector(selectUserProfile);

  // Local state for UI
  const [activeSection, setActiveSection] = useState('All');
  const [activeSectionData, setActiveSectionData] = useState<Label | null>(
    null
  );
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isCreatingForm, setIsCreatingForm] = useState(false);

  // Get plan information
  const canCreateForms = userProfile?.profile.plan.canCreateForms ?? true;
  const formsUsed = userProfile?.profile.plan.formsUsed ?? 0;
  const formsLimit = userProfile?.profile.plan.formsLimit ?? 5;
  const planType = userProfile?.profile.plan.type ?? 'STARTER';
  const remainingForms = formsLimit - formsUsed;

  useEffect(() => {
    // Re-fetch user profile when component mounts or when forms change
    dispatch(fetchUserProfile());
  }, [dispatch, forms.length]); // Re-fetch when forms count changes

  // Single function to fetch forms for current section
  const fetchFormsForCurrentSection = useCallback(() => {
    let filters: any = {};

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

          // Ensure labelId is valid
          if (labelId && labelId.trim()) {
            filters = {
              labels: [labelId.trim()],
              status: 'all',
            };
            console.log(' Created filters for label:', filters);
          } else {
            console.error('Invalid label ID extracted:', labelId);
            filters = { status: 'all' };
          }
        } else {
          filters = { status: 'all' };
        }
    }

    dispatch(fetchForms(filters) as any);
  }, [activeSection, dispatch]);

  // Combined form creation with limit checking and user-friendly messages
  const handleCreateForm = async () => {
    if (!formName.trim()) {
      toast.error('Form name is required');
      return;
    }

    // Get fresh user profile data before creating
    await dispatch(fetchUserProfile());
    const currentProfile = userProfile;
    const canCreate = currentProfile?.profile.plan.canCreateForms ?? true;
    const planType = currentProfile?.profile.plan.type ?? 'STARTER';
    const formsLimit = currentProfile?.profile.plan.formsLimit ?? 5;
    const formsUsed = currentProfile?.profile.plan.formsUsed ?? 0;
    const remainingForms = formsLimit - formsUsed;

    // Check if user can create more forms BEFORE attempting creation
    if (!canCreate) {
      const upgradeAction = {
        label: planType === 'STARTER' ? 'Upgrade Now' : 'Manage Plan',
        onClick: () => router.push('/myaccount/upgrade'),
      };

      if (planType === 'STARTER') {
        toast.error('🚫 Form Limit Reached!', {
          description: `You've reached your ${planType} plan limit of ${formsLimit} forms. Upgrade to create unlimited forms with advanced features!`,
          action: upgradeAction,
          duration: 8000,
          icon: <CreditCard className='w-5 h-5' />,
        });
      } else {
        toast.error('📊 Form Limit Reached!', {
          description: `You've used all ${formsLimit} forms in your ${planType} plan. Upgrade for more forms or delete unused ones.`,
          action: upgradeAction,
          duration: 6000,
          icon: <AlertCircle className='w-5 h-5' />,
        });
      }
      return;
    }

    // Show warning when approaching limit (but still allow creation)
    if (remainingForms <= 2 && remainingForms > 0) {
      const isLastForm = remainingForms === 1;

      toast.warning(
        isLastForm ? '⚠️ Last Form Available!' : '⚠️ Almost at Limit!',
        {
          description: isLastForm
            ? `This will be your last form in the ${planType} plan. Consider upgrading for unlimited forms.`
            : `Only ${remainingForms} forms left in your ${planType} plan. Consider upgrading soon.`,
          action: {
            label: 'Upgrade',
            onClick: () => router.push('/myaccount/upgrade'),
          },
          duration: 2000,
          icon: <Zap className='w-5 h-5' />,
        }
      );
    }

    setIsCreatingForm(true);

    try {
      const result = await dispatch(
        createFormAsync({
          name: formName,
          description: formDescription,
        }) as any
      ).unwrap();

      // CRITICAL FIX: Update the form count immediately to prevent bad UX
      dispatch(incrementFormsUsed());

      // Success message with updated count
      const newFormsUsed = formsUsed + 1;
      const newRemainingForms = formsLimit - newFormsUsed;

      toast.success('Form Created Successfully!', {
        description: `You have ${newRemainingForms} forms remaining in your ${planType} plan.`,
        duration: 2000,
      });

      setFormName('');
      setFormDescription('');
      handleSectionChange('All');

      // Small delay to ensure state is updated before refreshing
      setTimeout(() => {
        dispatch(fetchUserProfile());
        fetchFormsForCurrentSection();
      }, 100);

      return result;
    } catch (error: any) {
      // Handle specific error cases with user-friendly messages
      if (error.includes?.('Form limit reached')) {
        const upgradeAction = {
          label: 'Upgrade Plan',
          onClick: () => router.push('/myaccount/upgrade'),
        };

        toast.error('🚫 Cannot Create Form!', {
          description: error,
          action: upgradeAction,
          duration: 6000,
          icon: <CreditCard className='w-5 h-5' />,
        });
      } else {
        toast.error('❌ Failed to Create Form', {
          description:
            error.message ||
            'Something went wrong. Please try again or contact support.',
          duration: 4000,
        });
      }
    } finally {
      setIsCreatingForm(false);
    }
  };

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
            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <PlusSquare className='h-5 w-5 text-green-500 mr-2' />
                <h1 className='text-xl font-semibold'>Create New Form</h1>
              </div>

              {/* Plan Status Indicator */}
              <div className='flex items-center space-x-3'>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    canCreateForms
                      ? remainingForms <= 2
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {canCreateForms
                    ? `${remainingForms} forms remaining`
                    : 'Form limit reached'}
                </div>
                <span
                  className={`text-xs py-1 px-3 rounded-md font-medium ${
                    planType === 'STARTER'
                      ? 'bg-gray-500 text-white'
                      : planType === 'BRONZE'
                      ? 'bg-orange-500 text-white'
                      : planType === 'SILVER'
                      ? 'bg-blue-500 text-white'
                      : 'bg-yellow-500 text-white'
                  }`}
                >
                  {planType}
                </span>
              </div>
            </div>
          </div>

          <main className='flex-1 overflow-y-auto p-6'>
            {/* Warning banner for low remaining forms */}
            {canCreateForms && remainingForms <= 2 && (
              <div
                className={`border rounded-md mb-6 p-4 flex items-center ${
                  remainingForms === 0
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : remainingForms === 1
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                <AlertCircle className='h-5 w-5 mr-2 flex-shrink-0' />
                <div className='flex-1'>
                  <p className='font-medium'>
                    {remainingForms === 0
                      ? "You've reached your form limit!"
                      : remainingForms === 1
                      ? 'This is your last available form!'
                      : "You're almost at your form limit!"}
                  </p>
                  <p className='text-sm mt-1'>
                    {remainingForms === 0
                      ? `Delete unused forms or upgrade your ${planType} plan to create more forms.`
                      : `Consider upgrading your ${planType} plan for unlimited forms and premium features.`}
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/myaccount/upgrade')}
                  size='sm'
                  className='ml-4 bg-blue-600 hover:bg-blue-700 cursor-pointer'
                >
                  {planType === 'STARTER' ? 'Upgrade Now' : 'Manage Plan'}
                </Button>
              </div>
            )}

            {/* Form limit reached banner */}
            {!canCreateForms && (
              <div className='bg-red-50 border border-red-200 rounded-md mb-6 p-4 flex items-center text-red-800'>
                <CreditCard className='h-5 w-5 mr-2 flex-shrink-0' />
                <div className='flex-1'>
                  <p className='font-medium'>Form Creation Disabled</p>
                  <p className='text-sm mt-1'>
                    You&apos;ve used all {formsLimit} forms in your {planType}{' '}
                    plan. Upgrade to continue creating forms.
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/myaccount/upgrade')}
                  size='sm'
                  className='ml-4 bg-red-600 hover:bg-red-700 cursor-pointer'
                >
                  Upgrade Plan
                </Button>
              </div>
            )}

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
                    disabled={!canCreateForms}
                    className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !canCreateForms ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
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
                    disabled={!canCreateForms}
                    className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !canCreateForms ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    rows={3}
                    placeholder='Describe your form'
                  ></textarea>
                </div>

                <div className='pt-4 flex justify-end'>
                  <Button
                    className={`text-white cursor-pointer ${
                      canCreateForms
                        ? 'bg-[#ff6100] hover:bg-[#E65700]'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    onClick={canCreateForms ? handleCreateForm : undefined}
                    disabled={
                      isCreatingForm || !formName.trim() || !canCreateForms
                    }
                  >
                    {isCreatingForm ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Creating...
                      </>
                    ) : canCreateForms ? (
                      'Create Form'
                    ) : (
                      'Form Limit Reached'
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
