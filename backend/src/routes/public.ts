// src/routes/public.ts - Updated with Form Status Integration
import express from 'express';
import { Request, Response } from 'express';
import Form from '../models/Form';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiBasicError';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * Helper function to check if form is available for public access
 */
const checkFormAvailability = (form: any) => {
  if (!form.isPublished) {
    return { available: false, reason: 'Form is not published' };
  }

  if (form.settings?.isEnabled === false) {
    return {
      available: false,
      reason: 'Form is currently disabled and not accepting submissions',
    };
  }

  if (form.isTrashed) {
    return { available: false, reason: 'Form has been deleted' };
  }

  if (form.isArchived) {
    return { available: false, reason: 'Form has been archived' };
  }

  return { available: true, reason: 'Form is available' };
};

// @desc    Get published form for public access
// @route   GET /api/public/forms/:id
// @access  Public
router.get(
  '/forms/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    console.log(`📄 Public form request for ID: ${id}`);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`❌ Invalid ObjectId format: ${id}`);
      throw new ApiError('Invalid form ID format', 400);
    }

    const form = await Form.findById(id);

    if (!form) {
      console.log(`❌ Form not found: ${id}`);
      throw new ApiError('Form not found', 404);
    }

    // Check form availability
    const { available, reason } = checkFormAvailability(form);

    if (!available) {
      console.log(`❌ Form not available: ${id} - ${reason}`);
      throw new ApiError(reason, 403);
    }

    // Increment view count
    try {
      await Form.findByIdAndUpdate(id, { $inc: { views: 1 } });
      console.log(`📊 Incremented view count for form: ${id}`);
    } catch (viewError) {
      console.log('⚠️ Error incrementing view count:', viewError);
      // Don't fail the request if view count update fails
    }

    // Return only necessary data for public form
    const publicFormData = {
      id: form.id,
      title: form.title || 'Untitled Form',
      description: form.description,
      pages: form.pages || [],
      settings: {
        submitButtonText: form.settings?.submitButtonText || 'Submit',
        thankyouMessage:
          form.settings?.thankyouMessage || 'Thank you for your submission!',
        allowMultipleSubmissions:
          form.settings?.allowMultipleSubmissions !== false,
        enableCaptcha: form.settings?.enableCaptcha || false,
        showLogo: form.settings?.showLogo || false,
      },
      logo: form.logo,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      publishedAt: form.publishedAt,
    };

    console.log(`Successfully retrieved public form:`, {
      id: form.id,
      title: form.title,
      pagesCount: publicFormData.pages.length,
      lastUpdated: form.updatedAt,
      totalFields: publicFormData.pages.reduce(
        (total, page) => total + (page.fields?.length || 0),
        0
      ),
    });

    // Set cache headers for better performance
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      ETag: `"${form.updatedAt.getTime()}"`, // Use update time as ETag
    });

    res.status(200).json({
      success: true,
      data: publicFormData,
    });
  })
);

// @desc    Submit form data
// @route   POST /api/public/forms/:id/submit
// @access  Public
router.post(
  '/forms/:id/submit',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const submissionData = req.body;

    console.log(`📝 Form submission attempt for ID: ${id}`);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`❌ Invalid ObjectId format: ${id}`);
      throw new ApiError('Invalid form ID format', 400);
    }

    const form = await Form.findById(id);

    if (!form) {
      console.log(`❌ Form not found: ${id}`);
      throw new ApiError('Form not found', 404);
    }

    // Check form availability for submissions
    const { available, reason } = checkFormAvailability(form);

    if (!available) {
      console.log(`❌ Form submission blocked: ${id} - ${reason}`);
      throw new ApiError(reason, 403);
    }

    const hasFields = form.pages?.some(
      (page: any) => page.fields && page.fields.length > 0
    );

    if (!hasFields) {
      console.log(`❌ Form has no fields: ${id}`);
      throw new ApiError('Form has no fields to submit', 400);
    }

    // Basic validation of required fields
    const requiredFields = [];
    form.pages?.forEach((page: any) => {
      page.fields?.forEach((field: any) => {
        if (field.required) {
          requiredFields.push(field);
        }
      });
    });

    const missingFields = requiredFields.filter(field => {
      const value = submissionData[field.id];
      return !value || (typeof value === 'string' && value.trim() === '');
    });

    if (missingFields.length > 0) {
      const missingLabels = missingFields.map(field => field.label);
      throw new ApiError(
        `Required fields missing: ${missingLabels.join(', ')}`,
        400
      );
    }

    try {
      // Increment submission count
      await Form.findByIdAndUpdate(id, { $inc: { submissions: 1 } });
      console.log(`📊 Incremented submission count for form: ${id}`);

      res.status(200).json({
        success: true,
        message:
          form.settings?.thankyouMessage || 'Thank you for your submission!',
        submittedAt: new Date(),
      });
    } catch (error) {
      throw new ApiError('Failed to process form submission', 500);
    }
  })
);

// @desc    Get form statistics (public)
// @route   GET /api/public/forms/:id/stats
// @access  Public
router.get(
  '/forms/:id/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    console.log(`📊 Public stats request for ID: ${id}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid form ID format', 400);
    }

    const form = await Form.findById(id);

    if (!form) {
      throw new ApiError('Form not found', 404);
    }

    // Check form availability
    const { available, reason } = checkFormAvailability(form);

    if (!available) {
      console.log(`❌ Form stats not available: ${id} - ${reason}`);
      throw new ApiError(reason, 403);
    }

    res.status(200).json({
      success: true,
      data: {
        submissions: form.submissions,
        views: form.views,
        submissionRate:
          form.views > 0 ? (form.submissions / form.views) * 100 : 0,
        isPublished: form.isPublished,
        createdAt: form.createdAt,
        publishedAt: form.publishedAt,
      },
    });
  })
);

// @desc    Check if form exists and is available
// @route   HEAD /api/public/forms/:id
// @access  Public
router.head(
  '/forms/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).end();
      return;
    }

    const form = await Form.findById(id);

    if (!form) {
      res.status(404).end();
      return;
    }

    // Check form availability
    const { available } = checkFormAvailability(form);

    if (!available) {
      res.status(403).end();
      return;
    }

    res.status(200).end();
  })
);

// @desc    Check form availability status (detailed)
// @route   GET /api/public/forms/:id/status
// @access  Public
router.get(
  '/forms/:id/status',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    console.log(`🔍 Form status check for ID: ${id}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid form ID format', 400);
    }

    const form = await Form.findById(id);

    if (!form) {
      res.status(404).json({
        success: false,
        available: false,
        reason: 'Form not found',
      });
      return;
    }

    // Check form availability
    const { available, reason } = checkFormAvailability(form);

    console.log(
      `📋 Form status: ${id} - Available: ${available}, Reason: ${reason}`
    );

    res.status(200).json({
      success: true,
      available,
      reason,
      formTitle: form.title,
      formId: form.id,
      isPublished: form.isPublished,
      isEnabled: form.settings?.isEnabled !== false,
      isArchived: form.isArchived,
      isTrashed: form.isTrashed,
    });
  })
);

export default router;
