// backend/src/controllers/formHistoryController.ts

import { Request, Response } from 'express';
import { MongoFormHistoryService } from '../services/mongoFormHistoryService';
import { asyncHandler } from '../utils/asyncHandler';
import mongoose from 'mongoose';
import Form from '../models/Form';

// Helper function to convert Mongoose document to plain object
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

// @desc    Create a new form history snapshot
// @route   POST /api/forms/:formId/history
// @access  Private
export const createFormSnapshot = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { formId } = req.params;
      const userId = req.user.id;
      const { changeType, updatePrompt, updateSummary, formData } = req.body;

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

      // Convert form to plain object
      const formForSnapshot = formData || convertFormToPlainObject(form);

      // Create snapshot
      const result = await MongoFormHistoryService.createSnapshot(
        formId,
        userId,
        formForSnapshot,
        {
          changeType: changeType || 'manual_edit',
          updatePrompt,
          updateSummary,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          sessionId:
            (req as any).sessionID ||
            req.headers['x-session-id'] ||
            'no-session',
        }
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: result.error || 'Failed to create snapshot',
        });
      }

      res.status(201).json({
        success: true,
        message: 'Form snapshot created successfully',
        data: {
          snapshotId: result.data!._id,
          snapshotIndex: result.data!.snapshotIndex,
          changeType: result.data!.metadata.changeType,
          createdAt: result.data!.createdAt,
        },
      });
    } catch (error: any) {
      console.error('❌ Create snapshot failed:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while creating snapshot',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

// @desc    Get form history
// @route   GET /api/forms/:formId/history
// @access  Private
export const getFormHistory = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { formId } = req.params;
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 50;

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
          message: 'Form not found',
        });
      }

      // Get history
      const historyResult = await MongoFormHistoryService.getFormHistory(
        formId,
        userId,
        limit
      );

      if (!historyResult.success) {
        return res.status(500).json({
          success: false,
          message: historyResult.error || 'Failed to fetch history',
        });
      }

      // Get stats
      const statsResult = await MongoFormHistoryService.getHistoryStats(
        formId,
        userId
      );

      const snapshots = historyResult.data!.map((snapshot: any) => ({
        id: snapshot._id,
        snapshotIndex: snapshot.snapshotIndex,
        changeType: snapshot.metadata.changeType,
        updatePrompt: snapshot.metadata.updatePrompt,
        updateSummary: snapshot.metadata.updateSummary,
        aiModel: snapshot.metadata.aiModel,
        timestamp: snapshot.createdAt,
        age: Date.now() - new Date(snapshot.createdAt).getTime(),
      }));

      res.json({
        success: true,
        data: {
          formTitle: form.title,
          snapshots,
          stats: statsResult.data || {
            totalSnapshots: 0,
            currentIndex: -1,
            currentPosition: 0,
            canUndo: false,
            canRedo: false,
          },
          pagination: {
            limit,
            count: snapshots.length,
            hasMore: snapshots.length === limit,
          },
        },
      });
    } catch (error: any) {
      console.error('❌ Get history failed:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching history',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

// @desc    Undo form to previous snapshot
// @route   POST /api/forms/:formId/history/undo
// @access  Private
export const undoFormToSnapshot = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { formId } = req.params;
      const userId = req.user.id;
      const { targetIndex } = req.body;

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
          message: 'Form not found',
        });
      }

      // Perform undo
      const undoResult = await MongoFormHistoryService.undoToSnapshot(
        formId,
        userId,
        targetIndex
      );

      if (!undoResult.success) {
        return res.status(400).json({
          success: false,
          message: undoResult.error || 'Failed to undo',
        });
      }

      const targetSnapshot = undoResult.data!.snapshot;

      // Update the form with snapshot data (DON'T create new snapshot for undo)
      const updateData = {
        title: targetSnapshot.snapshotData.title,
        description: targetSnapshot.snapshotData.description,
        pages: targetSnapshot.snapshotData.pages,
        settings: targetSnapshot.snapshotData.settings,
        logo: targetSnapshot.snapshotData.logo,
        selectedPageId: targetSnapshot.snapshotData.selectedPageId,
        currentPageIndex: targetSnapshot.snapshotData.currentPageIndex,
        selectedFieldId: null, // Clear selection
        propertiesPanelOpen: false,
        updatedAt: new Date(),
        lastSaved: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      const updatedForm = await Form.findByIdAndUpdate(formId, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updatedForm) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update form with snapshot data',
        });
      }

      // Convert updated form to response format
      const responseData = convertFormToPlainObject(updatedForm);

      res.json({
        success: true,
        message: 'Form successfully undone to previous state',
        data: {
          ...responseData,
          selectedFieldId: null,
          propertiesPanelOpen: false,
          undoDetails: {
            newPosition: undoResult.data!.newPosition,
            canUndo: undoResult.data!.canUndo,
            canRedo: undoResult.data!.canRedo,
            changeType: targetSnapshot.metadata.changeType,
            originalSummary: targetSnapshot.metadata.updateSummary,
          },
        },
      });
    } catch (error: any) {
      console.error('❌ Undo operation failed:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during undo operation',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

// @desc    Redo form to next snapshot
// @route   POST /api/forms/:formId/history/redo
// @access  Private
export const redoFormToSnapshot = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { formId } = req.params;
      const userId = req.user.id;
      const { targetIndex } = req.body;

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
          message: 'Form not found',
        });
      }

      // Perform redo
      const redoResult = await MongoFormHistoryService.redoToSnapshot(
        formId,
        userId,
        targetIndex
      );

      if (!redoResult.success) {
        return res.status(400).json({
          success: false,
          message: redoResult.error || 'Failed to redo',
        });
      }

      const targetSnapshot = redoResult.data!.snapshot;

      // Update the form with snapshot data (DON'T create new snapshot for redo)
      const updateData = {
        title: targetSnapshot.snapshotData.title,
        description: targetSnapshot.snapshotData.description,
        pages: targetSnapshot.snapshotData.pages,
        settings: targetSnapshot.snapshotData.settings,
        logo: targetSnapshot.snapshotData.logo,
        selectedPageId: targetSnapshot.snapshotData.selectedPageId,
        currentPageIndex: targetSnapshot.snapshotData.currentPageIndex,
        selectedFieldId: null,
        propertiesPanelOpen: false,
        updatedAt: new Date(),
        lastSaved: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      const updatedForm = await Form.findByIdAndUpdate(formId, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updatedForm) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update form with snapshot data',
        });
      }

      // Convert updated form to response format
      const responseData = convertFormToPlainObject(updatedForm);

      res.json({
        success: true,
        message: 'Form successfully redone to next state',
        data: {
          ...responseData,
          selectedFieldId: null,
          propertiesPanelOpen: false,
          redoDetails: {
            newPosition: redoResult.data!.newPosition,
            canUndo: redoResult.data!.canUndo,
            canRedo: redoResult.data!.canRedo,
            changeType: targetSnapshot.metadata.changeType,
            originalSummary: targetSnapshot.metadata.updateSummary,
          },
        },
      });
    } catch (error: any) {
      console.error('❌ Redo operation failed:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during redo operation',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

// @desc    Restore form to specific snapshot
// @route   POST /api/forms/:formId/history/restore/:snapshotId
// @access  Private
export const restoreFormToSnapshot = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { formId, snapshotId } = req.params;
      const userId = req.user.id;

      if (
        !mongoose.Types.ObjectId.isValid(formId) ||
        !mongoose.Types.ObjectId.isValid(snapshotId)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid form ID or snapshot ID format',
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
          message: 'Form not found',
        });
      }

      // Get the snapshot
      const restoreResult = await MongoFormHistoryService.restoreToSnapshot(
        formId,
        userId,
        snapshotId
      );

      if (!restoreResult.success) {
        return res.status(404).json({
          success: false,
          message: restoreResult.error || 'Snapshot not found',
        });
      }

      const snapshot = restoreResult.data!;

      // Update the form with snapshot data
      const updateData = {
        title: snapshot.snapshotData.title,
        description: snapshot.snapshotData.description,
        pages: snapshot.snapshotData.pages,
        settings: snapshot.snapshotData.settings,
        logo: snapshot.snapshotData.logo,
        selectedPageId: snapshot.snapshotData.selectedPageId,
        currentPageIndex: snapshot.snapshotData.currentPageIndex,
        selectedFieldId: null,
        propertiesPanelOpen: false,
        updatedAt: new Date(),
        lastSaved: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      const updatedForm = await Form.findByIdAndUpdate(formId, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updatedForm) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update form with snapshot data',
        });
      }

      // Create a new snapshot for the restore operation
      const restoredFormData = convertFormToPlainObject(updatedForm);
      await MongoFormHistoryService.createSnapshot(
        formId,
        userId,
        restoredFormData,
        {
          changeType: 'restore',
          updateSummary: `Restored to snapshot: ${
            snapshot.metadata.updateSummary || 'Manual restore'
          }`,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          sessionId: (req as any).sessionID || 'no-session',
        }
      );

      // Convert updated form to response format
      const responseData = convertFormToPlainObject(updatedForm);

      res.json({
        success: true,
        message: 'Form successfully restored to selected snapshot',
        data: {
          ...responseData,
          selectedFieldId: null,
          propertiesPanelOpen: false,
          restoredSnapshot: {
            id: snapshot._id,
            index: snapshot.snapshotIndex,
            changeType: snapshot.metadata.changeType,
            originalSummary: snapshot.metadata.updateSummary,
            timestamp: snapshot.createdAt,
          },
        },
      });
    } catch (error: any) {
      console.error('❌ Restore operation failed:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during restore operation',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

// @desc    Get form history statistics
// @route   GET /api/forms/:formId/history/stats
// @access  Private
export const getFormHistoryStats = asyncHandler(
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
          message: 'Form not found',
        });
      }

      // Get statistics
      const statsResult = await MongoFormHistoryService.getHistoryStats(
        formId,
        userId
      );

      if (!statsResult.success) {
        return res.status(500).json({
          success: false,
          message: statsResult.error || 'Failed to fetch statistics',
        });
      }

      res.json({
        success: true,
        data: {
          formId,
          formTitle: form.title,
          ...statsResult.data,
        },
      });
    } catch (error: any) {
      console.error('❌ Get stats failed:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching statistics',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

// @desc    Clear form history
// @route   DELETE /api/forms/:formId/history
// @access  Private
export const clearFormHistory = asyncHandler(
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
          message: 'Form not found',
        });
      }

      // Clear history
      const clearResult = await MongoFormHistoryService.clearFormHistory(
        formId,
        userId
      );

      if (!clearResult.success) {
        return res.status(500).json({
          success: false,
          message: clearResult.error || 'Failed to clear history',
        });
      }

      res.json({
        success: true,
        message: 'Form history cleared successfully',
        data: {
          formId,
          deletedSnapshots: clearResult.data!.deletedCount,
        },
      });
    } catch (error: any) {
      console.error('❌ Clear history failed:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while clearing history',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

// @desc    Get user's history analytics
// @route   GET /api/users/history/analytics
// @access  Private
export const getUserHistoryAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const days = parseInt(req.query.days as string) || 30;

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      // Get analytics
      const analyticsResult = await MongoFormHistoryService.getHistoryAnalytics(
        userId,
        { start: startDate, end: endDate }
      );

      if (!analyticsResult.success) {
        return res.status(500).json({
          success: false,
          message: analyticsResult.error || 'Failed to fetch analytics',
        });
      }

      res.json({
        success: true,
        data: {
          timeRange: {
            start: startDate,
            end: endDate,
            days,
          },
          ...analyticsResult.data,
        },
      });
    } catch (error: any) {
      console.error('❌ Get analytics failed:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching analytics',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

export default {
  createFormSnapshot,
  getFormHistory,
  undoFormToSnapshot,
  redoFormToSnapshot,
  restoreFormToSnapshot,
  getFormHistoryStats,
  clearFormHistory,
  getUserHistoryAnalytics,
};
