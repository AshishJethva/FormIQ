// src/services/aiEvaluation.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface AIEvaluationResult {
  id: string;
  submissionId: string;
  formType: 'quiz' | 'survey' | 'feedback' | 'general';
  sentiment: 'positive' | 'neutral' | 'negative';
  categories: string[];
  evaluatedAt: string;
  status: 'completed' | 'failed';
  feedback: string;

  quizResults?: {
    correctAnswers: number;
    totalQuestions: number;
    percentage: number;
    explanations: Array<{
      questionId: string;
      question: string;
      userAnswer: string;
      correctAnswer: string;
      explanation: string;
      isCorrect: boolean;
    }>;
  };

  surveyResults?: {
    overallSentiment: {
      positive: number;
      neutral: number;
      negative: number;
    };
    keyMetrics: Array<{
      metric: string;
      value: number;
      trend: 'up' | 'down' | 'stable';
    }>;
    insights: string[];
    responseQuality: number;
  };

  feedbackResults?: {
    criticalThemes: Array<{
      theme: string;
      frequency: number;
      severity: 'high' | 'medium' | 'low';
      examples: string[];
    }>;
    sentimentBreakdown: {
      positive: number;
      neutral: number;
      negative: number;
    };
    actionableInsights: string[];
    urgencyLevel: 'high' | 'medium' | 'low';
  };
}

class AIEvaluationService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async evaluateSubmission(
    submissionId: string
  ): Promise<{ success: boolean; data?: AIEvaluationResult; error?: string }> {
    try {
      const response = await fetch(
        `${API_URL}/api/ai-evaluation/evaluate/${submissionId}`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to evaluate submission');
      }

      return { success: true, data: result.data };
    } catch (error: any) {
      console.error('AI evaluation error:', error);
      return { success: false, error: error.message };
    }
  }

  async evaluateBatch(
    formId: string,
    submissionIds: string[]
  ): Promise<{
    success: boolean;
    data?: AIEvaluationResult[];
    error?: string;
  }> {
    try {
      const response = await fetch(
        `${API_URL}/api/ai-evaluation/evaluate-batch`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ formId, submissionIds }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to evaluate submissions');
      }

      return { success: true, data: result.data };
    } catch (error: any) {
      console.error('Batch AI evaluation error:', error);
      return { success: false, error: error.message };
    }
  }
}

export const aiEvaluationService = new AIEvaluationService();
