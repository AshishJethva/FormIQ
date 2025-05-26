// src/components/dashboard/FilterBar.tsx

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
} from '@/redux/slices/dashboard/formsSlice';
import { useDebounce } from '@/hooks/useDebounce';

export type SortOption =
  | 'title-az'
  | 'title-za'
  | 'creation-date'
  | 'last-edit'
  | 'last-submission'
  | 'submission-count'
  | 'unread';

interface FilterBarProps {
  activeSection?: string;
}

const FilterBar: React.FC<FilterBarProps> = ({ activeSection = 'all' }) => {
  const dispatch = useDispatch();
  const currentFilters = useSelector(selectCurrentFilters);

  const [searchTerm, setSearchTerm] = useState(currentFilters?.search);
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
    { id: 'unread', label: 'Unread' },
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
          return 'all'; // For label filtering, we'll use the labels param
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
    <div className='flex items-center space-x-3'>
      <div className='relative' ref={sortRef}>
        <Button
          variant='outline'
          className='flex items-center bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors'
          onClick={() => setShowSortOptions(!showSortOptions)}
        >
          <ArrowUpDown className='h-4 w-4 mr-2 text-gray-500' />
          {currentSortOption?.label || 'Creation Date'}
          <ChevronDown
            className={`h-4 w-4 ml-2 text-gray-500 transition-transform ${
              showSortOptions ? 'transform rotate-180' : ''
            }`}
          />
        </Button>

        {showSortOptions && (
          <div className='absolute mt-1 w-48 bg-[#102035] rounded-md shadow-lg py-1 text-white z-50 animate-in fade-in-20 slide-in-from-top-5 duration-100'>
            {sortOptions.map(option => (
              <div
                key={option.id}
                className='px-4 py-3 hover:bg-[#1e3456] cursor-pointer flex items-center justify-between'
                onClick={() => handleSortChange(option.id as SortOption)}
              >
                <span>{option.label}</span>
                {sortBy === option.id && (
                  <Check className='h-4 w-4 text-[#4299e1]' />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search input */}
      <div className='relative group'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none' />
        <Input
          type='text'
          placeholder='Search forms...'
          className='pl-10 pr-8 w-64 border-gray-200 focus:border-[#ff6100] focus:ring-1 focus:ring-[#ff6100] transition-colors'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            onClick={handleClearSearch}
            className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
          >
            <X className='h-4 w-4' />
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
