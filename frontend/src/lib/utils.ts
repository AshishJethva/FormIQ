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
