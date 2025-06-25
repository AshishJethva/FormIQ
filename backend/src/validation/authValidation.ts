import { z } from 'zod';

// Signup validation schema
export const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be less than 50 characters'),
    email: z
      .string()
      .email('Invalid email address')
      .trim()
      .min(5, 'Email must be at least 5 characters')
      .max(100, 'Email must be less than 100 characters'),
    password: z
      .string()
      .trim()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must be less than 100 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    passwordConfirm: z
      .string()
      .trim()
      .min(8, 'Password confirmation must be at least 8 characters'),
  })
  .refine(data => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ['passwordConfirm'],
  });

export type SignupInput = z.infer<typeof signupSchema>;

// Login validation schema
export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().trim().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Email schema for forgot password requests
export const emailSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .trim()
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must be less than 100 characters'),
});

export type EmailRequest = z.infer<typeof emailSchema>;

// OTP validation schema
export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers'),
  user_id: z.string().min(1, 'User ID is required'),
});

export type OTPRequest = z.infer<typeof otpSchema>;

// Password reset validation schema
export const resetPasswordSchema = z
  .object({
    new_password: z
      .string()
      .trim()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must be less than 100 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirm_password: z
      .string()
      .trim()
      .min(8, 'Password confirmation must be at least 8 characters'),
  })
  .refine(data => data.new_password === data.confirm_password, {
    message: 'Passwords must match',
    path: ['confirm_password'],
  });

export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;

// Change password validation schema (for authenticated users)
export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z
      .string()
      .trim()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must be less than 100 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirm_password: z
      .string()
      .trim()
      .min(8, 'Password confirmation must be at least 8 characters'),
  })
  .refine(data => data.new_password === data.confirm_password, {
    message: 'Passwords must match',
    path: ['confirm_password'],
  });

export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;

// Resend OTP validation schema
export const resendOTPSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .trim()
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must be less than 100 characters'),
});

export type ResendOTPRequest = z.infer<typeof resendOTPSchema>;
