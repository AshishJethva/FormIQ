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

// @desc    Get public form for submission
// @route   GET /api/forms/public/:formId
// @access  Public
router.get(
  '/public/:formId',
  asyncHandler(async (req: Request, res: Response) => {
    const formId = req.params.formId;

    if (!mongoose.Types.ObjectId.isValid(formId)) {
      throw new ApiError('Invalid form ID format', 400);
    }

    console.log('🌐 Public form request:', { formId });

    // Always fetch fresh data from database (no caching)
    const form = await Form.findOne({
      _id: formId,
      isPublished: true,
      isTrashed: false,
      isArchived: false,
      'settings.isEnabled': { $ne: false }, // Form must be enabled
    });

    if (!form) {
      console.log('❌ Public form not found or not available:', { formId });
      throw new ApiError('Form not found or not available', 404);
    }

    // Increment view count
    try {
      await Form.findByIdAndUpdate(formId, { $inc: { views: 1 } });
      console.log('📊 View count incremented');
    } catch (error) {
      console.warn('⚠️ Failed to increment view count:', error);
      // Don't fail the request if view count update fails
    }

    // Return latest form structure
    const formData = {
      id: form.id,
      title: form.title,
      description: form.description,
      pages: form.pages || [],
      logo: form.logo,
      settings: {
        submitButtonText: form.settings?.submitButtonText || 'Submit',
        thankyouMessage:
          form.settings?.thankyouMessage || 'Thank you for your submission!',
        showLogo: form.settings?.showLogo || false,
        allowMultipleSubmissions:
          form.settings?.allowMultipleSubmissions !== false,
        collectIpAddress: form.settings?.collectIpAddress !== false,
      },
      updatedAt: form.updatedAt, 
      publishedAt: form.publishedAt,
    };

    console.log('🌐 Serving published form:', {
      formId,
      title: form.title,
      pagesCount: formData.pages.length,
      lastUpdated: form.updatedAt,
      totalFields: formData.pages.reduce(
        (total, page) => total + (page.fields?.length || 0),
        0
      ),
    });

    // Set cache headers to ensure fresh data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });

    res.status(200).json({
      success: true,
      data: formData,
    });
  })
);

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

      // Remove empty/null/undefined values
      const validLabels = labelArray.filter(
        label => label && typeof label === 'string' && label.trim() !== ''
      );

      if (validLabels.length > 0) {
        query.labels = { $in: validLabels };
      }
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
        query.isArchived = false;
        break;
      default:
        query.isTrashed = false;
        query.isArchived = false;
        break;
    }

    // Pagination
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    // Sort options
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    console.log(
      '🔍 FINAL QUERY BEFORE DATABASE:',
      JSON.stringify(query, null, 2)
    );

    const forms = await Form.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    console.log('📊 DATABASE RESULTS:', {
      totalFound: forms.length,
      queryHadLabelFilter: !!query.labels,
      sampleFormLabels: forms.slice(0, 3).map(f => ({
        id: f._id,
        title: f.title,
        labels: f.labels,
      })),
    });

    // If you have label filtering but got results, check if they actually match
    if (query.labels && forms.length > 0) {
      const expectedLabels = query.labels.$in;
      console.log('🎯 Expected labels:', expectedLabels);

      forms.forEach(form => {
        const hasMatchingLabel = form.labels?.some(label =>
          expectedLabels.includes(label)
        );
        if (!hasMatchingLabel) {
          console.log('❌ Form WITHOUT expected labels:', {
            formId: form._id,
            formTitle: form.title,
            formLabels: form.labels,
            expectedLabels,
          });
        }
      });
    }

    const total = await Form.countDocuments(query);

    console.log(`Found ${forms.length} forms, total: ${total}`);

    // Transform to match frontend expectations
    const transformedForms = forms.map(form => {
      // Calculate days remaining for trashed forms
      let daysRemaining = undefined;
      if (form.isTrashed && form.trashedAt) {
        const now = new Date();
        const trashedDate = new Date(form.trashedAt);
        const daysPassed = Math.floor(
          (now.getTime() - trashedDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        daysRemaining = Math.max(0, 30 - daysPassed);
      }

      return {
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
        daysRemaining,
        trashedAt: form.trashedAt,
      };
    });

    console.log(`Transformed ${transformedForms.length} forms`);

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
    const formId = req.params.id;

    console.log('🔍 Loading form:', { formId, userId: userId.toString() });

    const form = await Form.findOne({
      _id: req.params.id,
      userId,
    });

    if (!form) {
      console.log('❌ Form not found:', { formId, userId: userId.toString() });
      throw new ApiError('Form not found', 404);
    }

    const settings = {
      submitButtonText: form.settings?.submitButtonText || 'Submit',
      defaultLabelAlignment: form.settings?.defaultLabelAlignment || 'LEFT',
      thankyouMessage:
        form.settings?.thankyouMessage || 'Thank you for your submission!',
      defaultRequiredField: form.settings?.defaultRequiredField || false,
      showLogo: form.settings?.showLogo || false,
      isEnabled:
        form.settings?.isEnabled !== undefined ? form.settings.isEnabled : true,

      allowMultipleSubmissions:
        form.settings?.allowMultipleSubmissions !== undefined
          ? form.settings.allowMultipleSubmissions
          : true,
      allowMultipleEmailSubmissions:
        form.settings?.allowMultipleEmailSubmissions !== undefined
          ? form.settings.allowMultipleEmailSubmissions
          : true,
      collectIpAddress:
        form.settings?.collectIpAddress !== undefined
          ? form.settings.collectIpAddress
          : true,
      enableCaptcha: form.settings?.enableCaptcha || false,
      requireEmailVerification:
        form.settings?.requireEmailVerification || false,
      sendSubmissionEmails:
        form.settings?.sendSubmissionEmails !== undefined
          ? form.settings.sendSubmissionEmails
          : true,
      submissionLimit: form.settings?.submissionLimit || null,
      submissionDeadline: form.settings?.submissionDeadline || null,
    };

    if (
      form.settings?.allowMultipleSubmissions === undefined ||
      form.settings?.allowMultipleEmailSubmissions === undefined ||
      form.settings?.showLogo === undefined
    ) {
      console.log('🔧 Updating form with missing default settings');

      await Form.findByIdAndUpdate(formId, {
        $set: {
          'settings.allowMultipleSubmissions':
            settings.allowMultipleSubmissions,
          'settings.allowMultipleEmailSubmissions':
            settings.allowMultipleEmailSubmissions,
          'settings.showLogo': settings.showLogo,
        },
      });
    }

    // Ensure pages are properly structured
    let pages = form.pages || [];

    // If pages is not an array or is empty, create a default page
    if (!Array.isArray(pages) || pages.length === 0) {
      console.log('🔧 Creating default page structure');
      pages = [
        {
          id: uuidv4(),
          fields: [],
        },
      ];
    }

    // Ensure each page has proper structure
    pages = pages.map((page: any, index: number) => {
      if (!page || typeof page !== 'object') {
        console.log(`🔧 Fixing page structure at index ${index}`);
        return {
          id: uuidv4(),
          fields: [],
        };
      }

      // Ensure page has id and fields
      const pageData = {
        id: page.id || uuidv4(),
        fields: Array.isArray(page.fields) ? page.fields : [],
      };

      console.log(`📄 Page ${index}:`, {
        id: pageData.id,
        fieldsCount: pageData.fields.length,
        fields: pageData.fields.map((f: any) => ({
          id: f?.id,
          type: f?.type,
          label: f?.label,
        })),
      });

      return pageData;
    });

    // Return form data in the format expected by form builder
    const formData = {
      id: form.id,
      title: form.title || 'Untitled Form',
      description: form.description,
      pages: pages || [{ id: uuidv4(), fields: [] }],
      selectedFieldId: null,
      selectedPageId: pages[0]?.id || uuidv4(),
      currentPageIndex: Math.min(form.currentPageIndex || 0, pages.length - 1),
      propertiesPanelOpen: false,
      logo: form.logo,
      settings: settings,
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
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: true,
        allowMultipleEmailSubmissions: true,
        collectIpAddress: true,
        enableCaptcha: false,
        requireEmailVerification: false,
        sendSubmissionEmails: true,
        submissionLimit: null,
        submissionDeadline: null,
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
    const formId = req.params.id;

    console.log('🔄 Updating form:', {
      formId,
      userId: userId.toString(),
      dataKeys: Object.keys(req.body),
      pagesCount: req.body.pages?.length || 0,
    });

    const form = await Form.findOne({
      _id: formId,
      userId,
    });

    if (!form) {
      console.log('❌ Form not found for update:', {
        formId,
        userId: userId.toString(),
      });
      throw new ApiError('Form not found', 404);
    }

    const wasPublished = form.isPublished;

    if (req.body.title && req.body.title.trim() !== form.title) {
      const titleExists = await Form.findOne({
        title: req.body.title.trim(),
        userId,
        _id: { $ne: formId },
      });

      if (titleExists) {
        throw new ApiError(
          'A form with this title already exists. Please choose a different title.',
          400
        );
      }
    }

    if (req.body.settings) {
      const currentSettings = form.settings || {};

      // Merge with defaults to ensure no undefined values
      const updatedSettings = {
        submitButtonText: 'Submit',
        defaultLabelAlignment: 'LEFT',
        thankyouMessage: 'Thank you for your submission!',
        defaultRequiredField: false,
        showLogo: true,
        isEnabled: true,
        allowMultipleSubmissions: true,
        allowMultipleEmailSubmissions: true,
        collectIpAddress: true,
        enableCaptcha: false,
        requireEmailVerification: false,
        sendSubmissionEmails: true,
        submissionLimit: null,
        submissionDeadline: null,
        ...currentSettings, // Current values
        ...req.body.settings, // New values from request
      };

      req.body.settings = updatedSettings;

      console.log('🔧 Enhanced settings update:', {
        allowMultipleSubmissions: updatedSettings.allowMultipleSubmissions,
        allowMultipleEmailSubmissions:
          updatedSettings.allowMultipleEmailSubmissions,
        showLogo: updatedSettings.showLogo,
        isEnabled: updatedSettings.isEnabled,
      });
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

    form.lastSaved = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    try {
      await form.save();

      if (wasPublished || form.isPublished) {
        console.log('🌐 PUBLISHED FORM UPDATED:', {
          id: form.id,
          title: form.title,
          pagesCount: form.pages?.length || 0,
          isEnabled: form.settings?.isEnabled,
          allowMultipleSubmissions: form.settings?.allowMultipleSubmissions,
          allowMultipleEmailSubmissions:
            form.settings?.allowMultipleEmailSubmissions,
          updatedAt: form.updatedAt,
        });
      }

      console.log('Form updated successfully');
    } catch (saveError) {
      throw new ApiError('Failed to save form', 500);
    }

    // Return updated form data
    const formData = {
      id: form.id,
      title: form.title,
      description: form.description,
      pages: form.pages || [],
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
      labels: form.labels,
      submissions: form.submissions,
      isFavorite: form.isFavorite,
      isArchived: form.isArchived,
      isTrashed: form.isTrashed,
    };

    res.status(200).json({
      success: true,
      data: formData,
      message:
        wasPublished || form.isPublished
          ? 'Published form updated successfully - changes are live!'
          : 'Form updated successfully',
    });
  })
);

router.patch(
  '/:id/rename',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;
    const userId = (req as any).user.id;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new ApiError(
        'Form name is required and must be a non-empty string',
        400
      );
    }

    if (name.trim().length > 100) {
      throw new ApiError('Form name must be less than 100 characters', 400);
    }

    // Find and update the form
    const form = await Form.findOneAndUpdate(
      {
        _id: id,
        userId: userId, // Ensure user owns the form
      },
      {
        title: name.trim(),
        updatedAt: new Date(),
      },
      {
        new: true, // Return the updated document
        runValidators: true,
      }
    );

    if (!form) {
      throw new ApiError(
        'Form not found or you do not have permission to edit it',
        404
      );
    }

    res.json({
      success: true,
      message: 'Form renamed successfully',
      data: {
        id: form._id,
        name: form.title,
        lastEdited: form.updatedAt,
      },
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

    // First, find the form to ensure it exists and belongs to the user
    const form = await Form.findOne({
      _id: req.params.id,
      userId,
    });

    if (!form) {
      console.log(`Form ${req.params.id} not found for user ${userId}`);
      throw new ApiError('Form not found', 404);
    }

    // Delete the form permanently
    const deleteResult = await Form.deleteOne({
      _id: req.params.id,
      userId,
    });

    if (deleteResult.deletedCount === 0) {
      console.log(`Failed to delete form ${req.params.id}`);
      throw new ApiError('Failed to delete form', 500);
    }

    res.status(200).json({
      success: true,
      message: 'Form deleted permanently',
    });
  })
);

// @desc    Cleanup old trashed forms (30+ days)
// @route   DELETE /api/forms/cleanup-trash
// @access  Private
router.delete(
  '/cleanup-trash',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    console.log(
      `Cleaning up forms trashed before: ${thirtyDaysAgo} for user: ${userId}`
    );

    // Find forms that have been in trash for 30+ days
    const formsToDelete = await Form.find({
      userId,
      isTrashed: true,
      trashedAt: { $lte: thirtyDaysAgo },
    });

    console.log(`Found ${formsToDelete.length} forms to cleanup`);

    if (formsToDelete.length === 0) {
      res.status(200).json({
        success: true,
        message: 'No old trashed forms to cleanup',
        deletedCount: 0,
      });
      return;
    }

    // Delete the old trashed forms
    const result = await Form.deleteMany({
      userId,
      isTrashed: true,
      trashedAt: { $lte: thirtyDaysAgo },
    });

    console.log(`Cleanup result:`, result);

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} old trashed forms cleaned up successfully`,
      deletedCount: result.deletedCount,
      cleanupDate: new Date(),
    });
  })
);

// @desc    Get trash statistics
// @route   GET /api/forms/trash-stats
// @access  Private
router.get(
  '/trash-stats',
  protect,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalTrashed = await Form.countDocuments({
      userId,
      isTrashed: true,
    });

    const expiredForms = await Form.countDocuments({
      userId,
      isTrashed: true,
      trashedAt: { $lte: thirtyDaysAgo },
    });

    const activeTrashed = totalTrashed - expiredForms;

    res.status(200).json({
      success: true,
      data: {
        totalTrashed,
        activeTrashed,
        expiredForms,
        canCleanup: expiredForms > 0,
      },
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

    // Ensure duplicated form has proper default settings
    const enhancedSettings = {
      submitButtonText: 'Submit',
      defaultLabelAlignment: 'LEFT',
      thankyouMessage: 'Thank you for your submission!',
      defaultRequiredField: false,
      showLogo: true,
      isEnabled: true,
      allowMultipleSubmissions: true,
      allowMultipleEmailSubmissions: true,
      collectIpAddress: true,
      enableCaptcha: false,
      requireEmailVerification: false,
      sendSubmissionEmails: true,
      submissionLimit: null,
      submissionDeadline: null,
      ...(originalForm.settings || {}), // Preserve original settings
    };

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
      settings: enhancedSettings,
      isPublished: false,
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
