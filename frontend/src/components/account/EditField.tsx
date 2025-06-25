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
      className={`border-b border-gray-200 py-4 lg:py-6 ${
        fullWidth ? 'w-full' : ''
      }`}
    >
      <div className='flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-3 lg:space-y-0'>
        <div className='lg:w-1/3'>
          <h3 className='text-sm lg:text-[15px] font-medium text-gray-700'>
            {label}
          </h3>
        </div>
        <div
          className={`${
            fullWidth ? 'lg:w-2/3' : 'flex-1'
          } flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0`}
        >
          <div className='flex-1 text-sm lg:text-[15px] text-gray-800'>
            {value}
          </div>
          {showEdit && onEdit && (
            <button
              onClick={onEdit}
              className='lg:ml-4 self-start lg:self-auto text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer transition-colors'
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
