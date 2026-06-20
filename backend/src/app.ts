import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { globalErrorHandler } from './utils/errorHandler';
import { AppError } from './utils/appError';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './utils/errorHandler';

import authRoutes from './routes/auth';
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

// Trust proxy — required on Railway (sits behind a load balancer)
app.set('trust proxy', 1);

// Security HTTP headers
app.use(helmet());
app.use((req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ─── Health check — used by Railway to verify the service is alive ────────────
app.get('/health', async (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const isDbConnected = dbState === 1;

  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: isDbConnected ? 'connected' : 'disconnected',
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

// ─── Root route — API info ─────────────────────────────────────────────────────
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'FormIQ API',
    version: '1.0.0',
    description: 'AI-Powered Form Builder REST API',
    author: 'Ashish Jethva',
    portfolio: 'https://ashishjethva.com',
    github: 'https://github.com/AshishJethva',
    status: 'operational',
    health: '/health',
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai-evaluation', aiEvaluationRoutes);
app.use('/api/user', userProfileRoutes);
app.use('/api/payment', paymentRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// ─── Error handlers ───────────────────────────────────────────────────────────
app.use(globalErrorHandler);
app.use(errorHandler);

export default app;
