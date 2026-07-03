'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronDown,
  Globe,
  Bell,
  Mail,
  RefreshCw,
  Save,
} from 'lucide-react';
import {
  fetchUserProfile,
  fetchUserSettings,
  updateUserSettings,
  selectUserProfile,
  selectUserSettings,
  selectIsSettingsLoading,
  selectSettingsError,
  clearSettingsError,
} from '@/redux/slices/userProfile/userProfileSlice';
import { toast } from 'sonner';
import type { StoreDispatch } from '@/redux/store';

// Define types for our settings data
interface SettingsData {
  timezone: string;
  language: string;
  darkMode: boolean;
  notifications: {
    email: boolean;
    browser: boolean;
    mobile: boolean;
  };
  emailPreferences: {
    updates: boolean;
    marketing: boolean;
    newsletter: boolean;
  };
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4 },
  },
};

const toggleVariants = {
  off: { x: 2 },
  on: { x: 24 },
};

const dropdownVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.2 },
  },
  visible: {
    opacity: 1,
    height: 'auto',
    transition: { duration: 0.3 },
  },
};

export default function SettingsPage() {
  const dispatch = useDispatch<StoreDispatch>();

  // Redux state
  const userProfile = useSelector(selectUserProfile);
  const userSettings = useSelector(selectUserSettings);
  const isLoading = useSelector(selectIsSettingsLoading);
  const error = useSelector(selectSettingsError);

  // State for settings data
  const [settings, setSettings] = useState<SettingsData>({
    timezone: 'Asia/Kolkata',
    language: 'English',
    darkMode: false,
    notifications: {
      email: true,
      browser: true,
      mobile: false,
    },
    emailPreferences: {
      updates: true,
      marketing: false,
      newsletter: true,
    },
  });

  // State for edit modes
  const [editMode, setEditMode] = useState({
    timezone: false,
    language: false,
  });

  // Available timezone options
  const timezones = [
    { value: 'Asia/Kolkata', label: 'Indian Standard Time (IST)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
    { value: 'Europe/Paris', label: 'Central European Time (CET)' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  ];

  // Available language options
  const languages = [
    { value: 'English', label: 'English' },
    { value: 'Hindi', label: 'Hindi' },
    { value: 'Spanish', label: 'Spanish' },
    { value: 'French', label: 'French' },
    { value: 'German', label: 'German' },
    { value: 'Chinese', label: 'Chinese' },
    { value: 'Japanese', label: 'Japanese' },
  ];

  // Fetch settings on component mount
  useEffect(() => {
    if (!userProfile) {
      dispatch(fetchUserProfile());
    }
    if (!userSettings) {
      dispatch(fetchUserSettings());
    }
  }, [dispatch, userProfile, userSettings]);

  // Update local settings when Redux settings change
  useEffect(() => {
    if (userSettings) {
      setSettings({
        timezone: userSettings.timezone,
        language: userSettings.language,
        darkMode: userSettings.darkMode,
        notifications: userSettings.notifications,
        emailPreferences: userSettings.emailPreferences,
      });
    }
  }, [userSettings]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearSettingsError());
    };
  }, [dispatch]);

  // Handle toggling dark mode
  const handleToggleDarkMode = async () => {
    const newDarkMode = !settings.darkMode;
    const newSettings = { ...settings, darkMode: newDarkMode };
    setSettings(newSettings);

    try {
      await dispatch(updateUserSettings({ darkMode: newDarkMode })).unwrap();
    } catch (error: any) {
      // Revert on error
      setSettings(settings);
      toast.error(error || 'Failed to update dark mode setting');
    }
  };

  // Handle toggling notification settings
  const handleToggleNotification = async (
    type: keyof typeof settings.notifications
  ) => {
    const newNotifications = {
      ...settings.notifications,
      [type]: !settings.notifications[type],
    };
    const newSettings = { ...settings, notifications: newNotifications };
    setSettings(newSettings);

    try {
      await dispatch(
        updateUserSettings({ notifications: newNotifications })
      ).unwrap();
    } catch (error: any) {
      // Revert on error
      setSettings(settings);
      toast.error(error || `Failed to update ${type} notification setting`);
    }
  };

  // Handle toggling email preferences
  const handleToggleEmailPreference = async (
    type: keyof typeof settings.emailPreferences
  ) => {
    const newEmailPreferences = {
      ...settings.emailPreferences,
      [type]: !settings.emailPreferences[type],
    };
    const newSettings = { ...settings, emailPreferences: newEmailPreferences };
    setSettings(newSettings);

    try {
      await dispatch(
        updateUserSettings({ emailPreferences: newEmailPreferences })
      ).unwrap();
    } catch (error: any) {
      // Revert on error
      setSettings(settings);
      toast.error(error || `Failed to update ${type} email preference`);
    }
  };

  // Handle editing timezone
  const handleTimezoneEdit = () => {
    setEditMode({ ...editMode, timezone: true });
  };

  // Handle editing language
  const handleLanguageEdit = () => {
    setEditMode({ ...editMode, language: true });
  };

  // Handle selecting timezone
  const handleTimezoneSelect = async (timezone: string) => {
    const newSettings = { ...settings, timezone };
    setSettings(newSettings);
    setEditMode({ ...editMode, timezone: false });

    try {
      await dispatch(updateUserSettings({ timezone })).unwrap();
    } catch (error: any) {
      // Revert on error
      setSettings(settings);
      toast.error(error || 'Failed to update timezone');
    }
  };

  // Handle selecting language
  const handleLanguageSelect = async (language: string) => {
    const newSettings = { ...settings, language };
    setSettings(newSettings);
    setEditMode({ ...editMode, language: false });

    try {
      await dispatch(updateUserSettings({ language })).unwrap();
    } catch (error: any) {
      // Revert on error
      setSettings(settings);
      toast.error(error || 'Failed to update language');
    }
  };

  // Handle clearing cache
  const handleClearCache = () => {
    // Clear localStorage cache
    try {
      const keysToKeep = ['token', 'user']; // Keep important data
      const allKeys = Object.keys(localStorage);

      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      // Clear session storage
      sessionStorage.clear();

      toast.success('Cache cleared successfully');
    } catch {
      toast.error('Failed to clear cache');
    }
  };

  // Handle saving all settings
  const handleSaveAll = async () => {
    try {
      await dispatch(updateUserSettings(settings)).unwrap();
      toast.success('All settings saved successfully');
    } catch (error: any) {
      toast.error(error || 'Failed to save settings');
    }
  };

  // Get timezone display name
  const getTimezoneDisplay = (value: string) => {
    const timezone = timezones.find(tz => tz.value === value);
    return timezone ? timezone.label : value;
  };

  // Render a section header
  const renderSectionHeader = (title: string, icon: React.ReactNode) => (
    <motion.div
      variants={itemVariants}
      className='flex items-center mb-4 pb-2 border-b border-gray-200'
    >
      <div className='text-blue-600 mr-2'>{icon}</div>
      <h2 className='text-base sm:text-lg font-medium text-gray-800'>
        {title}
      </h2>
    </motion.div>
  );

  // Render a field
  const renderField = (
    label: string,
    value: React.ReactNode,
    onEdit?: () => void
  ) => (
    <motion.div variants={itemVariants} className='mb-6'>
      <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0'>
        <div className='sm:w-1/3'>
          <h3 className='text-sm sm:text-[15px] font-medium text-gray-800'>
            {label}
          </h3>
        </div>
        <div className='sm:w-2/3 flex justify-between items-center'>
          <div className='text-sm sm:text-[15px] text-gray-800 truncate pr-2'>
            {value}
          </div>
          {onEdit && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onEdit}
              className='text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer disabled:opacity-50 flex-shrink-0'
              disabled={isLoading}
            >
              Edit
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );

  // Render a toggle switch
  const renderToggle = (
    label: string,
    description: string,
    isEnabled: boolean,
    onToggle: () => void
  ) => (
    <motion.div
      variants={itemVariants}
      className='flex items-start justify-between mb-4 gap-4'
    >
      <div className='flex-1 min-w-0'>
        <h3 className='text-sm sm:text-[15px] font-medium text-gray-800'>
          {label}
        </h3>
        <p className='text-xs sm:text-sm text-gray-500 mt-1 break-words'>
          {description}
        </p>
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none disabled:opacity-50 flex-shrink-0 ${
          isEnabled ? 'bg-blue-600' : 'bg-gray-300'
        }`}
        disabled={isLoading}
      >
        <motion.span
          variants={toggleVariants}
          animate={isEnabled ? 'on' : 'off'}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className='inline-block h-4 w-4 transform rounded-full bg-white'
        />
      </motion.button>
    </motion.div>
  );

  // Show loading state
  if (!userSettings && isLoading) {
    return (
      <div className='bg-gray-50 min-h-screen w-full py-4 sm:py-10 px-4'>
        <div className='max-w-4xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden'>
          <div className='animate-pulse'>
            <div className='py-4 sm:py-8 px-4 sm:px-10 border-b border-gray-200'>
              <div className='h-6 sm:h-8 bg-gray-200 rounded w-1/2'></div>
            </div>
            <div className='p-4 sm:p-10 space-y-6 sm:space-y-8'>
              {[...Array(4)].map((_, i) => (
                <div key={i} className='space-y-4'>
                  <div className='h-5 sm:h-6 bg-gray-200 rounded w-1/4'></div>
                  <div className='space-y-3'>
                    {[...Array(3)].map((_, j) => (
                      <div
                        key={j}
                        className='flex items-center justify-between'
                      >
                        <div className='space-y-1 flex-1'>
                          <div className='h-4 bg-gray-200 rounded w-32'></div>
                          <div className='h-3 bg-gray-200 rounded w-48 max-w-full'></div>
                        </div>
                        <div className='h-6 w-11 bg-gray-200 rounded-full flex-shrink-0'></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-gray-50 min-h-screen w-full py-4 sm:py-10 px-4'>
      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className='max-w-4xl mx-auto mb-4'
          >
            <div className='bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded'>
              <div className='flex items-start'>
                <X className='h-5 w-5 mr-2 flex-shrink-0 mt-0.5' />
                <p className='text-sm flex-1'>{error}</p>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => dispatch(clearSettingsError())}
                  className='ml-2 text-red-500 hover:text-red-700 flex-shrink-0'
                >
                  <X className='h-4 w-4' />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={containerVariants}
        initial='hidden'
        animate='visible'
        className='max-w-4xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden'
      >
        <motion.div
          variants={itemVariants}
          className='py-4 sm:py-8 px-4 sm:px-10 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'
        >
          <h1 className='text-xl sm:text-2xl font-semibold text-navy-900'>
            Update Your <span className='text-green-600'>Settings</span>
          </h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSaveAll}
            className='flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 w-full sm:w-auto'
            disabled={isLoading}
          >
            <Save className='h-4 w-4 mr-2' />
            {isLoading ? 'Saving...' : 'Save All Settings'}
          </motion.button>
        </motion.div>

        <div className='p-4 sm:p-10'>
          {/* General Section */}
          <motion.div variants={itemVariants} className='mb-6 sm:mb-8'>
            {renderSectionHeader(
              'General Settings',
              <Globe className='h-5 w-5' />
            )}

            {/* Timezone */}
            <AnimatePresence mode='wait'>
              {editMode.timezone ? (
                <motion.div
                  key='timezone-edit'
                  variants={dropdownVariants}
                  initial='hidden'
                  animate='visible'
                  exit='hidden'
                  className='mb-6'
                >
                  <div className='flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-0'>
                    <div className='sm:w-1/3'>
                      <h3 className='text-sm sm:text-[15px] font-medium text-gray-800'>
                        Timezone
                      </h3>
                    </div>
                    <div className='sm:w-2/3'>
                      <div className='relative'>
                        <select
                          value={settings.timezone}
                          onChange={e => handleTimezoneSelect(e.target.value)}
                          className='block w-full p-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none disabled:opacity-50 text-sm'
                          disabled={isLoading}
                        >
                          {timezones.map(timezone => (
                            <option key={timezone.value} value={timezone.value}>
                              {timezone.label}
                            </option>
                          ))}
                        </select>
                        <div className='absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none'>
                          <ChevronDown className='h-5 w-5 text-gray-400' />
                        </div>
                      </div>
                      <div className='mt-2 flex space-x-2'>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            setEditMode({ ...editMode, timezone: false })
                          }
                          className='text-sm text-gray-500 hover:text-gray-700 cursor-pointer disabled:opacity-50'
                          disabled={isLoading}
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key='timezone-display'>
                  {renderField(
                    'Timezone',
                    getTimezoneDisplay(settings.timezone),
                    handleTimezoneEdit
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Language */}
            <AnimatePresence mode='wait'>
              {editMode.language ? (
                <motion.div
                  key='language-edit'
                  variants={dropdownVariants}
                  initial='hidden'
                  animate='visible'
                  exit='hidden'
                  className='mb-6'
                >
                  <div className='flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-0'>
                    <div className='sm:w-1/3'>
                      <h3 className='text-sm sm:text-[15px] font-medium text-gray-800'>
                        Language
                      </h3>
                    </div>
                    <div className='sm:w-2/3'>
                      <div className='relative'>
                        <select
                          value={settings.language}
                          onChange={e => handleLanguageSelect(e.target.value)}
                          className='block w-full p-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none disabled:opacity-50 text-sm'
                          disabled={isLoading}
                        >
                          {languages.map(language => (
                            <option key={language.value} value={language.value}>
                              {language.label}
                            </option>
                          ))}
                        </select>
                        <div className='absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none'>
                          <ChevronDown className='h-5 w-5 text-gray-400' />
                        </div>
                      </div>
                      <div className='mt-2 flex space-x-2'>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            setEditMode({ ...editMode, language: false })
                          }
                          className='text-sm text-gray-500 hover:text-gray-700 cursor-pointer disabled:opacity-50'
                          disabled={isLoading}
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key='language-display'>
                  {renderField(
                    'Language',
                    settings.language,
                    handleLanguageEdit
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dark Mode */}
            {renderToggle(
              'Dark Mode',
              'Enable dark mode for the application interface',
              settings.darkMode,
              handleToggleDarkMode
            )}
          </motion.div>

          {/* Notifications Section */}
          <motion.div variants={itemVariants} className='mb-6 sm:mb-8'>
            {renderSectionHeader(
              'Notification Settings',
              <Bell className='h-5 w-5' />
            )}

            {renderToggle(
              'Email Notifications',
              'Receive notifications via email',
              settings.notifications.email,
              () => handleToggleNotification('email')
            )}

            {renderToggle(
              'Browser Notifications',
              'Receive notifications in your browser',
              settings.notifications.browser,
              () => handleToggleNotification('browser')
            )}

            {renderToggle(
              'Mobile Notifications',
              'Receive notifications on your mobile device',
              settings.notifications.mobile,
              () => handleToggleNotification('mobile')
            )}
          </motion.div>

          {/* Email Preferences Section */}
          <motion.div variants={itemVariants} className='mb-6 sm:mb-8'>
            {renderSectionHeader(
              'Email Preferences',
              <Mail className='h-5 w-5' />
            )}

            {renderToggle(
              'Product Updates',
              'Receive emails about new features and updates',
              settings.emailPreferences.updates,
              () => handleToggleEmailPreference('updates')
            )}

            {renderToggle(
              'Marketing Emails',
              'Receive promotional and marketing emails',
              settings.emailPreferences.marketing,
              () => handleToggleEmailPreference('marketing')
            )}

            {renderToggle(
              'Newsletter',
              'Receive our monthly newsletter',
              settings.emailPreferences.newsletter,
              () => handleToggleEmailPreference('newsletter')
            )}
          </motion.div>

          {/* Cache Management */}
          <motion.div variants={itemVariants}>
            {renderSectionHeader(
              'Cache Management',
              <RefreshCw className='h-5 w-5' />
            )}

            <motion.div
              variants={itemVariants}
              className='bg-gray-50 p-4 rounded-lg border border-gray-200'
            >
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div className='flex-1 min-w-0'>
                  <h3 className='text-sm sm:text-[15px] font-medium text-gray-800'>
                    Clear Application Cache
                  </h3>
                  <p className='text-xs sm:text-sm text-gray-500 mt-1'>
                    Clear the application cache to free up space and resolve
                    potential issues
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClearCache}
                  className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 flex-shrink-0 w-full sm:w-auto'
                  disabled={isLoading}
                >
                  Clear Cache
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
