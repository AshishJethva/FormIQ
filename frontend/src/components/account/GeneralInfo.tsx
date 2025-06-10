// src/components/account/GeneralInfo.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import EditField from './EditField';

interface UserData {
  accountType: string;
  username: string;
  name: string;
  avatar: string | null;
  phoneNumber: string | null;
  website: string | null;
  email: string;
}

interface GeneralInfoProps {
  userData: UserData;
}

const GeneralInfo: React.FC<GeneralInfoProps> = ({ userData }) => {
  const handleUpgradeAccount = () => {
    console.log('Upgrade account clicked');
  };

  const handleResetPassword = () => {
    console.log('Reset password clicked');
  };

  const handleEditField = (field: string) => {
    console.log(`Edit ${field} clicked`);
  };

  const handleAddPhone = () => {
    console.log('Add phone number clicked');
  };

  return (
    <div className='w-full'>
      <EditField
        label='Account Type'
        value={
          <div className='flex items-center'>
            <span className='mr-4'>{userData.accountType}</span>
            <button
              onClick={handleUpgradeAccount}
              className='bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer'
            >
              Upgrade Account
            </button>
          </div>
        }
        showEdit={false}
      />

      <EditField
        label='Username'
        value={userData.username}
        onEdit={() => handleEditField('username')}
      />

      <EditField
        label='Password'
        value={
          <button
            onClick={handleResetPassword}
            className='text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer'
          >
            Reset Password
          </button>
        }
        showEdit={false}
      />

      <EditField
        label='Name'
        value={userData.name}
        onEdit={() => handleEditField('name')}
      />

      <EditField
        label='Avatar'
        value={
          <div className='flex items-center'>
            {userData.avatar ? (
              <Image
                src={userData.avatar}
                alt={userData.name}
                width={64}
                height={64}
                className='rounded-sm mr-2'
              />
            ) : (
              <div className='h-16 w-16 bg-gray-200 rounded-sm flex items-center justify-center mr-2'>
                <User className='h-10 w-10 text-gray-500' />
              </div>
            )}
          </div>
        }
        onEdit={() => handleEditField('avatar')}
      />

      <EditField
        label='Phone Number'
        value={
          userData.phoneNumber || (
            <button
              onClick={handleAddPhone}
              className='bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer'
            >
              Add Phone Number
            </button>
          )
        }
        onEdit={
          userData.phoneNumber
            ? () => handleEditField('phoneNumber')
            : undefined
        }
      />

      <EditField
        label='Website'
        value={userData.website || '-'}
        onEdit={() => handleEditField('website')}
      />

      <EditField
        label='Email'
        value={
          <div className='flex items-center'>
            <span>{userData.email}</span>
            <Image
              src='https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg'
              alt='Google'
              width={20}
              height={20}
              className='ml-2'
            />
          </div>
        }
        onEdit={() => handleEditField('email')}
      />
    </div>
  );
};

export default GeneralInfo;
