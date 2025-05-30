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

    if (data.success) {
      console.log('✅ AI Generation Success:', logEntry);
    } else {
      console.error('❌ AI Generation Failed:', logEntry);
    }

    // In production, you might want to send this to a logging service
    // like Winston, DataDog, or CloudWatch
  }

  static logUsage(userId: string, action: string, metadata?: any) {
    console.log('📊 AI Usage:', {
      timestamp: new Date().toISOString(),
      userId,
      action,
      metadata,
    });
  }
}
