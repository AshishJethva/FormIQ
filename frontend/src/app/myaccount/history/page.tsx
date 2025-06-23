// src/app/myaccount/history/page.tsx

'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  Activity,
} from 'lucide-react';
import {
  fetchUserProfile,
  fetchActivityLogs,
  selectUserProfile,
  selectActivityLogs,
  selectActivityPagination,
  selectIsActivityLoading,
  selectActivityError,
  clearActivityError,
} from '@/redux/slices/userProfile/userProfileSlice';
import userProfileService from '@/services/userProfile';
import type { StoreDispatch } from '@/redux/store';
import type { ActivityFilters } from '@/services/userProfile';
import { formatTimeToAMPM } from '@/lib/utils';
import HistoryPageSkeleton from '@/components/skeletons/HistoryPageSkeleton';

const HistoryPage = () => {
  const dispatch = useDispatch<StoreDispatch>();

  // Redux state
  const userProfile = useSelector(selectUserProfile);
  const activityLogs = useSelector(selectActivityLogs);
  const pagination = useSelector(selectActivityPagination);
  const isLoading = useSelector(selectIsActivityLoading);
  const error = useSelector(selectActivityError);

  // State hooks
  const [dateFilter, setDateFilter] = useState('All time');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [isPaginating, setIsPaginating] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 4));
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [customDateRange, setCustomDateRange] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [accountStats, setAccountStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const getSkeletonVariant = () => {
    if (!userProfile && isLoading) return 'initial-loading';
    if (statsLoading) return 'initial-loading';
    if (isFilterLoading) return 'filtering';
    if (isPaginating) return 'paginating';
    if (showDatePicker) return 'date-picker-open';
    return 'initial-loading';
  };

  const shouldShowSkeleton = () => {
    return (
      (!userProfile && isLoading) ||
      statsLoading ||
      isFilterLoading ||
      isPaginating ||
      (isLoading && activityLogs.length === 0)
    );
  };

  // Refs and memoized values
  const datePickerRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => new Date(), []);

  // Month names for formatting
  const monthNames = useMemo(
    () => [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    []
  );

  const shortMonthNames = useMemo(
    () => [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],
    []
  );

  // Date range options
  const dateRangeOptions = useMemo(
    () => [
      'All time',
      'Last 3 days',
      'Last 7 days',
      'Last 30 days',
      'Last 90 days',
      'Last 180 days',
      'Last 1 year',
      'Previous year',
      'Custom dates',
    ],
    []
  );

  // Account details from user profile
  const accountDetails = useMemo(() => {
    if (!userProfile || !accountStats) {
      return {
        creationDate: 'Unknown',
        updateDate: 'Unknown',
        lastSeenDate: 'Unknown',
        lastIpAddress: 'Unknown',
      };
    }

    return {
      creationDate: new Date(userProfile.user.createdAt).toLocaleDateString(
        'en-GB',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }
      ),
      updateDate: new Date(userProfile.user.updatedAt).toLocaleDateString(
        'en-GB',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }
      ),
      lastSeenDate: new Date(accountStats.lastSeenDate).toLocaleDateString(
        'en-GB',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }
      ),
      lastIpAddress: accountStats.lastIpAddress || 'Not available',
    };
  }, [userProfile, accountStats]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const slideVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4 },
    },
  };

  // Fetch account stats on component mount
  useEffect(() => {
    const fetchAccountStats = async () => {
      try {
        setStatsLoading(true);
        const stats = await userProfileService.getAccountStats();
        setAccountStats(stats);
      } catch (error) {
        console.error('Failed to fetch account stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchAccountStats();
  }, []);

  // Fetch user profile and initial activity logs
  useEffect(() => {
    if (!userProfile) {
      dispatch(fetchUserProfile());
    }

    // Load initial activity logs
    loadActivityLogs();
  }, [dispatch, userProfile]);

  // Calculate date range based on filter
  const calculateDateRange = useCallback(
    (filter: string): [Date | null, Date | null] => {
      const now = new Date(today);
      now.setHours(0, 0, 0, 0);

      switch (filter) {
        case 'Last 3 days': {
          const startDate = new Date(now);
          startDate.setDate(now.getDate() - 2);
          return [startDate, now];
        }
        case 'Last 7 days': {
          const startDate = new Date(now);
          startDate.setDate(now.getDate() - 6);
          return [startDate, now];
        }
        case 'Last 30 days': {
          const startDate = new Date(now);
          startDate.setDate(now.getDate() - 29);
          return [startDate, now];
        }
        case 'Last 90 days': {
          const startDate = new Date(now);
          startDate.setDate(now.getDate() - 89);
          return [startDate, now];
        }
        case 'Last 180 days': {
          const startDate = new Date(now);
          startDate.setDate(now.getDate() - 179);
          return [startDate, now];
        }
        case 'Last 1 year': {
          const startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          startDate.setDate(startDate.getDate() + 1);
          return [startDate, now];
        }
        case 'Previous year': {
          const startDate = new Date(now.getFullYear() - 1, 0, 1);
          const endDate = new Date(now.getFullYear() - 1, 11, 31);
          return [startDate, endDate];
        }
        default:
          return [null, null];
      }
    },
    [today]
  );

  // Load activity logs with current filters
  const loadActivityLogs = useCallback(
    async (page: number = 1, showFilterLoading = false) => {
      if (showFilterLoading) {
        setIsFilterLoading(true);
      }

      const filters: ActivityFilters = {
        page,
        limit: 20,
      };

      // Add date filters
      if (selectedStartDate && selectedEndDate) {
        filters.dateFrom = selectedStartDate.toISOString().split('T')[0];
        filters.dateTo = selectedEndDate.toISOString().split('T')[0];
      } else if (dateFilter !== 'All time' && dateFilter !== 'Custom dates') {
        const [start, end] = calculateDateRange(dateFilter);
        if (start && end) {
          filters.dateFrom = start.toISOString().split('T')[0];
          filters.dateTo = end.toISOString().split('T')[0];
        }
      }

      try {
        await dispatch(fetchActivityLogs(filters));
        setCurrentPage(page);
      } catch (error) {
        console.error('Failed to load activity logs:', error);
      } finally {
        if (showFilterLoading) {
          // Add a slight delay for better UX
          setTimeout(() => setIsFilterLoading(false), 500);
        }
      }
    },
    [
      dispatch,
      dateFilter,
      selectedStartDate,
      selectedEndDate,
      calculateDateRange,
    ]
  );

  // Helper functions
  const getActionColor = (action: string) => {
    const colorMap: { [key: string]: string } = {
      created: 'text-green-600',
      updated: 'text-blue-600',
      deleted: 'text-red-600',
      uploaded: 'text-purple-600',
      'logged in': 'text-green-600',
      'logged out': 'text-orange-600',
    };

    // Check if action contains any of the keywords
    for (const [keyword, color] of Object.entries(colorMap)) {
      if (action.toLowerCase().includes(keyword)) {
        return color;
      }
    }

    return 'text-gray-700';
  };

  const toggleDatePicker = () => setShowDatePicker(!showDatePicker);

  const isSameDay = (date1: Date, date2: Date): boolean =>
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear();

  const isDateInRange = (date: Date) => {
    if (!selectedStartDate || !selectedEndDate) return false;

    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    const startDate = new Date(selectedStartDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(selectedEndDate);
    endDate.setHours(0, 0, 0, 0);

    return compareDate >= startDate && compareDate <= endDate;
  };

  const formatDate = (d: Date) =>
    `${d.getDate()} ${shortMonthNames[d.getMonth()]} ${d.getFullYear()}`;

  const formatMonthYear = (date: Date) =>
    `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

  const navigateToPreviousMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );

  const navigateToNextMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );

  // Handle date selection in calendar
  const handleDateSelection = (date: Date) => {
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // Start new selection
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      setCustomDateRange(true);
    } else {
      // Complete selection
      if (date < selectedStartDate) {
        setSelectedEndDate(selectedStartDate);
        setSelectedStartDate(date);
      } else {
        setSelectedEndDate(date);
      }

      // Update filter settings
      setCustomDateRange(true);
      setDateFilter(
        `${formatDate(
          selectedStartDate < date ? selectedStartDate : date
        )} - ${formatDate(selectedStartDate < date ? date : selectedStartDate)}`
      );
      setShowDatePicker(false);
    }
  };

  // Generate calendar days for the current month view
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();

    // Days from previous month
    const prevMonthDays = Array.from({ length: firstDayOfWeek }, (_, i) => {
      const day = new Date(year, month, -firstDayOfWeek + i + 1);
      return {
        date: day,
        isCurrentMonth: false,
        isToday: isSameDay(day, today),
        isSelected: isDateInRange(day),
        isSelectionStart:
          selectedStartDate && isSameDay(day, selectedStartDate),
        isSelectionEnd: selectedEndDate && isSameDay(day, selectedEndDate),
      };
    });

    // Days from current month
    const currentMonthDays = Array.from(
      { length: lastDay.getDate() },
      (_, i) => {
        const day = new Date(year, month, i + 1);
        return {
          date: day,
          isCurrentMonth: true,
          isToday: isSameDay(day, today),
          isSelected: isDateInRange(day),
          isSelectionStart:
            selectedStartDate && isSameDay(day, selectedStartDate),
          isSelectionEnd: selectedEndDate && isSameDay(day, selectedEndDate),
        };
      }
    );

    // Calculate days needed from next month
    const totalDaysDisplayed =
      Math.ceil((firstDayOfWeek + lastDay.getDate()) / 7) * 7;
    const nextMonthDaysCount =
      totalDaysDisplayed - (prevMonthDays.length + currentMonthDays.length);

    // Days from next month
    const nextMonthDays = Array.from({ length: nextMonthDaysCount }, (_, i) => {
      const day = new Date(year, month + 1, i + 1);
      return {
        date: day,
        isCurrentMonth: false,
        isToday: isSameDay(day, today),
        isSelected: isDateInRange(day),
        isSelectionStart:
          selectedStartDate && isSameDay(day, selectedStartDate),
        isSelectionEnd: selectedEndDate && isSameDay(day, selectedEndDate),
      };
    });

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

  // Effects
  // Update selected dates when date filter changes
  useEffect(() => {
    if (!customDateRange && dateFilter !== 'Custom dates') {
      const [start, end] = calculateDateRange(dateFilter);
      setSelectedStartDate(start);
      setSelectedEndDate(end);
    }
  }, [dateFilter, customDateRange, calculateDateRange]);

  // Handle clicks outside date picker
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load activity logs when filters change
  useEffect(() => {
    loadActivityLogs(1);
  }, [dateFilter, selectedStartDate, selectedEndDate]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearActivityError());
    };
  }, [dispatch]);

  // Get calendar days
  const calendarDays = generateCalendarDays();

  // Handle pagination
  const handlePageChange = async (page: number) => {
    setIsPaginating(true);
    try {
      await loadActivityLogs(page);
    } finally {
      // Add delay for smooth transition
      setTimeout(() => setIsPaginating(false), 300);
    }
  };

  const handleDateFilterChange = async (newFilter: string) => {
    setDateFilter(newFilter);
    setShowDatePicker(false);
    await loadActivityLogs(1, true); // Show filtering animation
  };

  const handleShowMore = () => {
    if (pagination && currentPage < pagination.pages) {
      handlePageChange(currentPage + 1);
    }
  };

  // Render skeleton based on current state
  if (shouldShowSkeleton()) {
    return (
      <HistoryPageSkeleton
        variant={getSkeletonVariant()}
        showActivityLogs={activityLogs.length > 0}
        logsCount={activityLogs.length || 8}
        showDatePicker={showDatePicker}
        hasExistingData={activityLogs.length > 0}
      />
    );
  }

  return (
    <motion.div
      className='bg-gray-50 min-h-screen w-full py-4 sm:py-6 lg:py-10 px-2 sm:px-4'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      <div className='max-w-4xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden'>
        {/* Header */}
        <motion.div
          className='py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-10 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50'
          variants={itemVariants}
        >
          <h1 className='text-lg sm:text-xl lg:text-2xl font-bold flex flex-wrap items-center gap-2'>
            <Activity className='h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-green-600 flex-shrink-0' />
            <span className='text-navy-900'>Browse </span>
            <span className='text-green-600'>Activity Logs </span>
            <span className='text-navy-900 hidden sm:inline'>
              for Your Account
            </span>
          </h1>
        </motion.div>

        <div className='p-4 sm:p-6 lg:p-10'>
          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                className='mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded'
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <p className='text-sm'>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Date Filter */}
          <motion.div
            className='flex justify-center sm:justify-end mb-6 relative'
            variants={itemVariants}
          >
            <motion.button
              className='flex items-center justify-between w-full sm:w-[200px] px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors cursor-pointer'
              onClick={toggleDatePicker}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className='truncate'>{dateFilter}</span>
              <Calendar className='ml-2 h-5 w-5 text-green-600 flex-shrink-0' />
            </motion.button>

            {/* Date Picker Dropdown */}
            <AnimatePresence>
              {showDatePicker && (
                <motion.div
                  ref={datePickerRef}
                  className='absolute mt-2 z-10 rounded-md shadow-lg bg-[#2B3245] text-white left-0 sm:right-0 sm:left-auto top-full w-full sm:w-auto'
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className='flex flex-col sm:flex-row'>
                    {/* Calendar */}
                    <div className='p-4 border-b sm:border-b-0 sm:border-r border-navy-700'>
                      <div className='flex justify-between items-center mb-4'>
                        <motion.button
                          className='p-1 text-gray-300 hover:text-white cursor-pointer'
                          onClick={navigateToPreviousMonth}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <ChevronLeft className='h-4 w-4' />
                        </motion.button>
                        <span className='font-medium text-white text-sm sm:text-base'>
                          {formatMonthYear(currentMonth)}
                        </span>
                        <motion.button
                          className='p-1 text-gray-300 hover:text-white cursor-pointer'
                          onClick={navigateToNextMonth}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <ChevronRight className='h-4 w-4' />
                        </motion.button>
                      </div>

                      <div className='grid grid-cols-7 text-center text-xs mb-2'>
                        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(
                          day => (
                            <div key={day} className='text-gray-400 py-1'>
                              <span className='hidden sm:inline'>{day}</span>
                              <span className='sm:hidden'>{day[0]}</span>
                            </div>
                          )
                        )}
                      </div>

                      <div className='grid grid-cols-7 gap-1 text-center'>
                        {calendarDays.map((day, index) => (
                          <motion.div
                            key={`day-${index}`}
                            className={`
                              w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm cursor-pointer
                              ${
                                !day.isCurrentMonth
                                  ? 'text-gray-500'
                                  : 'text-white'
                              }
                              ${day.isSelected ? 'bg-blue-500 text-white' : ''}
                              ${
                                day.isSelectionStart || day.isSelectionEnd
                                  ? 'bg-blue-600 text-white'
                                  : ''
                              }
                              ${
                                !day.isSelected &&
                                !day.isSelectionStart &&
                                !day.isSelectionEnd
                                  ? 'hover:bg-navy-700'
                                  : ''
                              }
                            `}
                            onClick={() => handleDateSelection(day.date)}
                            title={day.date.toLocaleDateString()}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {day.date.getDate()}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Date Range Options */}
                    <div className='p-4 min-w-[160px]'>
                      {dateRangeOptions.map((option, index) => (
                        <motion.div
                          key={index}
                          className={`py-2 px-3 cursor-pointer rounded text-sm transition-colors 
                            ${
                              option === dateFilter
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-200 hover:bg-navy-700'
                            }`}
                          onClick={() => {
                            setDateFilter(option);
                            if (option === 'Custom dates') {
                              setSelectedStartDate(null);
                              setSelectedEndDate(null);
                              setCustomDateRange(true);
                              setDateFilter(option);
                            } else {
                              setCustomDateRange(false);
                              setShowDatePicker(false);
                              handleDateFilterChange(option);
                            }
                          }}
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {option}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Activity Log Table */}
          <motion.div
            className='bg-gray-50 rounded-lg overflow-hidden shadow mb-8'
            variants={itemVariants}
          >
            <div className='hidden sm:grid sm:grid-cols-2 bg-gray-100 py-3 px-6'>
              <div className='font-medium text-gray-700 flex items-center'>
                <Clock className='h-4 w-4 mr-2 text-gray-500' />
                Date
              </div>
              <div className='font-medium text-gray-700'>Description</div>
            </div>

            {isLoading ? (
              // Loading state
              <motion.div
                className='py-12 flex justify-center items-center'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className='animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500'
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </motion.div>
            ) : activityLogs.length === 0 ? (
              // No results state
              <motion.div
                className='py-12 text-center text-gray-500'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                No activity logs found for the selected date range.
              </motion.div>
            ) : (
              // Results
              <div className='divide-y divide-gray-200'>
                {activityLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className='grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-0 py-4 px-4 sm:px-6 hover:bg-gray-100 transition-colors'
                  >
                    <div className='text-gray-700 text-xs sm:text-sm'>
                      <div className='sm:hidden font-medium text-gray-500 mb-1 flex items-center'>
                        <Clock className='h-3 w-3 mr-1' />
                        Date & Time
                      </div>
                      <span className='font-medium text-xs'>{log.date}</span>
                      <span className='ml-2 text-xs'>
                        - {formatTimeToAMPM(log.time)}
                      </span>
                    </div>
                    <div className='text-gray-800 text-xs sm:text-sm'>
                      <div className='sm:hidden font-medium text-gray-500 mb-1'>
                        Description
                      </div>
                      You{' '}
                      <span
                        className={`${getActionColor(log.action)} font-medium`}
                      >
                        {log.action}
                      </span>
                      {log.target && <span> {log.target}</span>}
                      {log.ipAddress && (
                        <span className='block sm:inline'>
                          {' '}
                          from {log.ipAddress}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Pagination */}
          {!isLoading && pagination && pagination.pages > 1 && (
            <motion.div
              className='flex flex-wrap justify-center items-center gap-2 mb-8'
              variants={itemVariants}
            >
              <motion.button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className='px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                whileHover={{ scale: currentPage > 1 ? 1.05 : 1 }}
                whileTap={{ scale: currentPage > 1 ? 0.95 : 1 }}
              >
                Previous
              </motion.button>

              <div className='flex flex-wrap gap-1'>
                {Array.from(
                  { length: Math.min(pagination.pages, 5) },
                  (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <motion.button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm border border-gray-300 rounded-md ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'hover:bg-gray-50'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {pageNum}
                      </motion.button>
                    );
                  }
                )}
              </div>

              <motion.button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= pagination.pages}
                className='px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                whileHover={{
                  scale: currentPage < pagination.pages ? 1.05 : 1,
                }}
                whileTap={{ scale: currentPage < pagination.pages ? 0.95 : 1 }}
              >
                Next
              </motion.button>
            </motion.div>
          )}

          {/* Show More Button (Alternative to pagination) */}
          {!isLoading && pagination && currentPage < pagination.pages && (
            <motion.div className='text-center mb-8' variants={itemVariants}>
              <motion.button
                className='text-green-600 text-sm hover:text-green-700 focus:outline-none transition-colors px-4 py-2 rounded-md border border-gray-200 hover:border-green-200 cursor-pointer'
                onClick={handleShowMore}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Load More Logs
              </motion.button>
            </motion.div>
          )}

          {/* Enhanced Account Details Section */}
          <motion.div variants={itemVariants}>
            <h2 className='text-xl sm:text-2xl font-semibold text-green-600 mb-6 border-b border-gray-200 pb-2 flex items-center'>
              <Globe className='h-4 w-4 sm:h-5 sm:w-5 mr-2' />
              Account Details
            </h2>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Time Details Card */}
              <motion.div
                className='bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow'
                whileHover={{ y: -2 }}
                variants={slideVariants}
              >
                <div className='px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50'>
                  <h3 className='font-semibold text-navy-900 flex items-center text-sm sm:text-base'>
                    <Clock className='h-3 w-3 sm:h-4 sm:w-4 mr-2 text-green-600' />
                    Time Details
                  </h3>
                </div>
                <div className='p-4 sm:p-5'>
                  {statsLoading ? (
                    <div className='animate-pulse space-y-3'>
                      <div className='h-3 sm:h-4 bg-gray-200 rounded w-3/4'></div>
                      <div className='h-3 sm:h-4 bg-gray-200 rounded w-2/3'></div>
                      <div className='h-3 sm:h-4 bg-gray-200 rounded w-3/4'></div>
                    </div>
                  ) : (
                    <motion.div
                      className='space-y-3'
                      initial='hidden'
                      animate='visible'
                      variants={{
                        visible: {
                          transition: {
                            staggerChildren: 0.1,
                          },
                        },
                      }}
                    >
                      <motion.div
                        className='flex flex-col sm:flex-row sm:items-center sm:justify-start'
                        variants={slideVariants}
                      >
                        <span className='text-gray-600 text-xs sm:text-sm mb-1 sm:mb-0 sm:mr-2 font-medium sm:font-normal'>
                          Creation Date:
                        </span>
                        <span className='text-green-600 text-xs sm:text-sm font-medium'>
                          {accountDetails.creationDate}
                        </span>
                      </motion.div>
                      <motion.div
                        className='flex flex-col sm:flex-row sm:justify-start sm:items-center'
                        variants={slideVariants}
                      >
                        <span className='text-gray-600 text-xs sm:text-sm mb-1 sm:mb-0 sm:mr-2 font-medium sm:font-normal'>
                          Update Date:
                        </span>
                        <span className='text-green-600 text-xs sm:text-sm font-medium'>
                          {accountDetails.updateDate}
                        </span>
                      </motion.div>
                      <motion.div
                        className='flex flex-col sm:flex-row sm:justify-start sm:items-center'
                        variants={slideVariants}
                      >
                        <span className='text-gray-600 text-xs sm:text-sm mb-1 sm:mb-0 sm:mr-2 font-medium sm:font-normal'>
                          Last Seen:
                        </span>
                        <span className='text-green-600 text-xs sm:text-sm font-medium'>
                          {accountDetails.lastSeenDate}
                        </span>
                      </motion.div>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* IP Address Card with Real Data */}
              <motion.div
                className='bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow'
                whileHover={{ y: -2 }}
                variants={slideVariants}
              >
                <div className='px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50'>
                  <h3 className='font-semibold text-navy-900 flex items-center text-sm sm:text-base'>
                    <Globe className='h-3 w-3 sm:h-4 sm:w-4 mr-2 text-green-600' />
                    Last IP Address
                  </h3>
                </div>
                <div className='p-4 sm:p-5'>
                  <div className='flex items-center justify-center h-12 sm:h-16'>
                    {statsLoading ? (
                      <div className='animate-pulse'>
                        <div className='h-6 sm:h-8 bg-gray-200 rounded w-24 sm:w-32'></div>
                      </div>
                    ) : (
                      <motion.span
                        className={`font-mono text-xs sm:text-sm py-2 px-3 sm:px-4 rounded-lg border ${
                          accountDetails.lastIpAddress === 'Not available'
                            ? 'text-gray-500 bg-gray-50 border-gray-100'
                            : 'text-gray-800 bg-gray-50 border-gray-100'
                        }`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        {accountDetails.lastIpAddress}
                      </motion.span>
                    )}
                  </div>
                  {!statsLoading &&
                    accountDetails.lastIpAddress !== 'Not available' && (
                      <motion.div
                        className='text-xs text-gray-500 text-center mt-2'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        From your most recent activity
                      </motion.div>
                    )}
                </div>
              </motion.div>
            </div>

            {/* Activity Summary Card */}
            {pagination && (
              <motion.div
                className='mt-6 bg-white rounded-lg border border-gray-100 shadow-sm'
                whileHover={{ y: -2 }}
                variants={slideVariants}
              >
                <div className='px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50'>
                  <h3 className='font-semibold text-navy-900 flex items-center text-sm sm:text-base'>
                    <Activity className='h-3 w-3 sm:h-4 sm:w-4 mr-2 text-green-600' />
                    Activity Summary
                  </h3>
                </div>
                <div className='p-4 sm:p-5'>
                  <motion.div
                    className='grid grid-cols-2 lg:grid-cols-4 gap-4 text-center'
                    initial='hidden'
                    animate='visible'
                    variants={{
                      visible: {
                        transition: {
                          staggerChildren: 0.1,
                        },
                      },
                    }}
                  >
                    <motion.div variants={slideVariants}>
                      <motion.div
                        className='text-xl sm:text-2xl font-bold text-green-600'
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 200,
                          delay: 0.2,
                        }}
                      >
                        {pagination.total}
                      </motion.div>
                      <div className='text-xs sm:text-sm text-gray-600'>
                        Total Activities
                      </div>
                    </motion.div>
                    <motion.div variants={slideVariants}>
                      <motion.div
                        className='text-xl sm:text-2xl font-bold text-blue-600'
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 200,
                          delay: 0.3,
                        }}
                      >
                        {currentPage}
                      </motion.div>
                      <div className='text-xs sm:text-sm text-gray-600'>
                        Current Page
                      </div>
                    </motion.div>
                    <motion.div variants={slideVariants}>
                      <motion.div
                        className='text-xl sm:text-2xl font-bold text-purple-600'
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 200,
                          delay: 0.4,
                        }}
                      >
                        {pagination.pages}
                      </motion.div>
                      <div className='text-xs sm:text-sm text-gray-600'>
                        Total Pages
                      </div>
                    </motion.div>
                    <motion.div variants={slideVariants}>
                      <motion.div
                        className='text-xl sm:text-2xl font-bold text-orange-600'
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 200,
                          delay: 0.5,
                        }}
                      >
                        {activityLogs.length}
                      </motion.div>
                      <div className='text-xs sm:text-sm text-gray-600'>
                        Showing
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default HistoryPage;
