// src/routes/aiEvaluation.ts
import express from 'express';
import { AIEvaluationService } from '../services/aiEvaluationService';
import Form from '../models/Form';
import Submission from '../models/Submission';
import { protect } from '../middleware/protect';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiBasicError';
import mongoose from 'mongoose';

const router = express.Router();
const aiEvaluationService = new AIEvaluationService();

// Enhanced form validation with comprehensive checks
const validateFormForEvaluation = (
  form: any
): { isValid: boolean; error?: string } => {
  try {
    if (!form) {
      return { isValid: false, error: 'Form not found' };
    }

    if (!form.pages || !Array.isArray(form.pages) || form.pages.length === 0) {
      return { isValid: false, error: 'Form has no pages to evaluate' };
    }

    let hasEvaluableFields = false;
    let totalFields = 0;

    form.pages.forEach((page: any) => {
      if (page?.fields && Array.isArray(page.fields)) {
        page.fields.forEach((field: any) => {
          if (field?.type && field?.id) {
            totalFields++;
            if (field.type !== 'heading' && field.type !== 'image') {
              hasEvaluableFields = true;
            }
          }
        });
      }
    });

    if (totalFields === 0) {
      return { isValid: false, error: 'Form has no fields defined' };
    }

    if (!hasEvaluableFields) {
      return {
        isValid: false,
        error: 'Form has no evaluable fields (only headings/images found)',
      };
    }

    console.log(' Form validation passed:', {
      pagesCount: form.pages.length,
      totalFields,
      hasEvaluableFields,
    });

    return { isValid: true };
  } catch (error: any) {
    console.error('❌ Form validation error:', error);
    return {
      isValid: false,
      error: `Form validation failed: ${error.message}`,
    };
  }
};

// Enhanced submission validation with detailed checks
const validateSubmissionForEvaluation = (
  submission: any
): { isValid: boolean; error?: string } => {
  try {
    if (!submission) {
      return { isValid: false, error: 'Submission not found' };
    }

    if (!submission.data || typeof submission.data !== 'object') {
      return { isValid: false, error: 'Submission has no data to evaluate' };
    }

    const fieldCount = Object.keys(submission.data).length;
    const hasValidContent = Object.values(submission.data).some(value => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'object' && value !== null) return true;
      return value !== null && value !== undefined;
    });

    if (fieldCount === 0) {
      return { isValid: false, error: 'Submission data is empty' };
    }

    if (!hasValidContent) {
      return {
        isValid: false,
        error: 'Submission has no valid content to evaluate',
      };
    }

    console.log(' Submission validation passed:', {
      fieldCount,
      hasValidContent,
      sampleFields: Object.keys(submission.data).slice(0, 3),
    });

    return { isValid: true };
  } catch (error: any) {
    console.error('❌ Submission validation error:', error);
    return {
      isValid: false,
      error: `Submission validation failed: ${error.message}`,
    };
  }
};

// @desc    Evaluate a single submission with enhanced error handling
// @route   POST /api/ai-evaluation/evaluate/:submissionId
// @access  Private
router.post(
  '/evaluate/:submissionId',
  protect,
  asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    const startTime = Date.now();

    console.log(
      '🤖 Starting enhanced AI evaluation for submission:',
      submissionId
    );

    try {
      // Step 1: Validate submission ID format
      if (!mongoose.Types.ObjectId.isValid(submissionId)) {
        throw new ApiError('Invalid submission ID format', 400);
      }

      // Step 2: Get submission with error handling
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        throw new ApiError('Submission not found', 404);
      }

      console.log('📋 Found submission:', {
        submissionId,
        formId: submission.formId,
        dataFields: Object.keys(submission.data || {}).length,
        hasFiles: !!(submission.files && submission.files.length > 0),
        submittedAt: submission.submittedAt,
      });

      // Step 3: Validate submission data
      const submissionValidation = validateSubmissionForEvaluation(submission);
      if (!submissionValidation.isValid) {
        throw new ApiError(submissionValidation.error!, 400);
      }

      // Step 4: Get form structure with validation
      const form = await Form.findById(submission.formId);
      if (!form) {
        throw new ApiError('Form not found for this submission', 404);
      }

      console.log('📋 Found form:', {
        formId: form._id,
        title: form.title,
        pagesCount: form.pages?.length || 0,
        totalFields:
          form.pages?.reduce(
            (sum, page) => sum + (page.fields?.length || 0),
            0
          ) || 0,
      });

      // Step 5: Validate form structure
      const formValidation = validateFormForEvaluation(form);
      if (!formValidation.isValid) {
        throw new ApiError(formValidation.error!, 400);
      }

      // Step 6: Verify user has access to this form
      if (form.userId.toString() !== req.user.id) {
        throw new ApiError('Not authorized to evaluate this submission', 403);
      }

      console.log(' All validations passed, starting AI evaluation');

      // Step 7: Perform enhanced AI evaluation with error recovery
      let evaluation;
      try {
        evaluation = await aiEvaluationService.evaluateSubmissionWithValidation(
          form.toObject(),
          submission.data,
          submissionId
        );
      } catch (evaluationError: any) {
        console.error('❌ AI evaluation service error:', evaluationError);

        // Create a failed evaluation result instead of throwing
        evaluation = {
          id: `eval_${submissionId}_${Date.now()}`,
          submissionId,
          formType: 'general' as const,
          sentiment: 'neutral' as const,
          categories: ['evaluation-failed'],
          evaluatedAt: new Date().toISOString(),
          status: 'failed' as const,
          feedback: `AI evaluation encountered an error: ${evaluationError.message}. This may be due to AI service limitations or temporary issues. Please try again later or contact support if the problem persists.`,
        };
      }

      const evaluationTime = Date.now() - startTime;

      console.log('🎉 AI evaluation completed:', {
        submissionId,
        formType: evaluation.formType,
        sentiment: evaluation.sentiment,
        status: evaluation.status,
        evaluationTime: `${evaluationTime}ms`,
        hasSpecificResults: !!(
          evaluation.quizResults ||
          evaluation.surveyResults ||
          evaluation.feedbackResults
        ),
      });

      // Step 8: Return evaluation results with detailed metadata
      res.json({
        success: true,
        data: evaluation,
        metadata: {
          evaluationTime,
          formId: form._id,
          formTitle: form.title,
          formType: evaluation.formType,
          evaluatedAt: evaluation.evaluatedAt,
          version: '2.2.0',
        },
      });
    } catch (error: any) {
      const evaluationTime = Date.now() - startTime;
      console.error('❌ Enhanced AI evaluation error:', {
        submissionId,
        error: error.message,
        evaluationTime: `${evaluationTime}ms`,
        stack: error.stack?.split('\n').slice(0, 3),
      });

      // Return appropriate error response
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          error: 'EVALUATION_ERROR',
          metadata: {
            evaluationTime,
            submissionId,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        res.status(500).json({
          success: false,
          message:
            'AI evaluation service temporarily unavailable. Please try again later.',
          error: 'SERVICE_ERROR',
          metadata: {
            evaluationTime,
            submissionId,
            timestamp: new Date().toISOString(),
          },
          ...(process.env.NODE_ENV === 'development' && {
            details: error.message,
          }),
        });
      }
    }
  })
);

// @desc    Batch evaluate multiple submissions with enhanced processing
// @route   POST /api/ai-evaluation/evaluate-batch
// @access  Private
router.post(
  '/evaluate-batch',
  protect,
  asyncHandler(async (req, res) => {
    const { formId, submissionIds } = req.body;
    const startTime = Date.now();

    console.log(' Starting enhanced batch AI evaluation:', {
      formId,
      submissionCount: submissionIds?.length || 0,
      userId: req.user.id,
    });

    try {
      // Step 1: Validate request parameters
      if (!formId || !submissionIds || !Array.isArray(submissionIds)) {
        throw new ApiError(
          'Invalid request parameters. formId and submissionIds array required.',
          400
        );
      }

      if (submissionIds.length === 0) {
        throw new ApiError('No submission IDs provided', 400);
      }

      if (submissionIds.length > 20) {
        throw new ApiError(
          'Maximum 20 submissions can be evaluated at once',
          400
        );
      }

      // Step 2: Validate form ID format
      if (!mongoose.Types.ObjectId.isValid(formId)) {
        throw new ApiError('Invalid form ID format', 400);
      }

      // Step 3: Validate all submission IDs
      const invalidIds = submissionIds.filter(
        id => !mongoose.Types.ObjectId.isValid(id)
      );
      if (invalidIds.length > 0) {
        throw new ApiError(
          `Invalid submission IDs: ${invalidIds.join(', ')}`,
          400
        );
      }

      // Step 4: Get and validate form
      const form = await Form.findById(formId);
      if (!form) {
        throw new ApiError('Form not found', 404);
      }

      const formValidation = validateFormForEvaluation(form);
      if (!formValidation.isValid) {
        throw new ApiError(formValidation.error!, 400);
      }

      // Step 5: Verify user has access to this form
      if (form.userId.toString() !== req.user.id) {
        throw new ApiError(
          'Not authorized to evaluate submissions for this form',
          403
        );
      }

      // Step 6: Get submissions and validate they belong to the form
      const submissions = await Submission.find({
        _id: { $in: submissionIds },
        formId: formId,
      });

      if (submissions.length !== submissionIds.length) {
        const foundIds = submissions.map(s => s._id.toString());
        const missingIds = submissionIds.filter(id => !foundIds.includes(id));
        throw new ApiError(
          `Submissions not found or don't belong to this form: ${missingIds.join(', ')}`,
          404
        );
      }

      console.log(' Batch validation passed, processing evaluations:', {
        formId,
        formTitle: form.title,
        submissionCount: submissions.length,
      });

      // Step 7: Process evaluations with enhanced error handling
      const evaluations = [];
      const errors = [];
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < submissions.length; i++) {
        const submission = submissions[i];
        const submissionStartTime = Date.now();

        try {
          console.log(
            `🔄 Processing submission ${i + 1}/${submissions.length}:`,
            {
              submissionId: submission._id,
              dataFieldCount: Object.keys(submission.data || {}).length,
            }
          );

          // Validate individual submission
          const submissionValidation =
            validateSubmissionForEvaluation(submission);
          if (!submissionValidation.isValid) {
            throw new Error(submissionValidation.error!);
          }

          // Perform evaluation with error recovery
          let evaluation;
          try {
            evaluation =
              await aiEvaluationService.evaluateSubmissionWithValidation(
                form.toObject(),
                submission.data,
                submission._id.toString()
              );
            successCount++;
          } catch (evaluationError: any) {
            console.error(
              `❌ AI evaluation failed for submission ${i + 1}:`,
              evaluationError.message
            );

            // Create failed evaluation instead of throwing
            evaluation = {
              id: `eval_${submission._id}_${Date.now()}`,
              submissionId: submission._id.toString(),
              formType: 'general' as const,
              sentiment: 'neutral' as const,
              categories: ['evaluation-failed'],
              evaluatedAt: new Date().toISOString(),
              status: 'failed' as const,
              feedback: `AI evaluation failed: ${evaluationError.message}`,
            };
            failureCount++;

            errors.push({
              submissionId: submission._id.toString(),
              error: evaluationError.message,
            });
          }

          const submissionTime = Date.now() - submissionStartTime;
          console.log(` Submission ${i + 1} processed:`, {
            submissionId: submission._id,
            status: evaluation.status,
            time: `${submissionTime}ms`,
          });

          evaluations.push(evaluation);
        } catch (error: any) {
          const submissionTime = Date.now() - submissionStartTime;
          console.error(`❌ Failed to process submission ${i + 1}:`, {
            submissionId: submission._id,
            error: error.message,
            time: `${submissionTime}ms`,
          });

          // Create failed evaluation record
          const failedEvaluation = {
            id: `eval_${submission._id}_failed_${Date.now()}`,
            submissionId: submission._id.toString(),
            formType: 'general' as const,
            sentiment: 'neutral' as const,
            categories: ['evaluation-failed'],
            evaluatedAt: new Date().toISOString(),
            status: 'failed' as const,
            feedback: `Processing failed: ${error.message}`,
          };

          evaluations.push(failedEvaluation);
          failureCount++;
          errors.push({
            submissionId: submission._id.toString(),
            error: error.message,
          });
        }

        // Add delay between evaluations to avoid overwhelming services
        if (i < submissions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      const totalTime = Date.now() - startTime;

      console.log('🎉 Enhanced batch evaluation completed:', {
        formId,
        totalSubmissions: submissions.length,
        successful: successCount,
        failed: failureCount,
        totalTime: `${totalTime}ms`,
        avgTimePerSubmission: `${Math.round(totalTime / submissions.length)}ms`,
      });

      // Step 8: Return results with detailed metadata
      res.json({
        success: true,
        data: evaluations,
        metadata: {
          totalEvaluations: evaluations.length,
          successful: successCount,
          failed: failureCount,
          totalTime,
          avgTimePerSubmission: Math.round(totalTime / submissions.length),
          formId,
          formTitle: form.title,
          processedAt: new Date().toISOString(),
          version: '2.2.0',
          errors: errors.length > 0 ? errors : undefined,
        },
      });
    } catch (error: any) {
      const totalTime = Date.now() - startTime;
      console.error('❌ Enhanced batch evaluation error:', {
        formId,
        submissionIds: submissionIds?.length || 0,
        error: error.message,
        totalTime: `${totalTime}ms`,
      });

      // Return appropriate error response
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          error: 'BATCH_EVALUATION_ERROR',
          metadata: {
            totalTime,
            formId,
            submissionCount: submissionIds?.length || 0,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Batch AI evaluation service temporarily unavailable',
          error: 'SERVICE_ERROR',
          metadata: {
            totalTime,
            formId,
            submissionCount: submissionIds?.length || 0,
            timestamp: new Date().toISOString(),
          },
          ...(process.env.NODE_ENV === 'development' && {
            details: error.message,
          }),
        });
      }
    }
  })
);

// @desc    Get evaluation capabilities and supported form types
// @route   GET /api/ai-evaluation/capabilities
// @access  Private
router.get(
  '/capabilities',
  protect,
  asyncHandler(async (req, res) => {
    try {
      const capabilities = aiEvaluationService.getEvaluationCapabilities();

      res.json({
        success: true,
        data: capabilities,
        metadata: {
          version: '2.2.0',
          enhanced: true,
          maxBatchSize: 20,
          supportedLanguages: ['en'],
          errorHandling: 'enhanced',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('❌ Error getting AI evaluation capabilities:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get evaluation capabilities',
        error: 'SERVICE_ERROR',
      });
    }
  })
);

// @desc    Get evaluation statistics for a form
// @route   GET /api/ai-evaluation/stats/:formId
// @access  Private
router.get(
  '/stats/:formId',
  protect,
  asyncHandler(async (req, res) => {
    const { formId } = req.params;

    try {
      if (!mongoose.Types.ObjectId.isValid(formId)) {
        throw new ApiError('Invalid form ID format', 400);
      }

      // Verify form access
      const form = await Form.findOne({ _id: formId, userId: req.user.id });
      if (!form) {
        throw new ApiError('Form not found or access denied', 404);
      }

      // Get submission statistics
      const totalSubmissions = await Submission.countDocuments({ formId });

      // Get form type detection info
      let detectedFormType = 'general';
      let canEvaluate = false;

      try {
        if (totalSubmissions > 0) {
          // Use the AI service to detect form type
          const sampleSubmission = await Submission.findOne({ formId }).lean();
          if (sampleSubmission) {
            // This would use the form type detection logic
            const aiService = new AIEvaluationService();
            // Note: You'd need to expose the detectFormType method or create a public version
            detectedFormType = 'quiz'; // Placeholder - you'd call the actual detection
            canEvaluate = ['quiz', 'survey', 'feedback'].includes(
              detectedFormType
            );
          }
        }
      } catch (detectionError) {
        console.warn('⚠️ Form type detection failed:', detectionError);
      }

      const stats = {
        totalSubmissions,
        formType: detectedFormType,
        evaluationCapable: canEvaluate,
        lastEvaluated: null, // Would come from evaluation records in a real implementation
        supportedFeatures: canEvaluate
          ? [
              'AI-powered analysis',
              'Sentiment detection',
              'Performance scoring',
              'Detailed explanations',
            ]
          : ['Basic data processing', 'Manual review recommended'],
      };

      res.json({
        success: true,
        data: stats,
        metadata: {
          formId,
          formTitle: form.title,
          generatedAt: new Date().toISOString(),
          version: '2.2.0',
        },
      });
    } catch (error: any) {
      console.error('❌ Error getting evaluation stats:', error);

      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          error: 'EVALUATION_ERROR',
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'AI evaluation service temporarily unavailable',
          error: 'SERVICE_ERROR',
          ...(process.env.NODE_ENV === 'development' && {
            details: error.message,
          }),
        });
      }
    }
  })
);

// @desc    Test AI evaluation with sample data
// @route   POST /api/ai-evaluation/test
// @access  Private (for development/testing)
router.post(
  '/test',
  protect,
  asyncHandler(async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      throw new ApiError('Test endpoint not available in production', 404);
    }

    const { formStructure, submissionData } = req.body;

    try {
      if (!formStructure || !submissionData) {
        throw new ApiError(
          'Both formStructure and submissionData are required for testing',
          400
        );
      }

      console.log('🧪 Testing AI evaluation with sample data');

      const testSubmissionId = 'test_' + Date.now();

      const evaluation =
        await aiEvaluationService.evaluateSubmissionWithValidation(
          formStructure,
          submissionData,
          testSubmissionId
        );

      res.json({
        success: true,
        data: evaluation,
        metadata: {
          testMode: true,
          submissionId: testSubmissionId,
          evaluatedAt: new Date().toISOString(),
          version: '2.2.0',
        },
      });
    } catch (error: any) {
      console.error('❌ Test evaluation failed:', error);

      res.status(500).json({
        success: false,
        message: 'Test evaluation failed',
        error: 'TEST_EVALUATION_ERROR',
        details: error.message,
      });
    }
  })
);

export default router;
