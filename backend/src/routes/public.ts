// src/routes/public.ts - Public Routes (No Auth Required)
import express from 'express';
import { Request, Response } from 'express';
import Form from '../models/Form';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const router = express.Router();

// @desc    Get published form for public access
// @route   GET /api/public/forms/:id
// @access  Public
router.get(
  '/forms/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const form = await Form.findOne({
      _id: req.params.id,
      isPublished: true,
      isTrashed: false,
      isArchived: false,
    });

    if (!form) {
      throw new ApiError('Form not found or not available', 404);
    }

    // Return only necessary data for public form
    const publicFormData = {
      id: form.id,
      title: form.title,
      description: form.description,
      pages: form.pages,
      settings: {
        submitButtonText: form.settings?.submitButtonText || 'Submit',
        thankyouMessage:
          form.settings?.thankyouMessage || 'Thank you for your submission!',
      },
      logo: form.logo,
    };

    res.status(200).json({
      success: true,
      data: publicFormData,
    });
  })
);

// @desc    Get form statistics (public)
// @route   GET /api/public/forms/:id/stats
// @access  Public
router.get(
  '/forms/:id/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const form = await Form.findOne({
      _id: req.params.id,
      isPublished: true,
      isTrashed: false,
      isArchived: false,
    });

    if (!form) {
      throw new ApiError('Form not found or not available', 404);
    }

    res.status(200).json({
      success: true,
      data: {
        submissions: form.submissions,
        isPublished: form.isPublished,
        createdAt: form.createdAt,
      },
    });
  })
);

export default router;
