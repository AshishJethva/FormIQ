// src/routes/forms.ts - Forms Routes
import express from 'express';
import { Request, Response } from 'express';
import { protect } from '../middleware/protect';
import Form from '../models/Form';
import Label from '../models/Label';
import { validate } from '../middleware/validation';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import {
  createFormSchema,
  updateFormSchema,
} from '../validation/formValidation';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

const router = express.Router();

// @desc    Get all forms for authenticated user
// @route   GET /api/forms
// @access  Private
router.get(
  '/',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const {
      search,
      labels,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = '1',
      limit = '50',
    } = req.query;

    const userId = new mongoose.Types.ObjectId(req.user.id);
    const query: any = { userId };

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by labels
    if (labels) {
      const labelArray = Array.isArray(labels) ? labels : [labels];
      query.labels = { $in: labelArray };
    }

    // Filter by status
    switch (status) {
      case 'published':
        query.isPublished = true;
        query.isTrashed = false;
        query.isArchived = false;
        break;
      case 'draft':
        query.isPublished = false;
        query.isTrashed = false;
        query.isArchived = false;
        break;
      case 'archived':
        query.isArchived = true;
        query.isTrashed = false;
        break;
      case 'trashed':
        query.isTrashed = true;
        break;
      case 'favorites':
        query.isFavorite = true;
        query.isTrashed = false;
        break;
      default:
        // All forms except trashed
        query.isTrashed = false;
    }

    // Pagination
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    // Sort options
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const forms = await Form.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await Form.countDocuments(query);

    // Transform to match frontend expectations
    const transformedForms = forms.map(form => ({
      id: form.id,
      name: form.title,
      description: form.description,
      submissions: form.submissions,
      createdAt: form.createdAt.toISOString().split('T')[0],
      lastEdited: form.updatedAt.toISOString().split('T')[0],
      lastSubmission: form.updatedAt.toISOString().split('T')[0],
      unread: false,
      isFavorite: form.isFavorite,
      isArchived: form.isArchived,
      isTrashed: form.isTrashed,
      labels: form.labels || [],
      daysRemaining:
        form.isTrashed && form.trashedAt
          ? Math.max(
              0,
              30 -
                Math.floor(
                  (Date.now() - form.trashedAt.getTime()) /
                    (1000 * 60 * 60 * 24)
                )
            )
          : undefined,
    }));

    res.status(200).json({
      success: true,
      data: transformedForms,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum,
      },
    });
  })
);

// @desc    Get single form
// @route   GET /api/forms/:id
// @access  Private
router.get(
  '/:id',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const form = await Form.findOne({
      _id: req.params.id,
      userId,
    });

    if (!form) {
      throw new ApiError('Form not found', 404);
    }

    res.status(200).json({
      success: true,
      data: form,
    });
  })
);

// @desc    Create new form
// @route   POST /api/forms
// @access  Private
router.post(
  '/',
  protect,
  validate(createFormSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description } = req.body;

    const pageId = uuidv4();
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const form = await Form.create({
      title: name,
      description,
      userId,
      pages: [
        {
          id: pageId,
          fields: [],
        },
      ],
      selectedPageId: pageId,
      currentPageIndex: 0,
      settings: {
        submitButtonText: 'Submit',
        defaultLabelAlignment: 'LEFT',
        thankyouMessage: 'Thank you for your submission!',
        defaultRequiredField: false,
      },
    });

    res.status(201).json({
      success: true,
      data: form,
      message: 'Form created successfully',
    });
  })
);

// @desc    Update form
// @route   PUT /api/forms/:id
// @access  Private
router.put(
  '/:id',
  protect,
  validate(updateFormSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const form = await Form.findOne({
      _id: req.params.id,
      userId,
    });

    if (!form) {
      throw new ApiError('Form not found', 404);
    }

    // Update form fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        (form as any)[key] = req.body[key];
      }
    });

    await form.save();

    res.status(200).json({
      success: true,
      data: form,
      message: 'Form updated successfully',
    });
  })
);

// @desc    Toggle form favorite
// @route   PATCH /api/forms/:id/favorite
// @access  Private
router.patch(
  '/:id/favorite',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const form = await Form.findOne({
      _id: req.params.id,
      userId,
    });

    if (!form) {
      throw new ApiError('Form not found', 404);
    }

    form.isFavorite = !form.isFavorite;
    await form.save();

    res.status(200).json({
      success: true,
      data: { isFavorite: form.isFavorite },
      message: `Form ${form.isFavorite ? 'added to' : 'removed from'} favorites`,
    });
  })
);

// @desc    Archive form
// @route   PATCH /api/forms/:id/archive
// @access  Private
router.patch(
  '/:id/archive',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const form = await Form.findOne({
      _id: req.params.id,
      userId,
    });

    if (!form) {
      throw new ApiError('Form not found', 404);
    }

    form.isArchived = true;
    await form.save();

    res.status(200).json({
      success: true,
      message: 'Form archived successfully',
    });
  })
);

// @desc    Move form to trash
// @route   PATCH /api/forms/:id/trash
// @access  Private
router.patch(
  '/:id/trash',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const form = await Form.findOne({
      _id: req.params.id,
      userId,
    });

    if (!form) {
      throw new ApiError('Form not found', 404);
    }

    form.isTrashed = true;
    await form.save();

    res.status(200).json({
      success: true,
      message: 'Form moved to trash successfully',
    });
  })
);

// @desc    Restore form
// @route   PATCH /api/forms/:id/restore
// @access  Private
router.patch(
  '/:id/restore',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const form = await Form.findOne({
      _id: req.params.id,
      userId,
    });

    if (!form) {
      throw new ApiError('Form not found', 404);
    }

    form.isArchived = false;
    form.isTrashed = false;
    await form.save();

    res.status(200).json({
      success: true,
      message: 'Form restored successfully',
    });
  })
);

// @desc    Delete form permanently
// @route   DELETE /api/forms/:id
// @access  Private
router.delete(
  '/:id',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const form = await Form.findOne({
      _id: req.params.id,
      userId,
    });

    if (!form) {
      throw new ApiError('Form not found', 404);
    }

    await Form.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Form deleted permanently',
    });
  })
);

// @desc    Bulk operations on forms
// @route   PATCH /api/forms/bulk
// @access  Private
router.patch(
  '/bulk',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { formIds, action } = req.body;

    if (!formIds || !Array.isArray(formIds) || !action) {
      throw new ApiError('Form IDs and action are required', 400);
    }

    if (formIds.length === 0) {
      throw new ApiError('At least one form ID is required', 400);
    }

    let updateData: any = {};

    switch (action) {
      case 'archive':
        updateData = { isArchived: true };
        break;
      case 'trash':
        updateData = { isTrashed: true };
        break;
      case 'restore':
        updateData = { isArchived: false, isTrashed: false };
        break;
      case 'favorite':
        updateData = { isFavorite: true };
        break;
      case 'unfavorite':
        updateData = { isFavorite: false };
        break;
      default:
        throw new ApiError('Invalid action', 400);
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);
    const result = await Form.updateMany(
      { _id: { $in: formIds }, userId },
      updateData
    );

    if (result.matchedCount === 0) {
      throw new ApiError('No forms found to update', 404);
    }

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} forms ${action}d successfully`,
      modified: result.modifiedCount,
    });
  })
);

// @desc    Add label to forms
// @route   PATCH /api/forms/bulk/add-label
// @access  Private
router.patch(
  '/bulk/add-label',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { formIds, labelId } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    if (!formIds || !Array.isArray(formIds) || !labelId) {
      throw new ApiError('Form IDs and label ID are required', 400);
    }

    // Verify label belongs to user
    const label = await Label.findOne({ _id: labelId, userId });
    if (!label) {
      throw new ApiError('Label not found', 404);
    }

    const result = await Form.updateMany(
      { _id: { $in: formIds }, userId },
      { $addToSet: { labels: labelId } }
    );

    res.status(200).json({
      success: true,
      message: `Label added to ${result.modifiedCount} forms`,
      modified: result.modifiedCount,
    });
  })
);

// @desc    Remove label from forms
// @route   PATCH /api/forms/bulk/remove-label
// @access  Private
router.patch(
  '/bulk/remove-label',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { formIds, labelId } = req.body;

    if (!formIds || !Array.isArray(formIds) || !labelId) {
      throw new ApiError('Form IDs and label ID are required', 400);
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);
    const result = await Form.updateMany(
      { _id: { $in: formIds }, userId },
      { $pull: { labels: labelId } }
    );

    res.status(200).json({
      success: true,
      message: `Label removed from ${result.modifiedCount} forms`,
      modified: result.modifiedCount,
    });
  })
);

export default router;
