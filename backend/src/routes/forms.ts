// src/routes/forms.ts

import express from 'express';
import { protect } from '../middleware/protect';
import { validate } from '../middleware/validation';
import {
  createFormSchema,
  updateFormSchema,
} from '../validation/formValidation';
import {
  getPublicForm,
  getAllForms,
  getFormById,
  createForm,
  updateForm,
  deleteForm,
  duplicateForm,
  renameForm,
  toggleFormFavorite,
  archiveForm,
  trashForm,
  restoreForm,
  publishForm,
  bulkUpdateForms,
  bulkAddLabel,
  bulkRemoveLabel,
  cleanupTrashedForms,
  getTrashStats,
  deleteAllFormSubmissions,
} from '../controllers/formController';
import {
  createFormSnapshot,
  getFormHistory,
  undoFormToSnapshot,
  redoFormToSnapshot,
  restoreFormToSnapshot,
  getFormHistoryStats,
  clearFormHistory,
} from '../controllers/formHistoryController';
const router = express.Router();

// Public routes
router.get('/public/:formId', getPublicForm);

// Protected routes - Basic form operations
router.get('/', protect, getAllForms);
router.get('/:id', protect, getFormById);
router.post('/', protect, validate(createFormSchema), createForm);
router.put('/:id', protect, validate(updateFormSchema), updateForm);
router.delete('/:id', protect, deleteForm);
router.post('/:id/duplicate', protect, duplicateForm);

// Protected routes - Form state management
router.patch('/:id/rename', protect, renameForm);
router.patch('/:id/favorite', protect, toggleFormFavorite);
router.patch('/:id/archive', protect, archiveForm);
router.patch('/:id/trash', protect, trashForm);
router.patch('/:id/restore', protect, restoreForm);
router.patch('/:id/publish', protect, publishForm);

// Protected routes - Bulk operations
router.patch('/bulk', protect, bulkUpdateForms);
router.patch('/bulk/add-label', protect, bulkAddLabel);
router.patch('/bulk/remove-label', protect, bulkRemoveLabel);

// Protected routes - Trash management
router.delete('/cleanup-trash', protect, cleanupTrashedForms);
router.get('/trash-stats', protect, getTrashStats);

// Protected routes - Submission management
router.delete('/form/:formId/all', protect, deleteAllFormSubmissions);

// Form history routes
router.post('/:formId/history', protect, createFormSnapshot);
router.get('/:formId/history', protect, getFormHistory);
router.post('/:formId/history/undo', protect, undoFormToSnapshot);
router.post('/:formId/history/redo', protect, redoFormToSnapshot);
router.post(
  '/:formId/history/restore/:snapshotId',
  protect,
  restoreFormToSnapshot
);
router.get('/:formId/history/stats', protect, getFormHistoryStats);
router.delete('/:formId/history', protect, clearFormHistory);

export default router;
