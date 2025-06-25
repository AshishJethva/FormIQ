import express from 'express';
import { protect } from '../middleware/protect';
import {
  evaluateSubmission,
  evaluateSubmissionsBatch,
  getEvaluationCapabilities,
  getEvaluationStats,
} from '../controllers/aiEvaluationController';

const router = express.Router();

// @route   POST /api/ai-evaluation/evaluate/:submissionId
// @desc    Evaluate a single form submission using AI with comprehensive analysis
// @access  Private (requires authentication)
router.post('/evaluate/:submissionId', protect, evaluateSubmission);

// @route   POST /api/ai-evaluation/evaluate-batch
// @desc    Evaluate multiple form submissions in batch (max 20 submissions)
// @access  Private (requires authentication)
router.post('/evaluate-batch', protect, evaluateSubmissionsBatch);

// @route   GET /api/ai-evaluation/capabilities
// @desc    Get AI evaluation service capabilities and supported features
// @access  Private
router.get('/capabilities', protect, getEvaluationCapabilities);

// @route   GET /api/ai-evaluation/stats/:formId
// @desc    Get evaluation statistics and analysis for a specific form
// @access  Private (requires form ownership)
router.get('/stats/:formId', protect, getEvaluationStats);

export default router;
