// src/components/form-builder/navigation/FormBuilderHeader.tsx
'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFormTitle } from '@/redux/slices/formBuilderSlice';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import LOGO from '@/../public/Logo.png';
import { formatTime } from '@/lib/utils';
import Link from 'next/link';
import ProfileDropdown from '@/components/dashboard/ProfileDropdown';
import { RootState } from '@/redux/store';

interface FormBuilderHeaderProps {
  title: string;
  lastSaved: string;
}

interface User {
  name?: string;
  profileImage?: string | null;
  subscription?: {
    plan?: string;
  };
  formsUsed?: number;
  formsTotal?: number;
}

interface UserState {
  user: User | null;
  token: string | null;
}

export default function FormBuilderHeader({
  title,
  lastSaved,
}: FormBuilderHeaderProps) {
  const dispatch = useDispatch();
  const [titleValue, setTitleValue] = useState(title);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleValue(e.target.value);
  };

  const handleTitleBlur = () => {
    if (titleValue.trim()) {
      dispatch(setFormTitle(titleValue.trim()));
    } else {
      setTitleValue(title); // Reset to original if empty
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
    }
  };
  const { user } = useSelector((state: RootState) => state.user as UserState);

  return (
    <header className='flex justify-between items-center px-6 py-3 bg-white border-b border-gray-200 z-30'>
      {/* Left Side - Logo and Form Builder Text */}
      <div className='flex items-center space-x-4'>
        <Link href='/dashboard' className='flex items-center cursor-pointer'>
          <Image src={LOGO} alt='LOGO' width={33} height={33} />
          <span className='ml-4 text-3xl font-bold text-gray-900 '>FormIQ</span>
        </Link>

        <div className='border border-[#e3e5f5] h-5'></div>
        <div className='relative '>
          <span className='text-gray-700 text-md font-medium mr-2 '>
            Form Builder
          </span>
        </div>
      </div>

      {/* Center - Form Title */}
      <div className='flex-1 text-center max-w-xl mr-65'>
        <div className='flex flex-col items-center -my-2 '>
          <Input
            autoFocus
            value={titleValue}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className='text-4xl font-semibold w-full max-w-xs text-center border-none bg-transparent shadow-none focus-visible:ring-0 focus:outline-none'
            style={{ fontSize: '20px' }}
          />

          <p className='text-sm text-[#78BB08] mt-[-4] mb-2'>
            All changes saved at {formatTime(lastSaved)}{' '}
            <span className='text-[#78BB08] ml-1'>✓</span>
          </p>
        </div>
      </div>

      {/* Right Side - Action Buttons */}
      <div className='flex items-center space-x-2'>
        <ProfileDropdown
          userName={user?.name || 'User'}
          userImage={user?.profileImage || null}
          planType={user?.subscription?.plan || 'STARTER'}
          formsUsed={user?.formsUsed || 0}
          formsTotal={user?.formsTotal || 5}
        />
      </div>
    </header>
  );
}
