// 'use client';

// import React, { useState, useRef, useEffect, useCallback } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { Search, ChevronDown, ArrowUpDown, Check, X } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import {
//   fetchForms,
//   setFilters,
//   selectCurrentFilters,
// } from '@/redux/slices/dashboard/formsSlice';
// import { useDebounce } from '@/hooks/useDebounce';

// export type SortOption =
//   | 'title-az'
//   | 'title-za'
//   | 'creation-date'
//   | 'last-edit'
//   | 'last-submission'
//   | 'submission-count'
//   | 'unread';

// interface FilterBarProps {
//   activeSection?: string;
// }

// const FilterBar: React.FC<FilterBarProps> = ({ activeSection = 'all' }) => {
//   const dispatch = useDispatch();
//   const currentFilters = useSelector(selectCurrentFilters);

//   const [searchTerm, setSearchTerm] = useState(currentFilters?.search);
//   const [sortBy, setSortBy] = useState<SortOption>('creation-date');
//   const [showSortOptions, setShowSortOptions] = useState(false);
//   const sortRef = useRef<HTMLDivElement>(null);

//   // Debounced search term
//   const debouncedSearchTerm = useDebounce(searchTerm, 500);

//   const sortOptions = [
//     { id: 'title-az', label: 'Title [a-z]' },
//     { id: 'title-za', label: 'Title [z-a]' },
//     { id: 'creation-date', label: 'Creation Date' },
//     { id: 'last-edit', label: 'Last Edit' },
//     { id: 'last-submission', label: 'Last Submission' },
//     { id: 'submission-count', label: 'Submission Count' },
//     { id: 'unread', label: 'Unread' },
//   ];

//   // Map section to backend status
//   const getStatusFromSection = (
//     section: string
//   ): 'all' | 'favorites' | 'archived' | 'trashed' | 'draft' | 'published' => {
//     switch (section) {
//       case 'All':
//         return 'all';
//       case 'Favorites':
//         return 'favorites';
//       case 'Archive':
//         return 'archived';
//       case 'Trash':
//         return 'trashed';
//       case 'Drafts':
//         return 'draft';
//       default:
//         if (section.startsWith('label-')) {
//           return 'all'; // For label filtering, we'll use the labels param
//         }
//         return 'all';
//     }
//   };

//   // Extract label IDs from section
//   const getLabelsFromSection = (section: string) => {
//     if (section.startsWith('label-')) {
//       return [section.replace('label-', '')];
//     }
//     return [];
//   };

//   // Memoize the fetch function to prevent unnecessary re-renders
//   const fetchFormsWithFilters = useCallback(
//     (filters: any) => {
//       dispatch(setFilters(filters));
//       dispatch(fetchForms(filters) as any);
//     },
//     [dispatch]
//   );

//   // Only trigger API call when debounced search, sort, or section changes
//   useEffect(() => {
//     const filters = {
//       search: debouncedSearchTerm,
//       status: getStatusFromSection(activeSection),
//       labels: getLabelsFromSection(activeSection),
//       sortBy,
//       page: 1,
//     };

//     // Only fetch if filters actually changed
//     const hasChanged =
//       currentFilters?.search !== debouncedSearchTerm ||
//       currentFilters?.sortBy !== sortBy ||
//       currentFilters?.status !== getStatusFromSection(activeSection);

//     if (hasChanged) {
//       fetchFormsWithFilters(filters);
//     }
//   }, [
//     debouncedSearchTerm,
//     sortBy,
//     activeSection,
//     fetchFormsWithFilters,
//     currentFilters,
//   ]);

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
//         setShowSortOptions(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   const handleSortChange = (option: SortOption) => {
//     setSortBy(option);
//     setShowSortOptions(false);
//   };

//   const currentSortOption = sortOptions.find(option => option.id === sortBy);

//   const handleClearSearch = () => {
//     setSearchTerm('');
//   };

//   return (
//     <div className='flex items-center space-x-3'>
//       <div className='relative' ref={sortRef}>
//         <Button
//           variant='outline'
//           className='flex items-center bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors'
//           onClick={() => setShowSortOptions(!showSortOptions)}
//         >
//           <ArrowUpDown className='h-4 w-4 mr-2 text-gray-500' />
//           {currentSortOption?.label || 'Creation Date'}
//           <ChevronDown
//             className={`h-4 w-4 ml-2 text-gray-500 transition-transform ${
//               showSortOptions ? 'transform rotate-180' : ''
//             }`}
//           />
//         </Button>

//         {showSortOptions && (
//           <div className='absolute mt-1 w-48 bg-[#102035] rounded-md shadow-lg py-1 text-white z-50 animate-in fade-in-20 slide-in-from-top-5 duration-100'>
//             {sortOptions.map(option => (
//               <div
//                 key={option.id}
//                 className='px-4 py-3 hover:bg-[#1e3456] cursor-pointer flex items-center justify-between'
//                 onClick={() => handleSortChange(option.id as SortOption)}
//               >
//                 <span>{option.label}</span>
//                 {sortBy === option.id && (
//                   <Check className='h-4 w-4 text-[#4299e1]' />
//                 )}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Search input */}
//       <div className='relative group'>
//         <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none' />
//         <Input
//           type='text'
//           placeholder='Search forms...'
//           className='pl-10 pr-8 w-64 border-gray-200 focus:border-[#ff6100] focus:ring-1 focus:ring-[#ff6100] transition-colors'
//           value={searchTerm}
//           onChange={e => setSearchTerm(e.target.value)}
//         />
//         {searchTerm && (
//           <button
//             onClick={handleClearSearch}
//             className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
//           >
//             <X className='h-4 w-4' />
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// export default FilterBar;

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, ChevronDown, ArrowUpDown, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  fetchForms,
  setFilters,
  selectCurrentFilters,
  selectFormsLoading,
  clearFormsCache,
} from '@/redux/slices/dashboard/formsSlice';

// Custom debounce hook
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

export type SortOption =
  | 'title-az'
  | 'title-za'
  | 'createdAt'
  | 'creation-date'
  | 'last-edit'
  | 'lastEdited'
  | 'last-submission'
  | 'lastSubmission'
  | 'submission-count'
  | 'submissions'
  | 'unread';

interface FilterBarProps {
  activeSection?: string;
  onFiltersChange?: (filters: any) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  activeSection = 'All',
  onFiltersChange,
}) => {
  const dispatch = useDispatch();
  const currentFilters = useSelector(selectCurrentFilters);
  const isLoading = useSelector(selectFormsLoading);

  // Local state for immediate UI updates
  const [searchTerm, setSearchTerm] = useState(currentFilters?.search || '');
  const [sortBy, setSortBy] = useState<SortOption>(
    (currentFilters?.sortBy as SortOption) || 'createdAt'
  );
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const sortOptions = [
    { id: 'createdAt', label: 'Creation Date', value: 'createdAt' },
    { id: 'lastEdited', label: 'Last Edit', value: 'lastEdited' },
    { id: 'title-az', label: 'Title A-Z', value: 'name' },
    { id: 'title-za', label: 'Title Z-A', value: 'name' },
    { id: 'lastSubmission', label: 'Last Submission', value: 'lastSubmission' },
    { id: 'submissions', label: 'Submission Count', value: 'submissions' },
    { id: 'unread', label: 'Unread', value: 'unread' },
  ];

  // Map section to backend status
  const getStatusFromSection = useCallback((section: string) => {
    switch (section) {
      case 'All':
        return 'all';
      case 'Favorites':
        return 'favorites';
      case 'Archive':
        return 'archived';
      case 'Trash':
        return 'trashed';
      case 'Drafts':
        return 'draft';
      default:
        if (section.startsWith('label-')) {
          return 'all'; // For label filtering, we'll use the labels param
        }
        return 'all';
    }
  }, []);

  // Extract label IDs from section
  const getLabelsFromSection = useCallback((section: string) => {
    if (section.startsWith('label-')) {
      return [section.replace('label-', '')];
    }
    return [];
  }, []);

  // Optimized fetch function with caching considerations
  const fetchFormsWithFilters = useCallback(
    async (filters: any, forceRefresh = false) => {
      try {
        setIsSearching(true);

        // Update Redux filters state
        dispatch(setFilters(filters));

        // Clear cache if needed (for fresh searches)
        if (forceRefresh || filters.search !== currentFilters?.search) {
          const cacheKey = JSON.stringify({
            status: filters.status,
            labels: filters.labels,
          });
          dispatch(clearFormsCache(cacheKey));
        }

        // Map sortBy to correct backend field
        const mappedFilters = {
          ...filters,
          sortBy:
            sortOptions.find(opt => opt.id === filters.sortBy)?.value ||
            filters.sortBy,
          sortOrder: filters.sortBy === 'title-za' ? 'desc' : 'asc',
        };

        // Fetch forms with new filters
        await dispatch(fetchForms(mappedFilters) as any).unwrap();

        // Notify parent component if callback provided
        if (onFiltersChange) {
          onFiltersChange(mappedFilters);
        }

        console.log('✅ Forms fetched with filters:', mappedFilters);
      } catch (error) {
        console.error('❌ Failed to fetch forms with filters:', error);
      } finally {
        setIsSearching(false);
      }
    },
    [dispatch, currentFilters, onFiltersChange, sortOptions]
  );

  // Handle search changes with debouncing
  useEffect(() => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't trigger on initial mount if search is empty
    if (
      debouncedSearchTerm === '' &&
      (!currentFilters?.search || currentFilters.search === '')
    ) {
      setIsSearching(false);
      return;
    }

    const filters = {
      search: debouncedSearchTerm,
      status: getStatusFromSection(activeSection),
      labels: getLabelsFromSection(activeSection),
      sortBy,
      page: 1,
    };

    // Only fetch if search term actually changed
    if (debouncedSearchTerm !== currentFilters?.search) {
      console.log('🔍 Search term changed:', debouncedSearchTerm);
      fetchFormsWithFilters(filters, true); // Force refresh for search
    } else {
      setIsSearching(false);
    }
  }, [
    debouncedSearchTerm,
    activeSection,
    sortBy,
    fetchFormsWithFilters,
    currentFilters?.search,
    getStatusFromSection,
    getLabelsFromSection,
  ]);

  // Handle sort changes immediately
  useEffect(() => {
    // Skip if sort hasn't actually changed
    if (sortBy === currentFilters?.sortBy) {
      return;
    }

    const filters = {
      search: debouncedSearchTerm,
      status: getStatusFromSection(activeSection),
      labels: getLabelsFromSection(activeSection),
      sortBy,
      page: 1,
    };

    console.log('🔄 Sort changed:', sortBy);
    fetchFormsWithFilters(filters);
  }, [
    sortBy,
    debouncedSearchTerm,
    activeSection,
    fetchFormsWithFilters,
    currentFilters?.sortBy,
    getStatusFromSection,
    getLabelsFromSection,
  ]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSortOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSortChange = useCallback((option: SortOption) => {
    console.log('📊 Sort option selected:', option);
    setSortBy(option);
    setShowSortOptions(false);
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchTerm(value);

      // Show immediate feedback
      if (value.length > 0 && value !== currentFilters?.search) {
        setIsSearching(true);
      }
    },
    [currentFilters?.search]
  );

  const handleClearSearch = useCallback(() => {
    console.log('🧹 Clearing search');
    setSearchTerm('');
    setIsSearching(false);

    // Immediately trigger a fetch with empty search
    const filters = {
      search: '',
      status: getStatusFromSection(activeSection),
      labels: getLabelsFromSection(activeSection),
      sortBy,
      page: 1,
    };
    fetchFormsWithFilters(filters, true);
  }, [
    activeSection,
    sortBy,
    fetchFormsWithFilters,
    getStatusFromSection,
    getLabelsFromSection,
  ]);

  const currentSortOption = sortOptions.find(option => option.id === sortBy);

  return (
    <div className='flex items-center space-x-3'>
      {/* Sort Dropdown */}
      <div className='relative' ref={sortRef}>
        <Button
          variant='outline'
          className='flex items-center bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50'
          onClick={() => setShowSortOptions(!showSortOptions)}
          disabled={isLoading}
        >
          <ArrowUpDown className='h-4 w-4 mr-2 text-gray-500' />
          <span className='truncate max-w-[120px]'>
            {currentSortOption?.label || 'Creation Date'}
          </span>
          <ChevronDown
            className={`h-4 w-4 ml-2 text-gray-500 transition-transform duration-200 ${
              showSortOptions ? 'transform rotate-180' : ''
            }`}
          />
        </Button>

        {showSortOptions && (
          <div className='absolute mt-1 w-48 bg-[#102035] rounded-md shadow-lg py-1 text-white z-50 animate-in fade-in-20 slide-in-from-top-5 duration-100'>
            {sortOptions.map(option => (
              <div
                key={option.id}
                className='px-4 py-3 hover:bg-[#1e3456] cursor-pointer flex items-center justify-between transition-colors'
                onClick={() => handleSortChange(option.id as SortOption)}
              >
                <span className='text-sm'>{option.label}</span>
                {sortBy === option.id && (
                  <Check className='h-4 w-4 text-[#4299e1] flex-shrink-0' />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className='relative group'>
        <Search
          className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors ${
            isSearching ? 'text-[#ff6100] animate-pulse' : 'text-gray-400'
          }`}
        />
        <Input
          type='text'
          placeholder='Search forms...'
          className={`pl-10 pr-8 w-64 border-gray-200 focus:border-[#ff6100] focus:ring-1 focus:ring-[#ff6100] transition-all duration-200 ${
            isSearching ? 'border-[#ff6100]/50' : ''
          }`}
          value={searchTerm}
          onChange={handleSearchChange}
          disabled={isLoading}
        />
        {searchTerm && (
          <button
            onClick={handleClearSearch}
            className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100'
            disabled={isLoading}
          >
            <X className='h-3 w-3' />
          </button>
        )}

        {/* Search status indicator */}
        {isSearching && (
          <div className='absolute -bottom-1 left-3 right-3 h-0.5 bg-[#ff6100] animate-pulse rounded-full' />
        )}
      </div>

      {/* Active filters indicator */}
      {(searchTerm || sortBy !== 'createdAt') && (
        <div className='flex items-center space-x-1'>
          {searchTerm && (
            <div className='px-2 py-1 bg-[#ff6100]/10 text-[#ff6100] rounded-md text-xs font-medium'>
              Search: &quot;
              {searchTerm.length > 20
                ? searchTerm.substring(0, 20) + '...'
                : searchTerm}
              &quot;
            </div>
          )}
          {sortBy !== 'createdAt' && (
            <div className='px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium'>
              Sort: {currentSortOption?.label}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
