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
  updateFormWithAI,
  validateUpdatePrompt,
  getFormUpdateHistory,
  getUpdateSuggestions,
  undoAIFormUpdate,
  getFormSnapshots,
  clearAIUpdateHistory,
  restoreToSnapshot,
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

// @route   POST /api/ai/update-form
// @desc    Update an existing form using AI based on user prompt
// @access  Private (requires authentication + rate limiting)
router.post('/update-form', protect, aiGenerationLimiter, updateFormWithAI);

// @route   POST /api/ai/validate-update-prompt
// @desc    Validate if prompt is suitable for form updates
// @access  Private
router.post('/validate-update-prompt', protect, validateUpdatePrompt);

// @route   GET /api/ai/update-history/:formId
// @desc    Get AI form update history for a specific form
// @access  Private
router.get('/update-history/:formId', protect, getFormUpdateHistory);

// @route   POST /api/ai/update-suggestions
// @desc    Get contextual suggestions for form updates based on current form
// @access  Private
router.post('/update-suggestions', protect, getUpdateSuggestions);

// @route   POST /api/ai/undo/:formId
// @desc    Undo last AI update for a form
// @access  Private
router.post('/undo/:formId', protect, undoAIFormUpdate);

// @route   GET /api/ai/form-snapshots/:formId
// @desc    Get form snapshots and history for undo/redo functionality
// @access  Private
router.get('/form-snapshots/:formId', protect, getFormSnapshots);

// @route   DELETE /api/ai/clear-history/:formId
// @desc    Clear all AI update history for a form
// @access  Private
router.delete('/clear-history/:formId', protect, clearAIUpdateHistory);

// @route   POST /api/ai/restore-snapshot/:formId
// @desc    Restore form to a specific snapshot
// @access  Private
router.post('/restore-snapshot/:formId', protect, restoreToSnapshot);

export default router;
