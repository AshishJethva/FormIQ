// src/app/myaccount/page.tsx

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, User } from 'lucide-react';
import { deleteAvatar } from '@/redux/slices/userProfile/userProfileSlice';
import {
  fetchUserProfile,
  updateBasicInfo,
  updateProfileDetails,
  uploadAvatar,
  requestPasswordReset,
  selectUserProfile,
  selectIsLoading,
  clearError,
} from '@/redux/slices/userProfile/userProfileSlice';
import { toast } from 'sonner';
import type { StoreDispatch } from '@/redux/store';
import AccountPageSkeleton from '@/components/skeletons/AccountPageSkeleton';

export default function AccountPage() {
  const router = useRouter();
  const dispatch = useDispatch<StoreDispatch>();

  // Redux state
  const userProfile = useSelector(selectUserProfile);
  const isLoading = useSelector(selectIsLoading);

  const [loadingStates, setLoadingStates] = useState({
    passwordReset: false,
    avatarDelete: false,
    avatarUpload: false,
    resendEmail: false,
  });

  // Local state for edit modes
  const [editMode, setEditMode] = useState<Record<string, boolean>>({
    name: false,
    email: false,
    username: false,
    avatar: false,
    phoneNumber: false,
    website: false,
  });

  // State for form fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    phoneNumber: '',
    website: '',
  });

  // State for password reset
  const [passwordResetSent, setPasswordResetSent] = useState(false);

  // State for avatar upload
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user profile on component mount
  useEffect(() => {
    if (!userProfile) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, userProfile]);

  // Update form data when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.user.name || '',
        email: userProfile.user.email || '',
        username: userProfile.profile.username || '',
        phoneNumber: userProfile.profile.phoneNumber || '',
        website: userProfile.profile.website || '',
      });
    }
  }, [userProfile]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Show skeleton while loading or when no user profile data
  if (!userProfile && isLoading) {
    return <AccountPageSkeleton />;
  }

  // Start edit mode for a field
  const startEditing = (field: keyof typeof editMode) => {
    setEditMode({ ...editMode, [field]: true });
    if (userProfile) {
      const value =
        field === 'name' || field === 'email'
          ? userProfile.user[field] || ''
          : userProfile.profile[field as keyof typeof userProfile.profile] ||
            '';

      setFormData({
        ...formData,
        [field]: typeof value === 'string' ? value : '',
      });
    }
  };

  // Cancel edit mode for a field
  const cancelEditing = (field: keyof typeof editMode) => {
    setEditMode({ ...editMode, [field]: false });
    if (userProfile) {
      const value =
        field === 'name' || field === 'email'
          ? userProfile.user[field] || ''
          : userProfile.profile[field as keyof typeof userProfile.profile] ||
            '';

      setFormData({
        ...formData,
        [field]: typeof value === 'string' ? value : '',
      });
    }
  };

  const handleDeleteAvatar = async () => {
    if (!userProfile?.profile.avatar?.src) return;

    try {
      const confirmed = window.confirm(
        'Are you sure you want to delete your avatar?'
      );
      if (!confirmed) return;

      setLoadingStates(prev => ({ ...prev, avatarDelete: true }));
      await dispatch(deleteAvatar()).unwrap();
      toast.success('Avatar deleted successfully!');
    } catch (error: any) {
      toast.error(error || 'Failed to delete avatar');
    } finally {
      setLoadingStates(prev => ({ ...prev, avatarDelete: false }));
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle save for a field
  const saveField = async (field: keyof typeof formData) => {
    try {
      if (field === 'name' || field === 'email') {
        await dispatch(updateBasicInfo({ [field]: formData[field] })).unwrap();
      } else {
        await dispatch(
          updateProfileDetails({ [field]: formData[field] || null })
        ).unwrap();
      }

      setEditMode({ ...editMode, [field]: false });
      toast.success(
        `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } updated successfully!`
      );
    } catch (error: any) {
      toast.error(error || `Failed to update ${field}`);
    }
  };

  // Handle password reset
  const handleResetPassword = async () => {
    if (!userProfile?.user.email) return;

    try {
      setLoadingStates(prev => ({ ...prev, passwordReset: true }));
      await dispatch(requestPasswordReset(userProfile.user.email)).unwrap();
      setPasswordResetSent(true);
      toast.success('Password reset link sent to your email!');
    } catch (error: any) {
      toast.error(error || 'Failed to send reset email');
    } finally {
      setLoadingStates(prev => ({ ...prev, passwordReset: false }));
    }
  };

  // Handle resend email
  const handleResendEmail = async () => {
    if (!userProfile?.user.email) return;

    try {
      setLoadingStates(prev => ({ ...prev, resendEmail: true }));
      await dispatch(requestPasswordReset(userProfile.user.email)).unwrap();
      toast.success('Password reset link has been resent to your email!');
    } catch (error: any) {
      toast.error(error || 'Failed to resend reset email');
    } finally {
      setLoadingStates(prev => ({ ...prev, resendEmail: false }));
    }
  };

  // Handle cancel password reset
  const handleCancelReset = () => {
    setPasswordResetSent(false);
  };

  // Handle avatar upload trigger
  const handleAvatarUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle avatar upload
  const handleAvatarClick = () => {
    // Only trigger file input if not in edit mode
    if (!editMode.avatar && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Avatar file size must be less than 5MB');
        // Reset the input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        // Reset the input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      setAvatarFile(file);

      const reader = new FileReader();
      reader.onload = event => {
        if (event.target && typeof event.target.result === 'string') {
          setAvatarPreview(event.target.result);
        }
      };
      reader.readAsDataURL(file);
      setEditMode({ ...editMode, avatar: true });
    }
  };

  // Save avatar
  const saveAvatar = async () => {
    if (!avatarFile) return;

    try {
      setLoadingStates(prev => ({ ...prev, avatarUpload: true }));
      await dispatch(uploadAvatar(avatarFile)).unwrap();
      setEditMode({ ...editMode, avatar: false });
      setAvatarPreview(null);
      setAvatarFile(null);

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast.success('Avatar updated successfully!');
    } catch (error: any) {
      toast.error(error || 'Failed to upload avatar');
    } finally {
      setLoadingStates(prev => ({ ...prev, avatarUpload: false }));
    }
  };

  // Cancel avatar upload
  const cancelAvatarUpload = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    setEditMode({ ...editMode, avatar: false });

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle upgrade account
  const handleUpgradeAccount = () => {
    router.push('/myaccount/upgrade');
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  const editFormVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: 'auto',
      transition: { duration: 0.3, ease: 'easeInOut' },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: { duration: 0.2, ease: 'easeInOut' },
    },
  };

  // Show error state if no user profile after loading
  if (!userProfile && !isLoading) {
    return (
      <motion.div
        className='bg-gray-50 min-h-screen w-full py-4 sm:py-10 px-4'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className='max-w-4xl mx-auto bg-white shadow-sm rounded-lg overflow-hidden'>
          <div className='py-4 sm:py-8 px-4 sm:px-10 text-center'>
            <p className='text-gray-500'>
              Failed to load user profile. Please try refreshing the page.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!userProfile && isLoading) {
    return (
      <motion.div
        className='bg-gray-50 min-h-screen w-full py-4 sm:py-10 px-4'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className='max-w-4xl mx-auto bg-white rounded-lg shadow-sm'>
          <div className='animate-pulse'>
            <div className='py-4 sm:py-8 px-4 sm:px-10 border-b border-gray-200'>
              <div className='h-6 sm:h-8 bg-gray-200 rounded w-3/4 sm:w-1/2'></div>
            </div>
            <div className='p-4 sm:p-10 space-y-6'>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className='flex flex-col sm:flex-row sm:items-center py-4 sm:py-6 border-b border-gray-200 space-y-2 sm:space-y-0'
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                >
                  <div className='sm:w-1/3'>
                    <div className='h-4 bg-gray-200 rounded w-20'></div>
                  </div>
                  <div className='sm:w-2/3 flex justify-between items-center'>
                    <div className='h-4 bg-gray-200 rounded w-32'></div>
                    <div className='h-6 bg-gray-200 rounded w-12'></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!userProfile) {
    return (
      <motion.div
        className='bg-gray-50 min-h-screen w-full py-4 sm:py-10 px-4'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className='max-w-4xl mx-auto bg-white shadow-sm rounded-lg overflow-hidden'>
          <div className='py-4 sm:py-8 px-4 sm:px-10 text-center'>
            <p className='text-gray-500'>
              Failed to load user profile. Please try refreshing the page.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className='bg-gray-50 min-h-screen w-full py-4 sm:py-10 px-4'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className='max-w-4xl mx-auto bg-white shadow-sm rounded-lg overflow-hidden'
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <motion.div
          className='py-4 sm:py-8 px-4 sm:px-10 border-b border-gray-200'
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h1 className='text-xl sm:text-2xl font-semibold text-navy-900 mb-1 leading-tight'>
            Update <span className='text-green-600'>Account</span> and General
            Information
          </h1>
        </motion.div>

        <motion.div
          className='divide-y divide-gray-200'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          {/* Account Type */}
          <motion.div
            className='px-4 sm:px-10 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0'
            variants={itemVariants}
          >
            <div className='sm:w-1/3'>
              <h3 className='text-[15px] font-medium text-gray-800'>
                Account Type
              </h3>
            </div>
            <div className='sm:w-2/3 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0'>
              <div className='flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4'>
                <span className='text-[15px] text-gray-800'>
                  {userProfile.profile.plan.type}
                </span>
                <motion.button
                  onClick={handleUpgradeAccount}
                  className='bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer self-start sm:self-auto'
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {userProfile.profile.plan.type === 'STARTER'
                    ? 'Upgrade Account'
                    : 'Manage Plan'}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Username */}
          <motion.div
            className='px-4 sm:px-10 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0'
            variants={itemVariants}
          >
            <div className='sm:w-1/3'>
              <h3 className='text-[15px] font-medium text-gray-800'>
                Username
              </h3>
            </div>
            <div className='sm:w-2/3 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0'>
              <AnimatePresence mode='wait'>
                {editMode.username ? (
                  <motion.div
                    className='flex-grow'
                    variants={editFormVariants}
                    initial='hidden'
                    animate='visible'
                    exit='exit'
                  >
                    <motion.input
                      type='text'
                      name='username'
                      value={formData.username}
                      onChange={handleInputChange}
                      className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                      disabled={isLoading}
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                    <motion.div
                      className='mt-3 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2'
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <motion.button
                        onClick={() => saveField('username')}
                        className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer disabled:opacity-50'
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isLoading ? 'Saving...' : 'Save'}
                      </motion.button>
                      <motion.button
                        onClick={() => cancelEditing('username')}
                        className='bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer'
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cancel
                      </motion.button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    className='w-full flex justify-between items-center'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className='text-[15px] text-gray-800 flex-grow'>
                      {userProfile.profile.username}
                    </div>
                    <motion.button
                      onClick={() => startEditing('username')}
                      className='text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer self-start sm:self-auto'
                      disabled={isLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Edit
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Email */}
          <motion.div
            className='px-4 sm:px-10 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0'
            variants={itemVariants}
          >
            <div className='sm:w-1/3'>
              <h3 className='text-[15px] font-medium text-gray-800'>Email</h3>
            </div>
            <div className='sm:w-2/3 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0'>
              <AnimatePresence mode='wait'>
                {editMode.email ? (
                  <motion.div
                    className='flex-grow'
                    variants={editFormVariants}
                    initial='hidden'
                    animate='visible'
                    exit='exit'
                  >
                    <motion.input
                      type='email'
                      name='email'
                      value={formData.email}
                      onChange={handleInputChange}
                      className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                      disabled={isLoading}
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                    <motion.div
                      className='mt-3 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2'
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <motion.button
                        onClick={() => saveField('email')}
                        className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer disabled:opacity-50'
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isLoading ? 'Saving...' : 'Save'}
                      </motion.button>
                      <motion.button
                        onClick={() => cancelEditing('email')}
                        className='bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer'
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cancel
                      </motion.button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    className='w-full flex justify-between items-center'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className='text-[15px] text-gray-800 flex items-center flex-grow break-all'>
                      <span>{userProfile.user.email}</span>
                    </div>
                    <motion.button
                      onClick={() => startEditing('email')}
                      className='text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer self-start sm:self-auto'
                      disabled={isLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Edit
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Password */}
          <motion.div
            className='px-4 sm:px-10 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0'
            variants={itemVariants}
          >
            <div className='sm:w-1/3'>
              <h3 className='text-[15px] font-medium text-gray-800'>
                Password
              </h3>
            </div>
            <div className='sm:w-2/3'>
              <AnimatePresence mode='wait'>
                {passwordResetSent ? (
                  <motion.div
                    className='bg-blue-50 p-4 rounded-md'
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className='flex items-start'>
                      <div className='flex-shrink-0'>
                        <motion.div
                          initial={{ rotate: -180, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          transition={{ duration: 0.4, delay: 0.1 }}
                        >
                          <Info className='h-5 w-5 text-blue-400 mt-0.5' />
                        </motion.div>
                      </div>
                      <div className='ml-3'>
                        <p className='text-sm text-blue-700'>
                          Your password reset email was sent to{' '}
                          <span className='font-medium break-all'>
                            {userProfile.user.email}
                          </span>
                        </p>
                        <motion.div
                          className='mt-3 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3'
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.2 }}
                        >
                          <motion.button
                            onClick={handleResendEmail}
                            className='text-blue-600 hover:text-blue-800 font-medium cursor-pointer disabled:opacity-50 text-sm'
                            disabled={loadingStates.resendEmail}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {loadingStates.resendEmail
                              ? 'Sending...'
                              : 'Resend Email'}
                          </motion.button>
                          <motion.button
                            onClick={handleCancelReset}
                            className='text-red-600 hover:text-red-800 font-medium cursor-pointer text-sm'
                            disabled={loadingStates.resendEmail}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Cancel
                          </motion.button>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    onClick={handleResetPassword}
                    className='text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer disabled:opacity-50'
                    disabled={loadingStates.passwordReset}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {loadingStates.passwordReset
                      ? 'Sending...'
                      : 'Reset Password'}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Name */}
          <motion.div
            className='px-4 sm:px-10 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0'
            variants={itemVariants}
          >
            <div className='sm:w-1/3'>
              <h3 className='text-[15px] font-medium text-gray-800'>Name</h3>
            </div>
            <div className='sm:w-2/3 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0'>
              <AnimatePresence mode='wait'>
                {editMode.name ? (
                  <motion.div
                    className='flex-grow'
                    variants={editFormVariants}
                    initial='hidden'
                    animate='visible'
                    exit='exit'
                  >
                    <motion.input
                      type='text'
                      name='name'
                      value={formData.name}
                      onChange={handleInputChange}
                      className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                      disabled={isLoading}
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                    <motion.div
                      className='mt-3 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2'
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <motion.button
                        onClick={() => saveField('name')}
                        className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer disabled:opacity-50'
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isLoading ? 'Saving...' : 'Save'}
                      </motion.button>
                      <motion.button
                        onClick={() => cancelEditing('name')}
                        className='bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer'
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cancel
                      </motion.button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    className='w-full flex justify-between items-center'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className='text-[15px] text-gray-800 flex-grow'>
                      {userProfile.user.name}
                    </div>
                    <motion.button
                      onClick={() => startEditing('name')}
                      className='text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer self-start sm:self-auto'
                      disabled={isLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Edit
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Avatar */}
          <motion.div
            className='px-4 sm:px-10 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0'
            variants={itemVariants}
          >
            <div className='sm:w-1/3'>
              <h3 className='text-[15px] font-medium text-gray-800'>Avatar</h3>
            </div>
            <div className='sm:w-2/3 flex flex-col space-y-4'>
              <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0'>
                <div>
                  <div className='flex items-center space-x-4'>
                    <motion.div
                      onClick={handleAvatarClick}
                      className='bg-gray-100 rounded-full p-2 inline-block cursor-pointer hover:bg-gray-200 transition-colors'
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <AnimatePresence mode='wait'>
                        {editMode.avatar && avatarPreview ? (
                          <motion.div
                            key='preview'
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Image
                              src={avatarPreview}
                              alt='Avatar Preview'
                              width={64}
                              height={64}
                              priority
                              className='rounded-full object-cover w-16 h-16'
                            />
                          </motion.div>
                        ) : userProfile.profile.avatar?.src &&
                          userProfile.profile.avatar.src.trim() !== '' ? (
                          <motion.div
                            key='current'
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Image
                              src={userProfile.profile.avatar.src}
                              alt='User Avatar'
                              width={64}
                              height={64}
                              priority
                              className='rounded-full object-cover w-16 h-16'
                            />
                          </motion.div>
                        ) : (
                          <motion.div
                            key='placeholder'
                            className='w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-gray-500'
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.3 }}
                          >
                            <User className='w-8 h-8' />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Show delete button if avatar exists and not in edit mode */}
                    <AnimatePresence>
                      {userProfile.profile.avatar?.src &&
                        userProfile.profile.avatar.src.trim() !== '' &&
                        !editMode.avatar && (
                          <motion.button
                            onClick={handleDeleteAvatar}
                            className='text-red-600 hover:text-red-800 text-sm font-medium cursor-pointer disabled:opacity-50'
                            disabled={loadingStates.avatarDelete}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {loadingStates.avatarDelete
                              ? 'Deleting...'
                              : 'Delete'}
                          </motion.button>
                        )}
                    </AnimatePresence>
                  </div>

                  <input
                    type='file'
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    className='hidden'
                    accept='image/*'
                    disabled={loadingStates.avatarUpload}
                  />

                  <AnimatePresence>
                    {editMode.avatar && avatarPreview && (
                      <motion.div
                        className='mt-3 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2'
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.button
                          onClick={saveAvatar}
                          className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer disabled:opacity-50'
                          disabled={loadingStates.avatarUpload}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {loadingStates.avatarUpload ? 'Uploading...' : 'Save'}
                        </motion.button>
                        <motion.button
                          onClick={cancelAvatarUpload}
                          className='bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer'
                          disabled={loadingStates.avatarUpload}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Cancel
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {!editMode.avatar && (
                  <motion.button
                    onClick={handleAvatarUpload}
                    className='text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer self-start sm:self-auto'
                    disabled={loadingStates.avatarUpload}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {userProfile.profile.avatar?.src &&
                    userProfile.profile.avatar.src.trim() !== ''
                      ? 'Change'
                      : 'Upload'}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Phone Number */}
          <motion.div
            className='px-4 sm:px-10 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0'
            variants={itemVariants}
          >
            <div className='sm:w-1/3'>
              <h3 className='text-[15px] font-medium text-gray-800'>
                Phone Number
              </h3>
            </div>
            <div className='sm:w-2/3 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0'>
              <AnimatePresence mode='wait'>
                {editMode.phoneNumber ? (
                  <motion.div
                    className='flex-grow'
                    variants={editFormVariants}
                    initial='hidden'
                    animate='visible'
                    exit='exit'
                  >
                    <motion.input
                      type='tel'
                      name='phoneNumber'
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder='+1 (555) 123-4567'
                      className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                      disabled={isLoading}
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                    <motion.div
                      className='mt-3 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2'
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <motion.button
                        onClick={() => saveField('phoneNumber')}
                        className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer disabled:opacity-50'
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isLoading ? 'Saving...' : 'Save'}
                      </motion.button>
                      <motion.button
                        onClick={() => cancelEditing('phoneNumber')}
                        className='bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer'
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cancel
                      </motion.button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    className='w-full flex justify-between items-center'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {userProfile.profile.phoneNumber ? (
                      <>
                        <div className='text-[15px] text-gray-800 flex-grow'>
                          {userProfile.profile.phoneNumber}
                        </div>
                        <motion.button
                          onClick={() => startEditing('phoneNumber')}
                          className='text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer self-start sm:self-auto'
                          disabled={isLoading}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Edit
                        </motion.button>
                      </>
                    ) : (
                      <motion.button
                        onClick={() => startEditing('phoneNumber')}
                        className='bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer self-start sm:self-auto'
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Add Phone Number
                      </motion.button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Website */}
          <motion.div
            className='px-4 sm:px-10 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0'
            variants={itemVariants}
          >
            <div className='sm:w-1/3'>
              <h3 className='text-[15px] font-medium text-gray-800'>Website</h3>
            </div>
            <div className='sm:w-2/3 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0'>
              <AnimatePresence mode='wait'>
                {editMode.website ? (
                  <motion.div
                    className='flex-grow'
                    variants={editFormVariants}
                    initial='hidden'
                    animate='visible'
                    exit='exit'
                  >
                    <motion.input
                      type='url'
                      name='website'
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder='https://example.com'
                      className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                      disabled={isLoading}
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                    <motion.div
                      className='mt-3 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2'
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <motion.button
                        onClick={() => saveField('website')}
                        className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer disabled:opacity-50'
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isLoading ? 'Saving...' : 'Save'}
                      </motion.button>
                      <motion.button
                        onClick={() => cancelEditing('website')}
                        className='bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer'
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cancel
                      </motion.button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    className='w-full flex justify-between items-center'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {userProfile.profile.website ? (
                      <>
                        <div className='text-[15px] text-gray-800 flex-grow'>
                          <a
                            href={userProfile.profile.website}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-blue-600 hover:underline break-all'
                          >
                            {userProfile.profile.website}
                          </a>
                        </div>
                        <motion.button
                          onClick={() => startEditing('website')}
                          className='text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer self-start sm:self-auto'
                          disabled={isLoading}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Edit
                        </motion.button>
                      </>
                    ) : (
                      <>
                        <div className='text-[15px] text-gray-500 flex-grow'>
                          -
                        </div>
                        <motion.button
                          onClick={() => startEditing('website')}
                          className='text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer self-start sm:self-auto'
                          disabled={isLoading}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Edit
                        </motion.button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
