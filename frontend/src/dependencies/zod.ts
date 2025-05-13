import { z } from 'zod';

// Schema for login form validation
export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' }),
});
export type LoginSchema = z.infer<typeof loginSchema>;

export const passwordSignUpSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^a-zA-Z0-9]/,
    'Password must contain at least one special character'
  );

// Schema for registration form validation
export const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be less than 50 characters'),
    email: z.string().email('Invalid email address'),
    password: passwordSignUpSchema,
    passwordConfirm: z.string(),
  })
  .refine(data => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ['passwordConfirm'], // This shows the error on passwordConfirm field
  });
export type SignupSchema = z.infer<typeof signupSchema>;

// const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
// const ACCEPTED_IMAGE_TYPES = [
//   'image/jpeg',
//   'image/jpg',
//   'image/png',
//   'image/webp',
// ];

// Schema for password change form validation

export const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .min(1, 'New password is required')
      .refine(
        password =>
          /[A-Z]/.test(password) &&
          /[a-z]/.test(password) &&
          /[0-9]/.test(password) &&
          /[^A-Za-z0-9]/.test(password),
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.new_password === data.confirm_password, {
    message: 'Passwords must match',
    path: ['confirm_password'],
  });
export type PasswordSchema = z.infer<typeof passwordSchema>;

// Schema for email request form validation
export const emailSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
});
export type EmailRequest = z.infer<typeof emailSchema>;

// Schema for OTP request form validation
export const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits').min(1, 'OTP is required'),
});
export type OTPRequest = z.infer<typeof otpSchema>;

// Schema for reset password form validation
export const resetPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .min(1, 'Password is required')
      .refine(
        password =>
          /[A-Z]/.test(password) &&
          /[a-z]/.test(password) &&
          /[0-9]/.test(password) &&
          /[^A-Za-z0-9]/.test(password),
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    confirm_password: z.string().min(1, 'Confirm password is required'),
  })
  .refine(data => data.new_password === data.confirm_password, {
    message: 'Passwords must match',
    path: ['confirm_password'],
  });

export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
