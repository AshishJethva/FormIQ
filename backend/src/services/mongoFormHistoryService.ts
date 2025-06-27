// src/services/mongoFormHistoryService.ts

import FormHistorySnapshot, {
  IFormHistorySnapshot,
} from '../models/FormHistorySnapshot';
import mongoose from 'mongoose';

// Define Form interface if not imported from types
export interface Form {
  id?: string;
  _id?: string;
  title: string;
  description?: string;
  pages: any[];
  settings: any;
  logo?: any;
  selectedPageId?: string;
  currentPageIndex?: number;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HistoryServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class MongoFormHistoryService {
  // Create a new snapshot
  static async createSnapshot(
    formId: string,
    userId: string,
    formData: Form,
    metadata: {
      changeType: 'ai_update' | 'manual_edit' | 'initial_state' | 'restore';
      updatePrompt?: string;
      updateSummary?: string;
      userAgent?: string;
      ipAddress?: string;
      sessionId?: string;
    }
  ): Promise<HistoryServiceResponse<IFormHistorySnapshot>> {
    try {
      // Validate inputs
      if (!formId || !userId || !formData) {
        return {
          success: false,
          error: 'Missing required parameters: formId, userId, or formData',
        };
      }

      if (
        !mongoose.Types.ObjectId.isValid(formId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        return {
          success: false,
          error: 'Invalid formId or userId format',
        };
      }

      // Get current max index
      const lastSnapshot = await FormHistorySnapshot.getCurrentSnapshot(
        formId,
        userId
      );
      const newIndex = lastSnapshot ? lastSnapshot.snapshotIndex + 1 : 0;

      // Create snapshot
      const snapshot = new FormHistorySnapshot({
        formId: new mongoose.Types.ObjectId(formId),
        userId: new mongoose.Types.ObjectId(userId),
        snapshotData: {
          title: formData.title || 'Untitled Form',
          description: formData.description || '',
          pages: formData.pages || [],
          settings: formData.settings || {},
          logo: formData.logo || null,
          selectedPageId: formData.selectedPageId,
          currentPageIndex: formData.currentPageIndex || 0,
        },
        metadata: {
          changeType: metadata.changeType,
          updatePrompt: metadata.updatePrompt,
          updateSummary: metadata.updateSummary,
          aiModel: 'gemini-2.0-flash-lite',
          userAgent: metadata.userAgent,
          ipAddress: metadata.ipAddress,
          sessionId: metadata.sessionId,
        },
        snapshotIndex: newIndex,
        isActive: true,
      });

      const savedSnapshot = await snapshot.save();

      console.log(`✅ Created snapshot for form ${formId}, index: ${newIndex}`);

      return {
        success: true,
        data: savedSnapshot,
      };
    } catch (error: any) {
      console.error('❌ Error creating form snapshot:', error);
      return {
        success: false,
        error: error.message || 'Failed to create snapshot',
      };
    }
  }

  // Get form history
  static async getFormHistory(
    formId: string,
    userId: string,
    limit: number = 50
  ): Promise<HistoryServiceResponse<IFormHistorySnapshot[]>> {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(formId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        return {
          success: false,
          error: 'Invalid formId or userId format',
        };
      }

      const snapshots = await FormHistorySnapshot.getFormHistory(
        formId,
        userId,
        limit
      );

      console.log(
        `📋 Retrieved ${snapshots.length} snapshots for form ${formId}`
      );

      return {
        success: true,
        data: snapshots,
      };
    } catch (error: any) {
      console.error('❌ Error fetching form history:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch history',
      };
    }
  }

  // Undo to previous snapshot
  static async undoToSnapshot(
    formId: string,
    userId: string,
    targetIndex?: number
  ): Promise<
    HistoryServiceResponse<{ snapshot: IFormHistorySnapshot; newIndex: number }>
  > {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(formId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        return {
          success: false,
          error: 'Invalid formId or userId format',
        };
      }

      const currentSnapshot = await FormHistorySnapshot.getCurrentSnapshot(
        formId,
        userId
      );

      if (!currentSnapshot) {
        return {
          success: false,
          error: 'No current snapshot found',
        };
      }

      const undoToIndex =
        targetIndex !== undefined
          ? targetIndex
          : currentSnapshot.snapshotIndex - 1;

      if (undoToIndex < 0) {
        return {
          success: false,
          error: 'No previous snapshot to undo to',
        };
      }

      const targetSnapshot = await FormHistorySnapshot.getSnapshotAtIndex(
        formId,
        userId,
        undoToIndex
      );

      if (!targetSnapshot) {
        return {
          success: false,
          error: 'Target snapshot not found',
        };
      }

      console.log(
        `↶ Undo operation: form ${formId}, from index ${currentSnapshot.snapshotIndex} to ${undoToIndex}`
      );

      return {
        success: true,
        data: {
          snapshot: targetSnapshot,
          newIndex: undoToIndex,
        },
      };
    } catch (error: any) {
      console.error('❌ Error during undo operation:', error);
      return {
        success: false,
        error: error.message || 'Failed to undo',
      };
    }
  }

  // Redo to next snapshot
  static async redoToSnapshot(
    formId: string,
    userId: string,
    targetIndex?: number
  ): Promise<
    HistoryServiceResponse<{ snapshot: IFormHistorySnapshot; newIndex: number }>
  > {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(formId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        return {
          success: false,
          error: 'Invalid formId or userId format',
        };
      }

      const currentSnapshot = await FormHistorySnapshot.getCurrentSnapshot(
        formId,
        userId
      );

      if (!currentSnapshot) {
        return {
          success: false,
          error: 'No current snapshot found',
        };
      }

      const redoToIndex =
        targetIndex !== undefined
          ? targetIndex
          : currentSnapshot.snapshotIndex + 1;

      const targetSnapshot = await FormHistorySnapshot.getSnapshotAtIndex(
        formId,
        userId,
        redoToIndex
      );

      if (!targetSnapshot) {
        return {
          success: false,
          error: 'No future snapshot to redo to',
        };
      }

      console.log(
        `↷ Redo operation: form ${formId}, from index ${currentSnapshot.snapshotIndex} to ${redoToIndex}`
      );

      return {
        success: true,
        data: {
          snapshot: targetSnapshot,
          newIndex: redoToIndex,
        },
      };
    } catch (error: any) {
      console.error('❌ Error during redo operation:', error);
      return {
        success: false,
        error: error.message || 'Failed to redo',
      };
    }
  }

  // Get history statistics
  static async getHistoryStats(
    formId: string,
    userId: string
  ): Promise<
    HistoryServiceResponse<{
      totalSnapshots: number;
      aiUpdates: number;
      manualEdits: number;
      currentIndex: number;
      canUndo: boolean;
      canRedo: boolean;
      lastUpdate: Date;
    }>
  > {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(formId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        return {
          success: false,
          error: 'Invalid formId or userId format',
        };
      }

      const [stats, currentSnapshot, maxSnapshot] = await Promise.all([
        FormHistorySnapshot.getHistoryStats(formId, userId),
        FormHistorySnapshot.getCurrentSnapshot(formId, userId),
        FormHistorySnapshot.findOne({
          formId: new mongoose.Types.ObjectId(formId),
          userId: new mongoose.Types.ObjectId(userId),
          isActive: true,
        })
          .sort({ snapshotIndex: -1 })
          .lean(),
      ]);

      const statsResult = stats[0] || {
        totalSnapshots: 0,
        aiUpdates: 0,
        manualEdits: 0,
        maxIndex: -1,
        minIndex: 0,
        lastUpdate: new Date(),
      };

      const currentIndex = currentSnapshot ? currentSnapshot.snapshotIndex : -1;
      const maxIndex = maxSnapshot ? maxSnapshot.snapshotIndex : -1;

      const result = {
        totalSnapshots: statsResult.totalSnapshots,
        aiUpdates: statsResult.aiUpdates,
        manualEdits: statsResult.manualEdits,
        currentIndex,
        canUndo: currentIndex > 0,
        canRedo: currentIndex < maxIndex,
        lastUpdate: statsResult.lastUpdate,
      };

      console.log(`📊 History stats for form ${formId}:`, result);

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('❌ Error fetching history stats:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch stats',
      };
    }
  }

  // Clear form history
  static async clearFormHistory(
    formId: string,
    userId: string
  ): Promise<HistoryServiceResponse<{ deletedCount: number }>> {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(formId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        return {
          success: false,
          error: 'Invalid formId or userId format',
        };
      }

      const result = await FormHistorySnapshot.updateMany(
        {
          formId: new mongoose.Types.ObjectId(formId),
          userId: new mongoose.Types.ObjectId(userId),
        },
        { isActive: false }
      );

      console.log(
        `🗑️ Cleared ${result.modifiedCount} snapshots for form ${formId}`
      );

      return {
        success: true,
        data: { deletedCount: result.modifiedCount },
      };
    } catch (error: any) {
      console.error('❌ Error clearing form history:', error);
      return {
        success: false,
        error: error.message || 'Failed to clear history',
      };
    }
  }

  // Restore to specific snapshot
  static async restoreToSnapshot(
    formId: string,
    userId: string,
    snapshotId: string
  ): Promise<HistoryServiceResponse<IFormHistorySnapshot>> {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(formId) ||
        !mongoose.Types.ObjectId.isValid(userId) ||
        !mongoose.Types.ObjectId.isValid(snapshotId)
      ) {
        return {
          success: false,
          error: 'Invalid formId, userId, or snapshotId format',
        };
      }

      const snapshot = await FormHistorySnapshot.findOne({
        _id: new mongoose.Types.ObjectId(snapshotId),
        formId: new mongoose.Types.ObjectId(formId),
        userId: new mongoose.Types.ObjectId(userId),
        isActive: true,
      }).lean();

      if (!snapshot) {
        return {
          success: false,
          error: 'Snapshot not found',
        };
      }

      console.log(`🔄 Restored to snapshot ${snapshotId} for form ${formId}`);

      return {
        success: true,
        data: snapshot,
      };
    } catch (error: any) {
      console.error('❌ Error restoring snapshot:', error);
      return {
        success: false,
        error: error.message || 'Failed to restore snapshot',
      };
    }
  }

  // Get analytics data
  static async getHistoryAnalytics(
    userId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<
    HistoryServiceResponse<{
      totalOperations: number;
      aiUpdatesByDay: any[];
      topPrompts: any[];
      undoRedoFrequency: any;
    }>
  > {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return {
          success: false,
          error: 'Invalid userId format',
        };
      }

      const pipeline = [
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: timeRange.start, $lte: timeRange.end },
            isActive: true,
          },
        },
        {
          $facet: {
            totalOps: [{ $count: 'count' }],
            byDay: [
              {
                $group: {
                  _id: {
                    date: {
                      $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                    },
                    type: '$metadata.changeType',
                  },
                  count: { $sum: 1 },
                },
              },
            ],
            topPrompts: [
              {
                $match: { 'metadata.updatePrompt': { $exists: true } },
              },
              {
                $group: {
                  _id: '$metadata.updatePrompt',
                  count: { $sum: 1 },
                },
              },
              { $sort: { count: -1 } },
              { $limit: 10 },
            ],
          },
        },
      ];

      const result = await FormHistorySnapshot.aggregate(pipeline as any);
      const analytics = result[0];

      const analyticsData = {
        totalOperations: analytics.totalOps[0]?.count || 0,
        aiUpdatesByDay: analytics.byDay,
        topPrompts: analytics.topPrompts,
        undoRedoFrequency: {}, // Can be expanded with more specific queries
      };

      console.log(`📈 Analytics for user ${userId}:`, analyticsData);

      return {
        success: true,
        data: analyticsData,
      };
    } catch (error: any) {
      console.error('❌ Error fetching analytics:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch analytics',
      };
    }
  }

  // Utility method to check if form has any history
  static async hasHistory(formId: string, userId: string): Promise<boolean> {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(formId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        return false;
      }

      const count = await FormHistorySnapshot.countDocuments({
        formId: new mongoose.Types.ObjectId(formId),
        userId: new mongoose.Types.ObjectId(userId),
        isActive: true,
      });

      return count > 0;
    } catch (error) {
      console.error('❌ Error checking form history:', error);
      return false;
    }
  }

  // Get snapshot by ID
  static async getSnapshotById(
    snapshotId: string,
    userId: string
  ): Promise<HistoryServiceResponse<IFormHistorySnapshot>> {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(snapshotId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        return {
          success: false,
          error: 'Invalid snapshotId or userId format',
        };
      }

      const snapshot = await FormHistorySnapshot.findOne({
        _id: new mongoose.Types.ObjectId(snapshotId),
        userId: new mongoose.Types.ObjectId(userId),
        isActive: true,
      }).lean();

      if (!snapshot) {
        return {
          success: false,
          error: 'Snapshot not found',
        };
      }

      return {
        success: true,
        data: snapshot,
      };
    } catch (error: any) {
      console.error('❌ Error fetching snapshot by ID:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch snapshot',
      };
    }
  }
}
