'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Info, CheckCircle, X } from 'lucide-react';

interface UserData {
  accountType: string;
  username: string;
  name: string;
  email: string;
  avatar: string | null;
  phoneNumber: string | null;
  website: string | null;
}

export default function AccountPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData>({
    accountType: 'Free',
    username: 'procoder1501',
    name: 'Ashish Coder',
    email: 'procoder1501@gmail.com',
    avatar: null,
    phoneNumber: null,
    website: null,
  });

  // State for edit modes
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
    name: userData.name,
    email: userData.email,
    username: userData.username,
    phoneNumber: userData.phoneNumber || '',
    website: userData.website || '',
  });

  // State for notifications
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info',
  });

  // State for password reset
  const [passwordResetSent, setPasswordResetSent] = useState(false);

  // State for avatar upload
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start edit mode for a field
  const startEditing = (field: keyof typeof editMode) => {
    setEditMode({ ...editMode, [field]: true });
    setFormData({
      ...formData,
      [field]: field in userData ? userData[field as keyof UserData] || '' : '',
    });
  };

  // Cancel edit mode for a field
  const cancelEditing = (field: keyof typeof editMode) => {
    setEditMode({ ...editMode, [field]: false });
    setFormData({
      ...formData,
      [field]: field in userData ? userData[field as keyof UserData] || '' : '',
    });
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
  const saveField = (field: keyof typeof userData) => {
    // In a real app, you would send this to your API
    setUserData({
      ...userData,
      [field]: formData[field as keyof typeof formData],
    });
    setEditMode({ ...editMode, [field]: false });

    // Show success notification
    showNotification(
      `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`,
      'success'
    );
  };

  // Handle password reset
  const handleResetPassword = () => {
    // In a real app, you would call your API to send a reset email
    setPasswordResetSent(true);
    showNotification('Password reset link sent to your email!', 'success');
  };

  // Handle resend email
  const handleResendEmail = () => {
    showNotification(
      'Password reset link has been resent to your email!',
      'success'
    );
  };

  // Handle cancel password reset
  const handleCancelReset = () => {
    setPasswordResetSent(false);
  };

  // Handle avatar upload
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
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
  const saveAvatar = () => {
    if (avatarPreview) {
      // In a real app, you would upload the file to your storage
      setUserData({
        ...userData,
        avatar: avatarPreview,
      });
      setEditMode({ ...editMode, avatar: false });
      showNotification('Avatar updated successfully!', 'success');
    }
  };

  // Cancel avatar upload
  const cancelAvatarUpload = () => {
    setAvatarPreview(null);
    setEditMode({ ...editMode, avatar: false });
  };

  // Handle upgrade account
  const handleUpgradeAccount = () => {
    router.push('/myaccount/upgrade');
  };

  // Show notification
  const showNotification = (
    message: string,
    type: 'success' | 'error' | 'info'
  ) => {
    setNotification({
      show: true,
      message,
      type,
    });

    // Auto hide after 5 seconds
    setTimeout(() => {
      setNotification({
        show: false,
        message: '',
        type: 'info',
      });
    }, 5000);
  };

  // Close notification
  const closeNotification = () => {
    setNotification({
      show: false,
      message: '',
      type: 'info',
    });
  };

  return (
    <div className='bg-gray-50 min-h-screen w-full py-10 px-4'>
      {/* Notification */}
      {notification.show && (
        <div
          className={`fixed top-5 right-5 max-w-md py-4 px-6 rounded-lg shadow-lg flex items-center justify-between z-50 transition-all transform ${
            notification.type === 'success'
              ? 'bg-green-50 border-l-4 border-green-500 text-green-700'
              : notification.type === 'error'
              ? 'bg-red-50 border-l-4 border-red-500 text-red-700'
              : 'bg-blue-50 border-l-4 border-blue-500 text-blue-700'
          }`}
        >
          <div className='flex items-center'>
            {notification.type === 'success' && (
              <CheckCircle className='h-5 w-5 mr-3' />
            )}
            {notification.type === 'error' && <X className='h-5 w-5 mr-3' />}
            {notification.type === 'info' && <Info className='h-5 w-5 mr-3' />}
            <p>{notification.message}</p>
          </div>
          <button
            onClick={closeNotification}
            className='ml-4 text-gray-500 hover:text-gray-700'
          >
            <X className='h-4 w-4' />
          </button>
        </div>
      )}

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
                  {userData.accountType}
                </span>
                <button
                  onClick={handleUpgradeAccount}
                  className='bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors'
                >
                  Upgrade Account
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
                  />
                  <div className='mt-3 flex space-x-2'>
                    <button
                      onClick={() => saveField('username')}
                      className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm font-medium transition-colors'
                    >
                      Save
                    </button>
                    <button
                      onClick={() => cancelEditing('username')}
                      className='bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1 rounded text-sm font-medium transition-colors'
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className='text-[15px] text-gray-800'>
                    {userData.username}
                  </div>
                  <button
                    onClick={() => startEditing('username')}
                    className='text-blue-600 hover:text-blue-800 text-sm font-medium'
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
                  />
                  <div className='mt-3 flex space-x-2'>
                    <button
                      onClick={() => saveField('email')}
                      className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm font-medium transition-colors'
                    >
                      Save
                    </button>
                    <button
                      onClick={() => cancelEditing('email')}
                      className='bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1 rounded text-sm font-medium transition-colors'
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className='text-[15px] text-gray-800 flex items-center'>
                    <span>{userData.email}</span>
                  </div>
                  <button
                    onClick={() => startEditing('email')}
                    className='text-blue-600 hover:text-blue-800 text-sm font-medium'
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
                        <span className='font-medium'>{userData.email}</span>
                      </p>
                      <div className='mt-2 text-sm'>
                        <button
                          onClick={handleResendEmail}
                          className='text-blue-600 hover:text-blue-800 font-medium mr-3'
                        >
                          Resend Email
                        </button>
                        <button
                          onClick={handleCancelReset}
                          className='text-red-600 hover:text-red-800 font-medium'
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
                  className='text-blue-600 hover:text-blue-800 text-sm font-medium'
                >
                  Reset Password
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
                  />
                  <div className='mt-3 flex space-x-2'>
                    <button
                      onClick={() => saveField('name')}
                      className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm font-medium transition-colors'
                    >
                      Save
                    </button>
                    <button
                      onClick={() => cancelEditing('name')}
                      className='bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1 rounded text-sm font-medium transition-colors'
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className='text-[15px] text-gray-800'>
                    {userData.name}
                  </div>
                  <button
                    onClick={() => startEditing('name')}
                    className='text-blue-600 hover:text-blue-800 text-sm font-medium'
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
                  ) : userData.avatar ? (
                    <Image
                      src={userData.avatar}
                      alt='Avatar'
                      width={64}
                      height={64}
                      className='rounded-full object-cover w-16 h-16'
                    />
                  ) : (
                    <div className='w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-gray-500'>
                      {userData.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()}
                    </div>
                  )}
                </div>
                <input
                  type='file'
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  className='hidden'
                  accept='image/*'
                />
                {editMode.avatar && avatarPreview && (
                  <div className='mt-3 flex space-x-2'>
                    <button
                      onClick={saveAvatar}
                      className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm font-medium transition-colors'
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelAvatarUpload}
                      className='bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1 rounded text-sm font-medium transition-colors'
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              {!editMode.avatar && (
                <button
                  onClick={() => startEditing('avatar')}
                  className='text-blue-600 hover:text-blue-800 text-sm font-medium'
                >
                  Edit
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
                  />
                  <div className='mt-3 flex space-x-2'>
                    <button
                      onClick={() => saveField('phoneNumber')}
                      className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm font-medium transition-colors'
                    >
                      Save
                    </button>
                    <button
                      onClick={() => cancelEditing('phoneNumber')}
                      className='bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1 rounded text-sm font-medium transition-colors'
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {userData.phoneNumber ? (
                    <>
                      <div className='text-[15px] text-gray-800'>
                        {userData.phoneNumber}
                      </div>
                      <button
                        onClick={() => startEditing('phoneNumber')}
                        className='text-blue-600 hover:text-blue-800 text-sm font-medium'
                      >
                        Edit
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEditing('phoneNumber')}
                      className='bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors'
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
                  />
                  <div className='mt-3 flex space-x-2'>
                    <button
                      onClick={() => saveField('website')}
                      className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm font-medium transition-colors'
                    >
                      Save
                    </button>
                    <button
                      onClick={() => cancelEditing('website')}
                      className='bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1 rounded text-sm font-medium transition-colors'
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {userData.website ? (
                    <>
                      <div className='text-[15px] text-gray-800'>
                        <a
                          href={userData.website}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-blue-600 hover:underline'
                        >
                          {userData.website}
                        </a>
                      </div>
                      <button
                        onClick={() => startEditing('website')}
                        className='text-blue-600 hover:text-blue-800 text-sm font-medium'
                      >
                        Edit
                      </button>
                    </>
                  ) : (
                    <>
                      <div className='text-[15px] text-gray-500'>-</div>
                      <button
                        onClick={() => startEditing('website')}
                        className='text-blue-600 hover:text-blue-800 text-sm font-medium'
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
