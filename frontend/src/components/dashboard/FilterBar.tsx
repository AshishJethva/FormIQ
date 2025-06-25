'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, ChevronDown, ArrowUpDown, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchForms,
  setFilters,
  selectCurrentFilters,
} from '@/redux/slices/dashboard/formsSlice';
import { useDebounce } from '@/hooks/useDebounce';

export type SortOption =
  | 'title-az'
  | 'title-za'
  | 'creation-date'
  | 'last-edit'
  | 'last-submission'
  | 'submission-count';

interface FilterBarProps {
  activeSection?: string;
}

const FilterBar: React.FC<FilterBarProps> = ({ activeSection = 'all' }) => {
  const dispatch = useDispatch();
  const currentFilters = useSelector(selectCurrentFilters);

  const [searchTerm, setSearchTerm] = useState(currentFilters?.search || '');
  const [sortBy, setSortBy] = useState<SortOption>('creation-date');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const sortOptions = [
    { id: 'title-az', label: 'Title [a-z]' },
    { id: 'title-za', label: 'Title [z-a]' },
    { id: 'creation-date', label: 'Creation Date' },
    { id: 'last-edit', label: 'Last Edit' },
    { id: 'last-submission', label: 'Last Submission' },
    { id: 'submission-count', label: 'Submission Count' },
  ];

  // Map section to backend status
  const getStatusFromSection = (
    section: string
  ): 'all' | 'favorites' | 'archived' | 'trashed' | 'draft' | 'published' => {
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
          return 'all';
        }
        return 'all';
    }
  };

  // Extract label IDs from section
  const getLabelsFromSection = (section: string) => {
    if (section.startsWith('label-')) {
      return [section.replace('label-', '')];
    }
    return [];
  };

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchFormsWithFilters = useCallback(
    (filters: any) => {
      dispatch(setFilters(filters));
      dispatch(fetchForms(filters) as any);
    },
    [dispatch]
  );

  // Only trigger API call when debounced search, sort, or section changes
  useEffect(() => {
    const filters = {
      search: debouncedSearchTerm,
      status: getStatusFromSection(activeSection),
      labels: getLabelsFromSection(activeSection),
      sortBy,
      page: 1,
    };

    // Only fetch if filters actually changed
    const hasChanged =
      currentFilters?.search !== debouncedSearchTerm ||
      currentFilters?.sortBy !== sortBy ||
      currentFilters?.status !== getStatusFromSection(activeSection);

    if (hasChanged) {
      fetchFormsWithFilters(filters);
    }
  }, [
    debouncedSearchTerm,
    sortBy,
    activeSection,
    fetchFormsWithFilters,
    currentFilters,
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

  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
    setShowSortOptions(false);
  };

  const currentSortOption = sortOptions.find(option => option.id === sortBy);

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto'>
      {/* Sort Dropdown */}
      <div className='relative' ref={sortRef}>
        <Button
          variant='outline'
          className='flex items-center justify-between bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer w-full sm:w-auto min-w-[160px]'
          onClick={() => setShowSortOptions(!showSortOptions)}
        >
          <div className='flex items-center'>
            <ArrowUpDown className='h-4 w-4 mr-2 text-gray-500' />
            <span className='hidden sm:inline'>
              {currentSortOption?.label || 'Creation Date'}
            </span>
            <span className='sm:hidden'>Sort</span>
          </div>
          <ChevronDown
            className={`h-4 w-4 ml-2 text-gray-500 transition-transform ${
              showSortOptions ? 'transform rotate-180' : ''
            }`}
          />
        </Button>

        <AnimatePresence>
          {showSortOptions && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className='absolute mt-1 w-48 bg-[#102035] rounded-lg shadow-lg py-1 text-white z-50'
            >
              {sortOptions.map(option => (
                <motion.div
                  key={option.id}
                  whileHover={{ backgroundColor: '#1e3456' }}
                  className='px-4 py-3 cursor-pointer flex items-center justify-between'
                  onClick={() => handleSortChange(option.id as SortOption)}
                >
                  <span className='text-sm'>{option.label}</span>
                  {sortBy === option.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Check className='h-4 w-4 text-[#4299e1]' />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search input */}
      <div className='relative group flex-1 sm:flex-initial'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none' />
        <Input
          type='text'
          placeholder='Search forms...'
          className='pl-10 pr-8 w-full sm:w-64 border-gray-200 focus:border-[#ff6100] focus:ring-1 focus:ring-[#ff6100] transition-colors'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={handleClearSearch}
            className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors'
          >
            <X className='h-4 w-4' />
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
