// src/app/myaccount/page.tsx

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
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

export default function AccountPage() {
  const router = useRouter();
  const dispatch = useDispatch<StoreDispatch>();

  // Redux state
  const userProfile = useSelector(selectUserProfile);
  const isLoading = useSelector(selectIsLoading);

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

      await dispatch(deleteAvatar()).unwrap();
      toast.success('Avatar deleted successfully!');
    } catch (error: any) {
      toast.error(error || 'Failed to delete avatar');
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
      await dispatch(requestPasswordReset(userProfile.user.email)).unwrap();
      setPasswordResetSent(true);
      toast.success('Password reset link sent to your email!');
    } catch (error: any) {
      toast.error(error || 'Failed to send reset email');
    }
  };

  // Handle resend email
  const handleResendEmail = async () => {
    if (!userProfile?.user.email) return;

    try {
      await dispatch(requestPasswordReset(userProfile.user.email)).unwrap();
      toast.success('Password reset link has been resent to your email!');
    } catch (error: any) {
      toast.error(error || 'Failed to resend reset email');
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

  if (!userProfile && isLoading) {
    return (
      <div className='bg-gray-50 min-h-screen w-full py-10 px-4'>
        <div className='max-w-4xl mx-auto bg-white shadow-sm rounded-lg overflow-hidden'>
          <div className='animate-pulse'>
            <div className='py-8 px-10 border-b border-gray-200'>
              <div className='h-8 bg-gray-200 rounded w-1/2'></div>
            </div>
            <div className='p-10 space-y-6'>
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className='flex items-center py-6 border-b border-gray-200'
                >
                  <div className='w-1/3'>
                    <div className='h-4 bg-gray-200 rounded w-20'></div>
                  </div>
                  <div className='w-2/3 flex justify-between items-center'>
                    <div className='h-4 bg-gray-200 rounded w-32'></div>
                    <div className='h-6 bg-gray-200 rounded w-12'></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className='bg-gray-50 min-h-screen w-full py-10 px-4'>
        <div className='max-w-4xl mx-auto bg-white shadow-sm rounded-lg overflow-hidden'>
          <div className='py-8 px-10 text-center'>
            <p className='text-gray-500'>
              Failed to load user profile. Please try refreshing the page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-gray-50 min-h-screen w-full py-10 px-4'>
      <div className='max-w-4xl mx-auto bg-white shadow-sm rounded-lg overflow-hidden'>
        <div className='py-8 px-10 border-b border-gray-200'>
          <h1 className='text-2xl font-semibold text-navy-900 mb-1'>
            Update <span className='text-green-600'>Account</span> and General
            Information
          </h1>
        </div>

        <div className='divide-y divide-gray-200'>
          {/* Account Type */}
          <div className='px-10 py-6 flex items-center'>
            <div className='w-1/3'>
              <h3 className='text-[15px] font-medium text-gray-800'>
                Account Type
              </h3>
            </div>
            <div className='w-2/3 flex justify-between items-center'>
              <div className='flex items-center'>
                <span className='text-[15px] text-gray-800 mr-4'>
                  {userProfile.profile.plan.type}
                </span>
                <button
                  onClick={handleUpgradeAccount}
                  className='bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer'
                  disabled={isLoading}
                >
                  {userProfile.profile.plan.type === 'STARTER'
                    ? 'Upgrade Account'
                    : 'Manage Plan'}
                </button>
              </div>
            </div>
          </div>

          {/* Username */}
          <div className='px-10 py-6 flex items-center'>
            <div className='w-1/3'>
              <h3 className='text-[15px] font-medium text-gray-800'>
                Username
              </h3>
            </div>
            <div className='w-2/3 flex justify-between items-center'>
              {editMode.username ? (
                <div className='flex-grow'>
                  <input
                    type='text'
                    name='username'
                    value={formData.username}
                    onChange={handleInputChange}
                    className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                    disabled={isLoading}
                  />
                  <div className='mt-3 flex space-x-2'>
                    <button
                      onClick={() => saveField('username')}
                      className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm font-medium transition-colors cursor-pointer disabled:opacity-50'
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => cancelEditing('username')}
                      className='bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1 rounded text-sm font-medium transition-colors cursor-pointer'
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className='text-[15px] text-gray-800'>
                    {userProfile.profile.username}
                  </div>
                  <button
                    onClick={() => startEditing('username')}
                    className='text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer'
                    disabled={isLoading}
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Email */}
          <div className='px-10 py-6 flex items-center'>
            <div className='w-1/3'>
              <h3 className='text-[15px] font-medium text-gray-800'>Email</h3>
            </div>
            <div className='w-2/3 flex justify-between items-center'>
              {editMode.email ? (
                <div className='flex-grow'>
                  <input
                    type='email'
                    name='email'
                    value={formData.email}
                    onChange={handleInputChange}
                    className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                    disabled={isLoading}
                  />
                  <div className='mt-3 flex space-x-2'>
                    <button
                      onClick={() => saveField('email')}
                      className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm font-medium transition-colors cursor-pointer disabled:opacity-50'
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => cancelEditing('email')}
                      className='bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1 rounded text-sm font-medium transition-colors cursor-pointer'
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className='text-[15px] text-gray-800 flex items-center'>
                    <span>{userProfile.user.email}</span>
                  </div>
                  <button
                    onClick={() => startEditing('email')}
                    className='text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer'
                    disabled={isLoading}
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Password */}
          <div className='px-10 py-6 flex items-center'>
            <div className='w-1/3'>
              <h3 className='text-[15px] font-medium text-gray-800'>
                Password
              </h3>
            </div>
            <div className='w-2/3'>
              {passwordResetSent ? (
                <div className='bg-blue-50 p-4 rounded-md'>
                  <div className='flex items-start'>
                    <div className='flex-shrink-0'>
                      <Info className='h-5 w-5 text-blue-400' />
                    </div>
                    <div className='ml-3'>
                      <p className='text-sm text-blue-700'>
                        Your password reset email was sent to{' '}
                        <span className='font-medium'>
                          {userProfile.user.email}
                        </span>
                      </p>
                      <div className='mt-2 text-sm'>
                        <button
                          onClick={handleResendEmail}
                          className='text-blue-600 hover:text-blue-800 font-medium mr-3 cursor-pointer disabled:opacity-50'
                          disabled={isLoading}
                        >
                          {isLoading ? 'Sending...' : 'Resend Email'}
                        </button>
                        <button
                          onClick={handleCancelReset}
                          className='text-red-600 hover:text-red-800 font-medium cursor-pointer'
                          disabled={isLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleResetPassword}
                  className='text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer disabled:opacity-50'
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Reset Password'}
                </button>
              )}
            </div>
          </div>

          {/* Name */}
          <div className='px-10 py-6 flex items-center'>
            <div className='w-1/3'>
              <h3 className='text-[15px] font-medium text-gray-800'>Name</h3>
            </div>
            <div className='w-2/3 flex justify-between items-center'>
              {editMode.name ? (
                <div className='flex-grow'>
                  <input
                    type='text'
                    name='name'
                    value={formData.name}
                    onChange={handleInputChange}
                    className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                    disabled={isLoading}
                  />
                  <div className='mt-3 flex space-x-2'>
                    <button
                      onClick={() => saveField('name')}
                      className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm font-medium transition-colors cursor-pointer disabled:opacity-50'
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => cancelEditing('name')}
                      className='bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1 rounded text-sm font-medium transition-colors cursor-pointer'
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className='text-[15px] text-gray-800'>
                    {userProfile.user.name}
                  </div>
                  <button
                    onClick={() => startEditing('name')}
                    className='text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer'
                    disabled={isLoading}
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Avatar */}
          <div className='px-10 py-6 flex items-center'>
            <div className='w-1/3'>
              <h3 className='text-[15px] font-medium text-gray-800'>Avatar</h3>
            </div>
            <div className='w-2/3 flex justify-between items-center'>
              <div>
                <div className='flex items-center space-x-4'>
                  <div
                    onClick={handleAvatarClick}
                    className='bg-gray-100 rounded-full p-2 inline-block cursor-pointer hover:bg-gray-200 transition-colors'
                  >
                    {editMode.avatar && avatarPreview ? (
                      <Image
                        src={avatarPreview}
                        alt='Avatar Preview'
                        width={64}
                        height={64}
                        className='rounded-full object-cover w-16 h-16'
                      />
                    ) : userProfile.profile.avatar?.src &&
                      userProfile.profile.avatar.src.trim() !== '' ? (
                      <Image
                        src={userProfile.profile.avatar.src}
                        alt='User Avatar'
                        width={64}
                        height={64}
                        className='rounded-full object-cover w-16 h-16'
                      />
                    ) : (
                      <div className='w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-gray-500'>
                        <User className='w-8 h-8' />
                      </div>
                    )}
                  </div>

                  {/* Show delete button if avatar exists and not in edit mode */}
                  {userProfile.profile.avatar?.src &&
                    userProfile.profile.avatar.src.trim() !== '' &&
                    !editMode.avatar && (
                      <button
                        onClick={handleDeleteAvatar}
                        className='text-red-600 hover:text-red-800 text-sm font-medium cursor-pointer disabled:opacity-50'
                        disabled={isLoading}
                      >
                        {isLoading ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                </div>

                <input
                  type='file'
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  className='hidden'
                  accept='image/*'
                  disabled={isLoading}
                />

                {editMode.avatar && avatarPreview && (
                  <div className='mt-3 flex space-x-2'>
                    <button
                      onClick={saveAvatar}
                      className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm font-medium transition-colors cursor-pointer disabled:opacity-50'
                      disabled={isLoading}
                    >
                      {isLoading ? 'Uploading...' : 'Save'}
                    </button>
                    <button
                      onClick={cancelAvatarUpload}
                      className='bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1 rounded text-sm font-medium transition-colors cursor-pointer'
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {!editMode.avatar && (
                <button
                  onClick={handleAvatarUpload}
                  className='text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer'
                  disabled={isLoading}
                >
                  {userProfile.profile.avatar?.src &&
                  userProfile.profile.avatar.src.trim() !== ''
                    ? 'Change'
                    : 'Upload'}
                </button>
              )}
            </div>
          </div>

          {/* Phone Number */}
          <div className='px-10 py-6 flex items-center'>
            <div className='w-1/3'>
              <h3 className='text-[15px] font-medium text-gray-800'>
                Phone Number
              </h3>
            </div>
            <div className='w-2/3 flex justify-between items-center'>
              {editMode.phoneNumber ? (
                <div className='flex-grow'>
                  <input
                    type='tel'
                    name='phoneNumber'
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder='+1 (555) 123-4567'
                    className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                    disabled={isLoading}
                  />
                  <div className='mt-3 flex space-x-2'>
                    <button
                      onClick={() => saveField('phoneNumber')}
                      className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm font-medium transition-colors cursor-pointer disabled:opacity-50'
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => cancelEditing('phoneNumber')}
                      className='bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1 rounded text-sm font-medium transition-colors cursor-pointer'
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {userProfile.profile.phoneNumber ? (
                    <>
                      <div className='text-[15px] text-gray-800'>
                        {userProfile.profile.phoneNumber}
                      </div>
                      <button
                        onClick={() => startEditing('phoneNumber')}
                        className='text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer'
                        disabled={isLoading}
                      >
                        Edit
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEditing('phoneNumber')}
                      className='bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer'
                      disabled={isLoading}
                    >
                      Add Phone Number
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Website */}
          <div className='px-10 py-6 flex items-center'>
            <div className='w-1/3'>
              <h3 className='text-[15px] font-medium text-gray-800'>Website</h3>
            </div>
            <div className='w-2/3 flex justify-between items-center'>
              {editMode.website ? (
                <div className='flex-grow'>
                  <input
                    type='url'
                    name='website'
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder='https://example.com'
                    className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                    disabled={isLoading}
                  />
                  <div className='mt-3 flex space-x-2'>
                    <button
                      onClick={() => saveField('website')}
                      className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm font-medium transition-colors cursor-pointer disabled:opacity-50'
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => cancelEditing('website')}
                      className='bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1 rounded text-sm font-medium transition-colors cursor-pointer'
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {userProfile.profile.website ? (
                    <>
                      <div className='text-[15px] text-gray-800'>
                        <a
                          href={userProfile.profile.website}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-blue-600 hover:underline'
                        >
                          {userProfile.profile.website}
                        </a>
                      </div>
                      <button
                        onClick={() => startEditing('website')}
                        className='text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer'
                        disabled={isLoading}
                      >
                        Edit
                      </button>
                    </>
                  ) : (
                    <>
                      <div className='text-[15px] text-gray-500'>-</div>
                      <button
                        onClick={() => startEditing('website')}
                        className='text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer'
                        disabled={isLoading}
                      >
                        Edit
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
