import express from 'express';
import { protect } from '../middleware/protect';
import { aiGenerationLimiter } from '../middleware/aiRateLimit';
import {
  generateForm,
  generateSuggestions,
  getDefaultSuggestions,
  validateFormContent,
  getAIStats,
  getRecentAIForms,
  regenerateFormLogo,
  getLogoSuggestions,
} from '../controllers/aiController';

const router = express.Router();

// @route   POST /api/ai/generate-form
// @desc    Generate a new form using AI based on user prompt
// @access  Private (requires authentication + rate limiting)
router.post('/generate-form', protect, aiGenerationLimiter, generateForm);

// @route   POST /api/ai/suggestions
// @desc    Generate AI-powered text suggestions for form creation
// @access  Private (requires authentication + rate limiting)
router.post('/suggestions', protect, generateSuggestions);

// @route   GET /api/ai/suggestions/defaults/:category
// @desc    Get predefined default suggestions by category
// @access  Private
router.get('/suggestions/defaults/:category', protect, getDefaultSuggestions);

// @route   POST /api/ai/validate-form-content
// @desc    Validate if text content is suitable for form generation
// @access  Private
router.post('/validate-form-content', protect, validateFormContent);

// @route   GET /api/ai/stats
// @desc    Get AI form generation statistics for the authenticated user
// @access  Private
router.get('/stats', protect, getAIStats);

// @route   GET /api/ai/recent-forms
// @desc    Get recently generated AI forms with metadata
// @access  Private
router.get('/recent-forms', protect, getRecentAIForms);

// @route   POST /api/ai/regenerate-logo/:formId
// @desc    Regenerate logo for an existing form using AI
// @access  Private
router.post('/regenerate-logo/:formId', protect, regenerateFormLogo);

// @route   POST /api/ai/logo-suggestions
// @desc    Get AI-powered logo suggestions based on form type/title
// @access  Private
router.post('/logo-suggestions', protect, getLogoSuggestions);

export default router;
