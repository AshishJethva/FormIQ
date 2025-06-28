import axios from 'axios';
import { apiConfig } from '@/config/api';

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

  // Get history statistics - This is the main method used by AIFixedChatInput
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

  // Get form history - Used for displaying history panel
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

  // Check if form has history - Utility method
  async hasHistory(formId: string): Promise<boolean> {
    try {
      const statsResult = await this.getHistoryStats(formId);
      return statsResult.success && (statsResult.data?.totalSnapshots || 0) > 0;
    } catch (error) {
      console.warn('Failed to check form history:', error);
      return false;
    }
  }

  // Clear form history - Utility method
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

  // Restore to specific snapshot - Used by history panel
  async restoreToSnapshot(
    formId: string,
    snapshotId: string
  ): Promise<HistoryServiceResponse<any>> {
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
        data: response.data.data,
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
}

// Export singleton instance
const aiFormHistoryService = new AIFormHistoryService();
export default aiFormHistoryService;
