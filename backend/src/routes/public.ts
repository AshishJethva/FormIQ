// src/routes/public.ts - Fixed Public Routes
import express from 'express';
import { Request, Response } from 'express';
import Form from '../models/Form';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import mongoose from 'mongoose';

const router = express.Router();

// @desc    Get published form for public access
// @route   GET /api/public/forms/:id
// @access  Public
router.get(
  '/forms/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    console.log(`Public form request for ID: ${id}`);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`Invalid ObjectId format: ${id}`);
      throw new ApiError('Invalid form ID format', 400);
    }

    const form = await Form.findOne({
      _id: id,
      isPublished: true,
      isTrashed: false,
      isArchived: false,
    });

    if (!form) {
      console.log(`Form not found or not published: ${id}`);
      throw new ApiError('Form not found or not available', 404);
    }

    // Increment view count
    try {
      await Form.findByIdAndUpdate(id, { $inc: { views: 1 } });
    } catch (viewError) {
      console.log('Error incrementing view count:', viewError);
      // Don't fail the request if view count update fails
    }

    // Return only necessary data for public form
    const publicFormData = {
      id: form.id,
      title: form.title || 'Untitled Form',
      description: form.description,
      pages: form.pages,
      settings: {
        submitButtonText: form.settings?.submitButtonText || 'Submit',
        thankyouMessage:
          form.settings?.thankyouMessage || 'Thank you for your submission!',
        allowMultipleSubmissions:
          form.settings?.allowMultipleSubmissions !== false,
        enableCaptcha: form.settings?.enableCaptcha || false,
      },
      logo: form.logo,
      createdAt: form.createdAt,
    };

    console.log(`Successfully retrieved public form: ${form.title}`);

    // Set cache headers for better performance
    res.set({
      'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      ETag: `"${form.updatedAt.getTime()}"`,
    });

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
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid form ID format', 400);
    }

    const form = await Form.findOne({
      _id: id,
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

    const form = await Form.findOne({
      _id: id,
      isPublished: true,
      isTrashed: false,
      isArchived: false,
    });

    if (!form) {
      res.status(404).end();
      return;
    }

    res.status(200).end();
  })
);

export default router;
