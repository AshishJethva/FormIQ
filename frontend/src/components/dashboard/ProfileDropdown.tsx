// src/components/dashboard/ProfileDropdown.tsx

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { LogOut, Settings, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { logoutUser } from '@/redux/slices/auth/userSlice';
import {
  selectUserProfile,
  fetchUserProfile,
} from '@/redux/slices/userProfile/userProfileSlice';
import { toast } from 'sonner';
import type { StoreDispatch, RootState } from '@/redux/store';

const ProfileDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const dispatch = useDispatch<StoreDispatch>();

  // Get user profile from Redux
  const userProfile = useSelector(selectUserProfile);
  const isLoading = useSelector(
    (state: RootState) => state.userProfile.isLoading
  );

  // Fetch user profile on component mount
  useEffect(() => {
    if (!userProfile && !isLoading) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, userProfile, isLoading]);

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

  const handleNavigateToProfile = () => {
    router.push('/myaccount');
    setIsOpen(false);
  };

  const handleSettingsClick = () => {
    router.push('/myaccount/settings');
    setIsOpen(false);
  };

  const handleLogoutClick = async () => {
    try {
      setIsLoggingOut(true);
      await dispatch(logoutUser());
      toast.success('Logged out successfully');
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('There was a problem logging out');
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false);
    }
  };

  // Default values if profile is not loaded
  const userName = userProfile?.user.name || 'User';
  const userImage =
    userProfile?.profile.avatar?.src &&
    userProfile.profile.avatar.src.trim() !== ''
      ? userProfile.profile.avatar.src
      : null;
  const planType = userProfile?.profile.plan.type || 'STARTER';
  const formsUsed = userProfile?.profile.plan.formsUsed || 0;
  const formsTotal = userProfile?.profile.plan.formsLimit || 5;
  const canCreateForms = userProfile?.profile.plan.canCreateForms ?? true;

  return (
    <div className='relative' ref={dropdownRef}>
      {/* Profile Icon Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className='rounded-full border-2 focus:outline-none focus:ring-offset-2 focus:ring-offset-[#102035] h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center cursor-pointer'
        aria-label='Open profile menu'
      >
        {userImage ? (
          <Image
            src={userImage}
            alt={userName}
            width={40}
            height={40}
            className='rounded-full object-cover h-full w-full'
            priority
          />
        ) : (
          <User className='h-4 w-4 sm:h-6 sm:w-6' />
        )}
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className='absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg overflow-hidden z-50'
          >
            {/* User Info Section */}
            <motion.div
              whileHover={{ backgroundColor: '#f9fafb' }}
              className='p-4 border-b border-gray-100 transition-colors'
            >
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
                    className='rounded-full mr-3 object-cover'
                    priority
                  />
                ) : (
                  <div className='h-12 w-12 border-2 border-[#102035] rounded-full mr-3 flex items-center justify-center'>
                    <User className='text-[#102035]' />
                  </div>
                )}
                <div>
                  <p className='text-sm text-gray-600'>Hello,</p>
                  <p className='font-semibold text-gray-900'>{userName}</p>
                </div>

                {/* Plan Badge */}
                <div className='ml-auto'>
                  <span
                    className={`text-white text-xs py-1 px-3 rounded-md font-medium ${
                      planType === 'STARTER'
                        ? 'bg-gray-500'
                        : planType === 'BRONZE'
                        ? 'bg-orange-500'
                        : planType === 'SILVER'
                        ? 'bg-blue-500'
                        : 'bg-yellow-500'
                    }`}
                  >
                    {planType}
                  </span>
                </div>
              </div>

              {/* Forms Usage Meter */}
              <div className='mt-3'>
                <div className='flex justify-between text-sm text-gray-600 mb-1'>
                  <span>Forms</span>
                  <span>
                    {formsUsed} of {formsTotal} used
                  </span>
                </div>
                <div className='h-2 bg-gray-200 rounded-full overflow-hidden'>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(
                        (formsUsed / formsTotal) * 100,
                        100
                      )}%`,
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full ${
                      formsUsed / formsTotal >= 0.9
                        ? 'bg-gradient-to-r from-red-500 to-red-400'
                        : formsUsed / formsTotal >= 0.7
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                        : 'bg-gradient-to-r from-orange-500 to-orange-400'
                    }`}
                  ></motion.div>
                </div>
                {!canCreateForms && (
                  <p className='text-xs text-red-600 mt-1'>
                    Form limit reached. Upgrade to create more forms.
                  </p>
                )}
              </div>
            </motion.div>

            {/* Upgrade Banner */}
            <div className='text-white py-3 text-center'>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  router.push('/myaccount/upgrade');
                  setIsOpen(false);
                }}
                className='w-5/6 bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded transition-colors cursor-pointer'
              >
                {planType === 'STARTER' ? 'Upgrade Your Plan' : 'Manage Plan'}
              </motion.button>
            </div>

            {/* Menu Options */}
            <div className='p-2'>
              <motion.div
                whileHover={{ backgroundColor: '#f3f4f6' }}
                className='flex items-center px-4 py-2.5 rounded-md cursor-pointer transition-colors'
                onClick={handleSettingsClick}
              >
                <Settings className='h-5 w-5 text-gray-600 mr-3' />
                <span className='text-gray-800'>Settings</span>
              </motion.div>

              <motion.div
                whileHover={{ backgroundColor: '#f3f4f6' }}
                className={`flex items-center px-4 py-2.5 rounded-md cursor-pointer transition-colors ${
                  isLoggingOut ? 'opacity-70 pointer-events-none' : ''
                }`}
                onClick={handleLogoutClick}
              >
                <LogOut className='h-5 w-5 text-gray-600 mr-3' />
                <span className='text-gray-800'>
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileDropdown;
