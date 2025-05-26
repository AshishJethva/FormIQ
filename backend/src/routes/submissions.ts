// // src/routes/submissions.ts - Submissions Routes
// import express from 'express';
// import { Request, Response } from 'express';
// import { protect } from '../middleware/protect';
// import Submission from '../models/Submission';
// import Form from '../models/Form';
// import { validate } from '../middleware/validation';
// import { asyncHandler } from '../utils/asyncHandler';
// import { ApiError } from '../utils/ApiError';
// import { submitFormSchema } from '../validation/submissionValidation';

// const router = express.Router();

// // @desc    Get all submissions for a form
// // @route   GET /api/submissions/form/:formId
// // @access  Private
// router.get(
//   '/form/:formId',
//   protect,
//   asyncHandler(async (req: Request, res: Response) => {
//     const { formId } = req.params;
//     const {
//       page = '1',
//       limit = '20',
//       sortBy = 'submittedAt',
//       sortOrder = 'desc',
//       search,
//       dateFrom,
//       dateTo,
//     } = req.query;

//     // Verify form belongs to user
//     const form = await Form.findOne({ _id: formId, userId: req.user.id });
//     if (!form) {
//       throw new ApiError('Form not found', 404);
//     }

//     // Build query
//     const query: any = { formId };

//     // Date range filter
//     if (dateFrom || dateTo) {
//       query.submittedAt = {};
//       if (dateFrom) query.submittedAt.$gte = new Date(dateFrom as string);
//       if (dateTo) query.submittedAt.$lte = new Date(dateTo as string);
//     }

//     // Search filter (search in submission data)
//     if (search) {
//       query.$or = [
//         { 'data.email': { $regex: search, $options: 'i' } },
//         { 'data.name': { $regex: search, $options: 'i' } },
//         { 'data.fullName': { $regex: search, $options: 'i' } },
//         { 'data.phone': { $regex: search, $options: 'i' } },
//       ];
//     }

//     // Pagination
//     const pageNum = parseInt(page as string, 10) || 1;
//     const limitNum = parseInt(limit as string, 10) || 20;
//     const skip = (pageNum - 1) * limitNum;

//     // Sort options
//     const sortObj: any = {};
//     sortObj[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

//     const submissions = await Submission.find(query)
//       .sort(sortObj)
//       .skip(skip)
//       .limit(limitNum);

//     const total = await Submission.countDocuments(query);

//     res.status(200).json({
//       success: true,
//       data: {
//         submissions,
//         pagination: {
//           current: pageNum,
//           pages: Math.ceil(total / limitNum),
//           total,
//           limit: limitNum,
//         },
//       },
//     });
//   })
// );

// // @desc    Get single submission
// // @route   GET /api/submissions/:id
// // @access  Private
// router.get(
//   '/:id',
//   protect,
//   asyncHandler(async (req: Request, res: Response) => {
//     const submission = await Submission.findById(req.params.id).populate(
//       'formId'
//     );

//     if (!submission) {
//       throw new ApiError('Submission not found', 404);
//     }

//     // Verify form belongs to user
//     const form = await Form.findOne({
//       _id: submission.formId,
//       userId: req.user.id,
//     });
//     if (!form) {
//       throw new ApiError('Not authorized to access this submission', 403);
//     }

//     res.status(200).json({
//       success: true,
//       data: submission,
//     });
//   })
// );

// // @desc    Submit form data (public endpoint)
// // @route   POST /api/submissions/:formId/submit
// // @access  Public
// router.post(
//   '/:formId/submit',
//   validate(submitFormSchema),
//   asyncHandler(async (req: Request, res: Response) => {
//     const { formId } = req.params;
//     const { data: submissionData } = req.body;

//     // Check if form exists and is published
//     const form = await Form.findById(formId);
//     if (!form) {
//       throw new ApiError('Form not found', 404);
//     }

//     if (!form.isPublished) {
//       throw new ApiError('Form is not published', 400);
//     }

//     if (form.isTrashed || form.isArchived) {
//       throw new ApiError('Form is not available', 400);
//     }

//     // Validate submission data against form structure
//     const validationErrors = validateSubmissionData(submissionData, form.pages);
//     if (validationErrors.length > 0) {
//       throw new ApiError(
//         `Validation failed: ${validationErrors.join(', ')}`,
//         400
//       );
//     }

//     // Create submission record
//     const submission = await Submission.create({
//       formId,
//       data: submissionData,
//       submittedAt: new Date(),
//       ipAddress: req.ip,
//       userAgent: req.get('User-Agent'),
//       metadata: {
//         userId: req.user?.id || null,
//         timestamp: new Date().toISOString(),
//       },
//     });

//     // Update form submission count
//     await Form.findByIdAndUpdate(formId, {
//       $inc: { submissions: 1 },
//       $set: { updatedAt: new Date() },
//     });

//     res.status(201).json({
//       success: true,
//       data: {
//         submissionId: submission._id,
//         message:
//           form.settings?.thankyouMessage || 'Thank you for your submission!',
//       },
//       message: 'Form submitted successfully',
//     });
//   })
// );

// // @desc    Delete submission
// // @route   DELETE /api/submissions/:id
// // @access  Private
// router.delete(
//   '/:id',
//   protect,
//   asyncHandler(async (req: Request, res: Response) => {
//     const submission = await Submission.findById(req.params.id);

//     if (!submission) {
//       throw new ApiError('Submission not found', 404);
//     }

//     // Verify form ownership
//     const form = await Form.findOne({
//       _id: submission.formId,
//       userId: req.user.id,
//     });
//     if (!form) {
//       throw new ApiError('Not authorized to delete this submission', 403);
//     }

//     await Submission.findByIdAndDelete(req.params.id);

//     // Update form submission count
//     await Form.findByIdAndUpdate(submission.formId, {
//       $inc: { submissions: -1 },
//     });

//     res.status(200).json({
//       success: true,
//       message: 'Submission deleted successfully',
//     });
//   })
// );

// // @desc    Export submissions
// // @route   GET /api/submissions/form/:formId/export
// // @access  Private
// router.get(
//   '/form/:formId/export',
//   protect,
//   asyncHandler(async (req: Request, res: Response) => {
//     const { formId } = req.params;
//     const { format = 'csv' } = req.query;

//     // Verify form belongs to user
//     const form = await Form.findOne({ _id: formId, userId: req.user.id });
//     if (!form) {
//       throw new ApiError('Form not found', 404);
//     }

//     const submissions = await Submission.find({ formId }).sort({
//       submittedAt: -1,
//     });

//     if (format === 'csv') {
//       const csvData = generateCSVExport(submissions, form);
//       res.set({
//         'Content-Type': 'text/csv',
//         'Content-Disposition': `attachment; filename="${form.title}-submissions.csv"`,
//       });
//       res.send(csvData);
//     } else {
//       res.status(200).json({
//         success: true,
//         data: submissions,
//         count: submissions.length,
//       });
//     }
//   })
// );

// // Helper function to validate submission data
// function validateSubmissionData(data: any, pages: any[]): string[] {
//   const errors: string[] = [];

//   for (const page of pages) {
//     for (const field of page.fields || []) {
//       const value =
//         data[field.id] || data[field.label?.toLowerCase().replace(/\s+/g, '_')];

//       // Required field validation
//       if (
//         field.required &&
//         (!value || (typeof value === 'string' && value.trim() === ''))
//       ) {
//         errors.push(`${field.label} is required`);
//         continue;
//       }

//       if (!value) continue; // Skip validation for empty optional fields

//       // Type-specific validation
//       switch (field.type) {
//         case 'email':
//           if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
//             errors.push(`${field.label} must be a valid email address`);
//           }
//           break;

//         case 'phone':
//           if (!/^\+?[\d\s\-\(\)]+$/.test(value)) {
//             errors.push(`${field.label} must be a valid phone number`);
//           }
//           break;

//         case 'fullName':
//           if (typeof value !== 'string' || value.trim().length < 2) {
//             errors.push(`${field.label} must be at least 2 characters long`);
//           }
//           break;
//       }
//     }
//   }

//   return errors;
// }

// // Helper function to generate CSV export
// function generateCSVExport(submissions: any[], form: any): string {
//   if (submissions.length === 0) return 'No submissions found';

//   // Get all unique field names
//   const allFields = new Set<string>();
//   submissions.forEach(submission => {
//     Object.keys(submission.data).forEach(field => allFields.add(field));
//   });

//   const headers = ['Submission ID', 'Submitted At', ...Array.from(allFields)];

//   const csvRows = [
//     headers.join(','),
//     ...submissions.map(submission => {
//       const row = [
//         submission._id.toString(),
//         new Date(submission.submittedAt).toISOString(),
//         ...Array.from(allFields).map(field => {
//           const value = submission.data[field];
//           // Escape commas and quotes in CSV
//           if (
//             typeof value === 'string' &&
//             (value.includes(',') || value.includes('"'))
//           ) {
//             return `"${value.replace(/"/g, '""')}"`;
//           }
//           return value || '';
//         }),
//       ];
//       return row.join(',');
//     }),
//   ];

//   return csvRows.join('\n');
// }

// export default router;

// src/routes/submissions.ts - Enhanced Submissions Routes
import express from 'express';
import { Request, Response } from 'express';
import { protect } from '../middleware/protect';
import Submission from '../models/Submission';
import Form from '../models/Form';
import { validate } from '../middleware/validation';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { submitFormSchema } from '../validation/submissionValidation';
import mongoose from 'mongoose';

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
      status,
      isRead,
    } = req.query;

    // Validate formId
    if (!mongoose.Types.ObjectId.isValid(formId)) {
      throw new ApiError('Invalid form ID format', 400);
    }

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
      if (dateFrom) {
        query.submittedAt.$gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        const endDate = new Date(dateTo as string);
        endDate.setHours(23, 59, 59, 999); // End of day
        query.submittedAt.$lte = endDate;
      }
    }

    // Status filter
    if (
      status &&
      ['pending', 'processed', 'failed'].includes(status as string)
    ) {
      query.status = status;
    }

    // Read status filter
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    // Search filter (search in submission data)
    if (search) {
      query.$or = [
        { 'data.email': { $regex: search, $options: 'i' } },
        { 'data.name': { $regex: search, $options: 'i' } },
        { 'data.fullName.firstName': { $regex: search, $options: 'i' } },
        { 'data.fullName.lastName': { $regex: search, $options: 'i' } },
        { 'data.phone': { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = Math.min(parseInt(limit as string, 10) || 20, 100); // Max 100 per page
    const skip = (pageNum - 1) * limitNum;

    // Sort options
    const sortObj: any = {};
    const validSortFields = ['submittedAt', 'createdAt', 'status', 'isRead'];
    const sortField = validSortFields.includes(sortBy as string)
      ? (sortBy as string)
      : 'submittedAt';
    sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;

    const [submissions, total] = await Promise.all([
      Submission.find(query).sort(sortObj).skip(skip).limit(limitNum).lean(),
      Submission.countDocuments(query),
    ]);

    // Get submission statistics
    const stats = await Submission.aggregate([
      { $match: { formId: new mongoose.Types.ObjectId(formId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          processed: {
            $sum: { $cond: [{ $eq: ['$status', 'processed'] }, 1, 0] },
          },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        submissions,
        stats: stats[0] || {
          total: 0,
          unread: 0,
          pending: 0,
          processed: 0,
          failed: 0,
        },
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
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid submission ID format', 400);
    }

    const submission = await Submission.findById(id).populate('formId');

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

    // Mark as read if not already
    if (!(submission as any).isRead) {
      await Submission.findByIdAndUpdate(id, { isRead: true });
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
  validate(submitFormSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { formId } = req.params;
    const { data: submissionData } = req.body;

    // Validate formId
    if (!mongoose.Types.ObjectId.isValid(formId)) {
      throw new ApiError('Invalid form ID format', 400);
    }

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

    // Check if multiple submissions are allowed
    if (!form.settings?.allowMultipleSubmissions) {
      const clientIp = req.ip || req.connection.remoteAddress;
      if (clientIp) {
        const existingSubmission = await Submission.findOne({
          formId,
          ipAddress: clientIp,
          submittedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
        });

        if (existingSubmission) {
          throw new ApiError(
            'You have already submitted this form recently',
            429
          );
        }
      }
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
    const submissionPayload: any = {
      formId,
      data: submissionData,
      submittedAt: new Date(),
      status: 'processed',
      metadata: {
        timestamp: new Date().toISOString(),
        formVersion: form.updatedAt,
      },
    };

    // Add IP address if collection is enabled
    if (form.settings?.collectIpAddress !== false) {
      submissionPayload.ipAddress = req.ip || req.connection.remoteAddress;
    }

    // Add user agent and referrer
    submissionPayload.userAgent = req.get('User-Agent');
    submissionPayload.referrer = req.get('Referer');

    const submission = await Submission.create(submissionPayload);

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
        submittedAt: submission.submittedAt,
      },
      message: 'Form submitted successfully',
    });
  })
);

// @desc    Update submission status
// @route   PATCH /api/submissions/:id/status
// @access  Private
router.patch(
  '/:id/status',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid submission ID format', 400);
    }

    if (!['pending', 'processed', 'failed'].includes(status)) {
      throw new ApiError('Invalid status value', 400);
    }

    const submission = await Submission.findById(id);
    if (!submission) {
      throw new ApiError('Submission not found', 404);
    }

    // Verify form ownership
    const form = await Form.findOne({
      _id: submission.formId,
      userId: req.user.id,
    });
    if (!form) {
      throw new ApiError('Not authorized to update this submission', 403);
    }

    await Submission.findByIdAndUpdate(id, { status });

    res.status(200).json({
      success: true,
      data: { status: status },
      message: 'Submission status updated successfully',
    });
  })
);

// @desc    Mark submission as read/unread
// @route   PATCH /api/submissions/:id/read
// @access  Private
router.patch(
  '/:id/read',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isRead } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid submission ID format', 400);
    }

    const submission = await Submission.findById(id);
    if (!submission) {
      throw new ApiError('Submission not found', 404);
    }

    // Verify form ownership
    const form = await Form.findOne({
      _id: submission.formId,
      userId: req.user.id,
    });
    if (!form) {
      throw new ApiError('Not authorized to update this submission', 403);
    }

    await Submission.findByIdAndUpdate(id, { isRead: Boolean(isRead) });

    res.status(200).json({
      success: true,
      data: { isRead: Boolean(isRead) },
      message: `Submission marked as ${Boolean(isRead) ? 'read' : 'unread'}`,
    });
  })
);

// @desc    Add tag to submission
// @route   POST /api/submissions/:id/tags
// @access  Private
router.post(
  '/:id/tags',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { tag } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid submission ID format', 400);
    }

    if (!tag || typeof tag !== 'string' || tag.trim().length === 0) {
      throw new ApiError('Tag is required and must be a non-empty string', 400);
    }

    const submission = await Submission.findById(id);
    if (!submission) {
      throw new ApiError('Submission not found', 404);
    }

    // Verify form ownership
    const form = await Form.findOne({
      _id: submission.formId,
      userId: req.user.id,
    });
    if (!form) {
      throw new ApiError('Not authorized to update this submission', 403);
    }

    await Submission.findByIdAndUpdate(id, {
      $addToSet: { tags: tag.trim() },
    });

    // Fetch updated submission to get the tags
    const updatedSubmission = await Submission.findById(id);

    res.status(200).json({
      success: true,
      data: { tags: (updatedSubmission as any)?.tags || [] },
      message: 'Tag added successfully',
    });
  })
);

// @desc    Remove tag from submission
// @route   DELETE /api/submissions/:id/tags/:tag
// @access  Private
router.delete(
  '/:id/tags/:tag',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { id, tag } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid submission ID format', 400);
    }

    const submission = await Submission.findById(id);
    if (!submission) {
      throw new ApiError('Submission not found', 404);
    }

    // Verify form ownership
    const form = await Form.findOne({
      _id: submission.formId,
      userId: req.user.id,
    });
    if (!form) {
      throw new ApiError('Not authorized to update this submission', 403);
    }

    await Submission.findByIdAndUpdate(id, {
      $pull: { tags: decodeURIComponent(tag) },
    });

    // Fetch updated submission to get the tags
    const updatedSubmission = await Submission.findById(id);

    res.status(200).json({
      success: true,
      data: { tags: (updatedSubmission as any)?.tags || [] },
      message: 'Tag removed successfully',
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
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid submission ID format', 400);
    }

    const submission = await Submission.findById(id);
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

    await Submission.findByIdAndDelete(id);

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

// @desc    Bulk operations on submissions
// @route   PATCH /api/submissions/bulk
// @access  Private
router.patch(
  '/bulk',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { submissionIds, action, value } = req.body;

    if (!submissionIds || !Array.isArray(submissionIds) || !action) {
      throw new ApiError('Submission IDs and action are required', 400);
    }

    if (submissionIds.length === 0) {
      throw new ApiError('At least one submission ID is required', 400);
    }

    // Validate all submission IDs
    const invalidIds = submissionIds.filter(
      id => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      throw new ApiError(
        `Invalid submission IDs: ${invalidIds.join(', ')}`,
        400
      );
    }

    // Verify all submissions belong to user's forms
    const submissions = await Submission.find({ _id: { $in: submissionIds } });
    if (submissions.length !== submissionIds.length) {
      throw new ApiError('Some submissions not found', 404);
    }

    const formIds = [...new Set(submissions.map(s => s.formId.toString()))];
    const userForms = await Form.find({
      _id: { $in: formIds },
      userId: req.user.id,
    });

    if (userForms.length !== formIds.length) {
      throw new ApiError('Not authorized to modify some submissions', 403);
    }

    let updateData: any = {};
    let message = '';

    switch (action) {
      case 'markRead':
        updateData = { isRead: true };
        message = 'Submissions marked as read';
        break;
      case 'markUnread':
        updateData = { isRead: false };
        message = 'Submissions marked as unread';
        break;
      case 'setStatus':
        if (!['pending', 'processed', 'failed'].includes(value)) {
          throw new ApiError('Invalid status value', 400);
        }
        updateData = { status: value };
        message = `Submissions status set to ${value}`;
        break;
      case 'addTag':
        if (!value || typeof value !== 'string') {
          throw new ApiError('Tag value is required', 400);
        }
        // For adding tags, we need to use a different approach
        await Submission.updateMany(
          { _id: { $in: submissionIds } },
          { $addToSet: { tags: value.trim() } }
        );
        res.status(200).json({
          success: true,
          message: 'Tag added to submissions',
        });
        return;
      default:
        throw new ApiError('Invalid action', 400);
    }

    const result = await Submission.updateMany(
      { _id: { $in: submissionIds } },
      updateData
    );

    res.status(200).json({
      success: true,
      message: `${message} (${result.modifiedCount} updated)`,
      modified: result.modifiedCount,
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
    const { format = 'csv', dateFrom, dateTo } = req.query;

    if (!mongoose.Types.ObjectId.isValid(formId)) {
      throw new ApiError('Invalid form ID format', 400);
    }

    // Verify form belongs to user
    const form = await Form.findOne({ _id: formId, userId: req.user.id });
    if (!form) {
      throw new ApiError('Form not found', 404);
    }

    // Build query for date range
    const query: any = { formId };
    if (dateFrom || dateTo) {
      query.submittedAt = {};
      if (dateFrom) query.submittedAt.$gte = new Date(dateFrom as string);
      if (dateTo) {
        const endDate = new Date(dateTo as string);
        endDate.setHours(23, 59, 59, 999);
        query.submittedAt.$lte = endDate;
      }
    }

    const submissions = await Submission.find(query)
      .sort({ submittedAt: -1 })
      .lean();

    if (format === 'csv') {
      const csvData = generateCSVExport(submissions, form);
      const filename = `${form.title.replace(/[^a-zA-Z0-9]/g, '_')}-submissions-${new Date().toISOString().split('T')[0]}.csv`;

      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      });
      res.send(csvData);
    } else if (format === 'json') {
      const filename = `${form.title.replace(/[^a-zA-Z0-9]/g, '_')}-submissions-${new Date().toISOString().split('T')[0]}.json`;

      res.set({
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      });
      res.json({
        success: true,
        data: {
          form: {
            id: form.id,
            title: form.title,
            exportedAt: new Date().toISOString(),
          },
          submissions,
          count: submissions.length,
        },
      });
    } else {
      throw new ApiError(
        'Invalid export format. Supported formats: csv, json',
        400
      );
    }
  })
);

// Helper function to validate submission data
function validateSubmissionData(data: any, pages: any[]): string[] {
  const errors: string[] = [];

  for (const page of pages) {
    for (const field of page.fields || []) {
      const value = data[field.id];

      // Required field validation
      if (field.required) {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors.push(`${field.label} is required`);
          continue;
        }

        // Special validation for complex field types
        if (field.type === 'fullName' && typeof value === 'object') {
          if (!value.firstName || !value.lastName) {
            errors.push(`${field.label} requires both first and last name`);
            continue;
          }
        }

        if (field.type === 'address' && typeof value === 'object') {
          if (!value.street || !value.city || !value.state) {
            errors.push(`${field.label} requires street, city, and state`);
            continue;
          }
        }

        if (field.type === 'appointment' && typeof value === 'object') {
          if (!value.date || !value.time) {
            errors.push(`${field.label} requires both date and time`);
            continue;
          }
        }
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
          if (!/^\+?[\d\s\-\(\)]{10,}$/.test(value.replace(/\s/g, ''))) {
            errors.push(`${field.label} must be a valid phone number`);
          }
          break;

        case 'fullName':
          if (typeof value === 'string' && value.trim().length < 2) {
            errors.push(`${field.label} must be at least 2 characters long`);
          }
          break;

        case 'datePicker':
          if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            errors.push(`${field.label} must be a valid date (YYYY-MM-DD)`);
          }
          break;
      }
    }
  }

  return errors;
}

// Helper function to generate CSV export
function generateCSVExport(submissions: any[], form: any): string {
  if (submissions.length === 0) {
    return 'No submissions found';
  }

  // Get all unique field names from all submissions
  const allFields = new Set<string>();
  submissions.forEach(submission => {
    Object.keys(submission.data).forEach(field => allFields.add(field));
  });

  // Create headers
  const headers = [
    'Submission ID',
    'Submitted At',
    'Status',
    'Is Read',
    'IP Address',
    'User Agent',
    ...Array.from(allFields),
  ];

  // Helper function to escape CSV values
  const escapeCSVValue = (value: any): string => {
    if (value === null || value === undefined) return '';

    let str = String(value);
    if (typeof value === 'object') {
      str = JSON.stringify(value);
    }

    // Escape quotes and wrap in quotes if necessary
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      str = `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  };

  const csvRows = [
    headers.join(','),
    ...submissions.map(submission => {
      const row = [
        submission._id.toString(),
        new Date(submission.submittedAt).toISOString(),
        submission.status || 'processed',
        submission.isRead ? 'Yes' : 'No',
        submission.ipAddress || '',
        submission.userAgent || '',
        ...Array.from(allFields).map(field => {
          const value = submission.data[field];
          return escapeCSVValue(value);
        }),
      ];
      return row.join(',');
    }),
  ];

  return csvRows.join('\n');
}

export default router;
