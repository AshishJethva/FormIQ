// src/components/form-builder/submissions/FormSubmissionsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
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
  AlertDialogDescription,
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
import { deleteFormFile, formatFileSize } from '@/services/fileUploadService';
import FileManager from '@/components/form-builder/FileManager';
import {
  aiEvaluationService,
  type AIEvaluationResult,
} from '@/services/aiEvaluation';

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

// ===== FORM TYPE DETECTION =====
// Add this function before the FormSubmissionsPage component
const detectFormTypeClient = (
  formData: any
): 'quiz' | 'survey' | 'feedback' | 'general' => {
  const formTitle = formData?.title?.toLowerCase() || '';
  const formDescription = formData?.description?.toLowerCase() || '';

  let quizIndicators = 0;
  let surveyIndicators = 0;
  let feedbackIndicators = 0;

  // Analyze title and description
  if (
    /quiz|test|exam|assessment|question/.test(formTitle + ' ' + formDescription)
  ) {
    quizIndicators += 3;
  }
  if (
    /survey|poll|research|opinion|rate/.test(formTitle + ' ' + formDescription)
  ) {
    surveyIndicators += 3;
  }
  if (
    /feedback|review|comment|experience|improve/.test(
      formTitle + ' ' + formDescription
    )
  ) {
    feedbackIndicators += 3;
  }

  // Analyze form fields
  if (formData?.pages) {
    formData.pages.forEach((page: any) => {
      if (page.fields) {
        page.fields.forEach((field: any) => {
          const fieldLabel = field.label?.toLowerCase() || '';

          // Quiz patterns
          if (
            field.type === 'singleChoice' ||
            field.type === 'multipleChoice'
          ) {
            if (/correct|answer|choose|select|true|false/.test(fieldLabel)) {
              quizIndicators += 2;
            }
          }

          // Survey patterns
          if (
            field.type === 'rating' ||
            field.type === 'scale' ||
            fieldLabel.includes('rate')
          ) {
            surveyIndicators += 2;
          }

          // Feedback patterns
          if (field.type === 'longText' || field.type === 'paragraph') {
            if (
              /feedback|comment|improve|experience|suggest|issue|problem/.test(
                fieldLabel
              )
            ) {
              feedbackIndicators += 2;
            }
          }
        });
      }
    });
  }

  // Determine form type based on highest score
  if (quizIndicators >= 3) return 'quiz';
  if (surveyIndicators >= 3) return 'survey';
  if (feedbackIndicators >= 3) return 'feedback';

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
  const [deleting, setDeleting] = useState(false);

  // Form analysis state
  const [uniqueFields, setUniqueFields] = useState<UniqueField[]>([]);
  const [hasEmailField, setHasEmailField] = useState(false);
  const [hasFullNameField, setHasFullNameField] = useState(false);
  const [isFeedbackForm, setIsFeedbackForm] = useState(false);

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
                ],
                type: 'student_id' as const,
                icon: <IdCard className='w-4 h-4' />,
                priority: 2,
              },
              {
                patterns: [
                  'roll number',
                  'roll no',
                  'roll_number',
                  'rollno',
                  'roll_no',
                ],
                type: 'roll_number' as const,
                icon: <Hash className='w-4 h-4' />,
                priority: 3,
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
                priority: 4,
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
                priority: 5,
              },
              {
                patterns: [
                  'id number',
                  'id no',
                  'identification',
                  'reg no',
                  'registration number',
                ],
                type: 'custom_id' as const,
                icon: <Hash className='w-4 h-4' />,
                priority: 6,
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

  // Function to analyze form structure
  const analyzeFormStructure = (formData: any) => {
    let emailFound = false;
    let fullNameFound = false;

    const labelsMap: Record<string, string> = {};
    const detectedUniqueFields = detectUniqueFields(formData);
    setUniqueFields(detectedUniqueFields);

    // Detect if this form should be auto-evaluated
    const formType = detectFormTypeClient(formData);
    const shouldEvaluate = ['quiz', 'survey', 'feedback'].includes(formType);
    setIsFeedbackForm(shouldEvaluate);

    if (formData?.pages && Array.isArray(formData.pages)) {
      formData.pages.forEach((page: any) => {
        if (page.fields && Array.isArray(page.fields)) {
          page.fields.forEach((field: any) => {
            if (field.id && field.label) {
              labelsMap[field.id] = field.label;
            }

            if (
              detectedUniqueFields.length < 2 &&
              field.required &&
              (field.type === 'email' ||
                field.label?.toLowerCase().includes('email'))
            ) {
              emailFound = true;
            }

            if (
              detectedUniqueFields.length < 1 &&
              field.required &&
              (field.label?.toLowerCase().includes('full name') ||
                field.label?.toLowerCase().includes('name'))
            ) {
              fullNameFound = true;
            }
          });
        }
      });
    }

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
    return labelsMap;
  };

  // Enhanced function to get value from submission by field ID
  const getFieldValueFromSubmission = (
    submission: Submission,
    fieldId: string
  ): string => {
    const data = submission.data;
    const value = data[fieldId];
    return formatDisplayValue(value);
  };

  // Function to get email value from submission
  const getEmailFromSubmission = (submission: Submission): string => {
    const data = submission.data;

    for (const [key, value] of Object.entries(data)) {
      if (
        key.toLowerCase().includes('email') ||
        fieldLabelsMap[key]?.toLowerCase().includes('email')
      ) {
        return formatDisplayValue(value);
      }
    }

    return 'N/A';
  };

  // Enhanced function to get full name from submission
  const getFullNameFromSubmission = (submission: Submission): string => {
    const data = submission.data;

    for (const [key, value] of Object.entries(data)) {
      const label = fieldLabelsMap[key]?.toLowerCase() || key.toLowerCase();

      if (label.includes('full name') || label === 'name') {
        return formatDisplayValue(value);
      }
    }

    let firstName = '';
    let lastName = '';

    for (const [key, value] of Object.entries(data)) {
      const label = fieldLabelsMap[key]?.toLowerCase() || key.toLowerCase();

      if (label.includes('first name') || label === 'firstname') {
        firstName = formatDisplayValue(value);
      } else if (label.includes('last name') || label === 'lastname') {
        lastName = formatDisplayValue(value);
      }
    }

    if (firstName !== 'N/A' || lastName !== 'N/A') {
      return (
        `${firstName !== 'N/A' ? firstName : ''} ${
          lastName !== 'N/A' ? lastName : ''
        }`.trim() || 'N/A'
      );
    }

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
        console.log(' Form structure fetched and analyzed');
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
        console.log(' AI evaluation completed for submission:', submission.id);
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
    } finally {
      setEvaluatingSubmissions(prev => {
        const newSet = new Set(prev);
        newSet.delete(submission.id);
        return newSet;
      });
    }
  };

  // Add batch evaluation function:
  const evaluateMultipleSubmissions = async (submissionIds: string[]) => {
    if (!formId) return;

    try {
      console.log(
        '🤖 Starting batch AI evaluation for',
        submissionIds.length,
        'submissions'
      );

      const result = await aiEvaluationService.evaluateBatch(
        formId,
        submissionIds
      );

      if (result.success && result.data) {
        const evaluationsMap: Record<string, AIEvaluation> = {};
        result.data.forEach(evaluation => {
          evaluationsMap[evaluation.submissionId] = evaluation;
        });

        setAiEvaluations(prev => ({
          ...prev,
          ...evaluationsMap,
        }));

        console.log(' Batch AI evaluation completed');
      }
    } catch (error) {
      console.error('❌ Batch evaluation error:', error);
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

          if (isFeedbackForm && processedSubmissions.length > 0) {
            // Auto-evaluate submissions that don't have evaluations yet
            const unevaluatedSubmissions = processedSubmissions.filter(
              (submission: Submission) =>
                !aiEvaluations[submission.id] &&
                !evaluatingSubmissions.has(submission.id)
            );

            if (unevaluatedSubmissions.length > 0) {
              // Evaluate in batches of 5 to avoid overwhelming the API
              const submissionIds = unevaluatedSubmissions
                .slice(0, 5)
                .map((s: Submission) => s.id);
              evaluateMultipleSubmissions(submissionIds);
            }
          }

          console.log(
            ' Submissions fetched successfully:',
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

      const loadingToast = toast.loading(
        'Preparing CSV with Cloudinary links...'
      );

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

      toast.dismiss(loadingToast);

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
      const filename = `${formTitleSafe}_cloudinary_export_${dateStamp}.csv`;

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

      console.log('🎉 Cloudinary CSV download completed:', {
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

      console.log(' Read status updated successfully');
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

  // Delete submission
  const handleDeleteSubmission = async (submissionId: string) => {
    try {
      if (!submissionId || submissionId.trim() === '') {
        throw new Error('Invalid submission ID');
      }

      console.log('🗑️ Deleting submission:', submissionId);
      setDeleting(true);

      await submissionsService.deleteSubmission(submissionId);

      setSubmissions(prev => prev.filter(sub => sub.id !== submissionId));

      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
        unread:
          submissions.find(s => s.id === submissionId)?.isRead === false
            ? prev.unread - 1
            : prev.unread,
      }));

      setAiEvaluations(prev => {
        const newEvaluations = { ...prev };
        delete newEvaluations[submissionId];
        return newEvaluations;
      });

      console.log(' Submission deleted successfully');
    } catch (error: any) {
      console.error('❌ Error deleting submission:', error);
      toast.error(error.message || 'Failed to delete submission');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
      setSubmissionToDelete(null);
    }
  };

  // Enhanced file deletion with proper state management
  const handleDeleteFile = async (
    file: any,
    submissionId: string,
    fieldId: string
  ) => {
    try {
      if (!file?.publicId) {
        throw new Error('Invalid file data');
      }

      console.log('🗑️ Deleting file:', {
        publicId: file.publicId,
        submissionId,
        fieldId,
        fileName: file.originalName,
      });

      const resourceType = file.mimeType?.startsWith('image/')
        ? 'image'
        : 'raw';
      await deleteFormFile(file.publicId, resourceType);

      // Update submissions state by removing file from files array
      setSubmissions(prev =>
        prev.map(sub => {
          if (sub.id === submissionId) {
            const updatedFiles = (sub.files || []).filter(
              (f: any) => f.publicId !== file.publicId
            );

            // Also update data object if file exists there
            const updatedData = { ...sub.data };
            const fieldFiles = updatedData[fieldId];

            if (Array.isArray(fieldFiles)) {
              updatedData[fieldId] = fieldFiles.filter(
                f => f.publicId !== file.publicId
              );
              if (updatedData[fieldId].length === 0) {
                delete updatedData[fieldId];
              }
            } else if (fieldFiles?.publicId === file.publicId) {
              delete updatedData[fieldId];
            }

            return { ...sub, files: updatedFiles, data: updatedData };
          }
          return sub;
        })
      );

      // Update selected submission if it's currently displayed
      if (selectedSubmission?.id === submissionId) {
        const updatedFiles = (selectedSubmission.files || []).filter(
          (f: any) => f.publicId !== file.publicId
        );

        const updatedData = { ...selectedSubmission.data };
        const fieldFiles = updatedData[fieldId];

        if (Array.isArray(fieldFiles)) {
          updatedData[fieldId] = fieldFiles.filter(
            f => f.publicId !== file.publicId
          );
          if (updatedData[fieldId].length === 0) {
            delete updatedData[fieldId];
          }
        } else if (fieldFiles?.publicId === file.publicId) {
          delete updatedData[fieldId];
        }

        setSelectedSubmission({
          ...selectedSubmission,
          files: updatedFiles,
          data: updatedData,
        });
      }

      console.log(' File deleted successfully');
    } catch (error: any) {
      console.error('❌ Error deleting file:', error);
      toast.error(error.message || 'Failed to delete file');
      throw error;
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

      console.log(' File download completed');
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

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return (
          <Badge variant='default' className='bg-green-100 text-green-800'>
            <CheckCircle className='w-3 h-3 mr-1' />
            Processed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant='secondary' className='bg-yellow-100 text-yellow-800'>
            <AlertCircle className='w-3 h-3 mr-1' />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant='destructive' className='bg-red-100 text-red-800'>
            <XCircle className='w-3 h-3 mr-1' />
            Failed
          </Badge>
        );
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  // Get AI evaluation badge
  const getAIEvaluationBadge = (submissionId: string) => {
    if (evaluatingSubmissions.has(submissionId)) {
      return (
        <Badge variant='secondary' className='bg-blue-100 text-blue-800'>
          <Loader2 className='w-3 h-3 mr-1 animate-spin' />
          Evaluating...
        </Badge>
      );
    }

    const evaluation = aiEvaluations[submissionId];
    if (!evaluation) {
      return (
        <Badge variant='outline' className='bg-gray-100 text-gray-600'>
          <Brain className='w-3 h-3 mr-1' />
          Pending
        </Badge>
      );
    }

    if (evaluation.status === 'failed') {
      return (
        <Badge variant='destructive' className='bg-red-100 text-red-800'>
          <XCircle className='w-3 h-3 mr-1' />
          Failed
        </Badge>
      );
    }

    // Form type specific badges
    switch (evaluation.formType) {
      case 'quiz':
        const scoreColor =
          evaluation.quizResults!.percentage >= 70
            ? 'green'
            : evaluation.quizResults!.percentage >= 50
            ? 'yellow'
            : 'red';
        return (
          <Badge
            variant='default'
            className={`bg-${scoreColor}-100 text-${scoreColor}-800`}
          >
            <Star className='w-3 h-3 mr-1' />
            {evaluation.quizResults!.correctAnswers}/
            {evaluation.quizResults!.totalQuestions} (
            {evaluation.quizResults!.percentage}%)
          </Badge>
        );

      case 'survey':
        const surveyColor =
          evaluation.sentiment === 'positive'
            ? 'green'
            : evaluation.sentiment === 'negative'
            ? 'red'
            : 'yellow';
        return (
          <Badge
            variant='default'
            className={`bg-${surveyColor}-100 text-${surveyColor}-800`}
          >
            <Brain className='w-3 h-3 mr-1' />
            {evaluation.surveyResults!.overallSentiment.positive}% Positive
          </Badge>
        );

      case 'feedback':
        const urgencyColor =
          evaluation.feedbackResults!.urgencyLevel === 'high'
            ? 'red'
            : evaluation.feedbackResults!.urgencyLevel === 'medium'
            ? 'yellow'
            : 'green';
        return (
          <Badge
            variant='default'
            className={`bg-${urgencyColor}-100 text-${urgencyColor}-800`}
          >
            <AlertTriangle className='w-3 h-3 mr-1' />
            {evaluation.feedbackResults!.sentimentBreakdown.positive}% Positive
          </Badge>
        );

      default:
        return (
          <Badge variant='default' className='bg-blue-100 text-blue-800'>
            <Brain className='w-3 h-3 mr-1' />
            Analyzed
          </Badge>
        );
    }
  };

  // Add state for the evaluation modal:
  const [showAIEvaluationModal, setShowAIEvaluationModal] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] =
    useState<AIEvaluation | null>(null);

  // Add function to handle evaluation modal:
  const handleViewAIEvaluation = (submissionId: string) => {
    const evaluation = aiEvaluations[submissionId];
    if (evaluation && evaluation.status === 'completed') {
      setSelectedEvaluation(evaluation);
      setShowAIEvaluationModal(true);
    } else if (!evaluation && !evaluatingSubmissions.has(submissionId)) {
      const submission = submissions.find(s => s.id === submissionId);
      if (submission) {
        evaluateSubmissionWithAI(submission);
      }
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

    //  NEW: Check if this is a signature field
    const isSignatureField = (value: any, label: string): boolean => {
      if (typeof value === 'string' && value.startsWith('data:image/')) {
        return true;
      }
      return label.toLowerCase().includes('signature');
    };

    //  NEW: Handle signature fields specially
    if (isSignatureField(value, label)) {
      console.log('✍️ Rendering signature field:', label);

      const handleDownloadSignature = () => {
        try {
          // Create download link from base64 data
          const link = document.createElement('a');
          link.href = value;
          link.download = `signature-${
            selectedSubmission?.id || 'unknown'
          }-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          console.log(' Signature download initiated');
          toast.success('Signature downloaded successfully');
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
            <div className='text-xs text-gray-500'>PNG Image</div>
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
                    // console.error('❌ Failed to load signature image');
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
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  const hasSubmissions = submissions.length > 0;

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Form Submissions</h1>
          <p className='text-gray-600 mt-1'>
            Manage and view all form submissions
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

      {/* Stats Cards */}
      <div className='grid grid-cols-2 md:grid-cols-5 gap-4 mb-1'>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-[#102035]'>
              {stats.total}
            </div>
            <p className='text-sm text-gray-600'>Total</p>
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
      <Card className='mb-0 focus-visible:ring-1 border-none outline-none focus:outline-none focus:ring-0 focus:border-transparent shadow-none'>
        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='flex-1'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <Input
                placeholder='Search submissions...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10 rounded-lg'
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-[150px] rounded-lg'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent className='bg-[#102035] text-white'>
              <SelectItem value='all'>All Status</SelectItem>
              <SelectItem value='processed'>Processed</SelectItem>
              <SelectItem value='pending'>Pending</SelectItem>
              <SelectItem value='failed'>Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={readFilter} onValueChange={setReadFilter}>
            <SelectTrigger className='w-[150px] rounded-lg'>
              <SelectValue placeholder='Read Status' />
            </SelectTrigger>
            <SelectContent className='bg-[#102035] text-white'>
              <SelectItem value='all'>All</SelectItem>
              <SelectItem value='read'>Read</SelectItem>
              <SelectItem value='unread'>Unread</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Submissions Table */}
      <Card className='bg-[#F3F3FE]'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Calendar className='w-5 h-5' />
            Submissions ({stats.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                  <TableRow className='border-b-2 border-gray-300'>
                    <TableHead className='w-[18%] border-r border-gray-300 px-4 py-3'>
                      <div className='flex items-center gap-2 font-semibold'>
                        <Clock className='w-4 h-4' />
                        Submission Date
                      </div>
                    </TableHead>

                    {uniqueFields.map(field => (
                      <TableHead
                        key={field.fieldId}
                        className='w-[20%] border-r border-gray-300 px-4 py-3'
                      >
                        <div className='flex items-center gap-2 font-semibold'>
                          {field.icon}
                          <span className='truncate'>{field.label}</span>
                        </div>
                      </TableHead>
                    ))}

                    {uniqueFields.length < 2 && hasEmailField && (
                      <TableHead className='w-[20%] border-r border-gray-300 px-4 py-3'>
                        <div className='flex items-center gap-2 font-semibold'>
                          <Mail className='w-4 h-4' />
                          Email
                        </div>
                      </TableHead>
                    )}

                    {uniqueFields.length < 1 && hasFullNameField && (
                      <TableHead className='w-[20%] border-r border-gray-300 px-4 py-3'>
                        <div className='flex items-center gap-2 font-semibold'>
                          <User className='w-4 h-4' />
                          Full Name
                        </div>
                      </TableHead>
                    )}

                    <TableHead className='w-[16%] border-r border-gray-300 px-4 py-3'>
                      <div className='flex items-center gap-2 font-semibold'>
                        <Brain className='w-4 h-4' />
                        AI Evaluation
                      </div>
                    </TableHead>

                    <TableHead className='w-[12%] border-r border-gray-300 px-4 py-3'>
                      <div className='flex items-center gap-2 font-semibold'>
                        <AlertCircle className='w-4 h-4' />
                        Status
                      </div>
                    </TableHead>

                    <TableHead className='w-[8%] border-r border-gray-300 px-4 py-3'>
                      <div className='flex items-center justify-center gap-2 font-semibold'>
                        Read
                      </div>
                    </TableHead>

                    <TableHead className='w-[8%] px-4 py-3'>
                      <div className='font-semibold text-center'>Actions</div>
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
                          : ''
                      } hover:bg-gray-50 cursor-pointer border-b border-gray-300`}
                      onClick={() => handleViewSubmission(submission)}
                    >
                      <TableCell className='border-r border-gray-300 px-4 py-4'>
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
                          className='border-r border-gray-300 px-4 py-4'
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
                        <TableCell className='border-r border-gray-300 px-4 py-4'>
                          <div
                            className='truncate font-medium text-gray-900'
                            title={getEmailFromSubmission(submission)}
                          >
                            {getEmailFromSubmission(submission)}
                          </div>
                        </TableCell>
                      )}

                      {uniqueFields.length < 1 && hasFullNameField && (
                        <TableCell className='border-r border-gray-300 px-4 py-4'>
                          <div
                            className='truncate font-medium text-gray-900'
                            title={getFullNameFromSubmission(submission)}
                          >
                            {getFullNameFromSubmission(submission)}
                          </div>
                        </TableCell>
                      )}

                      <TableCell className='border-r border-gray-300 px-4 py-4'>
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

                      <TableCell className='border-r border-gray-300 px-4 py-4'>
                        {getStatusBadge(submission.status)}
                      </TableCell>

                      <TableCell className='border-r border-gray-300 px-4 py-4 text-center'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={e => {
                            e.stopPropagation();
                            handleToggleRead(submission.id, submission.isRead);
                          }}
                          className='p-1 hover:bg-gray-200 rounded-full cursor-pointer'
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
                            className='p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full cursor-pointer'
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

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className='flex items-center justify-between mt-6 pt-4 border-t border-gray-200'>
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
                >
                  Previous
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    fetchSubmissions(pagination.current + 1, pagination.limit)
                  }
                  disabled={pagination.current === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Details Modal */}
      <Dialog open={showSubmissionModal} onOpenChange={setShowSubmissionModal}>
        <DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto bg-white [&>button]:top-6 [&>button]:right-4 [&>button]:cursor-pointer '>
          <DialogHeader className='border-b border-gray-200 pb-4'>
            <DialogTitle className='flex items-center justify-between'>
              <span className='text-xl font-bold text-gray-900'>
                Submission Details
              </span>
            </DialogTitle>
          </DialogHeader>

          {selectedSubmission && (
            <div className='space-y-6 pt-4'>
              {/* Submission Meta Info */}
              <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200'>
                <h4 className='font-semibold text-blue-900 mb-3 flex items-center gap-2'>
                  <Calendar className='w-4 h-4' />
                  Submission Information
                </h4>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <span className='text-blue-700 font-medium'>
                      Submitted:
                    </span>
                    <p className='mt-1 text-gray-900'>
                      {formatDateTime(selectedSubmission.submittedAt)}
                    </p>
                  </div>
                  <div>
                    <span className='text-blue-700 font-medium'>Status:</span>
                    <div className='mt-1'>
                      {getStatusBadge(selectedSubmission.status)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Unique Fields Summary */}
              {uniqueFields.length > 0 && (
                <div className='bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200'>
                  <h4 className='font-semibold text-purple-900 mb-3 flex items-center gap-2'>
                    <IdCard className='w-4 h-4' />
                    Unique Identifiers
                  </h4>
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    {uniqueFields.map(field => (
                      <div key={field.fieldId}>
                        <span className='text-purple-700 font-medium flex items-center gap-1'>
                          {field.icon}
                          {field.label}:
                        </span>
                        <p className='mt-1 font-semibold text-gray-900 bg-white px-3 py-2 rounded border'>
                          {getFieldValueFromSubmission(
                            selectedSubmission,
                            field.fieldId
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Evaluation Details */}
              {isFeedbackForm && aiEvaluations[selectedSubmission.id] && (
                <div className='bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200'>
                  <h4 className='font-semibold text-green-900 mb-3 flex items-center gap-2'>
                    <Brain className='w-4 h-4' />
                    AI Evaluation Results
                  </h4>
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div>
                      <span className='text-green-700 font-medium'>Score:</span>
                      <div className='mt-1'>
                        <Badge className='bg-green-100 text-green-800 font-bold'>
                          {(() => {
                            const evaluation =
                              aiEvaluations[selectedSubmission.id];
                            if (evaluation.quizResults) {
                              return `${evaluation.quizResults.percentage}%`;
                            } else if (evaluation.surveyResults) {
                              return `${evaluation.surveyResults.overallSentiment.positive}% Positive`;
                            } else if (evaluation.feedbackResults) {
                              return `${evaluation.feedbackResults.sentimentBreakdown.positive}% Positive`;
                            }
                            return 'Analyzed';
                          })()}{' '}
                          ⭐
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className='text-green-700 font-medium'>
                        Sentiment:
                      </span>
                      <p className='mt-1 font-semibold text-gray-900 capitalize'>
                        {aiEvaluations[selectedSubmission.id].sentiment}
                      </p>
                    </div>
                    <div className='col-span-2'>
                      <span className='text-green-700 font-medium'>
                        Feedback:
                      </span>
                      <div className='mt-1 bg-white p-3 rounded border'>
                        <p className='text-gray-900 leading-relaxed'>
                          {aiEvaluations[selectedSubmission.id].feedback}
                        </p>
                      </div>
                    </div>
                    <div className='col-span-2'>
                      <span className='text-green-700 font-medium'>
                        Categories:
                      </span>
                      <div className='mt-2 flex gap-2 flex-wrap'>
                        {aiEvaluations[selectedSubmission.id].categories.map(
                          category => (
                            <Badge
                              key={category}
                              variant='outline'
                              className='text-xs bg-white'
                            >
                              {category}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submission Data */}
              <div className='bg-white'>
                <h3 className='text-lg font-bold text-gray-900 mb-6 flex items-center gap-2'>
                  <User className='w-5 h-5' />
                  Submitted Data
                </h3>

                <div className='space-y-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200'>
                  {Object.entries(selectedSubmission.data).length === 0 ? (
                    <div className='text-center py-8'>
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

                      {/* IMPORTANT: Render file fields from submission.files array */}
                      {selectedSubmission.files &&
                        Array.isArray(selectedSubmission.files) &&
                        selectedSubmission.files.length > 0 && (
                          <>
                            <div className='border-t border-gray-300 pt-4 mt-6'>
                              <h4 className='text-md font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                                <FileText className='w-4 h-4' />
                                Uploaded Files
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
                                      className='space-y-3 p-3 bg-white rounded-lg border border-gray-700'
                                    >
                                      <div className='flex items-center justify-between border-b border-gray-200 pb-2'>
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
                                            className='ml-2 text-xs'
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

                                      {/* Compact File List with Action Buttons */}
                                      <div className='space-y-2'>
                                        {normalizedFiles.map((file, index) => (
                                          <div
                                            key={`file-${fieldId}-${index}`}
                                            className='flex items-center gap-3 bg-gray-50 p-3 rounded-lg '
                                          >
                                            {/* File Icon */}
                                            <div className='w-8 h-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0'>
                                              {getFileTypeInfo(file.mimeType)
                                                .icon &&
                                                React.createElement(
                                                  getFileTypeInfo(file.mimeType)
                                                    .icon,
                                                  {
                                                    className: `w-4 h-4 text-${
                                                      getFileTypeInfo(
                                                        file.mimeType
                                                      ).color
                                                    }-500`,
                                                  }
                                                )}
                                            </div>

                                            {/* File Info - Truncated */}
                                            <div className='flex-1 min-w-0'>
                                              <p
                                                className='text-sm font-medium text-gray-900 truncate'
                                                title={file.originalName}
                                                style={{ maxWidth: '200px' }}
                                              >
                                                {file.originalName.length > 25
                                                  ? `${file.originalName.substring(
                                                      0,
                                                      25
                                                    )}...`
                                                  : file.originalName}
                                              </p>
                                              <p className='text-xs text-gray-500'>
                                                {formatFileSize(file.size)}
                                              </p>
                                            </div>

                                            {/* Action Buttons - Only Download */}
                                            <div className='flex gap-1 flex-shrink-0'>
                                              {/* Download Button */}
                                              <Button
                                                size='sm'
                                                variant='ghost'
                                                onClick={() =>
                                                  handleDownloadFile(file)
                                                }
                                                disabled={
                                                  downloadingFileId ===
                                                  file.publicId
                                                }
                                                className='px-2 py-1 h-8 hover:bg-green-100'
                                                title={`Download ${file.originalName}`}
                                              >
                                                {downloadingFileId ===
                                                file.publicId ? (
                                                  <Loader2 className='w-4 h-4 animate-spin' />
                                                ) : (
                                                  <Download className='w-4 h-4' />
                                                )}
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

              {/* Action Buttons in Modal */}
              <div className='flex justify-between items-center'>
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

      {/* Delete Submission Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className='bg-white text-gray-900'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-red-600 font-bold'>
              Delete Submission
            </AlertDialogTitle>
            <AlertDialogDescription className='text-gray-700'>
              Are you sure you want to delete this submission? This action
              cannot be undone. The submission data and all associated files
              will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false);
                setSubmissionToDelete(null);
              }}
              disabled={deleting}
              className='border-gray-300 hover:bg-gray-50 cursor-pointer'
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (submissionToDelete) {
                  handleDeleteSubmission(submissionToDelete);
                }
              }}
              disabled={deleting}
              className='bg-red-600 hover:bg-red-700 text-white cursor-pointer'
            >
              {deleting ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className='w-4 h-4 mr-2' />
                  Delete Submission
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Evaluation Details Modal */}
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
                  Form
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
                    {/* Quiz Summary */}
                    <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200'>
                      <h3 className='text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2'>
                        <Star className='w-5 h-5' />
                        Quiz Performance Summary
                      </h3>
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                        <div className='text-center'>
                          <div className='text-3xl font-bold text-blue-600'>
                            {selectedEvaluation.quizResults.percentage}%
                          </div>
                          <div className='text-sm text-gray-600'>
                            Overall Score
                          </div>
                        </div>
                        <div className='text-center'>
                          <div className='text-3xl font-bold text-green-600'>
                            {selectedEvaluation.quizResults.correctAnswers}
                          </div>
                          <div className='text-sm text-gray-600'>
                            Correct Answers
                          </div>
                        </div>
                        <div className='text-center'>
                          <div className='text-3xl font-bold text-red-600'>
                            {selectedEvaluation.quizResults.totalQuestions -
                              selectedEvaluation.quizResults.correctAnswers}
                          </div>
                          <div className='text-sm text-gray-600'>
                            Incorrect Answers
                          </div>
                        </div>
                        <div className='text-center'>
                          <div className='text-3xl font-bold text-gray-600'>
                            {selectedEvaluation.quizResults.totalQuestions}
                          </div>
                          <div className='text-sm text-gray-600'>
                            Total Questions
                          </div>
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
                              className={`p-4 rounded-lg border-l-4 ${
                                explanation.isCorrect
                                  ? 'border-l-green-500 bg-green-50'
                                  : 'border-l-red-500 bg-red-50'
                              }`}
                            >
                              <div className='flex items-start justify-between mb-2'>
                                <h4 className='font-medium text-gray-900'>
                                  Question {index + 1}: {explanation.question}
                                </h4>
                                <Badge
                                  variant={
                                    explanation.isCorrect
                                      ? 'default'
                                      : 'destructive'
                                  }
                                  className={
                                    explanation.isCorrect
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }
                                >
                                  {explanation.isCorrect
                                    ? 'Correct'
                                    : 'Incorrect'}
                                </Badge>
                              </div>

                              <div className='space-y-2 text-sm'>
                                <div>
                                  <span className='font-medium text-gray-700'>
                                    Your Answer:
                                  </span>
                                  <span className='ml-2 text-gray-900'>
                                    {explanation.userAnswer}
                                  </span>
                                </div>

                                {!explanation.isCorrect && (
                                  <div>
                                    <span className='font-medium text-gray-700'>
                                      Correct Answer:
                                    </span>
                                    <span className='ml-2 text-green-700 font-medium'>
                                      {explanation.correctAnswer}
                                    </span>
                                  </div>
                                )}

                                <div className='mt-3 p-3 bg-white rounded border'>
                                  <span className='font-medium text-gray-700'>
                                    Explanation:
                                  </span>
                                  <p className='mt-1 text-gray-900 leading-relaxed'>
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

              {/* Survey Results */}
              {selectedEvaluation.formType === 'survey' &&
                selectedEvaluation.surveyResults && (
                  <div className='space-y-6'>
                    {/* Sentiment Overview */}
                    <div className='bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200'>
                      <h3 className='text-lg font-semibold text-green-900 mb-4 flex items-center gap-2'>
                        <Brain className='w-5 h-5' />
                        Sentiment Analysis
                      </h3>
                      <div className='grid grid-cols-3 gap-4 mb-4'>
                        <div className='text-center'>
                          <div className='text-3xl font-bold text-green-600'>
                            {
                              selectedEvaluation.surveyResults.overallSentiment
                                .positive
                            }
                            %
                          </div>
                          <div className='text-sm text-gray-600'>Positive</div>
                        </div>
                        <div className='text-center'>
                          <div className='text-3xl font-bold text-yellow-600'>
                            {
                              selectedEvaluation.surveyResults.overallSentiment
                                .neutral
                            }
                            %
                          </div>
                          <div className='text-sm text-gray-600'>Neutral</div>
                        </div>
                        <div className='text-center'>
                          <div className='text-3xl font-bold text-red-600'>
                            {
                              selectedEvaluation.surveyResults.overallSentiment
                                .negative
                            }
                            %
                          </div>
                          <div className='text-sm text-gray-600'>Negative</div>
                        </div>
                      </div>

                      {/* Visual Sentiment Bar */}
                      <div className='w-full bg-gray-200 rounded-full h-4 mb-4'>
                        <div className='flex h-full rounded-full overflow-hidden'>
                          <div
                            className='bg-green-500'
                            style={{
                              width: `${selectedEvaluation.surveyResults.overallSentiment.positive}%`,
                            }}
                          ></div>
                          <div
                            className='bg-yellow-500'
                            style={{
                              width: `${selectedEvaluation.surveyResults.overallSentiment.neutral}%`,
                            }}
                          ></div>
                          <div
                            className='bg-red-500'
                            style={{
                              width: `${selectedEvaluation.surveyResults.overallSentiment.negative}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className='bg-white border border-gray-200 rounded-lg p-6'>
                      <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                        <Star className='w-5 h-5' />
                        Key Performance Metrics
                      </h3>
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        {selectedEvaluation.surveyResults.keyMetrics.map(
                          (metric, index) => (
                            <div
                              key={index}
                              className='p-4 bg-gray-50 rounded-lg'
                            >
                              <div className='flex items-center justify-between mb-2'>
                                <h4 className='font-medium text-gray-900'>
                                  {metric.metric}
                                </h4>
                                <Badge
                                  variant='secondary'
                                  className={`${
                                    metric.trend === 'up'
                                      ? 'bg-green-100 text-green-800'
                                      : metric.trend === 'down'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {metric.trend === 'up'
                                    ? '↗'
                                    : metric.trend === 'down'
                                    ? '↘'
                                    : '→'}{' '}
                                  {metric.trend}
                                </Badge>
                              </div>
                              <div className='text-2xl font-bold text-blue-600'>
                                {metric.value}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Insights */}
                    <div className='bg-blue-50 border border-blue-200 rounded-lg p-6'>
                      <h3 className='text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2'>
                        <AlertCircle className='w-5 h-5' />
                        Key Insights
                      </h3>
                      <ul className='space-y-2'>
                        {selectedEvaluation.surveyResults.insights.map(
                          (insight, index) => (
                            <li key={index} className='flex items-start gap-2'>
                              <CheckCircle className='w-4 h-4 text-blue-600 mt-1 flex-shrink-0' />
                              <span className='text-gray-900'>{insight}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                )}

              {/* Feedback Results */}
              {selectedEvaluation.formType === 'feedback' &&
                selectedEvaluation.feedbackResults && (
                  <div className='space-y-6'>
                    {/* Sentiment Analysis */}
                    <div className='bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg border border-orange-200'>
                      <h3 className='text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2'>
                        <Brain className='w-5 h-5' />
                        Sentiment Analysis
                        <Badge
                          variant='destructive'
                          className={`ml-2 ${
                            selectedEvaluation.feedbackResults.urgencyLevel ===
                            'high'
                              ? 'bg-red-100 text-red-800'
                              : selectedEvaluation.feedbackResults
                                  .urgencyLevel === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {selectedEvaluation.feedbackResults.urgencyLevel
                            .charAt(0)
                            .toUpperCase() +
                            selectedEvaluation.feedbackResults.urgencyLevel.slice(
                              1
                            )}{' '}
                          Priority
                        </Badge>
                      </h3>

                      <div className='grid grid-cols-3 gap-4 mb-4'>
                        <div className='text-center'>
                          <div className='text-3xl font-bold text-green-600'>
                            {
                              selectedEvaluation.feedbackResults
                                .sentimentBreakdown.positive
                            }
                            %
                          </div>
                          <div className='text-sm text-gray-600'>Positive</div>
                        </div>
                        <div className='text-center'>
                          <div className='text-3xl font-bold text-yellow-600'>
                            {
                              selectedEvaluation.feedbackResults
                                .sentimentBreakdown.neutral
                            }
                            %
                          </div>
                          <div className='text-sm text-gray-600'>Neutral</div>
                        </div>
                        <div className='text-center'>
                          <div className='text-3xl font-bold text-red-600'>
                            {
                              selectedEvaluation.feedbackResults
                                .sentimentBreakdown.negative
                            }
                            %
                          </div>
                          <div className='text-sm text-gray-600'>Negative</div>
                        </div>
                      </div>

                      {/* Visual Sentiment Bar */}
                      <div className='w-full bg-gray-200 rounded-full h-4'>
                        <div className='flex h-full rounded-full overflow-hidden'>
                          <div
                            className='bg-green-500'
                            style={{
                              width: `${selectedEvaluation.feedbackResults.sentimentBreakdown.positive}%`,
                            }}
                          ></div>
                          <div
                            className='bg-yellow-500'
                            style={{
                              width: `${selectedEvaluation.feedbackResults.sentimentBreakdown.neutral}%`,
                            }}
                          ></div>
                          <div
                            className='bg-red-500'
                            style={{
                              width: `${selectedEvaluation.feedbackResults.sentimentBreakdown.negative}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Critical Themes */}
                    <div className='bg-white border border-gray-200 rounded-lg p-6'>
                      <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                        <AlertTriangle className='w-5 h-5' />
                        Critical Themes Analysis
                      </h3>
                      <div className='space-y-4'>
                        {selectedEvaluation.feedbackResults.criticalThemes.map(
                          (theme, index) => (
                            <div
                              key={index}
                              className={`p-4 rounded-lg border-l-4 ${
                                theme.severity === 'high'
                                  ? 'border-l-red-500 bg-red-50'
                                  : theme.severity === 'medium'
                                  ? 'border-l-yellow-500 bg-yellow-50'
                                  : 'border-l-green-500 bg-green-50'
                              }`}
                            >
                              <div className='flex items-center justify-between mb-2'>
                                <h4 className='font-medium text-gray-900'>
                                  {theme.theme}
                                </h4>
                                <div className='flex items-center gap-2'>
                                  <Badge
                                    variant='secondary'
                                    className={`${
                                      theme.severity === 'high'
                                        ? 'bg-red-100 text-red-800'
                                        : theme.severity === 'medium'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-green-100 text-green-800'
                                    }`}
                                  >
                                    {theme.severity.charAt(0).toUpperCase() +
                                      theme.severity.slice(1)}{' '}
                                    Severity
                                  </Badge>
                                  <span className='text-sm text-gray-600'>
                                    {theme.frequency} mention
                                    {theme.frequency > 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>

                              <div className='mt-3'>
                                <span className='font-medium text-gray-700 text-sm'>
                                  Examples:
                                </span>
                                <div className='mt-1 flex flex-wrap gap-1'>
                                  {theme.examples.map(
                                    (example, exampleIndex) => (
                                      <Badge
                                        key={exampleIndex}
                                        variant='outline'
                                        className='text-xs bg-white'
                                      >
                                        {example.length > 50
                                          ? example.substring(0, 50) + '...'
                                          : example}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Actionable Insights */}
                    <div className='bg-blue-50 border border-blue-200 rounded-lg p-6'>
                      <h3 className='text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2'>
                        <CheckCircle className='w-5 h-5' />
                        Actionable Insights & Recommendations
                      </h3>
                      <ul className='space-y-3'>
                        {selectedEvaluation.feedbackResults.actionableInsights.map(
                          (insight, index) => (
                            <li
                              key={index}
                              className='flex items-start gap-3 p-3 bg-white rounded border'
                            >
                              <div className='w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                                <span className='text-blue-600 text-sm font-medium'>
                                  {index + 1}
                                </span>
                              </div>
                              <span className='text-gray-900 leading-relaxed'>
                                {insight}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
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
                  <p className='text-gray-700 leading-relaxed'>
                    {selectedEvaluation.feedback}
                  </p>
                </div>
              )}

              {/* Evaluation Metadata */}
              <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
                <div className='flex items-center justify-between text-sm text-gray-600'>
                  <span>
                    Evaluation completed:{' '}
                    {formatDateTime(selectedEvaluation.evaluatedAt)}
                  </span>
                  <span>Analysis ID: {selectedEvaluation.id}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormSubmissionsPage;
