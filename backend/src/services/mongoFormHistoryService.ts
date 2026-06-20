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

interface FormHistoryState {
  formId: string;
  userId: string;
  currentPosition: number; // Current position in history (0 = latest)
  maxPosition: number; // Maximum position available
}

// Store current positions in memory (in production, use Redis or database)
const historyPositions = new Map<string, FormHistoryState>();

export class MongoFormHistoryService {
  // NEW: Get or initialize history state
  private static getHistoryState(
    formId: string,
    userId: string
  ): FormHistoryState {
    const key = `${formId}_${userId}`;
    if (!historyPositions.has(key)) {
      historyPositions.set(key, {
        formId,
        userId,
        currentPosition: 0,
        maxPosition: 0,
      });
    }
    return historyPositions.get(key)!;
  }

  // NEW: Update history state
  private static updateHistoryState(
    formId: string,
    userId: string,
    updates: Partial<FormHistoryState>
  ) {
    const key = `${formId}_${userId}`;
    const current = this.getHistoryState(formId, userId);
    historyPositions.set(key, { ...current, ...updates });
  }

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
          aiModel: 'llama-3.3-70b-versatile',
          userAgent: metadata.userAgent,
          ipAddress: metadata.ipAddress,
          sessionId: metadata.sessionId,
        },
        snapshotIndex: newIndex,
        isActive: true,
      });

      const savedSnapshot = await snapshot.save();

      // UPDATE: Reset history position to 0 (latest) when new snapshot is created
      this.updateHistoryState(formId, userId, {
        currentPosition: 0,
        maxPosition: newIndex,
      });

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

  // UPDATED: Undo to previous snapshot with proper position tracking
  static async undoToSnapshot(
    formId: string,
    userId: string,
    targetIndex?: number
  ): Promise<
    HistoryServiceResponse<{
      snapshot: IFormHistorySnapshot;
      newPosition: number;
      canUndo: boolean;
      canRedo: boolean;
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

      const historyState = this.getHistoryState(formId, userId);

      // Calculate target position
      let targetPosition: number;
      if (targetIndex !== undefined) {
        // Convert index to position (position = maxIndex - index)
        targetPosition = historyState.maxPosition - targetIndex;
      } else {
        // Move one step back in history
        targetPosition = historyState.currentPosition + 1;
      }

      // Validate target position
      const maxPositionAvailable = Math.min(historyState.maxPosition, 9); // Max 10 undos (0-9)
      if (targetPosition > maxPositionAvailable) {
        return {
          success: false,
          error: 'No more undo history available',
        };
      }

      // Calculate target index
      const targetIndex_calc = historyState.maxPosition - targetPosition;

      const targetSnapshot = await FormHistorySnapshot.getSnapshotAtIndex(
        formId,
        userId,
        targetIndex_calc
      );

      if (!targetSnapshot) {
        return {
          success: false,
          error: 'Target snapshot not found',
        };
      }

      // Update history state
      this.updateHistoryState(formId, userId, {
        currentPosition: targetPosition,
      });

      const updatedState = this.getHistoryState(formId, userId);

      return {
        success: true,
        data: {
          snapshot: targetSnapshot,
          newPosition: targetPosition,
          canUndo: targetPosition < Math.min(updatedState.maxPosition, 9),
          canRedo: targetPosition > 0,
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

  // UPDATED: Redo to next snapshot with proper position tracking
  static async redoToSnapshot(
    formId: string,
    userId: string,
    targetIndex?: number
  ): Promise<
    HistoryServiceResponse<{
      snapshot: IFormHistorySnapshot;
      newPosition: number;
      canUndo: boolean;
      canRedo: boolean;
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

      const historyState = this.getHistoryState(formId, userId);

      // Calculate target position
      let targetPosition: number;
      if (targetIndex !== undefined) {
        // Convert index to position
        targetPosition = historyState.maxPosition - targetIndex;
      } else {
        // Move one step forward in history
        targetPosition = historyState.currentPosition - 1;
      }

      // Validate target position
      if (targetPosition < 0) {
        return {
          success: false,
          error: 'No more redo history available',
        };
      }

      // Calculate target index
      const targetIndex_calc = historyState.maxPosition - targetPosition;

      const targetSnapshot = await FormHistorySnapshot.getSnapshotAtIndex(
        formId,
        userId,
        targetIndex_calc
      );

      if (!targetSnapshot) {
        return {
          success: false,
          error: 'Target snapshot not found',
        };
      }

      // Update history state
      this.updateHistoryState(formId, userId, {
        currentPosition: targetPosition,
      });

      const updatedState = this.getHistoryState(formId, userId);

      return {
        success: true,
        data: {
          snapshot: targetSnapshot,
          newPosition: targetPosition,
          canUndo: targetPosition < Math.min(updatedState.maxPosition, 9),
          canRedo: targetPosition > 0,
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

  // UPDATED: Get history statistics with proper position tracking
  static async getHistoryStats(
    formId: string,
    userId: string
  ): Promise<
    HistoryServiceResponse<{
      totalSnapshots: number;
      aiUpdates: number;
      manualEdits: number;
      currentIndex: number;
      currentPosition: number;
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

      const [stats, maxSnapshot] = await Promise.all([
        FormHistorySnapshot.getHistoryStats(formId, userId),
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

      const maxIndex = maxSnapshot ? maxSnapshot.snapshotIndex : -1;

      // Initialize or get history state
      const historyState = this.getHistoryState(formId, userId);

      // Update max position if needed
      if (maxIndex > historyState.maxPosition) {
        this.updateHistoryState(formId, userId, { maxPosition: maxIndex });
      }

      const updatedState = this.getHistoryState(formId, userId);
      const currentIndex = maxIndex - updatedState.currentPosition;

      const result = {
        totalSnapshots: statsResult.totalSnapshots,
        aiUpdates: statsResult.aiUpdates,
        manualEdits: statsResult.manualEdits,
        currentIndex,
        currentPosition: updatedState.currentPosition,
        canUndo: updatedState.currentPosition < Math.min(maxIndex, 9), // Max 10 undos
        canRedo: updatedState.currentPosition > 0,
        lastUpdate: statsResult.lastUpdate,
      };

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

      // Reset history state
      this.updateHistoryState(formId, userId, {
        currentPosition: 0,
        maxPosition: 0,
      });

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

      // Reset position to this snapshot
      const historyState = this.getHistoryState(formId, userId);
      const newPosition = historyState.maxPosition - snapshot.snapshotIndex;
      this.updateHistoryState(formId, userId, { currentPosition: newPosition });

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
