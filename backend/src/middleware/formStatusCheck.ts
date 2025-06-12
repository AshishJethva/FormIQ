// src/middleware/formStatusCheck.ts - Middleware to check if form is enabled
import { Request, Response, NextFunction } from 'express';
import Form from '../models/Form';
import { ApiError } from '../utils/apiBasicError';
import mongoose from 'mongoose';

interface FormStatusRequest extends Request {
  form?: any;
}

/**
 * Middleware to check if a form is enabled for public access
 * Used for form submission and viewing endpoints
 */
export const checkFormEnabled = async (
  req: FormStatusRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const formId = req.params.formId || req.params.id;

    if (!formId) {
      throw new ApiError('Form ID is required', 400);
    }

    if (!mongoose.Types.ObjectId.isValid(formId)) {
      throw new ApiError('Invalid form ID format', 400);
    }

    // Find the form
    const form = await Form.findById(formId);

    if (!form) {
      throw new ApiError('Form not found', 404);
    }

    // Check if form is published
    if (!form.isPublished) {
      throw new ApiError('Form is not published', 403);
    }

    // Check if form is enabled
    if (form.settings?.isEnabled === false) {
      throw new ApiError(
        'Form is currently disabled and not accepting submissions',
        403
      );
    }

    // Check if form is trashed or archived
    if (form.isTrashed) {
      throw new ApiError('Form has been deleted', 404);
    }

    if (form.isArchived) {
      throw new ApiError('Form has been archived', 403);
    }

    // Attach form to request for use in next middleware/controller
    req.form = form;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware specifically for form owners to bypass the enabled check
 * Used for form editing and management endpoints
 */
export const checkFormOwnership = async (
  req: FormStatusRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const formId = req.params.formId || req.params.id;
    const userId = (req as any).user?.id;

    if (!formId) {
      throw new ApiError('Form ID is required', 400);
    }

    if (!userId) {
      throw new ApiError('User authentication required', 401);
    }

    if (!mongoose.Types.ObjectId.isValid(formId)) {
      throw new ApiError('Invalid form ID format', 400);
    }

    // Find the form and check ownership
    const form = await Form.findOne({
      _id: formId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!form) {
      throw new ApiError('Form not found or access denied', 404);
    }

    // Attach form to request for use in next middleware/controller
    req.form = form;
    next();
  } catch (error) {
    next(error);
  }
};
