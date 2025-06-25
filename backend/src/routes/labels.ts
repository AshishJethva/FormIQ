import express from 'express';
import { protect } from '../middleware/protect';
import { validate } from '../middleware/validation';
import {
  createLabelSchema,
  updateLabelSchema,
} from '../validation/labelValidation';
import {
  getAllLabels,
  getLabelById,
  createLabel,
  updateLabel,
  deleteLabel,
} from '../controllers/labelsController';

const router = express.Router();

// @route   GET /api/labels
// @desc    Get all labels for authenticated user with optional search
// @access  Private
router.get('/', protect, getAllLabels);

// @route   GET /api/labels/:id
// @desc    Get single label by ID
// @access  Private
router.get('/:id', protect, getLabelById);

// @route   POST /api/labels
// @desc    Create new label with validation
// @access  Private
router.post('/', protect, validate(createLabelSchema), createLabel);

// @route   PUT /api/labels/:id
// @desc    Update existing label with validation
// @access  Private
router.put('/:id', protect, validate(updateLabelSchema), updateLabel);

// @route   DELETE /api/labels/:id
// @desc    Delete label and remove from all associated forms
// @access  Private
router.delete('/:id', protect, deleteLabel);

export default router;
