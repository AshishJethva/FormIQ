// src/types/submission.ts - Backend Types for Form Submission
export interface FormSubmission {
  _id: string;
  formId?: string;
  data: Record<string, any>;
  submittedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}
