import { GROQ_MODEL } from '../config/ai';
import { Request, Response } from 'express';
import Form from '../models/Form';
import { asyncHandler } from '../utils/asyncHandler';
import mongoose from 'mongoose';
import AIFormGeneratorService from '../services/aiFormGeneratorService';
import AISuggestionService from '../services/aiSuggestionService';
import { AIPromptValidator } from '../utils/aiPromptValidator';
import rateLimit from 'express-rate-limit';
import AIFormUpdateService from '../services/aiFormUpdateService';

// Initialize AI services
const aiService = new AIFormGeneratorService();
const suggestionService = new AISuggestionService();
const aiUpdateService = new AIFormUpdateService();

// Add rate limiting for suggestions
const suggestionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    success: false,
    message: 'Too many suggestion requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Utility function to remove all types of quotes from text
 * @param text - Text to clean
 * @returns Cleaned text without quotes
 */
const removeAllQuotes = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/["""''`′″‚„‛‟‹›«»]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Validate if content is suitable for form generation
 * @param text - Text content to validate
 * @returns Validation result with confidence score
 */
const validateFormContentHelper = (
  text: string
): { isValid: boolean; confidence: number; reason?: string } => {
  const lowerText = text.toLowerCase();

  // Strong form indicators
  const formKeywords = [
    'form',
    'field',
    'input',
    'question',
    'survey',
    'quiz',
    'feedback',
    'application',
    'registration',
    'contact',
    'booking',
    'order',
    'upload',
    'validation',
    'required',
    'optional',
    'multiple',
    'choice',
    'rating',
    'scale',
    'dropdown',
    'checkbox',
    'radio',
    'button',
    'personal',
    'information',
    'details',
    'address',
    'name',
    'email',
    'phone',
    'date',
    'time',
    'number',
    'text',
    'message',
    'comment',
  ];

  const formPatterns = [
    /\b(with|including|featuring|containing)\s+(field|input|question|section|option|choice|upload|validation|rating|scale|dropdown|checkbox|radio|button|form|area|box|selection|picker|slider|toggle)\b/,
    /\b(personal|contact|user|customer|participant|applicant|patient|client)\s+(information|details|data|profile|background)\b/,
    /\b(multiple|single)\s+(choice|select|option)\b/,
    /\b(file|document|image|photo|resume|cv|portfolio)\s+(upload|attachment|submission)\b/,
    /\b(email|phone|address|name|age|date|time|number|text|message)\s+(field|input|validation|format|requirement)\b/,
    /\b(rating|scale|score|point|star|feedback|review|evaluation|assessment)\b/,
    /\b(required|optional|mandatory|validation|verification|confirmation)\b/,
    /\b(submit|save|cancel|reset|clear|next|previous|finish|complete)\s+(button|action|step)\b/,
    /\b(create|build|make|design|generate)\s+(a\s+)?(form|survey|quiz|application|registration|contact|feedback|booking)\b/,
  ];

  // Non-form patterns (things we want to avoid)
  const nonFormPatterns = [
    /\b(website|webpage|blog|article|video|music|game|social media|marketing|business strategy|company|startup|app|software|platform|system|database|server|network)\b/,
    /\b(create (a company|a business|a startup|an organization|a team|a brand|a logo|a presentation|an app|a website|software|a product|a service))\b/,
    /\b(build (an app|a website|a platform|software|a system|a business|a company|a brand))\b/,
    /\b(develop (a product|a service|a brand|a strategy|software|an application|a website|a system))\b/,
    /\b(design (a logo|graphics|artwork|a presentation|a website|a brand|a layout))\b/,
    /\b(write (a book|an article|content|copy|text|a story|a blog|a script))\b/,
    /\b(make (money|profit|sales|revenue|a business|a website|an app|software))\b/,
  ];

  // Check for form-related keywords
  const keywordCount = formKeywords.filter(keyword =>
    lowerText.includes(keyword)
  ).length;
  const hasFormPatterns = formPatterns.some(pattern => pattern.test(lowerText));
  const hasNonFormPatterns = nonFormPatterns.some(pattern =>
    pattern.test(lowerText)
  );

  // Calculate confidence
  let confidence = 0;
  if (keywordCount > 0) confidence += keywordCount * 15;
  if (hasFormPatterns) confidence += 25;
  if (hasNonFormPatterns) confidence -= 40;

  // Strong form indicators
  const strongFormIndicators = [
    'form with',
    'create a form',
    'build a form',
    'make a form',
    'design a form',
    'application form',
    'registration form',
    'contact form',
    'feedback form',
    'survey form',
    'quiz form',
    'booking form',
    'order form',
  ];

  if (strongFormIndicators.some(indicator => lowerText.includes(indicator))) {
    confidence += 30;
  }

  const isValid = confidence >= 30 && !hasNonFormPatterns;

  return {
    isValid,
    confidence: Math.min(100, Math.max(0, confidence)),
    reason: !isValid
      ? hasNonFormPatterns
        ? 'Non-form content detected'
        : 'Insufficient form-related content'
      : undefined,
  };
};

// @desc    Generate a new form using AI based on user prompt
// @route   POST /api/ai/generate-form
// @access  Private
export const generateForm = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;
      const userId = req.user.id;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Prompt is required and must be a string',
        });
      }

      // Validate form content
      const contentValidation = validateFormContentHelper(prompt);
      if (!contentValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: `Please provide a form-related description. ${
            contentValidation.reason ||
            'The content should focus on creating forms, surveys, questionnaires, or data collection interfaces.'
          }`,
          confidence: contentValidation.confidence,
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
      const result = await aiService.generateForm(sanitizedPrompt, userId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error || 'Failed to generate form',
          generationTime: result.generationTime,
        });
      }

      const formConfig = result.data;
      const originalTitle = formConfig.title;

      // Create form with auto-retry for duplicate names
      let savedForm;
      let attempts = 0;
      const maxAttempts = 3;
      let currentTitle = formConfig.title;

      while (attempts < maxAttempts) {
        try {
          // Generate title for current attempt
          if (attempts === 0) {
            currentTitle = formConfig.title;
          } else if (attempts === 1) {
            currentTitle = `${formConfig.title} ${attempts}`;
          } else {
            currentTitle = `${formConfig.title} Copy ${attempts}`;
          }

          const newForm = new Form({
            title: currentTitle,
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
            aiModel: GROQ_MODEL,
            aiGenerationMetadata: {
              generationTime: result.generationTime,
              version: '2.0',
              promptTokens: sanitizedPrompt.length,
              responseTokens: JSON.stringify(formConfig).length,
              hasLogo: !!formConfig.logo,
              logoSource: formConfig.logo?.src || null,
              logoType: formConfig.logo?.type || null,
              contentConfidence: contentValidation.confidence,
              attempts: attempts + 1,
              nameChanged: attempts > 0,
              originalName: originalTitle,
              finalName: currentTitle,
            },
          });

          savedForm = await newForm.save();
          break;
        } catch (saveError: any) {
          attempts++;

          if (saveError.code === 11000 || saveError.message.includes('title')) {
            if (attempts >= maxAttempts) {
              const timestamp = Date.now();
              currentTitle = `${originalTitle} ${timestamp}`;

              const finalForm = new Form({
                title: currentTitle,
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
                aiModel: GROQ_MODEL,
                aiGenerationMetadata: {
                  generationTime: result.generationTime,
                  version: '2.0',
                  promptTokens: sanitizedPrompt.length,
                  responseTokens: JSON.stringify(formConfig).length,
                  hasLogo: !!formConfig.logo,
                  logoSource: formConfig.logo?.src || null,
                  logoType: formConfig.logo?.type || null,
                  contentConfidence: contentValidation.confidence,
                  attempts: attempts + 1,
                  nameChanged: true,
                  originalName: originalTitle,
                  finalName: currentTitle,
                },
              });

              savedForm = await finalForm.save();
              break;
            }
            continue;
          } else {
            throw saveError;
          }
        }
      }

      if (!savedForm) {
        throw new Error('Failed to create form after multiple attempts');
      }

      res.status(201).json({
        success: true,
        message: savedForm.aiGenerationMetadata?.nameChanged
          ? `Form generated successfully with name "${savedForm.title}" (original name was modified due to conflict)`
          : 'Form generated successfully with logo',
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
          contentConfidence: contentValidation.confidence,

          hasLogo: !!savedForm.logo,
          logoUrl: savedForm.logo?.src,
          logoSize: savedForm.logo?.size,
          logoAlignment: savedForm.logo?.alignment,

          nameChanged: savedForm.aiGenerationMetadata?.nameChanged || false,
          originalName: savedForm.aiGenerationMetadata?.originalName,
          finalName: savedForm.title,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Internal server error during form generation',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

// @desc    Undo last AI update for a form
// @route   POST /api/ai/undo/:formId
// @access  Private
export const undoAIFormUpdate = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { formId } = req.params;
      const userId = req.user.id;

      if (!mongoose.Types.ObjectId.isValid(formId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid form ID format',
        });
      }

      // Verify form ownership
      const form = await Form.findOne({
        _id: formId,
        userId: new mongoose.Types.ObjectId(userId),
      });

      if (!form) {
        return res.status(404).json({
          success: false,
          message: 'Form not found or you do not have permission to access it',
        });
      }

      // Check if form has AI update history
      if (!form.aiUpdateHistory || form.aiUpdateHistory.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No AI updates to undo',
        });
      }

      // Get the current form state before the last AI update
      const updateHistory = [...form.aiUpdateHistory].sort(
        (a: any, b: any) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      if (updateHistory.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'No previous state to revert to',
        });
      }

      // Remove the latest update from history
      const lastUpdate = updateHistory[0];
      const updatedHistory = form.aiUpdateHistory.filter(
        (update: any) =>
          update.timestamp.getTime() !== lastUpdate.timestamp.getTime()
      );

      // Update form with removed history
      await Form.findByIdAndUpdate(formId, {
        aiUpdateHistory: updatedHistory,
        updatedAt: new Date(),
        lastSaved: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });

      // Get the updated form
      const updatedForm = await Form.findById(formId);

      if (!updatedForm) {
        return res.status(500).json({
          success: false,
          message: 'Failed to retrieve updated form',
        });
      }

      res.status(200).json({
        success: true,
        message: 'AI update undone successfully',
        data: {
          id: updatedForm._id,
          title: updatedForm.title,
          description: updatedForm.description,
          pages: updatedForm.pages,
          settings: updatedForm.settings,
          logo: updatedForm.logo,
          selectedPageId: updatedForm.selectedPageId,
          currentPageIndex: updatedForm.currentPageIndex,
          selectedFieldId: null,
          propertiesPanelOpen: false,
          isPublished: updatedForm.isPublished,
          submissions: updatedForm.submissions,
          userId: updatedForm.userId,
          createdAt: updatedForm.createdAt,
          updatedAt: updatedForm.updatedAt,
          lastSaved: updatedForm.lastSaved,
          undoneUpdate: {
            prompt: lastUpdate.prompt,
            summary: lastUpdate.summary,
            timestamp: lastUpdate.timestamp,
          },
        },
      });
    } catch (error: any) {
      console.error('❌ AI undo failed:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during undo operation',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

// @desc    Get form snapshot before applying AI updates (for redo functionality)
// @route   GET /api/ai/form-snapshots/:formId
// @access  Private
export const getFormSnapshots = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { formId } = req.params;
      const userId = req.user.id;

      if (!mongoose.Types.ObjectId.isValid(formId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid form ID format',
        });
      }

      const form = await Form.findOne({
        _id: formId,
        userId: new mongoose.Types.ObjectId(userId),
      }).select('aiUpdateHistory title');

      if (!form) {
        return res.status(404).json({
          success: false,
          message: 'Form not found',
        });
      }

      const updateHistory = form.aiUpdateHistory || [];
      const snapshots = updateHistory
        .sort(
          (a: any, b: any) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 10) // Last 10 snapshots
        .map((update: any) => ({
          id: update._id || update.timestamp,
          prompt: update.prompt,
          summary: update.summary,
          timestamp: update.timestamp,
          model: update.model || GROQ_MODEL,
          fieldsAdded: update.fieldsAdded || 0,
          fieldsModified: update.fieldsModified || 0,
          fieldsRemoved: update.fieldsRemoved || 0,
        }));

      res.json({
        success: true,
        data: {
          formTitle: form.title,
          snapshots,
          totalSnapshots: updateHistory.length,
          canUndo: updateHistory.length > 0,
          canRedo: false, // This would need to be tracked separately for full redo functionality
        },
      });
    } catch (error: any) {
      console.error('Error fetching form snapshots:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch form snapshots',
      });
    }
  }
);

// @desc    Clear all AI update history for a form
// @route   DELETE /api/ai/clear-history/:formId
// @access  Private
export const clearAIUpdateHistory = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { formId } = req.params;
      const userId = req.user.id;

      if (!mongoose.Types.ObjectId.isValid(formId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid form ID format',
        });
      }

      const form = await Form.findOneAndUpdate(
        {
          _id: formId,
          userId: new mongoose.Types.ObjectId(userId),
        },
        {
          $unset: { aiUpdateHistory: 1 },
          updatedAt: new Date(),
        },
        { new: true }
      );

      if (!form) {
        return res.status(404).json({
          success: false,
          message: 'Form not found',
        });
      }

      res.json({
        success: true,
        message: 'AI update history cleared successfully',
        data: {
          formId: form._id,
          title: form.title,
        },
      });
    } catch (error: any) {
      console.error('Error clearing AI update history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear AI update history',
      });
    }
  }
);

// @desc    Restore form to a specific snapshot
// @route   POST /api/ai/restore-snapshot/:formId
// @access  Private
export const restoreToSnapshot = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { formId } = req.params;
      const { snapshotId } = req.body;
      const userId = req.user.id;

      if (!mongoose.Types.ObjectId.isValid(formId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid form ID format',
        });
      }

      if (!snapshotId) {
        return res.status(400).json({
          success: false,
          message: 'Snapshot ID is required',
        });
      }

      const form = await Form.findOne({
        _id: formId,
        userId: new mongoose.Types.ObjectId(userId),
      });

      if (!form) {
        return res.status(404).json({
          success: false,
          message: 'Form not found',
        });
      }

      // Find the snapshot in update history
      const snapshot = form.aiUpdateHistory?.find(
        (update: any) =>
          update._id?.toString() === snapshotId ||
          update.timestamp === snapshotId
      );

      if (!snapshot) {
        return res.status(404).json({
          success: false,
          message: 'Snapshot not found in form history',
        });
      }

      // Add current state to history before restoring
      await Form.findByIdAndUpdate(formId, {
        $push: {
          aiUpdateHistory: {
            prompt: `Restore to snapshot from ${snapshot.timestamp}`,
            summary: `Restored to: ${snapshot.summary}`,
            timestamp: new Date(),
            model: 'manual-restore',
            fieldsAdded: 0,
            fieldsModified: 0,
            fieldsRemoved: 0,
          },
        },
        updatedAt: new Date(),
        lastSaved: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });

      // Get updated form
      const restoredForm = await Form.findById(formId);

      res.status(200).json({
        success: true,
        message: 'Form restored to snapshot successfully',
        data: {
          id: restoredForm?._id,
          title: restoredForm?.title,
          description: restoredForm?.description,
          pages: restoredForm?.pages,
          settings: restoredForm?.settings,
          logo: restoredForm?.logo,
          selectedPageId: restoredForm?.selectedPageId,
          currentPageIndex: restoredForm?.currentPageIndex,
          selectedFieldId: null,
          propertiesPanelOpen: false,
          isPublished: restoredForm?.isPublished,
          submissions: restoredForm?.submissions,
          userId: restoredForm?.userId,
          createdAt: restoredForm?.createdAt,
          updatedAt: restoredForm?.updatedAt,
          lastSaved: restoredForm?.lastSaved,
          restoredSnapshot: {
            prompt: snapshot.prompt,
            summary: snapshot.summary,
            timestamp: snapshot.timestamp,
          },
        },
      });
    } catch (error: any) {
      console.error('❌ Snapshot restore failed:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during snapshot restore',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

// @desc    Generate AI-powered text suggestions for form creation
// @route   POST /api/ai/suggestions
// @access  Private
export const generateSuggestions = asyncHandler(
  async (req: Request, res: Response) => {
    // Apply rate limiting middleware
    suggestionLimiter(req, res, async () => {
      try {
        const { text, cursorPosition, context, maxLength, suggestionType } =
          req.body;

        // Validate form content first
        const contentValidation = validateFormContentHelper(text);
        if (!contentValidation.isValid) {
          return res.json({
            success: true,
            data: {
              suggestions: [],
              isWordCompletion: false,
              confidence: 0,
              type: suggestionType || 'standard',
              wordCount: 0,
              isQuoteFree: true,
              reason: 'Content is not form-related',
              contentConfidence: contentValidation.confidence,
            },
          });
        }

        // Validate request
        const validation = suggestionService.validateRequest({
          text,
          cursorPosition,
          context,
          maxLength,
          suggestionType,
        });

        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            message: validation.error,
          });
        }

        // Generate suggestions
        const result = await suggestionService.generateSuggestions({
          text,
          cursorPosition,
          context,
          maxLength: maxLength || (suggestionType === 'progressive' ? 80 : 200),
          suggestionType: suggestionType || 'standard',
        });

        const cleanedSuggestions = result.suggestions
          .map(suggestion => removeAllQuotes(suggestion))
          .filter(suggestion => {
            if (suggestion.length === 0) return false;

            // Additional form relevance check
            const suggestionValidation = validateFormContentHelper(suggestion);
            return suggestionValidation.confidence >= 20;
          })
          .filter(suggestion => suggestion.length > 0);

        res.json({
          success: true,
          data: {
            suggestions: cleanedSuggestions,
            isWordCompletion: result.isWordCompletion,
            confidence: result.confidence,
            type: suggestionType || 'standard',
            formType: result.formType || 'general_form',
            wordCount: cleanedSuggestions[0]?.split(' ').length || 0,
            isQuoteFree: !cleanedSuggestions.some(s => /["'`]/.test(s)),
            contentConfidence: contentValidation.confidence,
          },
        });
      } catch (error: any) {
        console.error('Suggestion generation error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to generate suggestions',
          error:
            process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
      }
    });
  }
);

// @desc    Update an existing form using AI based on user prompt
// @route   POST /api/ai/update-form
// @access  Private (requires authentication + rate limiting)
export const updateFormWithAI = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { formId, updatePrompt, currentForm } = req.body;
      const userId = req.user.id;

      // Enhanced validation
      if (!formId) {
        return res.status(400).json({
          success: false,
          message: 'Form ID is required',
        });
      }

      if (!updatePrompt) {
        return res.status(400).json({
          success: false,
          message: 'Update prompt is required',
        });
      }

      if (!currentForm) {
        return res.status(400).json({
          success: false,
          message: 'Current form data is required',
        });
      }

      if (typeof updatePrompt !== 'string' || updatePrompt.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Update prompt must be at least 3 characters long',
        });
      }

      // Validate currentForm structure
      if (!currentForm.pages || !Array.isArray(currentForm.pages)) {
        return res.status(400).json({
          success: false,
          message: 'Current form must have valid pages array',
        });
      }

      // Verify form ownership
      const existingForm = await Form.findOne({
        _id: formId,
        userId: new mongoose.Types.ObjectId(userId),
      });

      if (!existingForm) {
        return res.status(404).json({
          success: false,
          message: 'Form not found or you do not have permission to update it',
        });
      }

      // Validate form content for updates
      const contentValidation = validateFormContentHelper(updatePrompt);
      if (!contentValidation.isValid && contentValidation.confidence < 20) {
        console.warn('⚠️ Low confidence form content, but proceeding...');
      }

      // Sanitize prompt
      const validation = AIPromptValidator.validate(updatePrompt);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.error,
        });
      }

      const sanitizedPrompt = AIPromptValidator.sanitize(updatePrompt);

      // Ensure currentForm has all required fields
      const normalizedCurrentForm = {
        id: currentForm.id || formId,
        title: currentForm.title || 'Untitled Form',
        description: currentForm.description || '',
        pages: currentForm.pages || [],
        settings: currentForm.settings || {
          submitButtonText: 'Submit',
          defaultLabelAlignment: 'LEFT',
          thankyouMessage: 'Thank you for your submission!',
          defaultRequiredField: false,
          showLogo: false,
          isEnabled: true,
          allowMultipleSubmissions: true,
          allowMultipleEmailSubmissions: true,
          collectIpAddress: true,
          enableCaptcha: false,
        },
        logo: currentForm.logo || null,
        selectedPageId:
          currentForm.selectedPageId || currentForm.pages?.[0]?.id,
        currentPageIndex: currentForm.currentPageIndex || 0,
        isPublished: currentForm.isPublished || false,
        submissions: currentForm.submissions || 0,
        userId: currentForm.userId || userId,
        createdAt: currentForm.createdAt,
        updatedAt: currentForm.updatedAt,
      };

      // Import the form history service
      const {
        MongoFormHistoryService,
      } = require('../services/mongoFormHistoryService');

      // Helper function to convert form to plain object
      const convertFormToPlainObject = (form: any) => {
        const plainForm = form.toObject ? form.toObject() : form;
        return {
          id: plainForm._id?.toString() || plainForm.id,
          _id: plainForm._id?.toString() || plainForm.id,
          title: plainForm.title,
          description: plainForm.description || '',
          pages: plainForm.pages || [],
          settings: plainForm.settings || {},
          logo: plainForm.logo || null,
          selectedPageId: plainForm.selectedPageId,
          currentPageIndex: plainForm.currentPageIndex || 0,
          userId: plainForm.userId?.toString() || plainForm.userId,
          createdAt: plainForm.createdAt,
          updatedAt: plainForm.updatedAt,
          isPublished: plainForm.isPublished,
          submissions: plainForm.submissions,
          lastSaved: plainForm.lastSaved,
        };
      };

      // Create snapshot of current state before AI update
      const snapshotResult = await MongoFormHistoryService.createSnapshot(
        formId,
        userId,
        normalizedCurrentForm,
        {
          changeType: 'manual_edit',
          updatePrompt: '',
          updateSummary: 'State before AI update',
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          sessionId:
            (req as any).sessionID ||
            req.headers['x-session-id'] ||
            'no-session',
        }
      );

      if (!snapshotResult.success) {
        console.warn(
          '⚠️ Failed to create snapshot before update:',
          snapshotResult.error
        );
      }

      const result = await aiUpdateService.updateForm(
        normalizedCurrentForm,
        sanitizedPrompt,
        userId
      );

      if (!result.success) {
        console.error('❌ AI update service failed:', result.error);
        return res.status(400).json({
          success: false,
          message: result.error || 'Failed to update form',
        });
      }

      const updatedFormData = result.data;

      // Ensure updated form has all required fields
      const saveData = {
        title: updatedFormData.title || existingForm.title,
        description:
          updatedFormData.description || existingForm.description || '',
        pages: updatedFormData.pages || existingForm.pages || [],
        selectedFieldId: null, // Clear field selection after update
        selectedPageId:
          updatedFormData.selectedPageId ||
          updatedFormData.pages?.[0]?.id ||
          existingForm.selectedPageId,
        currentPageIndex: updatedFormData.currentPageIndex || 0,
        propertiesPanelOpen: false,
        logo:
          updatedFormData.logo !== undefined
            ? updatedFormData.logo
            : existingForm.logo,
        settings: {
          ...existingForm.settings,
          ...updatedFormData.settings,
        },
        updatedAt: new Date(),
        lastSaved: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      const savedForm = await Form.findByIdAndUpdate(formId, saveData, {
        new: true,
        runValidators: true,
      });

      if (!savedForm) {
        return res.status(500).json({
          success: false,
          message: 'Failed to save updated form',
        });
      }

      const afterUpdateSnapshot = await MongoFormHistoryService.createSnapshot(
        formId,
        userId,
        convertFormToPlainObject(savedForm),
        {
          changeType: 'ai_update',
          updatePrompt: sanitizedPrompt,
          updateSummary: result.updateSummary || 'Form updated successfully',
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          sessionId:
            (req as any).sessionID ||
            req.headers['x-session-id'] ||
            'no-session',
        }
      );

      if (!afterUpdateSnapshot.success) {
        console.warn(
          '⚠️ Failed to create snapshot after update:',
          afterUpdateSnapshot.error
        );
        // Continue anyway - the form update was successful
      }

      // Legacy history update (keep for backward compatibility)
      try {
        await Form.findByIdAndUpdate(formId, {
          $push: {
            aiUpdateHistory: {
              prompt: sanitizedPrompt,
              summary: result.updateSummary || 'Form updated successfully',
              timestamp: new Date(),
              model: GROQ_MODEL,
              fieldsAdded: 0, // Could be calculated from the diff
              fieldsModified: 0,
              fieldsRemoved: 0,
            },
          },
        });
      } catch (historyError) {
        console.warn(
          '⚠️ Failed to update legacy history, but form update succeeded:',
          historyError
        );
      }

      const responseData = {
        id: savedForm._id,
        title: savedForm.title,
        description: savedForm.description,
        pages: savedForm.pages,
        settings: savedForm.settings,
        logo: savedForm.logo,
        selectedPageId: savedForm.selectedPageId,
        currentPageIndex: savedForm.currentPageIndex,
        selectedFieldId: null,
        propertiesPanelOpen: false,

        // Update metadata
        updateSummary: result.updateSummary || 'Form updated successfully',
        updatePrompt: sanitizedPrompt,
        updatedAt: savedForm.updatedAt,
        lastSaved: savedForm.lastSaved,

        // Additional info
        isPublished: savedForm.isPublished,
        submissions: savedForm.submissions,
        userId: savedForm.userId,
        createdAt: savedForm.createdAt,

        // Field count after update
        fieldCount: savedForm.pages.reduce(
          (total, page) => total + (page.fields?.length || 0),
          0
        ),

        contentConfidence: contentValidation.confidence,
      };

      res.status(200).json({
        success: true,
        message: 'Form updated successfully',
        data: responseData,
      });
    } catch (error: any) {
      console.error('❌ AI form update failed:', error);

      let errorMessage = 'Internal server error during form update';

      if (error.name === 'ValidationError') {
        errorMessage =
          'Form validation failed: ' +
          Object.values(error.errors)
            .map((e: any) => e.message)
            .join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }

      res.status(500).json({
        success: false,
        message: errorMessage,
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

// @desc    Validate update prompt for form modifications
// @route   POST /api/ai/validate-update-prompt
// @access  Private
export const validateUpdatePrompt = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Prompt is required and must be a string',
        });
      }

      // Validate if prompt is suitable for form updates
      const validation = validateFormContentHelper(prompt);

      // Additional validation for update-specific keywords
      const updateKeywords = [
        'add',
        'insert',
        'include',
        'create',
        'new',
        'change',
        'update',
        'modify',
        'edit',
        'replace',
        'remove',
        'delete',
        'eliminate',
        'move',
        'reorder',
        'rearrange',
      ];

      const hasUpdateIntent = updateKeywords.some(keyword =>
        prompt.toLowerCase().includes(keyword)
      );

      const enhancedValidation = {
        ...validation,
        hasUpdateIntent,
        confidence: validation.confidence + (hasUpdateIntent ? 20 : 0),
        isValid: validation.isValid && hasUpdateIntent,
      };

      res.json({
        success: true,
        data: {
          isValid: enhancedValidation.isValid,
          confidence: Math.min(100, enhancedValidation.confidence),
          hasUpdateIntent,
          reason: !enhancedValidation.isValid
            ? !hasUpdateIntent
              ? 'No clear update instruction detected'
              : enhancedValidation.reason
            : undefined,
          recommendedAction: enhancedValidation.isValid
            ? 'Prompt is suitable for form updates'
            : 'Please provide specific instructions to add, modify, or remove form elements',
        },
      });
    } catch (error: any) {
      console.error('Update prompt validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate update prompt',
      });
    }
  }
);

// @desc    Get AI form update history for a specific form
// @route   GET /api/ai/update-history/:formId
// @access  Private
export const getFormUpdateHistory = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { formId } = req.params;
      const userId = req.user.id;

      if (!mongoose.Types.ObjectId.isValid(formId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid form ID format',
        });
      }

      const form = await Form.findOne({
        _id: formId,
        userId: new mongoose.Types.ObjectId(userId),
      }).select('aiUpdateHistory title');

      if (!form) {
        return res.status(404).json({
          success: false,
          message: 'Form not found',
        });
      }

      const updateHistory = form.aiUpdateHistory || [];
      const sortedHistory = updateHistory
        .sort(
          (a: any, b: any) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 20); // Last 20 updates

      res.json({
        success: true,
        data: {
          formTitle: form.title,
          updates: sortedHistory.map((update: any) => ({
            id: update._id || update.timestamp,
            prompt: update.prompt,
            summary: update.summary,
            timestamp: update.timestamp,
            model: update.model || GROQ_MODEL,
          })),
          totalUpdates: updateHistory.length,
        },
      });
    } catch (error: any) {
      console.error('Error fetching update history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch update history',
      });
    }
  }
);

// @desc    Get suggestions for form update prompts
// @route   POST /api/ai/update-suggestions
// @access  Private
export const getUpdateSuggestions = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { currentForm, category } = req.body;

      if (!currentForm) {
        return res.status(400).json({
          success: false,
          message: 'Current form data is required',
        });
      }

      // Analyze current form structure
      const fieldCount =
        currentForm.pages?.reduce(
          (total: number, page: any) => total + (page.fields?.length || 0),
          0
        ) || 0;

      const fieldTypes = new Set();
      currentForm.pages?.forEach((page: any) => {
        page.fields?.forEach((field: any) => {
          fieldTypes.add(field.type);
        });
      });

      // Generate contextual suggestions based on form analysis
      const suggestions = {
        addFields: [
          fieldTypes.has('email')
            ? null
            : 'Add an email field for contact information',
          fieldTypes.has('phone') ? null : 'Add a phone number field',
          fieldTypes.has('signature')
            ? null
            : 'Add a signature field for agreement',
          fieldTypes.has('fileUpload')
            ? null
            : 'Add a file upload field for documents',
          'Add a new section heading to organize fields',
        ].filter(Boolean),

        modifyFields: [
          'Change the form title to be more descriptive',
          'Make the email field required',
          'Update field labels for better clarity',
          'Modify dropdown options to include more choices',
          'Change help text for better user guidance',
        ],

        structuralChanges: [
          fieldCount > 8 ? 'Split the form into multiple pages' : null,
          'Reorder fields for better user flow',
          'Group related fields together',
          'Remove unnecessary optional fields',
          'Add a thank you message customization',
        ].filter(Boolean),
      };

      res.json({
        success: true,
        data: {
          suggestions,
          formAnalysis: {
            fieldCount,
            fieldTypes: Array.from(fieldTypes),
            pageCount: currentForm.pages?.length || 0,
            hasLogo: !!currentForm.logo,
          },
        },
      });
    } catch (error: any) {
      console.error('Error generating update suggestions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate suggestions',
      });
    }
  }
);

// @desc    Get predefined default suggestions by category
// @route   GET /api/ai/suggestions/defaults/:category
// @access  Private
export const getDefaultSuggestions = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { category } = req.params;

      const validCategories = [
        'quiz',
        'survey',
        'feedback',
        'application',
        'contact',
        'general',
      ];

      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid category. Must be one of: ' + validCategories.join(', '),
        });
      }

      const suggestions = suggestionService.getDefaultSuggestions(
        category as
          | 'quiz'
          | 'survey'
          | 'feedback'
          | 'application'
          | 'contact'
          | 'general'
      );

      // Ensure default suggestions are quote-free and form-focused
      const cleanedSuggestions = suggestions
        .map(suggestion => removeAllQuotes(suggestion))
        .filter(suggestion => {
          const validation = validateFormContentHelper(suggestion);
          return validation.isValid;
        });

      res.json({
        success: true,
        data: {
          suggestions: cleanedSuggestions,
          category,
          isQuoteFree: true,
          isFormFocused: true,
        },
      });
    } catch (error: any) {
      console.error('Default suggestions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get default suggestions',
      });
    }
  }
);

// @desc    Validate if text content is suitable for form generation
// @route   POST /api/ai/validate-form-content
// @access  Private
export const validateFormContent = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { text } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Text is required and must be a string',
        });
      }

      const validation = validateFormContentHelper(text);

      res.json({
        success: true,
        data: {
          isValid: validation.isValid,
          confidence: validation.confidence,
          reason: validation.reason,
          isFormRelated: validation.confidence >= 30,
          recommendedAction: validation.isValid
            ? 'Content is suitable for form generation'
            : 'Please provide form-related content (surveys, applications, feedback forms, etc.)',
        },
      });
    } catch (error: any) {
      console.error('Content validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate content',
      });
    }
  }
);

// @desc    Get AI form generation statistics for the authenticated user
// @route   GET /api/ai/stats
// @access  Private
export const getAIStats = asyncHandler(async (req: Request, res: Response) => {
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
          avgContentConfidence: {
            $avg: {
              $cond: [
                '$isAIGenerated',
                '$aiGenerationMetadata.contentConfidence',
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
      avgContentConfidence: 0,
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
      formFocusScore: result.avgContentConfidence || 0,
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

// @desc    Get recently generated AI forms with metadata
// @route   GET /api/ai/recent-forms
// @access  Private
export const getRecentAIForms = asyncHandler(
  async (req: Request, res: Response) => {
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

        contentConfidence: form.aiGenerationMetadata?.contentConfidence || 0,
        isFormFocused:
          (form.aiGenerationMetadata?.contentConfidence || 0) >= 50,
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
  }
);

// @desc    Regenerate logo for an existing form using AI
// @route   POST /api/ai/regenerate-logo/:formId
// @access  Private
export const regenerateFormLogo = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { formId } = req.params;
      const userId = req.user.id;

      if (!mongoose.Types.ObjectId.isValid(formId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid form ID format',
        });
      }

      const form = await Form.findOne({ _id: formId, userId });
      if (!form) {
        return res.status(404).json({
          success: false,
          message: 'Form not found',
        });
      }

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

      const updatedForm = await Form.findByIdAndUpdate(
        formId,
        {
          logo: {
            src: logoResult.logoUrl,
            type: 'url',
            alignment: 'CENTER',
            size: 100,
            publicId: logoResult.publicId || null,
          },
          'settings.showLogo': true,
          updatedAt: new Date(),
        },
        { new: true }
      );

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
  }
);

// @desc    Get AI-powered logo suggestions based on form type/title
// @route   POST /api/ai/logo-suggestions
// @access  Private
export const getLogoSuggestions = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { formType, title } = req.body;

      if (!formType && !title) {
        return res.status(400).json({
          success: false,
          message: 'Form type or title is required',
        });
      }

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
  }
);
