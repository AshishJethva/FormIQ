'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { LogOut, Settings, User } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Add this import

interface ProfileDropdownProps {
  userName: string;
  userImage?: string | null;
  planType?: string;
  formsUsed?: number;
  formsTotal?: number;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  userName = 'Ashish Coder',
  userImage = null,
  planType = 'STARTER',
  formsUsed = 2,
  formsTotal = 5,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter(); // Add this line

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Add this navigation handler
  const handleNavigateToProfile = () => {
    router.push('/myaccount');
    setIsOpen(false);
  };

  const handleSettingsClick = () => {
    router.push('/myaccount/settings'); // Update to use router
    setIsOpen(false);
  };

  const handleLogoutClick = () => {
    // Handle logout logic here
    console.log('Logout user');
    // After logout maybe redirect to login
    // router.push('/login');
    setIsOpen(false);
  };

  return (
    <div className='relative' ref={dropdownRef}>
      {/* Profile Icon Button - Updated to handle null userImage */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='rounded-full border-2 border-[#ff6200] focus:outline-none focus:ring-offset-2 focus:ring-offset-[#102035] h-10 w-10 flex items-center justify-center'
      >
        {userImage ? (
          <Image
            src={userImage}
            alt={userName}
            width={40}
            height={40}
            className='rounded-full'
            priority
          />
        ) : (
          <User className='h-6 w-6' />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className='absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg overflow-hidden z-50 animate-in fade-in-20 slide-in-from-top-5 duration-100'>
          {/* User Info Section - Updated to be clickable */}
          <div className='p-4 border-b border-gray-100  hover:bg-gray-50 transition-colors'>
            <div
              className='flex items-center mb-4 cursor-pointer'
              onClick={handleNavigateToProfile}
            >
              {userImage ? (
                <Image
                  src={userImage}
                  alt={userName}
                  width={48}
                  height={48}
                  className='rounded-full mr-3'
                  priority
                />
              ) : (
                <div className='h-12 w-12 border-2 border-[#ff6200] rounded-full mr-3 flex items-center justify-center'>
                  <User className='text-black' />
                </div>
              )}
              <div>
                <p className='text-sm text-gray-600'>Hello,</p>
                <p className='font-semibold text-gray-900'>{userName}</p>
              </div>

              {/* Plan Badge */}
              {planType && (
                <div className='ml-auto'>
                  <span className='bg-green-500 text-white text-xs py-1 px-3 rounded-md font-medium'>
                    {planType}
                  </span>
                </div>
              )}
            </div>

            {/* Forms Usage Meter */}
            {formsTotal > 0 && (
              <div className='mt-3'>
                <div className='flex justify-between text-sm text-gray-600 mb-1'>
                  <span>Forms</span>
                  <span>
                    {formsUsed} of {formsTotal} used
                  </span>
                </div>
                <div className='h-2 bg-gray-200 rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-gradient-to-r from-orange-500 to-orange-400'
                    style={{ width: `${(formsUsed / formsTotal) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Upgrade Banner */}
          <div className='bg-navy-900 text-white py-3 text-center'>
            <button className='w-5/6 bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded transition-colors'>
              Upgrade Your Plan
            </button>
          </div>

          {/* Menu Options */}
          <div className='p-2'>
            <div
              className='flex items-center px-4 py-2.5 hover:bg-gray-100 rounded-md cursor-pointer transition-colors'
              onClick={handleSettingsClick}
            >
              <Settings className='h-5 w-5 text-gray-600 mr-3' />
              <span className='text-gray-800'>Settings</span>
            </div>

            <div
              className='flex items-center px-4 py-2.5 hover:bg-gray-100 rounded-md cursor-pointer transition-colors'
              onClick={handleLogoutClick}
            >
              <LogOut className='h-5 w-5 text-gray-600 mr-3' />
              <span className='text-gray-800'>Logout</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
