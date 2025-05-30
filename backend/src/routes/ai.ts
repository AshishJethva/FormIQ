// Backend: src/routes/ai.ts
import express from 'express';
import Form from '../models/Form';
import { protect } from '../middleware/protect';
import { asyncHandler } from '../utils/asyncHandler';
import mongoose from 'mongoose';
import { aiGenerationLimiter } from '../middleware/aiRateLimit';
import AIFormGeneratorService from '../services/aiFormGeneratorService';
import { AILogger } from '../utils/aiLogger';

const router = express.Router();

// Initialize AI service
const aiService = new AIFormGeneratorService();

// AI Form Generator endpoint
router.post(
  '/generate-form',
  protect,
  aiGenerationLimiter,
  asyncHandler(async (req, res) => {
    try {
      const { prompt } = req.body;
      const userId = req.user.id;

      AILogger.logUsage(userId, 'FORM_GENERATION_REQUESTED', {
        promptLength: prompt?.length,
      });

      // Generate form using AI service
      const result = await aiService.generateForm(prompt, userId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error || 'Failed to generate form',
          generationTime: result.generationTime,
        });
      }

      const formConfig = result.data;

      // Create form in database
      const newForm = new Form({
        title: formConfig.title,
        description: formConfig.description || '',
        pages: formConfig.pages,
        settings: formConfig.settings,
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

        // AI generation metadata
        isAIGenerated: true,
        aiPrompt: prompt.trim(),
        aiModel: 'gemini-2.0-flash-exp',
        aiGenerationMetadata: {
          generationTime: result.generationTime,
          version: '1.0',
          promptTokens: prompt.length,
          responseTokens: JSON.stringify(formConfig).length,
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
      });

      res.status(201).json({
        success: true,
        message: 'Form generated successfully',
        data: {
          id: savedForm._id,
          title: savedForm.title,
          description: savedForm.description,
          pages: savedForm.pages,
          settings: savedForm.settings,
          userId: savedForm.userId,
          isPublished: savedForm.isPublished,
          submissions: savedForm.submissions,
          selectedPageId: savedForm.selectedPageId,
          currentPageIndex: savedForm.currentPageIndex,
          isAIGenerated: savedForm.isAIGenerated,
          createdAt: savedForm.createdAt,
          updatedAt: savedForm.updatedAt,
          fieldCount: savedForm.pages.reduce(
            (total, page) => total + (page.fields?.length || 0),
            0
          ),
          generationTime: result.generationTime,
        },
      });
    } catch (error: any) {
      console.error('❌ AI Form Generation Route Error:', error);

      AILogger.logUsage(req.user?.id, 'FORM_GENERATION_ERROR', {
        error: error.message,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  })
);

// Get AI generation statistics
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
        },
      },
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        totalForms: 0,
        aiForms: 0,
        manualForms: 0,
        avgFieldsPerAIForm: 0,
        avgGenerationTime: 0,
      },
    });
  } catch (error) {
    console.error('❌ Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
    });
  }
});

// Get recent AI-generated forms
router.get('/recent-forms', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit as string) || 10;

    const recentAIForms = await Form.find({
      userId,
      isAIGenerated: true,
      isTrashed: false,
    })
      .select('title description createdAt aiPrompt aiGenerationMetadata')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: recentAIForms,
    });
  } catch (error) {
    console.error('❌ Recent Forms Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent forms',
    });
  }
});

export default router;
