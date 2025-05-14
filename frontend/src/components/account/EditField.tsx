// src/components/account/EditField.tsx
import React from 'react';

interface EditFieldProps {
  label: string;
  value: string | React.ReactNode;
  onEdit?: () => void;
  showEdit?: boolean;
  fullWidth?: boolean;
}

const EditField: React.FC<EditFieldProps> = ({
  label,
  value,
  onEdit,
  showEdit = true,
  fullWidth = false,
}) => {
  return (
    <div
      className={`border-b border-gray-200 py-6 ${fullWidth ? 'w-full' : ''}`}
    >
      <div className='flex justify-between items-center'>
        <div className='w-1/3'>
          <h3 className='text-[15px] font-medium text-gray-700'>{label}</h3>
        </div>
        <div className={`${fullWidth ? 'w-2/3' : 'flex-1'} flex items-center`}>
          <div className='flex-1 text-[15px] text-gray-800'>{value}</div>
          {showEdit && onEdit && (
            <button
              onClick={onEdit}
              className='ml-4 text-blue-600 hover:text-blue-800 text-sm font-medium'
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditField;
