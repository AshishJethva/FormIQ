'use client';

import { StoreDispatch } from '@/redux/store';
import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CreateFormModal from '@/components/modals/CreateFormModal';
import { useRouter, useSearchParams } from 'next/navigation';
import { FilterBar, Navbar, FormsList, Sidebar } from '@/components/dashboard';
import { motion, AnimatePresence } from 'framer-motion';
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
  Menu,
  X,
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Get plan information
  const canCreateForms = userProfile?.profile.plan.canCreateForms ?? true;
  const formsUsed = userProfile?.profile.plan.formsUsed ?? 0;
  const formsLimit = userProfile?.profile.plan.formsLimit ?? 5;
  const planType = userProfile?.profile.plan.type ?? 'STARTER';
  const remainingForms = formsLimit - formsUsed;

  useEffect(() => {
    // Re-fetch user profile when component mounts or when forms change
    dispatch(fetchUserProfile());
  }, [dispatch, forms.length]);

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
          if (labelId && labelId.trim()) {
            filters = {
              labels: [labelId.trim()],
              status: 'all',
            };
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

    // Check if user can create more forms BEFORE attempting creation
    if (!canCreate) {
      const upgradeAction = {
        label: planType === 'STARTER' ? 'Upgrade Now' : 'Manage Plan',
        onClick: () => router.push('/myaccount/upgrade'),
      };

      if (planType === 'STARTER') {
        toast.error('Form Limit Reached!', {
          description: `You've reached your ${planType} plan limit of ${formsLimit} forms. Upgrade to create unlimited forms with advanced features!`,
          action: upgradeAction,
          duration: 8000,
          icon: <CreditCard className='w-5 h-5' />,
        });
      } else {
        toast.error('Form Limit Reached!', {
          description: `You've used all ${formsLimit} forms in your ${planType} plan. Upgrade for more forms or delete unused ones.`,
          action: upgradeAction,
          duration: 6000,
          icon: <AlertCircle className='w-5 h-5' />,
        });
      }
      return;
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

        toast.error('Cannot Create Form!', {
          description: error,
          action: upgradeAction,
          duration: 6000,
          icon: <CreditCard className='w-5 h-5' />,
        });
      } else {
        toast.error('Failed to Create Form', {
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
    setActiveSection(section);
    setActiveSectionData(data || null);
    // Close mobile sidebar when section changes
    setIsMobileSidebarOpen(false);
  };

  // Check if there are forms in the current section
  const hasFormsInSection = forms.length > 0;

  // For empty states
  const getEmptyStateContent = () => {
    switch (activeSection) {
      case 'Favorites':
        return {
          icon: (
            <Star className='h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-300' />
          ),
          title: 'No Favorite Forms',
          description: 'Star forms to add them to your favorites',
        };
      case 'Drafts':
        return {
          icon: (
            <FileText className='h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-300' />
          ),
          title: 'No Draft Forms',
          description: "Forms you haven't published yet will appear here",
        };
      case 'Archive':
        return {
          icon: (
            <Archive className='h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-300' />
          ),
          title: 'No Archived Forms',
          description: 'Forms you archive will appear here',
        };
      case 'Trash':
        return {
          icon: (
            <Trash2 className='h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-300' />
          ),
          title: 'Trash is Empty',
          description: 'Deleted forms will appear here',
        };
      default:
        if (activeSection.startsWith('label-') && activeSectionData) {
          return {
            icon: (
              <div
                className='h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 rounded-full'
                style={{ backgroundColor: activeSectionData.color }}
              ></div>
            ),
            title: `No Forms with "${activeSectionData.name}" Label`,
            description: 'Forms tagged with this label will appear here',
          };
        }
        return {
          icon: (
            <FileText className='h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-300' />
          ),
          title: 'No Forms Found',
          description: 'Create your first form to get started',
        };
    }
  };

  const renderContent = () => {
    if (activeSection === 'CreateForm') {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className='flex-1 flex flex-col overflow-hidden'
        >
          <div className='bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
              <div className='flex items-center'>
                <PlusSquare className='h-5 w-5 text-green-500 mr-2' />
                <h1 className='text-lg sm:text-xl font-semibold'>
                  Create New Form
                </h1>
              </div>

              {/* Plan Status Indicator */}
              <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3'>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium text-center ${
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
                  className={`text-xs py-1 px-3 rounded-md font-medium text-center ${
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

          <main className='flex-1 overflow-y-auto p-4 sm:p-6'>
            {/* Warning banner for low remaining forms */}
            {canCreateForms && remainingForms <= 2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`border rounded-lg mb-4 sm:mb-6 p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
                  remainingForms === 0
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : remainingForms === 1
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                <AlertCircle className='h-5 w-5 flex-shrink-0' />
                <div className='flex-1'>
                  <p className='font-medium text-sm sm:text-base'>
                    {remainingForms === 0
                      ? "You've reached your form limit!"
                      : remainingForms === 1
                      ? 'This is your last available form!'
                      : "You're almost at your form limit!"}
                  </p>
                  <p className='text-xs sm:text-sm mt-1'>
                    {remainingForms === 0
                      ? `Delete unused forms or upgrade your ${planType} plan to create more forms.`
                      : `Consider upgrading your ${planType} plan for unlimited forms and premium features.`}
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/myaccount/upgrade')}
                  size='sm'
                  className='bg-blue-600 hover:bg-blue-700 cursor-pointer w-full sm:w-auto'
                >
                  {planType === 'STARTER' ? 'Upgrade Now' : 'Manage Plan'}
                </Button>
              </motion.div>
            )}

            {/* Form limit reached banner */}
            {!canCreateForms && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className='bg-red-50 border border-red-200 rounded-lg mb-4 sm:mb-6 p-4 flex flex-col sm:flex-row sm:items-center gap-3 text-red-800'
              >
                <CreditCard className='h-5 w-5 flex-shrink-0' />
                <div className='flex-1'>
                  <p className='font-medium text-sm sm:text-base'>
                    Form Creation Disabled
                  </p>
                  <p className='text-xs sm:text-sm mt-1'>
                    You&apos;ve used all {formsLimit} forms in your {planType}{' '}
                    plan. Upgrade to continue creating forms.
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/myaccount/upgrade')}
                  size='sm'
                  className='bg-red-600 hover:bg-red-700 cursor-pointer w-full sm:w-auto'
                >
                  Upgrade Plan
                </Button>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className='bg-white border border-gray-200 rounded-lg p-4 sm:p-6 max-w-3xl mx-auto shadow-sm'
            >
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
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
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
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      !canCreateForms ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    rows={3}
                    placeholder='Describe your form'
                  ></textarea>
                </div>

                <div className='pt-4 flex justify-end'>
                  <Button
                    className={`text-white cursor-pointer w-full sm:w-auto ${
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
            </motion.div>
          </main>
        </motion.div>
      );
    }

    // Special header for Trash section
    const isTrash = activeSection === 'Trash';
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className='flex-1 flex flex-col overflow-hidden'
      >
        <div className='bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
            <div className='flex items-center'>
              {/* Mobile menu button */}
              <Button
                variant='ghost'
                size='icon'
                className='lg:hidden mr-2 h-8 w-8'
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className='h-5 w-5' />
              </Button>

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
              <h1 className='text-lg sm:text-xl font-semibold'>
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
            <div className='flex flex-col sm:flex-row gap-2 sm:gap-0'>
              {!isTrash && <FilterBar activeSection={activeSection} />}
              {isTrash && (
                <div className='text-xs sm:text-sm text-gray-500 text-center sm:text-right'>
                  Forms are permanently deleted after 30 days
                </div>
              )}
            </div>
          </div>
        </div>
        <main className='flex-1 overflow-y-auto p-4 sm:p-6'>
          {/* Warning for trash section */}
          {isTrash && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className='bg-amber-50 border border-amber-200 rounded-lg mb-4 p-4 flex flex-col sm:flex-row sm:items-center gap-2 text-amber-800'
            >
              <AlertCircle className='h-5 w-5 flex-shrink-0' />
              <p className='text-sm'>
                Deleted forms will be permanently removed after 30 days.
              </p>
            </motion.div>
          )}

          {/* Loading state */}
          {formsLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className='text-center py-8 sm:py-12'
            >
              <Loader2 className='h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-3 sm:mb-4 animate-spin text-gray-400' />
              <p className='text-gray-500 text-sm sm:text-base'>
                Loading forms...
              </p>
            </motion.div>
          )}

          {/* Forms list or empty state */}
          {!formsLoading &&
            (hasFormsInSection ? (
              <FormsList
                activeSection={activeSection}
                onFormAction={fetchFormsForCurrentSection}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className='text-center py-8 sm:py-12 text-gray-500'
              >
                {getEmptyStateContent().icon}
                <p className='text-base sm:text-lg mb-2'>
                  {getEmptyStateContent().title}
                </p>
                <p className='text-sm sm:text-base'>
                  {getEmptyStateContent().description}
                </p>
              </motion.div>
            ))}
        </main>
      </motion.div>
    );
  };

  return (
    <div className='flex flex-col h-screen bg-gray-50'>
      <Navbar />

      <div className='flex flex-1 overflow-hidden relative'>
        {/* Desktop Sidebar */}
        <div className='hidden lg:block'>
          <Sidebar onSectionChange={handleSectionChange} />
        </div>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <>
              {/* Invisible backdrop for click-to-close */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className='fixed inset-0 z-40 lg:hidden'
                onClick={() => setIsMobileSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className='fixed left-0 top-0 h-full w-70 z-50 lg:hidden shadow-2xl'
              >
                <div className='relative h-full'>
                  <Sidebar onSectionChange={handleSectionChange} />
                  {/* Close button positioned outside the sidebar */}
                  <Button
                    variant='ghost'
                    size='icon'
                    className='absolute -right-12 top-4 h-10 w-10 bg-white hover:bg-gray-100 shadow-lg rounded-full border z-60'
                    onClick={() => setIsMobileSidebarOpen(false)}
                  >
                    <X className='h-5 w-5 text-gray-700' />
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {renderContent()}
      </div>

      {showCreateModal && <CreateFormModal />}
    </div>
  );
}
