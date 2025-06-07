// // src/components/form-builder/submissions/FormSubmissionsPage.tsx
// import React, { useState, useEffect, useCallback } from 'react';
// import { useParams } from 'next/navigation';
// import { useDeletion } from '@/hooks/useDeletion';
// import {
//   Download,
//   Search,
//   Eye,
//   EyeOff,
//   Calendar,
//   User,
//   Mail,
//   Clock,
//   CheckCircle,
//   XCircle,
//   AlertCircle,
//   Trash2,
//   Brain,
//   Loader2,
//   Star,
//   AlertTriangle,
//   Hash,
//   IdCard,
//   FileText,
//   Image as ImageIcon,
//   Video,
//   Music,
//   Archive,
// } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table';

// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog';
// import {
//   AlertDialog,
//   AlertDialogContent,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogFooter,
//   AlertDialogAction,
//   AlertDialogCancel,
// } from '@/components/ui/alert-dialog';
// import { toast } from 'sonner';
// import {
//   submissionsService,
//   type Submission,
//   type SubmissionStats,
//   type PaginationInfo,
// } from '@/services/submissions';
// import { formsService } from '@/services/forms';
// import { formatFileSize } from '@/services/fileUploadService';
// import FileManager from '@/components/form-builder/FileManager';
// import {
//   aiEvaluationService,
//   type AIEvaluationResult,
// } from '@/services/aiEvaluation';
// import { apiConfig } from '@/config/api';
// import axios from 'axios';

// // ===== UTILITY FUNCTIONS =====
// const formatDateTime = (dateString: string): string => {
//   if (!dateString) return 'Unknown';
//   try {
//     const date = new Date(dateString);
//     return date.toLocaleString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//     });
//   } catch {
//     return 'Invalid Date';
//   }
// };

// const formatTimeAgo = (dateString: string): string => {
//   if (!dateString) return 'Unknown';
//   try {
//     const date = new Date(dateString);
//     const now = new Date();
//     const diffInMs = now.getTime() - date.getTime();
//     const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
//     const diffInHours = Math.floor(diffInMinutes / 60);
//     const diffInDays = Math.floor(diffInHours / 24);

//     if (diffInMinutes < 1) return 'Just now';
//     if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
//     if (diffInHours < 24) return `${diffInHours}h ago`;
//     if (diffInDays < 30) return `${diffInDays}d ago`;

//     return date.toLocaleDateString();
//   } catch {
//     return 'Invalid Date';
//   }
// };

// // Enhanced function to format display value beautifully
// const formatDisplayValue = (value: any): string => {
//   if (value === null || value === undefined || value === '') {
//     return 'N/A';
//   }

//   if (typeof value === 'string') {
//     return value.trim();
//   }

//   if (typeof value === 'number') {
//     return value.toString();
//   }

//   if (typeof value === 'boolean') {
//     return value ? 'Yes' : 'No';
//   }

//   if (Array.isArray(value)) {
//     return value
//       .map(item => {
//         if (typeof item === 'object' && item !== null) {
//           if (item.label && item.value) {
//             return item.label;
//           }
//           if (item.firstName && item.lastName) {
//             return `${item.firstName} ${item.lastName}`;
//           }
//           if (item.originalName) {
//             return item.originalName;
//           }
//           return Object.values(item).join(' ');
//         }
//         return String(item);
//       })
//       .join(', ');
//   }

//   if (typeof value === 'object') {
//     if (value.firstName && value.lastName) {
//       return `${value.firstName} ${value.lastName}`.trim();
//     }

//     if (value.street || value.city || value.state || value.zipCode) {
//       const addressParts = [
//         value.street,
//         value.city,
//         value.state,
//         value.zipCode,
//         value.country,
//       ].filter(part => part && part.trim());
//       return addressParts.join(', ');
//     }

//     if (value.countryCode && value.number) {
//       return `${value.countryCode} ${value.number}`;
//     }

//     if (value.label && value.value) {
//       return value.label;
//     }

//     if (value.originalName && value.url) {
//       return value.originalName;
//     }

//     if (value.date || value.time) {
//       const datePart = value.date
//         ? new Date(value.date).toLocaleDateString()
//         : '';
//       const timePart = value.time || '';
//       return `${datePart} ${timePart}`.trim();
//     }

//     const meaningfulValues = Object.entries(value)
//       .filter(
//         ([key, val]) =>
//           val !== null &&
//           val !== undefined &&
//           val !== '' &&
//           !key.startsWith('_') &&
//           key !== 'id' &&
//           key !== 'createdAt' &&
//           key !== 'updatedAt'
//       )
//       .map(([, val]) => {
//         if (typeof val === 'object') {
//           return formatDisplayValue(val);
//         }
//         return String(val);
//       })
//       .filter(val => val && val !== 'N/A');

//     return meaningfulValues.length > 0 ? meaningfulValues.join(', ') : 'N/A';
//   }

//   return String(value);
// };

// // ===== AI EVALUATION TYPES =====
// type AIEvaluation = AIEvaluationResult;

// // ===== UNIQUE FIELD TYPES =====
// interface UniqueField {
//   fieldId: string;
//   label: string;
//   type:
//     | 'enrollment'
//     | 'student_id'
//     | 'employee_id'
//     | 'user_id'
//     | 'roll_number'
//     | 'custom_id';
//   icon: React.ReactNode;
//   priority: number;
// }

// // ===== FILE HANDLING FUNCTIONS =====
// // Enhanced function to get files for a specific field from submission.files array
// const getFilesForField = (submission: Submission, fieldId: string): any[] => {
//   if (!submission.files || !Array.isArray(submission.files)) return [];

//   return submission.files.filter((file: any) => file.fieldId === fieldId);
// };

// // Check if a field has files (either in files array or data object)
// const fieldHasFiles = (submission: Submission, fieldId: string): boolean => {
//   // Check submission.files array first
//   const filesFromArray = getFilesForField(submission, fieldId);
//   if (filesFromArray.length > 0) return true;

//   // Check data object for legacy file storage
//   const value = submission.data[fieldId];
//   if (!value) return false;

//   // Check for file-like objects
//   if (typeof value === 'object' && !Array.isArray(value)) {
//     return (
//       !!(value.originalName && value.url) || !!(value.fileName && value.url)
//     );
//   }

//   if (Array.isArray(value) && value.length > 0) {
//     const firstItem = value[0];
//     return (
//       !!(firstItem?.originalName && firstItem?.url) ||
//       !!(firstItem?.fileName && firstItem?.url)
//     );
//   }

//   return false;
// };

// // Get all files for a field from both sources
// const getAllFilesForField = (
//   submission: Submission,
//   fieldId: string
// ): any[] => {
//   const filesFromArray = getFilesForField(submission, fieldId);

//   // If we have files in the files array, use those
//   if (filesFromArray.length > 0) {
//     return filesFromArray;
//   }

//   // Otherwise check data object for legacy files
//   const value = submission.data[fieldId];
//   if (!value) return [];

//   if (Array.isArray(value)) {
//     return value.filter(item => item?.originalName && item?.url);
//   }

//   if (typeof value === 'object' && value.originalName && value.url) {
//     return [value];
//   }

//   return [];
// };

// // Enhanced file type detection
// const getFileTypeInfo = (mimeType: string) => {
//   if (mimeType.startsWith('image/')) {
//     return { type: 'image', icon: ImageIcon, color: 'blue' };
//   } else if (mimeType.startsWith('video/')) {
//     return { type: 'video', icon: Video, color: 'purple' };
//   } else if (mimeType.startsWith('audio/')) {
//     return { type: 'audio', icon: Music, color: 'green' };
//   } else if (mimeType.includes('pdf')) {
//     return { type: 'pdf', icon: FileText, color: 'red' };
//   } else if (mimeType.includes('zip') || mimeType.includes('rar')) {
//     return { type: 'archive', icon: Archive, color: 'orange' };
//   } else {
//     return { type: 'file', icon: FileText, color: 'gray' };
//   }
// };

// // ===== FORM TYPE DETECTION =====
// // Add this function before the FormSubmissionsPage component
// const detectFormTypeClient = (
//   formData: any
// ): 'quiz' | 'survey' | 'feedback' | 'general' => {
//   const formTitle = formData?.title?.toLowerCase() || '';
//   const formDescription = formData?.description?.toLowerCase() || '';

//   let quizIndicators = 0;
//   let surveyIndicators = 0;
//   let feedbackIndicators = 0;

//   // Analyze title and description
//   if (
//     /quiz|test|exam|assessment|question/.test(formTitle + ' ' + formDescription)
//   ) {
//     quizIndicators += 3;
//   }
//   if (
//     /survey|poll|research|opinion|rate/.test(formTitle + ' ' + formDescription)
//   ) {
//     surveyIndicators += 3;
//   }
//   if (
//     /feedback|review|comment|experience|improve/.test(
//       formTitle + ' ' + formDescription
//     )
//   ) {
//     feedbackIndicators += 3;
//   }

//   // Analyze form fields
//   if (formData?.pages) {
//     formData.pages.forEach((page: any) => {
//       if (page.fields) {
//         page.fields.forEach((field: any) => {
//           const fieldLabel = field.label?.toLowerCase() || '';

//           // Quiz patterns
//           if (
//             field.type === 'singleChoice' ||
//             field.type === 'multipleChoice'
//           ) {
//             if (/correct|answer|choose|select|true|false/.test(fieldLabel)) {
//               quizIndicators += 2;
//             }
//           }

//           // Survey patterns
//           if (
//             field.type === 'rating' ||
//             field.type === 'scale' ||
//             fieldLabel.includes('rate')
//           ) {
//             surveyIndicators += 2;
//           }

//           // Feedback patterns
//           if (field.type === 'longText' || field.type === 'paragraph') {
//             if (
//               /feedback|comment|improve|experience|suggest|issue|problem/.test(
//                 fieldLabel
//               )
//             ) {
//               feedbackIndicators += 2;
//             }
//           }
//         });
//       }
//     });
//   }

//   // Determine form type based on highest score
//   if (quizIndicators >= 3) return 'quiz';
//   if (surveyIndicators >= 3) return 'survey';
//   if (feedbackIndicators >= 3) return 'feedback';

//   return 'general';
// };

// // ===== MAIN COMPONENT =====
// const FormSubmissionsPage: React.FC = () => {
//   const params = useParams();
//   const formId = params?.formId as string;

//   const [submissions, setSubmissions] = useState<Submission[]>([]);
//   const [formStructure, setFormStructure] = useState<any>(null);
//   const [fieldLabelsMap, setFieldLabelsMap] = useState<Record<string, string>>(
//     {}
//   );
//   const [stats, setStats] = useState<SubmissionStats>({
//     total: 0,
//     unread: 0,
//     pending: 0,
//     processed: 0,
//     failed: 0,
//   });
//   const [pagination, setPagination] = useState<PaginationInfo>({
//     current: 1,
//     pages: 1,
//     total: 0,
//     limit: 20,
//   });
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilter, setStatusFilter] = useState<string>('all');
//   const [readFilter, setReadFilter] = useState<string>('all');
//   const [selectedSubmission, setSelectedSubmission] =
//     useState<Submission | null>(null);
//   const [showSubmissionModal, setShowSubmissionModal] = useState(false);
//   const [downloadingCsv, setDownloadingCsv] = useState(false);
//   const [downloadingFileId, setDownloadingFileId] = useState<string | null>(
//     null
//   );

//   // AI Evaluation state
//   const [aiEvaluations, setAiEvaluations] = useState<
//     Record<string, AIEvaluation>
//   >({});
//   const [evaluatingSubmissions, setEvaluatingSubmissions] = useState<
//     Set<string>
//   >(new Set());

//   // Delete confirmation state
//   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
//   const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(
//     null
//   );

//   // Form analysis state
//   const [uniqueFields, setUniqueFields] = useState<UniqueField[]>([]);
//   const [hasEmailField, setHasEmailField] = useState(false);
//   const [hasFullNameField, setHasFullNameField] = useState(false);
//   const [isFeedbackForm, setIsFeedbackForm] = useState(false);

//   // Initialize deletion hook for submissions
//   const { isDeleting: isDeletingSubmissions, deleteItems: deleteSubmissions } =
//     useDeletion({
//       type: 'submission',
//       requireConfirmation: true,
//       onSuccess: result => {
//         console.log(' Submissions deletion completed:', result);
//         fetchSubmissions(); // Refresh submissions list
//       },
//       onError: error => {
//         console.error('❌ Submissions deletion failed:', error);
//       },
//     });

//   // Function to detect unique identifier fields
//   const detectUniqueFields = (formData: any): UniqueField[] => {
//     const uniqueFields: UniqueField[] = [];

//     if (formData?.pages && Array.isArray(formData.pages)) {
//       formData.pages.forEach((page: any) => {
//         if (page.fields && Array.isArray(page.fields)) {
//           page.fields.forEach((field: any) => {
//             if (!field.id || !field.label) return;

//             const fieldLabel = field.label.toLowerCase();
//             const fieldId = field.id.toLowerCase();

//             const uniquePatterns = [
//               {
//                 patterns: [
//                   'enrollment number',
//                   'enrollment no',
//                   'enrollment id',
//                   'enroll no',
//                 ],
//                 type: 'enrollment' as const,
//                 icon: <Hash className='w-4 h-4' />,
//                 priority: 1,
//               },
//               {
//                 patterns: [
//                   'student id',
//                   'student number',
//                   'student no',
//                   'student_id',
//                   'studentid',
//                 ],
//                 type: 'student_id' as const,
//                 icon: <IdCard className='w-4 h-4' />,
//                 priority: 2,
//               },
//               {
//                 patterns: [
//                   'roll number',
//                   'roll no',
//                   'roll_number',
//                   'rollno',
//                   'roll_no',
//                 ],
//                 type: 'roll_number' as const,
//                 icon: <Hash className='w-4 h-4' />,
//                 priority: 3,
//               },
//               {
//                 patterns: [
//                   'employee id',
//                   'employee number',
//                   'employee no',
//                   'emp id',
//                   'emp_id',
//                   'employeeid',
//                 ],
//                 type: 'employee_id' as const,
//                 icon: <IdCard className='w-4 h-4' />,
//                 priority: 4,
//               },
//               {
//                 patterns: [
//                   'user id',
//                   'user number',
//                   'user no',
//                   'userid',
//                   'user_id',
//                 ],
//                 type: 'user_id' as const,
//                 icon: <User className='w-4 h-4' />,
//                 priority: 5,
//               },
//               {
//                 patterns: [
//                   'id number',
//                   'id no',
//                   'identification',
//                   'reg no',
//                   'registration number',
//                 ],
//                 type: 'custom_id' as const,
//                 icon: <Hash className='w-4 h-4' />,
//                 priority: 6,
//               },
//             ];

//             for (const pattern of uniquePatterns) {
//               const isMatch = pattern.patterns.some(
//                 p =>
//                   fieldLabel.includes(p) ||
//                   fieldId.includes(p.replace(/\s+/g, ''))
//               );

//               if (isMatch) {
//                 uniqueFields.push({
//                   fieldId: field.id,
//                   label: field.label,
//                   type: pattern.type,
//                   icon: pattern.icon,
//                   priority: pattern.priority,
//                 });
//                 break;
//               }
//             }
//           });
//         }
//       });
//     }

//     return uniqueFields.sort((a, b) => a.priority - b.priority).slice(0, 2);
//   };

//   // Function to analyze form structure
//   const analyzeFormStructure = (formData: any) => {
//     let emailFound = false;
//     let fullNameFound = false;

//     const labelsMap: Record<string, string> = {};
//     const detectedUniqueFields = detectUniqueFields(formData);
//     setUniqueFields(detectedUniqueFields);

//     // Detect if this form should be auto-evaluated
//     const formType = detectFormTypeClient(formData);
//     const shouldEvaluate = ['quiz', 'survey', 'feedback'].includes(formType);
//     setIsFeedbackForm(shouldEvaluate);

//     if (formData?.pages && Array.isArray(formData.pages)) {
//       formData.pages.forEach((page: any) => {
//         if (page.fields && Array.isArray(page.fields)) {
//           page.fields.forEach((field: any) => {
//             if (field.id && field.label) {
//               labelsMap[field.id] = field.label;
//             }

//             if (
//               detectedUniqueFields.length < 2 &&
//               field.required &&
//               (field.type === 'email' ||
//                 field.label?.toLowerCase().includes('email'))
//             ) {
//               emailFound = true;
//             }

//             if (
//               detectedUniqueFields.length < 1 &&
//               field.required &&
//               (field.label?.toLowerCase().includes('full name') ||
//                 field.label?.toLowerCase().includes('name'))
//             ) {
//               fullNameFound = true;
//             }
//           });
//         }
//       });
//     }

//     if (detectedUniqueFields.length === 0) {
//       setHasEmailField(emailFound);
//       setHasFullNameField(fullNameFound);
//     } else if (detectedUniqueFields.length === 1) {
//       setHasEmailField(emailFound);
//       setHasFullNameField(false);
//     } else {
//       setHasEmailField(false);
//       setHasFullNameField(false);
//     }

//     setFieldLabelsMap(labelsMap);
//     return labelsMap;
//   };

//   // Enhanced function to get value from submission by field ID
//   const getFieldValueFromSubmission = (
//     submission: Submission,
//     fieldId: string
//   ): string => {
//     const data = submission.data;
//     const value = data[fieldId];
//     return formatDisplayValue(value);
//   };

//   // Function to get email value from submission
//   const getEmailFromSubmission = (submission: Submission): string => {
//     const data = submission.data;

//     for (const [key, value] of Object.entries(data)) {
//       if (
//         key.toLowerCase().includes('email') ||
//         fieldLabelsMap[key]?.toLowerCase().includes('email')
//       ) {
//         return formatDisplayValue(value);
//       }
//     }

//     return 'N/A';
//   };

//   // Enhanced function to get full name from submission
//   const getFullNameFromSubmission = (submission: Submission): string => {
//     const data = submission.data;

//     for (const [key, value] of Object.entries(data)) {
//       const label = fieldLabelsMap[key]?.toLowerCase() || key.toLowerCase();

//       if (label.includes('full name') || label === 'name') {
//         return formatDisplayValue(value);
//       }
//     }

//     let firstName = '';
//     let lastName = '';

//     for (const [key, value] of Object.entries(data)) {
//       const label = fieldLabelsMap[key]?.toLowerCase() || key.toLowerCase();

//       if (label.includes('first name') || label === 'firstname') {
//         firstName = formatDisplayValue(value);
//       } else if (label.includes('last name') || label === 'lastname') {
//         lastName = formatDisplayValue(value);
//       }
//     }

//     if (firstName !== 'N/A' || lastName !== 'N/A') {
//       return (
//         `${firstName !== 'N/A' ? firstName : ''} ${
//           lastName !== 'N/A' ? lastName : ''
//         }`.trim() || 'N/A'
//       );
//     }

//     return 'N/A';
//   };

//   // Function to fetch form structure
//   const fetchFormStructure = useCallback(async () => {
//     if (!formId) return;

//     try {
//       console.log('📋 Fetching form structure for:', formId);
//       const response = await formsService.getForm(formId);
//       if (response.success && response.data) {
//         setFormStructure(response.data);
//         analyzeFormStructure(response.data);
//         console.log(' Form structure fetched and analyzed');
//       }
//     } catch (error) {
//       console.error('❌ Error fetching form structure:', error);
//     }
//   }, [formId]);

//   // Function to evaluate submission with AI
//   const evaluateSubmissionWithAI = async (submission: Submission) => {
//     if (evaluatingSubmissions.has(submission.id)) return;

//     setEvaluatingSubmissions(prev => new Set(prev).add(submission.id));

//     try {
//       console.log(
//         '🤖 Starting real AI evaluation for submission:',
//         submission.id
//       );

//       const result = await aiEvaluationService.evaluateSubmission(
//         submission.id
//       );

//       if (result.success && result.data) {
//         setAiEvaluations(prev => ({
//           ...prev,
//           [submission.id]: result.data as AIEvaluation,
//         }));
//         console.log(' AI evaluation completed for submission:', submission.id);
//       } else {
//         throw new Error(result.error || 'Evaluation failed');
//       }
//     } catch (error: any) {
//       console.error('❌ Error in AI evaluation:', error);
//       setAiEvaluations(prev => ({
//         ...prev,
//         [submission.id]: {
//           id: `eval_${submission.id}`,
//           submissionId: submission.id,
//           formType: 'general',
//           sentiment: 'neutral',
//           categories: [],
//           evaluatedAt: new Date().toISOString(),
//           status: 'failed',
//           feedback: 'Evaluation failed: ' + error.message,
//         },
//       }));
//     } finally {
//       setEvaluatingSubmissions(prev => {
//         const newSet = new Set(prev);
//         newSet.delete(submission.id);
//         return newSet;
//       });
//     }
//   };

//   // Add batch evaluation function:
//   const evaluateMultipleSubmissions = async (submissionIds: string[]) => {
//     if (!formId) return;

//     try {
//       console.log(
//         '🤖 Starting batch AI evaluation for',
//         submissionIds.length,
//         'submissions'
//       );

//       const result = await aiEvaluationService.evaluateBatch(
//         formId,
//         submissionIds
//       );

//       if (result.success && result.data) {
//         const evaluationsMap: Record<string, AIEvaluation> = {};
//         result.data.forEach(evaluation => {
//           evaluationsMap[evaluation.submissionId] = evaluation;
//         });

//         setAiEvaluations(prev => ({
//           ...prev,
//           ...evaluationsMap,
//         }));

//         console.log(' Batch AI evaluation completed');
//       }
//     } catch (error) {
//       console.error('❌ Batch evaluation error:', error);
//     }
//   };

//   // API call to fetch submissions
//   const fetchSubmissions = useCallback(
//     async (page = 1, limit = 20) => {
//       if (!formId) {
//         setLoading(false);
//         return;
//       }

//       try {
//         console.log('📡 Fetching submissions for form:', formId);

//         const filters = {
//           page,
//           limit,
//           sortBy: 'submittedAt',
//           sortOrder: 'desc' as const,
//           ...(searchTerm && { search: searchTerm }),
//           ...(statusFilter !== 'all' && { status: statusFilter }),
//           ...(readFilter !== 'all' && {
//             isRead: readFilter === 'read' ? 'true' : 'false',
//           }),
//         };

//         const response = await submissionsService.getSubmissions(
//           formId,
//           filters
//         );

//         if (response.success) {
//           const processedSubmissions = (response.data.submissions || []).map(
//             (submission: any) => {
//               const id = submission.id || submission._id;
//               if (!id) {
//                 console.warn('⚠️ Submission missing ID:', submission);
//               }

//               return {
//                 ...submission,
//                 id: id ? String(id) : '',
//               };
//             }
//           );

//           setSubmissions(processedSubmissions);
//           setStats(
//             response.data.stats || {
//               total: 0,
//               unread: 0,
//               pending: 0,
//               processed: 0,
//               failed: 0,
//             }
//           );
//           setPagination(
//             response.data.pagination || {
//               current: 1,
//               pages: 1,
//               total: 0,
//               limit: 20,
//             }
//           );

//           if (isFeedbackForm && processedSubmissions.length > 0) {
//             // Auto-evaluate submissions that don't have evaluations yet
//             const unevaluatedSubmissions = processedSubmissions.filter(
//               (submission: Submission) =>
//                 !aiEvaluations[submission.id] &&
//                 !evaluatingSubmissions.has(submission.id)
//             );

//             if (unevaluatedSubmissions.length > 0) {
//               // Evaluate in batches of 5 to avoid overwhelming the API
//               const submissionIds = unevaluatedSubmissions
//                 .slice(0, 5)
//                 .map((s: Submission) => s.id);
//               evaluateMultipleSubmissions(submissionIds);
//             }
//           }

//           console.log(
//             ' Submissions fetched successfully:',
//             processedSubmissions.length
//           );
//         }
//       } catch (error: any) {
//         console.error('❌ Error fetching submissions:', error);
//         toast.error(error.message || 'Failed to fetch submissions');
//         setSubmissions([]);
//       } finally {
//         setLoading(false);
//       }
//     },
//     [
//       formId,
//       searchTerm,
//       statusFilter,
//       readFilter,
//       isFeedbackForm,
//       aiEvaluations,
//       evaluatingSubmissions,
//     ]
//   );

//   // Download CSV export
//   const handleDownloadCsv = async () => {
//     if (!formId) {
//       toast.error('Form ID is required for CSV export');
//       return;
//     }

//     setDownloadingCsv(true);

//     try {
//       console.log('📥 Starting Cloudinary-only CSV download for form:', formId);

//       // Build filters for export
//       const exportFilters = {
//         ...(searchTerm && { search: searchTerm }),
//         ...(statusFilter !== 'all' && { status: statusFilter }),
//         ...(readFilter !== 'all' && {
//           isRead: readFilter === 'read' ? 'true' : 'false',
//         }),
//       };

//       console.log('🔍 Export filters:', exportFilters);

//       // Perform the CSV export
//       const blob = await submissionsService.exportCSV(
//         formId,
//         undefined,
//         undefined,
//         true
//       );

//       if (!blob || blob.size === 0) {
//         throw new Error('Empty CSV file received. No data to export.');
//       }

//       // Create download link
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;

//       // Generate filename
//       const formTitle = formStructure?.title || 'form';
//       const formTitleSafe = formTitle
//         .replace(/[^a-zA-Z0-9\s]/g, '')
//         .replace(/\s+/g, '_');
//       const dateStamp = new Date().toISOString().split('T')[0];
//       const filename = `${formTitleSafe}_cloudinary_export_${dateStamp}.csv`;

//       a.download = filename;
//       a.style.display = 'none';

//       // Trigger download
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);

//       // Cleanup
//       setTimeout(() => window.URL.revokeObjectURL(url), 1000);

//       // Success feedback
//       const fileSizeMB = (blob.size / (1024 * 1024)).toFixed(2);

//       console.log('🎉 Cloudinary CSV download completed:', {
//         filename,
//         fileSize: `${fileSizeMB} MB`,
//       });
//     } catch (error: any) {
//       console.error('❌ CSV download failed:', error);

//       let errorMessage = 'Failed to download CSV export';
//       if (error.message.includes('Empty')) {
//         errorMessage = 'No data available for export';
//       } else if (error.message) {
//         errorMessage = error.message;
//       }

//       toast.error(`❌ ${errorMessage}`, { duration: 7000 });
//     } finally {
//       setDownloadingCsv(false);
//     }
//   };

//   // Mark submission as read/unread
//   const handleToggleRead = async (submissionId: string, isRead: boolean) => {
//     try {
//       if (!submissionId || submissionId.trim() === '') {
//         throw new Error('Invalid submission ID');
//       }

//       console.log('🔄 Toggling read status:', {
//         submissionId,
//         currentStatus: isRead,
//         newStatus: !isRead,
//       });

//       await submissionsService.updateReadStatus(submissionId, !isRead);

//       setSubmissions(prev =>
//         prev.map(sub =>
//           sub.id === submissionId ? { ...sub, isRead: !isRead } : sub
//         )
//       );

//       setStats(prev => ({
//         ...prev,
//         unread: !isRead ? prev.unread - 1 : prev.unread + 1,
//       }));

//       console.log(' Read status updated successfully');
//     } catch (error: any) {
//       console.error('❌ Error updating read status:', error);
//       setSubmissions(prev =>
//         prev.map(sub =>
//           sub.id === submissionId ? { ...sub, isRead: isRead } : sub
//         )
//       );
//       toast.error(error.message || 'Failed to update read status');
//     }
//   };

//   const handleDeleteSubmission = async (submissionId: string) => {
//     try {
//       // Get submission details for better user feedback
//       const submission = submissions.find(s => s.id === submissionId);
//       if (!submission) return;

//       const fileCount = submission.files?.length || 0;
//       const items = [
//         {
//           id: submissionId,
//           name: `Submission ${formatDateTime(submission.submittedAt)}`,
//           files: fileCount,
//         },
//       ];

//       // Perform deletion using the hook
//       await deleteSubmissions(items, async id => {
//         return await submissionsService.deleteSubmission(id);
//       });

//       // Update local state
//       setSubmissions(prev => prev.filter(sub => sub.id !== submissionId));

//       // Update stats
//       setStats(prev => ({
//         ...prev,
//         total: prev.total - 1,
//         unread: submission?.isRead === false ? prev.unread - 1 : prev.unread,
//       }));

//       // Remove from AI evaluations if exists
//       setAiEvaluations(prev => {
//         const newEvaluations = { ...prev };
//         delete newEvaluations[submissionId];
//         return newEvaluations;
//       });

//       console.log(' Submission deletion completed successfully');
//     } catch (error: any) {
//       console.error('❌ Error deleting submission:', error);
//       toast.error('Deletion Failed', {
//         description:
//           error.message || 'Failed to delete submission and associated files',
//         duration: 10000,
//       });
//     } finally {
//       setShowDeleteDialog(false);
//       setSubmissionToDelete(null);
//     }
//   };

//   const handleDeleteFile = async (
//     file: any,
//     submissionId: string,
//     fieldId: string
//   ) => {
//     try {
//       if (!file?.publicId) {
//         throw new Error('Invalid file data - missing publicId');
//       }

//       console.log('🗑️ Deleting individual file:', file.originalName);

//       try {
//         // Call the enhanced backend route
//         const response = await axios.delete(
//           `${
//             apiConfig.url
//           }/submissions/${submissionId}/files/${fieldId}/${encodeURIComponent(
//             file.publicId
//           )}`,
//           {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem('token')}`,
//             },
//           }
//         );

//         if (response.data.success) {
//           toast.success(`${file.originalName} deleted successfully`, {
//             description: `File removed from ${
//               response.data.details.cloudinaryDeleted ? 'storage and ' : ''
//             }database`,
//             duration: 5000,
//           });

//           // Update local state
//           updateSubmissionFileState(submissionId, fieldId, file.publicId);
//         } else {
//           throw new Error('Deletion was not successful');
//         }
//       } catch (apiError: any) {
//         throw new Error(
//           apiError.response?.data?.message || 'Failed to delete file'
//         );
//       }
//     } catch (error: any) {
//       console.error('❌ Error deleting file:', error);
//       toast.error(`Failed to delete ${file.originalName}`, {
//         description: error.message,
//         duration: 3000,
//       });
//     }
//   };

//   // Helper function to update local state after file deletion
//   const updateSubmissionFileState = (
//     submissionId: string,
//     fieldId: string,
//     deletedPublicId: string
//   ) => {
//     setSubmissions(prev =>
//       prev.map(sub => {
//         if (sub.id === submissionId) {
//           // Remove from files array
//           const updatedFiles = (sub.files || []).filter(
//             (f: any) => f.publicId !== deletedPublicId
//           );

//           // Remove from data object
//           const updatedData = { ...sub.data };
//           const fieldFiles = updatedData[fieldId];

//           if (Array.isArray(fieldFiles)) {
//             updatedData[fieldId] = fieldFiles.filter(
//               f => f.publicId !== deletedPublicId
//             );
//             if (updatedData[fieldId].length === 0) {
//               delete updatedData[fieldId];
//             }
//           } else if (fieldFiles?.publicId === deletedPublicId) {
//             delete updatedData[fieldId];
//           }

//           return { ...sub, files: updatedFiles, data: updatedData };
//         }
//         return sub;
//       })
//     );

//     // Update selected submission if displayed
//     if (selectedSubmission?.id === submissionId) {
//       // Similar update logic for selectedSubmission state
//       // ... (implementation similar to above)
//     }
//   };

//   // Enhanced file download with loading state
//   const handleDownloadFile = async (file: any) => {
//     try {
//       setDownloadingFileId(file.publicId);

//       console.log('📥 Starting file download:', {
//         name: file.originalName,
//         url: file.url,
//         mimeType: file.mimeType,
//       });

//       const a = document.createElement('a');
//       a.href = file.url;
//       a.download = file.originalName || 'download';
//       a.target = '_blank';
//       a.rel = 'noopener noreferrer';
//       a.style.display = 'none';

//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);

//       console.log(' File download completed');
//     } catch (error: any) {
//       console.error('❌ Download error:', error);
//       toast.error(`Failed to download ${file.originalName}`);
//       throw error;
//     } finally {
//       setDownloadingFileId(null);
//     }
//   };

//   // Confirm delete functions
//   const confirmDelete = (submissionId: string) => {
//     setSubmissionToDelete(submissionId);
//     setShowDeleteDialog(true);
//   };

//   // View submission details
//   const handleViewSubmission = async (submission: Submission) => {
//     try {
//       console.log('👁️ Viewing submission:', {
//         id: submission.id,
//         isRead: submission.isRead,
//         data: submission.data,
//         files: submission.files,
//       });

//       setSelectedSubmission(submission);
//       setShowSubmissionModal(true);

//       if (!submission.isRead) {
//         handleToggleRead(submission.id, submission.isRead).catch(error => {
//           console.warn(
//             '⚠️ Failed to mark submission as read when viewing:',
//             error
//           );
//         });
//       }
//     } catch (error) {
//       console.error('❌ Error viewing submission:', error);
//       toast.error('Failed to view submission details');
//     }
//   };

//   // Get status badge
//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case 'processed':
//         return (
//           <Badge variant='default' className='bg-green-100 text-green-800'>
//             <CheckCircle className='w-3 h-3 mr-1' />
//             Processed
//           </Badge>
//         );
//       case 'pending':
//         return (
//           <Badge variant='secondary' className='bg-yellow-100 text-yellow-800'>
//             <AlertCircle className='w-3 h-3 mr-1' />
//             Pending
//           </Badge>
//         );
//       case 'failed':
//         return (
//           <Badge variant='destructive' className='bg-red-100 text-red-800'>
//             <XCircle className='w-3 h-3 mr-1' />
//             Failed
//           </Badge>
//         );
//       default:
//         return <Badge variant='outline'>{status}</Badge>;
//     }
//   };

//   // Get AI evaluation badge
//   const getAIEvaluationBadge = (submissionId: string) => {
//     if (evaluatingSubmissions.has(submissionId)) {
//       return (
//         <Badge variant='secondary' className='bg-blue-100 text-blue-800'>
//           <Loader2 className='w-3 h-3 mr-1 animate-spin' />
//           Evaluating...
//         </Badge>
//       );
//     }

//     const evaluation = aiEvaluations[submissionId];
//     if (!evaluation) {
//       return (
//         <Badge variant='outline' className='bg-gray-100 text-gray-600'>
//           <Brain className='w-3 h-3 mr-1' />
//           Pending
//         </Badge>
//       );
//     }

//     if (evaluation.status === 'failed') {
//       return (
//         <Badge variant='destructive' className='bg-red-100 text-red-800'>
//           <XCircle className='w-3 h-3 mr-1' />
//           Failed
//         </Badge>
//       );
//     }

//     // Form type specific badges
//     switch (evaluation.formType) {
//       case 'quiz':
//         const scoreColor =
//           evaluation.quizResults!.percentage >= 70
//             ? 'green'
//             : evaluation.quizResults!.percentage >= 50
//             ? 'yellow'
//             : 'red';
//         return (
//           <Badge
//             variant='default'
//             className={`bg-${scoreColor}-100 text-${scoreColor}-800`}
//           >
//             <Star className='w-3 h-3 mr-1' />
//             {evaluation.quizResults!.correctAnswers}/
//             {evaluation.quizResults!.totalQuestions} (
//             {evaluation.quizResults!.percentage}%)
//           </Badge>
//         );

//       case 'survey':
//         const surveyColor =
//           evaluation.sentiment === 'positive'
//             ? 'green'
//             : evaluation.sentiment === 'negative'
//             ? 'red'
//             : 'yellow';
//         return (
//           <Badge
//             variant='default'
//             className={`bg-${surveyColor}-100 text-${surveyColor}-800`}
//           >
//             <Brain className='w-3 h-3 mr-1' />
//             {evaluation.surveyResults!.overallSentiment.positive}% Positive
//           </Badge>
//         );

//       case 'feedback':
//         const urgencyColor =
//           evaluation.feedbackResults!.urgencyLevel === 'high'
//             ? 'red'
//             : evaluation.feedbackResults!.urgencyLevel === 'medium'
//             ? 'yellow'
//             : 'green';
//         return (
//           <Badge
//             variant='default'
//             className={`bg-${urgencyColor}-100 text-${urgencyColor}-800`}
//           >
//             <AlertTriangle className='w-3 h-3 mr-1' />
//             {evaluation.feedbackResults!.sentimentBreakdown.positive}% Positive
//           </Badge>
//         );

//       default:
//         return (
//           <Badge variant='default' className='bg-blue-100 text-blue-800'>
//             <Brain className='w-3 h-3 mr-1' />
//             Analyzed
//           </Badge>
//         );
//     }
//   };

//   // Add state for the evaluation modal:
//   const [showAIEvaluationModal, setShowAIEvaluationModal] = useState(false);
//   const [selectedEvaluation, setSelectedEvaluation] =
//     useState<AIEvaluation | null>(null);

//   // Add function to handle evaluation modal:
//   const handleViewAIEvaluation = (submissionId: string) => {
//     const evaluation = aiEvaluations[submissionId];
//     if (evaluation && evaluation.status === 'completed') {
//       setSelectedEvaluation(evaluation);
//       setShowAIEvaluationModal(true);
//     } else if (!evaluation && !evaluatingSubmissions.has(submissionId)) {
//       const submission = submissions.find(s => s.id === submissionId);
//       if (submission) {
//         evaluateSubmissionWithAI(submission);
//       }
//     }
//   };

//   // Enhanced render field value with complete file management
//   const renderFieldValue = (fieldId: string, value: any) => {
//     const label = fieldLabelsMap[fieldId] || fieldId;

//     console.log('🔍 Rendering field:', {
//       fieldId,
//       label,
//       value,
//       submissionId: selectedSubmission?.id,
//       hasSubmissionFiles: !!(
//         selectedSubmission?.files && selectedSubmission.files.length > 0
//       ),
//     });

//     //  NEW: Check if this is a signature field
//     const isSignatureField = (value: any, label: string): boolean => {
//       if (typeof value === 'string' && value.startsWith('data:image/')) {
//         return true;
//       }
//       return label.toLowerCase().includes('signature');
//     };

//     //  NEW: Handle signature fields specially
//     if (isSignatureField(value, label)) {
//       console.log('✍️ Rendering signature field:', label);

//       const handleDownloadSignature = () => {
//         try {
//           // Create download link from base64 data
//           const link = document.createElement('a');
//           link.href = value;
//           link.download = `signature-${
//             selectedSubmission?.id || 'unknown'
//           }-${Date.now()}.png`;
//           document.body.appendChild(link);
//           link.click();
//           document.body.removeChild(link);

//           console.log(' Signature download initiated');
//           toast.success('Signature downloaded successfully');
//         } catch (error) {
//           console.error('❌ Error downloading signature:', error);
//           toast.error('Failed to download signature');
//         }
//       };

//       return (
//         <div className='space-y-4'>
//           <div className='flex items-center justify-between border-b border-gray-200 pb-2'>
//             <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
//               <svg
//                 className='w-4 h-4 text-purple-500'
//                 fill='currentColor'
//                 viewBox='0 0 20 20'
//               >
//                 <path
//                   fillRule='evenodd'
//                   d='M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z'
//                   clipRule='evenodd'
//                 />
//               </svg>
//               {label}
//               <Badge
//                 variant='secondary'
//                 className='ml-2 text-xs bg-purple-100 text-purple-700'
//               >
//                 Digital Signature
//               </Badge>
//             </label>
//             <div className='text-xs text-gray-500'>PNG Image</div>
//           </div>

//           {/* Signature Preview */}
//           <div className='bg-white border border-gray-300 rounded-lg p-4'>
//             <div className='flex flex-col items-center space-y-4'>
//               {/* Signature Image */}
//               <div className='w-full max-w-md bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4'>
//                 <img
//                   src={value}
//                   alt={`Digital signature for ${label}`}
//                   className='w-full h-auto max-h-32 object-contain'
//                   style={{
//                     filter: 'contrast(1.1) brightness(0.95)',
//                     imageRendering: 'crisp-edges',
//                   }}
//                   onError={e => {
//                     // console.error('❌ Failed to load signature image');
//                     e.currentTarget.style.display = 'none';
//                   }}
//                 />
//               </div>

//               {/* Signature Info */}
//               <div className='text-center space-y-2'>
//                 <p className='text-sm text-gray-600'>
//                   Digital signature captured on{' '}
//                   {formatDateTime(selectedSubmission?.submittedAt || '')}
//                 </p>

//                 {/* Action Buttons */}
//                 <div className='flex gap-2 justify-center'>
//                   {/* Download Button */}
//                   <Button
//                     size='sm'
//                     variant='outline'
//                     onClick={handleDownloadSignature}
//                     className='flex items-center gap-2 hover:bg-purple-50 hover:border-purple-300'
//                   >
//                     <Download className='w-4 h-4' />
//                     Download Signature
//                   </Button>

//                   {/* View Full Size Button */}
//                   <Button
//                     size='sm'
//                     variant='outline'
//                     onClick={() => {
//                       // Open signature in new window for full view
//                       const newWindow = window.open('', '_blank');
//                       if (newWindow) {
//                         newWindow.document.write(`
//                         <html>
//                           <head>
//                             <title>Digital Signature - ${label}</title>
//                             <style>
//                               body {
//                                 margin: 0;
//                                 padding: 20px;
//                                 background: #f5f5f5;
//                                 display: flex;
//                                 justify-content: center;
//                                 align-items: center;
//                                 min-height: 100vh;
//                                 font-family: Arial, sans-serif;
//                               }
//                               .container {
//                                 background: white;
//                                 padding: 20px;
//                                 border-radius: 8px;
//                                 box-shadow: 0 2px 10px rgba(0,0,0,0.1);
//                                 text-align: center;
//                               }
//                               img {
//                                 max-width: 100%;
//                                 height: auto;
//                                 border: 2px solid #e5e5e5;
//                                 border-radius: 4px;
//                                 background: white;
//                               }
//                               h2 {
//                                 color: #333;
//                                 margin-bottom: 20px;
//                               }
//                               .info {
//                                 margin-top: 20px;
//                                 color: #666;
//                                 font-size: 14px;
//                               }
//                             </style>
//                           </head>
//                           <body>
//                             <div class="container">
//                               <h2>${label}</h2>
//                               <img src="${value}" alt="Digital Signature" />
//                               <div class="info">
//                                 <p>Submitted: ${formatDateTime(
//                                   selectedSubmission?.submittedAt || ''
//                                 )}</p>
//                                 <p>Submission ID: ${
//                                   selectedSubmission?.id || 'Unknown'
//                                 }</p>
//                               </div>
//                             </div>
//                           </body>
//                         </html>
//                       `);
//                         newWindow.document.close();
//                       }
//                     }}
//                     className='flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300'
//                   >
//                     <Eye className='w-4 h-4' />
//                     View Full Size
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       );
//     }

//     // Check if this field has files
//     const hasFiles = selectedSubmission
//       ? fieldHasFiles(selectedSubmission, fieldId)
//       : false;

//     if (hasFiles) {
//       console.log('📁 Rendering file field:', label);

//       // Get all files for this field
//       const fieldFiles = selectedSubmission
//         ? getAllFilesForField(selectedSubmission, fieldId)
//         : [];

//       console.log('📁 Field files:', {
//         fieldId,
//         label,
//         fileCount: fieldFiles.length,
//         files: fieldFiles,
//       });

//       // Normalize file data to ensure compatibility with FileManager
//       const normalizedFiles = fieldFiles.map((file: any) => ({
//         originalName:
//           file.originalName || file.fileName || file.name || 'Unknown File',
//         fileName: file.fileName || file.originalName || file.name || 'unknown',
//         url: file.url || '',
//         publicId: file.publicId || file.id || `temp_${Date.now()}`,
//         size: file.size || 0,
//         mimeType: file.mimeType || file.type || 'application/octet-stream',
//         uploadedAt:
//           file.uploadedAt || file.createdAt || new Date().toISOString(),
//         dimensions: file.dimensions || undefined,
//         ...file, // Keep all other properties
//       }));

//       return (
//         <div className='space-y-4'>
//           <div className='flex items-center justify-between border-b border-gray-200 pb-2'>
//             <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
//               {normalizedFiles.length > 0 &&
//                 getFileTypeInfo(normalizedFiles[0]?.mimeType || '').icon &&
//                 React.createElement(
//                   getFileTypeInfo(normalizedFiles[0]?.mimeType || '').icon,
//                   {
//                     className: `w-4 h-4 text-${
//                       getFileTypeInfo(normalizedFiles[0]?.mimeType || '').color
//                     }-500`,
//                   }
//                 )}
//               {label}
//               {normalizedFiles.length > 1 && (
//                 <Badge variant='secondary' className='ml-2'>
//                   {normalizedFiles.length} files
//                 </Badge>
//               )}
//             </label>
//             <div className='text-xs text-gray-500'>
//               {formatFileSize(
//                 normalizedFiles.reduce(
//                   (sum: number, file: any) => sum + (file.size || 0),
//                   0
//                 )
//               )}
//             </div>
//           </div>

//           <FileManager
//             files={
//               normalizedFiles.length === 1
//                 ? normalizedFiles[0]
//                 : normalizedFiles
//             }
//             fieldId={fieldId}
//             submissionId={selectedSubmission!.id}
//             onFileDelete={async file => {
//               console.log('🗑️ Delete requested for:', file.originalName);
//               await handleDeleteFile(file, selectedSubmission!.id, fieldId);
//             }}
//             onFileDownload={async file => {
//               console.log('📥 Download requested for:', file.originalName);
//               await handleDownloadFile(file);
//             }}
//             onFileView={file => {
//               console.log('👁️ Preview requested for:', file.originalName);
//               // FileManager handles preview internally
//             }}
//             showActions={true}
//             compact={true}
//             readOnly={false}
//             downloadingFileId={downloadingFileId}
//             maxPreviewSize={10}
//           />
//         </div>
//       );
//     }

//     // Regular field with enhanced styling
//     const displayValue = formatDisplayValue(value);

//     return (
//       <div className='space-y-2 pb-4 border-b border-gray-100 last:border-b-0'>
//         <label className='text-sm font-semibold text-gray-700 block'>
//           {label}
//         </label>
//         <div className='bg-gray-50 p-3 rounded-lg border'>
//           <p className='text-gray-900 leading-relaxed whitespace-pre-wrap'>
//             {displayValue}
//           </p>
//         </div>
//       </div>
//     );
//   };

//   // Initialize data on component mount
//   useEffect(() => {
//     if (formId) {
//       console.log('🚀 Component mounted, fetching data for formId:', formId);

//       const initializeData = async () => {
//         await fetchFormStructure();
//         await fetchSubmissions();
//       };

//       initializeData();
//     } else {
//       console.warn('⚠️ No formId available');
//       setLoading(false);
//     }
//   }, [formId, fetchFormStructure, fetchSubmissions]);

//   useEffect(() => {
//     if (formId && formStructure) {
//       fetchSubmissions();
//     }
//   }, [
//     formId,
//     searchTerm,
//     statusFilter,
//     readFilter,
//     fetchSubmissions,
//     formStructure,
//   ]);

//   if (loading) {
//     return (
//       <div className='flex items-center justify-center min-h-screen'>
//         <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
//       </div>
//     );
//   }

//   const hasSubmissions = submissions.length > 0;

//   return (
//     <div className='container mx-auto px-4 py-8'>
//       {/* Header */}
//       <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
//         <div>
//           <h1 className='text-3xl font-bold text-gray-900'>Form Submissions</h1>
//           <p className='text-gray-600 mt-1'>
//             Manage and view all form submissions
//           </p>
//         </div>
//         <Button
//           onClick={handleDownloadCsv}
//           disabled={downloadingCsv || !hasSubmissions}
//           className={`
//           bg-[#102035] hover:bg-slate-700 font-semibold text-white
//           flex items-center gap-2 disabled:opacity-50
//           ${
//             downloadingCsv
//               ? 'cursor-wait'
//               : hasSubmissions
//               ? 'cursor-pointer'
//               : 'cursor-not-allowed'
//           }
//           transition-all duration-200 ease-in-out
//           hover:shadow-lg active:scale-95
//           min-w-[200px] justify-center
//         `}
//           title={
//             !hasSubmissions
//               ? 'No submissions to export'
//               : downloadingCsv
//               ? 'Preparing CSV export...'
//               : `Export ${stats.total} submission${
//                   stats.total === 1 ? '' : 's'
//                 } to CSV`
//           }
//         >
//           {downloadingCsv ? (
//             <>
//               <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white' />
//               <span>Exporting...</span>
//             </>
//           ) : (
//             <>
//               <Download className='w-4 h-4' />
//               <span>Download CSV ({stats.total})</span>
//             </>
//           )}
//         </Button>
//       </div>

//       {/* Stats Cards */}
//       <div className='grid grid-cols-2 md:grid-cols-5 gap-4 mb-1'>
//         <Card>
//           <CardContent className='p-4'>
//             <div className='text-2xl font-bold text-[#102035]'>
//               {stats.total}
//             </div>
//             <p className='text-sm text-gray-600'>Total</p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className='p-4'>
//             <div className='text-2xl font-bold text-orange-600'>
//               {stats.unread}
//             </div>
//             <p className='text-sm text-gray-600'>Unread</p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className='p-4'>
//             <div className='text-2xl font-bold text-yellow-600'>
//               {stats.pending}
//             </div>
//             <p className='text-sm text-gray-600'>Pending</p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className='p-4'>
//             <div className='text-2xl font-bold text-green-600'>
//               {stats.processed}
//             </div>
//             <p className='text-sm text-gray-600'>Processed</p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className='p-4'>
//             <div className='text-2xl font-bold text-red-600'>
//               {stats.failed}
//             </div>
//             <p className='text-sm text-gray-600'>Failed</p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Filters */}
//       <Card className='mb-0 focus-visible:ring-1 border-none outline-none focus:outline-none focus:ring-0 focus:border-transparent shadow-none'>
//         <div className='flex flex-col sm:flex-row gap-4'>
//           <div className='flex-1'>
//             <div className='relative'>
//               <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
//               <Input
//                 placeholder='Search submissions...'
//                 value={searchTerm}
//                 onChange={e => setSearchTerm(e.target.value)}
//                 className='pl-10 rounded-lg'
//               />
//             </div>
//           </div>
//           <Select value={statusFilter} onValueChange={setStatusFilter}>
//             <SelectTrigger className='w-[150px] rounded-lg'>
//               <SelectValue placeholder='Status' />
//             </SelectTrigger>
//             <SelectContent className='bg-[#102035] text-white'>
//               <SelectItem value='all'>All Status</SelectItem>
//               <SelectItem value='processed'>Processed</SelectItem>
//               <SelectItem value='pending'>Pending</SelectItem>
//               <SelectItem value='failed'>Failed</SelectItem>
//             </SelectContent>
//           </Select>
//           <Select value={readFilter} onValueChange={setReadFilter}>
//             <SelectTrigger className='w-[150px] rounded-lg'>
//               <SelectValue placeholder='Read Status' />
//             </SelectTrigger>
//             <SelectContent className='bg-[#102035] text-white'>
//               <SelectItem value='all'>All</SelectItem>
//               <SelectItem value='read'>Read</SelectItem>
//               <SelectItem value='unread'>Unread</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>
//       </Card>

//       {/* Submissions Table */}
//       <Card className='bg-[#F3F3FE]'>
//         <CardHeader>
//           <CardTitle className='flex items-center gap-2'>
//             <Calendar className='w-5 h-5' />
//             Submissions ({stats.total})
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           {submissions.length === 0 ? (
//             <div className='text-center py-12'>
//               <div className='text-gray-400 mb-4'>
//                 <Calendar className='w-16 h-16 mx-auto' />
//               </div>
//               <h3 className='text-lg font-medium text-gray-900 mb-2'>
//                 No submissions yet
//               </h3>
//               <p className='text-gray-600'>
//                 Submissions will appear here once users start submitting your
//                 form.
//               </p>
//             </div>
//           ) : (
//             <div className='overflow-x-auto'>
//               <Table className='w-full table-fixed'>
//                 <TableHeader>
//                   <TableRow className='border-b-2 border-gray-300'>
//                     <TableHead className='w-[18%] border-r border-gray-300 px-4 py-3'>
//                       <div className='flex items-center gap-2 font-semibold'>
//                         <Clock className='w-4 h-4' />
//                         Submission Date
//                       </div>
//                     </TableHead>

//                     {uniqueFields.map(field => (
//                       <TableHead
//                         key={field.fieldId}
//                         className='w-[20%] border-r border-gray-300 px-4 py-3'
//                       >
//                         <div className='flex items-center gap-2 font-semibold'>
//                           {field.icon}
//                           <span className='truncate'>{field.label}</span>
//                         </div>
//                       </TableHead>
//                     ))}

//                     {uniqueFields.length < 2 && hasEmailField && (
//                       <TableHead className='w-[20%] border-r border-gray-300 px-4 py-3'>
//                         <div className='flex items-center gap-2 font-semibold'>
//                           <Mail className='w-4 h-4' />
//                           Email
//                         </div>
//                       </TableHead>
//                     )}

//                     {uniqueFields.length < 1 && hasFullNameField && (
//                       <TableHead className='w-[20%] border-r border-gray-300 px-4 py-3'>
//                         <div className='flex items-center gap-2 font-semibold'>
//                           <User className='w-4 h-4' />
//                           Full Name
//                         </div>
//                       </TableHead>
//                     )}

//                     <TableHead className='w-[16%] border-r border-gray-300 px-4 py-3'>
//                       <div className='flex items-center gap-2 font-semibold'>
//                         <Brain className='w-4 h-4' />
//                         AI Evaluation
//                       </div>
//                     </TableHead>

//                     <TableHead className='w-[12%] border-r border-gray-300 px-4 py-3'>
//                       <div className='flex items-center gap-2 font-semibold'>
//                         <AlertCircle className='w-4 h-4' />
//                         Status
//                       </div>
//                     </TableHead>

//                     <TableHead className='w-[8%] border-r border-gray-300 px-4 py-3'>
//                       <div className='flex items-center justify-center gap-2 font-semibold'>
//                         Read
//                       </div>
//                     </TableHead>

//                     <TableHead className='w-[8%] px-4 py-3'>
//                       <div className='font-semibold text-center'>Actions</div>
//                     </TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {submissions.map((submission, submissionIndex) => (
//                     <TableRow
//                       key={`submission-${submission.id}-${submissionIndex}`}
//                       className={`${
//                         !submission.isRead
//                           ? 'bg-blue-50 border-l-4 border-l-blue-500'
//                           : ''
//                       } hover:bg-gray-50 cursor-pointer border-b border-gray-300`}
//                       onClick={() => handleViewSubmission(submission)}
//                     >
//                       <TableCell className='border-r border-gray-300 px-4 py-4'>
//                         <div>
//                           <div className='font-medium text-sm text-gray-900'>
//                             {formatDateTime(submission.submittedAt)}
//                           </div>
//                           <div className='text-xs text-gray-500 mt-1'>
//                             {formatTimeAgo(submission.submittedAt)}
//                           </div>
//                         </div>
//                       </TableCell>

//                       {uniqueFields.map(field => (
//                         <TableCell
//                           key={field.fieldId}
//                           className='border-r border-gray-300 px-4 py-4'
//                         >
//                           <div
//                             className='truncate font-medium text-gray-900'
//                             title={getFieldValueFromSubmission(
//                               submission,
//                               field.fieldId
//                             )}
//                           >
//                             {getFieldValueFromSubmission(
//                               submission,
//                               field.fieldId
//                             )}
//                           </div>
//                         </TableCell>
//                       ))}

//                       {uniqueFields.length < 2 && hasEmailField && (
//                         <TableCell className='border-r border-gray-300 px-4 py-4'>
//                           <div
//                             className='truncate font-medium text-gray-900'
//                             title={getEmailFromSubmission(submission)}
//                           >
//                             {getEmailFromSubmission(submission)}
//                           </div>
//                         </TableCell>
//                       )}

//                       {uniqueFields.length < 1 && hasFullNameField && (
//                         <TableCell className='border-r border-gray-300 px-4 py-4'>
//                           <div
//                             className='truncate font-medium text-gray-900'
//                             title={getFullNameFromSubmission(submission)}
//                           >
//                             {getFullNameFromSubmission(submission)}
//                           </div>
//                         </TableCell>
//                       )}

//                       <TableCell className='border-r border-gray-300 px-4 py-4'>
//                         <div
//                           onClick={e => {
//                             e.stopPropagation();
//                             handleViewAIEvaluation(submission.id);
//                           }}
//                           className='cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors'
//                           title='Click to view detailed AI evaluation'
//                         >
//                           {getAIEvaluationBadge(submission.id)}
//                         </div>
//                       </TableCell>

//                       <TableCell className='border-r border-gray-300 px-4 py-4'>
//                         {getStatusBadge(submission.status)}
//                       </TableCell>

//                       <TableCell className='border-r border-gray-300 px-4 py-4 text-center'>
//                         <Button
//                           variant='ghost'
//                           size='sm'
//                           onClick={e => {
//                             e.stopPropagation();
//                             handleToggleRead(submission.id, submission.isRead);
//                           }}
//                           className='p-1 hover:bg-gray-200 rounded-full cursor-pointer'
//                         >
//                           {submission.isRead ? (
//                             <Eye className='w-4 h-4 text-green-600' />
//                           ) : (
//                             <EyeOff className='w-4 h-4 text-gray-400' />
//                           )}
//                         </Button>
//                       </TableCell>

//                       <TableCell className='px-4 py-4'>
//                         <div className='flex items-center justify-center gap-1'>
//                           <Button
//                             variant='ghost'
//                             size='sm'
//                             onClick={e => {
//                               e.stopPropagation();
//                               confirmDelete(submission.id);
//                             }}
//                             className='p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full cursor-pointer'
//                             title='Delete submission'
//                           >
//                             <Trash2 className='w-4 h-4' />
//                           </Button>
//                         </div>
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </div>
//           )}

//           {/* Pagination */}
//           {pagination.pages > 1 && (
//             <div className='flex items-center justify-between mt-6 pt-4 border-t border-gray-200'>
//               <div className='text-sm text-gray-600'>
//                 Showing {(pagination.current - 1) * pagination.limit + 1} to{' '}
//                 {Math.min(
//                   pagination.current * pagination.limit,
//                   pagination.total
//                 )}{' '}
//                 of {pagination.total} submissions
//               </div>
//               <div className='flex gap-2'>
//                 <Button
//                   variant='outline'
//                   size='sm'
//                   onClick={() =>
//                     fetchSubmissions(pagination.current - 1, pagination.limit)
//                   }
//                   disabled={pagination.current === 1}
//                 >
//                   Previous
//                 </Button>
//                 <Button
//                   variant='outline'
//                   size='sm'
//                   onClick={() =>
//                     fetchSubmissions(pagination.current + 1, pagination.limit)
//                   }
//                   disabled={pagination.current === pagination.pages}
//                 >
//                   Next
//                 </Button>
//               </div>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Submission Details Modal */}
//       <Dialog open={showSubmissionModal} onOpenChange={setShowSubmissionModal}>
//         <DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto bg-white [&>button]:top-6 [&>button]:right-4 [&>button]:cursor-pointer '>
//           <DialogHeader className='border-b border-gray-200 pb-4'>
//             <DialogTitle className='flex items-center justify-between'>
//               <span className='text-xl font-bold text-gray-900'>
//                 Submission Details
//               </span>
//             </DialogTitle>
//           </DialogHeader>

//           {selectedSubmission && (
//             <div className='space-y-6 pt-4'>
//               {/* Submission Meta Info */}
//               <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200'>
//                 <h4 className='font-semibold text-blue-900 mb-3 flex items-center gap-2'>
//                   <Calendar className='w-4 h-4' />
//                   Submission Information
//                 </h4>
//                 <div className='grid grid-cols-2 gap-4 text-sm'>
//                   <div>
//                     <span className='text-blue-700 font-medium'>
//                       Submitted:
//                     </span>
//                     <p className='mt-1 text-gray-900'>
//                       {formatDateTime(selectedSubmission.submittedAt)}
//                     </p>
//                   </div>
//                   <div>
//                     <span className='text-blue-700 font-medium'>Status:</span>
//                     <div className='mt-1'>
//                       {getStatusBadge(selectedSubmission.status)}
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Unique Fields Summary */}
//               {uniqueFields.length > 0 && (
//                 <div className='bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200'>
//                   <h4 className='font-semibold text-purple-900 mb-3 flex items-center gap-2'>
//                     <IdCard className='w-4 h-4' />
//                     Unique Identifiers
//                   </h4>
//                   <div className='grid grid-cols-2 gap-4 text-sm'>
//                     {uniqueFields.map(field => (
//                       <div key={field.fieldId}>
//                         <span className='text-purple-700 font-medium flex items-center gap-1'>
//                           {field.icon}
//                           {field.label}:
//                         </span>
//                         <p className='mt-1 font-semibold text-gray-900 bg-white px-3 py-2 rounded border'>
//                           {getFieldValueFromSubmission(
//                             selectedSubmission,
//                             field.fieldId
//                           )}
//                         </p>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* AI Evaluation Details */}
//               {isFeedbackForm && aiEvaluations[selectedSubmission.id] && (
//                 <div className='bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200'>
//                   <h4 className='font-semibold text-green-900 mb-3 flex items-center gap-2'>
//                     <Brain className='w-4 h-4' />
//                     AI Evaluation Results
//                   </h4>
//                   <div className='grid grid-cols-2 gap-4 text-sm'>
//                     <div>
//                       <span className='text-green-700 font-medium'>Score:</span>
//                       <div className='mt-1'>
//                         <Badge className='bg-green-100 text-green-800 font-bold'>
//                           {(() => {
//                             const evaluation =
//                               aiEvaluations[selectedSubmission.id];
//                             if (evaluation.quizResults) {
//                               return `${evaluation.quizResults.percentage}%`;
//                             } else if (evaluation.surveyResults) {
//                               return `${evaluation.surveyResults.overallSentiment.positive}% Positive`;
//                             } else if (evaluation.feedbackResults) {
//                               return `${evaluation.feedbackResults.sentimentBreakdown.positive}% Positive`;
//                             }
//                             return 'Analyzed';
//                           })()}{' '}
//                           ⭐
//                         </Badge>
//                       </div>
//                     </div>
//                     <div>
//                       <span className='text-green-700 font-medium'>
//                         Sentiment:
//                       </span>
//                       <p className='mt-1 font-semibold text-gray-900 capitalize'>
//                         {aiEvaluations[selectedSubmission.id].sentiment}
//                       </p>
//                     </div>
//                     <div className='col-span-2'>
//                       <span className='text-green-700 font-medium'>
//                         Feedback:
//                       </span>
//                       <div className='mt-1 bg-white p-3 rounded border'>
//                         <p className='text-gray-900 leading-relaxed'>
//                           {aiEvaluations[selectedSubmission.id].feedback}
//                         </p>
//                       </div>
//                     </div>
//                     <div className='col-span-2'>
//                       <span className='text-green-700 font-medium'>
//                         Categories:
//                       </span>
//                       <div className='mt-2 flex gap-2 flex-wrap'>
//                         {aiEvaluations[selectedSubmission.id].categories.map(
//                           category => (
//                             <Badge
//                               key={category}
//                               variant='outline'
//                               className='text-xs bg-white'
//                             >
//                               {category}
//                             </Badge>
//                           )
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Submission Data */}
//               <div className='bg-white'>
//                 <h3 className='text-lg font-bold text-gray-900 mb-6 flex items-center gap-2'>
//                   <User className='w-5 h-5' />
//                   Submitted Data
//                 </h3>

//                 <div className='space-y-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200'>
//                   {Object.entries(selectedSubmission.data).length === 0 ? (
//                     <div className='text-center py-8'>
//                       <p className='text-gray-500 italic text-lg'>
//                         No data submitted
//                       </p>
//                     </div>
//                   ) : (
//                     <>
//                       {/* Render regular form fields */}
//                       {Object.entries(selectedSubmission.data).map(
//                         ([fieldId, value], index) => (
//                           <div key={`field-${fieldId}-${index}`}>
//                             {renderFieldValue(fieldId, value)}
//                           </div>
//                         )
//                       )}

//                       {/* IMPORTANT: Render file fields from submission.files array */}
//                       {selectedSubmission.files &&
//                         Array.isArray(selectedSubmission.files) &&
//                         selectedSubmission.files.length > 0 && (
//                           <>
//                             <div className='border-t border-gray-300 pt-4 mt-6'>
//                               <h4 className='text-md font-semibold text-gray-800 mb-4 flex items-center gap-2'>
//                                 <FileText className='w-4 h-4' />
//                                 Uploaded Files
//                               </h4>
//                             </div>

//                             {/* Group files by fieldId and render each as a separate field */}
//                             {(() => {
//                               const filesByField =
//                                 selectedSubmission.files.reduce(
//                                   (acc: any, file: any) => {
//                                     if (!acc[file.fieldId]) {
//                                       acc[file.fieldId] = [];
//                                     }
//                                     acc[file.fieldId].push(file);
//                                     return acc;
//                                   },
//                                   {}
//                                 );

//                               return Object.entries(filesByField).map(
//                                 ([fieldId, files]: [string, any]) => {
//                                   const label =
//                                     fieldLabelsMap[fieldId] ||
//                                     `File Field (${fieldId})`;
//                                   const fileArray = files as any[];

//                                   // Normalize file data for FileManager
//                                   const normalizedFiles = fileArray.map(
//                                     (file: any) => ({
//                                       originalName:
//                                         file.originalName ||
//                                         file.fileName ||
//                                         'Unknown File',
//                                       fileName:
//                                         file.fileName ||
//                                         file.originalName ||
//                                         'unknown',
//                                       url: file.url || '',
//                                       publicId:
//                                         file.publicId || `temp_${Date.now()}`,
//                                       size: file.size || 0,
//                                       mimeType:
//                                         file.mimeType ||
//                                         'application/octet-stream',
//                                       uploadedAt:
//                                         file.uploadedAt ||
//                                         new Date().toISOString(),
//                                       ...file,
//                                     })
//                                   );

//                                   return (
//                                     <div
//                                       key={`file-field-${fieldId}`}
//                                       className='space-y-3 p-3 bg-white rounded-lg border border-gray-700'
//                                     >
//                                       <div className='flex items-center justify-between border-b border-gray-200 pb-2'>
//                                         <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
//                                           {normalizedFiles.length > 0 &&
//                                             getFileTypeInfo(
//                                               normalizedFiles[0]?.mimeType || ''
//                                             ).icon &&
//                                             React.createElement(
//                                               getFileTypeInfo(
//                                                 normalizedFiles[0]?.mimeType ||
//                                                   ''
//                                               ).icon,
//                                               {
//                                                 className: `w-4 h-4 text-${
//                                                   getFileTypeInfo(
//                                                     normalizedFiles[0]
//                                                       ?.mimeType || ''
//                                                   ).color
//                                                 }-500`,
//                                               }
//                                             )}
//                                           {label}
//                                           <Badge
//                                             variant='secondary'
//                                             className='ml-2 text-xs'
//                                           >
//                                             {normalizedFiles.length} file
//                                             {normalizedFiles.length > 1
//                                               ? 's'
//                                               : ''}
//                                           </Badge>
//                                         </label>
//                                         <div className='text-xs text-gray-500'>
//                                           {formatFileSize(
//                                             normalizedFiles.reduce(
//                                               (sum: number, file: any) =>
//                                                 sum + (file.size || 0),
//                                               0
//                                             )
//                                           )}
//                                         </div>
//                                       </div>

//                                       {/* Compact File List with Action Buttons */}
//                                       <div className='space-y-2'>
//                                         {normalizedFiles.map((file, index) => (
//                                           <div
//                                             key={`file-${fieldId}-${index}`}
//                                             className='flex items-center gap-3 bg-gray-50 p-3 rounded-lg '
//                                           >
//                                             {/* File Icon */}
//                                             <div className='w-8 h-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0'>
//                                               {getFileTypeInfo(file.mimeType)
//                                                 .icon &&
//                                                 React.createElement(
//                                                   getFileTypeInfo(file.mimeType)
//                                                     .icon,
//                                                   {
//                                                     className: `w-4 h-4 text-${
//                                                       getFileTypeInfo(
//                                                         file.mimeType
//                                                       ).color
//                                                     }-500`,
//                                                   }
//                                                 )}
//                                             </div>

//                                             {/* File Info - Truncated */}
//                                             <div className='flex-1 min-w-0'>
//                                               <p
//                                                 className='text-sm font-medium text-gray-900 truncate'
//                                                 title={file.originalName}
//                                                 style={{ maxWidth: '200px' }}
//                                               >
//                                                 {file.originalName.length > 25
//                                                   ? `${file.originalName.substring(
//                                                       0,
//                                                       25
//                                                     )}...`
//                                                   : file.originalName}
//                                               </p>
//                                               <p className='text-xs text-gray-500'>
//                                                 {formatFileSize(file.size)}
//                                               </p>
//                                             </div>

//                                             {/* Action Buttons - Only Download */}
//                                             <div className='flex gap-1 flex-shrink-0'>
//                                               {/* Download Button */}
//                                               <Button
//                                                 size='sm'
//                                                 variant='ghost'
//                                                 onClick={() =>
//                                                   handleDownloadFile(file)
//                                                 }
//                                                 disabled={
//                                                   downloadingFileId ===
//                                                   file.publicId
//                                                 }
//                                                 className='px-2 py-1 h-8 hover:bg-green-100'
//                                                 title={`Download ${file.originalName}`}
//                                               >
//                                                 {downloadingFileId ===
//                                                 file.publicId ? (
//                                                   <Loader2 className='w-4 h-4 animate-spin' />
//                                                 ) : (
//                                                   <Download className='w-4 h-4' />
//                                                 )}
//                                               </Button>
//                                             </div>
//                                           </div>
//                                         ))}
//                                       </div>
//                                     </div>
//                                   );
//                                 }
//                               );
//                             })()}
//                           </>
//                         )}
//                     </>
//                   )}
//                 </div>
//               </div>

//               {/* Action Buttons in Modal */}
//               <div className='flex justify-between items-center'>
//                 <div className='flex gap-3'>
//                   {/* AI Evaluation Button */}
//                   {isFeedbackForm &&
//                     !evaluatingSubmissions.has(selectedSubmission.id) &&
//                     !aiEvaluations[selectedSubmission.id] && (
//                       <Button
//                         variant='outline'
//                         onClick={() =>
//                           evaluateSubmissionWithAI(selectedSubmission)
//                         }
//                         className='bg-purple-500 hover:bg-purple-600 text-white border-purple-500'
//                       >
//                         <Brain className='w-4 h-4 mr-2' />
//                         Start AI Evaluation
//                       </Button>
//                     )}
//                 </div>
//               </div>
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>

//       {/* Delete Submission Confirmation Dialog */}
//       <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
//         <AlertDialogContent className='bg-white text-gray-900'>
//           <AlertDialogHeader>
//             <AlertDialogTitle className='text-red-600 font-bold flex items-center gap-2'>
//               <AlertTriangle className='w-5 h-5' />
//               Permanent Deletion Warning
//             </AlertDialogTitle>
//           </AlertDialogHeader>

//           {/* : Use a separate container instead of AlertDialogDescription */}
//           <div className='text-gray-700 px-6'>
//             <span className='block mb-4'>
//               This will permanently delete the submission and all associated
//               files from cloud storage.
//             </span>

//             {submissionToDelete &&
//               (() => {
//                 const submission = submissions.find(
//                   s => s.id === submissionToDelete
//                 );
//                 const fileCount = submission?.files?.length || 0;

//                 return fileCount > 0 ? (
//                   <div className='mt-3 p-3 bg-yellow-50 rounded-md border border-yellow-200'>
//                     <div className='flex items-center gap-2 text-yellow-800'>
//                       <AlertTriangle className='w-4 h-4' />
//                       <span className='font-medium'>Files to be deleted:</span>
//                     </div>
//                     <div className='mt-2 text-sm text-yellow-700'>
//                       {submission?.files
//                         ?.slice(0, 3)
//                         .map((file: any, index: number) => (
//                           <div key={index}>• {file.originalName}</div>
//                         ))}
//                       {fileCount > 3 && (
//                         <div>• and {fileCount - 3} more files...</div>
//                       )}
//                     </div>
//                   </div>
//                 ) : null;
//               })()}

//             <span className='block mt-3 font-medium text-red-600'>
//               This action cannot be undone.
//             </span>
//           </div>

//           <AlertDialogFooter>
//             <AlertDialogCancel
//               onClick={() => {
//                 setShowDeleteDialog(false);
//                 setSubmissionToDelete(null);
//               }}
//               disabled={isDeletingSubmissions}
//               className='border-gray-300 hover:bg-gray-50'
//             >
//               Cancel
//             </AlertDialogCancel>
//             <AlertDialogAction
//               onClick={() => {
//                 if (submissionToDelete) {
//                   handleDeleteSubmission(submissionToDelete);
//                 }
//               }}
//               disabled={isDeletingSubmissions}
//               className='bg-red-600 hover:bg-red-700 text-white'
//             >
//               {isDeletingSubmissions ? (
//                 <>
//                   <Loader2 className='w-4 h-4 mr-2 animate-spin' />
//                   Deleting...
//                 </>
//               ) : (
//                 <>
//                   <Trash2 className='w-4 h-4 mr-2' />
//                   Delete Permanently
//                 </>
//               )}
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>

//       {/* AI Evaluation Details Modal */}
//       <Dialog
//         open={showAIEvaluationModal}
//         onOpenChange={setShowAIEvaluationModal}
//       >
//         <DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto bg-white'>
//           <DialogHeader className='border-b border-gray-200 pb-4'>
//             <DialogTitle className='flex items-center gap-2 text-xl font-bold text-gray-900'>
//               <Brain className='w-6 h-6 text-purple-600' />
//               AI Evaluation Results
//               {selectedEvaluation && (
//                 <Badge
//                   variant='secondary'
//                   className={`ml-2 ${
//                     selectedEvaluation.formType === 'quiz'
//                       ? 'bg-blue-100 text-blue-800'
//                       : selectedEvaluation.formType === 'survey'
//                       ? 'bg-green-100 text-green-800'
//                       : selectedEvaluation.formType === 'feedback'
//                       ? 'bg-orange-100 text-orange-800'
//                       : 'bg-gray-100 text-gray-800'
//                   }`}
//                 >
//                   {selectedEvaluation.formType.charAt(0).toUpperCase() +
//                     selectedEvaluation.formType.slice(1)}{' '}
//                   Form
//                 </Badge>
//               )}
//             </DialogTitle>
//           </DialogHeader>

//           {selectedEvaluation && (
//             <div className='space-y-6 pt-4'>
//               {/* Quiz Results */}
//               {selectedEvaluation.formType === 'quiz' &&
//                 selectedEvaluation.quizResults && (
//                   <div className='space-y-6'>
//                     {/* Quiz Summary */}
//                     <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200'>
//                       <h3 className='text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2'>
//                         <Star className='w-5 h-5' />
//                         Quiz Performance Summary
//                       </h3>
//                       <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
//                         <div className='text-center'>
//                           <div className='text-3xl font-bold text-blue-600'>
//                             {selectedEvaluation.quizResults.percentage}%
//                           </div>
//                           <div className='text-sm text-gray-600'>
//                             Overall Score
//                           </div>
//                         </div>
//                         <div className='text-center'>
//                           <div className='text-3xl font-bold text-green-600'>
//                             {selectedEvaluation.quizResults.correctAnswers}
//                           </div>
//                           <div className='text-sm text-gray-600'>
//                             Correct Answers
//                           </div>
//                         </div>
//                         <div className='text-center'>
//                           <div className='text-3xl font-bold text-red-600'>
//                             {selectedEvaluation.quizResults.totalQuestions -
//                               selectedEvaluation.quizResults.correctAnswers}
//                           </div>
//                           <div className='text-sm text-gray-600'>
//                             Incorrect Answers
//                           </div>
//                         </div>
//                         <div className='text-center'>
//                           <div className='text-3xl font-bold text-gray-600'>
//                             {selectedEvaluation.quizResults.totalQuestions}
//                           </div>
//                           <div className='text-sm text-gray-600'>
//                             Total Questions
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Question-by-Question Analysis */}
//                     <div className='bg-white border border-gray-200 rounded-lg p-6'>
//                       <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
//                         <FileText className='w-5 h-5' />
//                         Detailed Question Analysis
//                       </h3>
//                       <div className='space-y-4'>
//                         {selectedEvaluation.quizResults.explanations.map(
//                           (explanation, index) => (
//                             <div
//                               key={explanation.questionId}
//                               className={`p-4 rounded-lg border-l-4 ${
//                                 explanation.isCorrect
//                                   ? 'border-l-green-500 bg-green-50'
//                                   : 'border-l-red-500 bg-red-50'
//                               }`}
//                             >
//                               <div className='flex items-start justify-between mb-2'>
//                                 <h4 className='font-medium text-gray-900'>
//                                   Question {index + 1}: {explanation.question}
//                                 </h4>
//                                 <Badge
//                                   variant={
//                                     explanation.isCorrect
//                                       ? 'default'
//                                       : 'destructive'
//                                   }
//                                   className={
//                                     explanation.isCorrect
//                                       ? 'bg-green-100 text-green-800'
//                                       : 'bg-red-100 text-red-800'
//                                   }
//                                 >
//                                   {explanation.isCorrect
//                                     ? 'Correct'
//                                     : 'Incorrect'}
//                                 </Badge>
//                               </div>

//                               <div className='space-y-2 text-sm'>
//                                 <div>
//                                   <span className='font-medium text-gray-700'>
//                                     Your Answer:
//                                   </span>
//                                   <span className='ml-2 text-gray-900'>
//                                     {explanation.userAnswer}
//                                   </span>
//                                 </div>

//                                 {!explanation.isCorrect && (
//                                   <div>
//                                     <span className='font-medium text-gray-700'>
//                                       Correct Answer:
//                                     </span>
//                                     <span className='ml-2 text-green-700 font-medium'>
//                                       {explanation.correctAnswer}
//                                     </span>
//                                   </div>
//                                 )}

//                                 <div className='mt-3 p-3 bg-white rounded border'>
//                                   <span className='font-medium text-gray-700'>
//                                     Explanation:
//                                   </span>
//                                   <p className='mt-1 text-gray-900 leading-relaxed'>
//                                     {explanation.explanation}
//                                   </p>
//                                 </div>
//                               </div>
//                             </div>
//                           )
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 )}

//               {/* Survey Results */}
//               {selectedEvaluation.formType === 'survey' &&
//                 selectedEvaluation.surveyResults && (
//                   <div className='space-y-6'>
//                     {/* Sentiment Overview */}
//                     <div className='bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200'>
//                       <h3 className='text-lg font-semibold text-green-900 mb-4 flex items-center gap-2'>
//                         <Brain className='w-5 h-5' />
//                         Sentiment Analysis
//                       </h3>
//                       <div className='grid grid-cols-3 gap-4 mb-4'>
//                         <div className='text-center'>
//                           <div className='text-3xl font-bold text-green-600'>
//                             {
//                               selectedEvaluation.surveyResults.overallSentiment
//                                 .positive
//                             }
//                             %
//                           </div>
//                           <div className='text-sm text-gray-600'>Positive</div>
//                         </div>
//                         <div className='text-center'>
//                           <div className='text-3xl font-bold text-yellow-600'>
//                             {
//                               selectedEvaluation.surveyResults.overallSentiment
//                                 .neutral
//                             }
//                             %
//                           </div>
//                           <div className='text-sm text-gray-600'>Neutral</div>
//                         </div>
//                         <div className='text-center'>
//                           <div className='text-3xl font-bold text-red-600'>
//                             {
//                               selectedEvaluation.surveyResults.overallSentiment
//                                 .negative
//                             }
//                             %
//                           </div>
//                           <div className='text-sm text-gray-600'>Negative</div>
//                         </div>
//                       </div>

//                       {/* Visual Sentiment Bar */}
//                       <div className='w-full bg-gray-200 rounded-full h-4 mb-4'>
//                         <div className='flex h-full rounded-full overflow-hidden'>
//                           <div
//                             className='bg-green-500'
//                             style={{
//                               width: `${selectedEvaluation.surveyResults.overallSentiment.positive}%`,
//                             }}
//                           ></div>
//                           <div
//                             className='bg-yellow-500'
//                             style={{
//                               width: `${selectedEvaluation.surveyResults.overallSentiment.neutral}%`,
//                             }}
//                           ></div>
//                           <div
//                             className='bg-red-500'
//                             style={{
//                               width: `${selectedEvaluation.surveyResults.overallSentiment.negative}%`,
//                             }}
//                           ></div>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Key Metrics */}
//                     <div className='bg-white border border-gray-200 rounded-lg p-6'>
//                       <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
//                         <Star className='w-5 h-5' />
//                         Key Performance Metrics
//                       </h3>
//                       <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
//                         {selectedEvaluation.surveyResults.keyMetrics.map(
//                           (metric, index) => (
//                             <div
//                               key={index}
//                               className='p-4 bg-gray-50 rounded-lg'
//                             >
//                               <div className='flex items-center justify-between mb-2'>
//                                 <h4 className='font-medium text-gray-900'>
//                                   {metric.metric}
//                                 </h4>
//                                 <Badge
//                                   variant='secondary'
//                                   className={`${
//                                     metric.trend === 'up'
//                                       ? 'bg-green-100 text-green-800'
//                                       : metric.trend === 'down'
//                                       ? 'bg-red-100 text-red-800'
//                                       : 'bg-yellow-100 text-yellow-800'
//                                   }`}
//                                 >
//                                   {metric.trend === 'up'
//                                     ? '↗'
//                                     : metric.trend === 'down'
//                                     ? '↘'
//                                     : '→'}{' '}
//                                   {metric.trend}
//                                 </Badge>
//                               </div>
//                               <div className='text-2xl font-bold text-blue-600'>
//                                 {metric.value}
//                               </div>
//                             </div>
//                           )
//                         )}
//                       </div>
//                     </div>

//                     {/* Insights */}
//                     <div className='bg-blue-50 border border-blue-200 rounded-lg p-6'>
//                       <h3 className='text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2'>
//                         <AlertCircle className='w-5 h-5' />
//                         Key Insights
//                       </h3>
//                       <ul className='space-y-2'>
//                         {selectedEvaluation.surveyResults.insights.map(
//                           (insight, index) => (
//                             <li key={index} className='flex items-start gap-2'>
//                               <CheckCircle className='w-4 h-4 text-blue-600 mt-1 flex-shrink-0' />
//                               <span className='text-gray-900'>{insight}</span>
//                             </li>
//                           )
//                         )}
//                       </ul>
//                     </div>
//                   </div>
//                 )}

//               {/* Feedback Results */}
//               {selectedEvaluation.formType === 'feedback' &&
//                 selectedEvaluation.feedbackResults && (
//                   <div className='space-y-6'>
//                     {/* Sentiment Analysis */}
//                     <div className='bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg border border-orange-200'>
//                       <h3 className='text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2'>
//                         <Brain className='w-5 h-5' />
//                         Sentiment Analysis
//                         <Badge
//                           variant='destructive'
//                           className={`ml-2 ${
//                             selectedEvaluation.feedbackResults.urgencyLevel ===
//                             'high'
//                               ? 'bg-red-100 text-red-800'
//                               : selectedEvaluation.feedbackResults
//                                   .urgencyLevel === 'medium'
//                               ? 'bg-yellow-100 text-yellow-800'
//                               : 'bg-green-100 text-green-800'
//                           }`}
//                         >
//                           {selectedEvaluation.feedbackResults.urgencyLevel
//                             .charAt(0)
//                             .toUpperCase() +
//                             selectedEvaluation.feedbackResults.urgencyLevel.slice(
//                               1
//                             )}{' '}
//                           Priority
//                         </Badge>
//                       </h3>

//                       <div className='grid grid-cols-3 gap-4 mb-4'>
//                         <div className='text-center'>
//                           <div className='text-3xl font-bold text-green-600'>
//                             {
//                               selectedEvaluation.feedbackResults
//                                 .sentimentBreakdown.positive
//                             }
//                             %
//                           </div>
//                           <div className='text-sm text-gray-600'>Positive</div>
//                         </div>
//                         <div className='text-center'>
//                           <div className='text-3xl font-bold text-yellow-600'>
//                             {
//                               selectedEvaluation.feedbackResults
//                                 .sentimentBreakdown.neutral
//                             }
//                             %
//                           </div>
//                           <div className='text-sm text-gray-600'>Neutral</div>
//                         </div>
//                         <div className='text-center'>
//                           <div className='text-3xl font-bold text-red-600'>
//                             {
//                               selectedEvaluation.feedbackResults
//                                 .sentimentBreakdown.negative
//                             }
//                             %
//                           </div>
//                           <div className='text-sm text-gray-600'>Negative</div>
//                         </div>
//                       </div>

//                       {/* Visual Sentiment Bar */}
//                       <div className='w-full bg-gray-200 rounded-full h-4'>
//                         <div className='flex h-full rounded-full overflow-hidden'>
//                           <div
//                             className='bg-green-500'
//                             style={{
//                               width: `${selectedEvaluation.feedbackResults.sentimentBreakdown.positive}%`,
//                             }}
//                           ></div>
//                           <div
//                             className='bg-yellow-500'
//                             style={{
//                               width: `${selectedEvaluation.feedbackResults.sentimentBreakdown.neutral}%`,
//                             }}
//                           ></div>
//                           <div
//                             className='bg-red-500'
//                             style={{
//                               width: `${selectedEvaluation.feedbackResults.sentimentBreakdown.negative}%`,
//                             }}
//                           ></div>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Critical Themes */}
//                     <div className='bg-white border border-gray-200 rounded-lg p-6'>
//                       <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
//                         <AlertTriangle className='w-5 h-5' />
//                         Critical Themes Analysis
//                       </h3>
//                       <div className='space-y-4'>
//                         {selectedEvaluation.feedbackResults.criticalThemes.map(
//                           (theme, index) => (
//                             <div
//                               key={index}
//                               className={`p-4 rounded-lg border-l-4 ${
//                                 theme.severity === 'high'
//                                   ? 'border-l-red-500 bg-red-50'
//                                   : theme.severity === 'medium'
//                                   ? 'border-l-yellow-500 bg-yellow-50'
//                                   : 'border-l-green-500 bg-green-50'
//                               }`}
//                             >
//                               <div className='flex items-center justify-between mb-2'>
//                                 <h4 className='font-medium text-gray-900'>
//                                   {theme.theme}
//                                 </h4>
//                                 <div className='flex items-center gap-2'>
//                                   <Badge
//                                     variant='secondary'
//                                     className={`${
//                                       theme.severity === 'high'
//                                         ? 'bg-red-100 text-red-800'
//                                         : theme.severity === 'medium'
//                                         ? 'bg-yellow-100 text-yellow-800'
//                                         : 'bg-green-100 text-green-800'
//                                     }`}
//                                   >
//                                     {theme.severity.charAt(0).toUpperCase() +
//                                       theme.severity.slice(1)}{' '}
//                                     Severity
//                                   </Badge>
//                                   <span className='text-sm text-gray-600'>
//                                     {theme.frequency} mention
//                                     {theme.frequency > 1 ? 's' : ''}
//                                   </span>
//                                 </div>
//                               </div>

//                               <div className='mt-3'>
//                                 <span className='font-medium text-gray-700 text-sm'>
//                                   Examples:
//                                 </span>
//                                 <div className='mt-1 flex flex-wrap gap-1'>
//                                   {theme.examples.map(
//                                     (example, exampleIndex) => (
//                                       <Badge
//                                         key={exampleIndex}
//                                         variant='outline'
//                                         className='text-xs bg-white'
//                                       >
//                                         {example.length > 50
//                                           ? example.substring(0, 50) + '...'
//                                           : example}
//                                       </Badge>
//                                     )
//                                   )}
//                                 </div>
//                               </div>
//                             </div>
//                           )
//                         )}
//                       </div>
//                     </div>

//                     {/* Actionable Insights */}
//                     <div className='bg-blue-50 border border-blue-200 rounded-lg p-6'>
//                       <h3 className='text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2'>
//                         <CheckCircle className='w-5 h-5' />
//                         Actionable Insights & Recommendations
//                       </h3>
//                       <ul className='space-y-3'>
//                         {selectedEvaluation.feedbackResults.actionableInsights.map(
//                           (insight, index) => (
//                             <li
//                               key={index}
//                               className='flex items-start gap-3 p-3 bg-white rounded border'
//                             >
//                               <div className='w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
//                                 <span className='text-blue-600 text-sm font-medium'>
//                                   {index + 1}
//                                 </span>
//                               </div>
//                               <span className='text-gray-900 leading-relaxed'>
//                                 {insight}
//                               </span>
//                             </li>
//                           )
//                         )}
//                       </ul>
//                     </div>
//                   </div>
//                 )}

//               {/* General Form Results */}
//               {selectedEvaluation.formType === 'general' && (
//                 <div className='bg-gray-50 border border-gray-200 rounded-lg p-6'>
//                   <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
//                     <FileText className='w-5 h-5' />
//                     General Analysis
//                   </h3>
//                   <p className='text-gray-700 leading-relaxed'>
//                     {selectedEvaluation.feedback}
//                   </p>
//                 </div>
//               )}

//               {/* Evaluation Metadata */}
//               <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
//                 <div className='flex items-center justify-between text-sm text-gray-600'>
//                   <span>
//                     Evaluation completed:{' '}
//                     {formatDateTime(selectedEvaluation.evaluatedAt)}
//                   </span>
//                   <span>Analysis ID: {selectedEvaluation.id}</span>
//                 </div>
//               </div>
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default FormSubmissionsPage;

// src/components/form-builder/submissions/FormSubmissionsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useDeletion } from '@/hooks/useDeletion';
import {
  Download,
  Search,
  Eye,
  EyeOff,
  Calendar,
  User,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Brain,
  Loader2,
  Star,
  AlertTriangle,
  Hash,
  IdCard,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  submissionsService,
  type Submission,
  type SubmissionStats,
  type PaginationInfo,
} from '@/services/submissions';
import { formsService } from '@/services/forms';
import { formatFileSize } from '@/services/fileUploadService';
import FileManager from '@/components/form-builder/FileManager';
import {
  aiEvaluationService,
  type AIEvaluationResult,
} from '@/services/aiEvaluation';
import { apiConfig } from '@/config/api';
import axios from 'axios';

// ===== UTILITY FUNCTIONS =====
const formatDateTime = (dateString: string): string => {
  if (!dateString) return 'Unknown';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Invalid Date';
  }
};

const formatTimeAgo = (dateString: string): string => {
  if (!dateString) return 'Unknown';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 30) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
};

// Enhanced function to format display value beautifully
const formatDisplayValue = (value: any): string => {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    return value
      .map(item => {
        if (typeof item === 'object' && item !== null) {
          if (item.label && item.value) {
            return item.label;
          }
          if (item.firstName && item.lastName) {
            return `${item.firstName} ${item.lastName}`;
          }
          if (item.originalName) {
            return item.originalName;
          }
          return Object.values(item).join(' ');
        }
        return String(item);
      })
      .join(', ');
  }

  if (typeof value === 'object') {
    if (value.firstName && value.lastName) {
      return `${value.firstName} ${value.lastName}`.trim();
    }

    if (value.street || value.city || value.state || value.zipCode) {
      const addressParts = [
        value.street,
        value.city,
        value.state,
        value.zipCode,
        value.country,
      ].filter(part => part && part.trim());
      return addressParts.join(', ');
    }

    if (value.countryCode && value.number) {
      return `${value.countryCode} ${value.number}`;
    }

    if (value.label && value.value) {
      return value.label;
    }

    if (value.originalName && value.url) {
      return value.originalName;
    }

    if (value.date || value.time) {
      const datePart = value.date
        ? new Date(value.date).toLocaleDateString()
        : '';
      const timePart = value.time || '';
      return `${datePart} ${timePart}`.trim();
    }

    const meaningfulValues = Object.entries(value)
      .filter(
        ([key, val]) =>
          val !== null &&
          val !== undefined &&
          val !== '' &&
          !key.startsWith('_') &&
          key !== 'id' &&
          key !== 'createdAt' &&
          key !== 'updatedAt'
      )
      .map(([, val]) => {
        if (typeof val === 'object') {
          return formatDisplayValue(val);
        }
        return String(val);
      })
      .filter(val => val && val !== 'N/A');

    return meaningfulValues.length > 0 ? meaningfulValues.join(', ') : 'N/A';
  }

  return String(value);
};

// ===== AI EVALUATION TYPES =====
type AIEvaluation = AIEvaluationResult;

// ===== UNIQUE FIELD TYPES =====
interface UniqueField {
  fieldId: string;
  label: string;
  type:
    | 'enrollment'
    | 'student_id'
    | 'employee_id'
    | 'user_id'
    | 'roll_number'
    | 'custom_id';
  icon: React.ReactNode;
  priority: number;
}

// ===== FILE HANDLING FUNCTIONS =====
// Enhanced function to get files for a specific field from submission.files array
const getFilesForField = (submission: Submission, fieldId: string): any[] => {
  if (!submission.files || !Array.isArray(submission.files)) return [];

  return submission.files.filter((file: any) => file.fieldId === fieldId);
};

// Check if a field has files (either in files array or data object)
const fieldHasFiles = (submission: Submission, fieldId: string): boolean => {
  // Check submission.files array first
  const filesFromArray = getFilesForField(submission, fieldId);
  if (filesFromArray.length > 0) return true;

  // Check data object for legacy file storage
  const value = submission.data[fieldId];
  if (!value) return false;

  // Check for file-like objects
  if (typeof value === 'object' && !Array.isArray(value)) {
    return (
      !!(value.originalName && value.url) || !!(value.fileName && value.url)
    );
  }

  if (Array.isArray(value) && value.length > 0) {
    const firstItem = value[0];
    return (
      !!(firstItem?.originalName && firstItem?.url) ||
      !!(firstItem?.fileName && firstItem?.url)
    );
  }

  return false;
};

// Get all files for a field from both sources
const getAllFilesForField = (
  submission: Submission,
  fieldId: string
): any[] => {
  const filesFromArray = getFilesForField(submission, fieldId);

  // If we have files in the files array, use those
  if (filesFromArray.length > 0) {
    return filesFromArray;
  }

  // Otherwise check data object for legacy files
  const value = submission.data[fieldId];
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.filter(item => item?.originalName && item?.url);
  }

  if (typeof value === 'object' && value.originalName && value.url) {
    return [value];
  }

  return [];
};

// Enhanced file type detection
const getFileTypeInfo = (mimeType: string) => {
  if (mimeType.startsWith('image/')) {
    return { type: 'image', icon: ImageIcon, color: 'blue' };
  } else if (mimeType.startsWith('video/')) {
    return { type: 'video', icon: Video, color: 'purple' };
  } else if (mimeType.startsWith('audio/')) {
    return { type: 'audio', icon: Music, color: 'green' };
  } else if (mimeType.includes('pdf')) {
    return { type: 'pdf', icon: FileText, color: 'red' };
  } else if (mimeType.includes('zip') || mimeType.includes('rar')) {
    return { type: 'archive', icon: Archive, color: 'orange' };
  } else {
    return { type: 'file', icon: FileText, color: 'gray' };
  }
};

// ===== ENHANCED FORM TYPE DETECTION =====
const detectFormTypeClient = (
  formData: any
): 'quiz' | 'survey' | 'feedback' | 'general' => {
  const formTitle = formData?.title?.toLowerCase() || '';
  const formDescription = formData?.description?.toLowerCase() || '';

  let quizIndicators = 0;
  let surveyIndicators = 0;
  let feedbackIndicators = 0;

  console.log('🔍 Enhanced form type detection for submissions page:', {
    title: formTitle,
    description: formDescription,
  });

  // Analyze title and description with enhanced keywords
  const titleDescText = formTitle + ' ' + formDescription;

  if (
    /quiz|test|exam|assessment|question|correct|answer|choose|select|true.*false|multiple.*choice/i.test(
      titleDescText
    )
  ) {
    quizIndicators += 3;
  }

  if (
    /survey|poll|research|opinion|rate|rating|satisfaction|scale|score|feedback.*form|customer.*survey/i.test(
      titleDescText
    )
  ) {
    surveyIndicators += 3;
  }

  if (
    /feedback|review|comment|experience|improve|suggestion|thoughts|opinion|testimonial|evaluation/i.test(
      titleDescText
    )
  ) {
    feedbackIndicators += 3;
  }

  // Analyze form fields with better detection
  if (formData?.pages) {
    formData.pages.forEach((page: any) => {
      if (page.fields) {
        page.fields.forEach((field: any) => {
          const fieldLabel = field.label?.toLowerCase() || '';
          const fieldType = field.type?.toLowerCase() || '';

          // Enhanced quiz patterns
          if (
            fieldType === 'singlechoice' ||
            fieldType === 'multiplechoice' ||
            fieldType === 'dropdown'
          ) {
            if (
              /correct|answer|choose|select|true|false|which.*is|what.*is|pick.*right|best.*answer/i.test(
                fieldLabel
              ) ||
              field.correctAnswer
            ) {
              quizIndicators += 2;
            }
          }

          // Enhanced survey patterns
          if (
            /rate|rating|satisfaction|quality|likely|recommend|scale|score|excellent|good|poor|how.*would.*you|on.*scale/i.test(
              fieldLabel
            )
          ) {
            surveyIndicators += 2;
          }

          // Enhanced feedback patterns
          if (fieldType === 'longtext' || fieldType === 'paragraph') {
            if (
              /feedback|comment|improve|experience|suggest|issue|problem|opinion|thoughts|recommendation|tell.*us|what.*do.*you.*think/i.test(
                fieldLabel
              )
            ) {
              feedbackIndicators += 2;
            }
          }

          // Generic feedback indicators
          if (
            /how.*was|tell.*about|share.*your|describe.*your|any.*additional|overall.*experience/i.test(
              fieldLabel
            )
          ) {
            feedbackIndicators += 1;
          }
        });
      }
    });
  }

  console.log('📊 Form type indicators:', {
    quiz: quizIndicators,
    survey: surveyIndicators,
    feedback: feedbackIndicators,
  });

  // Determine form type based on highest score with better thresholds
  if (quizIndicators >= 3) return 'quiz';
  if (surveyIndicators >= 3) return 'survey';
  if (feedbackIndicators >= 2) return 'feedback'; // Lower threshold for feedback

  // Fallback logic
  if (
    quizIndicators > surveyIndicators &&
    quizIndicators > feedbackIndicators
  ) {
    return 'quiz';
  }
  if (surveyIndicators > feedbackIndicators) {
    return 'survey';
  }
  if (feedbackIndicators > 0) {
    return 'feedback';
  }

  return 'general';
};

// ===== MAIN COMPONENT =====
const FormSubmissionsPage: React.FC = () => {
  const params = useParams();
  const formId = params?.formId as string;

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [formStructure, setFormStructure] = useState<any>(null);
  const [fieldLabelsMap, setFieldLabelsMap] = useState<Record<string, string>>(
    {}
  );
  const [stats, setStats] = useState<SubmissionStats>({
    total: 0,
    unread: 0,
    pending: 0,
    processed: 0,
    failed: 0,
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    current: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(
    null
  );

  // AI Evaluation state
  const [aiEvaluations, setAiEvaluations] = useState<
    Record<string, AIEvaluation>
  >({});
  const [evaluatingSubmissions, setEvaluatingSubmissions] = useState<
    Set<string>
  >(new Set());

  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(
    null
  );

  // Form analysis state
  const [uniqueFields, setUniqueFields] = useState<UniqueField[]>([]);
  const [hasEmailField, setHasEmailField] = useState(false);
  const [hasFullNameField, setHasFullNameField] = useState(false);
  const [isFeedbackForm, setIsFeedbackForm] = useState(false);
  const [detectedFormType, setDetectedFormType] = useState<string>('general');

  // Initialize deletion hook for submissions
  const { isDeleting: isDeletingSubmissions, deleteItems: deleteSubmissions } =
    useDeletion({
      type: 'submission',
      requireConfirmation: true,
      onSuccess: result => {
        console.log('✅ Submissions deletion completed:', result);
        fetchSubmissions(); // Refresh submissions list
      },
      onError: error => {
        console.error('❌ Submissions deletion failed:', error);
      },
    });

  // ===== ENHANCED FIELD DETECTION FUNCTIONS =====

  // Function to detect unique identifier fields
  const detectUniqueFields = (formData: any): UniqueField[] => {
    const uniqueFields: UniqueField[] = [];

    if (formData?.pages && Array.isArray(formData.pages)) {
      formData.pages.forEach((page: any) => {
        if (page.fields && Array.isArray(page.fields)) {
          page.fields.forEach((field: any) => {
            if (!field.id || !field.label) return;

            const fieldLabel = field.label.toLowerCase();
            const fieldId = field.id.toLowerCase();

            const uniquePatterns = [
              {
                patterns: [
                  'enrollment number',
                  'enrollment no',
                  'enrollment id',
                  'enroll no',
                  'enrollment',
                ],
                type: 'enrollment' as const,
                icon: <Hash className='w-4 h-4' />,
                priority: 1,
              },
              {
                patterns: [
                  'student id',
                  'student number',
                  'student no',
                  'student_id',
                  'studentid',
                  'roll number',
                  'roll no',
                  'roll_number',
                  'rollno',
                  'roll_no',
                ],
                type: 'student_id' as const,
                icon: <IdCard className='w-4 h-4' />,
                priority: 2,
              },
              {
                patterns: [
                  'employee id',
                  'employee number',
                  'employee no',
                  'emp id',
                  'emp_id',
                  'employeeid',
                ],
                type: 'employee_id' as const,
                icon: <IdCard className='w-4 h-4' />,
                priority: 3,
              },
              {
                patterns: [
                  'user id',
                  'user number',
                  'user no',
                  'userid',
                  'user_id',
                ],
                type: 'user_id' as const,
                icon: <User className='w-4 h-4' />,
                priority: 4,
              },
              {
                patterns: [
                  'id number',
                  'id no',
                  'identification',
                  'reg no',
                  'registration number',
                  'customer id',
                  'reference id',
                ],
                type: 'custom_id' as const,
                icon: <Hash className='w-4 h-4' />,
                priority: 5,
              },
            ];

            for (const pattern of uniquePatterns) {
              const isMatch = pattern.patterns.some(
                p =>
                  fieldLabel.includes(p) ||
                  fieldId.includes(p.replace(/\s+/g, ''))
              );

              if (isMatch) {
                uniqueFields.push({
                  fieldId: field.id,
                  label: field.label,
                  type: pattern.type,
                  icon: pattern.icon,
                  priority: pattern.priority,
                });
                break;
              }
            }
          });
        }
      });
    }

    return uniqueFields.sort((a, b) => a.priority - b.priority).slice(0, 2);
  };

  // ===== ENHANCED FORM ANALYSIS FUNCTION =====
  const analyzeFormStructure = (formData: any) => {
    let emailFound = false;
    let fullNameFound = false;

    const labelsMap: Record<string, string> = {};
    const detectedUniqueFields = detectUniqueFields(formData);
    setUniqueFields(detectedUniqueFields);

    // Enhanced form type detection
    const formType = detectFormTypeClient(formData);
    const shouldEvaluate = ['quiz', 'survey', 'feedback'].includes(formType);

    setDetectedFormType(formType);
    setIsFeedbackForm(shouldEvaluate);

    console.log('🎯 Form analysis results:', {
      formType,
      shouldEvaluate,
      uniqueFieldsCount: detectedUniqueFields.length,
    });

    if (formData?.pages && Array.isArray(formData.pages)) {
      formData.pages.forEach((page: any) => {
        if (page.fields && Array.isArray(page.fields)) {
          page.fields.forEach((field: any) => {
            if (field.id && field.label) {
              labelsMap[field.id] = field.label;
            }

            // Enhanced email field detection
            if (
              detectedUniqueFields.length < 2 &&
              (field.type === 'email' ||
                field.label?.toLowerCase().includes('email') ||
                field.label?.toLowerCase().includes('e-mail') ||
                field.id?.toLowerCase().includes('email'))
            ) {
              emailFound = true;
            }

            // Enhanced full name field detection
            if (
              detectedUniqueFields.length < 1 &&
              (field.type === 'fullName' ||
                field.label?.toLowerCase().includes('full name') ||
                field.label?.toLowerCase().includes('name') ||
                field.label?.toLowerCase().includes('your name') ||
                field.id?.toLowerCase().includes('fullname') ||
                field.id?.toLowerCase().includes('name'))
            ) {
              fullNameFound = true;
            }
          });
        }
      });
    }

    // Set display preferences based on unique fields found
    if (detectedUniqueFields.length === 0) {
      setHasEmailField(emailFound);
      setHasFullNameField(fullNameFound);
    } else if (detectedUniqueFields.length === 1) {
      setHasEmailField(emailFound);
      setHasFullNameField(false);
    } else {
      setHasEmailField(false);
      setHasFullNameField(false);
    }

    setFieldLabelsMap(labelsMap);

    console.log('📋 Field mapping created:', {
      totalFields: Object.keys(labelsMap).length,
      hasEmail: emailFound,
      hasFullName: fullNameFound,
      uniqueFields: detectedUniqueFields.map(f => f.label),
    });

    return labelsMap;
  };

  // ===== ENHANCED VALUE EXTRACTION FUNCTIONS =====

  // Enhanced function to get value from submission by field ID
  const getFieldValueFromSubmission = (
    submission: Submission,
    fieldId: string
  ): string => {
    const data = submission.data;
    const value = data[fieldId];
    const result = formatDisplayValue(value);

    console.log('🔍 Getting field value:', {
      fieldId,
      fieldLabel: fieldLabelsMap[fieldId],
      rawValue: value,
      formattedValue: result,
    });

    return result;
  };

  // Enhanced function to get email value from submission
  const getEmailFromSubmission = (submission: Submission): string => {
    const data = submission.data;

    console.log('📧 Searching for email field in submission:', {
      submissionId: submission.id,
      dataKeys: Object.keys(data),
      fieldLabelsMap: Object.keys(fieldLabelsMap),
    });

    // Try direct field matching first
    for (const [key, value] of Object.entries(data)) {
      const label = fieldLabelsMap[key]?.toLowerCase() || key.toLowerCase();

      if (
        key.toLowerCase().includes('email') ||
        label.includes('email') ||
        label.includes('e-mail')
      ) {
        const result = formatDisplayValue(value);
        console.log('✅ Found email field:', { key, label, value: result });
        return result;
      }
    }

    // Try to find any field that looks like an email
    for (const [key, value] of Object.entries(data)) {
      if (
        typeof value === 'string' &&
        value.includes('@') &&
        value.includes('.')
      ) {
        const result = formatDisplayValue(value);
        console.log('✅ Found email-like value:', { key, value: result });
        return result;
      }
    }

    console.log('❌ No email field found');
    return 'N/A';
  };

  // ===== ENHANCED FULL NAME EXTRACTION =====
  const getFullNameFromSubmission = (submission: Submission): string => {
    const data = submission.data;

    console.log('👤 Enhanced full name search in submission:', {
      submissionId: submission.id,
      dataKeys: Object.keys(data),
      fieldLabelsMap: Object.entries(fieldLabelsMap),
    });

    // Step 1: Look for explicit full name fields
    for (const [key, value] of Object.entries(data)) {
      const label = fieldLabelsMap[key]?.toLowerCase() || key.toLowerCase();

      // Check for full name patterns
      if (
        label.includes('full name') ||
        label.includes('complete name') ||
        label.includes('your name') ||
        key.toLowerCase().includes('fullname') ||
        key.toLowerCase().includes('completename') ||
        (label === 'name' &&
          !label.includes('first') &&
          !label.includes('last'))
      ) {
        const result = formatDisplayValue(value);
        if (result !== 'N/A') {
          console.log('✅ Found full name field:', {
            key,
            label,
            value: result,
          });
          return result;
        }
      }
    }

    // Step 2: Look for fullName type fields (object with firstName/lastName)
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value !== null) {
        if (value.firstName && value.lastName) {
          const result = `${value.firstName} ${value.lastName}`.trim();
          console.log('✅ Found fullName object:', { key, value, result });
          return result;
        }

        // Check for other name combinations
        if (value.first && value.last) {
          const result = `${value.first} ${value.last}`.trim();
          console.log('✅ Found first/last object:', { key, value, result });
          return result;
        }
      }
    }

    // Step 3: Look for separate first name and last name fields
    let firstName = '';
    let lastName = '';

    for (const [key, value] of Object.entries(data)) {
      const label = fieldLabelsMap[key]?.toLowerCase() || key.toLowerCase();

      if (
        label.includes('first name') ||
        label.includes('firstname') ||
        key.toLowerCase().includes('firstname') ||
        key.toLowerCase() === 'fname'
      ) {
        firstName = formatDisplayValue(value);
        console.log('📝 Found first name:', { key, label, value: firstName });
      } else if (
        label.includes('last name') ||
        label.includes('lastname') ||
        label.includes('surname') ||
        key.toLowerCase().includes('lastname') ||
        key.toLowerCase() === 'lname'
      ) {
        lastName = formatDisplayValue(value);
        console.log('📝 Found last name:', { key, label, value: lastName });
      }
    }

    if (firstName !== 'N/A' && lastName !== 'N/A') {
      const result = `${firstName} ${lastName}`.trim();
      console.log('✅ Constructed full name from parts:', {
        firstName,
        lastName,
        result,
      });
      return result;
    }

    if (firstName !== 'N/A') {
      console.log('✅ Using first name only:', firstName);
      return firstName;
    }

    if (lastName !== 'N/A') {
      console.log('✅ Using last name only:', lastName);
      return lastName;
    }

    // Step 4: Look for any field that might contain a name
    for (const [key, value] of Object.entries(data)) {
      const label = fieldLabelsMap[key]?.toLowerCase() || key.toLowerCase();

      if (
        (label.includes('name') &&
          !label.includes('company') &&
          !label.includes('business') &&
          !label.includes('organization') &&
          !label.includes('file')) ||
        key.toLowerCase().includes('name')
      ) {
        const result = formatDisplayValue(value);
        if (result !== 'N/A' && result.length > 1) {
          console.log('✅ Found potential name field:', {
            key,
            label,
            value: result,
          });
          return result;
        }
      }
    }

    console.log('❌ No name field found');
    return 'N/A';
  };

  // Function to fetch form structure
  const fetchFormStructure = useCallback(async () => {
    if (!formId) return;

    try {
      console.log('📋 Fetching form structure for:', formId);
      const response = await formsService.getForm(formId);
      if (response.success && response.data) {
        setFormStructure(response.data);
        analyzeFormStructure(response.data);
        console.log('✅ Form structure fetched and analyzed');
      }
    } catch (error) {
      console.error('❌ Error fetching form structure:', error);
    }
  }, [formId]);

  // Function to evaluate submission with AI
  const evaluateSubmissionWithAI = async (submission: Submission) => {
    if (evaluatingSubmissions.has(submission.id)) return;

    setEvaluatingSubmissions(prev => new Set(prev).add(submission.id));

    try {
      console.log(
        '🤖 Starting real AI evaluation for submission:',
        submission.id
      );

      const result = await aiEvaluationService.evaluateSubmission(
        submission.id
      );

      if (result.success && result.data) {
        setAiEvaluations(prev => ({
          ...prev,
          [submission.id]: result.data as AIEvaluation,
        }));
        console.log(
          '✅ AI evaluation completed for submission:',
          submission.id
        );
      } else {
        throw new Error(result.error || 'Evaluation failed');
      }
    } catch (error: any) {
      console.error('❌ Error in AI evaluation:', error);
      setAiEvaluations(prev => ({
        ...prev,
        [submission.id]: {
          id: `eval_${submission.id}`,
          submissionId: submission.id,
          formType: 'general',
          sentiment: 'neutral',
          categories: [],
          evaluatedAt: new Date().toISOString(),
          status: 'failed',
          feedback: 'Evaluation failed: ' + error.message,
        },
      }));

      toast.error('AI evaluation failed', {
        description: error.message,
        duration: 5000,
      });
    } finally {
      setEvaluatingSubmissions(prev => {
        const newSet = new Set(prev);
        newSet.delete(submission.id);
        return newSet;
      });
    }
  };

  // Enhanced batch evaluation function
  const evaluateMultipleSubmissions = async (submissionIds: string[]) => {
    if (!formId) return;

    try {
      console.log(
        '🤖 Starting enhanced batch AI evaluation for',
        submissionIds.length,
        'submissions'
      );

      // Mark all submissions as evaluating
      setEvaluatingSubmissions(prev => {
        const newSet = new Set(prev);
        submissionIds.forEach(id => newSet.add(id));
        return newSet;
      });

      const result = await aiEvaluationService.evaluateBatch(
        formId,
        submissionIds
      );

      if (result.success && result.data) {
        const evaluationsMap: Record<string, AIEvaluation> = {};
        let successCount = 0;
        let failedCount = 0;

        result.data.forEach(evaluation => {
          evaluationsMap[evaluation.submissionId] = evaluation;
          if (evaluation.status === 'completed') {
            successCount++;
          } else {
            failedCount++;
          }
        });

        setAiEvaluations(prev => ({
          ...prev,
          ...evaluationsMap,
        }));

        console.log('✅ Enhanced batch AI evaluation completed:', {
          total: result.data.length,
          successful: successCount,
          failed: failedCount,
        });
      } else {
        throw new Error(result.error || 'Batch evaluation failed');
      }
    } catch (error: any) {
      console.error('❌ Batch evaluation error:', error);
      toast.error('Batch evaluation failed', {
        description: error.message,
        duration: 5000,
      });
    } finally {
      // Remove all submissions from evaluating state
      setEvaluatingSubmissions(prev => {
        const newSet = new Set(prev);
        submissionIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    }
  };

  // API call to fetch submissions
  const fetchSubmissions = useCallback(
    async (page = 1, limit = 20) => {
      if (!formId) {
        setLoading(false);
        return;
      }

      try {
        console.log('📡 Fetching submissions for form:', formId);

        const filters = {
          page,
          limit,
          sortBy: 'submittedAt',
          sortOrder: 'desc' as const,
          ...(searchTerm && { search: searchTerm }),
          ...(statusFilter !== 'all' && { status: statusFilter }),
          ...(readFilter !== 'all' && {
            isRead: readFilter === 'read' ? 'true' : 'false',
          }),
        };

        const response = await submissionsService.getSubmissions(
          formId,
          filters
        );

        if (response.success) {
          const processedSubmissions = (response.data.submissions || []).map(
            (submission: any) => {
              const id = submission.id || submission._id;
              if (!id) {
                console.warn('⚠️ Submission missing ID:', submission);
              }

              return {
                ...submission,
                id: id ? String(id) : '',
              };
            }
          );

          setSubmissions(processedSubmissions);
          setStats(
            response.data.stats || {
              total: 0,
              unread: 0,
              pending: 0,
              processed: 0,
              failed: 0,
            }
          );
          setPagination(
            response.data.pagination || {
              current: 1,
              pages: 1,
              total: 0,
              limit: 20,
            }
          );

          // Enhanced auto-evaluation for feedback/survey forms
          if (isFeedbackForm && processedSubmissions.length > 0) {
            console.log(
              '🎯 Auto-evaluating submissions for form type:',
              detectedFormType
            );

            // Auto-evaluate submissions that don't have evaluations yet
            const unevaluatedSubmissions = processedSubmissions.filter(
              (submission: Submission) =>
                !aiEvaluations[submission.id] &&
                !evaluatingSubmissions.has(submission.id)
            );

            if (unevaluatedSubmissions.length > 0) {
              // Evaluate in smaller batches based on form type
              const batchSize = detectedFormType === 'quiz' ? 3 : 5; // Smaller batches for quiz forms
              const submissionIds = unevaluatedSubmissions
                .slice(0, batchSize)
                .map((s: Submission) => s.id);

              console.log(
                `🚀 Auto-evaluating ${submissionIds.length} submissions`
              );
              evaluateMultipleSubmissions(submissionIds);
            }
          }

          console.log(
            '✅ Submissions fetched successfully:',
            processedSubmissions.length
          );
        }
      } catch (error: any) {
        console.error('❌ Error fetching submissions:', error);
        toast.error(error.message || 'Failed to fetch submissions');
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    },
    [
      formId,
      searchTerm,
      statusFilter,
      readFilter,
      isFeedbackForm,
      detectedFormType,
      aiEvaluations,
      evaluatingSubmissions,
    ]
  );

  // Download CSV export
  const handleDownloadCsv = async () => {
    if (!formId) {
      toast.error('Form ID is required for CSV export');
      return;
    }

    setDownloadingCsv(true);

    try {
      console.log('📥 Starting Cloudinary-only CSV download for form:', formId);

      // Build filters for export
      const exportFilters = {
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(readFilter !== 'all' && {
          isRead: readFilter === 'read' ? 'true' : 'false',
        }),
      };

      console.log('🔍 Export filters:', exportFilters);

      // Perform the CSV export
      const blob = await submissionsService.exportCSV(
        formId,
        undefined,
        undefined,
        true
      );

      if (!blob || blob.size === 0) {
        throw new Error('Empty CSV file received. No data to export.');
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Generate filename
      const formTitle = formStructure?.title || 'form';
      const formTitleSafe = formTitle
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_');
      const dateStamp = new Date().toISOString().split('T')[0];
      const filename = `${formTitleSafe}_export_${dateStamp}.csv`;

      a.download = filename;
      a.style.display = 'none';

      // Trigger download
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Cleanup
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);

      // Success feedback
      const fileSizeMB = (blob.size / (1024 * 1024)).toFixed(2);

      console.log('🎉 CSV download completed:', {
        filename,
        fileSize: `${fileSizeMB} MB`,
      });
    } catch (error: any) {
      console.error('❌ CSV download failed:', error);

      let errorMessage = 'Failed to download CSV export';
      if (error.message.includes('Empty')) {
        errorMessage = 'No data available for export';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(`❌ ${errorMessage}`, { duration: 7000 });
    } finally {
      setDownloadingCsv(false);
    }
  };

  // Mark submission as read/unread
  const handleToggleRead = async (submissionId: string, isRead: boolean) => {
    try {
      if (!submissionId || submissionId.trim() === '') {
        throw new Error('Invalid submission ID');
      }

      console.log('🔄 Toggling read status:', {
        submissionId,
        currentStatus: isRead,
        newStatus: !isRead,
      });

      await submissionsService.updateReadStatus(submissionId, !isRead);

      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === submissionId ? { ...sub, isRead: !isRead } : sub
        )
      );

      setStats(prev => ({
        ...prev,
        unread: !isRead ? prev.unread - 1 : prev.unread + 1,
      }));

      console.log('✅ Read status updated successfully');
    } catch (error: any) {
      console.error('❌ Error updating read status:', error);
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === submissionId ? { ...sub, isRead: isRead } : sub
        )
      );
      toast.error(error.message || 'Failed to update read status');
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    try {
      // Get submission details for better user feedback
      const submission = submissions.find(s => s.id === submissionId);
      if (!submission) return;

      const fileCount = submission.files?.length || 0;
      const items = [
        {
          id: submissionId,
          name: `Submission ${formatDateTime(submission.submittedAt)}`,
          files: fileCount,
        },
      ];

      // Perform deletion using the hook
      await deleteSubmissions(items, async id => {
        return await submissionsService.deleteSubmission(id);
      });

      // Update local state
      setSubmissions(prev => prev.filter(sub => sub.id !== submissionId));

      // Update stats
      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
        unread: submission?.isRead === false ? prev.unread - 1 : prev.unread,
      }));

      // Remove from AI evaluations if exists
      setAiEvaluations(prev => {
        const newEvaluations = { ...prev };
        delete newEvaluations[submissionId];
        return newEvaluations;
      });

      console.log('✅ Submission deletion completed successfully');
    } catch (error: any) {
      console.error('❌ Error deleting submission:', error);
      toast.error('Deletion Failed', {
        description:
          error.message || 'Failed to delete submission and associated files',
        duration: 10000,
      });
    } finally {
      setShowDeleteDialog(false);
      setSubmissionToDelete(null);
    }
  };

  const handleDeleteFile = async (
    file: any,
    submissionId: string,
    fieldId: string
  ) => {
    try {
      if (!file?.publicId) {
        throw new Error('Invalid file data - missing publicId');
      }

      console.log('🗑️ Deleting individual file:', file.originalName);

      try {
        // Call the enhanced backend route
        const response = await axios.delete(
          `${
            apiConfig.url
          }/submissions/${submissionId}/files/${fieldId}/${encodeURIComponent(
            file.publicId
          )}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        if (response.data.success) {
          // Update local state
          updateSubmissionFileState(submissionId, fieldId, file.publicId);
        } else {
          throw new Error('Deletion was not successful');
        }
      } catch (apiError: any) {
        throw new Error(
          apiError.response?.data?.message || 'Failed to delete file'
        );
      }
    } catch (error: any) {
      console.error('❌ Error deleting file:', error);
      toast.error(`Failed to delete ${file.originalName}`, {
        description: error.message,
        duration: 3000,
      });
    }
  };

  // Helper function to update local state after file deletion
  const updateSubmissionFileState = (
    submissionId: string,
    fieldId: string,
    deletedPublicId: string
  ) => {
    setSubmissions(prev =>
      prev.map(sub => {
        if (sub.id === submissionId) {
          // Remove from files array
          const updatedFiles = (sub.files || []).filter(
            (f: any) => f.publicId !== deletedPublicId
          );

          // Remove from data object
          const updatedData = { ...sub.data };
          const fieldFiles = updatedData[fieldId];

          if (Array.isArray(fieldFiles)) {
            updatedData[fieldId] = fieldFiles.filter(
              f => f.publicId !== deletedPublicId
            );
            if (updatedData[fieldId].length === 0) {
              delete updatedData[fieldId];
            }
          } else if (fieldFiles?.publicId === deletedPublicId) {
            delete updatedData[fieldId];
          }

          return { ...sub, files: updatedFiles, data: updatedData };
        }
        return sub;
      })
    );

    // Update selected submission if displayed
    if (selectedSubmission?.id === submissionId) {
      setSelectedSubmission(prev => {
        if (!prev) return prev;

        const updatedFiles = (prev.files || []).filter(
          (f: any) => f.publicId !== deletedPublicId
        );

        const updatedData = { ...prev.data };
        const fieldFiles = updatedData[fieldId];

        if (Array.isArray(fieldFiles)) {
          updatedData[fieldId] = fieldFiles.filter(
            f => f.publicId !== deletedPublicId
          );
          if (updatedData[fieldId].length === 0) {
            delete updatedData[fieldId];
          }
        } else if (fieldFiles?.publicId === deletedPublicId) {
          delete updatedData[fieldId];
        }

        return { ...prev, files: updatedFiles, data: updatedData };
      });
    }
  };

  // Enhanced file download with loading state
  const handleDownloadFile = async (file: any) => {
    try {
      setDownloadingFileId(file.publicId);

      console.log('📥 Starting file download:', {
        name: file.originalName,
        url: file.url,
        mimeType: file.mimeType,
      });

      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.originalName || 'download';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.display = 'none';

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      console.log('✅ File download completed');
    } catch (error: any) {
      console.error('❌ Download error:', error);
      toast.error(`Failed to download ${file.originalName}`);
      throw error;
    } finally {
      setDownloadingFileId(null);
    }
  };

  // Confirm delete functions
  const confirmDelete = (submissionId: string) => {
    setSubmissionToDelete(submissionId);
    setShowDeleteDialog(true);
  };

  // View submission details
  const handleViewSubmission = async (submission: Submission) => {
    try {
      console.log('👁️ Viewing submission:', {
        id: submission.id,
        isRead: submission.isRead,
        data: submission.data,
        files: submission.files,
      });

      setSelectedSubmission(submission);
      setShowSubmissionModal(true);

      if (!submission.isRead) {
        handleToggleRead(submission.id, submission.isRead).catch(error => {
          console.warn(
            '⚠️ Failed to mark submission as read when viewing:',
            error
          );
        });
      }
    } catch (error) {
      console.error('❌ Error viewing submission:', error);
      toast.error('Failed to view submission details');
    }
  };

  // Enhanced status badge with better styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return (
          <Badge
            variant='default'
            className='bg-green-100 text-green-800 border-green-200'
          >
            <CheckCircle className='w-3 h-3 mr-1' />
            Processed
          </Badge>
        );
      case 'pending':
        return (
          <Badge
            variant='secondary'
            className='bg-yellow-100 text-yellow-800 border-yellow-200'
          >
            <AlertCircle className='w-3 h-3 mr-1' />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge
            variant='destructive'
            className='bg-red-100 text-red-800 border-red-200'
          >
            <XCircle className='w-3 h-3 mr-1' />
            Failed
          </Badge>
        );
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  // Enhanced AI evaluation badge with better form type handling
  const getAIEvaluationBadge = (submissionId: string) => {
    if (evaluatingSubmissions.has(submissionId)) {
      return (
        <Badge
          variant='secondary'
          className='bg-blue-100 text-blue-800 border-blue-200'
        >
          <Loader2 className='w-3 h-3 mr-1 animate-spin' />
          Evaluating...
        </Badge>
      );
    }

    const evaluation = aiEvaluations[submissionId];
    if (!evaluation) {
      // Show different pending states based on form type
      const pendingText =
        detectedFormType === 'general' ? 'Not Applicable' : 'Pending';
      const bgColor =
        detectedFormType === 'general'
          ? 'bg-gray-100 text-gray-600'
          : 'bg-gray-100 text-gray-600';

      return (
        <Badge variant='outline' className={bgColor}>
          <Brain className='w-3 h-3 mr-1' />
          {pendingText}
        </Badge>
      );
    }

    if (evaluation.status === 'failed') {
      return (
        <Badge
          variant='destructive'
          className='bg-red-100 text-red-800 border-red-200'
        >
          <XCircle className='w-3 h-3 mr-1' />
          Failed
        </Badge>
      );
    }

    // Enhanced form type specific badges
    switch (evaluation.formType) {
      case 'quiz':
        if (evaluation.quizResults) {
          const percentage = evaluation.quizResults.percentage;
          const scoreColor =
            percentage >= 80
              ? 'green'
              : percentage >= 60
              ? 'blue'
              : percentage >= 40
              ? 'yellow'
              : 'red';

          return (
            <Badge
              variant='default'
              className={`bg-${scoreColor}-100 text-${scoreColor}-800 border-${scoreColor}-200`}
              title={`${evaluation.quizResults.correctAnswers}/${evaluation.quizResults.totalQuestions} correct answers`}
            >
              <Star className='w-3 h-3 mr-1' />
              {percentage}% Score
            </Badge>
          );
        }
        break;

      case 'survey':
        if (evaluation.surveyResults) {
          const positivePercent =
            evaluation.surveyResults.overallSentiment.positive;
          const surveyColor =
            positivePercent >= 70
              ? 'green'
              : positivePercent >= 50
              ? 'blue'
              : positivePercent >= 30
              ? 'yellow'
              : 'red';

          return (
            <Badge
              variant='default'
              className={`bg-${surveyColor}-100 text-${surveyColor}-800 border-${surveyColor}-200`}
              title={`Survey analysis: ${positivePercent}% positive, ${evaluation.surveyResults.overallSentiment.neutral}% neutral, ${evaluation.surveyResults.overallSentiment.negative}% negative`}
            >
              <Brain className='w-3 h-3 mr-1' />
              {positivePercent}% Positive
            </Badge>
          );
        }
        break;

      case 'feedback':
        if (evaluation.feedbackResults) {
          const positivePercent =
            evaluation.feedbackResults.sentimentBreakdown.positive;
          const urgencyLevel = evaluation.feedbackResults.urgencyLevel;

          const feedbackColor =
            urgencyLevel === 'high'
              ? 'red'
              : urgencyLevel === 'medium'
              ? 'yellow'
              : 'green';

          const urgencyIcon = urgencyLevel === 'high' ? AlertTriangle : Brain;

          return (
            <Badge
              variant='default'
              className={`bg-${feedbackColor}-100 text-${feedbackColor}-800 border-${feedbackColor}-200`}
              title={`Feedback analysis: ${positivePercent}% positive sentiment, ${urgencyLevel} priority level`}
            >
              {React.createElement(urgencyIcon, { className: 'w-3 h-3 mr-1' })}
              {positivePercent}% Positive
            </Badge>
          );
        }
        break;

      default:
        return (
          <Badge
            variant='default'
            className='bg-blue-100 text-blue-800 border-blue-200'
          >
            <Brain className='w-3 h-3 mr-1' />
            Analyzed
          </Badge>
        );
    }

    // Fallback badge
    return (
      <Badge
        variant='default'
        className='bg-blue-100 text-blue-800 border-blue-200'
      >
        <Brain className='w-3 h-3 mr-1' />
        Completed
      </Badge>
    );
  };

  // Add state for the evaluation modal:
  const [showAIEvaluationModal, setShowAIEvaluationModal] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] =
    useState<AIEvaluation | null>(null);

  // Enhanced function to handle evaluation modal
  const handleViewAIEvaluation = (submissionId: string) => {
    const evaluation = aiEvaluations[submissionId];

    if (evaluation && evaluation.status === 'completed') {
      setSelectedEvaluation(evaluation);
      setShowAIEvaluationModal(true);
    } else if (!evaluation && !evaluatingSubmissions.has(submissionId)) {
      // Only start evaluation if form type supports it
      if (isFeedbackForm) {
        const submission = submissions.find(s => s.id === submissionId);
        if (submission) {
          toast.info('Starting AI evaluation...', {
            description: 'This may take a few moments',
            duration: 3000,
          });
          evaluateSubmissionWithAI(submission);
        }
      } else {
        toast.info('AI evaluation not available for this form type', {
          duration: 3000,
        });
      }
    } else if (evaluatingSubmissions.has(submissionId)) {
      toast.info('Evaluation in progress...', {
        description: 'Please wait for the evaluation to complete',
        duration: 3000,
      });
    }
  };

  // Enhanced render field value with complete file management
  const renderFieldValue = (fieldId: string, value: any) => {
    const label = fieldLabelsMap[fieldId] || fieldId;

    console.log('🔍 Rendering field:', {
      fieldId,
      label,
      value,
      submissionId: selectedSubmission?.id,
      hasSubmissionFiles: !!(
        selectedSubmission?.files && selectedSubmission.files.length > 0
      ),
    });

    // Check if this is a signature field
    const isSignatureField = (value: any, label: string): boolean => {
      if (typeof value === 'string' && value.startsWith('data:image/')) {
        return true;
      }
      if (
        typeof value === 'string' &&
        value.includes('cloudinary.com') &&
        label.toLowerCase().includes('signature')
      ) {
        return true;
      }
      return label.toLowerCase().includes('signature');
    };

    // Handle signature fields specially
    if (isSignatureField(value, label)) {
      console.log('✍️ Rendering signature field:', label);

      const isBase64 =
        typeof value === 'string' && value.startsWith('data:image/');
      const isCloudinaryUrl =
        typeof value === 'string' && value.includes('cloudinary.com');

      const handleDownloadSignature = () => {
        try {
          const link = document.createElement('a');

          if (isBase64) {
            // Handle base64 signatures
            link.href = value;
            link.download = `signature-${
              selectedSubmission?.id || 'unknown'
            }-${Date.now()}.png`;
          } else if (isCloudinaryUrl) {
            // Handle Cloudinary signatures
            link.href = value;
            link.download = `signature-${
              selectedSubmission?.id || 'unknown'
            }-${Date.now()}.png`;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
          } else {
            throw new Error('Invalid signature format');
          }

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          console.log('✅ Signature download initiated');
        } catch (error) {
          console.error('❌ Error downloading signature:', error);
          toast.error('Failed to download signature');
        }
      };

      return (
        <div className='space-y-4'>
          <div className='flex items-center justify-between border-b border-gray-200 pb-2'>
            <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
              <svg
                className='w-4 h-4 text-purple-500'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z'
                  clipRule='evenodd'
                />
              </svg>
              {label}
              <Badge
                variant='secondary'
                className='ml-2 text-xs bg-purple-100 text-purple-700'
              >
                Digital Signature
              </Badge>
            </label>
            <div className='text-xs text-gray-500'>
              {isBase64 ? 'Base64 PNG' : 'Cloudinary Image'}
            </div>
          </div>

          {/* Signature Preview */}
          <div className='bg-white border border-gray-300 rounded-lg p-4'>
            <div className='flex flex-col items-center space-y-4'>
              {/* Signature Image */}
              <div className='w-full max-w-md bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4'>
                <img
                  src={value}
                  alt={`Digital signature for ${label}`}
                  className='w-full h-auto max-h-32 object-contain'
                  style={{
                    filter: 'contrast(1.1) brightness(0.95)',
                    imageRendering: 'crisp-edges',
                  }}
                  onError={e => {
                    console.error('❌ Failed to load signature image');
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              {/* Signature Info */}
              <div className='text-center space-y-2'>
                <p className='text-sm text-gray-600'>
                  Digital signature captured on{' '}
                  {formatDateTime(selectedSubmission?.submittedAt || '')}
                </p>

                {/* Action Buttons */}
                <div className='flex gap-2 justify-center'>
                  {/* Download Button */}
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={handleDownloadSignature}
                    className='flex items-center gap-2 hover:bg-purple-50 hover:border-purple-300'
                  >
                    <Download className='w-4 h-4' />
                    Download Signature
                  </Button>

                  {/* View Full Size Button */}
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => {
                      // Open signature in new window for full view
                      const newWindow = window.open('', '_blank');
                      if (newWindow) {
                        newWindow.document.write(`
                        <html>
                          <head>
                            <title>Digital Signature - ${label}</title>
                            <style>
                              body {
                                margin: 0;
                                padding: 20px;
                                background: #f5f5f5;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                min-height: 100vh;
                                font-family: Arial, sans-serif;
                              }
                              .container {
                                background: white;
                                padding: 20px;
                                border-radius: 8px;
                                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                                text-align: center;
                              }
                              img {
                                max-width: 100%;
                                height: auto;
                                border: 2px solid #e5e5e5;
                                border-radius: 4px;
                                background: white;
                              }
                              h2 {
                                color: #333;
                                margin-bottom: 20px;
                              }
                              .info {
                                margin-top: 20px;
                                color: #666;
                                font-size: 14px;
                              }
                            </style>
                          </head>
                          <body>
                            <div class="container">
                              <h2>${label}</h2>
                              <img src="${value}" alt="Digital Signature" />
                              <div class="info">
                                <p>Submitted: ${formatDateTime(
                                  selectedSubmission?.submittedAt || ''
                                )}</p>
                                <p>Submission ID: ${
                                  selectedSubmission?.id || 'Unknown'
                                }</p>
                              </div>
                            </div>
                          </body>
                        </html>
                      `);
                        newWindow.document.close();
                      }
                    }}
                    className='flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300'
                  >
                    <Eye className='w-4 h-4' />
                    View Full Size
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Check if this field has files
    const hasFiles = selectedSubmission
      ? fieldHasFiles(selectedSubmission, fieldId)
      : false;

    if (hasFiles) {
      console.log('📁 Rendering file field:', label);

      // Get all files for this field
      const fieldFiles = selectedSubmission
        ? getAllFilesForField(selectedSubmission, fieldId)
        : [];

      console.log('📁 Field files:', {
        fieldId,
        label,
        fileCount: fieldFiles.length,
        files: fieldFiles,
      });

      // Normalize file data to ensure compatibility with FileManager
      const normalizedFiles = fieldFiles.map((file: any) => ({
        originalName:
          file.originalName || file.fileName || file.name || 'Unknown File',
        fileName: file.fileName || file.originalName || file.name || 'unknown',
        url: file.url || '',
        publicId: file.publicId || file.id || `temp_${Date.now()}`,
        size: file.size || 0,
        mimeType: file.mimeType || file.type || 'application/octet-stream',
        uploadedAt:
          file.uploadedAt || file.createdAt || new Date().toISOString(),
        dimensions: file.dimensions || undefined,
        ...file, // Keep all other properties
      }));

      return (
        <div className='space-y-4'>
          <div className='flex items-center justify-between border-b border-gray-200 pb-2'>
            <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
              {normalizedFiles.length > 0 &&
                getFileTypeInfo(normalizedFiles[0]?.mimeType || '').icon &&
                React.createElement(
                  getFileTypeInfo(normalizedFiles[0]?.mimeType || '').icon,
                  {
                    className: `w-4 h-4 text-${
                      getFileTypeInfo(normalizedFiles[0]?.mimeType || '').color
                    }-500`,
                  }
                )}
              {label}
              {normalizedFiles.length > 1 && (
                <Badge variant='secondary' className='ml-2'>
                  {normalizedFiles.length} files
                </Badge>
              )}
            </label>
            <div className='text-xs text-gray-500'>
              {formatFileSize(
                normalizedFiles.reduce(
                  (sum: number, file: any) => sum + (file.size || 0),
                  0
                )
              )}
            </div>
          </div>

          <FileManager
            files={
              normalizedFiles.length === 1
                ? normalizedFiles[0]
                : normalizedFiles
            }
            fieldId={fieldId}
            submissionId={selectedSubmission!.id}
            onFileDelete={async file => {
              console.log('🗑️ Delete requested for:', file.originalName);
              await handleDeleteFile(file, selectedSubmission!.id, fieldId);
            }}
            onFileDownload={async file => {
              console.log('📥 Download requested for:', file.originalName);
              await handleDownloadFile(file);
            }}
            onFileView={file => {
              console.log('👁️ Preview requested for:', file.originalName);
              // FileManager handles preview internally
            }}
            showActions={true}
            compact={true}
            readOnly={false}
            downloadingFileId={downloadingFileId}
            maxPreviewSize={10}
          />
        </div>
      );
    }

    // Regular field with enhanced styling
    const displayValue = formatDisplayValue(value);

    return (
      <div className='space-y-2 pb-4 border-b border-gray-100 last:border-b-0'>
        <label className='text-sm font-semibold text-gray-700 block'>
          {label}
        </label>
        <div className='bg-gray-50 p-3 rounded-lg border'>
          <p className='text-gray-900 leading-relaxed whitespace-pre-wrap'>
            {displayValue}
          </p>
        </div>
      </div>
    );
  };

  // Initialize data on component mount
  useEffect(() => {
    if (formId) {
      console.log('🚀 Component mounted, fetching data for formId:', formId);

      const initializeData = async () => {
        await fetchFormStructure();
        await fetchSubmissions();
      };

      initializeData();
    } else {
      console.warn('⚠️ No formId available');
      setLoading(false);
    }
  }, [formId, fetchFormStructure, fetchSubmissions]);

  useEffect(() => {
    if (formId && formStructure) {
      fetchSubmissions();
    }
  }, [
    formId,
    searchTerm,
    statusFilter,
    readFilter,
    fetchSubmissions,
    formStructure,
  ]);

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading submissions...</p>
        </div>
      </div>
    );
  }

  const hasSubmissions = submissions.length > 0;

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Enhanced Header with Form Type Badge */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
        <div>
          <div className='flex items-center gap-3 mb-2'>
            <h1 className='text-3xl font-bold text-gray-900'>
              Form Submissions
            </h1>
            {detectedFormType !== 'general' && (
              <Badge
                variant='outline'
                className={`
                  ${
                    detectedFormType === 'quiz'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : ''
                  }
                  ${
                    detectedFormType === 'survey'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : ''
                  }
                  ${
                    detectedFormType === 'feedback'
                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                      : ''
                  }
                  font-medium
                `}
              >
                {detectedFormType.charAt(0).toUpperCase() +
                  detectedFormType.slice(1)}{' '}
                Form
                {isFeedbackForm && <Brain className='w-3 h-3 ml-1' />}
              </Badge>
            )}
          </div>
          <p className='text-gray-600'>
            Manage and view all form submissions
            {isFeedbackForm && ' with AI-powered analysis'}
          </p>
        </div>
        <Button
          onClick={handleDownloadCsv}
          disabled={downloadingCsv || !hasSubmissions}
          className={`
          bg-[#102035] hover:bg-slate-700 font-semibold text-white
          flex items-center gap-2 disabled:opacity-50
          ${
            downloadingCsv
              ? 'cursor-wait'
              : hasSubmissions
              ? 'cursor-pointer'
              : 'cursor-not-allowed'
          }
          transition-all duration-200 ease-in-out
          hover:shadow-lg active:scale-95
          min-w-[200px] justify-center
        `}
          title={
            !hasSubmissions
              ? 'No submissions to export'
              : downloadingCsv
              ? 'Preparing CSV export...'
              : `Export ${stats.total} submission${
                  stats.total === 1 ? '' : 's'
                } to CSV`
          }
        >
          {downloadingCsv ? (
            <>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white' />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download className='w-4 h-4' />
              <span>Download CSV ({stats.total})</span>
            </>
          )}
        </Button>
      </div>

      {/* Enhanced Stats Cards with AI Evaluation Info */}
      <div className='grid grid-cols-2 md:grid-cols-5 gap-4 mb-6'>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-[#102035]'>
              {stats.total}
            </div>
            <p className='text-sm text-gray-600'>Total Submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-orange-600'>
              {stats.unread}
            </div>
            <p className='text-sm text-gray-600'>Unread</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-yellow-600'>
              {stats.pending}
            </div>
            <p className='text-sm text-gray-600'>Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-green-600'>
              {stats.processed}
            </div>
            <p className='text-sm text-gray-600'>Processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-red-600'>
              {stats.failed}
            </div>
            <p className='text-sm text-gray-600'>Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className='mb-6 focus-visible:ring-1 border-gray-200 shadow-sm'>
        <CardContent className='p-4'>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <Input
                  placeholder='Search submissions...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-[150px] rounded-lg border-gray-300'>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent className='bg-white border-gray-200'>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='processed'>Processed</SelectItem>
                <SelectItem value='pending'>Pending</SelectItem>
                <SelectItem value='failed'>Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={readFilter} onValueChange={setReadFilter}>
              <SelectTrigger className='w-[150px] rounded-lg border-gray-300'>
                <SelectValue placeholder='Read Status' />
              </SelectTrigger>
              <SelectContent className='bg-white border-gray-200'>
                <SelectItem value='all'>All</SelectItem>
                <SelectItem value='read'>Read</SelectItem>
                <SelectItem value='unread'>Unread</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Submissions Table */}
      <Card className='bg-white border-gray-200 shadow-sm'>
        <CardHeader className='border-b border-gray-200'>
          <CardTitle className='flex items-center gap-2'>
            <Calendar className='w-5 h-5 text-gray-600' />
            Submissions ({stats.total})
            {isFeedbackForm && (
              <Badge
                variant='outline'
                className='ml-2 bg-purple-50 text-purple-700 border-purple-200'
              >
                <Brain className='w-3 h-3 mr-1' />
                AI Enabled
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          {submissions.length === 0 ? (
            <div className='text-center py-12'>
              <div className='text-gray-400 mb-4'>
                <Calendar className='w-16 h-16 mx-auto' />
              </div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No submissions yet
              </h3>
              <p className='text-gray-600'>
                Submissions will appear here once users start submitting your
                form.
              </p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table className='w-full table-fixed'>
                <TableHeader>
                  <TableRow className='border-b-2 border-gray-200 bg-gray-50'>
                    <TableHead className='w-[18%] border-r border-gray-200 px-4 py-3'>
                      <div className='flex items-center gap-2 font-semibold text-gray-700'>
                        <Clock className='w-4 h-4' />
                        Submission Date
                      </div>
                    </TableHead>

                    {uniqueFields.map(field => (
                      <TableHead
                        key={field.fieldId}
                        className='w-[20%] border-r border-gray-200 px-4 py-3'
                      >
                        <div className='flex items-center gap-2 font-semibold text-gray-700'>
                          {field.icon}
                          <span className='truncate'>{field.label}</span>
                        </div>
                      </TableHead>
                    ))}

                    {uniqueFields.length < 2 && hasEmailField && (
                      <TableHead className='w-[20%] border-r border-gray-200 px-4 py-3'>
                        <div className='flex items-center gap-2 font-semibold text-gray-700'>
                          <Mail className='w-4 h-4' />
                          Email
                        </div>
                      </TableHead>
                    )}

                    {uniqueFields.length < 1 && hasFullNameField && (
                      <TableHead className='w-[20%] border-r border-gray-200 px-4 py-3'>
                        <div className='flex items-center gap-2 font-semibold text-gray-700'>
                          <User className='w-4 h-4' />
                          Full Name
                        </div>
                      </TableHead>
                    )}

                    {isFeedbackForm && (
                      <TableHead className='w-[16%] border-r border-gray-200 px-4 py-3'>
                        <div className='flex items-center gap-2 font-semibold text-gray-700'>
                          <Brain className='w-4 h-4' />
                          AI Analysis
                        </div>
                      </TableHead>
                    )}

                    <TableHead className='w-[12%] border-r border-gray-200 px-4 py-3'>
                      <div className='flex items-center gap-2 font-semibold text-gray-700'>
                        <AlertCircle className='w-4 h-4' />
                        Status
                      </div>
                    </TableHead>

                    <TableHead className='w-[8%] border-r border-gray-200 px-4 py-3'>
                      <div className='flex items-center justify-center gap-2 font-semibold text-gray-700'>
                        Read
                      </div>
                    </TableHead>

                    <TableHead className='w-[8%] px-4 py-3'>
                      <div className='font-semibold text-center text-gray-700'>
                        Actions
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission, submissionIndex) => (
                    <TableRow
                      key={`submission-${submission.id}-${submissionIndex}`}
                      className={`${
                        !submission.isRead
                          ? 'bg-blue-50 border-l-4 border-l-blue-500'
                          : 'bg-white'
                      } hover:bg-gray-50 cursor-pointer border-b border-gray-200 transition-colors duration-150`}
                      onClick={() => handleViewSubmission(submission)}
                    >
                      <TableCell className='border-r border-gray-200 px-4 py-4'>
                        <div>
                          <div className='font-medium text-sm text-gray-900'>
                            {formatDateTime(submission.submittedAt)}
                          </div>
                          <div className='text-xs text-gray-500 mt-1'>
                            {formatTimeAgo(submission.submittedAt)}
                          </div>
                        </div>
                      </TableCell>

                      {uniqueFields.map(field => (
                        <TableCell
                          key={field.fieldId}
                          className='border-r border-gray-200 px-4 py-4'
                        >
                          <div
                            className='truncate font-medium text-gray-900'
                            title={getFieldValueFromSubmission(
                              submission,
                              field.fieldId
                            )}
                          >
                            {getFieldValueFromSubmission(
                              submission,
                              field.fieldId
                            )}
                          </div>
                        </TableCell>
                      ))}

                      {uniqueFields.length < 2 && hasEmailField && (
                        <TableCell className='border-r border-gray-200 px-4 py-4'>
                          <div
                            className='truncate font-medium text-gray-900'
                            title={getEmailFromSubmission(submission)}
                          >
                            {getEmailFromSubmission(submission)}
                          </div>
                        </TableCell>
                      )}

                      {uniqueFields.length < 1 && hasFullNameField && (
                        <TableCell className='border-r border-gray-200 px-4 py-4'>
                          <div
                            className='truncate font-medium text-gray-900'
                            title={getFullNameFromSubmission(submission)}
                          >
                            {getFullNameFromSubmission(submission)}
                          </div>
                        </TableCell>
                      )}

                      {isFeedbackForm && (
                        <TableCell className='border-r border-gray-200 px-4 py-4'>
                          <div
                            onClick={e => {
                              e.stopPropagation();
                              handleViewAIEvaluation(submission.id);
                            }}
                            className='cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors'
                            title='Click to view detailed AI evaluation'
                          >
                            {getAIEvaluationBadge(submission.id)}
                          </div>
                        </TableCell>
                      )}

                      <TableCell className='border-r border-gray-200 px-4 py-4'>
                        {getStatusBadge(submission.status)}
                      </TableCell>

                      <TableCell className='border-r border-gray-200 px-4 py-4 text-center'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={e => {
                            e.stopPropagation();
                            handleToggleRead(submission.id, submission.isRead);
                          }}
                          className='p-1 hover:bg-gray-200 rounded-full cursor-pointer transition-colors'
                          title={
                            submission.isRead
                              ? 'Mark as unread'
                              : 'Mark as read'
                          }
                        >
                          {submission.isRead ? (
                            <Eye className='w-4 h-4 text-green-600' />
                          ) : (
                            <EyeOff className='w-4 h-4 text-gray-400' />
                          )}
                        </Button>
                      </TableCell>

                      <TableCell className='px-4 py-4'>
                        <div className='flex items-center justify-center gap-1'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={e => {
                              e.stopPropagation();
                              confirmDelete(submission.id);
                            }}
                            className='p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full cursor-pointer transition-colors'
                            title='Delete submission'
                          >
                            <Trash2 className='w-4 h-4' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Enhanced Pagination */}
          {pagination.pages > 1 && (
            <div className='flex items-center justify-between mt-6 pt-4 border-t border-gray-200 px-6 pb-4'>
              <div className='text-sm text-gray-600'>
                Showing {(pagination.current - 1) * pagination.limit + 1} to{' '}
                {Math.min(
                  pagination.current * pagination.limit,
                  pagination.total
                )}{' '}
                of {pagination.total} submissions
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    fetchSubmissions(pagination.current - 1, pagination.limit)
                  }
                  disabled={pagination.current === 1}
                  className='border-gray-300 hover:bg-gray-50'
                >
                  Previous
                </Button>
                <span className='flex items-center px-3 py-1 text-sm text-gray-700'>
                  Page {pagination.current} of {pagination.pages}
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    fetchSubmissions(pagination.current + 1, pagination.limit)
                  }
                  disabled={pagination.current === pagination.pages}
                  className='border-gray-300 hover:bg-gray-50'
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Submission Details Modal */}
      <Dialog open={showSubmissionModal} onOpenChange={setShowSubmissionModal}>
        <DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto bg-white [&>button]:top-7 [&>button]:right-4 [&>button]:cursor-pointer'>
          <DialogHeader className='border-b border-gray-200 pb-4'>
            <DialogTitle className='flex items-center justify-start'>
              <span className='text-xl font-bold text-gray-900 mr-2'>
                Submission Details
              </span>
              {selectedSubmission && isFeedbackForm && (
                <Badge
                  variant='outline'
                  className={`
                    ${
                      detectedFormType === 'quiz'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : ''
                    }
                    ${
                      detectedFormType === 'survey'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : ''
                    }
                    ${
                      detectedFormType === 'feedback'
                        ? 'bg-orange-50 text-orange-700 border-orange-200'
                        : ''
                    }
                  `}
                >
                  {detectedFormType.charAt(0).toUpperCase() +
                    detectedFormType.slice(1)}{' '}
                  Analysis
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedSubmission && (
            <div className='space-y-6 pt-4'>
              {/* Enhanced Submission Meta Info */}
              <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200'>
                <h4 className='font-semibold text-blue-900 mb-4 flex items-center gap-2'>
                  <Calendar className='w-5 h-5' />
                  Submission Information
                </h4>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                  <div>
                    <span className='text-blue-700 font-medium'>
                      Submitted:
                    </span>
                    <p className='mt-1 text-gray-900 font-medium'>
                      {formatDateTime(selectedSubmission.submittedAt)}
                    </p>
                  </div>
                  <div>
                    <span className='text-blue-700 font-medium'>Status:</span>
                    <div className='mt-1'>
                      {getStatusBadge(selectedSubmission.status)}
                    </div>
                  </div>
                  <div>
                    <span className='text-blue-700 font-medium'>
                      Read Status:
                    </span>
                    <div className='mt-1'>
                      <Badge
                        variant={
                          selectedSubmission.isRead ? 'default' : 'secondary'
                        }
                      >
                        {selectedSubmission.isRead ? 'Read' : 'Unread'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className='text-blue-700 font-medium'>
                      Form Type:
                    </span>
                    <div className='mt-1'>
                      <Badge variant='outline' className='bg-white'>
                        {detectedFormType.charAt(0).toUpperCase() +
                          detectedFormType.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Unique Fields Summary */}
              {uniqueFields.length > 0 && (
                <div className='bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200'>
                  <h4 className='font-semibold text-purple-900 mb-4 flex items-center gap-2'>
                    <IdCard className='w-5 h-5' />
                    Key Identifiers
                  </h4>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                    {uniqueFields.map(field => (
                      <div key={field.fieldId}>
                        <span className='text-purple-700 font-medium flex items-center gap-2'>
                          {field.icon}
                          {field.label}:
                        </span>
                        <div className='mt-2 font-semibold text-gray-900 bg-white px-4 py-3 rounded-lg border shadow-sm'>
                          {getFieldValueFromSubmission(
                            selectedSubmission,
                            field.fieldId
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Enhanced AI Evaluation Details */}
              {isFeedbackForm && aiEvaluations[selectedSubmission.id] && (
                <div className='bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200'>
                  <h4 className='font-semibold text-green-900 mb-4 flex items-center gap-2'>
                    <Brain className='w-5 h-5' />
                    AI Evaluation Results
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        handleViewAIEvaluation(selectedSubmission.id)
                      }
                      className='ml-auto text-green-700 border-green-300 hover:bg-green-100'
                    >
                      View Full Analysis
                    </Button>
                  </h4>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                    <div>
                      <span className='text-green-700 font-medium'>
                        Form Type:
                      </span>
                      <div className='mt-1'>
                        <Badge className='bg-green-100 text-green-800 font-bold capitalize'>
                          {aiEvaluations[selectedSubmission.id].formType}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className='text-green-700 font-medium'>
                        Sentiment:
                      </span>
                      <div className='mt-1'>
                        <Badge
                          className={`font-bold capitalize ${
                            aiEvaluations[selectedSubmission.id].sentiment ===
                            'positive'
                              ? 'bg-green-100 text-green-800'
                              : aiEvaluations[selectedSubmission.id]
                                  .sentiment === 'negative'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {aiEvaluations[selectedSubmission.id].sentiment}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className='text-green-700 font-medium'>Score:</span>
                      <div className='mt-1'>
                        {(() => {
                          const evaluation =
                            aiEvaluations[selectedSubmission.id];
                          if (evaluation.quizResults) {
                            return (
                              <Badge className='bg-blue-100 text-blue-800 font-bold'>
                                {evaluation.quizResults.percentage}% (
                                {evaluation.quizResults.correctAnswers}/
                                {evaluation.quizResults.totalQuestions})
                              </Badge>
                            );
                          } else if (evaluation.surveyResults) {
                            return (
                              <Badge className='bg-green-100 text-green-800 font-bold'>
                                {
                                  evaluation.surveyResults.overallSentiment
                                    .positive
                                }
                                % Positive
                              </Badge>
                            );
                          } else if (evaluation.feedbackResults) {
                            return (
                              <Badge
                                className={`font-bold ${
                                  evaluation.feedbackResults.urgencyLevel ===
                                  'high'
                                    ? 'bg-red-100 text-red-800'
                                    : evaluation.feedbackResults
                                        .urgencyLevel === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {
                                  evaluation.feedbackResults.sentimentBreakdown
                                    .positive
                                }
                                % Positive
                              </Badge>
                            );
                          }
                          return (
                            <Badge className='bg-gray-100 text-gray-800'>
                              Analyzed
                            </Badge>
                          );
                        })()}
                      </div>
                    </div>
                    <div className='col-span-1 md:col-span-3'>
                      <span className='text-green-700 font-medium'>
                        Summary:
                      </span>
                      <div className='mt-2 bg-white p-4 rounded-lg border'>
                        <p className='text-gray-900 leading-relaxed'>
                          {aiEvaluations[selectedSubmission.id].feedback}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Submission Data */}
              <div className='bg-white'>
                <h3 className='text-lg font-bold text-gray-900 mb-6 flex items-center gap-2'>
                  <FileText className='w-5 h-5' />
                  Submitted Data
                </h3>

                <div className='space-y-4 bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-lg border border-gray-200'>
                  {Object.entries(selectedSubmission.data).length === 0 ? (
                    <div className='text-center py-8'>
                      <div className='text-gray-400 mb-4'>
                        <FileText className='w-16 h-16 mx-auto' />
                      </div>
                      <p className='text-gray-500 italic text-lg'>
                        No data submitted
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Render regular form fields */}
                      {Object.entries(selectedSubmission.data).map(
                        ([fieldId, value], index) => (
                          <div key={`field-${fieldId}-${index}`}>
                            {renderFieldValue(fieldId, value)}
                          </div>
                        )
                      )}

                      {/* Enhanced file fields rendering */}
                      {selectedSubmission.files &&
                        Array.isArray(selectedSubmission.files) &&
                        selectedSubmission.files.length > 0 && (
                          <>
                            <div className='border-t border-gray-300 pt-6 mt-6'>
                              <h4 className='text-md font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                                <FileText className='w-5 h-5' />
                                Uploaded Files (
                                {selectedSubmission.files.length})
                              </h4>
                            </div>

                            {/* Group files by fieldId and render each as a separate field */}
                            {(() => {
                              const filesByField =
                                selectedSubmission.files.reduce(
                                  (acc: any, file: any) => {
                                    if (!acc[file.fieldId]) {
                                      acc[file.fieldId] = [];
                                    }
                                    acc[file.fieldId].push(file);
                                    return acc;
                                  },
                                  {}
                                );

                              return Object.entries(filesByField).map(
                                ([fieldId, files]: [string, any]) => {
                                  const label =
                                    fieldLabelsMap[fieldId] ||
                                    `File Field (${fieldId})`;
                                  const fileArray = files as any[];

                                  // Normalize file data for FileManager
                                  const normalizedFiles = fileArray.map(
                                    (file: any) => ({
                                      originalName:
                                        file.originalName ||
                                        file.fileName ||
                                        'Unknown File',
                                      fileName:
                                        file.fileName ||
                                        file.originalName ||
                                        'unknown',
                                      url: file.url || '',
                                      publicId:
                                        file.publicId || `temp_${Date.now()}`,
                                      size: file.size || 0,
                                      mimeType:
                                        file.mimeType ||
                                        'application/octet-stream',
                                      uploadedAt:
                                        file.uploadedAt ||
                                        new Date().toISOString(),
                                      ...file,
                                    })
                                  );

                                  return (
                                    <div
                                      key={`file-field-${fieldId}`}
                                      className='space-y-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm'
                                    >
                                      <div className='flex items-center justify-between border-b border-gray-200 pb-3'>
                                        <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
                                          {normalizedFiles.length > 0 &&
                                            getFileTypeInfo(
                                              normalizedFiles[0]?.mimeType || ''
                                            ).icon &&
                                            React.createElement(
                                              getFileTypeInfo(
                                                normalizedFiles[0]?.mimeType ||
                                                  ''
                                              ).icon,
                                              {
                                                className: `w-4 h-4 text-${
                                                  getFileTypeInfo(
                                                    normalizedFiles[0]
                                                      ?.mimeType || ''
                                                  ).color
                                                }-500`,
                                              }
                                            )}
                                          {label}
                                          <Badge
                                            variant='secondary'
                                            className='ml-2 text-xs bg-blue-100 text-blue-700'
                                          >
                                            {normalizedFiles.length} file
                                            {normalizedFiles.length > 1
                                              ? 's'
                                              : ''}
                                          </Badge>
                                        </label>
                                        <div className='text-xs text-gray-500'>
                                          {formatFileSize(
                                            normalizedFiles.reduce(
                                              (sum: number, file: any) =>
                                                sum + (file.size || 0),
                                              0
                                            )
                                          )}
                                        </div>
                                      </div>

                                      {/* Enhanced File List */}
                                      <div className='space-y-3'>
                                        {normalizedFiles.map((file, index) => (
                                          <div
                                            key={`file-${fieldId}-${index}`}
                                            className='flex items-center gap-4 bg-gray-50 p-4 rounded-lg border'
                                          >
                                            {/* File Icon */}
                                            <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                                              {getFileTypeInfo(file.mimeType)
                                                .icon &&
                                                React.createElement(
                                                  getFileTypeInfo(file.mimeType)
                                                    .icon,
                                                  {
                                                    className: `w-5 h-5 text-${
                                                      getFileTypeInfo(
                                                        file.mimeType
                                                      ).color
                                                    }-600`,
                                                  }
                                                )}
                                            </div>

                                            {/* File Info */}
                                            <div className='flex-1 min-w-0'>
                                              <p
                                                className='text-sm font-medium text-gray-900 truncate'
                                                title={file.originalName}
                                              >
                                                {file.originalName}
                                              </p>
                                              <div className='flex items-center gap-4 mt-1'>
                                                <p className='text-xs text-gray-500'>
                                                  {formatFileSize(file.size)}
                                                </p>
                                                <p className='text-xs text-gray-500'>
                                                  {file.mimeType}
                                                </p>
                                                <p className='text-xs text-gray-500'>
                                                  {formatDateTime(
                                                    file.uploadedAt
                                                  )}
                                                </p>
                                              </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className='flex gap-2 flex-shrink-0'>
                                              {/* Download Button */}
                                              <Button
                                                size='sm'
                                                variant='outline'
                                                onClick={() =>
                                                  handleDownloadFile(file)
                                                }
                                                disabled={
                                                  downloadingFileId ===
                                                  file.publicId
                                                }
                                                className='px-3 py-2 hover:bg-green-50 hover:border-green-300'
                                                title={`Download ${file.originalName}`}
                                              >
                                                {downloadingFileId ===
                                                file.publicId ? (
                                                  <Loader2 className='w-4 h-4 animate-spin' />
                                                ) : (
                                                  <Download className='w-4 h-4' />
                                                )}
                                                <span className='ml-1 hidden sm:inline'>
                                                  Download
                                                </span>
                                              </Button>

                                              {/* Delete Button */}
                                              <Button
                                                size='sm'
                                                variant='outline'
                                                onClick={() =>
                                                  handleDeleteFile(
                                                    file,
                                                    selectedSubmission.id,
                                                    fieldId
                                                  )
                                                }
                                                className='px-3 py-2 text-red-600 hover:bg-red-50 hover:border-red-300'
                                                title={`Delete ${file.originalName}`}
                                              >
                                                <Trash2 className='w-4 h-4' />
                                                <span className='ml-1 hidden sm:inline'>
                                                  Delete
                                                </span>
                                              </Button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                }
                              );
                            })()}
                          </>
                        )}
                    </>
                  )}
                </div>
              </div>

              {/* Enhanced Action Buttons in Modal */}
              <div className='flex justify-center items-center border-t border-gray-200 pt-6'>
                <div className='flex gap-3'>
                  {/* AI Evaluation Button */}
                  {isFeedbackForm &&
                    !evaluatingSubmissions.has(selectedSubmission.id) &&
                    !aiEvaluations[selectedSubmission.id] && (
                      <Button
                        variant='outline'
                        onClick={() =>
                          evaluateSubmissionWithAI(selectedSubmission)
                        }
                        className='bg-purple-500 hover:bg-purple-600 text-white border-purple-500'
                      >
                        <Brain className='w-4 h-4 mr-2' />
                        Start AI Evaluation
                      </Button>
                    )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enhanced Delete Submission Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className='bg-white text-gray-900'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-red-600 font-bold flex items-center gap-2'>
              <AlertTriangle className='w-5 h-5' />
              Permanent Deletion Warning
            </AlertDialogTitle>
          </AlertDialogHeader>

          <div className='text-gray-700 px-6'>
            <span className='block mb-4'>
              This will permanently delete the submission and all associated
              files from cloud storage.
            </span>

            {submissionToDelete &&
              (() => {
                const submission = submissions.find(
                  s => s.id === submissionToDelete
                );
                const fileCount = submission?.files?.length || 0;

                return (
                  <div className='mt-4 space-y-3'>
                    {/* Submission Details */}
                    <div className='p-3 bg-gray-50 rounded-md border border-gray-200'>
                      <div className='text-sm'>
                        <p className='font-medium text-gray-900'>
                          Submission:{' '}
                          {formatDateTime(submission?.submittedAt || '')}
                        </p>
                        {submission && hasFullNameField && (
                          <p className='text-gray-600 mt-1'>
                            Submitter: {getFullNameFromSubmission(submission)}
                          </p>
                        )}
                        {submission && hasEmailField && (
                          <p className='text-gray-600 mt-1'>
                            Email: {getEmailFromSubmission(submission)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Files Warning */}
                    {fileCount > 0 && (
                      <div className='p-3 bg-yellow-50 rounded-md border border-yellow-200'>
                        <div className='flex items-center gap-2 text-yellow-800 mb-2'>
                          <AlertTriangle className='w-4 h-4' />
                          <span className='font-medium'>
                            Files to be deleted:
                          </span>
                        </div>
                        <div className='text-sm text-yellow-700'>
                          {submission?.files
                            ?.slice(0, 3)
                            .map((file: any, index: number) => (
                              <div key={index}>• {file.originalName}</div>
                            ))}
                          {fileCount > 3 && (
                            <div>• and {fileCount - 3} more files...</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* AI Evaluation Warning */}
                    {aiEvaluations[submissionToDelete] && (
                      <div className='p-3 bg-purple-50 rounded-md border border-purple-200'>
                        <div className='flex items-center gap-2 text-purple-800 mb-1'>
                          <Brain className='w-4 h-4' />
                          <span className='font-medium'>
                            AI evaluation will also be deleted
                          </span>
                        </div>
                        <p className='text-sm text-purple-700'>
                          Form type:{' '}
                          {aiEvaluations[submissionToDelete].formType}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

            <span className='block mt-4 font-medium text-red-600'>
              This action cannot be undone.
            </span>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false);
                setSubmissionToDelete(null);
              }}
              disabled={isDeletingSubmissions}
              className='border-gray-300 hover:bg-gray-50'
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (submissionToDelete) {
                  handleDeleteSubmission(submissionToDelete);
                }
              }}
              disabled={isDeletingSubmissions}
              className='bg-red-600 hover:bg-red-700 text-white'
            >
              {isDeletingSubmissions ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className='w-4 h-4 mr-2' />
                  Delete Permanently
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Enhanced AI Evaluation Details Modal */}
      <Dialog
        open={showAIEvaluationModal}
        onOpenChange={setShowAIEvaluationModal}
      >
        <DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto bg-white'>
          <DialogHeader className='border-b border-gray-200 pb-4'>
            <DialogTitle className='flex items-center gap-2 text-xl font-bold text-gray-900'>
              <Brain className='w-6 h-6 text-purple-600' />
              AI Evaluation Results
              {selectedEvaluation && (
                <Badge
                  variant='secondary'
                  className={`ml-2 ${
                    selectedEvaluation.formType === 'quiz'
                      ? 'bg-blue-100 text-blue-800'
                      : selectedEvaluation.formType === 'survey'
                      ? 'bg-green-100 text-green-800'
                      : selectedEvaluation.formType === 'feedback'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {selectedEvaluation.formType.charAt(0).toUpperCase() +
                    selectedEvaluation.formType.slice(1)}{' '}
                  Form Analysis
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedEvaluation && (
            <div className='space-y-6 pt-4'>
              {/* Quiz Results */}
              {selectedEvaluation.formType === 'quiz' &&
                selectedEvaluation.quizResults && (
                  <div className='space-y-6'>
                    {/* Enhanced Quiz Summary */}
                    <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200'>
                      <h3 className='text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2'>
                        <Star className='w-5 h-5' />
                        Quiz Performance Summary
                      </h3>
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
                        <div className='text-center'>
                          <div className='text-4xl font-bold text-blue-600 mb-2'>
                            {selectedEvaluation.quizResults.percentage}%
                          </div>
                          <div className='text-sm text-gray-600 font-medium'>
                            Overall Score
                          </div>
                        </div>
                        <div className='text-center'>
                          <div className='text-4xl font-bold text-green-600 mb-2'>
                            {selectedEvaluation.quizResults.correctAnswers}
                          </div>
                          <div className='text-sm text-gray-600 font-medium'>
                            Correct Answers
                          </div>
                        </div>
                        <div className='text-center'>
                          <div className='text-4xl font-bold text-red-600 mb-2'>
                            {selectedEvaluation.quizResults.totalQuestions -
                              selectedEvaluation.quizResults.correctAnswers}
                          </div>
                          <div className='text-sm text-gray-600 font-medium'>
                            Incorrect Answers
                          </div>
                        </div>
                        <div className='text-center'>
                          <div className='text-4xl font-bold text-gray-600 mb-2'>
                            {selectedEvaluation.quizResults.totalQuestions}
                          </div>
                          <div className='text-sm text-gray-600 font-medium'>
                            Total Questions
                          </div>
                        </div>
                      </div>

                      {/* Performance Level Indicator */}
                      <div className='mt-6 p-4 bg-white rounded-lg'>
                        <div className='flex items-center justify-between mb-2'>
                          <span className='text-sm font-medium text-gray-700'>
                            Performance Level
                          </span>
                          <span
                            className={`text-sm font-bold ${
                              selectedEvaluation.quizResults.percentage >= 80
                                ? 'text-green-600'
                                : selectedEvaluation.quizResults.percentage >=
                                  60
                                ? 'text-blue-600'
                                : selectedEvaluation.quizResults.percentage >=
                                  40
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {selectedEvaluation.quizResults.percentage >= 80
                              ? 'Excellent'
                              : selectedEvaluation.quizResults.percentage >= 60
                              ? 'Good'
                              : selectedEvaluation.quizResults.percentage >= 40
                              ? 'Fair'
                              : 'Needs Improvement'}
                          </span>
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-3'>
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              selectedEvaluation.quizResults.percentage >= 80
                                ? 'bg-green-500'
                                : selectedEvaluation.quizResults.percentage >=
                                  60
                                ? 'bg-blue-500'
                                : selectedEvaluation.quizResults.percentage >=
                                  40
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{
                              width: `${selectedEvaluation.quizResults.percentage}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Question-by-Question Analysis */}
                    <div className='bg-white border border-gray-200 rounded-lg p-6'>
                      <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                        <FileText className='w-5 h-5' />
                        Detailed Question Analysis
                      </h3>
                      <div className='space-y-4'>
                        {selectedEvaluation.quizResults.explanations.map(
                          (explanation, index) => (
                            <div
                              key={explanation.questionId}
                              className={`p-5 rounded-lg border-l-4 ${
                                explanation.isCorrect
                                  ? 'border-l-green-500 bg-green-50'
                                  : 'border-l-red-500 bg-red-50'
                              }`}
                            >
                              <div className='flex items-start justify-between mb-3'>
                                <h4 className='font-medium text-gray-900 flex-1'>
                                  <span className='text-sm text-gray-600 mr-2'>
                                    Question {index + 1}:
                                  </span>
                                  {explanation.question}
                                </h4>
                                <Badge
                                  variant={
                                    explanation.isCorrect
                                      ? 'default'
                                      : 'destructive'
                                  }
                                  className={
                                    explanation.isCorrect
                                      ? 'bg-green-100 text-green-800 border-green-200'
                                      : 'bg-red-100 text-red-800 border-red-200'
                                  }
                                >
                                  {explanation.isCorrect ? (
                                    <>
                                      <CheckCircle className='w-3 h-3 mr-1' />
                                      Correct
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className='w-3 h-3 mr-1' />
                                      Incorrect
                                    </>
                                  )}
                                </Badge>
                              </div>

                              <div className='space-y-3 text-sm'>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                  <div>
                                    <span className='font-medium text-gray-700'>
                                      Your Answer:
                                    </span>
                                    <div
                                      className={`mt-1 p-3 rounded border ${
                                        explanation.isCorrect
                                          ? 'bg-green-100 border-green-200 text-green-800'
                                          : 'bg-red-100 border-red-200 text-red-800'
                                      }`}
                                    >
                                      {explanation.userAnswer}
                                    </div>
                                  </div>

                                  {!explanation.isCorrect && (
                                    <div>
                                      <span className='font-medium text-gray-700'>
                                        Correct Answer:
                                      </span>
                                      <div className='mt-1 p-3 bg-green-100 border border-green-200 text-green-800 rounded'>
                                        {explanation.correctAnswer}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className='mt-4 p-4 bg-white rounded-lg border'>
                                  <span className='font-medium text-gray-700 flex items-center gap-2'>
                                    <FileText className='w-4 h-4' />
                                    Explanation:
                                  </span>
                                  <p className='mt-2 text-gray-900 leading-relaxed'>
                                    {explanation.explanation}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

              {/* Enhanced Survey Results */}
              {selectedEvaluation.formType === 'survey' &&
                selectedEvaluation.surveyResults && (
                  <div className='space-y-6'>
                    {/* Sentiment Overview */}
                    <div className='bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200'>
                      <h3 className='text-lg font-semibold text-green-900 mb-4 flex items-center gap-2'>
                        <Brain className='w-5 h-5' />
                        Sentiment Analysis Overview
                      </h3>
                      <div className='grid grid-cols-3 gap-6 mb-6'>
                        <div className='text-center'>
                          <div className='text-4xl font-bold text-green-600 mb-2'>
                            {
                              selectedEvaluation.surveyResults.overallSentiment
                                .positive
                            }
                            %
                          </div>
                          <div className='text-sm text-gray-600 font-medium'>
                            Positive
                          </div>
                        </div>
                        <div className='text-center'>
                          <div className='text-4xl font-bold text-yellow-600 mb-2'>
                            {
                              selectedEvaluation.surveyResults.overallSentiment
                                .neutral
                            }
                            %
                          </div>
                          <div className='text-sm text-gray-600 font-medium'>
                            Neutral
                          </div>
                        </div>
                        <div className='text-center'>
                          <div className='text-4xl font-bold text-red-600 mb-2'>
                            {
                              selectedEvaluation.surveyResults.overallSentiment
                                .negative
                            }
                            %
                          </div>
                          <div className='text-sm text-gray-600 font-medium'>
                            Negative
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Visual Sentiment Bar */}
                      <div className='space-y-3'>
                        <div className='flex items-center justify-between text-sm font-medium'>
                          <span>Overall Sentiment Distribution</span>
                          <span className='text-green-600'>
                            {selectedEvaluation.surveyResults.overallSentiment
                              .positive >= 70
                              ? 'Excellent'
                              : selectedEvaluation.surveyResults
                                  .overallSentiment.positive >= 50
                              ? 'Good'
                              : selectedEvaluation.surveyResults
                                  .overallSentiment.positive >= 30
                              ? 'Fair'
                              : 'Poor'}
                          </span>
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-4 overflow-hidden'>
                          <div className='flex h-full'>
                            <div
                              className='bg-green-500 transition-all duration-700'
                              style={{
                                width: `${selectedEvaluation.surveyResults.overallSentiment.positive}%`,
                              }}
                              title={`${selectedEvaluation.surveyResults.overallSentiment.positive}% Positive`}
                            ></div>
                            <div
                              className='bg-yellow-500 transition-all duration-700'
                              style={{
                                width: `${selectedEvaluation.surveyResults.overallSentiment.neutral}%`,
                              }}
                              title={`${selectedEvaluation.surveyResults.overallSentiment.neutral}% Neutral`}
                            ></div>
                            <div
                              className='bg-red-500 transition-all duration-700'
                              style={{
                                width: `${selectedEvaluation.surveyResults.overallSentiment.negative}%`,
                              }}
                              title={`${selectedEvaluation.surveyResults.overallSentiment.negative}% Negative`}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Key Metrics */}
                    <div className='bg-white border border-gray-200 rounded-lg p-6'>
                      <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                        <Star className='w-5 h-5' />
                        Key Performance Metrics
                      </h3>
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                        {selectedEvaluation.surveyResults.keyMetrics.map(
                          (metric, index) => (
                            <div
                              key={index}
                              className='p-5 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-gray-200'
                            >
                              <div className='flex items-center justify-between mb-3'>
                                <h4 className='font-medium text-gray-900'>
                                  {metric.metric}
                                </h4>
                                <Badge
                                  variant='secondary'
                                  className={`${
                                    metric.trend === 'up'
                                      ? 'bg-green-100 text-green-800 border-green-200'
                                      : metric.trend === 'down'
                                      ? 'bg-red-100 text-red-800 border-red-200'
                                      : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                  }`}
                                >
                                  {metric.trend === 'up' ? (
                                    <ArrowUpIcon className='w-3 h-3 mr-1' />
                                  ) : metric.trend === 'down' ? (
                                    <ArrowDownIcon className='w-3 h-3 mr-1' />
                                  ) : (
                                    <ArrowRightIcon className='w-3 h-3 mr-1' />
                                  )}
                                  {metric.trend}
                                </Badge>
                              </div>
                              <div className='text-3xl font-bold text-blue-600 mb-2'>
                                {metric.value}
                                {metric.metric
                                  .toLowerCase()
                                  .includes('score') ||
                                metric.metric.toLowerCase().includes('quality')
                                  ? '/100'
                                  : ''}
                              </div>
                              <div className='w-full bg-gray-200 rounded-full h-2'>
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    metric.trend === 'up'
                                      ? 'bg-green-500'
                                      : metric.trend === 'down'
                                      ? 'bg-red-500'
                                      : 'bg-yellow-500'
                                  }`}
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      (metric.value /
                                        (metric.metric
                                          .toLowerCase()
                                          .includes('score') ||
                                        metric.metric
                                          .toLowerCase()
                                          .includes('quality')
                                          ? 100
                                          : 10)) *
                                        100
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Enhanced Insights */}
                    <div className='bg-blue-50 border border-blue-200 rounded-lg p-6'>
                      <h3 className='text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2'>
                        <AlertCircle className='w-5 h-5' />
                        Key Insights & Recommendations
                      </h3>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {selectedEvaluation.surveyResults.insights.map(
                          (insight, index) => (
                            <div
                              key={index}
                              className='flex items-start gap-3 p-4 bg-white rounded-lg border border-blue-200'
                            >
                              <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                                <span className='text-blue-600 text-sm font-bold'>
                                  {index + 1}
                                </span>
                              </div>
                              <div className='flex-1'>
                                <p className='text-gray-900 leading-relaxed'>
                                  {insight}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Response Quality Indicator */}
                    <div className='bg-white border border-gray-200 rounded-lg p-6'>
                      <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                        <CheckCircle className='w-5 h-5' />
                        Response Quality Assessment
                      </h3>
                      <div className='flex items-center justify-between mb-3'>
                        <span className='text-gray-700 font-medium'>
                          Overall Quality Score
                        </span>
                        <span
                          className={`text-lg font-bold ${
                            selectedEvaluation.surveyResults.responseQuality >=
                            80
                              ? 'text-green-600'
                              : selectedEvaluation.surveyResults
                                  .responseQuality >= 60
                              ? 'text-blue-600'
                              : selectedEvaluation.surveyResults
                                  .responseQuality >= 40
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {selectedEvaluation.surveyResults.responseQuality}/100
                        </span>
                      </div>
                      <div className='w-full bg-gray-200 rounded-full h-4'>
                        <div
                          className={`h-4 rounded-full transition-all duration-500 ${
                            selectedEvaluation.surveyResults.responseQuality >=
                            80
                              ? 'bg-green-500'
                              : selectedEvaluation.surveyResults
                                  .responseQuality >= 60
                              ? 'bg-blue-500'
                              : selectedEvaluation.surveyResults
                                  .responseQuality >= 40
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{
                            width: `${selectedEvaluation.surveyResults.responseQuality}%`,
                          }}
                        ></div>
                      </div>
                      <p className='text-sm text-gray-600 mt-2'>
                        {selectedEvaluation.surveyResults.responseQuality >= 80
                          ? 'Excellent - Responses are detailed and thoughtful'
                          : selectedEvaluation.surveyResults.responseQuality >=
                            60
                          ? 'Good - Responses provide meaningful insights'
                          : selectedEvaluation.surveyResults.responseQuality >=
                            40
                          ? 'Fair - Responses are adequate but could be more detailed'
                          : 'Poor - Responses lack detail and depth'}
                      </p>
                    </div>
                  </div>
                )}

              {/* Enhanced Feedback Results */}
              {selectedEvaluation.formType === 'feedback' &&
                selectedEvaluation.feedbackResults && (
                  <div className='space-y-6'>
                    {/* Sentiment Analysis with Priority */}
                    <div className='bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg border border-orange-200'>
                      <div className='flex items-center justify-between mb-4'>
                        <h3 className='text-lg font-semibold text-orange-900 flex items-center gap-2'>
                          <Brain className='w-5 h-5' />
                          Feedback Sentiment Analysis
                        </h3>
                        <Badge
                          variant='destructive'
                          className={`${
                            selectedEvaluation.feedbackResults.urgencyLevel ===
                            'high'
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : selectedEvaluation.feedbackResults
                                  .urgencyLevel === 'medium'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              : 'bg-green-100 text-green-800 border-green-200'
                          }`}
                        >
                          {selectedEvaluation.feedbackResults.urgencyLevel ===
                          'high' ? (
                            <AlertTriangle className='w-3 h-3 mr-1' />
                          ) : selectedEvaluation.feedbackResults
                              .urgencyLevel === 'medium' ? (
                            <AlertCircle className='w-3 h-3 mr-1' />
                          ) : (
                            <CheckCircle className='w-3 h-3 mr-1' />
                          )}
                          {selectedEvaluation.feedbackResults.urgencyLevel
                            .charAt(0)
                            .toUpperCase() +
                            selectedEvaluation.feedbackResults.urgencyLevel.slice(
                              1
                            )}{' '}
                          Priority
                        </Badge>
                      </div>

                      <div className='grid grid-cols-3 gap-6 mb-6'>
                        <div className='text-center'>
                          <div className='text-4xl font-bold text-green-600 mb-2'>
                            {
                              selectedEvaluation.feedbackResults
                                .sentimentBreakdown.positive
                            }
                            %
                          </div>
                          <div className='text-sm text-gray-600 font-medium'>
                            Positive
                          </div>
                        </div>
                        <div className='text-center'>
                          <div className='text-4xl font-bold text-yellow-600 mb-2'>
                            {
                              selectedEvaluation.feedbackResults
                                .sentimentBreakdown.neutral
                            }
                            %
                          </div>
                          <div className='text-sm text-gray-600 font-medium'>
                            Neutral
                          </div>
                        </div>
                        <div className='text-center'>
                          <div className='text-4xl font-bold text-red-600 mb-2'>
                            {
                              selectedEvaluation.feedbackResults
                                .sentimentBreakdown.negative
                            }
                            %
                          </div>
                          <div className='text-sm text-gray-600 font-medium'>
                            Negative
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Visual Sentiment Bar */}
                      <div className='space-y-3'>
                        <div className='flex items-center justify-between text-sm font-medium'>
                          <span>Feedback Sentiment Distribution</span>
                          <span
                            className={`${
                              selectedEvaluation.feedbackResults
                                .urgencyLevel === 'high'
                                ? 'text-red-600'
                                : selectedEvaluation.feedbackResults
                                    .urgencyLevel === 'medium'
                                ? 'text-yellow-600'
                                : 'text-green-600'
                            }`}
                          >
                            Requires{' '}
                            {selectedEvaluation.feedbackResults.urgencyLevel}{' '}
                            attention
                          </span>
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-4 overflow-hidden'>
                          <div className='flex h-full'>
                            <div
                              className='bg-green-500 transition-all duration-700'
                              style={{
                                width: `${selectedEvaluation.feedbackResults.sentimentBreakdown.positive}%`,
                              }}
                            ></div>
                            <div
                              className='bg-yellow-500 transition-all duration-700'
                              style={{
                                width: `${selectedEvaluation.feedbackResults.sentimentBreakdown.neutral}%`,
                              }}
                            ></div>
                            <div
                              className='bg-red-500 transition-all duration-700'
                              style={{
                                width: `${selectedEvaluation.feedbackResults.sentimentBreakdown.negative}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Critical Themes */}
                    <div className='bg-white border border-gray-200 rounded-lg p-6'>
                      <h3 className='text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2'>
                        <AlertTriangle className='w-5 h-5' />
                        Critical Themes Analysis
                      </h3>
                      <div className='space-y-5'>
                        {selectedEvaluation.feedbackResults.criticalThemes.map(
                          (theme, index) => (
                            <div
                              key={index}
                              className={`p-5 rounded-lg border-l-4 ${
                                theme.severity === 'high'
                                  ? 'border-l-red-500 bg-red-50'
                                  : theme.severity === 'medium'
                                  ? 'border-l-yellow-500 bg-yellow-50'
                                  : 'border-l-green-500 bg-green-50'
                              }`}
                            >
                              <div className='flex items-center justify-between mb-3'>
                                <h4 className='font-medium text-gray-900 text-lg'>
                                  {theme.theme}
                                </h4>
                                <div className='flex items-center gap-3'>
                                  <Badge
                                    variant='secondary'
                                    className={`${
                                      theme.severity === 'high'
                                        ? 'bg-red-100 text-red-800 border-red-200'
                                        : theme.severity === 'medium'
                                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                        : 'bg-green-100 text-green-800 border-green-200'
                                    }`}
                                  >
                                    {theme.severity === 'high' ? (
                                      <AlertTriangle className='w-3 h-3 mr-1' />
                                    ) : theme.severity === 'medium' ? (
                                      <AlertCircle className='w-3 h-3 mr-1' />
                                    ) : (
                                      <CheckCircle className='w-3 h-3 mr-1' />
                                    )}
                                    {theme.severity.charAt(0).toUpperCase() +
                                      theme.severity.slice(1)}{' '}
                                    Severity
                                  </Badge>
                                  <span className='text-sm text-gray-600 bg-white px-3 py-1 rounded-full border'>
                                    {theme.frequency} mention
                                    {theme.frequency > 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>

                              <div className='mt-4'>
                                <span className='font-medium text-gray-700 text-sm block mb-2'>
                                  Representative Examples:
                                </span>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                  {theme.examples
                                    .slice(0, 4)
                                    .map((example, exampleIndex) => (
                                      <div
                                        key={exampleIndex}
                                        className='bg-white p-3 rounded border text-sm text-gray-800 leading-relaxed'
                                      >
                                        &ldquo;
                                        {example.length > 100
                                          ? example.substring(0, 100) + '...'
                                          : example}
                                        &rdquo;
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Enhanced Actionable Insights */}
                    <div className='bg-blue-50 border border-blue-200 rounded-lg p-6'>
                      <h3 className='text-lg font-semibold text-blue-900 mb-6 flex items-center gap-2'>
                        <CheckCircle className='w-5 h-5' />
                        Actionable Insights & Recommendations
                      </h3>
                      <div className='space-y-4'>
                        {selectedEvaluation.feedbackResults.actionableInsights.map(
                          (insight, index) => (
                            <div
                              key={index}
                              className='flex items-start gap-4 p-5 bg-white rounded-lg border border-blue-200 shadow-sm'
                            >
                              <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                                <span className='text-blue-600 text-sm font-bold'>
                                  {index + 1}
                                </span>
                              </div>
                              <div className='flex-1'>
                                <p className='text-gray-900 leading-relaxed font-medium'>
                                  {insight}
                                </p>
                                <div className='mt-2 flex items-center gap-2'>
                                  <Badge
                                    variant='outline'
                                    className='text-xs bg-blue-50 border-blue-200'
                                  >
                                    Action Item
                                  </Badge>
                                  <span className='text-xs text-gray-500'>
                                    Priority:{' '}
                                    {selectedEvaluation.feedbackResults
                                      ?.urgencyLevel || 'medium'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

              {/* General Form Results */}
              {selectedEvaluation.formType === 'general' && (
                <div className='bg-gray-50 border border-gray-200 rounded-lg p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                    <FileText className='w-5 h-5' />
                    General Analysis
                  </h3>
                  <div className='p-4 bg-white rounded border'>
                    <p className='text-gray-700 leading-relaxed'>
                      {selectedEvaluation.feedback}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper components for arrows (if not available from lucide-react)
const ArrowUpIcon = ({ className }: { className: string }) => (
  <svg
    className={className}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M5 10l7-7m0 0l7 7m-7-7v18'
    />
  </svg>
);

const ArrowDownIcon = ({ className }: { className: string }) => (
  <svg
    className={className}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M19 14l-7 7m0 0l-7-7m7 7V3'
    />
  </svg>
);

const ArrowRightIcon = ({ className }: { className: string }) => (
  <svg
    className={className}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M13 7l5 5m0 0l-5 5m5-5H6'
    />
  </svg>
);

export default FormSubmissionsPage;
