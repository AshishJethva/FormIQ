// src/middleware/debugMiddleware.ts - Debug middleware for form submissions

import { Request, Response, NextFunction } from 'express';

interface DebugRequest extends Request {
  startTime?: number;
  debugInfo?: any;
}

/**
 * Enhanced debugging middleware for form submissions
 */
export const debugFormSubmission = (
  req: DebugRequest,
  res: Response,
  next: NextFunction
) => {
  req.startTime = Date.now();

  console.log('🚀 FORM SUBMISSION REQUEST DEBUG:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    headers: {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length'],
      'user-agent': req.headers['user-agent'],
      origin: req.headers.origin,
      referer: req.headers.referer,
    },
  });

  // Log request body details
  if (req.body) {
    console.log('📋 REQUEST BODY ANALYSIS:', {
      bodyType: typeof req.body,
      bodySize: JSON.stringify(req.body).length,
      bodyKeys: Object.keys(req.body || {}),
      hasData: !!req.body.data,
      hasFiles: !!req.body.files,
      dataKeys: req.body.data ? Object.keys(req.body.data) : [],
      fileKeys: req.body.files ? Object.keys(req.body.files) : [],
    });

    // Log sample of form data (first 3 fields)
    if (req.body.data) {
      const sampleData = Object.fromEntries(
        Object.entries(req.body.data)
          .slice(0, 3)
          .map(([key, value]) => [
            key,
            typeof value === 'string' && value.length > 100
              ? `${value.substring(0, 100)}...`
              : value,
          ])
      );
      console.log('📊 FORM DATA SAMPLE:', sampleData);
    }

    // Log file data summary
    if (req.body.files) {
      const fileSummary = Object.fromEntries(
        Object.entries(req.body.files).map(([fieldId, files]) => [
          fieldId,
          Array.isArray(files)
            ? `${files.length} files`
            : files
              ? '1 file'
              : 'no file',
        ])
      );
      console.log('📎 FILE DATA SUMMARY:', fileSummary);
    }
  }

  // Intercept response to log completion
  const originalSend = res.send;
  res.send = function (data: any) {
    const duration = req.startTime ? Date.now() - req.startTime : 0;

    console.log('📤 FORM SUBMISSION RESPONSE:', {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: data ? JSON.stringify(data).length : 0,
      success: res.statusCode < 400,
    });

    if (res.statusCode >= 400) {
      console.error('❌ FORM SUBMISSION ERROR RESPONSE:', {
        statusCode: res.statusCode,
        error: typeof data === 'string' ? data : JSON.stringify(data),
      });
    } else {
      console.log('✅ FORM SUBMISSION SUCCESS');
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Request validation middleware
 */
export const validateFormSubmissionRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log('🔍 VALIDATING FORM SUBMISSION REQUEST');

  // Check content type
  const contentType = req.get('Content-Type');
  if (!contentType || !contentType.includes('application/json')) {
    console.error('❌ Invalid content type:', contentType);
    return res.status(400).json({
      success: false,
      error: 'Invalid content type',
      message: 'Content-Type must be application/json',
      received: contentType,
    });
  }

  // Check if body exists
  if (!req.body) {
    console.error('❌ Missing request body');
    return res.status(400).json({
      success: false,
      error: 'Missing request body',
      message: 'Request body is required',
    });
  }

  // Check if body is valid object
  if (typeof req.body !== 'object') {
    console.error('❌ Invalid request body type:', typeof req.body);
    return res.status(400).json({
      success: false,
      error: 'Invalid request body',
      message: 'Request body must be a valid JSON object',
      received: typeof req.body,
    });
  }

  console.log('✅ Request validation passed');
  next();
};

/**
 * Error handling middleware for form submissions
 */
export const handleFormSubmissionError = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('❌ FORM SUBMISSION ERROR HANDLER:', {
    error: error.message,
    stack: error.stack?.split('\n').slice(0, 5),
    statusCode: error.statusCode || 500,
    type: error.constructor.name,
    formId: req.params.formId,
  });

  // Determine error type and response
  let statusCode = 500;
  let message = 'Internal server error';

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = `Validation error: ${error.message}`;
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid data format';
  } else if (error.code === 11000) {
    statusCode = 400;
    message = 'Duplicate entry error';
  } else if (error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
  }

  res.status(statusCode).json({
    success: false,
    error: error.name || 'ServerError',
    message,
    ...(process.env.NODE_ENV === 'development' && {
      details: error.message,
      stack: error.stack,
    }),
  });
};

/**
 * Performance monitoring middleware
 */
export const monitorFormSubmissionPerformance = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds

    console.log('⏱️ PERFORMANCE METRICS:', {
      url: req.originalUrl,
      method: req.method,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      bodySize: req.body ? JSON.stringify(req.body).length : 0,
      formId: req.params.formId,
    });

    // Log slow requests
    if (duration > 5000) {
      console.warn('🐌 SLOW REQUEST DETECTED:', {
        duration: `${duration.toFixed(2)}ms`,
        url: req.originalUrl,
        formId: req.params.formId,
      });
    }
  });

  next();
};

export default {
  debugFormSubmission,
  validateFormSubmissionRequest,
  handleFormSubmissionError,
  monitorFormSubmissionPerformance,
};
