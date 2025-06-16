// // src/services/aiEvaluation.ts - Frontend Service
// import axios from 'axios';
// import { apiConfig } from '@/config/api';

// export interface QuizEvaluationResult {
//   correctAnswers: number;
//   totalQuestions: number;
//   percentage: number;
//   explanations: Array<{
//     questionId: string;
//     question: string;
//     userAnswer: string;
//     correctAnswer: string;
//     explanation: string;
//     isCorrect: boolean;
//   }>;
// }

// export interface SurveyEvaluationResult {
//   overallSentiment: {
//     positive: number;
//     neutral: number;
//     negative: number;
//   };
//   keyMetrics: Array<{
//     metric: string;
//     value: number;
//     trend: 'up' | 'down' | 'stable';
//   }>;
//   insights: string[];
//   responseQuality: number;
// }

// export interface FeedbackEvaluationResult {
//   criticalThemes: Array<{
//     theme: string;
//     frequency: number;
//     severity: 'high' | 'medium' | 'low';
//     examples: string[];
//   }>;
//   sentimentBreakdown: {
//     positive: number;
//     neutral: number;
//     negative: number;
//   };
//   actionableInsights: string[];
//   urgencyLevel: 'high' | 'medium' | 'low';
// }

// export interface AIEvaluationResult {
//   id: string;
//   submissionId: string;
//   formType: 'quiz' | 'survey' | 'feedback' | 'general';
//   sentiment: 'positive' | 'neutral' | 'negative';
//   categories: string[];
//   evaluatedAt: string;
//   status: 'completed' | 'failed';
//   feedback: string;
//   quizResults?: QuizEvaluationResult;
//   surveyResults?: SurveyEvaluationResult;
//   feedbackResults?: FeedbackEvaluationResult;
// }

// export interface EvaluationResponse {
//   success: boolean;
//   data?: AIEvaluationResult;
//   message?: string;
//   error?: string;
//   metadata?: {
//     evaluationTime: number;
//     formId: string;
//     formTitle: string;
//     formType: string;
//     evaluatedAt: string;
//     version: string;
//   };
// }

// export interface BatchEvaluationResponse {
//   success: boolean;
//   data?: AIEvaluationResult[];
//   message?: string;
//   error?: string;
//   metadata?: {
//     totalEvaluations: number;
//     successful: number;
//     failed: number;
//     totalTime: number;
//     avgTimePerSubmission: number;
//     formId: string;
//     formTitle: string;
//     processedAt: string;
//     version: string;
//     errors?: Array<{
//       submissionId: string;
//       error: string;
//     }>;
//   };
// }

// class AIEvaluationService {
//   private baseUrl: string;
//   private timeout: number = 60000; // 60 seconds for AI operations

//   constructor() {
//     this.baseUrl = `${apiConfig.url}/ai-evaluation`;
//   }

//   // Enhanced error handling for AI evaluation responses
//   private handleEvaluationError(error: any): {
//     success: false;
//     message: string;
//     error: string;
//     isRetryable: boolean;
//   } {
//     console.error('❌ AI Evaluation Error:', error);

//     if (error.response) {
//       const { status, data } = error.response;

//       switch (status) {
//         case 400:
//           return {
//             success: false,
//             message: data.message || 'Invalid request data',
//             error: 'VALIDATION_ERROR',
//             isRetryable: false,
//           };
//         case 401:
//           return {
//             success: false,
//             message: 'Authentication required',
//             error: 'AUTH_ERROR',
//             isRetryable: false,
//           };
//         case 403:
//           return {
//             success: false,
//             message: 'Not authorized to evaluate this submission',
//             error: 'PERMISSION_ERROR',
//             isRetryable: false,
//           };
//         case 404:
//           return {
//             success: false,
//             message: 'Submission or form not found',
//             error: 'NOT_FOUND_ERROR',
//             isRetryable: false,
//           };
//         case 429:
//           return {
//             success: false,
//             message: 'Too many requests. Please wait a moment and try again.',
//             error: 'RATE_LIMIT_ERROR',
//             isRetryable: true,
//           };
//         case 500:
//           return {
//             success: false,
//             message:
//               'AI evaluation service temporarily unavailable. Please try again later.',
//             error: 'SERVICE_ERROR',
//             isRetryable: true,
//           };
//         case 503:
//           return {
//             success: false,
//             message:
//               'AI service is currently overloaded. Please try again in a few minutes.',
//             error: 'SERVICE_OVERLOAD',
//             isRetryable: true,
//           };
//         default:
//           return {
//             success: false,
//             message: `Unexpected error (${status}): ${
//               data.message || 'Unknown error'
//             }`,
//             error: 'UNKNOWN_ERROR',
//             isRetryable: true,
//           };
//       }
//     } else if (error.request) {
//       return {
//         success: false,
//         message: 'Network error: Unable to connect to AI evaluation service',
//         error: 'NETWORK_ERROR',
//         isRetryable: true,
//       };
//     } else {
//       return {
//         success: false,
//         message: 'Request setup error: ' + error.message,
//         error: 'REQUEST_ERROR',
//         isRetryable: false,
//       };
//     }
//   }

//   // Get authentication headers
//   private getAuthHeaders() {
//     const token = localStorage.getItem('token');
//     return {
//       'Content-Type': 'application/json',
//       ...(token && { Authorization: `Bearer ${token}` }),
//     };
//   }

//   // Enhanced retry logic for AI operations
//   private async retryOperation<T>(
//     operation: () => Promise<T>,
//     maxRetries: number = 2,
//     baseDelay: number = 2000
//   ): Promise<T> {
//     let lastError;

//     for (let attempt = 0; attempt <= maxRetries; attempt++) {
//       try {
//         return await operation();
//       } catch (error: any) {
//         lastError = error;
//         const errorInfo = this.handleEvaluationError(error);

//         // Don't retry if it's not a retryable error
//         if (!errorInfo.isRetryable || attempt === maxRetries) {
//           throw error;
//         }

//         // Calculate delay with exponential backoff
//         const delay = baseDelay * Math.pow(2, attempt);

//         await new Promise(resolve => setTimeout(resolve, delay));
//       }
//     }

//     throw lastError;
//   }

//   // Evaluate a single submission
//   async evaluateSubmission(submissionId: string): Promise<EvaluationResponse> {
//     try {
//       if (!submissionId || submissionId.trim() === '') {
//         return {
//           success: false,
//           message: 'Submission ID is required',
//           error: 'INVALID_INPUT',
//         };
//       }

//       const operation = async () => {
//         const response = await axios.post(
//           `${this.baseUrl}/evaluate/${submissionId}`,
//           {},
//           {
//             headers: this.getAuthHeaders(),
//             timeout: this.timeout,
//           }
//         );
//         return response.data;
//       };

//       const result = await this.retryOperation(operation);

//       return result;
//     } catch (error: any) {
//       console.error('❌ AI evaluation failed:', error);
//       const errorInfo = this.handleEvaluationError(error);

//       return {
//         success: false,
//         message: errorInfo.message,
//         error: errorInfo.error,
//       };
//     }
//   }

//   // Batch evaluate multiple submissions
//   async evaluateBatch(
//     formId: string,
//     submissionIds: string[]
//   ): Promise<BatchEvaluationResponse> {
//     try {
//       if (!formId || !submissionIds || submissionIds.length === 0) {
//         return {
//           success: false,
//           message: 'Form ID and submission IDs are required',
//           error: 'INVALID_INPUT',
//         };
//       }

//       if (submissionIds.length > 20) {
//         return {
//           success: false,
//           message: 'Maximum 20 submissions can be evaluated at once',
//           error: 'BATCH_SIZE_LIMIT',
//         };
//       }

//       const operation = async () => {
//         const response = await axios.post(
//           `${this.baseUrl}/evaluate-batch`,
//           {
//             formId,
//             submissionIds,
//           },
//           {
//             headers: this.getAuthHeaders(),
//             timeout: this.timeout * 2, // Double timeout for batch operations
//           }
//         );
//         return response.data;
//       };

//       const result = await this.retryOperation(operation, 1); // Fewer retries for batch operations

//       return result;
//     } catch (error: any) {
//       console.error('❌ Batch AI evaluation failed:', error);
//       const errorInfo = this.handleEvaluationError(error);

//       return {
//         success: false,
//         message: errorInfo.message,
//         error: errorInfo.error,
//       };
//     }
//   }

//   // Get evaluation capabilities
//   async getCapabilities(): Promise<{
//     success: boolean;
//     data?: any;
//     message?: string;
//     error?: string;
//   }> {
//     try {
//       const response = await axios.get(`${this.baseUrl}/capabilities`, {
//         headers: this.getAuthHeaders(),
//         timeout: 10000, // Shorter timeout for info requests
//       });

//       return response.data;
//     } catch (error: any) {
//       console.error('❌ Failed to get AI capabilities:', error);
//       const errorInfo = this.handleEvaluationError(error);

//       return {
//         success: false,
//         message: errorInfo.message,
//         error: errorInfo.error,
//       };
//     }
//   }

//   // Get evaluation statistics for a form
//   async getFormStats(formId: string): Promise<{
//     success: boolean;
//     data?: any;
//     message?: string;
//     error?: string;
//   }> {
//     try {
//       if (!formId || formId.trim() === '') {
//         return {
//           success: false,
//           message: 'Form ID is required',
//           error: 'INVALID_INPUT',
//         };
//       }

//       const response = await axios.get(`${this.baseUrl}/stats/${formId}`, {
//         headers: this.getAuthHeaders(),
//         timeout: 10000,
//       });

//       return response.data;
//     } catch (error: any) {
//       console.error('❌ Failed to get form stats:', error);
//       const errorInfo = this.handleEvaluationError(error);

//       return {
//         success: false,
//         message: errorInfo.message,
//         error: errorInfo.error,
//       };
//     }
//   }

//   // Health check for AI service
//   async healthCheck(): Promise<{
//     success: boolean;
//     data?: any;
//     message?: string;
//     error?: string;
//   }> {
//     try {
//       const response = await axios.get(`${this.baseUrl}/health`, {
//         headers: this.getAuthHeaders(),
//         timeout: 5000, // Quick timeout for health checks
//       });

//       return response.data;
//     } catch (error: any) {
//       console.error('❌ AI service health check failed:', error);
//       const errorInfo = this.handleEvaluationError(error);

//       return {
//         success: false,
//         message: errorInfo.message,
//         error: errorInfo.error,
//       };
//     }
//   }

//   // Test AI evaluation (development only)
//   async testEvaluation(
//     formStructure: any,
//     submissionData: any
//   ): Promise<{
//     success: boolean;
//     data?: AIEvaluationResult;
//     message?: string;
//     error?: string;
//   }> {
//     try {
//       if (process.env.NODE_ENV === 'production') {
//         return {
//           success: false,
//           message: 'Test evaluation not available in production',
//           error: 'NOT_AVAILABLE',
//         };
//       }

//       const response = await axios.post(
//         `${this.baseUrl}/test`,
//         {
//           formStructure,
//           submissionData,
//         },
//         {
//           headers: this.getAuthHeaders(),
//           timeout: this.timeout,
//         }
//       );

//       return response.data;
//     } catch (error: any) {
//       console.error('❌ Test evaluation failed:', error);
//       const errorInfo = this.handleEvaluationError(error);

//       return {
//         success: false,
//         message: errorInfo.message,
//         error: errorInfo.error,
//       };
//     }
//   }

//   // Utility methods for error handling and user feedback

//   // Get user-friendly error message
//   getUserFriendlyErrorMessage(error: string): string {
//     const errorMessages: Record<string, string> = {
//       VALIDATION_ERROR:
//         'The submission data is invalid or incomplete. Please check the form structure.',
//       AUTH_ERROR: 'Please sign in again to continue.',
//       PERMISSION_ERROR:
//         'You do not have permission to evaluate this submission.',
//       NOT_FOUND_ERROR: 'The submission or form could not be found.',
//       RATE_LIMIT_ERROR:
//         'Too many evaluation requests. Please wait a moment before trying again.',
//       SERVICE_ERROR:
//         'The AI evaluation service is temporarily unavailable. Please try again later.',
//       SERVICE_OVERLOAD:
//         'The AI service is currently busy. Please try again in a few minutes.',
//       NETWORK_ERROR:
//         'Network connection issue. Please check your internet connection and try again.',
//       BATCH_SIZE_LIMIT:
//         'Too many submissions selected. Please select up to 20 submissions at a time.',
//       INVALID_INPUT:
//         'Invalid input provided. Please check your request and try again.',
//       UNKNOWN_ERROR:
//         'An unexpected error occurred. Please try again or contact support.',
//     };

//     return errorMessages[error] || errorMessages.UNKNOWN_ERROR;
//   }

//   // Check if an error is retryable
//   isRetryableError(error: string): boolean {
//     const retryableErrors = [
//       'RATE_LIMIT_ERROR',
//       'SERVICE_ERROR',
//       'SERVICE_OVERLOAD',
//       'NETWORK_ERROR',
//       'UNKNOWN_ERROR',
//     ];

//     return retryableErrors.includes(error);
//   }

//   // Get retry delay based on error type
//   getRetryDelay(error: string): number {
//     const delayMap: Record<string, number> = {
//       RATE_LIMIT_ERROR: 5000, // 5 seconds
//       SERVICE_ERROR: 3000, // 3 seconds
//       SERVICE_OVERLOAD: 10000, // 10 seconds
//       NETWORK_ERROR: 2000, // 2 seconds
//       UNKNOWN_ERROR: 3000, // 3 seconds
//     };

//     return delayMap[error] || 3000;
//   }
// }

// // Create and export singleton instance
// export const aiEvaluationService = new AIEvaluationService();

// export default aiEvaluationService;

// src/services/aiEvaluation.ts - Frontend Service with Enhanced Sentiment Validation
import axios from 'axios';
import { apiConfig } from '@/config/api';

export interface QuizEvaluationResult {
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
}

export interface SurveyEvaluationResult {
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
}

export interface FeedbackEvaluationResult {
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
}

export interface AIEvaluationResult {
  id: string;
  submissionId: string;
  formType: 'quiz' | 'survey' | 'feedback' | 'general';
  sentiment: 'positive' | 'neutral' | 'negative';
  categories: string[];
  evaluatedAt: string;
  status: 'completed' | 'failed';
  feedback: string;
  quizResults?: QuizEvaluationResult;
  surveyResults?: SurveyEvaluationResult;
  feedbackResults?: FeedbackEvaluationResult;
}

export interface EvaluationResponse {
  success: boolean;
  data?: AIEvaluationResult;
  message?: string;
  error?: string;
  metadata?: {
    evaluationTime: number;
    formId: string;
    formTitle: string;
    formType: string;
    evaluatedAt: string;
    version: string;
  };
}

export interface BatchEvaluationResponse {
  success: boolean;
  data?: AIEvaluationResult[];
  message?: string;
  error?: string;
  metadata?: {
    totalEvaluations: number;
    successful: number;
    failed: number;
    totalTime: number;
    avgTimePerSubmission: number;
    formId: string;
    formTitle: string;
    processedAt: string;
    version: string;
    errors?: Array<{
      submissionId: string;
      error: string;
    }>;
  };
}

class AIEvaluationService {
  private baseUrl: string;
  private timeout: number = 60000; // 60 seconds for AI operations

  constructor() {
    this.baseUrl = `${apiConfig.url}/ai-evaluation`;
  }

  // Utility function to validate sentiment percentages
  private validateSentimentPercentages(sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  }): boolean {
    const total = sentiment.positive + sentiment.neutral + sentiment.negative;
    const isValid = Math.abs(total - 100) <= 1; // Allow 1% tolerance for rounding

    if (!isValid) {
      console.warn(
        `⚠️ Sentiment percentages don't total 100%: ${total}%`,
        sentiment
      );
    }

    return isValid;
  }

  // Function to normalize sentiment percentages on frontend (as backup)
  private normalizeSentimentPercentages(sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  }): { positive: number; neutral: number; negative: number } {
    // Ensure all values are non-negative
    const positive = Math.max(0, sentiment.positive);
    const neutral = Math.max(0, sentiment.neutral);
    const negative = Math.max(0, sentiment.negative);

    const total = positive + neutral + negative;

    // If total is 0, default to neutral
    if (total === 0) {
      return { positive: 0, neutral: 100, negative: 0 };
    }

    // If total is already 100, return as is
    if (total === 100) {
      return { positive, neutral, negative };
    }

    // Normalize to exactly 100%
    const normalizedPositive = Math.round((positive / total) * 100);
    const normalizedNeutral = Math.round((neutral / total) * 100);
    const normalizedNegative = Math.round((negative / total) * 100);

    // Handle rounding discrepancies to ensure total is exactly 100
    const adjustedTotal =
      normalizedPositive + normalizedNeutral + normalizedNegative;
    let adjustedPositive = normalizedPositive;
    let adjustedNeutral = normalizedNeutral;
    let adjustedNegative = normalizedNegative;

    if (adjustedTotal !== 100) {
      const difference = 100 - adjustedTotal;

      // Add/subtract the difference to the largest component
      if (
        adjustedPositive >= adjustedNeutral &&
        adjustedPositive >= adjustedNegative
      ) {
        adjustedPositive += difference;
      } else if (adjustedNeutral >= adjustedNegative) {
        adjustedNeutral += difference;
      } else {
        adjustedNegative += difference;
      }
    }

    // Ensure values are within valid range
    return {
      positive: Math.max(0, Math.min(100, adjustedPositive)),
      neutral: Math.max(0, Math.min(100, adjustedNeutral)),
      negative: Math.max(0, Math.min(100, adjustedNegative)),
    };
  }

  // Process evaluation response and validate sentiment data
  private processEvaluationResponse(
    response: EvaluationResponse
  ): EvaluationResponse {
    if (!response.success || !response.data) {
      return response;
    }

    const evaluation = response.data;

    // Validate and fix survey sentiment if needed
    if (evaluation.surveyResults?.overallSentiment) {
      const sentiment = evaluation.surveyResults.overallSentiment;

      if (!this.validateSentimentPercentages(sentiment)) {
        console.warn('🔧 Fixing survey sentiment percentages on frontend');
        evaluation.surveyResults.overallSentiment =
          this.normalizeSentimentPercentages(sentiment);
      }
    }

    // Validate and fix feedback sentiment if needed
    if (evaluation.feedbackResults?.sentimentBreakdown) {
      const sentiment = evaluation.feedbackResults.sentimentBreakdown;

      if (!this.validateSentimentPercentages(sentiment)) {
        console.warn('🔧 Fixing feedback sentiment percentages on frontend');
        evaluation.feedbackResults.sentimentBreakdown =
          this.normalizeSentimentPercentages(sentiment);
      }
    }

    return response;
  }

  // Enhanced error handling for AI evaluation responses
  private handleEvaluationError(error: any): {
    success: false;
    message: string;
    error: string;
    isRetryable: boolean;
  } {
    console.error('❌ AI Evaluation Error:', error);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          return {
            success: false,
            message: data.message || 'Invalid request data',
            error: 'VALIDATION_ERROR',
            isRetryable: false,
          };
        case 401:
          return {
            success: false,
            message: 'Authentication required',
            error: 'AUTH_ERROR',
            isRetryable: false,
          };
        case 403:
          return {
            success: false,
            message: 'Not authorized to evaluate this submission',
            error: 'PERMISSION_ERROR',
            isRetryable: false,
          };
        case 404:
          return {
            success: false,
            message: 'Submission or form not found',
            error: 'NOT_FOUND_ERROR',
            isRetryable: false,
          };
        case 429:
          return {
            success: false,
            message: 'Too many requests. Please wait a moment and try again.',
            error: 'RATE_LIMIT_ERROR',
            isRetryable: true,
          };
        case 500:
          return {
            success: false,
            message:
              'AI evaluation service temporarily unavailable. Please try again later.',
            error: 'SERVICE_ERROR',
            isRetryable: true,
          };
        case 503:
          return {
            success: false,
            message:
              'AI service is currently overloaded. Please try again in a few minutes.',
            error: 'SERVICE_OVERLOAD',
            isRetryable: true,
          };
        default:
          return {
            success: false,
            message: `Unexpected error (${status}): ${
              data.message || 'Unknown error'
            }`,
            error: 'UNKNOWN_ERROR',
            isRetryable: true,
          };
      }
    } else if (error.request) {
      return {
        success: false,
        message: 'Network error: Unable to connect to AI evaluation service',
        error: 'NETWORK_ERROR',
        isRetryable: true,
      };
    } else {
      return {
        success: false,
        message: 'Request setup error: ' + error.message,
        error: 'REQUEST_ERROR',
        isRetryable: false,
      };
    }
  }

  // Get authentication headers
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Enhanced retry logic for AI operations
  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 2,
    baseDelay: number = 2000
  ): Promise<T> {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        const errorInfo = this.handleEvaluationError(error);

        // Don't retry if it's not a retryable error
        if (!errorInfo.isRetryable || attempt === maxRetries) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  // Evaluate a single submission
  async evaluateSubmission(submissionId: string): Promise<EvaluationResponse> {
    try {
      if (!submissionId || submissionId.trim() === '') {
        return {
          success: false,
          message: 'Submission ID is required',
          error: 'INVALID_INPUT',
        };
      }

      const operation = async () => {
        const response = await axios.post(
          `${this.baseUrl}/evaluate/${submissionId}`,
          {},
          {
            headers: this.getAuthHeaders(),
            timeout: this.timeout,
          }
        );
        return response.data;
      };

      const result = await this.retryOperation(operation);

      // Process and validate the response
      return this.processEvaluationResponse(result);
    } catch (error: any) {
      console.error('❌ AI evaluation failed:', error);
      const errorInfo = this.handleEvaluationError(error);

      return {
        success: false,
        message: errorInfo.message,
        error: errorInfo.error,
      };
    }
  }

  // Batch evaluate multiple submissions
  async evaluateBatch(
    formId: string,
    submissionIds: string[]
  ): Promise<BatchEvaluationResponse> {
    try {
      if (!formId || !submissionIds || submissionIds.length === 0) {
        return {
          success: false,
          message: 'Form ID and submission IDs are required',
          error: 'INVALID_INPUT',
        };
      }

      if (submissionIds.length > 20) {
        return {
          success: false,
          message: 'Maximum 20 submissions can be evaluated at once',
          error: 'BATCH_SIZE_LIMIT',
        };
      }

      const operation = async () => {
        const response = await axios.post(
          `${this.baseUrl}/evaluate-batch`,
          {
            formId,
            submissionIds,
          },
          {
            headers: this.getAuthHeaders(),
            timeout: this.timeout * 2, // Double timeout for batch operations
          }
        );
        return response.data;
      };

      const result = await this.retryOperation(operation, 1); // Fewer retries for batch operations

      // Process batch results and validate sentiment data
      if (result.success && result.data && Array.isArray(result.data)) {
        result.data.forEach((evaluation: AIEvaluationResult) => {
          // Validate and fix survey sentiment if needed
          if (evaluation.surveyResults?.overallSentiment) {
            const sentiment = evaluation.surveyResults.overallSentiment;

            if (!this.validateSentimentPercentages(sentiment)) {
              console.warn(
                `🔧 Fixing survey sentiment for submission ${evaluation.submissionId}`
              );
              evaluation.surveyResults.overallSentiment =
                this.normalizeSentimentPercentages(sentiment);
            }
          }

          // Validate and fix feedback sentiment if needed
          if (evaluation.feedbackResults?.sentimentBreakdown) {
            const sentiment = evaluation.feedbackResults.sentimentBreakdown;

            if (!this.validateSentimentPercentages(sentiment)) {
              console.warn(
                `🔧 Fixing feedback sentiment for submission ${evaluation.submissionId}`
              );
              evaluation.feedbackResults.sentimentBreakdown =
                this.normalizeSentimentPercentages(sentiment);
            }
          }
        });
      }

      return result;
    } catch (error: any) {
      console.error('❌ Batch AI evaluation failed:', error);
      const errorInfo = this.handleEvaluationError(error);

      return {
        success: false,
        message: errorInfo.message,
        error: errorInfo.error,
      };
    }
  }

  // Get evaluation capabilities
  async getCapabilities(): Promise<{
    success: boolean;
    data?: any;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await axios.get(`${this.baseUrl}/capabilities`, {
        headers: this.getAuthHeaders(),
        timeout: 10000, // Shorter timeout for info requests
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get AI capabilities:', error);
      const errorInfo = this.handleEvaluationError(error);

      return {
        success: false,
        message: errorInfo.message,
        error: errorInfo.error,
      };
    }
  }

  // Get evaluation statistics for a form
  async getFormStats(formId: string): Promise<{
    success: boolean;
    data?: any;
    message?: string;
    error?: string;
  }> {
    try {
      if (!formId || formId.trim() === '') {
        return {
          success: false,
          message: 'Form ID is required',
          error: 'INVALID_INPUT',
        };
      }

      const response = await axios.get(`${this.baseUrl}/stats/${formId}`, {
        headers: this.getAuthHeaders(),
        timeout: 10000,
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get form stats:', error);
      const errorInfo = this.handleEvaluationError(error);

      return {
        success: false,
        message: errorInfo.message,
        error: errorInfo.error,
      };
    }
  }

  // Health check for AI service
  async healthCheck(): Promise<{
    success: boolean;
    data?: any;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        headers: this.getAuthHeaders(),
        timeout: 5000, // Quick timeout for health checks
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ AI service health check failed:', error);
      const errorInfo = this.handleEvaluationError(error);

      return {
        success: false,
        message: errorInfo.message,
        error: errorInfo.error,
      };
    }
  }

  // Test AI evaluation (development only)
  async testEvaluation(
    formStructure: any,
    submissionData: any
  ): Promise<{
    success: boolean;
    data?: AIEvaluationResult;
    message?: string;
    error?: string;
  }> {
    try {
      if (process.env.NODE_ENV === 'production') {
        return {
          success: false,
          message: 'Test evaluation not available in production',
          error: 'NOT_AVAILABLE',
        };
      }

      const response = await axios.post(
        `${this.baseUrl}/test`,
        {
          formStructure,
          submissionData,
        },
        {
          headers: this.getAuthHeaders(),
          timeout: this.timeout,
        }
      );

      const result = response.data;

      // Process and validate test result
      return this.processEvaluationResponse(result);
    } catch (error: any) {
      console.error('❌ Test evaluation failed:', error);
      const errorInfo = this.handleEvaluationError(error);

      return {
        success: false,
        message: errorInfo.message,
        error: errorInfo.error,
      };
    }
  }

  // Utility methods for sentiment analysis validation

  // Check if sentiment breakdown is accurate
  isSentimentAccurate(sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  }): boolean {
    return this.validateSentimentPercentages(sentiment);
  }

  // Get sentiment summary for display
  getSentimentSummary(sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  }): {
    dominant: 'positive' | 'neutral' | 'negative';
    description: string;
    isBalanced: boolean;
  } {
    const { positive, neutral, negative } = sentiment;

    // Determine dominant sentiment
    let dominant: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (positive > neutral && positive > negative) {
      dominant = 'positive';
    } else if (negative > neutral && negative > positive) {
      dominant = 'negative';
    }

    // Generate description
    let description = '';
    if (positive >= 80) {
      description = 'Overwhelmingly positive response';
    } else if (positive >= 60) {
      description = 'Mostly positive response';
    } else if (negative >= 80) {
      description = 'Overwhelmingly negative response';
    } else if (negative >= 60) {
      description = 'Mostly negative response';
    } else if (neutral >= 60) {
      description = 'Neutral response';
    } else {
      description = 'Mixed response with varying sentiments';
    }

    // Check if balanced (no single sentiment > 50%)
    const isBalanced = positive <= 50 && neutral <= 50 && negative <= 50;

    return {
      dominant,
      description,
      isBalanced,
    };
  }

  // Format sentiment for display
  formatSentimentDisplay(sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  }): string {
    return `${sentiment.positive}% Positive, ${sentiment.neutral}% Neutral, ${sentiment.negative}% Negative`;
  }

  // Utility methods for error handling and user feedback

  // Get user-friendly error message
  getUserFriendlyErrorMessage(error: string): string {
    const errorMessages: Record<string, string> = {
      VALIDATION_ERROR:
        'The submission data is invalid or incomplete. Please check the form structure.',
      AUTH_ERROR: 'Please sign in again to continue.',
      PERMISSION_ERROR:
        'You do not have permission to evaluate this submission.',
      NOT_FOUND_ERROR: 'The submission or form could not be found.',
      RATE_LIMIT_ERROR:
        'Too many evaluation requests. Please wait a moment before trying again.',
      SERVICE_ERROR:
        'The AI evaluation service is temporarily unavailable. Please try again later.',
      SERVICE_OVERLOAD:
        'The AI service is currently busy. Please try again in a few minutes.',
      NETWORK_ERROR:
        'Network connection issue. Please check your internet connection and try again.',
      BATCH_SIZE_LIMIT:
        'Too many submissions selected. Please select up to 20 submissions at a time.',
      INVALID_INPUT:
        'Invalid input provided. Please check your request and try again.',
      UNKNOWN_ERROR:
        'An unexpected error occurred. Please try again or contact support.',
    };

    return errorMessages[error] || errorMessages.UNKNOWN_ERROR;
  }

  // Check if an error is retryable
  isRetryableError(error: string): boolean {
    const retryableErrors = [
      'RATE_LIMIT_ERROR',
      'SERVICE_ERROR',
      'SERVICE_OVERLOAD',
      'NETWORK_ERROR',
      'UNKNOWN_ERROR',
    ];

    return retryableErrors.includes(error);
  }

  // Get retry delay based on error type
  getRetryDelay(error: string): number {
    const delayMap: Record<string, number> = {
      RATE_LIMIT_ERROR: 5000, // 5 seconds
      SERVICE_ERROR: 3000, // 3 seconds
      SERVICE_OVERLOAD: 10000, // 10 seconds
      NETWORK_ERROR: 2000, // 2 seconds
      UNKNOWN_ERROR: 3000, // 3 seconds
    };

    return delayMap[error] || 3000;
  }

  // Validation helpers for sentiment data
  validateEvaluationResult(evaluation: AIEvaluationResult): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check survey sentiment if present
    if (evaluation.surveyResults?.overallSentiment) {
      if (
        !this.validateSentimentPercentages(
          evaluation.surveyResults.overallSentiment
        )
      ) {
        issues.push('Survey sentiment percentages do not total 100%');
      }
    }

    // Check feedback sentiment if present
    if (evaluation.feedbackResults?.sentimentBreakdown) {
      if (
        !this.validateSentimentPercentages(
          evaluation.feedbackResults.sentimentBreakdown
        )
      ) {
        issues.push('Feedback sentiment percentages do not total 100%');
      }
    }

    // Check basic evaluation structure
    if (!evaluation.id || !evaluation.submissionId) {
      issues.push('Missing required evaluation identifiers');
    }

    if (
      !['quiz', 'survey', 'feedback', 'general'].includes(evaluation.formType)
    ) {
      issues.push('Invalid form type');
    }

    if (!['positive', 'neutral', 'negative'].includes(evaluation.sentiment)) {
      issues.push('Invalid overall sentiment');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}

// Create and export singleton instance
export const aiEvaluationService = new AIEvaluationService();

export default aiEvaluationService;
