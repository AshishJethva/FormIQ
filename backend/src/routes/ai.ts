// Backend: src/routes/ai.ts

import express from 'express';
import Form from '../models/Form';
import { protect } from '../middleware/protect';
import { asyncHandler } from '../utils/asyncHandler';
import mongoose from 'mongoose';
import { aiGenerationLimiter } from '../middleware/aiRateLimit';
import AIFormGeneratorService from '../services/aiFormGeneratorService';
import { AIPromptValidator } from '../utils/aiPromptValidator';
import AISuggestionService from '../services/aiSuggestionService';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Initialize AI service
const aiService = new AIFormGeneratorService();
const suggestionService = new AISuggestionService();

// Enhanced quote removal function for API level
const removeAllQuotes = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/["""''`′″‚„‛‟‹›«»]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Form-specific content validation
const validateFormContent = (
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

  // Check for form-related keywords
  const keywordCount = formKeywords.filter(keyword =>
    lowerText.includes(keyword)
  ).length;
  const hasFormPatterns = formPatterns.some(pattern => pattern.test(lowerText));

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

      // Validate form content
      const contentValidation = validateFormContent(prompt);
      if (!contentValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: `Please provide a form-related description. ${contentValidation.reason || 'The content should focus on creating forms, surveys, questionnaires, or data collection interfaces.'}`,
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
            aiModel: 'gemini-2.0-flash-lite',
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
          break; // Success, exit retry loop
        } catch (saveError: any) {
          attempts++;

          if (saveError.code === 11000 || saveError.message.includes('title')) {
            // Duplicate title error, try again with modified name
            if (attempts >= maxAttempts) {
              // Final attempt with timestamp
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
                aiModel: 'gemini-2.0-flash-lite',
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
            continue; // Try again with incremented name
          } else {
            // Different error, don't retry
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

          // Name change tracking
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
  })
);

router.post(
  '/suggestions',
  protect,
  suggestionLimiter,
  asyncHandler(async (req, res) => {
    try {
      const { text, cursorPosition, context, maxLength, suggestionType } =
        req.body;

      // Validate form content first
      const contentValidation = validateFormContent(text);
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

      // Enhanced quote removal and form validation
      const cleanedSuggestions = result.suggestions
        .map(suggestion => removeAllQuotes(suggestion))
        .filter(suggestion => {
          if (suggestion.length === 0) return false;

          // Additional form relevance check
          const suggestionValidation = validateFormContent(suggestion);
          return suggestionValidation.confidence >= 20; // Lower threshold for suggestions
        })
        .filter(suggestion => suggestion.length > 0);

      // Log progressive suggestion info
      if (suggestionType === 'progressive') {
        console.log('🎯 Form-focused progressive suggestion generated:');
        console.log('Original text:', text.substring(0, 50) + '...');
        console.log('Suggestion:', cleanedSuggestions[0]);
        console.log(
          'Word count:',
          cleanedSuggestions[0]?.split(' ').length || 0
        );
        console.log('Character count:', cleanedSuggestions[0]?.length || 0);
        console.log(
          'Contains quotes:',
          /["'`]/.test(cleanedSuggestions[0] || '')
        );
        console.log('Content confidence:', contentValidation.confidence);
        console.log('Form type detected:', result.formType || 'general');
      }

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
  })
);

router.get(
  '/suggestions/defaults/:category',
  protect,
  asyncHandler(async (req, res) => {
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
          const validation = validateFormContent(suggestion);
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
  })
);

// New endpoint for form type detection and validation
router.post(
  '/validate-form-content',
  protect,
  asyncHandler(async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Text is required and must be a string',
        });
      }

      const validation = validateFormContent(text);

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

      contentConfidence: form.aiGenerationMetadata?.contentConfidence || 0,
      isFormFocused: (form.aiGenerationMetadata?.contentConfidence || 0) >= 50,
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
