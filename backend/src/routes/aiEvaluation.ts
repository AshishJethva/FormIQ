// src/routes/aiEvaluation.ts
import express from 'express';
import { AIEvaluationService } from '../services/aiEvaluationService';
import Form from '../models/Form';
import Submission from '../models/Submission';
import { protect } from '../middleware/protect';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import mongoose from 'mongoose';

const router = express.Router();
const aiEvaluationService = new AIEvaluationService();

// Enhanced form validation before evaluation
const validateFormForEvaluation = (
  form: any
): { isValid: boolean; error?: string } => {
  if (!form) {
    return { isValid: false, error: 'Form not found' };
  }

  if (!form.pages || !Array.isArray(form.pages) || form.pages.length === 0) {
    return { isValid: false, error: 'Form has no pages to evaluate' };
  }

  let hasEvaluableFields = false;
  form.pages.forEach((page: any) => {
    if (page.fields && Array.isArray(page.fields)) {
      page.fields.forEach((field: any) => {
        if (field.type !== 'heading' && field.type !== 'image') {
          hasEvaluableFields = true;
        }
      });
    }
  });

  if (!hasEvaluableFields) {
    return { isValid: false, error: 'Form has no evaluable fields' };
  }

  return { isValid: true };
};

// Enhanced submission validation
const validateSubmissionForEvaluation = (
  submission: any
): { isValid: boolean; error?: string } => {
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

  if (fieldCount === 0 || !hasValidContent) {
    return {
      isValid: false,
      error: 'Submission has no valid content to evaluate',
    };
  }

  return { isValid: true };
};

// @desc    Evaluate a single submission with enhanced validation
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
      // Validate submission ID format
      if (!mongoose.Types.ObjectId.isValid(submissionId)) {
        throw new ApiError('Invalid submission ID format', 400);
      }

      // Get submission with populated form data
      const submission = await Submission.findById(submissionId);
      const submissionValidation = validateSubmissionForEvaluation(submission);

      if (!submissionValidation.isValid) {
        throw new ApiError(submissionValidation.error!, 400);
      }

      // Get form structure with validation
      const form = await Form.findById(submission!.formId);
      const formValidation = validateFormForEvaluation(form);

      if (!formValidation.isValid) {
        throw new ApiError(formValidation.error!, 400);
      }

      // Verify user has access to this form
      if (form!.userId.toString() !== req.user.id) {
        throw new ApiError('Not authorized to evaluate this submission', 403);
      }

      console.log('✅ Validation passed, starting AI evaluation:', {
        submissionId,
        formId: form!._id,
        formTitle: form!.title,
        dataFieldCount: Object.keys(submission!.data).length,
        userId: req.user.id,
      });

      // Perform enhanced AI evaluation
      const evaluation =
        await aiEvaluationService.evaluateSubmissionWithValidation(
          form!.toObject(),
          submission!.data,
          submissionId
        );

      const evaluationTime = Date.now() - startTime;

      console.log('🎉 Enhanced AI evaluation completed:', {
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

      // Return evaluation results
      res.json({
        success: true,
        data: evaluation,
        metadata: {
          evaluationTime,
          formId: form!._id,
          formTitle: form!.title,
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
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to get evaluation statistics',
          error: 'SERVICE_ERROR',
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

    console.log('🚀 Starting enhanced batch AI evaluation:', {
      formId,
      submissionCount: submissionIds?.length || 0,
      userId: req.user.id,
    });

    try {
      // Validate request parameters
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

      // Validate form ID format
      if (!mongoose.Types.ObjectId.isValid(formId)) {
        throw new ApiError('Invalid form ID format', 400);
      }

      // Validate all submission IDs
      const invalidIds = submissionIds.filter(
        id => !mongoose.Types.ObjectId.isValid(id)
      );
      if (invalidIds.length > 0) {
        throw new ApiError(
          `Invalid submission IDs: ${invalidIds.join(', ')}`,
          400
        );
      }

      // Get and validate form
      const form = await Form.findById(formId);
      const formValidation = validateFormForEvaluation(form);

      if (!formValidation.isValid) {
        throw new ApiError(formValidation.error!, 400);
      }

      // Verify user has access to this form
      if (form!.userId.toString() !== req.user.id) {
        throw new ApiError(
          'Not authorized to evaluate submissions for this form',
          403
        );
      }

      // Get submissions and validate they belong to the form
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

      console.log('✅ Batch validation passed, processing evaluations:', {
        formId,
        formTitle: form!.title,
        submissionCount: submissions.length,
        formType: 'TBD', // Will be determined during evaluation
      });

      // Process evaluations with error handling for individual submissions
      const evaluations = [];
      const errors = [];

      for (let i = 0; i < submissions.length; i++) {
        const submission = submissions[i];
        const submissionStartTime = Date.now();

        try {
          console.log(
            `🔄 Processing submission ${i + 1}/${submissions.length}:`,
            {
              submissionId: submission._id,
              dataFieldCount: Object.keys(submission.data).length,
            }
          );

          // Validate individual submission
          const submissionValidation =
            validateSubmissionForEvaluation(submission);
          if (!submissionValidation.isValid) {
            throw new Error(submissionValidation.error!);
          }

          // Perform evaluation
          const evaluation =
            await aiEvaluationService.evaluateSubmissionWithValidation(
              form!.toObject(),
              submission.data,
              submission._id.toString()
            );

          const submissionTime = Date.now() - submissionStartTime;
          console.log(`✅ Submission ${i + 1} evaluated successfully:`, {
            submissionId: submission._id,
            formType: evaluation.formType,
            status: evaluation.status,
            time: `${submissionTime}ms`,
          });

          evaluations.push(evaluation);
        } catch (error: any) {
          const submissionTime = Date.now() - submissionStartTime;
          console.error(`❌ Failed to evaluate submission ${i + 1}:`, {
            submissionId: submission._id,
            error: error.message,
            time: `${submissionTime}ms`,
          });

          // Create failed evaluation record
          const failedEvaluation = {
            id: `eval_${submission._id}`,
            submissionId: submission._id.toString(),
            formType: 'general' as const,
            sentiment: 'neutral' as const,
            categories: [],
            evaluatedAt: new Date().toISOString(),
            status: 'failed' as const,
            feedback: `Evaluation failed: ${error.message}`,
          };

          evaluations.push(failedEvaluation);
          errors.push({
            submissionId: submission._id.toString(),
            error: error.message,
          });
        }

        // Add small delay between evaluations to avoid overwhelming the AI service
        if (i < submissions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const totalTime = Date.now() - startTime;
      const successCount = evaluations.filter(
        e => e.status === 'completed'
      ).length;
      const failureCount = evaluations.length - successCount;

      console.log('🎉 Enhanced batch evaluation completed:', {
        formId,
        totalSubmissions: submissions.length,
        successful: successCount,
        failed: failureCount,
        totalTime: `${totalTime}ms`,
        avgTimePerSubmission: `${Math.round(totalTime / submissions.length)}ms`,
      });

      // Return results with detailed metadata
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
          formTitle: form!.title,
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
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Batch AI evaluation service temporarily unavailable',
          error: 'SERVICE_ERROR',
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
          version: '2.0.0',
          enhanced: true,
          maxBatchSize: 20,
          supportedLanguages: ['en'],
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

      // Note: In a real implementation, you'd store evaluation results in a separate collection
      // For now, we'll return basic stats
      const stats = {
        totalSubmissions,
        formType: 'TBD', // Would be determined from stored evaluations
        evaluationCapable: totalSubmissions > 0,
        lastEvaluated: null, // Would come from evaluation records
      };

      res.json({
        success: true,
        data: stats,
        metadata: {
          formId,
          formTitle: form.title,
          generatedAt: new Date().toISOString(),
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

export default router;
