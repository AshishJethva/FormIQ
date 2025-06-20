// Backend: src/utils/aiLogger.ts
export class AILogger {
  static logGeneration(data: {
    userId: string;
    prompt: string;
    success: boolean;
    generationTime: number;
    fieldCount?: number;
    error?: string;
  }) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'AI_FORM_GENERATION',
      userId: data.userId,
      promptLength: data.prompt.length,
      success: data.success,
      generationTime: data.generationTime,
      fieldCount: data.fieldCount || 0,
      error: data.error,
    };

    if (!data.success) {
      console.error('AI Generation Failed:', logEntry);
    }
  }
}
