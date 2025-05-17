import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class values into a single className string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a 15-digit unique identifier
 * This ensures we always get exactly 15 digits for compatibility
 */
export function generateUniqueId(): string {
  // Get timestamp component (first 10 digits)
  const timestamp = Date.now().toString().substring(0, 10);

  // Generate 5 random digits for the remainder
  const randomDigits = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');

  // Combine to create a 15-digit ID
  return `${timestamp}${randomDigits}`;
}

/**
 * Format a date as a readable string
 */
export function formatDate(date: Date | number): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a datetime as a readable string with time
 */
export function formatDateTime(date: Date | number): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(timeString: string): string {
  try {
    // Check if timeString is just a time (HH:MM)
    if (/^\d{1,2}:\d{2}$/.test(timeString)) {
      // Extract hours and minutes
      const [hours, minutes] = timeString.split(':').map(Number);

      // Determine AM/PM
      const period = hours >= 12 ? 'PM' : 'AM';

      // Convert to 12-hour format
      const displayHours = hours % 12 || 12;

      // Format the time string
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }

    // For full date strings, use the standard Date formatting
    const date = new Date(timeString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return timeString; // Return original if invalid
    }

    // Format the time in AM/PM
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString; // Return original on error
  }
}

/**
 * Truncate a string to a specified length and add ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Capitalize the first letter of a string
 */
export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate a random color from a predefined palette
 */
export function getRandomColor(): string {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#FFA62B',
    '#C5E99B',
    '#A78BFA',
    '#F8B195',
    '#F67280',
    '#C06C84',
    '#6C5B7B',
    '#355C7D',
    '#99B898',
    '#FECEAB',
    '#FF847C',
    '#E84A5F',
    '#2A363B',
    '#E27D60',
    '#85DCB',
    '#E8A87C',
    '#C38D9E',
    '#41B3A3',
  ];

  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Convert a file to a data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Format file size in a human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
