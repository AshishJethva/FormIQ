'use client';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CreateFormModal from '@/components/modals/CreateFormModal';
import { useRouter, useSearchParams } from 'next/navigation';
import { FilterBar, Navbar, FormsList, Sidebar } from '@/components/dashboard';
import type { SortOption } from '@/components/dashboard/FilterBar';
import {
  AlertCircle,
  FileText,
  Star,
  Archive,
  Trash2,
  Circle,
  PlusSquare,
} from 'lucide-react';

// Import Redux actions and selectors
import {
  selectForms,
  createForm,
  Label,
} from '@/redux/slices/dashboard/formsSlice';

// Import UI components
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Define CustomLabel to match the Sidebar's interface
interface CustomLabel {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

// Dashboard page component
export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();

  // Check if the create modal should be shown
  const showCreateModal = searchParams.get('modal') === 'create';

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

  // Get forms and labels from Redux store
  const forms = useSelector(selectForms);

  // Local state for UI
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('creation-date');
  const [activeSection, setActiveSection] = useState('All');
  // Fix the type to accept both Redux Label and Sidebar's CustomLabel
  const [activeSectionData, setActiveSectionData] = useState<
    CustomLabel | Label | null
  >(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Handle section change from sidebar
  // Update the parameter type to match what Sidebar passes
  const handleSectionChange = (section: string, data?: CustomLabel | Label) => {
    setActiveSection(section);
    setActiveSectionData(data || null);
    setSearchTerm(''); // Reset search when changing sections
  };

  // Handle form creation
  const handleCreateForm = () => {
    if (!formName.trim()) {
      toast.error('Form name is required');
      return;
    }

    dispatch(
      createForm({
        name: formName,
        description: formDescription,
      })
    );

    toast.success('Form created successfully');
    setFormName('');
    setFormDescription('');
    handleSectionChange('All');
  };

  // Filter forms based on the active section
  const getFilteredForms = () => {
    switch (activeSection) {
      case 'All':
        return forms.filter(form => !form.isArchived && !form.isTrashed);
      case 'Favorites':
        return forms.filter(
          form => form.isFavorite && !form.isArchived && !form.isTrashed
        );
      case 'Drafts':
        // Implement draft logic if needed
        return forms.filter(form => !form.isArchived && !form.isTrashed);
      case 'Archive':
        return forms.filter(form => form.isArchived && !form.isTrashed);
      case 'Trash':
        return forms.filter(form => form.isTrashed);
      default:
        // Handle label filtering
        if (activeSection.startsWith('label-')) {
          const labelId = activeSection.replace('label-', '');
          return forms.filter(
            form =>
              form.labels?.includes(labelId) &&
              !form.isArchived &&
              !form.isTrashed
          );
        }
        return forms.filter(form => !form.isArchived && !form.isTrashed);
    }
  };

  // Check if there are forms in the current section
  const filteredForms = getFilteredForms();
  const hasFormsInSection = filteredForms.length > 0;

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

  // Render different content based on active section
  const renderContent = () => {
    // Create form section
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
                    className='bg-[#ff6100] hover:bg-[#E65700] text-white'
                    onClick={handleCreateForm}
                  >
                    Create Form
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
                  ? 'My Forms'
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
            {!isTrash && (
              <FilterBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                sortBy={sortBy}
                setSortBy={setSortBy}
              />
            )}
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

          {/* Forms list or empty state */}
          {hasFormsInSection ? (
            <FormsList
              forms={forms}
              searchTerm={searchTerm}
              sortBy={sortBy}
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
            />
          ) : (
            <div className='text-center py-12 text-gray-500'>
              {getEmptyStateContent().icon}
              <p className='text-lg mb-2'>{getEmptyStateContent().title}</p>
              <p>{getEmptyStateContent().description}</p>
            </div>
          )}
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
