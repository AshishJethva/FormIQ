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
