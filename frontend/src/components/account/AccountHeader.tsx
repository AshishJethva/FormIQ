import React from 'react';

interface AccountHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
}

const AccountHeader: React.FC<AccountHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className='mb-8'>
      <h1 className='text-2xl font-semibold text-gray-900'>{title}</h1>
      {subtitle && <p className='mt-1 text-sm text-gray-500'>{subtitle}</p>}
    </div>
  );
};

export default AccountHeader;
