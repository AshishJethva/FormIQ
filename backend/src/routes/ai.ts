// Backend: src/routes/ai.ts
import express from 'express';
import Form from '../models/Form';
import { protect } from '../middleware/protect';
import { asyncHandler } from '../utils/asyncHandler';
import mongoose from 'mongoose';
import { aiGenerationLimiter } from '../middleware/aiRateLimit';
import AIFormGeneratorService from '../services/aiFormGeneratorService';
import { AILogger } from '../utils/aiLogger';
import { AIPromptValidator } from '../utils/aiPromptValidator';

const router = express.Router();

// Initialize AI service
const aiService = new AIFormGeneratorService();

router.post(
  '/generate-form',
  protect,
  aiGenerationLimiter,
  asyncHandler(async (req, res) => {
    try {
      const { prompt } = req.body;
      const userId = req.user.id;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Prompt is required and must be a string',
        });
      }

      // Validate and sanitize prompt
      const validation = AIPromptValidator.validate(prompt);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.error,
        });
      }

      const sanitizedPrompt = AIPromptValidator.sanitize(prompt);

      AILogger.logUsage(userId, 'FORM_GENERATION_REQUESTED', {
        promptLength: sanitizedPrompt.length,
        originalPromptLength: prompt.length,
      });

     

      const result = await aiService.generateForm(sanitizedPrompt, userId);

      if (!result.success) {
        AILogger.logUsage(userId, 'FORM_GENERATION_FAILED', {
          error: result.error,
          generationTime: result.generationTime,
        });

        return res.status(400).json({
          success: false,
          message: result.error || 'Failed to generate form',
          generationTime: result.generationTime,
        });
      }

      const formConfig = result.data;

      

      const newForm = new Form({
        title: formConfig.title,
        description: formConfig.description || '',
        pages: formConfig.pages,
        settings: formConfig.settings,

        logo: formConfig.logo || null,

        // Form metadata
        userId,
        isPublished: false,
        submissions: 0,
        labels: [],
        isFavorite: false,
        isArchived: false,
        isTrashed: false,
        selectedPageId: formConfig.pages[0]?.id,
        currentPageIndex: 0,
        propertiesPanelOpen: false,
        selectedFieldId: null,

        isAIGenerated: true,
        aiPrompt: sanitizedPrompt,
        aiModel: 'gemini-2.0-flash-lite',
        aiGenerationMetadata: {
          generationTime: result.generationTime,
          version: '2.0', // Enhanced version with logo
          promptTokens: sanitizedPrompt.length,
          responseTokens: JSON.stringify(formConfig).length,
          hasLogo: !!formConfig.logo,
          logoSource: formConfig.logo?.src || null,
          logoType: formConfig.logo?.type || null,
        },
      });

      const savedForm = await newForm.save();

      AILogger.logUsage(userId, 'FORM_GENERATION_SUCCESS', {
        formId: savedForm._id,
        fieldCount: savedForm.pages.reduce(
          (total, page) => total + (page.fields?.length || 0),
          0
        ),
        generationTime: result.generationTime,
        hasLogo: !!savedForm.logo,
        logoSize: savedForm.logo?.size,
        allowMultipleSubmissions: savedForm.settings?.allowMultipleSubmissions,
        allowMultipleEmailSubmissions:
          savedForm.settings?.allowMultipleEmailSubmissions,
      });

      res.status(201).json({
        success: true,
        message: 'Form generated successfully with logo',
        data: {
          id: savedForm._id,
          title: savedForm.title,
          description: savedForm.description,
          pages: savedForm.pages,
          settings: savedForm.settings,

          logo: savedForm.logo,

          // Form metadata
          userId: savedForm.userId,
          isPublished: savedForm.isPublished,
          submissions: savedForm.submissions,
          selectedPageId: savedForm.selectedPageId,
          currentPageIndex: savedForm.currentPageIndex,

          // AI metadata
          isAIGenerated: savedForm.isAIGenerated,
          aiPrompt: savedForm.aiPrompt,

          // Stats
          createdAt: savedForm.createdAt,
          updatedAt: savedForm.updatedAt,
          fieldCount: savedForm.pages.reduce(
            (total, page) => total + (page.fields?.length || 0),
            0
          ),
          generationTime: result.generationTime,

          hasLogo: !!savedForm.logo,
          logoUrl: savedForm.logo?.src,
          logoSize: savedForm.logo?.size,
          logoAlignment: savedForm.logo?.alignment,
        },
      });
    } catch (error: any) {
      AILogger.logUsage(req.user?.id, 'FORM_GENERATION_ERROR', {
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error during form generation',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  })
);

router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Form.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalForms: { $sum: 1 },
          aiForms: { $sum: { $cond: ['$isAIGenerated', 1, 0] } },
          manualForms: { $sum: { $cond: ['$isAIGenerated', 0, 1] } },

          aiFormsWithLogo: {
            $sum: {
              $cond: [
                { $and: ['$isAIGenerated', { $ne: ['$logo', null] }] },
                1,
                0,
              ],
            },
          },
          totalFormsWithLogo: {
            $sum: { $cond: [{ $ne: ['$logo', null] }, 1, 0] },
          },

          // Field and generation metrics
          avgFieldsPerAIForm: {
            $avg: {
              $cond: [
                '$isAIGenerated',
                {
                  $sum: {
                    $map: {
                      input: '$pages',
                      as: 'page',
                      in: { $size: '$$page.fields' },
                    },
                  },
                },
                null,
              ],
            },
          },
          avgGenerationTime: {
            $avg: {
              $cond: [
                '$isAIGenerated',
                '$aiGenerationMetadata.generationTime',
                null,
              ],
            },
          },

          aiFormsWithMultipleSubmissions: {
            $sum: {
              $cond: [
                {
                  $and: [
                    '$isAIGenerated',
                    { $eq: ['$settings.allowMultipleSubmissions', true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          aiFormsWithMultipleEmails: {
            $sum: {
              $cond: [
                {
                  $and: [
                    '$isAIGenerated',
                    { $eq: ['$settings.allowMultipleEmailSubmissions', true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalForms: 0,
      aiForms: 0,
      manualForms: 0,
      aiFormsWithLogo: 0,
      totalFormsWithLogo: 0,
      avgFieldsPerAIForm: 0,
      avgGenerationTime: 0,
      aiFormsWithMultipleSubmissions: 0,
      aiFormsWithMultipleEmails: 0,
    };

    const enhancedStats = {
      ...result,
      logoSuccessRate:
        result.aiForms > 0
          ? (result.aiFormsWithLogo / result.aiForms) * 100
          : 0,
      multipleSubmissionRate:
        result.aiForms > 0
          ? (result.aiFormsWithMultipleSubmissions / result.aiForms) * 100
          : 0,
      multipleEmailRate:
        result.aiForms > 0
          ? (result.aiFormsWithMultipleEmails / result.aiForms) * 100
          : 0,
    };

    res.json({
      success: true,
      data: enhancedStats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
    });
  }
});

router.get('/recent-forms', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit as string) || 10;

    const recentAIForms = await Form.find({
      userId,
      isAIGenerated: true,
      isTrashed: false,
    })
      .select(
        'title description createdAt aiPrompt aiGenerationMetadata logo settings'
      )
      .sort({ createdAt: -1 })
      .limit(limit);

    const enhancedForms = recentAIForms.map(form => ({
      _id: form._id,
      title: form.title,
      description: form.description,
      createdAt: form.createdAt,
      aiPrompt: form.aiPrompt,
      aiGenerationMetadata: form.aiGenerationMetadata,

      hasLogo: !!form.logo,
      logoUrl: form.logo?.src,
      logoSize: form.logo?.size,
      logoAlignment: form.logo?.alignment,

      allowMultipleSubmissions: form.settings?.allowMultipleSubmissions,
      allowMultipleEmailSubmissions:
        form.settings?.allowMultipleEmailSubmissions,
      showLogo: form.settings?.showLogo,
    }));

    res.json({
      success: true,
      data: enhancedForms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent forms',
    });
  }
});

router.post(
  '/regenerate-logo/:formId',
  protect,
  asyncHandler(async (req, res) => {
    try {
      const { formId } = req.params;
      const userId = req.user.id;

      // Validate form ID
      if (!mongoose.Types.ObjectId.isValid(formId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid form ID format',
        });
      }

      // Find and verify form ownership
      const form = await Form.findOne({ _id: formId, userId });
      if (!form) {
        return res.status(404).json({
          success: false,
          message: 'Form not found',
        });
      }

    

      // Generate new logo
      const logoResult = await aiService.generateFormLogoPublic(
        form.title,
        form.description || ''
      );

      if (!logoResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to generate logo',
          error: logoResult.error,
        });
      }

      // Update form with new logo
      const updatedForm = await Form.findByIdAndUpdate(
        formId,
        {
          logo: {
            src: logoResult.logoUrl,
            type: 'url',
            alignment: 'CENTER',
            size: 100, // Maximum size
            publicId: logoResult.publicId || null,
          },
          'settings.showLogo': true,
          updatedAt: new Date(),
        },
        { new: true }
      );

      AILogger.logUsage(userId, 'LOGO_REGENERATED', {
        formId,
        logoUrl: logoResult.logoUrl,
      });

      res.json({
        success: true,
        message: 'Logo regenerated successfully',
        data: {
          logo: updatedForm?.logo,
          logoUrl: logoResult.logoUrl,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to regenerate logo',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  })
);

router.post(
  '/logo-suggestions',
  protect,
  asyncHandler(async (req, res) => {
    try {
      const { formType, title } = req.body;

      if (!formType && !title) {
        return res.status(400).json({
          success: false,
          message: 'Form type or title is required',
        });
      }

      // Generate basic logo suggestions based on form type and title
      const suggestions = {
        icons: ['📝', '📋', '📊', '📈', '💼', '🎯', '⚡', '🔥'],
        colors: [
          '#3B82F6',
          '#10B981',
          '#8B5CF6',
          '#F59E0B',
          '#EF4444',
          '#06B6D4',
        ],
        styles: ['minimal', 'modern', 'classic', 'bold'],
      };

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to get logo suggestions',
      });
    }
  })
);

export default router;
