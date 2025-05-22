// src/routes/submissions.ts - Submissions Routes
import express from 'express';
import { Request, Response } from 'express';
import { protect, optionalAuth } from '../middleware/auth';
import Submission from '../models/Submission';
import Form from '../models/Form';
import { validate } from '../middleware/validation';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { submitFormSchema } from '../validation/schemas';

const router = express.Router();

// @desc    Get all submissions for a form
// @route   GET /api/submissions/form/:formId
// @access  Private
router.get(
  '/form/:formId',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { formId } = req.params;
    const {
      page = '1',
      limit = '20',
      sortBy = 'submittedAt',
      sortOrder = 'desc',
      search,
      dateFrom,
      dateTo,
    } = req.query;

    // Verify form belongs to user
    const form = await Form.findOne({ _id: formId, userId: req.user.id });
    if (!form) {
      throw new ApiError('Form not found', 404);
    }

    // Build query
    const query: any = { formId };

    // Date range filter
    if (dateFrom || dateTo) {
      query.submittedAt = {};
      if (dateFrom) query.submittedAt.$gte = new Date(dateFrom as string);
      if (dateTo) query.submittedAt.$lte = new Date(dateTo as string);
    }

    // Search filter (search in submission data)
    if (search) {
      query.$or = [
        { 'data.email': { $regex: search, $options: 'i' } },
        { 'data.name': { $regex: search, $options: 'i' } },
        { 'data.fullName': { $regex: search, $options: 'i' } },
        { 'data.phone': { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Sort options
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const submissions = await Submission.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await Submission.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        submissions,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total,
          limit: limitNum,
        },
      },
    });
  })
);

// @desc    Get single submission
// @route   GET /api/submissions/:id
// @access  Private
router.get(
  '/:id',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const submission = await Submission.findById(req.params.id).populate(
      'formId'
    );

    if (!submission) {
      throw new ApiError('Submission not found', 404);
    }

    // Verify form belongs to user
    const form = await Form.findOne({
      _id: submission.formId,
      userId: req.user.id,
    });
    if (!form) {
      throw new ApiError('Not authorized to access this submission', 403);
    }

    res.status(200).json({
      success: true,
      data: submission,
    });
  })
);

// @desc    Submit form data (public endpoint)
// @route   POST /api/submissions/:formId/submit
// @access  Public
router.post(
  '/:formId/submit',
  optionalAuth,
  validate(submitFormSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { formId } = req.params;
    const { data: submissionData } = req.body;

    // Check if form exists and is published
    const form = await Form.findById(formId);
    if (!form) {
      throw new ApiError('Form not found', 404);
    }

    if (!form.isPublished) {
      throw new ApiError('Form is not published', 400);
    }

    if (form.isTrashed || form.isArchived) {
      throw new ApiError('Form is not available', 400);
    }

    // Validate submission data against form structure
    const validationErrors = validateSubmissionData(submissionData, form.pages);
    if (validationErrors.length > 0) {
      throw new ApiError(
        `Validation failed: ${validationErrors.join(', ')}`,
        400
      );
    }

    // Create submission record
    const submission = await Submission.create({
      formId,
      data: submissionData,
      submittedAt: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: {
        userId: req.user?.id || null,
        timestamp: new Date().toISOString(),
      },
    });

    // Update form submission count
    await Form.findByIdAndUpdate(formId, {
      $inc: { submissions: 1 },
      $set: { updatedAt: new Date() },
    });

    res.status(201).json({
      success: true,
      data: {
        submissionId: submission._id,
        message:
          form.settings?.thankyouMessage || 'Thank you for your submission!',
      },
      message: 'Form submitted successfully',
    });
  })
);

// @desc    Delete submission
// @route   DELETE /api/submissions/:id
// @access  Private
router.delete(
  '/:id',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      throw new ApiError('Submission not found', 404);
    }

    // Verify form ownership
    const form = await Form.findOne({
      _id: submission.formId,
      userId: req.user.id,
    });
    if (!form) {
      throw new ApiError('Not authorized to delete this submission', 403);
    }

    await Submission.findByIdAndDelete(req.params.id);

    // Update form submission count
    await Form.findByIdAndUpdate(submission.formId, {
      $inc: { submissions: -1 },
    });

    res.status(200).json({
      success: true,
      message: 'Submission deleted successfully',
    });
  })
);

// @desc    Export submissions
// @route   GET /api/submissions/form/:formId/export
// @access  Private
router.get(
  '/form/:formId/export',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { formId } = req.params;
    const { format = 'csv' } = req.query;

    // Verify form belongs to user
    const form = await Form.findOne({ _id: formId, userId: req.user.id });
    if (!form) {
      throw new ApiError('Form not found', 404);
    }

    const submissions = await Submission.find({ formId }).sort({
      submittedAt: -1,
    });

    if (format === 'csv') {
      const csvData = generateCSVExport(submissions, form);
      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${form.title}-submissions.csv"`,
      });
      res.send(csvData);
    } else {
      res.status(200).json({
        success: true,
        data: submissions,
        count: submissions.length,
      });
    }
  })
);

// Helper function to validate submission data
function validateSubmissionData(data: any, pages: any[]): string[] {
  const errors: string[] = [];

  for (const page of pages) {
    for (const field of page.fields || []) {
      const value =
        data[field.id] || data[field.label?.toLowerCase().replace(/\s+/g, '_')];

      // Required field validation
      if (
        field.required &&
        (!value || (typeof value === 'string' && value.trim() === ''))
      ) {
        errors.push(`${field.label} is required`);
        continue;
      }

      if (!value) continue; // Skip validation for empty optional fields

      // Type-specific validation
      switch (field.type) {
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors.push(`${field.label} must be a valid email address`);
          }
          break;

        case 'phone':
          if (!/^\+?[\d\s\-\(\)]+$/.test(value)) {
            errors.push(`${field.label} must be a valid phone number`);
          }
          break;

        case 'fullName':
          if (typeof value !== 'string' || value.trim().length < 2) {
            errors.push(`${field.label} must be at least 2 characters long`);
          }
          break;
      }
    }
  }

  return errors;
}

// Helper function to generate CSV export
function generateCSVExport(submissions: any[], form: any): string {
  if (submissions.length === 0) return 'No submissions found';

  // Get all unique field names
  const allFields = new Set<string>();
  submissions.forEach(submission => {
    Object.keys(submission.data).forEach(field => allFields.add(field));
  });

  const headers = ['Submission ID', 'Submitted At', ...Array.from(allFields)];

  const csvRows = [
    headers.join(','),
    ...submissions.map(submission => {
      const row = [
        submission._id.toString(),
        new Date(submission.submittedAt).toISOString(),
        ...Array.from(allFields).map(field => {
          const value = submission.data[field];
          // Escape commas and quotes in CSV
          if (
            typeof value === 'string' &&
            (value.includes(',') || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }),
      ];
      return row.join(',');
    }),
  ];

  return csvRows.join('\n');
}

export default router;
