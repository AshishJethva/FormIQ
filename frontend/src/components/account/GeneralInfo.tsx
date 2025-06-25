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
  return (
    <div className='w-full px-4 lg:px-0'>
      <EditField
        label='Account Type'
        value={
          <div className='flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0'>
            <span className='lg:mr-4 text-sm lg:text-base'>
              {userData.accountType}
            </span>
            <button className='bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-sm hover:shadow-md w-fit'>
              Upgrade Account
            </button>
          </div>
        }
        showEdit={false}
      />

      <EditField label='Username' value={userData.username} />

      <EditField
        label='Password'
        value={
          <button className='text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer transition-colors'>
            Reset Password
          </button>
        }
        showEdit={false}
      />

      <EditField label='Name' value={userData.name} />

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
                priority
                className='rounded-lg shadow-sm mr-3 object-cover'
              />
            ) : (
              <div className='h-12 w-12 lg:h-16 lg:w-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center mr-3 shadow-sm'>
                <User className='h-6 w-6 lg:h-10 lg:w-10 text-gray-500' />
              </div>
            )}
          </div>
        }
      />

      <EditField
        label='Phone Number'
        value={
          userData.phoneNumber || (
            <button className='bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-sm hover:shadow-md w-fit'>
              Add Phone Number
            </button>
          )
        }
      />

      <EditField
        label='Website'
        value={
          userData.website ? (
            <a
              href={userData.website}
              target='_blank'
              rel='noopener noreferrer'
              className='text-blue-600 hover:text-blue-800 underline transition-colors break-all'
            >
              {userData.website}
            </a>
          ) : (
            <span className='text-gray-500'>-</span>
          )
        }
      />

      <EditField
        label='Email'
        value={
          <div className='flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0'>
            <span className='break-all'>{userData.email}</span>
            <div className='lg:ml-3 flex items-center'>
              <Image
                src='https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg'
                alt='Google'
                width={20}
                height={20}
                className='w-5 h-5'
                priority
              />
              <span className='ml-1 text-xs text-gray-500'>Google Account</span>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default GeneralInfo;
