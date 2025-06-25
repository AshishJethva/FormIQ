import { Request, Response } from 'express';
import Label from '../models/Label';
import Form from '../models/Form';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiBasicError';
import mongoose from 'mongoose';

// @desc    Get all labels for authenticated user with optional search
// @route   GET /api/labels
// @access  Private
export const getAllLabels = asyncHandler(
  async (req: Request, res: Response) => {
    const { search } = req.query;

    const userId = new mongoose.Types.ObjectId(req.user.id);
    const query: any = { userId };

    // Simple text search - only search by label name
    if (search && typeof search === 'string' && search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' }; // Case insensitive search
    }

    // Always sort by newest first
    const labels = await Label.find(query).sort({ createdAt: -1 });

    // Transform to match frontend expectations
    const transformedLabels = labels.map(label => ({
      id: label.id,
      name: label.name,
      color: label.color,
      createdAt: label.createdAt.getTime(), // Convert Date to timestamp
    }));

    res.status(200).json({
      success: true,
      data: transformedLabels,
    });
  }
);

// @desc    Get single label by ID
// @route   GET /api/labels/:id
// @access  Private
export const getLabelById = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw new ApiError('Invalid label ID format', 400);
    }

    const label = await Label.findOne({
      _id: req.params.id,
      userId,
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
  }
);

// @desc    Create new label with validation
// @route   POST /api/labels
// @access  Private
export const createLabel = asyncHandler(async (req: Request, res: Response) => {
  const { name, color } = req.body;

  // Check if label with same name exists for this user
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const existingLabel = await Label.findOne({ name, userId });
  if (existingLabel) {
    throw new ApiError('Label with this name already exists', 400);
  }

  const label = await Label.create({
    name,
    color,
    userId,
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
});

// @desc    Update existing label with validation
// @route   PUT /api/labels/:id
// @access  Private
export const updateLabel = asyncHandler(async (req: Request, res: Response) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError('Invalid label ID format', 400);
  }

  const label = await Label.findOne({
    _id: req.params.id,
    userId,
  });

  if (!label) {
    throw new ApiError('Label not found', 404);
  }

  const { name, color } = req.body;

  // Check if name already exists (if name is being updated)
  if (name && name !== label.name) {
    const existingLabel = await Label.findOne({
      name,
      userId,
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
});

// @desc    Delete label and remove from all associated forms
// @route   DELETE /api/labels/:id
// @access  Private
export const deleteLabel = asyncHandler(async (req: Request, res: Response) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError('Invalid label ID format', 400);
  }

  const label = await Label.findOne({
    _id: req.params.id,
    userId,
  });

  if (!label) {
    throw new ApiError('Label not found', 404);
  }

  // Remove label from all forms
  await Form.updateMany({ userId }, { $pull: { labels: req.params.id } });

  await Label.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Label deleted successfully',
  });
});
