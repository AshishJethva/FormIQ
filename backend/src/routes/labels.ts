// src/routes/labels.ts - Labels Routes
import express from 'express';
import { Request, Response } from 'express';
import { protect } from '../middleware/protect';
import Label from '../models/Label';
import Form from '../models/Form';
import { validate } from '../middleware/validation';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import {
  createLabelSchema,
  updateLabelSchema,
} from '../validation/labelValidation';

const router = express.Router();

// @desc    Get all labels for authenticated user
// @route   GET /api/labels
// @access  Private
router.get(
  '/',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query: any = { userId: req.user.id };

    // Search functionality
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Sort options
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const labels = await Label.find(query).sort(sortObj);

    // Transform to match frontend expectations
    const transformedLabels = labels.map(label => ({
      id: label.id,
      name: label.name,
      color: label.color,
      createdAt: label.createdAt.getTime(),
    }));

    res.status(200).json({
      success: true,
      data: transformedLabels,
    });
  })
);

// @desc    Get single label
// @route   GET /api/labels/:id
// @access  Private
router.get(
  '/:id',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const label = await Label.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!label) {
      throw new ApiError('Label not found', 404);
    }

    res.status(200).json({
      success: true,
      data: {
        id: label.id,
        name: label.name,
        color: label.color,
        createdAt: label.createdAt.getTime(),
      },
    });
  })
);

// @desc    Create new label
// @route   POST /api/labels
// @access  Private
router.post(
  '/',
  protect,
  validate(createLabelSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, color } = req.body;

    // Check if label with same name exists for this user
    const existingLabel = await Label.findOne({ name, userId: req.user.id });
    if (existingLabel) {
      throw new ApiError('Label with this name already exists', 400);
    }

    const label = await Label.create({
      name,
      color,
      userId: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: {
        id: label.id,
        name: label.name,
        color: label.color,
        createdAt: label.createdAt.getTime(),
      },
      message: 'Label created successfully',
    });
  })
);

// @desc    Update label
// @route   PUT /api/labels/:id
// @access  Private
router.put(
  '/:id',
  protect,
  validate(updateLabelSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const label = await Label.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!label) {
      throw new ApiError('Label not found', 404);
    }

    const { name, color } = req.body;

    // Check if name already exists (if name is being updated)
    if (name && name !== label.name) {
      const existingLabel = await Label.findOne({
        name,
        userId: req.user.id,
        _id: { $ne: req.params.id },
      });
      if (existingLabel) {
        throw new ApiError('Label with this name already exists', 400);
      }
    }

    // Update label
    if (name !== undefined) label.name = name;
    if (color !== undefined) label.color = color;

    await label.save();

    res.status(200).json({
      success: true,
      data: {
        id: label.id,
        name: label.name,
        color: label.color,
        createdAt: label.createdAt.getTime(),
      },
      message: 'Label updated successfully',
    });
  })
);

// @desc    Delete label
// @route   DELETE /api/labels/:id
// @access  Private
router.delete(
  '/:id',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const label = await Label.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!label) {
      throw new ApiError('Label not found', 404);
    }

    // Remove label from all forms
    await Form.updateMany(
      { userId: req.user.id },
      { $pull: { labels: req.params.id } }
    );

    await Label.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Label deleted successfully',
    });
  })
);

export default router;
