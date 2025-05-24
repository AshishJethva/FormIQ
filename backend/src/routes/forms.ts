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
      name: form.title || 'Untitled Form',
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

    // Return form data in the format expected by form builder
    const formData = {
      id: form.id,
      title: form.title || 'Untitled Form',
      description: form.description,
      pages: form.pages || [{ id: uuidv4(), fields: [] }],
      selectedFieldId: form.selectedFieldId,
      selectedPageId: form.selectedPageId,
      currentPageIndex: form.currentPageIndex || 0,
      propertiesPanelOpen: false, // Always start with panel closed
      logo: form.logo,
      settings: {
        submitButtonText: form.settings?.submitButtonText || 'Submit',
        defaultLabelAlignment: form.settings?.defaultLabelAlignment || 'LEFT',
        thankyouMessage:
          form.settings?.thankyouMessage || 'Thank you for your submission!',
        defaultRequiredField: form.settings?.defaultRequiredField || false,
        showLogo: form.settings?.showLogo || false,
      },
      lastSaved:
        form.lastSaved ||
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      userId: form.userId,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      isPublished: form.isPublished,
      submissions: form.submissions,
      labels: form.labels,
      isFavorite: form.isFavorite,
      isArchived: form.isArchived,
      isTrashed: form.isTrashed,
    };

    res.status(200).json({
      success: true,
      data: formData,
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
    const { name } = req.body;

    const pageId = uuidv4();
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Generate unique title if duplicate exists
    let uniqueTitle = name || 'Form';
    let counter = 1;

    // Check if title already exists for this user
    while (await Form.findOne({ title: uniqueTitle, userId })) {
      uniqueTitle = `${name || 'Form'} (${counter})`;
      counter++;
    }

    const form = await Form.create({
      title: uniqueTitle,
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
        showLogo: false,
      },
      lastSaved: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });

    // Return form data in the format expected by frontend
    const formData = {
      id: form.id,
      title: form.title,
      description: form.description,
      pages: form.pages,
      selectedFieldId: form.selectedFieldId,
      selectedPageId: form.selectedPageId,
      currentPageIndex: form.currentPageIndex,
      propertiesPanelOpen: false,
      logo: form.logo,
      settings: form.settings,
      lastSaved: form.lastSaved,
      userId: form.userId,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      isPublished: form.isPublished,
      submissions: form.submissions,
      labels: form.labels,
      isFavorite: form.isFavorite,
      isArchived: form.isArchived,
      isTrashed: form.isTrashed,
    };

    res.status(201).json({
      success: true,
      data: formData,
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

    // Update form fields with validation
    const allowedUpdates = [
      'title',
      'description',
      'pages',
      'selectedFieldId',
      'selectedPageId',
      'currentPageIndex',
      'propertiesPanelOpen',
      'logo',
      'settings',
      'isPublished',
      'labels',
    ];

    allowedUpdates.forEach(key => {
      if (req.body[key] !== undefined) {
        (form as any)[key] = req.body[key];
      }
    });

    // Update lastSaved timestamp
    form.lastSaved = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    await form.save();

    // Return updated form data
    const formData = {
      id: form.id,
      title: form.title,
      description: form.description,
      pages: form.pages,
      selectedFieldId: form.selectedFieldId,
      selectedPageId: form.selectedPageId,
      currentPageIndex: form.currentPageIndex,
      propertiesPanelOpen: form.propertiesPanelOpen,
      logo: form.logo,
      settings: form.settings,
      lastSaved: form.lastSaved,
      userId: form.userId,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      isPublished: form.isPublished,
      submissions: form.submissions,
      labels: form.labels,
      isFavorite: form.isFavorite,
      isArchived: form.isArchived,
      isTrashed: form.isTrashed,
    };

    res.status(200).json({
      success: true,
      data: formData,
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

// @desc    Publish/Unpublish form
// @route   PATCH /api/forms/:id/publish
// @access  Private
router.patch(
  '/:id/publish',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { isPublished } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const form = await Form.findOne({
      _id: req.params.id,
      userId,
    });

    if (!form) {
      throw new ApiError('Form not found', 404);
    }

    // Validate form has at least one field before publishing
    if (isPublished) {
      const hasFields = form.pages?.some(
        page => page.fields && page.fields.length > 0
      );
      if (!hasFields) {
        throw new ApiError('Cannot publish form without fields', 400);
      }
    }

    form.isPublished = isPublished;
    await form.save();

    res.status(200).json({
      success: true,
      data: { isPublished: form.isPublished },
      message: `Form ${isPublished ? 'published' : 'unpublished'} successfully`,
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

    console.log('Bulk add label request:', {
      formIds,
      labelId,
      userId: userId.toString(),
    });

    if (!formIds || !Array.isArray(formIds) || !labelId) {
      throw new ApiError('Form IDs and label ID are required', 400);
    }

    if (formIds.length === 0) {
      throw new ApiError('At least one form ID is required', 400);
    }

    // Validate all form IDs
    const invalidIds = formIds.filter(
      id => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      throw new ApiError(`Invalid form IDs: ${invalidIds.join(', ')}`, 400);
    }

    // Validate label ID
    if (!mongoose.Types.ObjectId.isValid(labelId)) {
      throw new ApiError('Invalid label ID format', 400);
    }

    // Verify label exists and belongs to user
    const label = await Label.findOne({ _id: labelId, userId });
    if (!label) {
      throw new ApiError('Label not found or access denied', 404);
    }

    // Verify forms exist and belong to user
    const existingForms = await Form.find({
      _id: { $in: formIds },
      userId,
    });

    if (existingForms.length !== formIds.length) {
      const foundIds = existingForms.map(f => f._id.toString());
      const notFoundIds = formIds.filter(id => !foundIds.includes(id));
      throw new ApiError(`Forms not found: ${notFoundIds.join(', ')}`, 404);
    }

    // Add label to forms (using string ID, not ObjectId)
    const result = await Form.updateMany(
      { _id: { $in: formIds }, userId },
      { $addToSet: { labels: labelId } }
    );

    console.log('Bulk add label result:', result);

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
    const userId = new mongoose.Types.ObjectId(req.user.id);

    console.log('Bulk remove label request:', {
      formIds,
      labelId,
      userId: userId.toString(),
    });

    if (!formIds || !Array.isArray(formIds) || !labelId) {
      throw new ApiError('Form IDs and label ID are required', 400);
    }

    if (formIds.length === 0) {
      throw new ApiError('At least one form ID is required', 400);
    }

    // Validate all form IDs
    const invalidIds = formIds.filter(
      id => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      throw new ApiError(`Invalid form IDs: ${invalidIds.join(', ')}`, 400);
    }

    // Validate label ID
    if (!mongoose.Types.ObjectId.isValid(labelId)) {
      throw new ApiError('Invalid label ID format', 400);
    }

    // Verify forms exist and belong to user (don't need to verify label exists for removal)
    const existingForms = await Form.find({
      _id: { $in: formIds },
      userId,
    });

    if (existingForms.length !== formIds.length) {
      const foundIds = existingForms.map(f => f._id.toString());
      const notFoundIds = formIds.filter(id => !foundIds.includes(id));
      throw new ApiError(`Forms not found: ${notFoundIds.join(', ')}`, 404);
    }

    // Remove label from forms (using string ID, not ObjectId)
    const result = await Form.updateMany(
      { _id: { $in: formIds }, userId },
      { $pull: { labels: labelId } }
    );

    console.log('Bulk remove label result:', result);

    res.status(200).json({
      success: true,
      message: `Label removed from ${result.modifiedCount} forms`,
      modified: result.modifiedCount,
    });
  })
);

// @desc    Duplicate form
// @route   POST /api/forms/:id/duplicate
// @access  Private
router.post(
  '/:id/duplicate',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const originalForm = await Form.findOne({
      _id: req.params.id,
      userId,
    });

    if (!originalForm) {
      throw new ApiError('Form not found', 404);
    }

    // Create a new form with copied data
    const duplicatedForm = new Form({
      title: `${originalForm.title} (Copy)`,
      description: originalForm.description,
      userId,
      pages: originalForm.pages?.map(page => ({
        id: uuidv4(), // Generate new page ID
        fields:
          page.fields?.map(field => ({
            ...field,
            id: uuidv4(), // Generate new field IDs
          })) || [],
      })) || [{ id: uuidv4(), fields: [] }],
      selectedFieldId: null,
      selectedPageId: null,
      currentPageIndex: 0,
      propertiesPanelOpen: false,
      logo: originalForm.logo,
      settings: originalForm.settings,
      isPublished: false, // New forms start as drafts
      submissions: 0,
      labels: originalForm.labels,
      isFavorite: false,
      isArchived: false,
      isTrashed: false,
    });

    await duplicatedForm.save();

    // Return the duplicated form data
    const formData = {
      id: duplicatedForm.id,
      title: duplicatedForm.title,
      description: duplicatedForm.description,
      pages: duplicatedForm.pages,
      selectedFieldId: duplicatedForm.selectedFieldId,
      selectedPageId: duplicatedForm.selectedPageId,
      currentPageIndex: duplicatedForm.currentPageIndex,
      propertiesPanelOpen: duplicatedForm.propertiesPanelOpen,
      logo: duplicatedForm.logo,
      settings: duplicatedForm.settings,
      lastSaved: duplicatedForm.lastSaved,
      userId: duplicatedForm.userId,
      createdAt: duplicatedForm.createdAt,
      updatedAt: duplicatedForm.updatedAt,
      isPublished: duplicatedForm.isPublished,
      submissions: duplicatedForm.submissions,
      labels: duplicatedForm.labels,
      isFavorite: duplicatedForm.isFavorite,
      isArchived: duplicatedForm.isArchived,
      isTrashed: duplicatedForm.isTrashed,
    };

    res.status(201).json({
      success: true,
      data: formData,
      message: 'Form duplicated successfully',
    });
  })
);

export default router;
