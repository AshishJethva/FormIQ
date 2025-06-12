import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import { globalErrorHandler } from './utils/errorHandler';
import { AppError } from './utils/appError';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './utils/errorHandler';

import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import formRoutes from './routes/forms';
import labelRoutes from './routes/labels';
import aiRoutes from './routes/ai';
import uploadRoutes from './routes/upload';
import publicRoutes from './routes/public';
import submissionRoutes from './routes/submissions';
import aiEvaluationRoutes from './routes/aiEvaluation';
import userProfileRoutes from './routes/userProfile';
import paymentRoutes from './routes/payment';

const app = express();

// Set security HTTP headers
app.use((req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minutes
  max: 2000,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai-evaluation', aiEvaluationRoutes);
app.use('/api/user', userProfileRoutes);
app.use('/api/payment', paymentRoutes);

app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);
app.use(errorHandler);

export default app;
