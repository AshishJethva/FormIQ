'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  Activity,
} from 'lucide-react';

interface ActivityLog {
  id: string;
  date: string;
  time: string;
  action: string;
  target: string;
  ipAddress?: string;
  timestamp: number;
}

const HistoryPage = () => {
  // State hooks
  const [dateFilter, setDateFilter] = useState('All time');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [displayedLogs, setDisplayedLogs] = useState<ActivityLog[]>([]);
  const [visibleLogsCount, setVisibleLogsCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 4));
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [customDateRange, setCustomDateRange] = useState(false);

  // Refs and memoized values
  const datePickerRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => new Date(), []);

  // Account details
  const accountDetails = {
    creationDate: 'May 09, 2025',
    updateDate: 'May 09, 2025',
    lastSeenDate: 'May 15, 2025',
    lastIpAddress: '116.74.77.221',
  };

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

  // Helper function to create timestamp from date string
  const createTimestamp = (dateStr: string, timeStr: string) => {
    const parts = dateStr.split(/,\s|\s/);
    const day = parts[1];
    const month = parts[2];
    const year = parts[3];
    const [hour, minute] = timeStr.split(':');

    const monthMap: { [key: string]: number } = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };

    return new Date(
      parseInt(year),
      monthMap[month],
      parseInt(day),
      parseInt(hour),
      parseInt(minute)
    ).getTime();
  };

  // Mock activity logs data with timestamps
  const allActivityLogs: ActivityLog[] = useMemo(
    () => [
      {
        id: '1',
        date: 'Thu, 15 May 25',
        time: '11:16',
        action: 'updated',
        target: '251341142924045',
        timestamp: createTimestamp('Thu, 15 May 25', '11:16'),
      },
      // More logs would be here in actual implementation
      {
        id: '30',
        date: 'Mon, 14 Apr 25',
        time: '11:30',
        action: 'deleted',
        target: '251678901234567',
        timestamp: createTimestamp('Mon, 14 Apr 25', '11:30'),
      },
    ],
    []
  );

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

  // Helper functions
  const getActionColor = (action: string) => {
    const colorMap: { [key: string]: string } = {
      created: 'text-green-600',
      updated: 'text-blue-600',
      deleted: 'text-red-600',
      'logged in': 'text-purple-600',
      'logged out': 'text-orange-600',
    };
    return colorMap[action] || 'text-gray-700';
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

  const handleShowMore = () =>
    setVisibleLogsCount(prev => Math.min(prev + 10, displayedLogs.length));

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

  // Filter logs based on selected date range
  useEffect(() => {
    setIsLoading(true);

    // Simulate API request delay
    setTimeout(() => {
      let filteredLogs = [...allActivityLogs];

      // Apply date filtering
      if (selectedStartDate && selectedEndDate) {
        const startTime = new Date(selectedStartDate).setHours(0, 0, 0, 0);
        const endTime = new Date(selectedEndDate).setHours(23, 59, 59, 999);
        filteredLogs = filteredLogs.filter(
          log => log.timestamp >= startTime && log.timestamp <= endTime
        );
      }

      // Sort logs by timestamp (newest first)
      filteredLogs.sort((a, b) => b.timestamp - a.timestamp);
      setDisplayedLogs(filteredLogs);
      setVisibleLogsCount(Math.min(10, filteredLogs.length));
      setIsLoading(false);
    }, 300);
  }, [dateFilter, selectedStartDate, selectedEndDate, allActivityLogs]);

  // Get calendar days
  const calendarDays = generateCalendarDays();

  return (
    <div className='bg-gray-50 min-h-screen w-full py-10 px-4'>
      <div className='max-w-4xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden'>
        {/* Header */}
        <div className='py-8 px-10 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50'>
          <h1 className='text-2xl font-bold flex items-center gap-2'>
            <Activity className='h-7 w-7 text-green-600' />
            <span className='text-navy-900'>Browse </span>
            <span className='text-green-600'>Activity Logs </span>
            <span className='text-navy-900'>for Your Account</span>
          </h1>
        </div>

        <div className='p-10'>
          {/* Date Filter */}
          <div className='flex justify-end mb-6 relative'>
            <button
              className='flex items-center justify-between w-[200px] px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors'
              onClick={toggleDatePicker}
            >
              <span>{dateFilter}</span>
              <Calendar className='ml-2 h-5 w-5 text-green-600' />
            </button>

            {/* Date Picker Dropdown */}
            {showDatePicker && (
              <div
                ref={datePickerRef}
                className='absolute mt-2 z-10 rounded-md shadow-lg bg-[#2B3245] text-white right-0 top-full'
              >
                <div className='flex'>
                  {/* Calendar */}
                  <div className='p-4 border-r border-navy-700'>
                    <div className='flex justify-between items-center mb-4'>
                      <button
                        className='p-1 text-gray-300 hover:text-white'
                        onClick={navigateToPreviousMonth}
                      >
                        <ChevronLeft className='h-4 w-4' />
                      </button>
                      <span className='font-medium text-white'>
                        {formatMonthYear(currentMonth)}
                      </span>
                      <button
                        className='p-1 text-gray-300 hover:text-white'
                        onClick={navigateToNextMonth}
                      >
                        <ChevronRight className='h-4 w-4' />
                      </button>
                    </div>

                    <div className='grid grid-cols-7 text-center text-xs mb-2'>
                      {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(
                        day => (
                          <div key={day} className='text-gray-400'>
                            {day}
                          </div>
                        )
                      )}
                    </div>

                    <div className='grid grid-cols-7 gap-1 text-center'>
                      {calendarDays.map((day, index) => (
                        <div
                          key={`day-${index}`}
                          className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer
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
                        >
                          {day.date.getDate()}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Date Range Options */}
                  <div className='p-4 min-w-[160px]'>
                    {dateRangeOptions.map((option, index) => (
                      <div
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
                          } else {
                            setCustomDateRange(false);
                            setShowDatePicker(false);
                          }
                        }}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Activity Log Table */}
          <div className='bg-gray-50 rounded-lg overflow-hidden shadow mb-8'>
            <div className='grid grid-cols-2 bg-gray-100 py-3 px-6'>
              <div className='font-medium text-gray-700 flex items-center'>
                <Clock className='h-4 w-4 mr-2 text-gray-500' />
                Date
              </div>
              <div className='font-medium text-gray-700'>Description</div>
            </div>

            {isLoading ? (
              // Loading state
              <div className='py-12 flex justify-center items-center'>
                <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500'></div>
              </div>
            ) : displayedLogs.length === 0 ? (
              // No results state
              <div className='py-12 text-center text-gray-500'>
                No activity logs found for the selected date range.
              </div>
            ) : (
              // Results
              <div className='divide-y divide-gray-200'>
                {displayedLogs.slice(0, visibleLogsCount).map(log => (
                  <div
                    key={log.id}
                    className='grid grid-cols-2 py-4 px-6 hover:bg-gray-100 transition-colors'
                  >
                    <div className='text-gray-700 text-sm'>
                      {log.date} - {log.time}
                    </div>
                    <div className='text-gray-800 text-sm'>
                      You{' '}
                      <span
                        className={`${getActionColor(log.action)} font-medium`}
                      >
                        {log.action}
                      </span>
                      {log.target && <span> {log.target}</span>}
                      {log.ipAddress && <span> from {log.ipAddress}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Show More Button */}
          {!isLoading && visibleLogsCount < displayedLogs.length && (
            <div className='text-center mb-8'>
              <button
                className='text-green-600 text-sm hover:text-green-700 focus:outline-none transition-colors px-4 py-2 rounded-md border border-gray-200 hover:border-green-200'
                onClick={handleShowMore}
              >
                Show More Logs
              </button>
            </div>
          )}

          {/* Enhanced Account Details Section */}
          <div>
            <h2 className='text-2xl font-semibold text-green-600 mb-6 border-b border-gray-200 pb-2 flex items-center'>
              <Globe className='h-5 w-5 mr-2' />
              Account Details
            </h2>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Time Details Card */}
              <div className='bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow'>
                <div className='px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50'>
                  <h3 className='font-semibold text-navy-900 flex items-center'>
                    <Clock className='h-4 w-4 mr-2 text-green-600' />
                    Time Details
                  </h3>
                </div>
                <div className='p-5'>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-start'>
                      <span className='text-gray-600 text-sm mr-2'>
                        Creation Date:
                      </span>
                      <span className='text-green-600 text-sm'>
                        {accountDetails.creationDate}
                      </span>
                    </div>
                    <div className='flex justify-start items-center'>
                      <span className='text-gray-600 text-sm mr-2'>
                        Update Date:
                      </span>
                      <span className='text-green-600 text-sm'>
                        {accountDetails.updateDate}
                      </span>
                    </div>
                    <div className='flex justify-start items-center'>
                      <span className='text-gray-600 text-sm mr-2'>
                        Last Seen Date:
                      </span>
                      <span className='text-green-600 text-sm'>
                        {accountDetails.lastSeenDate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* IP Address Card */}
              <div className='bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow'>
                <div className='px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50'>
                  <h3 className='font-semibold text-navy-900 flex items-center'>
                    <Globe className='h-4 w-4 mr-2 text-green-600' />
                    Last IP Address
                  </h3>
                </div>
                <div className='p-5'>
                  <div className='flex items-center justify-center h-16'>
                    <span className='text-gray-800 font-mono text-sm bg-gray-50 py-2 px-4 rounded-lg border border-gray-100'>
                      {accountDetails.lastIpAddress}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
