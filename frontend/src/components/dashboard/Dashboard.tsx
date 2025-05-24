// src/components/dashboard/Dashboard.tsx

// 'use client';

// import { StoreDispatch } from '@/redux/store';

// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import CreateFormModal from '@/components/modals/CreateFormModal';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { FilterBar, Navbar, FormsList, Sidebar } from '@/components/dashboard';
// import {
//   AlertCircle,
//   FileText,
//   Star,
//   Archive,
//   Trash2,
//   Circle,
//   PlusSquare,
//   Loader2,
// } from 'lucide-react';

// // Import Redux actions and selectors
// import {
//   selectForms,
//   Label,
//   fetchLabels,
//   fetchForms,
//   createFormAsync,
//   selectFormsLoading,
// } from '@/redux/slices/dashboard/formsSlice';

// // Import UI components
// import { Button } from '@/components/ui/button';
// import { toast } from 'sonner';
// import { useFormData } from '@/hooks/useFormData';

// // Define CustomLabel to match the Sidebar's interface
// interface CustomLabel {
//   id: string;
//   name: string;
//   color: string;
//   createdAt: number;
// }

// export default function DashboardPage() {
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const dispatch: StoreDispatch = useDispatch();

//   // Use the custom hook to load data
//   useFormData();

//   // Check if the create modal should be shown
//   const showCreateModal = searchParams.get('modal') === 'create';

//   // Redux selectors
//   const forms = useSelector(selectForms);
//   const formsLoading = useSelector(selectFormsLoading);

//   // Local state for UI
//   const [activeSection, setActiveSection] = useState('All');
//   const [activeSectionData, setActiveSectionData] = useState<Label | null>(
//     null
//   );
//   const [formName, setFormName] = useState('');
//   const [formDescription, setFormDescription] = useState('');
//   const [isCreatingForm, setIsCreatingForm] = useState(false);

//   // If Escape key is pressed, close the modal
//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (e.key === 'Escape' && showCreateModal) {
//         router.push('/dashboard');
//       }
//     };

//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [showCreateModal, router]);

//   useEffect(() => {
//     dispatch(fetchLabels() as any);
//     dispatch(fetchForms({}) as any);
//   }, [dispatch]);

//   const handleSectionChange = (section: string, data?: CustomLabel | Label) => {
//     setActiveSection(section);
//     setActiveSectionData(data || null);
//   };

//   // Handle form creation
//   const handleCreateForm = async () => {
//     if (!formName.trim()) {
//       toast.error('Form name is required');
//       return;
//     }

//     setIsCreatingForm(true);

//     try {
//       await dispatch(
//         createFormAsync({
//           name: formName,
//           description: formDescription,
//         }) as any
//       ).unwrap();

//       toast.success('Form created successfully');
//       setFormName('');
//       setFormDescription('');
//       handleSectionChange('All');

//       // Refresh forms list
//       dispatch(fetchForms({}) as any);
//     } catch (error: any) {
//       toast.error('Failed to create form', {
//         description: error.message || 'Please try again',
//       });
//     } finally {
//       setIsCreatingForm(false);
//     }
//   };

//   // Filter forms based on the active section
//   const getFilteredForms = () => {
//     switch (activeSection) {
//       case 'All':
//         return forms.filter(form => !form.isArchived && !form.isTrashed);
//       case 'Favorites':
//         return forms.filter(
//           form => form.isFavorite && !form.isArchived && !form.isTrashed
//         );
//       case 'Drafts':
//         // Implement draft logic if needed
//         return forms.filter(form => !form.isArchived && !form.isTrashed);
//       case 'Archive':
//         return forms.filter(form => form.isArchived && !form.isTrashed);
//       case 'Trash':
//         return forms.filter(form => form.isTrashed);
//       default:
//         // Handle label filtering
//         if (activeSection.startsWith('label-')) {
//           const labelId = activeSection.replace('label-', '');
//           return forms.filter(
//             form =>
//               form.labels?.includes(labelId) &&
//               !form.isArchived &&
//               !form.isTrashed
//           );
//         }
//         return forms.filter(form => !form.isArchived && !form.isTrashed);
//     }
//   };

//   // Check if there are forms in the current section
//   const filteredForms = getFilteredForms();
//   const hasFormsInSection = filteredForms.length > 0;

//   // For empty states
//   const getEmptyStateContent = () => {
//     switch (activeSection) {
//       case 'Favorites':
//         return {
//           icon: <Star className='h-12 w-12 mx-auto mb-4 text-gray-300' />,
//           title: 'No Favorite Forms',
//           description: 'Star forms to add them to your favorites',
//         };
//       case 'Drafts':
//         return {
//           icon: <FileText className='h-12 w-12 mx-auto mb-4 text-gray-300' />,
//           title: 'No Draft Forms',
//           description: "Forms you haven't published yet will appear here",
//         };
//       case 'Archive':
//         return {
//           icon: <Archive className='h-12 w-12 mx-auto mb-4 text-gray-300' />,
//           title: 'No Archived Forms',
//           description: 'Forms you archive will appear here',
//         };
//       case 'Trash':
//         return {
//           icon: <Trash2 className='h-12 w-12 mx-auto mb-4 text-gray-300' />,
//           title: 'Trash is Empty',
//           description: 'Deleted forms will appear here',
//         };
//       default:
//         if (activeSection.startsWith('label-') && activeSectionData) {
//           return {
//             icon: (
//               <div
//                 className='h-12 w-12 mx-auto mb-4 rounded-full'
//                 style={{ backgroundColor: activeSectionData.color }}
//               ></div>
//             ),
//             title: `No Forms with "${activeSectionData.name}" Label`,
//             description: 'Forms tagged with this label will appear here',
//           };
//         }
//         return {
//           icon: <FileText className='h-12 w-12 mx-auto mb-4 text-gray-300' />,
//           title: 'No Forms Found',
//           description: 'Create your first form to get started',
//         };
//     }
//   };

//   // Render different content based on active section
//   const renderContent = () => {
//     // Create form section
//     if (activeSection === 'CreateForm') {
//       return (
//         <>
//           <div className='bg-white border-b border-gray-200 px-6 py-4'>
//             <div className='flex items-center'>
//               <PlusSquare className='h-5 w-5 text-green-500 mr-2' />
//               <h1 className='text-xl font-semibold'>Create New Form</h1>
//             </div>
//           </div>
//           <main className='flex-1 overflow-y-auto p-6'>
//             <div className='bg-white border border-gray-200 rounded-md p-6 max-w-3xl mx-auto'>
//               <h2 className='text-lg font-semibold mb-4'>Form Details</h2>

//               <div className='space-y-4'>
//                 <div>
//                   <label className='block text-sm font-medium text-gray-700 mb-1'>
//                     Form Name
//                   </label>
//                   <input
//                     type='text'
//                     value={formName}
//                     onChange={e => setFormName(e.target.value)}
//                     className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
//                     placeholder='Enter form name'
//                   />
//                 </div>

//                 <div>
//                   <label className='block text-sm font-medium text-gray-700 mb-1'>
//                     Description (optional)
//                   </label>
//                   <textarea
//                     value={formDescription}
//                     onChange={e => setFormDescription(e.target.value)}
//                     className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
//                     rows={3}
//                     placeholder='Describe your form'
//                   ></textarea>
//                 </div>

//                 <div className='pt-4 flex justify-end'>
//                   <Button
//                     className='bg-[#ff6100] hover:bg-[#E65700] text-white'
//                     onClick={handleCreateForm}
//                     disabled={isCreatingForm || !formName.trim()}
//                   >
//                     {isCreatingForm ? (
//                       <>
//                         <Loader2 className='mr-2 h-4 w-4 animate-spin' />
//                         Creating...
//                       </>
//                     ) : (
//                       'Create Form'
//                     )}
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           </main>
//         </>
//       );
//     }

//     // Special header for Trash section
//     const isTrash = activeSection === 'Trash';
//     return (
//       <>
//         <div className='bg-white border-b border-gray-200 px-6 py-4'>
//           <div className='flex items-center justify-between'>
//             <div className='flex items-center'>
//               {activeSection === 'All' ? null : activeSection ===
//                 'Favorites' ? (
//                 <Star className='h-5 w-5 text-amber-400 mr-2' />
//               ) : activeSection === 'Drafts' ? (
//                 <FileText className='h-5 w-5 text-blue-500 mr-2' />
//               ) : activeSection === 'Archive' ? (
//                 <Archive className='h-5 w-5 text-purple-500 mr-2' />
//               ) : activeSection === 'Trash' ? (
//                 <Trash2 className='h-5 w-5 text-red-500 mr-2' />
//               ) : activeSection.startsWith('label-') && activeSectionData ? (
//                 <Circle
//                   className='h-5 w-5 mr-2'
//                   fill={activeSectionData.color}
//                   color={activeSectionData.color}
//                 />
//               ) : null}
//               <h1 className='text-xl font-semibold'>
//                 {activeSection === 'All'
//                   ? 'All Forms'
//                   : activeSection === 'Favorites'
//                   ? 'Favorites'
//                   : activeSection === 'Drafts'
//                   ? 'Draft Forms'
//                   : activeSection === 'Archive'
//                   ? 'Archive'
//                   : activeSection === 'Trash'
//                   ? 'Trash'
//                   : activeSection.startsWith('label-') && activeSectionData
//                   ? activeSectionData.name
//                   : 'Dashboard'}
//               </h1>
//             </div>
//             {!isTrash && <FilterBar activeSection={activeSection} />}
//             {isTrash && (
//               <div className='text-sm text-gray-500'>
//                 Forms are permanently deleted after 30 days
//               </div>
//             )}
//           </div>
//         </div>
//         <main className='flex-1 overflow-y-auto p-6'>
//           {/* Warning for trash section */}
//           {isTrash && (
//             <div className='bg-amber-50 border border-amber-200 rounded-md mb-4 p-4 flex items-center text-amber-800'>
//               <AlertCircle className='h-5 w-5 mr-2 flex-shrink-0' />
//               <p>Deleted forms will be permanently removed after 30 days.</p>
//             </div>
//           )}

//           {/* Loading state */}
//           {formsLoading && (
//             <div className='text-center py-12'>
//               <Loader2 className='h-8 w-8 mx-auto mb-4 animate-spin text-gray-400' />
//               <p className='text-gray-500'>Loading forms...</p>
//             </div>
//           )}

//           {/* Forms list or empty state */}
//           {!formsLoading &&
//             (hasFormsInSection ? (
//               <FormsList activeSection={activeSection} />
//             ) : (
//               <div className='text-center py-12 text-gray-500'>
//                 {getEmptyStateContent().icon}
//                 <p className='text-lg mb-2'>{getEmptyStateContent().title}</p>
//                 <p>{getEmptyStateContent().description}</p>
//               </div>
//             ))}
//         </main>
//       </>
//     );
//   };

//   return (
//     <div className='flex flex-col h-screen bg-gray-50'>
//       <Navbar />

//       <div className='flex flex-1 overflow-hidden'>
//         <Sidebar onSectionChange={handleSectionChange} />

//         <div className='flex-1 flex flex-col overflow-hidden'>
//           {renderContent()}
//         </div>
//       </div>

//       {showCreateModal && <CreateFormModal />}
//     </div>
//   );
// }

// src/components/dashboard/Dashboard.tsx
'use client';

import { StoreDispatch } from '@/redux/store';
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
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
import { useFormData, useCacheDebugger } from '@/hooks/useFormData';

// Import UI components
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Enhanced cache management
interface FormsCacheEntry {
  data: any[];
  timestamp: number;
  section: string;
  filters?: any;
}

const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes
const formsCache = new Map<string, FormsCacheEntry>();

// Define CustomLabel to match the Sidebar's interface
interface CustomLabel {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch: StoreDispatch = useDispatch();

  // Use the custom hook to load data
  const { isLoading, refreshForms, cacheStats, clearAllCache } = useFormData({
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    preloadLabels: true,
    cacheStrategy: 'default',
  });

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
  const [lastFetchTimes, setLastFetchTimes] = useState<Record<string, number>>(
    {}
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Refs for preventing unnecessary re-renders
  const previousSectionRef = useRef<string>('All');
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Smart caching functions
  const getCacheKey = useCallback((section: string, filters?: any) => {
    return `${section}-${JSON.stringify(filters || {})}`;
  }, []);

  const shouldFetchForms = useCallback(
    (section: string, filters?: any) => {
      const cacheKey = getCacheKey(section, filters);
      const cached = formsCache.get(cacheKey);
      const lastFetch = lastFetchTimes[cacheKey] || 0;

      if (!cached) return true;

      const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
      const recentlyFetched = Date.now() - lastFetch < 2000; // Prevent duplicate requests within 2s

      return isExpired && !recentlyFetched;
    },
    [getCacheKey, lastFetchTimes]
  );

  const cacheForms = useCallback(
    (data: any[], section: string, filters?: any) => {
      const cacheKey = getCacheKey(section, filters);
      formsCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        section,
        filters,
      });
    },
    [getCacheKey]
  );

  const getCachedForms = useCallback(
    (section: string, filters?: any) => {
      const cacheKey = getCacheKey(section, filters);
      return formsCache.get(cacheKey)?.data || null;
    },
    [getCacheKey]
  );

  // Optimized form fetching with smart caching
  const fetchFormsOptimized = useCallback(
    async (section: string, filters?: any) => {
      const cacheKey = getCacheKey(section, filters);

      // Check if we should fetch
      if (!shouldFetchForms(section, filters)) {
        const cached = getCachedForms(section, filters);
        if (cached) {
          return cached;
        }
      }

      // Update last fetch time
      setLastFetchTimes(prev => ({
        ...prev,
        [cacheKey]: Date.now(),
      }));

      try {
        let fetchPromise;

        switch (section) {
          case 'All':
            fetchPromise = dispatch(fetchForms({ status: 'all' }) as any);
            break;
          case 'Favorites':
            fetchPromise = dispatch(fetchForms({ status: 'favorites' }) as any);
            break;
          case 'Drafts':
            fetchPromise = dispatch(fetchForms({ status: 'draft' }) as any);
            break;
          case 'Archive':
            fetchPromise = dispatch(fetchForms({ status: 'archived' }) as any);
            break;
          case 'Trash':
            fetchPromise = dispatch(fetchForms({ status: 'trashed' }) as any);
            break;
          default:
            if (section.startsWith('label-')) {
              const labelId = section.replace('label-', '');
              fetchPromise = dispatch(fetchForms({ labels: [labelId] }) as any);
            } else {
              fetchPromise = dispatch(fetchForms({ status: 'all' }) as any);
            }
        }

        if (fetchPromise) {
          const result = await fetchPromise.unwrap();
          cacheForms(result, section, filters);
          return result;
        }
      } catch (error) {
        console.error('Failed to fetch forms:', error);
        // Remove failed fetch time to allow retry
        setLastFetchTimes(prev => {
          const newTimes = { ...prev };
          delete newTimes[cacheKey];
          return newTimes;
        });
        throw error;
      }
    },
    [dispatch, getCacheKey, shouldFetchForms, getCachedForms, cacheForms]
  );

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

  // Initial data load with smart caching
  useEffect(() => {
    // Load labels only once on mount if not already cached
    const labelsLastFetch = lastFetchTimes['labels'] || 0;
    const shouldFetchLabels = Date.now() - labelsLastFetch > CACHE_DURATION;

    if (shouldFetchLabels) {
      dispatch(fetchLabels() as any);
      setLastFetchTimes(prev => ({ ...prev, labels: Date.now() }));
    }

    // Load initial forms
    fetchFormsOptimized('All');
  }, [dispatch, fetchFormsOptimized, lastFetchTimes]);

  // Optimized section change handler
  const handleSectionChange = useCallback(
    (section: string, data?: CustomLabel | Label) => {
      // Prevent unnecessary transitions
      if (section === activeSection) return;

      // Show transition state for better UX
      setIsTransitioning(true);

      // Clear any pending fetch timeout
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }

      // Update UI immediately for better perceived performance
      setActiveSection(section);
      setActiveSectionData(data || null);
      previousSectionRef.current = section;

      // Debounced fetch to prevent rapid API calls
      fetchTimeoutRef.current = setTimeout(() => {
        fetchFormsOptimized(section).finally(() => {
          setIsTransitioning(false);
        });
      }, 150); // Small delay for smooth transition
    },
    [activeSection, fetchFormsOptimized]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  // Enhanced form creation with better UX
  const handleCreateForm = async () => {
    if (!formName.trim()) {
      toast.error('Form name is required');
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

      toast.success('Form created successfully');
      setFormName('');
      setFormDescription('');

      // Clear relevant caches
      formsCache.clear();

      // Redirect to form builder
      router.push(`/build/${result.id}`);
    } catch (error: any) {
      toast.error('Failed to create form', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsCreatingForm(false);
    }
  };

  // Memoized form filtering for better performance
  const getFilteredForms = useMemo(() => {
    if (!forms || forms.length === 0) return [];

    switch (activeSection) {
      case 'All':
        return forms.filter(form => !form.isArchived && !form.isTrashed);
      case 'Favorites':
        return forms.filter(
          form => form.isFavorite && !form.isArchived && !form.isTrashed
        );
      case 'Drafts':
        return forms.filter(
          form => !form.isPublished && !form.isArchived && !form.isTrashed
        );
      case 'Archive':
        return forms.filter(form => form.isArchived && !form.isTrashed);
      case 'Trash':
        return forms.filter(form => form.isTrashed);
      default:
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
  }, [forms, activeSection]);

  const filteredForms = getFilteredForms;
  const hasFormsInSection = filteredForms.length > 0;

  // Memoized empty state content
  const getEmptyStateContent = useMemo(() => {
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
  }, [activeSection, activeSectionData]);

  // Optimized refresh handler
  const handleFormsRefresh = useCallback(() => {
    const cacheKey = getCacheKey(activeSection);
    formsCache.delete(cacheKey); // Clear specific cache

    setLastFetchTimes(prev => {
      const newTimes = { ...prev };
      delete newTimes[cacheKey];
      return newTimes;
    });

    return fetchFormsOptimized(activeSection);
  }, [activeSection, getCacheKey, fetchFormsOptimized]);

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

    // Main dashboard content
    const isTrash = activeSection === 'Trash';
    const effectiveLoading = formsLoading || isTransitioning;

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
              {/* Show form count with smooth transition */}
              <span
                className={`ml-2 text-sm text-gray-500 transition-opacity duration-200 ${
                  effectiveLoading ? 'opacity-50' : 'opacity-100'
                }`}
              >
                ({filteredForms.length})
              </span>
              {effectiveLoading && (
                <Loader2 className='ml-2 h-4 w-4 animate-spin text-gray-400' />
              )}
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

          {/* Loading state with skeleton */}
          {effectiveLoading && !hasFormsInSection && (
            <div className='space-y-3'>
              {[...Array(3)].map((_, i) => (
                <div key={i} className='animate-pulse'>
                  <div className='flex items-center p-4 border rounded-md'>
                    <div className='h-4 w-4 bg-gray-200 rounded mr-3'></div>
                    <div className='h-5 w-5 bg-gray-200 rounded mr-3'></div>
                    <div className='h-10 w-10 bg-gray-200 rounded mr-3'></div>
                    <div className='flex-1'>
                      <div className='h-4 bg-gray-200 rounded w-1/3 mb-2'></div>
                      <div className='h-3 bg-gray-200 rounded w-1/2'></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Forms list or empty state */}
          {!effectiveLoading &&
            (hasFormsInSection ? (
              <div
                className={`transition-opacity duration-200 ${
                  isTransitioning ? 'opacity-50' : 'opacity-100'
                }`}
              >
                <FormsList
                  activeSection={activeSection}
                  filteredForms={filteredForms}
                  onFormsChange={handleFormsRefresh}
                />
              </div>
            ) : (
              <div className='text-center py-12 text-gray-500'>
                {getEmptyStateContent.icon}
                <p className='text-lg mb-2'>{getEmptyStateContent.title}</p>
                <p>{getEmptyStateContent.description}</p>
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
