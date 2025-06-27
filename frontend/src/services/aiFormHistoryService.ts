// // Frontend: src/services/aiFormHistoryService.ts

// import axios from 'axios';
// import { apiConfig } from '@/config/api';
// import { Form } from '@/types/form';

// export interface FormSnapshot {
//   id: string;
//   snapshotIndex: number;
//   formData?: Form;
//   changeType: 'ai_update' | 'manual_edit' | 'initial_state' | 'restore';
//   updatePrompt?: string;
//   updateSummary?: string;
//   timestamp: Date;
//   age?: number;
// }

// export interface HistoryStats {
//   totalSnapshots: number;
//   currentIndex: number;
//   canUndo: boolean;
//   canRedo: boolean;
//   aiUpdates: number;
//   manualEdits: number;
//   lastUpdate: Date;
// }

// export interface HistoryServiceResponse<T = any> {
//   success: boolean;
//   data?: T;
//   error?: string;
// }

// class AIFormHistoryService {
//   private static readonly CACHE_PREFIX = 'form_history_cache_';
//   private static readonly CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

//   // Get auth headers
//   private static getAuthHeaders() {
//     const token = localStorage.getItem('token');
//     return {
//       Authorization: `Bearer ${token}`,
//       'Content-Type': 'application/json',
//     };
//   }

//   // Cache management
//   private static getCachedData(key: string): any {
//     try {
//       const cached = localStorage.getItem(`${this.CACHE_PREFIX}${key}`);
//       if (cached) {
//         const { data, timestamp } = JSON.parse(cached);
//         if (Date.now() - timestamp < this.CACHE_EXPIRY) {
//           return data;
//         }
//         localStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
//       }
//     } catch (error) {
//       console.warn('Cache read error:', error);
//     }
//     return null;
//   }

//   private static setCachedData(key: string, data: any): void {
//     try {
//       localStorage.setItem(
//         `${this.CACHE_PREFIX}${key}`,
//         JSON.stringify({
//           data,
//           timestamp: Date.now(),
//         })
//       );
//     } catch (error) {
//       console.warn('Cache write error:', error);
//     }
//   }

//   private static clearCache(formId: string): void {
//     try {
//       const keys = [
//         `${this.CACHE_PREFIX}history_${formId}`,
//         `${this.CACHE_PREFIX}stats_${formId}`,
//       ];
//       keys.forEach(key => localStorage.removeItem(key));
//     } catch (error) {
//       console.warn('Cache clear error:', error);
//     }
//   }

//   // Create a snapshot (called before AI updates)
//   static async createSnapshot(
//     formId: string,
//     formData: Form,
//     changeType: FormSnapshot['changeType'] = 'manual_edit',
//     updatePrompt?: string,
//     updateSummary?: string
//   ): Promise<
//     HistoryServiceResponse<{ snapshotId: string; snapshotIndex: number }>
//   > {
//     try {
//       const response = await axios.post(
//         `${apiConfig.url}/forms/${formId}/history`,
//         {
//           formData,
//           changeType,
//           updatePrompt,
//           updateSummary,
//         },
//         {
//           headers: this.getAuthHeaders(),
//           timeout: 10000,
//         }
//       );

//       if (response.data.success) {
//         // Clear cache to force refresh
//         this.clearCache(formId);

//         return {
//           success: true,
//           data: {
//             snapshotId: response.data.data.snapshotId,
//             snapshotIndex: response.data.data.snapshotIndex,
//           },
//         };
//       }

//       return {
//         success: false,
//         error: response.data.message || 'Failed to create snapshot',
//       };
//     } catch (error: any) {
//       console.error('Create snapshot error:', error);

//       // Fallback to localStorage for offline scenarios
//       if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
//         return this.createLocalSnapshot(
//           formId,
//           formData,
//           changeType,
//           updatePrompt,
//           updateSummary
//         );
//       }

//       return {
//         success: false,
//         error:
//           error.response?.data?.message ||
//           error.message ||
//           'Network error creating snapshot',
//       };
//     }
//   }

//   // Get form history
//   static async getFormHistory(
//     formId: string,
//     limit: number = 50
//   ): Promise<
//     HistoryServiceResponse<{
//       snapshots: FormSnapshot[];
//       stats: HistoryStats;
//       formTitle: string;
//     }>
//   > {
//     try {
//       // Check cache first
//       const cacheKey = `history_${formId}`;
//       const cached = this.getCachedData(cacheKey);
//       if (cached) {
//         return { success: true, data: cached };
//       }

//       const response = await axios.get(
//         `${apiConfig.url}/forms/${formId}/history?limit=${limit}`,
//         {
//           headers: this.getAuthHeaders(),
//           timeout: 10000,
//         }
//       );

//       if (response.data.success) {
//         const historyData = {
//           snapshots: response.data.data.snapshots.map((s: any) => ({
//             ...s,
//             timestamp: new Date(s.timestamp),
//           })),
//           stats: response.data.data.stats,
//           formTitle: response.data.data.formTitle,
//         };

//         // Cache the result
//         this.setCachedData(cacheKey, historyData);

//         return {
//           success: true,
//           data: historyData,
//         };
//       }

//       return {
//         success: false,
//         error: response.data.message || 'Failed to fetch history',
//       };
//     } catch (error: any) {
//       console.error('Get history error:', error);

//       // Try localStorage fallback
//       const localHistory = this.getLocalHistory(formId);
//       if (localHistory.snapshots.length > 0) {
//         return { success: true, data: localHistory };
//       }

//       return {
//         success: false,
//         error:
//           error.response?.data?.message ||
//           error.message ||
//           'Network error fetching history',
//       };
//     }
//   }

//   // Undo to previous snapshot
//   static async undo(
//     formId: string,
//     targetIndex?: number
//   ): Promise<HistoryServiceResponse<{ formData: Form; undoDetails: any }>> {
//     try {
//       const response = await axios.post(
//         `${apiConfig.url}/forms/${formId}/history/undo`,
//         { targetIndex },
//         {
//           headers: this.getAuthHeaders(),
//           timeout: 15000,
//         }
//       );

//       if (response.data.success) {
//         // Clear cache to force refresh
//         this.clearCache(formId);

//         return {
//           success: true,
//           data: {
//             formData: response.data.data,
//             undoDetails: response.data.data.undoDetails,
//           },
//         };
//       }

//       return {
//         success: false,
//         error: response.data.message || 'Failed to undo',
//       };
//     } catch (error: any) {
//       console.error('Undo error:', error);

//       // Try localStorage fallback
//       if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
//         return this.localUndo(formId, targetIndex);
//       }

//       return {
//         success: false,
//         error:
//           error.response?.data?.message ||
//           error.message ||
//           'Network error during undo',
//       };
//     }
//   }

//   // Redo to next snapshot
//   static async redo(
//     formId: string,
//     targetIndex?: number
//   ): Promise<HistoryServiceResponse<{ formData: Form; redoDetails: any }>> {
//     try {
//       const response = await axios.post(
//         `${apiConfig.url}/forms/${formId}/history/redo`,
//         { targetIndex },
//         {
//           headers: this.getAuthHeaders(),
//           timeout: 15000,
//         }
//       );

//       if (response.data.success) {
//         // Clear cache to force refresh
//         this.clearCache(formId);

//         return {
//           success: true,
//           data: {
//             formData: response.data.data,
//             redoDetails: response.data.data.redoDetails,
//           },
//         };
//       }

//       return {
//         success: false,
//         error: response.data.message || 'Failed to redo',
//       };
//     } catch (error: any) {
//       console.error('Redo error:', error);

//       // Try localStorage fallback
//       if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
//         return this.localRedo(formId, targetIndex);
//       }

//       return {
//         success: false,
//         error:
//           error.response?.data?.message ||
//           error.message ||
//           'Network error during redo',
//       };
//     }
//   }

//   // Get history statistics
//   static async getHistoryStats(
//     formId: string
//   ): Promise<HistoryServiceResponse<HistoryStats>> {
//     try {
//       // Check cache first
//       const cacheKey = `stats_${formId}`;
//       const cached = this.getCachedData(cacheKey);
//       if (cached) {
//         return { success: true, data: cached };
//       }

//       const response = await axios.get(
//         `${apiConfig.url}/forms/${formId}/history/stats`,
//         {
//           headers: this.getAuthHeaders(),
//           timeout: 5000,
//         }
//       );

//       if (response.data.success) {
//         const stats = {
//           ...response.data.data,
//           lastUpdate: new Date(response.data.data.lastUpdate),
//         };

//         // Cache the result
//         this.setCachedData(cacheKey, stats);

//         return {
//           success: true,
//           data: stats,
//         };
//       }

//       return {
//         success: false,
//         error: response.data.message || 'Failed to fetch stats',
//       };
//     } catch (error: any) {
//       console.error('Get stats error:', error);

//       // Try localStorage fallback
//       const localStats = this.getLocalStats(formId);
//       return { success: true, data: localStats };
//     }
//   }

//   // Clear form history
//   static async clearHistory(
//     formId: string
//   ): Promise<HistoryServiceResponse<{ deletedCount: number }>> {
//     try {
//       const response = await axios.delete(
//         `${apiConfig.url}/forms/${formId}/history`,
//         {
//           headers: this.getAuthHeaders(),
//           timeout: 10000,
//         }
//       );

//       if (response.data.success) {
//         // Clear cache
//         this.clearCache(formId);
//         // Clear localStorage
//         this.clearLocalHistory(formId);

//         return {
//           success: true,
//           data: { deletedCount: response.data.data.deletedSnapshots },
//         };
//       }

//       return {
//         success: false,
//         error: response.data.message || 'Failed to clear history',
//       };
//     } catch (error: any) {
//       console.error('Clear history error:', error);
//       return {
//         success: false,
//         error:
//           error.response?.data?.message ||
//           error.message ||
//           'Network error clearing history',
//       };
//     }
//   }

//   // Restore to specific snapshot
//   static async restoreToSnapshot(
//     formId: string,
//     snapshotId: string
//   ): Promise<
//     HistoryServiceResponse<{ formData: Form; restoredSnapshot: any }>
//   > {
//     try {
//       const response = await axios.post(
//         `${apiConfig.url}/forms/${formId}/history/restore/${snapshotId}`,
//         {},
//         {
//           headers: this.getAuthHeaders(),
//           timeout: 15000,
//         }
//       );

//       if (response.data.success) {
//         // Clear cache to force refresh
//         this.clearCache(formId);

//         return {
//           success: true,
//           data: {
//             formData: response.data.data,
//             restoredSnapshot: response.data.data.restoredSnapshot,
//           },
//         };
//       }

//       return {
//         success: false,
//         error: response.data.message || 'Failed to restore snapshot',
//       };
//     } catch (error: any) {
//       console.error('Restore snapshot error:', error);
//       return {
//         success: false,
//         error:
//           error.response?.data?.message ||
//           error.message ||
//           'Network error during restore',
//       };
//     }
//   }

//   // Convenience methods for common operations
//   static async saveBeforeAIUpdate(
//     formId: string,
//     formData: Form
//   ): Promise<void> {
//     await this.createSnapshot(
//       formId,
//       formData,
//       'manual_edit',
//       undefined,
//       'Before AI Update'
//     );
//   }

//   static async saveAfterAIUpdate(
//     formId: string,
//     formData: Form,
//     updatePrompt: string,
//     updateSummary: string
//   ): Promise<void> {
//     await this.createSnapshot(
//       formId,
//       formData,
//       'ai_update',
//       updatePrompt,
//       updateSummary
//     );
//   }

//   // Check if operations are available
//   static async canUndo(formId: string): Promise<boolean> {
//     const stats = await this.getHistoryStats(formId);
//     return stats.success ? stats.data!.canUndo : false;
//   }

//   static async canRedo(formId: string): Promise<boolean> {
//     const stats = await this.getHistoryStats(formId);
//     return stats.success ? stats.data!.canRedo : false;
//   }

//   // =============================================================================
//   // FALLBACK LOCALSTORAGE METHODS (for offline functionality)
//   // =============================================================================

//   private static readonly LOCAL_STORAGE_PREFIX = 'form_history_local_';
//   private static readonly MAX_LOCAL_SNAPSHOTS = 10;

//   private static createLocalSnapshot(
//     formId: string,
//     formData: Form,
//     changeType: FormSnapshot['changeType'],
//     updatePrompt?: string,
//     updateSummary?: string
//   ): HistoryServiceResponse<{ snapshotId: string; snapshotIndex: number }> {
//     try {
//       const historyKey = `${this.LOCAL_STORAGE_PREFIX}${formId}`;
//       const history = JSON.parse(localStorage.getItem(historyKey) || '[]');

//       const snapshot: FormSnapshot = {
//         id: `local_${Date.now()}`,
//         snapshotIndex: history.length,
//         formData: JSON.parse(JSON.stringify(formData)),
//         changeType,
//         updatePrompt,
//         updateSummary,
//         timestamp: new Date(),
//       };

//       history.push(snapshot);

//       // Keep only recent snapshots
//       if (history.length > this.MAX_LOCAL_SNAPSHOTS) {
//         history.splice(0, history.length - this.MAX_LOCAL_SNAPSHOTS);
//         // Reindex
//         history.forEach((s: FormSnapshot, i: number) => {
//           s.snapshotIndex = i;
//         });
//       }

//       localStorage.setItem(historyKey, JSON.stringify(history));

//       return {
//         success: true,
//         data: {
//           snapshotId: snapshot.id,
//           snapshotIndex: snapshot.snapshotIndex,
//         },
//       };
//     } catch {
//       return {
//         success: false,
//         error: 'Failed to create local snapshot',
//       };
//     }
//   }

//   private static getLocalHistory(formId: string): {
//     snapshots: FormSnapshot[];
//     stats: HistoryStats;
//     formTitle: string;
//   } {
//     try {
//       const historyKey = `${this.LOCAL_STORAGE_PREFIX}${formId}`;
//       const history: FormSnapshot[] = JSON.parse(
//         localStorage.getItem(historyKey) || '[]'
//       );

//       const stats: HistoryStats = {
//         totalSnapshots: history.length,
//         currentIndex: Math.max(0, history.length - 1),
//         canUndo: history.length > 1,
//         canRedo: false, // Local storage doesn't support redo in this simple implementation
//         aiUpdates: history.filter(s => s.changeType === 'ai_update').length,
//         manualEdits: history.filter(s => s.changeType === 'manual_edit').length,
//         lastUpdate:
//           history.length > 0
//             ? new Date(history[history.length - 1].timestamp)
//             : new Date(),
//       };

//       return {
//         snapshots: history.map(s => ({
//           ...s,
//           timestamp: new Date(s.timestamp),
//         })),
//         stats,
//         formTitle: 'Form (Offline)',
//       };
//     } catch {
//       return {
//         snapshots: [],
//         stats: {
//           totalSnapshots: 0,
//           currentIndex: -1,
//           canUndo: false,
//           canRedo: false,
//           aiUpdates: 0,
//           manualEdits: 0,
//           lastUpdate: new Date(),
//         },
//         formTitle: 'Form',
//       };
//     }
//   }

//   private static getLocalStats(formId: string): HistoryStats {
//     const localHistory = this.getLocalHistory(formId);
//     return localHistory.stats;
//   }

//   private static localUndo(
//     formId: string,
//     targetIndex?: number
//   ): HistoryServiceResponse<{ formData: Form; undoDetails: any }> {
//     try {
//       const historyKey = `${this.LOCAL_STORAGE_PREFIX}${formId}`;
//       const history: FormSnapshot[] = JSON.parse(
//         localStorage.getItem(historyKey) || '[]'
//       );

//       if (history.length < 2) {
//         return {
//           success: false,
//           error: 'No previous state to undo to',
//         };
//       }

//       const undoToIndex =
//         targetIndex !== undefined ? targetIndex : history.length - 2;
//       const targetSnapshot = history[undoToIndex];

//       if (!targetSnapshot || !targetSnapshot.formData) {
//         return {
//           success: false,
//           error: 'Target snapshot not found',
//         };
//       }

//       return {
//         success: true,
//         data: {
//           formData: targetSnapshot.formData,
//           undoDetails: {
//             fromIndex: history.length - 1,
//             toIndex: undoToIndex,
//             changeType: targetSnapshot.changeType,
//             originalSummary: targetSnapshot.updateSummary,
//           },
//         },
//       };
//     } catch {
//       return {
//         success: false,
//         error: 'Failed to undo locally',
//       };
//     }
//   }

//   private static localRedo(
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     formId: string,
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     targetIndex?: number
//   ): HistoryServiceResponse<{
//     formData: Form;
//     redoDetails: any;
//   }> {
//     // Simple local implementation doesn't support redo
//     return {
//       success: false,
//       error: 'Redo not supported in offline mode',
//     };
//   }

//   private static clearLocalHistory(formId: string): void {
//     try {
//       const historyKey = `${this.LOCAL_STORAGE_PREFIX}${formId}`;
//       localStorage.removeItem(historyKey);
//     } catch (error) {
//       console.warn('Failed to clear local history:', error);
//     }
//   }
// }

// export default AIFormHistoryService;

// src/services/aiFormHistoryService.ts

import axios from 'axios';
import { apiConfig } from '@/config/api';
import { Form } from '@/types/form';

export interface HistoryServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface FormSnapshot {
  id: string;
  snapshotIndex: number;
  changeType: 'ai_update' | 'manual_edit' | 'initial_state' | 'restore';
  updatePrompt?: string;
  updateSummary?: string;
  timestamp: string;
  age: number;
}

export interface HistoryStats {
  totalSnapshots: number;
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  lastUpdate: string;
  aiUpdates: number;
  manualEdits: number;
}

class AIFormHistoryService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // Save form state before AI update
  async saveBeforeAIUpdate(
    formId: string,
    formData: Form
  ): Promise<HistoryServiceResponse> {
    try {
      const response = await axios.post(
        `${apiConfig.url}/forms/${formId}/history`,
        {
          changeType: 'manual_edit',
          updateSummary: 'State before AI update',
          formData,
        },
        {
          headers: this.getAuthHeaders(),
        }
      );

      return {
        success: response.data.success,
        data: response.data.data,
        error: response.data.success ? undefined : response.data.message,
      };
    } catch (error: any) {
      console.error('Failed to save before AI update:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // Save form state after AI update
  async saveAfterAIUpdate(
    formId: string,
    formData: Form,
    updatePrompt: string,
    updateSummary: string
  ): Promise<HistoryServiceResponse> {
    try {
      const response = await axios.post(
        `${apiConfig.url}/forms/${formId}/history`,
        {
          changeType: 'ai_update',
          updatePrompt,
          updateSummary,
          formData,
        },
        {
          headers: this.getAuthHeaders(),
        }
      );

      return {
        success: response.data.success,
        data: response.data.data,
        error: response.data.success ? undefined : response.data.message,
      };
    } catch (error: any) {
      console.error('Failed to save after AI update:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // Get form history
  async getFormHistory(
    formId: string,
    limit: number = 50
  ): Promise<
    HistoryServiceResponse<{
      formTitle: string;
      snapshots: FormSnapshot[];
      stats: HistoryStats;
    }>
  > {
    try {
      const response = await axios.get(
        `${apiConfig.url}/forms/${formId}/history?limit=${limit}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      return {
        success: response.data.success,
        data: response.data.data,
        error: response.data.success ? undefined : response.data.message,
      };
    } catch (error: any) {
      console.error('Failed to get form history:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // Get history statistics
  async getHistoryStats(
    formId: string
  ): Promise<HistoryServiceResponse<HistoryStats>> {
    try {
      const response = await axios.get(
        `${apiConfig.url}/forms/${formId}/history/stats`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      return {
        success: response.data.success,
        data: response.data.data,
        error: response.data.success ? undefined : response.data.message,
      };
    } catch (error: any) {
      console.error('Failed to get history stats:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // Undo to previous snapshot
  async undo(
    formId: string,
    targetIndex?: number
  ): Promise<
    HistoryServiceResponse<{
      formData: Form;
      undoDetails: {
        fromIndex: number;
        toIndex: number;
        changeType: string;
        originalSummary?: string;
      };
    }>
  > {
    try {
      const response = await axios.post(
        `${apiConfig.url}/forms/${formId}/history/undo`,
        { targetIndex },
        {
          headers: this.getAuthHeaders(),
        }
      );

      return {
        success: response.data.success,
        data: {
          formData: response.data.data,
          undoDetails: response.data.data.undoDetails || {
            fromIndex: 0,
            toIndex: 0,
            changeType: 'manual_edit',
          },
        },
        error: response.data.success ? undefined : response.data.message,
      };
    } catch (error: any) {
      console.error('Failed to undo:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // Redo to next snapshot
  async redo(
    formId: string,
    targetIndex?: number
  ): Promise<
    HistoryServiceResponse<{
      formData: Form;
      redoDetails: {
        fromIndex: number;
        toIndex: number;
        changeType: string;
        originalSummary?: string;
      };
    }>
  > {
    try {
      const response = await axios.post(
        `${apiConfig.url}/forms/${formId}/history/redo`,
        { targetIndex },
        {
          headers: this.getAuthHeaders(),
        }
      );

      return {
        success: response.data.success,
        data: {
          formData: response.data.data,
          redoDetails: response.data.data.redoDetails || {
            fromIndex: 0,
            toIndex: 0,
            changeType: 'manual_edit',
          },
        },
        error: response.data.success ? undefined : response.data.message,
      };
    } catch (error: any) {
      console.error('Failed to redo:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // Restore to specific snapshot
  async restoreToSnapshot(
    formId: string,
    snapshotId: string
  ): Promise<
    HistoryServiceResponse<{
      formData: Form;
      restoredSnapshot: {
        id: string;
        index: number;
        changeType: string;
        originalSummary?: string;
        timestamp: string;
      };
    }>
  > {
    try {
      const response = await axios.post(
        `${apiConfig.url}/forms/${formId}/history/restore/${snapshotId}`,
        {},
        {
          headers: this.getAuthHeaders(),
        }
      );

      return {
        success: response.data.success,
        data: {
          formData: response.data.data,
          restoredSnapshot: response.data.data.restoredSnapshot || {
            id: snapshotId,
            index: 0,
            changeType: 'restore',
            timestamp: new Date().toISOString(),
          },
        },
        error: response.data.success ? undefined : response.data.message,
      };
    } catch (error: any) {
      console.error('Failed to restore snapshot:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // Clear form history
  async clearHistory(formId: string): Promise<HistoryServiceResponse> {
    try {
      const response = await axios.delete(
        `${apiConfig.url}/forms/${formId}/history`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      return {
        success: response.data.success,
        data: response.data.data,
        error: response.data.success ? undefined : response.data.message,
      };
    } catch (error: any) {
      console.error('Failed to clear history:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // Check if form has history
  async hasHistory(formId: string): Promise<boolean> {
    try {
      const statsResult = await this.getHistoryStats(formId);
      return statsResult.success && (statsResult.data?.totalSnapshots || 0) > 0;
    } catch (error) {
      console.warn('Failed to check form history:', error);
      return false;
    }
  }
}

// Export singleton instance
const aiFormHistoryService = new AIFormHistoryService();
export default aiFormHistoryService;
