'use client';
import React from 'react';
import type { SortOption } from './FilterBar';

// Form interface
interface Form {
  id: number;
  name: string;
  submissions: number;
  createdAt: string;
  lastEdited?: string;
  lastSubmission?: string;
  unread?: boolean;
}

interface FormsListProps {
  forms: Form[];
  searchTerm?: string;
  sortBy: SortOption;
}

const FormsList: React.FC<FormsListProps> = ({
  forms,
  searchTerm = '',
  sortBy,
}) => {
  // Filter forms based on search term
  let filteredForms = forms.filter(form =>
    form.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort forms based on selected option
  filteredForms = [...filteredForms].sort((a, b) => {
    switch (sortBy) {
      case 'title-az':
        return a.name.localeCompare(b.name);
      case 'title-za':
        return b.name.localeCompare(a.name);
      case 'creation-date':
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'submission-count':
        return b.submissions - a.submissions;
      case 'last-edit':
        if (!a.lastEdited || !b.lastEdited) return 0;
        return (
          new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime()
        );
      case 'last-submission':
        if (!a.lastSubmission || !b.lastSubmission) return 0;
        return (
          new Date(b.lastSubmission).getTime() -
          new Date(a.lastSubmission).getTime()
        );
      case 'unread':
        return (b.unread ? 1 : 0) - (a.unread ? 1 : 0);
      default:
        return 0;
    }
  });

  return (
    <div>
      {filteredForms.length === 0 ? (
        <div className='text-center py-10'>
          <p className='text-gray-500'>No forms found matching your search.</p>
        </div>
      ) : (
        filteredForms.map(form => (
          <div
            key={form.id}
            className='flex items-center p-4 border border-gray-200 rounded-md mb-4 hover:bg-gray-50 transition-colors cursor-pointer'
          >
            <input type='checkbox' className='mr-4' />
            <div className='h-10 w-10 bg-[#ff6100] flex items-center justify-center rounded text-white mr-4'>
              <span>{form.name.charAt(0)}</span>
            </div>
            <div className='flex-1'>
              <h3 className='font-medium'>{form.name}</h3>
              <p className='text-sm text-gray-500'>
                {form.submissions} Submissions. Created on {form.createdAt}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default FormsList;
