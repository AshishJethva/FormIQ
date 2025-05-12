import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ZodError } from 'zod';
import User from '../models/userModel';
import { signupSchema, loginSchema } from '../schemas/authSchema';
import { AppError } from '../utils/appError';
import { catchAsync } from '../utils/catchAsync';
import { UserPayload } from '../types/index';
import { sendOTPEmail } from '../utils/email';

// Helper function to sign JWT token
const signToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN
      ? parseInt(process.env.JWT_EXPIRES_IN)
      : '90d',
  });
};

const createSendToken = (
  user: UserPayload,
  statusCode: number,
  res: Response
) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() +
        parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '90') *
          24 *
          60 *
          60 *
          1000
    ),
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite:
      process.env.NODE_ENV === 'production'
        ? ('none' as const)
        : ('lax' as const),
  };

  // Set the cookie
  res.cookie('token', token, cookieOptions);

  // Remove password from output
  user.password = undefined;
  user.otpCode = undefined;
  user.otpExpires = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// Verify OTP code
export const verifyOTP = catchAsync(async (req: Request, res: Response) => {
  const { otp, user_id } = req.body;

  // Validate request body
  if (!otp || !user_id) {
    return res.status(400).json({
      status: 'fail',
      message: 'Please provide OTP code and user ID',
    });
  }

  // Find user by ID and explicitly include OTP fields
  const user = await User.findById(user_id).select('+otpCode +otpExpires');

  // Check if user exists
  if (!user) {
    return res.status(404).json({
      status: 'fail',
      message: 'No user found with that ID',
    });
  }

  // Check if user already verified
  if (user.isVerified) {
    return res.status(400).json({
      status: 'fail',
      message: 'This user is already verified',
    });
  }

  // Check if OTP exists and still valid
  if (!user.otpCode || !user.otpExpires) {
    return res.status(400).json({
      status: 'fail',
      message: 'OTP is invalid or has expired',
    });
  }

  // Check if OTP is expired
  if (user.otpExpires < new Date()) {
    return res.status(400).json({
      status: 'fail',
      message: 'OTP has expired',
    });
  }

  // Verify OTP
  if (String(user.otpCode) !== String(otp)) {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid OTP',
    });
  }

  // Update user to verified
  user.isVerified = true;
  user.otpCode = undefined;
  user.otpExpires = undefined;
  await user.save({ validateBeforeSave: false });

  // Send success response with token
  createSendToken(user.toObject() as UserPayload, 200, res);
});

// Generate OTP for user
export const sendOTP = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  // Find user by email
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      status: 'fail',
      message: 'No user found with that email',
    });
  }

  // Check if already verified
  if (user.isVerified) {
    return res.status(400).json({
      status: 'fail',
      message: 'User is already verified',
    });
  }

  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Save OTP to user
  user.otpCode = otpCode;
  user.otpExpires = otpExpires;
  await user.save({ validateBeforeSave: false });

  try {
    // Send the OTP via email
    await sendOTPEmail(user, otpCode);

    res.status(200).json({
      status: 'success',
      message: 'Verification code sent to your email',
      // For development, still include OTP in response
      ...(process.env.NODE_ENV === 'development' && { otp: otpCode }),
      user_id: user._id,
    });
  } catch {
    // If error sending OTP, reset user's OTP fields
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      status: 'error',
      message: 'Error sending verification email. Please try again later.',
    });
  }
});

// Signup handler
export const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate input data using Zod
      const validatedData = signupSchema.parse(req.body);

      // Create a new user
      const newUser = await User.create({
        name: validatedData.name,
        email: validatedData.email,
        password: validatedData.password,
        passwordConfirm: validatedData.passwordConfirm,
        isVerified: false, // User needs to verify with OTP
      });

      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save OTP to user
      newUser.otpCode = otpCode;
      newUser.otpExpires = otpExpires;
      await newUser.save({ validateBeforeSave: false });

      try {
        // Send OTP via email
        await sendOTPEmail(newUser, otpCode);

        // Return response
        res.status(201).json({
          status: 'success',
          message:
            'Account created! Please check your email for verification code.',
          // Only include OTP in development for testing
          ...(process.env.NODE_ENV === 'development' && { otp: otpCode }),
          user_id: newUser._id,
        });
      } catch (error) {
        // If email fails, still create the account but notify the user
        console.error('Error sending email:', error);

        res.status(201).json({
          status: 'partial_success',
          message:
            'Account created but we could not send a verification email. Please request a new code.',
          user_id: newUser._id,
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid input data',
          errors: error.errors,
        });
      }

      // Handle duplicate email error
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 11000
      ) {
        return res.status(400).json({
          status: 'error',
          message: 'Email already in use',
        });
      }

      console.error('Registration error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong during registration',
      });

      // Pass other errors to error handler
      next(error);
    }
  }
);

// Login handler
export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate input data using Zod
      const { email, password } = loginSchema.parse(req.body);

      // Check if email and password exist
      if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
      }

      // Find user by email and explicitly select the password
      const user = await User.findOne({ email }).select('+password');

      // Check if user exists & password is correct
      if (!user || !(await user.comparePassword(password))) {
        return next(new AppError('Incorrect email or password', 401));
      }

      // Check if user is verified
      if (!user.isVerified) {
        // Generate new OTP for user
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.otpCode = otpCode;
        user.otpExpires = otpExpires;
        await user.save({ validateBeforeSave: false });

        try {
          // Send OTP via email
          await sendOTPEmail(user, otpCode);

          return res.status(401).json({
            status: 'fail',
            message:
              'Account not verified. A verification code has been sent to your email.',
            // Only include OTP in development
            ...(process.env.NODE_ENV === 'development' && { otp: otpCode }),
            user_id: user._id,
            requiresVerification: true,
          });
        } catch {
          return res.status(500).json({
            status: 'error',
            message:
              'Error sending verification email. Please try again later.',
            user_id: user._id,
            requiresVerification: true,
          });
        }
      }

      // Send JWT token
      createSendToken(user.toObject() as UserPayload, 200, res);
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid input data',
          errors: error.errors,
        });
      }

      // Pass other errors to error handler
      next(error);
    }
  }
);

// Logout handler
export const logout = (req: Request, res: Response) => {
  res.cookie('token', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
  });

  res
    .status(200)
    .json({ status: 'success', message: 'Logged out successfully' });
};
