// src/types/submission.ts
export interface FormSubmission {
  _id: string;
  formId?: string;
  data: Record<string, any>;
  submittedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}