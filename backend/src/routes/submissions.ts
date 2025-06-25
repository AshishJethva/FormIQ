import express from 'express';
import { protect } from '../middleware/protect';
import {
  handleFormSubmissionError,
  monitorFormSubmissionPerformance,
} from '../middleware/debugMiddleware';
import {
  getAllSubmissions,
  getSubmissionById,
  submitForm,
  updateSubmissionStatus,
  markSubmissionAsRead,
  addSubmissionTag,
  removeSubmissionTag,
  deleteSubmission,
  deleteSubmissionFile,
  deleteSubmissionFieldFiles,
  bulkUpdateSubmissions,
  exportSubmissions,
  getSubmissionAnalytics,
  getExportStats,
  getExportPreview,
  getRecentSubmissions,
  searchSubmissions,
  validateExportRequest,
} from '../controllers/submissionController';

const router = express.Router();

// Public routes
router.post('/:formId/submit', monitorFormSubmissionPerformance, submitForm);

// Protected routes - Basic submission operations
router.get('/form/:formId', protect, getAllSubmissions);
router.get('/:id', protect, getSubmissionById);

// Protected routes - Submission management
router.patch('/:id/status', protect, updateSubmissionStatus);
router.patch('/:id/read', protect, markSubmissionAsRead);
router.post('/:id/tags', protect, addSubmissionTag);
router.delete('/:id/tags/:tag', protect, removeSubmissionTag);
router.delete('/:id', protect, deleteSubmission);

// Protected routes - File management
router.delete(
  '/:submissionId/files/:fieldId/:publicId',
  protect,
  deleteSubmissionFile
);
router.delete(
  '/:submissionId/files/:fieldId',
  protect,
  deleteSubmissionFieldFiles
);

// Protected routes - Bulk operations
router.patch('/bulk', protect, bulkUpdateSubmissions);

// Protected routes - Export functionality
router.post('/form/:formId/validate-export', protect, validateExportRequest);
router.get('/form/:formId/export', protect, exportSubmissions);
router.get('/form/:formId/export-stats', protect, getExportStats);
router.get('/form/:formId/export-preview', protect, getExportPreview);

// Protected routes - Analytics and reports
router.get('/form/:formId/analytics', protect, getSubmissionAnalytics);

// Protected routes - General queries
router.get('/recent', protect, getRecentSubmissions);
router.get('/search', protect, searchSubmissions);

// Error handling middleware
router.use(handleFormSubmissionError);

export default router;
