import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

export const aiGenerationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    success: false,
    message: 'Too many AI generation requests. Please try again in a minute.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise fall back to IP
    return (req as any).user?.id || req.ip;
  },
  skip: (req: Request) => {
    return process.env.NODE_ENV === 'development';
  },
  handler: (req: Request, res: Response) => {
    console.warn('AI Generation Rate Limit Reached:', {
      userId: (req as any).user?.id,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    res.status(429).json({
      success: false,
      message: 'Too many AI generation requests. Please try again in a minute.',
      retryAfter: 60,
    });
  },
});
