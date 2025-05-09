import { Request, Response, NextFunction } from 'express';
import { Document } from 'mongoose';
import jwt from 'jsonwebtoken';
import { ZodError } from 'zod';
import User from '../models/User';
import { signupSchema, loginSchema } from '../schemas/auth.schema';
import { AppError } from '../utils/appError';
import { catchAsync } from '../utils/catchAsync';

// Define interface for JWT payload
interface JwtPayload {
  id: string;
  iat: number;
}

export interface RequestWithUser extends Request {
  user?: Document; // Or use a more specific type if you have a User interface
}

// Helper function to sign JWT token
const signToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN
      ? parseInt(process.env.JWT_EXPIRES_IN)
      : '90d',
  });
};

// Send JWT token as a cookie
interface UserPayload {
  _id: string;
  password?: string;
}

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
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite:
      process.env.NODE_ENV === 'production'
        ? ('none' as const)
        : ('lax' as const),
  };

  // Set the cookie
  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

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
        passwordChangedAt: new Date(),
      });

      // Send JWT token
      createSendToken(newUser.toObject() as UserPayload, 201, res);
    } catch (error) {
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

// Protect routes middleware
export const protect = catchAsync(
  async (req: RequestWithUser, res: Response, next: NextFunction) => {
    // Get token from authorization header or cookies
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    // Check if token exists
    if (!token) {
      return next(
        new AppError('You are not logged in. Please log in to get access', 401)
      );
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as JwtPayload;

    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError('The user belonging to this token no longer exists', 401)
      );
    }

    // Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError('User recently changed password! Please log in again', 401)
      );
    }

    // Grant access to protected route and add user to request object
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  }
);

// Logout handler
export const logout = (req: Request, res: Response) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: 'success' });
};
