import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
// import helmet from 'helmet';

import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import formRoutes from './routes/forms';
import { globalErrorHandler } from './utils/errorHandler';
import { AppError } from './utils/appError';
import uploadRoutes from './routes/upload';

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

// app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/forms', formRoutes);

app.use('/api/upload', uploadRoutes);

app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(globalErrorHandler);

export default app;
