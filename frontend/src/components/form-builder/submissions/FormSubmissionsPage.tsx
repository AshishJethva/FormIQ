import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useDeletion } from '@/hooks/useDeletion';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronDown,
  Filter,
  X,
  Briefcase,
  GraduationCap,
  Award,
  Target,
  UserCheck,
  MessageSquare,
  BarChart3,
  UserX,
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
  DialogDescription,
  DialogClose,
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

// ===== ANIMATION VARIANTS =====
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

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

// Function to format display value beautifully with form structure context
const formatDisplayValue = (
  value: any,
  fieldId?: string,
  formStructure?: any
): string => {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }

  // Get field definition from form structure for choice fields
  let fieldDefinition = null;
  if (fieldId && formStructure?.pages) {
    for (const page of formStructure.pages) {
      if (page?.fields) {
        fieldDefinition = page.fields.find(
          (field: any) => field.id === fieldId
        );
        if (fieldDefinition) break;
      }
    }
  }

  // Handle choice fields - convert value to label
  if (
    fieldDefinition &&
    ['dropdown', 'singleChoice', 'multipleChoice'].includes(
      fieldDefinition.type
    )
  ) {
    if (typeof value === 'string') {
      // Single choice - find the option with this value
      const option = fieldDefinition.options?.find(
        (opt: any) => opt.value === value
      );
      if (option) {
        return option.label;
      }
      // Fallback to original value if option not found
      return value;
    }

    if (Array.isArray(value)) {
      // Multiple choice - map each value to its label
      const labels = value.map((val: string) => {
        const option = fieldDefinition.options?.find(
          (opt: any) => opt.value === val
        );
        return option ? option.label : val;
      });
      return labels.join(', ');
    }
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
          return formatDisplayValue(val, fieldId, formStructure);
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

// Check if a field has files (either in files array or data object)
const fieldHasFiles = (submission: Submission, fieldId: string): boolean => {
  // PRIORITY 1: Check submission.files array first (MOST RELIABLE)
  if (submission.files && Array.isArray(submission.files)) {
    const filesFromArray = submission.files.filter(
      (file: any) => file.fieldId === fieldId
    );
    if (filesFromArray.length > 0) {
      return true;
    }
  }

  // PRIORITY 2: Check data object for legacy file storage
  const value = submission.data[fieldId];
  if (!value) {
    return false;
  }

  // Check for file-like objects
  if (typeof value === 'object' && !Array.isArray(value)) {
    const hasFileProperties = !!(
      (value.originalName && value.url) ||
      (value.fileName && value.url) ||
      value.publicId ||
      value.cloudinaryUrl
    );
    if (hasFileProperties) {
      return true;
    }
  }

  // Check for array of files
  if (Array.isArray(value) && value.length > 0) {
    const hasFiles = value.some(
      item =>
        item &&
        typeof item === 'object' &&
        ((item.originalName && item.url) ||
          (item.fileName && item.url) ||
          item.publicId ||
          item.cloudinaryUrl)
    );
    if (hasFiles) {
      return true;
    }
  }

  // Check for string values that might be file URLs
  if (typeof value === 'string') {
    // Check if it's a Cloudinary URL or file URL
    if (
      value.includes('cloudinary.com') ||
      value.includes('res.cloudinary.com') ||
      (value.startsWith('http') &&
        (value.includes('/upload/') || value.includes('/image/')))
    ) {
      return true;
    }

    // Check if it's a base64 data URL
    if (value.startsWith('data:')) {
      return true;
    }
  }

  return false;
};

// Get all files for a field from both sources
const getAllFilesForField = (
  submission: Submission,
  fieldId: string
): any[] => {
  // PRIORITY 1: Check submission.files array first
  if (submission.files && Array.isArray(submission.files)) {
    const filesFromArray = submission.files.filter(
      (file: any) => file.fieldId === fieldId
    );
    if (filesFromArray.length > 0) {
      return filesFromArray;
    }
  }

  // PRIORITY 2: Check data object for legacy files
  const value = submission.data[fieldId];
  if (!value) {
    return [];
  }

  // Handle array of files
  if (Array.isArray(value)) {
    const validFiles = value.filter(
      item =>
        item &&
        typeof item === 'object' &&
        (item.originalName || item.fileName) &&
        item.url
    );
    if (validFiles.length > 0) {
      return validFiles;
    }
  }

  // Handle single file object
  if (typeof value === 'object' && value.originalName && value.url) {
    return [value];
  }

  // Handle string URLs (convert to file objects)
  if (typeof value === 'string') {
    if (
      value.includes('cloudinary.com') ||
      value.includes('res.cloudinary.com') ||
      value.startsWith('http') ||
      value.startsWith('data:')
    ) {
      // Extract filename from URL or use field label
      let fileName = 'uploaded-file';
      try {
        if (value.includes('/')) {
          const urlParts = value.split('/');
          fileName = urlParts[urlParts.length - 1] || fileName;
        }
      } catch (e) {
        // Keep default filename
        console.error(`Error extracting filename from URL: ${e}`);
      }

      return [
        {
          originalName: fileName,
          fileName: fileName,
          url: value,
          publicId: `extracted_${fieldId}_${Date.now()}`,
          size: 0,
          mimeType: value.startsWith('data:image')
            ? 'image/png'
            : 'application/octet-stream',
          uploadedAt: new Date().toISOString(),
        },
      ];
    }
  }

  return [];
};

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

const detectFormTypeClientEnhanced = (
  formData: any
): {
  type: 'quiz' | 'survey' | 'feedback' | 'application' | 'general';
  confidence: number;
  reasons: string[];
  singleChoiceCount: number;
  canEvaluate: boolean;
  accuracyExpected: number;
  requirements: {
    met: string[];
    missing: string[];
  };
} => {
  const result = {
    type: 'general' as
      | 'quiz'
      | 'survey'
      | 'feedback'
      | 'application'
      | 'general',
    confidence: 0,
    reasons: [] as string[],
    singleChoiceCount: 0,
    canEvaluate: false,
    accuracyExpected: 90,
    requirements: {
      met: [] as string[],
      missing: [] as string[],
    },
  };

  if (!formData?.pages || !Array.isArray(formData.pages)) {
    result.reasons.push('No valid form structure found');
    result.requirements.missing.push('Valid form structure with pages');
    return result;
  }

  // Analyze form title and description with all form type detection
  const formTitle = formData.title?.toLowerCase() || '';
  const formDescription = formData.description?.toLowerCase() || '';
  const titleDescText = `${formTitle} ${formDescription}`.trim();

  // Field analysis counters
  let ratingFields = 0;
  let textFields = 0;
  let feedbackFields = 0;
  let surveyFields = 0;
  let applicationFields = 0;
  let totalFields = 0;
  let hasCorrectAnswers = false;
  let hasFeedbackPatterns = false;
  let hasSurveyPatterns = false;
  let hasApplicationPatterns = false;
  let hasLongTextFields = 0;
  let hasRatingScales = 0;
  let choiceFieldsWithRatingOptions = 0;
  let experienceFields = 0;

  // Application-specific counters
  let hasFileUploads = 0;
  let hasPersonalInfoFields = 0;
  let hasWorkExperienceFields = 0;
  let hasEducationFields = 0;
  let hasSkillsFields = 0;
  let hasContactFields = 0;

  const titleHasFeedbackWords =
    /feedback|review|comment|experience|tell.*us|share.*your.*thoughts|how.*was|what.*did.*you.*think|thoughts.*on|opinion.*about/.test(
      titleDescText
    );
  const titleHasQuizWords = /quiz|test|exam|assessment|evaluation/.test(
    titleDescText
  );
  const titleHasSurveyWords =
    /survey|poll|research|study|questionnaire|analysis|demographic/.test(
      titleDescText
    );
  const titleHasApplicationWords =
    /application|apply|job|career|position|employment|hiring|recruitment|candidate|resume|cv|submit.*application|join.*our.*team|work.*with.*us/.test(
      titleDescText
    );

  // Enhanced field analysis
  formData.pages.forEach((page: any) => {
    if (page?.fields && Array.isArray(page.fields)) {
      page.fields.forEach((field: any) => {
        if (!field?.id || !field?.type || field.type === 'heading') return;

        totalFields++;
        const fieldLabel = field.label?.toLowerCase() || '';
        const fieldType = field.type.toLowerCase();

        // QUIZ DETECTION: Single choice questions with correct answers (HIGHEST PRIORITY)
        if (fieldType === 'singlechoice' || fieldType === 'dropdown') {
          result.singleChoiceCount++;

          // Check for correctAnswer property (PRIMARY quiz indicator)
          if (
            field.correctAnswer ||
            (field.options && field.options.some((opt: any) => opt.isCorrect))
          ) {
            hasCorrectAnswers = true;
          } else {
            // 🔧 FIXED: Check if this single choice has rating options (SURVEY, NOT QUIZ)
            if (field.options && Array.isArray(field.options)) {
              const hasRatingOptions = field.options.some(
                (opt: any) =>
                  opt.label &&
                  /excellent|very.*good|good|fair|poor|very.*poor|strongly.*agree|agree|neutral|disagree|strongly.*disagree|very.*satisfied|satisfied|dissatisfied|very.*dissatisfied|⭐|★|1.*star|2.*star|3.*star|4.*star|5.*star|likely|unlikely/i.test(
                    opt.label
                  )
              );

              if (hasRatingOptions) {
                choiceFieldsWithRatingOptions++;
                ratingFields++;
                hasSurveyPatterns = true;
              }
            }
          }
        }

        // Multiple choice analysis with FIXED logic
        if (fieldType === 'multiplechoice') {
          if (
            field.correctAnswer ||
            field.correctAnswers ||
            (field.options && field.options.some((opt: any) => opt.isCorrect))
          ) {
            hasCorrectAnswers = true;
          } else {
            // Check for rating-like multiple choice options (SURVEY)
            if (field.options && Array.isArray(field.options)) {
              const hasRatingOptions = field.options.some(
                (opt: any) =>
                  opt.label &&
                  /excellent|very.*good|good|fair|poor|very.*poor|strongly.*agree|agree|neutral|disagree|strongly.*disagree|very.*satisfied|satisfied|dissatisfied|very.*dissatisfied|⭐|★|likely|unlikely/i.test(
                    opt.label
                  )
              );

              if (hasRatingOptions) {
                choiceFieldsWithRatingOptions++;
                ratingFields++;
                hasSurveyPatterns = true;
              }
            }
          }
        }

        // File upload detection (strong application indicator)
        if (fieldType === 'fileupload' || fieldType === 'image') {
          hasFileUploads++;

          // Check if it's application-related file upload
          if (
            /resume|cv|curriculum.*vitae|portfolio|cover.*letter|document|certificate|transcript|diploma|attachment|upload.*resume|upload.*cv/i.test(
              fieldLabel
            )
          ) {
            applicationFields++;
            hasApplicationPatterns = true;
          }
        }

        // Personal information detection
        if (
          fieldType === 'fullname' ||
          fieldType === 'email' ||
          fieldType === 'phone' ||
          fieldType === 'address' ||
          /full.*name|first.*name|last.*name|email|phone|address|contact.*information|personal.*details|date.*of.*birth|age|gender|nationality|emergency.*contact/i.test(
            fieldLabel
          )
        ) {
          hasPersonalInfoFields++;
          hasContactFields++;

          if (/personal|contact|details|information/i.test(fieldLabel)) {
            applicationFields++;
            hasApplicationPatterns = true;
          }
        }

        // Work experience detection
        if (
          /work.*experience|job.*experience|employment.*history|previous.*job|current.*job|position.*held|company.*name|employer|job.*title|responsibilities|duties|years.*of.*experience|professional.*experience|career.*history|work.*history|current.*position|previous.*position/i.test(
            fieldLabel
          )
        ) {
          hasWorkExperienceFields++;
          applicationFields++;
          hasApplicationPatterns = true;
        }

        // Education background detection
        if (
          /education|educational.*background|school|university|college|degree|diploma|certification|qualification|academic|studies|major|gpa|graduation|institution|high.*school|bachelor|master|phd|doctorate/i.test(
            fieldLabel
          )
        ) {
          hasEducationFields++;
          applicationFields++;
          hasApplicationPatterns = true;
        }

        // Skills and other application-specific fields
        if (
          /skills|abilities|competencies|expertise|references|availability|salary.*expectation|expected.*salary|start.*date|notice.*period|why.*interested|motivation|cover.*letter|additional.*information|languages.*spoken|certifications|achievements/i.test(
            fieldLabel
          )
        ) {
          hasSkillsFields++;
          applicationFields++;
          hasApplicationPatterns = true;
        }

        // SURVEY DETECTION: Rating/scale fields
        if (
          fieldType === 'rating' ||
          fieldType === 'scale' ||
          fieldType === 'slider'
        ) {
          ratingFields++;
          hasRatingScales++;
          hasSurveyPatterns = true;
        }

        // Rating patterns in labels (stronger survey detection)
        if (
          /rate|rating|satisfaction|quality|likely.*recommend|how.*satisfied|scale.*1.*to|on.*scale|strongly.*agree|strongly.*disagree|how.*would.*you.*rate|please.*rate|rate.*the|evaluate.*the|assess.*the/i.test(
            fieldLabel
          )
        ) {
          ratingFields++;
          hasRatingScales++;
          hasSurveyPatterns = true;
        }

        // FEEDBACK DETECTION: Text fields with feedback patterns
        if (
          fieldType === 'longtext' ||
          fieldType === 'paragraph' ||
          fieldType === 'shorttext'
        ) {
          textFields++;
          hasLongTextFields++;

          // 💬 FEEDBACK-SPECIFIC PATTERNS (experience/improvement focused)
          if (
            /feedback|comment|improve|experience.*with|how.*was.*your|tell.*us.*about|share.*your.*thoughts|what.*did.*you.*think|any.*suggestions|what.*could.*we|how.*can.*we.*improve|describe.*your.*experience/i.test(
              fieldLabel
            )
          ) {
            feedbackFields++;
            hasFeedbackPatterns = true;
          }

          // Experience-specific patterns
          if (
            /experience|how.*was|describe.*your|tell.*us.*about|thoughts.*on.*your|what.*did.*you.*think.*about/i.test(
              fieldLabel
            )
          ) {
            experienceFields++;
            hasFeedbackPatterns = true;
          }

          // APPLICATION-SPECIFIC TEXT PATTERNS
          else if (
            /describe.*yourself|tell.*us.*about|why.*do.*you.*want|what.*makes.*you|your.*experience.*with|goals|objectives|achievements|cover.*letter.*text|additional.*information|anything.*else/i.test(
              fieldLabel
            )
          ) {
            applicationFields++;
            hasApplicationPatterns = true;
          }

          // SURVEY-SPECIFIC TEXT PATTERNS (Research/data collection focused)
          else if (
            /how.*would.*you.*rate|how.*important.*is|rank.*the.*following|what.*is.*your.*preference|demographic|background.*information|research.*purposes|study.*participation|please.*evaluate|additional.*comments.*for.*research|other.*comments.*for.*study/i.test(
              fieldLabel
            )
          ) {
            surveyFields++;
            hasSurveyPatterns = true;
          }
        }
      });
    }
  });

  // PRIORITY 1: QUIZ DETECTION (Highest Priority)
  // Must have 5+ single choice questions AND correct answers
  if (result.singleChoiceCount >= 5 && hasCorrectAnswers) {
    result.type = 'quiz';
    result.confidence = 100;
    result.canEvaluate = true;
    result.accuracyExpected = 99;
    result.reasons.push(
      ` QUIZ: ${result.singleChoiceCount} single choice questions with correct answers`
    );
    result.requirements.met.push(
      `${result.singleChoiceCount} single choice questions with correct answers`
    );

    if (titleHasQuizWords) {
      result.reasons.push(' Title confirms quiz/test nature');
      result.requirements.met.push('Quiz-related title/description');
    }

    // Even if there are rating fields, if it's a quiz, it stays a quiz
    if (ratingFields > 0) {
      result.reasons.push(
        `Note: ${ratingFields} rating fields found but overridden by quiz classification`
      );
    }

    return result;
  }

  // PRIORITY 2: APPLICATION DETECTION
  const applicationIndicators = {
    title:
      /application|apply|job|career|position|employment|hiring|recruitment|candidate|resume|cv|submit.*application|join.*our.*team|work.*with.*us/i.test(
        titleDescText
      ),
    hasPersonalInfo: hasPersonalInfoFields >= 2,
    hasWorkExperience: hasWorkExperienceFields >= 1,
    hasEducation: hasEducationFields >= 1,
    hasSkills: hasSkillsFields >= 1,
    hasFileUpload: hasFileUploads >= 1,
    hasApplicationFields: applicationFields >= 3,
    hasContactInfo: hasContactFields >= 2,
    hasApplicationPatterns: hasApplicationPatterns,
    structuralMatch:
      (hasPersonalInfoFields >= 2 && hasWorkExperienceFields >= 1) ||
      (hasPersonalInfoFields >= 2 && hasEducationFields >= 1) ||
      (hasWorkExperienceFields >= 1 && hasEducationFields >= 1),
    comprehensiveApplication:
      hasPersonalInfoFields >= 2 &&
      hasWorkExperienceFields >= 1 &&
      hasEducationFields >= 1,
  };

  const applicationScore = Object.values(applicationIndicators).filter(
    Boolean
  ).length;

  if (
    applicationScore >= 4 ||
    (applicationIndicators.title && applicationFields >= 3) ||
    applicationIndicators.comprehensiveApplication ||
    (applicationIndicators.structuralMatch && hasFileUploads >= 1) ||
    (hasPersonalInfoFields >= 3 &&
      hasWorkExperienceFields >= 1 &&
      hasEducationFields >= 1) ||
    (titleHasApplicationWords &&
      hasPersonalInfoFields >= 2 &&
      hasFileUploads >= 1) ||
    (hasApplicationPatterns &&
      hasPersonalInfoFields >= 2 &&
      hasFileUploads >= 1)
  ) {
    result.type = 'application';
    result.confidence = Math.min(98, 60 + applicationScore * 4);
    result.canEvaluate = true;
    result.accuracyExpected = 90;
    result.reasons.push(
      `APPLICATION: ${applicationFields} application-specific fields, structured candidate data collection`
    );

    if (hasApplicationPatterns) {
      result.reasons.push('📄 Application-specific field patterns detected');
    }

    if (applicationIndicators.title) {
      result.requirements.met.push('Application/job-related title/description');
    }
    if (applicationIndicators.hasPersonalInfo) {
      result.requirements.met.push(
        `${hasPersonalInfoFields} personal information fields`
      );
    }
    if (applicationIndicators.hasWorkExperience) {
      result.requirements.met.push(
        `${hasWorkExperienceFields} work experience fields`
      );
    }
    if (applicationIndicators.hasEducation) {
      result.requirements.met.push(
        `${hasEducationFields} education background fields`
      );
    }
    if (applicationIndicators.hasSkills) {
      result.requirements.met.push(
        `${hasSkillsFields} skills/qualifications fields`
      );
    }
    if (applicationIndicators.hasFileUpload) {
      result.requirements.met.push(
        `${hasFileUploads} file upload fields (resume/documents)`
      );
    }

    result.reasons.push(
      `📄 Application patterns: recruitment-focused, candidate evaluation (score: ${applicationScore})`
    );

    return result;
  }

  // PRIORITY 3: SURVEY DETECTION
  const surveyIndicators = {
    title: titleHasSurveyWords,
    hasMultipleRatingFields: ratingFields >= 3,
    hasChoiceFieldsWithRatingOptions: choiceFieldsWithRatingOptions >= 2,
    hasRatingScales: hasRatingScales >= 2,
    hasSurveyFields: surveyFields >= 1,
    structuralComplexity: totalFields >= 5,
    explicitSurveyTitle: /survey|poll|questionnaire|research.*study/i.test(
      titleDescText
    ),
    evaluationFocused:
      /evaluate|rate.*our|satisfaction|opinion|assessment.*of/i.test(
        titleDescText
      ),
    hasSurveyPatterns: hasSurveyPatterns,
  };

  // Calculate survey score with enhanced weighting
  const surveyScore = Object.values(surveyIndicators).filter(Boolean).length;

  if (
    surveyScore >= 3 ||
    (surveyIndicators.explicitSurveyTitle && ratingFields >= 1) ||
    (surveyIndicators.title && ratingFields >= 2) ||
    (ratingFields >= 3 && totalFields >= 3) ||
    choiceFieldsWithRatingOptions >= 2 ||
    (surveyIndicators.evaluationFocused && hasRatingScales >= 1) ||
    (hasSurveyPatterns && ratingFields >= 2)
  ) {
    result.type = 'survey';
    result.confidence = Math.min(95, 50 + surveyScore * 6);
    result.canEvaluate = true;
    result.accuracyExpected = 95;
    result.reasons.push(
      ` SURVEY: ${ratingFields} rating fields, ${choiceFieldsWithRatingOptions} choice fields with rating options`
    );

    if (hasSurveyPatterns) {
      result.reasons.push('📊 Survey-specific field patterns detected');
    }

    if (surveyIndicators.title || surveyIndicators.explicitSurveyTitle) {
      result.requirements.met.push('Survey/research-related title/description');
    }
    if (
      surveyIndicators.hasMultipleRatingFields ||
      surveyIndicators.hasChoiceFieldsWithRatingOptions
    ) {
      result.requirements.met.push(
        `${ratingFields} rating/scale fields for quantitative analysis`
      );
    }
    if (surveyIndicators.hasSurveyFields) {
      result.requirements.met.push(
        `${surveyFields} survey-specific evaluation fields`
      );
    }
    if (choiceFieldsWithRatingOptions > 0) {
      result.requirements.met.push(
        `${choiceFieldsWithRatingOptions} choice fields with rating options`
      );
    }

    result.reasons.push(
      `📊 Survey patterns: research-focused, data collection oriented (score: ${surveyScore})`
    );

    return result;
  }

  // PRIORITY 4: FEEDBACK DETECTION
  const feedbackScore =
    (hasFeedbackPatterns ? 3 : 0) +
      (feedbackFields >= 2 ? 2 : 0) +
      (hasLongTextFields >= 3 ? 2 : 0) +
      (titleHasFeedbackWords ? 3 : 0) +
      (ratingFields <= 1 ? 1 : 0) +
      experienceFields >=
    2
      ? 2
      : 0;

  const feedbackIndicators = {
    title: titleHasFeedbackWords,
    hasTextFields: hasLongTextFields >= 2,
    hasFeedbackFields: feedbackFields >= 1,
    feedbackFocused: feedbackFields > surveyFields,
    lowRatingFields: ratingFields <= 1,
    experienceWords:
      /how.*was|experience.*with|thoughts.*on|opinion.*about/i.test(
        titleDescText
      ),
    hasExperienceFields: experienceFields >= 2,
  };

  if (
    feedbackScore >= 5 ||
    (feedbackIndicators.title && feedbackFields >= 1) ||
    (hasLongTextFields >= 3 && feedbackFields >= 2 && ratingFields <= 1) ||
    (experienceFields >= 3 && hasLongTextFields >= 2)
  ) {
    result.type = 'feedback';
    result.confidence = Math.min(95, 60 + feedbackScore * 5);
    result.canEvaluate = true;
    result.accuracyExpected = 92;
    result.reasons.push(
      ` FEEDBACK: ${feedbackFields} feedback fields, ${hasLongTextFields} text fields`
    );

    if (experienceFields >= 2) {
      result.reasons.push(
        `💬 ${experienceFields} experience-focused fields detected`
      );
    }

    if (feedbackIndicators.title) {
      result.requirements.met.push('Feedback-related title/description');
    }
    if (feedbackIndicators.hasFeedbackFields) {
      result.requirements.met.push(
        `${feedbackFields} feedback-specific fields`
      );
    }
    if (feedbackIndicators.hasTextFields) {
      result.requirements.met.push(
        `${hasLongTextFields} text fields for detailed feedback`
      );
    }

    if (feedbackIndicators.hasExperienceFields) {
      result.requirements.met.push(
        `${experienceFields} experience-focused fields`
      );
    }

    result.reasons.push(
      `💬 Feedback patterns: experience-focused, improvement-oriented (score: ${feedbackScore})`
    );

    return result;
  }

  // DEFAULT TO GENERAL
  result.type = 'general';
  result.confidence = 90;
  result.canEvaluate = false;
  result.accuracyExpected = 90;

  // Provide specific guidance based on what's almost there
  const suggestions = [];

  if (result.singleChoiceCount >= 3 && result.singleChoiceCount < 5) {
    suggestions.push(
      `Add ${
        5 - result.singleChoiceCount
      } more single choice questions for quiz classification`
    );
  }

  if (ratingFields >= 1 && ratingFields < 3) {
    suggestions.push(
      `Add ${
        3 - ratingFields
      } more rating/scale fields for survey classification`
    );
  }

  if (choiceFieldsWithRatingOptions >= 1 && choiceFieldsWithRatingOptions < 2) {
    suggestions.push(
      `Add more choice fields with rating options (like "Excellent/Good/Fair/Poor") for survey classification`
    );
  }

  if (hasLongTextFields >= 1 && feedbackFields < 2) {
    suggestions.push(
      'Convert text fields to feedback-focused questions (e.g., "How was your experience?", "What could we improve?")'
    );
  }

  if (titleHasSurveyWords && ratingFields < 3) {
    suggestions.push(
      'Add more rating/scale fields to match the survey-themed title'
    );
  }

  // Application form suggestions
  if (
    hasPersonalInfoFields >= 1 ||
    hasWorkExperienceFields >= 1 ||
    hasEducationFields >= 1 ||
    hasFileUploads >= 1
  ) {
    const missingAppFields = [];
    if (hasPersonalInfoFields < 2)
      missingAppFields.push('personal information fields');
    if (hasWorkExperienceFields < 1)
      missingAppFields.push('work experience fields');
    if (hasEducationFields < 1)
      missingAppFields.push('education background fields');
    if (hasFileUploads < 1) missingAppFields.push('file upload for resume/CV');

    if (missingAppFields.length > 0) {
      suggestions.push(
        `Add ${missingAppFields.join(', ')} for application form classification`
      );
    }
  }

  result.requirements.missing =
    suggestions.length > 0
      ? suggestions
      : [
          'For QUIZ: Need 5+ single choice questions with correct answers',
          'For APPLICATION: Need personal info + work experience/education + file upload',
          'For SURVEY: Need 3+ rating/scale fields OR 2+ choice fields with rating options',
          'For FEEDBACK: Need 2+ feedback-focused text fields (experience, improvement)',
        ];

  result.reasons.push('❌ No specific evaluable form type patterns detected');

  // Show current form composition
  const currentFeatures = [];
  if (result.singleChoiceCount > 0) {
    currentFeatures.push(
      `${result.singleChoiceCount} single choice${
        hasCorrectAnswers ? ' (with answers)' : ' (no answers)'
      }`
    );
  }
  if (applicationFields > 0)
    currentFeatures.push(`${applicationFields} application`);
  if (hasPersonalInfoFields > 0)
    currentFeatures.push(`${hasPersonalInfoFields} personal info`);
  if (hasWorkExperienceFields > 0)
    currentFeatures.push(`${hasWorkExperienceFields} work exp`);
  if (hasEducationFields > 0)
    currentFeatures.push(`${hasEducationFields} education`);
  if (hasFileUploads > 0) currentFeatures.push(`${hasFileUploads} file upload`);
  if (ratingFields > 0) currentFeatures.push(`${ratingFields} rating`);
  if (choiceFieldsWithRatingOptions > 0)
    currentFeatures.push(
      `${choiceFieldsWithRatingOptions} choice w/ rating options`
    );
  if (feedbackFields > 0) currentFeatures.push(`${feedbackFields} feedback`);
  if (surveyFields > 0) currentFeatures.push(`${surveyFields} survey-specific`);
  if (textFields > 0) currentFeatures.push(`${textFields} text`);

  if (currentFeatures.length > 0) {
    result.requirements.met.push(
      `Current: ${currentFeatures.join(', ')} fields`
    );
    result.reasons.push(
      `📊 Form composition: ${currentFeatures.join(
        ', '
      )} (${totalFields} total)`
    );
  }

  return result;
};

// ===== MOBILE SUBMISSION CARD COMPONENT =====
const MobileSubmissionCard: React.FC<{
  submission: Submission;
  fieldLabelsMap: Record<string, string>;
  formStructure: any;
  uniqueFields: UniqueField[];
  hasEmailField: boolean;
  hasFullNameField: boolean;
  isFeedbackForm: boolean;
  detectedFormType: string;
  aiEvaluations: Record<string, AIEvaluation>;
  evaluatingSubmissions: Set<string>;
  onView: (submission: Submission) => void;
  onToggleRead: (submissionId: string, isRead: boolean) => void;
  onDelete: (submissionId: string) => void;
  onViewAIEvaluation: (submissionId: string) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  getAIEvaluationBadge: (submissionId: string) => React.ReactNode;
  getFieldValueFromSubmission: (
    submission: Submission,
    fieldId: string
  ) => string;
  getEmailFromSubmission: (submission: Submission) => string;
  getFullNameFromSubmission: (submission: Submission) => string;
}> = ({
  submission,
  uniqueFields,
  hasEmailField,
  hasFullNameField,
  isFeedbackForm,
  aiEvaluations,
  onView,
  onToggleRead,
  onDelete,
  onViewAIEvaluation,
  getStatusBadge,
  getAIEvaluationBadge,
  getFieldValueFromSubmission,
  getEmailFromSubmission,
  getFullNameFromSubmission,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      variants={fadeInUp}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        p-4 rounded-lg border transition-all duration-300 cursor-pointer
        ${
          !submission.isRead
            ? 'bg-blue-50 border-blue-200 shadow-md border-l-4 border-l-blue-500'
            : 'bg-white border-gray-200 hover:shadow-lg'
        }
      `}
    >
      {/* Header */}
      <div
        className='flex items-center justify-between mb-3'
        onClick={() => onView(submission)}
      >
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 mb-1'>
            <Clock className='w-4 h-4 text-gray-500 flex-shrink-0' />
            <span className='text-sm font-medium text-gray-900 truncate'>
              {formatDateTime(submission.submittedAt)}
            </span>
            {!submission.isRead && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className='w-2 h-2 bg-blue-500 rounded-full flex-shrink-0'
              />
            )}
          </div>
          <div className='text-xs text-gray-500'>
            {formatTimeAgo(submission.submittedAt)}
          </div>
        </div>
        <div className='flex items-center gap-2'>
          {getStatusBadge(submission.status)}
          <Button
            variant='ghost'
            size='sm'
            onClick={e => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className='p-1 h-6 w-6 cursor-pointer'
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className='w-4 h-4' />
            </motion.div>
          </Button>
        </div>
      </div>

      {/* Key Information */}
      <div className='space-y-2 mb-3'>
        {uniqueFields.map(field => (
          <div key={field.fieldId} className='flex items-center gap-2'>
            {field.icon}
            <span className='text-xs text-gray-600 min-w-0 flex-shrink-0'>
              {field.label}:
            </span>
            <span className='text-sm font-medium text-gray-900 truncate'>
              {getFieldValueFromSubmission(submission, field.fieldId)}
            </span>
          </div>
        ))}

        {uniqueFields.length < 2 && hasEmailField && (
          <div className='flex items-center gap-2'>
            <Mail className='w-4 h-4 text-gray-500' />
            <span className='text-xs text-gray-600'>Email:</span>
            <span className='text-sm font-medium text-gray-900 truncate'>
              {getEmailFromSubmission(submission)}
            </span>
          </div>
        )}

        {uniqueFields.length < 1 && hasFullNameField && (
          <div className='flex items-center gap-2'>
            <User className='w-4 h-4 text-gray-500' />
            <span className='text-xs text-gray-600'>Name:</span>
            <span className='text-sm font-medium text-gray-900 truncate'>
              {getFullNameFromSubmission(submission)}
            </span>
          </div>
        )}
      </div>

      {/* AI Evaluation */}
      {isFeedbackForm && (
        <div className='mb-3'>
          <div
            onClick={e => {
              e.stopPropagation();
              onViewAIEvaluation(submission.id);
            }}
            className='cursor-pointer'
          >
            {getAIEvaluationBadge(submission.id)}
          </div>
        </div>
      )}

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='border-t border-gray-200 pt-3 mt-3 space-y-3'
          >
            {/* Additional Details */}
            <div className='text-xs text-gray-600 space-y-1'>
              <div>Submission ID: {submission.id}</div>
              <div>Status: {submission.status}</div>
              <div>Files: {submission.files?.length || 0}</div>
            </div>

            {/* AI Evaluation Details */}
            {isFeedbackForm && aiEvaluations[submission.id] && (
              <div className='bg-gray-50 p-3 rounded border'>
                <div className='text-xs font-medium text-gray-700 mb-2'>
                  AI Analysis Preview
                </div>
                <div className='text-xs text-gray-600 line-clamp-2'>
                  {aiEvaluations[submission.id].feedback}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className='flex items-center justify-between mt-3 pt-3 border-t border-gray-200'>
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={e => {
              e.stopPropagation();
              onToggleRead(submission.id, submission.isRead);
            }}
            className='p-2 h-8 w-8 cursor-pointer'
          >
            {submission.isRead ? (
              <Eye className='w-4 h-4 text-green-600' />
            ) : (
              <EyeOff className='w-4 h-4 text-gray-400' />
            )}
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={e => {
              e.stopPropagation();
              onDelete(submission.id);
            }}
            className='p-2 h-8 w-8 text-red-600 hover:bg-red-50 cursor-pointer'
          >
            <Trash2 className='w-4 h-4' />
          </Button>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={e => {
            e.stopPropagation();
            onView(submission);
          }}
          className='text-xs px-3 py-1 h-7 cursor-pointer'
        >
          View Details
        </Button>
      </div>
    </motion.div>
  );
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

  // Mobile UI state
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // AI Evaluation state
  const [aiEvaluations, setAiEvaluations] = useState<
    Record<string, AIEvaluation>
  >({});
  const [evaluatingSubmissions, setEvaluatingSubmissions] = useState<
    Set<string>
  >(new Set());

  const [formAnalysis, setFormAnalysis] = useState<ReturnType<
    typeof detectFormTypeClientEnhanced
  > | null>(null);

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
      onSuccess: () => {
        fetchSubmissions();
      },
      onError: error => {
        console.error('❌ Submissions deletion failed:', error);
      },
    });

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

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

  const analyzeFormStructure = (formData: any) => {
    let emailFound = false;
    let fullNameFound = false;

    const labelsMap: Record<string, string> = {};

    // Use enhanced form type detection
    const analysis = detectFormTypeClientEnhanced(formData);
    setFormAnalysis(analysis);

    // Update existing state
    setDetectedFormType(analysis.type);
    setIsFeedbackForm(
      analysis.canEvaluate &&
        ['quiz', 'survey', 'feedback', 'application'].includes(analysis.type)
    );

    // Continue with existing field analysis for display
    const detectedUniqueFields = detectUniqueFields(formData);
    setUniqueFields(detectedUniqueFields);

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

            // Enhanced full name field detection with quiz exclusion
            if (detectedUniqueFields.length < 1) {
              const fieldLabel = field.label?.toLowerCase() || '';
              const fieldId = field.id?.toLowerCase() || '';

              //  STRICT: Only match explicit full name patterns
              const isExplicitFullNameField =
                field.type === 'fullName' ||
                fieldLabel === 'full name' ||
                fieldLabel === 'your full name' ||
                fieldLabel === 'complete name' ||
                fieldLabel === 'your name' ||
                fieldLabel === 'name' ||
                fieldId === 'fullname' ||
                fieldId === 'full_name' ||
                fieldId === 'completename' ||
                fieldId === 'complete_name' ||
                fieldId === 'yourname' ||
                fieldId === 'your_name' ||
                fieldId === 'name';

              // ❌ EXCLUDE: Quiz question patterns that contain "name"
              const isQuizQuestion =
                fieldLabel.includes('what is the name') ||
                fieldLabel.includes('name the') ||
                fieldLabel.includes('identify the name') ||
                fieldLabel.includes('what name') ||
                fieldLabel.includes('which name') ||
                fieldLabel.includes('name of the') ||
                fieldLabel.includes('choose the name') ||
                fieldLabel.includes('select the name') ||
                fieldLabel.startsWith('name ') ||
                fieldLabel.includes('correct name') ||
                // Choice field types are likely quiz questions
                (['singleChoice', 'multipleChoice', 'dropdown'].includes(
                  field.type
                ) &&
                  fieldLabel.includes('name')) ||
                // If field has correctAnswer, it's definitely a quiz question
                field.correctAnswer ||
                (field.options &&
                  field.options.some((opt: any) => opt.isCorrect));

              //  Only set fullNameFound if it's explicit AND not a quiz question
              if (isExplicitFullNameField && !isQuizQuestion) {
                fullNameFound = true;
              }
            }
          });
        }
      });
    }

    // Set display preferences with additional quiz check
    if (detectedUniqueFields.length === 0) {
      // Don't show name field for quiz forms unless explicit
      if (analysis.type === 'quiz' && !hasExplicitNameField(formData)) {
        setHasFullNameField(false);
      } else {
        setHasFullNameField(fullNameFound);
      }
      setHasEmailField(emailFound);
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

  const hasExplicitNameField = (formData: any): boolean => {
    if (!formData?.pages) return false;

    for (const page of formData.pages) {
      if (page?.fields) {
        for (const field of page.fields) {
          if (!field?.label) continue;

          const fieldLabel = field.label.toLowerCase();
          const fieldId = field.id?.toLowerCase() || '';

          // Only explicit name collection fields
          const explicitNamePatterns = [
            'full name',
            'your full name',
            'complete name',
            'your name',
            'student name',
            'participant name',
            'user name',
            'enter your name',
            'first name',
            'last name',
          ];

          const isExplicitName =
            explicitNamePatterns.some(
              pattern => fieldLabel === pattern || fieldLabel.includes(pattern)
            ) ||
            field.type === 'fullName' ||
            fieldId === 'fullname' ||
            fieldId === 'full_name';

          // Exclude quiz questions
          const isQuizQuestion =
            fieldLabel.includes('what is the name') ||
            fieldLabel.includes('name the') ||
            fieldLabel.includes('identify the name') ||
            field.correctAnswer ||
            ['singleChoice', 'multipleChoice', 'dropdown'].includes(field.type);

          if (isExplicitName && !isQuizQuestion) {
            return true;
          }
        }
      }
    }

    return false;
  };

  const FormAnalysisBadge = () => {
    if (!formAnalysis) return null;

    const getBadgeColor = () => {
      switch (formAnalysis.type) {
        case 'quiz':
          return 'bg-gradient-to-r from-blue-50 to-indigo-100 text-blue-800 border-blue-200 shadow-sm';
        case 'survey':
          return 'bg-gradient-to-r from-green-50 to-emerald-100 text-green-800 border-green-200 shadow-sm';
        case 'feedback':
          return 'bg-gradient-to-r from-orange-50 to-amber-100 text-orange-800 border-orange-200 shadow-sm';
        case 'application':
          return 'bg-gradient-to-r from-purple-50 to-violet-100 text-purple-800 border-purple-200 shadow-sm';
        default:
          return 'bg-gradient-to-r from-gray-50 to-slate-100 text-gray-700 border-gray-200 shadow-sm';
      }
    };

    const getFormTypeDisplay = () => {
      switch (formAnalysis.type) {
        case 'quiz':
          return {
            icon: <Target className='w-4 h-4' />,
            title: 'Quiz Assessment',
          };
        case 'survey':
          return {
            icon: <BarChart3 className='w-4 h-4' />,
            title: 'Survey Research',
          };
        case 'feedback':
          return {
            icon: <MessageSquare className='w-4 h-4' />,
            title: 'Feedback Collection',
          };
        case 'application':
          return {
            icon: <UserCheck className='w-4 h-4' />,
            title: 'Application Review',
          };
        default:
          return {
            icon: <FileText className='w-4 h-4' />,
            title: 'General Form',
          };
      }
    };

    const formTypeDisplay = getFormTypeDisplay();

    return (
      <div className='flex items-center gap-3'>
        {/* Main Form Type Badge - Static, same height as AI Enabled badge */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-sm font-medium ${getBadgeColor()}`}
        >
          {/* Professional Lucide Icon */}
          {formTypeDisplay.icon}

          {/* Form Type Title */}
          <span className='font-semibold'>{formTypeDisplay.title}</span>
        </div>

        {/* AI Ready Indicator - Only show if evaluable, completely static */}
        {formAnalysis.canEvaluate && (
          <div className='bg-gradient-to-r from-emerald-50 to-green-100 text-emerald-700 border-emerald-200 shadow-sm px-3 py-1 font-medium inline-flex items-center gap-1.5 rounded-lg border text-sm'>
            <Brain className='w-3 h-3' />
            AI Enabled
          </div>
        )}
      </div>
    );
  };

  // Function to get value from submission by field ID with choice field support
  const getFieldValueFromSubmission = (
    submission: Submission,
    fieldId: string
  ): string => {
    const data = submission.data;
    const value = data[fieldId];
    const result = formatDisplayValue(value, fieldId, formStructure);

    return result;
  };

  // Function to get email value from submission with choice field support
  const getEmailFromSubmission = (submission: Submission): string => {
    const data = submission.data;

    // Try direct field matching first
    for (const [key, value] of Object.entries(data)) {
      const label = fieldLabelsMap[key]?.toLowerCase() || key.toLowerCase();

      if (
        key.toLowerCase().includes('email') ||
        label.includes('email') ||
        label.includes('e-mail')
      ) {
        const result = formatDisplayValue(value, key, formStructure);

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
        const result = formatDisplayValue(value, key, formStructure);

        return result;
      }
    }

    return 'N/A';
  };

  // Full name extraction with choice field support
  const getFullNameFromSubmission = (submission: Submission): string => {
    const data = submission.data;

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
        const result = formatDisplayValue(value, key, formStructure);
        if (result !== 'N/A') {
          return result;
        }
      }
    }

    // Step 2: Look for fullName type fields (object with firstName/lastName)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value !== null) {
        if (value.firstName && value.lastName) {
          const result = `${value.firstName} ${value.lastName}`.trim();

          return result;
        }

        // Check for other name combinations
        if (value.first && value.last) {
          const result = `${value.first} ${value.last}`.trim();

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
        firstName = formatDisplayValue(value, key, formStructure);
      } else if (
        label.includes('last name') ||
        label.includes('lastname') ||
        label.includes('surname') ||
        key.toLowerCase().includes('lastname') ||
        key.toLowerCase() === 'lname'
      ) {
        lastName = formatDisplayValue(value, key, formStructure);
      }
    }

    if (firstName !== 'N/A' && lastName !== 'N/A') {
      const result = `${firstName} ${lastName}`.trim();

      return result;
    }

    if (firstName !== 'N/A') {
      return firstName;
    }

    if (lastName !== 'N/A') {
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
        const result = formatDisplayValue(value, key, formStructure);
        if (result !== 'N/A' && result.length > 1) {
          return result;
        }
      }
    }

    return 'N/A';
  };

  // Function to fetch form structure
  const fetchFormStructure = useCallback(async () => {
    if (!formId) return;

    try {
      const response = await formsService.getForm(formId);
      if (response.success && response.data) {
        setFormStructure(response.data);
        analyzeFormStructure(response.data);
      }
    } catch (error) {
      console.error('Error fetching form structure:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId]);

  const evaluateSubmissionWithAI = async (submission: Submission) => {
    if (evaluatingSubmissions.has(submission.id)) {
      return;
    }

    setEvaluatingSubmissions(prev => new Set(prev).add(submission.id));

    try {
      const result = await aiEvaluationService.evaluateSubmission(
        submission.id
      );

      if (result.success && result.data) {
        setAiEvaluations(prev => ({
          ...prev,
          [submission.id]: result.data as AIEvaluation,
        }));

        toast.success('AI evaluation completed!', {
          description: `Analysis completed for ${detectedFormType} form with ${result.data.status} status.`,
          duration: 4000,
        });
      } else {
        // Handle evaluation failure gracefully
        console.error('AI evaluation failed:', result.message);

        const failedEvaluation: AIEvaluation = {
          id: `eval_${submission.id}_failed_${Date.now()}`,
          submissionId: submission.id,
          formType: detectedFormType as any,
          sentiment: 'neutral',
          categories: ['evaluation-failed'],
          evaluatedAt: new Date().toISOString(),
          status: 'failed',
          feedback:
            result.message || 'Evaluation failed due to an unknown error.',
          confidence: 0,
          accuracy: 0,
        };

        setAiEvaluations(prev => ({
          ...prev,
          [submission.id]: failedEvaluation,
        }));

        // Show user-friendly error message
        const userMessage = aiEvaluationService.getUserFriendlyErrorMessage(
          result.error || 'UNKNOWN_ERROR'
        );

        toast.error('AI evaluation failed', {
          description: userMessage,
          duration: 8000,
          action: aiEvaluationService.isRetryableError(result.error || '')
            ? {
                label: 'Retry',
                onClick: () => {
                  setTimeout(() => evaluateSubmissionWithAI(submission), 2000);
                },
              }
            : undefined,
        });
      }
    } catch (error: any) {
      console.error('Critical error in AI evaluation:', error);

      const criticalFailureEvaluation: AIEvaluation = {
        id: `eval_${submission.id}_critical_${Date.now()}`,
        submissionId: submission.id,
        formType: 'general',
        sentiment: 'neutral',
        categories: ['critical-error'],
        evaluatedAt: new Date().toISOString(),
        status: 'failed',
        feedback:
          'Critical evaluation error: Unable to connect to AI service. Please try again later or contact support.',
        confidence: 0,
        accuracy: 0,
      };

      setAiEvaluations(prev => ({
        ...prev,
        [submission.id]: criticalFailureEvaluation,
      }));

      toast.error('Critical evaluation error', {
        description:
          'Unable to connect to AI service. Please check your connection and try again.',
        duration: 10000,
        action: {
          label: 'Retry',
          onClick: () => {
            setTimeout(() => evaluateSubmissionWithAI(submission), 3000);
          },
        },
      });
    } finally {
      setEvaluatingSubmissions(prev => {
        const newSet = new Set(prev);
        newSet.delete(submission.id);
        return newSet;
      });
    }
  };

  const evaluateMultipleSubmissions = async (submissionIds: string[]) => {
    if (!formId) {
      toast.error('Form ID is required for batch evaluation');
      return;
    }

    if (submissionIds.length === 0) {
      toast.error('No submissions selected for evaluation');
      return;
    }

    if (submissionIds.length > 20) {
      toast.error('Maximum 20 submissions can be evaluated at once', {
        description: 'Please select fewer submissions and try again.',
        duration: 5000,
      });
      return;
    }

    try {
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

        // Show detailed success/failure message
        if (successCount === 0) {
          toast.error('Batch evaluation failed', {
            description: `All ${failedCount} evaluations failed. Please try again or contact support.`,
            duration: 8000,
          });
        }

        // Show errors if any
        if (result.metadata?.errors && result.metadata.errors.length > 0) {
          console.warn(' Batch evaluation errors:', result.metadata.errors);
        }
      } else {
        // Handle batch evaluation failure
        console.error('❌ Batch evaluation failed:', result.message);

        // Create failed evaluations for all submissions
        const failedEvaluations: Record<string, AIEvaluation> = {};
        submissionIds.forEach(submissionId => {
          failedEvaluations[submissionId] = {
            id: `eval_${submissionId}_batch_failed_${Date.now()}`,
            submissionId,
            formType: detectedFormType as any,
            sentiment: 'neutral',
            categories: ['batch-evaluation-failed'],
            evaluatedAt: new Date().toISOString(),
            status: 'failed',
            feedback:
              result.message ||
              'Batch evaluation failed due to an unknown error.',
            confidence: 0,
            accuracy: 0,
          };
        });

        setAiEvaluations(prev => ({
          ...prev,
          ...failedEvaluations,
        }));

        const userMessage = aiEvaluationService.getUserFriendlyErrorMessage(
          result.error || 'UNKNOWN_ERROR'
        );

        toast.error('Batch evaluation failed', {
          description: userMessage,
          duration: 10000,
          action: aiEvaluationService.isRetryableError(result.error || '')
            ? {
                label: 'Retry',
                onClick: () => {
                  setTimeout(
                    () => evaluateMultipleSubmissions(submissionIds),
                    3000
                  );
                },
              }
            : undefined,
        });
      }
    } catch (error: any) {
      console.error('❌ Critical error in batch evaluation:', error);

      // Create critical failure evaluations
      const criticalFailureEvaluations: Record<string, AIEvaluation> = {};
      submissionIds.forEach(submissionId => {
        criticalFailureEvaluations[submissionId] = {
          id: `eval_${submissionId}_critical_${Date.now()}`,
          submissionId,
          formType: 'general',
          sentiment: 'neutral',
          categories: ['critical-error'],
          evaluatedAt: new Date().toISOString(),
          status: 'failed',
          feedback:
            'Critical evaluation error: Unable to connect to AI service. Please try again later.',
          confidence: 0,
          accuracy: 0,
        };
      });

      setAiEvaluations(prev => ({
        ...prev,
        ...criticalFailureEvaluations,
      }));

      toast.error('Critical batch evaluation error', {
        description:
          'Unable to connect to AI service. Please check your connection and try again.',
        duration: 12000,
        action: {
          label: 'Retry',
          onClick: () => {
            setTimeout(() => evaluateMultipleSubmissions(submissionIds), 5000);
          },
        },
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
                console.warn(' Submission missing ID:', submission);
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

              evaluateMultipleSubmissions(submissionIds);
            }
          }
        }
      } catch (error: any) {
        console.error('❌ Error fetching submissions:', error);
        toast.error(error.message || 'Failed to fetch submissions');
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.originalName || 'download';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.display = 'none';

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
      setSelectedSubmission(submission);
      setShowSubmissionModal(true);

      if (!submission.isRead) {
        handleToggleRead(submission.id, submission.isRead).catch(error => {
          console.warn(
            ' Failed to mark submission as read when viewing:',
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
            className='bg-green-100 text-green-800 border-green-200 text-xs'
          >
            <CheckCircle className='w-3 h-3 mr-1' />
            Processed
          </Badge>
        );
      case 'pending':
        return (
          <Badge
            variant='secondary'
            className='bg-yellow-100 text-yellow-800 border-yellow-200 text-xs'
          >
            <AlertCircle className='w-3 h-3 mr-1' />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge
            variant='destructive'
            className='bg-red-100 text-red-800 border-red-200 text-xs'
          >
            <XCircle className='w-3 h-3 mr-1' />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant='outline' className='text-xs'>
            {status}
          </Badge>
        );
    }
  };

  const getAIEvaluationBadge = (submissionId: string) => {
    if (evaluatingSubmissions.has(submissionId)) {
      return (
        <Badge
          variant='secondary'
          className='bg-blue-100 text-blue-800 border-blue-200 animate-pulse text-xs'
        >
          <Loader2 className='w-3 h-3 mr-1 animate-spin' />
          Evaluating...
        </Badge>
      );
    }

    const evaluation = aiEvaluations[submissionId];
    if (!evaluation) {
      const pendingText = formAnalysis?.canEvaluate
        ? 'Pending Analysis'
        : 'Not Evaluable';
      const bgColor = formAnalysis?.canEvaluate
        ? 'bg-gray-100 text-gray-600 hover:bg-blue-50 cursor-pointer'
        : 'bg-gray-100 text-gray-600';

      return (
        <Badge variant='outline' className={`${bgColor} text-xs`}>
          <Brain className='w-3 h-3 mr-1' />
          {pendingText}
        </Badge>
      );
    }

    if (evaluation.status === 'failed') {
      return (
        <Badge
          variant='destructive'
          className='bg-red-100 text-red-800 border-red-200 hover:bg-red-50 cursor-pointer text-xs'
          title={`Evaluation failed: ${evaluation.feedback}`}
        >
          <XCircle className='w-3 h-3 mr-1' />
          Failed (Retry)
        </Badge>
      );
    }

    switch (evaluation.formType) {
      case 'quiz':
        if (evaluation.quizResults) {
          const percentage = evaluation.quizResults.percentage;
          const correctAnswers = evaluation.quizResults.correctAnswers;
          const totalQuestions = evaluation.quizResults.totalQuestions;

          const scoreColor =
            percentage >= 80
              ? 'green'
              : percentage >= 60
              ? 'blue'
              : percentage >= 40
              ? 'yellow'
              : 'red';

          const performanceLabel =
            percentage >= 80
              ? 'Excellent'
              : percentage >= 60
              ? 'Good'
              : percentage >= 40
              ? 'Fair'
              : 'Needs Improvement';

          return (
            <Badge
              variant='default'
              className={`bg-${scoreColor}-100 text-${scoreColor}-800 border-${scoreColor}-200 hover:bg-${scoreColor}-50 cursor-pointer text-xs`}
              title={`Quiz Performance: ${correctAnswers}/${totalQuestions} correct answers`}
            >
              <Star className='w-3 h-3 mr-1' />
              {correctAnswers}/{totalQuestions} • {performanceLabel}
            </Badge>
          );
        }
        break;

      case 'survey':
        if (evaluation.surveyResults) {
          const positivePercent =
            evaluation.surveyResults.overallSentiment.positive;
          const neutralPercent =
            evaluation.surveyResults.overallSentiment.neutral || 0;
          const negativePercent =
            evaluation.surveyResults.overallSentiment.negative || 0;

          // Enhanced logic for better sentiment categorization
          const getSentimentLabel = () => {
            // If overwhelmingly positive (70%+)
            if (positivePercent >= 70) {
              return 'Very Positive';
            }
            // If mostly positive (50-69%)
            else if (positivePercent >= 50) {
              return 'Positive';
            }
            // If balanced or mixed (30-49% positive with significant neutral)
            else if (positivePercent >= 30 && neutralPercent >= 20) {
              return 'Mixed Response';
            }
            // If mostly neutral (neutral > 50%)
            else if (neutralPercent >= 50) {
              return 'Neutral';
            }
            // If mostly negative (negative > positive and negative > 40%)
            else if (
              negativePercent > positivePercent &&
              negativePercent >= 40
            ) {
              return 'Negative';
            }
            // If very negative (negative > 60%)
            else if (negativePercent >= 60) {
              return 'Very Negative';
            }
            // Default mixed case
            else {
              return 'Mixed Response';
            }
          };

          const sentimentLabel = getSentimentLabel();

          // Color based on sentiment label rather than just positive percentage
          const surveyColor = sentimentLabel.includes('Very Positive')
            ? 'green'
            : sentimentLabel.includes('Positive') &&
              !sentimentLabel.includes('Very')
            ? 'blue'
            : sentimentLabel.includes('Mixed') ||
              sentimentLabel.includes('Neutral')
            ? 'yellow'
            : sentimentLabel.includes('Negative') &&
              !sentimentLabel.includes('Very')
            ? 'orange'
            : sentimentLabel.includes('Very Negative')
            ? 'red'
            : 'gray';

          return (
            <Badge
              variant='default'
              className={`bg-${surveyColor}-100 text-${surveyColor}-800 border-${surveyColor}-200 hover:bg-${surveyColor}-50 cursor-pointer text-xs`}
              title={`Survey Results: ${positivePercent}% positive, ${neutralPercent}% neutral, ${negativePercent}% negative`}
            >
              <Brain className='w-3 h-3 mr-1' />
              {sentimentLabel}
            </Badge>
          );
        }
        break;

      case 'feedback':
        if (evaluation.feedbackResults) {
          const positivePercent =
            evaluation.feedbackResults.sentimentBreakdown.positive;
          const neutralPercent =
            evaluation.feedbackResults.sentimentBreakdown.neutral || 0;
          const negativePercent =
            evaluation.feedbackResults.sentimentBreakdown.negative || 0;
          const urgencyLevel = evaluation.feedbackResults.urgencyLevel;

          // Enhanced feedback labeling logic
          const getFeedbackLabel = () => {
            // Priority 1: Check urgency level first
            if (urgencyLevel === 'high') {
              return 'Urgent Action Required';
            } else if (urgencyLevel === 'medium') {
              return 'Review Needed';
            }
            // Priority 2: Base on sentiment if low urgency
            else {
              if (positivePercent >= 70) {
                return 'Positive Feedback';
              } else if (positivePercent >= 50) {
                return 'Mostly Positive';
              } else if (neutralPercent >= 50) {
                return 'Neutral Feedback';
              } else if (negativePercent >= 50) {
                return 'Requires Attention';
              } else {
                return 'Mixed Feedback';
              }
            }
          };

          const feedbackLabel = getFeedbackLabel();

          // Color based on urgency first, then sentiment
          const feedbackColor =
            urgencyLevel === 'high'
              ? 'red'
              : urgencyLevel === 'medium'
              ? 'yellow'
              : positivePercent >= 70
              ? 'green'
              : positivePercent >= 50
              ? 'blue'
              : negativePercent >= 50
              ? 'orange'
              : 'gray';

          const priorityIcon =
            urgencyLevel === 'high' ? (
              <AlertTriangle className='w-3 h-3 mr-1' />
            ) : urgencyLevel === 'medium' ? (
              <Clock className='w-3 h-3 mr-1' />
            ) : positivePercent >= 70 ? (
              <CheckCircle className='w-3 h-3 mr-1' />
            ) : (
              <Brain className='w-3 h-3 mr-1' />
            );

          return (
            <Badge
              variant='default'
              className={`bg-${feedbackColor}-100 text-${feedbackColor}-800 border-${feedbackColor}-200 hover:bg-${feedbackColor}-50 cursor-pointer text-xs`}
              title={`Feedback Analysis: ${positivePercent}% positive, ${neutralPercent}% neutral, ${negativePercent}% negative sentiment, ${urgencyLevel} priority level`}
            >
              {priorityIcon}
              {feedbackLabel}
            </Badge>
          );
        }
        break;

      case 'application':
        if (evaluation.applicationResults) {
          const overallScore = evaluation.applicationResults.overallScore;
          const applicationStrength =
            evaluation.applicationResults.applicationStrength;
          const recommendedAction =
            evaluation.applicationResults.recommendedAction;

          const applicationColor =
            overallScore >= 80
              ? 'green'
              : overallScore >= 70
              ? 'blue'
              : overallScore >= 60
              ? 'yellow'
              : 'red';

          const actionLabel =
            recommendedAction === 'hire'
              ? 'Ready to Hire'
              : recommendedAction === 'interview'
              ? 'Schedule Interview'
              : recommendedAction === 'consider'
              ? 'Evaluate Further'
              : 'Not Suitable';

          const actionIcon =
            recommendedAction === 'hire' ? (
              <UserCheck className='w-3 h-3 mr-1' />
            ) : recommendedAction === 'interview' ? (
              <MessageSquare className='w-3 h-3 mr-1' />
            ) : recommendedAction === 'consider' ? (
              <Eye className='w-3 h-3 mr-1' />
            ) : (
              <UserX className='w-3 h-3 mr-1' />
            );

          return (
            <Badge
              variant='default'
              className={`bg-${applicationColor}-100 text-${applicationColor}-800 border-${applicationColor}-200 hover:bg-${applicationColor}-50 cursor-pointer text-xs`}
              title={`Application Score: ${overallScore}/100, ${applicationStrength} candidate profile`}
            >
              {actionIcon}
              {actionLabel}
            </Badge>
          );
        }
        break;
    }

    // Fallback badge
    const accuracy = evaluation.accuracy || 90;
    return (
      <Badge
        variant='default'
        className='bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-50 cursor-pointer text-xs'
        title={`Analysis completed with ${accuracy}% accuracy`}
      >
        <Brain className='w-3 h-3 mr-1' />
        Analyzed
      </Badge>
    );
  };

  // Add state for the evaluation modal:
  const [showAIEvaluationModal, setShowAIEvaluationModal] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] =
    useState<AIEvaluation | null>(null);

  // Function to handle evaluation modal
  const handleViewAIEvaluation = (submissionId: string) => {
    const evaluation = aiEvaluations[submissionId];

    if (evaluation && evaluation.status === 'completed') {
      setSelectedEvaluation(evaluation);
      setShowAIEvaluationModal(true);
    } else if (evaluation && evaluation.status === 'failed') {
      // Show error details and retry option
      const isRetryable =
        evaluation.categories?.includes('evaluation-failed') ||
        evaluation.categories?.includes('batch-evaluation-failed') ||
        evaluation.categories?.includes('critical-error');

      if (isRetryable) {
        toast.error('Evaluation failed', {
          description:
            evaluation.feedback || 'AI evaluation encountered an error.',
          duration: 8000,
          action: {
            label: 'Retry Evaluation',
            onClick: () => {
              const submission = submissions.find(s => s.id === submissionId);
              if (submission) {
                evaluateSubmissionWithAI(submission);
              }
            },
          },
        });
      } else {
        toast.error('Evaluation failed', {
          description:
            evaluation.feedback ||
            'AI evaluation is not available for this submission.',
          duration: 5000,
        });
      }
    } else if (!evaluation && !evaluatingSubmissions.has(submissionId)) {
      // Start evaluation if form type supports it
      if (isFeedbackForm) {
        const submission = submissions.find(s => s.id === submissionId);
        if (submission) {
          evaluateSubmissionWithAI(submission);
        }
      }
    }
  };

  const renderFieldValue = (fieldId: string, value: any) => {
    const label = fieldLabelsMap[fieldId] || fieldId;

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
        } catch (error) {
          console.error('❌ Error downloading signature:', error);
          toast.error('Failed to download signature');
        }
      };

      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className='space-y-3 md:space-y-4'
        >
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
                <div className='flex flex-col sm:flex-row gap-2 justify-center'>
                  {/* Download Button */}
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={handleDownloadSignature}
                    className='flex items-center gap-2 hover:bg-purple-50 hover:border-purple-300 cursor-pointer'
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
                    className='flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 cursor-pointer'
                  >
                    <Eye className='w-4 h-4' />
                    View Full Size
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    // Check if this field has files
    const hasFiles = selectedSubmission
      ? fieldHasFiles(selectedSubmission, fieldId)
      : false;

    if (hasFiles) {
      // Get all files for this field
      const fieldFiles = selectedSubmission
        ? getAllFilesForField(selectedSubmission, fieldId)
        : [];

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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className='space-y-4'
        >
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-2 gap-2'>
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
                <Badge variant='secondary' className='ml-2 text-xs'>
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
              await handleDeleteFile(file, selectedSubmission!.id, fieldId);
            }}
            onFileDownload={async file => {
              await handleDownloadFile(file);
            }}
            showActions={true}
            compact={true}
            readOnly={false}
            downloadingFileId={downloadingFileId}
            maxPreviewSize={10}
          />
        </motion.div>
      );
    }

    // Regular field with enhanced styling and choice field support
    const displayValue = formatDisplayValue(value, fieldId, formStructure);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className='space-y-2 pb-4 border-b border-gray-100 last:border-b-0'
      >
        <label className='text-sm font-semibold text-gray-500 block'>
          {label}
        </label>
        <div className='bg-gray-50 px-2 py-1 rounded-lg border border-gray-300'>
          <p className='text-gray-800 text-md leading-relaxed whitespace-pre-wrap break-words'>
            {displayValue}
          </p>
        </div>
      </motion.div>
    );
  };

  // Initialize data on component mount
  useEffect(() => {
    if (formId) {
      const initializeData = async () => {
        await fetchFormStructure();
        await fetchSubmissions();
      };

      initializeData();
    } else {
      console.warn(' No formId available');
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className='flex items-center justify-center min-h-screen'
      >
        <div className='text-center'>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className='rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'
          />
          <p className='text-gray-600'>Loading submissions...</p>
        </div>
      </motion.div>
    );
  }

  const hasSubmissions = submissions.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className='container mx-auto px-4 py-4 md:py-8 max-w-7xl'
    >
      {/* Enhanced Header with Form Type Badge */}
      <motion.div
        variants={fadeInUp}
        initial='initial'
        animate='animate'
        className='flex flex-col gap-4 mb-6'
      >
        <div className='flex flex-col sm:flex-row justify-between items-start gap-4'>
          <div className='flex-1 min-w-0'>
            <div className='flex flex-col sm:flex-row sm:items-center gap-3 mb-2'>
              <h1 className='text-2xl md:text-3xl font-bold text-gray-900 truncate'>
                Form Submissions
              </h1>
              <FormAnalysisBadge />
            </div>
            <p className='text-gray-600 text-sm md:text-base'>
              Manage and view all form submissions
              {isFeedbackForm && ' with AI-powered analysis'}
            </p>
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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
              w-full sm:w-auto min-w-[180px] justify-center
              text-sm
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
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className='rounded-full h-4 w-4 border-b-2 border-white'
                  />
                  <span className='hidden sm:inline'>Exporting...</span>
                  <span className='sm:hidden'>Export...</span>
                </>
              ) : (
                <>
                  <Download className='w-4 h-4' />
                  <span className='hidden sm:inline'>
                    Download CSV ({stats.total})
                  </span>
                  <span className='sm:hidden'>CSV ({stats.total})</span>
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Enhanced Stats Cards with AI Evaluation Info */}
      <motion.div
        variants={staggerContainer}
        initial='initial'
        animate='animate'
        className='grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6'
      >
        {[
          {
            label: 'Total Submissions',
            value: stats.total,
            color: 'text-[#102035]',
          },
          { label: 'Unread', value: stats.unread, color: 'text-orange-600' },
          { label: 'Pending', value: stats.pending, color: 'text-yellow-600' },
          {
            label: 'Processed',
            value: stats.processed,
            color: 'text-green-600',
          },
          { label: 'Failed', value: stats.failed, color: 'text-red-600' },
        ].map(stat => (
          <motion.div key={stat.label} variants={fadeInUp}>
            <Card className='hover:shadow-md transition-shadow duration-200'>
              <CardContent className='p-3 md:p-4'>
                <div className={`text-xl md:text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <p className='text-xs md:text-sm text-gray-600 truncate'>
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Enhanced Mobile-First Filters */}
      <motion.div
        variants={fadeInUp}
        initial='initial'
        animate='animate'
        className='mb-6'
      >
        <Card className='border-gray-200 shadow-sm'>
          <CardContent className='py-1'>
            {/* Mobile Filter Toggle */}
            <div className='md:hidden mb-4'>
              <Button
                variant='outline'
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className='w-full flex items-center justify-between cursor-pointer'
              >
                <div className='flex items-center gap-2'>
                  <Filter className='w-4 h-4' />
                  <span>Filters</span>
                </div>
                <motion.div
                  animate={{ rotate: showMobileFilters ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className='w-4 h-4' />
                </motion.div>
              </Button>
            </div>

            {/* Search Bar - Always Visible */}
            <div className='mb-4 md:mb-0'>
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

            {/* Filters - Collapsible on Mobile */}
            <AnimatePresence>
              {(showMobileFilters || !isMobile) && (
                <motion.div
                  initial={isMobile ? { height: 0, opacity: 0 } : false}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className='flex flex-col md:flex-row gap-4 md:items-center'
                >
                  <div className='flex flex-col sm:flex-row gap-2 flex-1 mt-3'>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className='w-full sm:w-[150px] rounded-lg border-gray-300'>
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
                      <SelectTrigger className='w-full sm:w-[150px] rounded-lg border-gray-300'>
                        <SelectValue placeholder='Read Status' />
                      </SelectTrigger>
                      <SelectContent className='bg-white border-gray-200'>
                        <SelectItem value='all'>All</SelectItem>
                        <SelectItem value='read'>Read</SelectItem>
                        <SelectItem value='unread'>Unread</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced Submissions Display */}
      <motion.div variants={fadeInUp} initial='initial' animate='animate'>
        <Card className='bg-white border-gray-200 shadow-sm'>
          <CardHeader className='border-b border-gray-200 p-4 md:p-6'>
            <CardTitle className='flex flex-col sm:flex-row sm:items-center gap-2'>
              <div className='flex items-center gap-2'>
                <Calendar className='w-5 h-5 text-gray-600' />
                <span className='text-lg md:text-xl'>
                  Submissions ({stats.total})
                </span>
              </div>
              {isFeedbackForm && (
                <Badge
                  variant='outline'
                  className='ml-0 sm:ml-2 bg-purple-50 text-purple-700 border-purple-200 w-fit'
                >
                  <Brain className='w-3 h-3 mr-1' />
                  AI Enabled
                </Badge>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className='p-0'>
            {submissions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='text-center py-12 px-4'
              >
                <div className='text-gray-400 mb-4'>
                  <Calendar className='w-16 h-16 mx-auto' />
                </div>
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  No submissions yet
                </h3>
                <p className='text-gray-600 text-sm md:text-base'>
                  Submissions will appear here once users start submitting your
                  form.
                </p>
              </motion.div>
            ) : (
              <>
                {/* Mobile Card View */}
                {isMobile ? (
                  <div className='p-4 space-y-3 md:space-y-4'>
                    <motion.div
                      variants={staggerContainer}
                      initial='initial'
                      animate='animate'
                      className='space-y-3 md:space-y-4'
                    >
                      {submissions.map((submission, index) => (
                        <MobileSubmissionCard
                          key={`mobile-submission-${submission.id}-${index}`}
                          submission={submission}
                          fieldLabelsMap={fieldLabelsMap}
                          formStructure={formStructure}
                          uniqueFields={uniqueFields}
                          hasEmailField={hasEmailField}
                          hasFullNameField={hasFullNameField}
                          isFeedbackForm={isFeedbackForm}
                          detectedFormType={detectedFormType}
                          aiEvaluations={aiEvaluations}
                          evaluatingSubmissions={evaluatingSubmissions}
                          onView={handleViewSubmission}
                          onToggleRead={handleToggleRead}
                          onDelete={confirmDelete}
                          onViewAIEvaluation={handleViewAIEvaluation}
                          getStatusBadge={getStatusBadge}
                          getAIEvaluationBadge={getAIEvaluationBadge}
                          getFieldValueFromSubmission={
                            getFieldValueFromSubmission
                          }
                          getEmailFromSubmission={getEmailFromSubmission}
                          getFullNameFromSubmission={getFullNameFromSubmission}
                        />
                      ))}
                    </motion.div>
                  </div>
                ) : (
                  // Desktop Table View
                  <div className='overflow-x-auto shadow-sm rounded-lg border border-gray-200'>
                    <div className='min-w-full'>
                      <Table className='w-full'>
                        <TableHeader>
                          <TableRow className='border-b-2 border-gray-200 bg-gray-50'>
                            <TableHead className='border-r border-gray-200 px-2 lg:px-4 py-3 min-w-[140px] max-w-[180px]'>
                              <div className='flex items-center gap-1 lg:gap-2 font-semibold text-gray-700 text-xs lg:text-sm'>
                                <Clock className='w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0' />
                                <span className='truncate'>Date</span>
                              </div>
                            </TableHead>

                            {uniqueFields.map(field => (
                              <TableHead
                                key={field.fieldId}
                                className='border-r border-gray-200 px-2 lg:px-4 py-3 min-w-[120px] max-w-[160px]'
                              >
                                <div className='flex items-center gap-1 lg:gap-2 font-semibold text-gray-700 text-xs lg:text-sm'>
                                  {React.cloneElement(
                                    field.icon as React.ReactElement<any>,
                                    {
                                      className:
                                        'w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0',
                                    }
                                  )}
                                  <span
                                    className='truncate'
                                    title={field.label}
                                  >
                                    {field.label.length > 12
                                      ? field.label.substring(0, 12) + '...'
                                      : field.label}
                                  </span>
                                </div>
                              </TableHead>
                            ))}

                            {uniqueFields.length < 2 && hasEmailField && (
                              <TableHead className='border-r border-gray-200 px-2 lg:px-4 py-3 min-w-[140px] max-w-[180px]'>
                                <div className='flex items-center gap-1 lg:gap-2 font-semibold text-gray-700 text-xs lg:text-sm'>
                                  <Mail className='w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0' />
                                  <span className='truncate'>Email</span>
                                </div>
                              </TableHead>
                            )}

                            {uniqueFields.length < 1 && hasFullNameField && (
                              <TableHead className='border-r border-gray-200 px-2 lg:px-4 py-3 min-w-[120px] max-w-[160px]'>
                                <div className='flex items-center gap-1 lg:gap-2 font-semibold text-gray-700 text-xs lg:text-sm'>
                                  <User className='w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0' />
                                  <span className='truncate'>Name</span>
                                </div>
                              </TableHead>
                            )}

                            {isFeedbackForm && (
                              <TableHead className='border-r border-gray-200 px-2 lg:px-4 py-3 min-w-[140px] max-w-[180px]'>
                                <div className='flex items-center gap-1 lg:gap-2 font-semibold text-gray-700 text-xs lg:text-sm'>
                                  <Brain className='w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0' />
                                  <span className='truncate'>AI Analysis</span>
                                </div>
                              </TableHead>
                            )}

                            <TableHead className='border-r border-gray-200 px-2 lg:px-4 py-3 min-w-[100px] max-w-[120px]'>
                              <div className='flex items-center gap-1 lg:gap-2 font-semibold text-gray-700 text-xs lg:text-sm'>
                                <AlertCircle className='w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0' />
                                <span className='truncate'>Status</span>
                              </div>
                            </TableHead>

                            <TableHead className='border-r border-gray-200 px-2 lg:px-4 py-3 w-[60px] lg:w-[80px]'>
                              <div className='flex items-center justify-center font-semibold text-gray-700 text-xs lg:text-sm'>
                                <span className='hidden lg:inline'>Read</span>
                                <Eye className='w-3 h-3 lg:hidden' />
                              </div>
                            </TableHead>

                            <TableHead className='px-2 lg:px-4 py-3 w-[60px] lg:w-[80px]'>
                              <div className='font-semibold text-center text-gray-700 text-xs lg:text-sm'>
                                <span className='hidden lg:inline'>
                                  Actions
                                </span>
                                <span className='lg:hidden'>•••</span>
                              </div>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {submissions.map((submission, submissionIndex) => (
                            <motion.tr
                              key={`submission-${submission.id}-${submissionIndex}`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: submissionIndex * 0.05 }}
                              className={`${
                                !submission.isRead
                                  ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                  : 'bg-white'
                              } hover:bg-gray-50 cursor-pointer border-b border-gray-200 transition-colors duration-150`}
                              onClick={() => handleViewSubmission(submission)}
                            >
                              {/* Date Column - Enhanced Responsive */}
                              <TableCell className='border-r border-gray-200 px-2 lg:px-4 py-3 lg:py-4'>
                                <div className='min-w-0'>
                                  <div className='font-medium text-xs lg:text-sm text-gray-900 truncate'>
                                    {formatDateTime(submission.submittedAt)}
                                  </div>
                                  <div className='text-xs text-gray-500 mt-1 truncate'>
                                    {formatTimeAgo(submission.submittedAt)}
                                  </div>
                                </div>
                              </TableCell>

                              {/* Unique Fields - Enhanced Responsive */}
                              {uniqueFields.map(field => (
                                <TableCell
                                  key={field.fieldId}
                                  className='border-r border-gray-200 px-2 lg:px-4 py-3 lg:py-4'
                                >
                                  <div className='min-w-0'>
                                    <div
                                      className='font-medium text-xs lg:text-sm text-gray-900 truncate cursor-pointer hover:text-blue-600'
                                      title={getFieldValueFromSubmission(
                                        submission,
                                        field.fieldId
                                      )}
                                    >
                                      {(() => {
                                        const value =
                                          getFieldValueFromSubmission(
                                            submission,
                                            field.fieldId
                                          );
                                        return value.length > 20
                                          ? value.substring(0, 20) + '...'
                                          : value;
                                      })()}
                                    </div>
                                  </div>
                                </TableCell>
                              ))}

                              {/* Email Field - Enhanced Responsive */}
                              {uniqueFields.length < 2 && hasEmailField && (
                                <TableCell className='border-r border-gray-200 px-2 lg:px-4 py-3 lg:py-4'>
                                  <div className='min-w-0'>
                                    <div
                                      className='font-medium text-xs lg:text-sm text-gray-900 truncate cursor-pointer hover:text-blue-600'
                                      title={getEmailFromSubmission(submission)}
                                    >
                                      {(() => {
                                        const email =
                                          getEmailFromSubmission(submission);
                                        return email.length > 25
                                          ? email.substring(0, 25) + '...'
                                          : email;
                                      })()}
                                    </div>
                                  </div>
                                </TableCell>
                              )}

                              {/* Name Field - Enhanced Responsive */}
                              {uniqueFields.length < 1 && hasFullNameField && (
                                <TableCell className='border-r border-gray-200 px-2 lg:px-4 py-3 lg:py-4'>
                                  <div className='min-w-0'>
                                    <div
                                      className='font-medium text-xs lg:text-sm text-gray-900 truncate cursor-pointer hover:text-blue-600'
                                      title={getFullNameFromSubmission(
                                        submission
                                      )}
                                    >
                                      {(() => {
                                        const name =
                                          getFullNameFromSubmission(submission);
                                        return name.length > 20
                                          ? name.substring(0, 20) + '...'
                                          : name;
                                      })()}
                                    </div>
                                  </div>
                                </TableCell>
                              )}

                              {/* AI Analysis - Enhanced Responsive */}
                              {isFeedbackForm && (
                                <TableCell className='border-r border-gray-200 px-2 lg:px-4 py-3 lg:py-4'>
                                  <div className='min-w-0'>
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
                                  </div>
                                </TableCell>
                              )}

                              {/* Status - Enhanced Responsive */}
                              <TableCell className='border-r border-gray-200 px-2 lg:px-4 py-3 lg:py-4'>
                                <div className='min-w-0'>
                                  {getStatusBadge(submission.status)}
                                </div>
                              </TableCell>

                              {/* Read Status - Enhanced Responsive */}
                              <TableCell className='border-r border-gray-200 px-2 lg:px-4 py-3 lg:py-4 text-center'>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleToggleRead(
                                      submission.id,
                                      submission.isRead
                                    );
                                  }}
                                  className='p-1 hover:bg-gray-200 rounded-full transition-colors cursor-pointer h-6 w-6 lg:h-8 lg:w-8 cursor-pointer'
                                  title={
                                    submission.isRead
                                      ? 'Mark as unread'
                                      : 'Mark as read'
                                  }
                                >
                                  {submission.isRead ? (
                                    <Eye className='w-3 h-3 lg:w-4 lg:h-4 text-green-600' />
                                  ) : (
                                    <EyeOff className='w-3 h-3 lg:w-4 lg:h-4 text-gray-400' />
                                  )}
                                </Button>
                              </TableCell>

                              {/* Actions - Enhanced Responsive */}
                              <TableCell className='px-2 lg:px-4 py-3 lg:py-4'>
                                <div className='flex items-center justify-center'>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={e => {
                                      e.stopPropagation();
                                      confirmDelete(submission.id);
                                    }}
                                    className='p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full cursor-pointer transition-colors h-6 w-6 lg:h-8 lg:w-8 cursor-pointer'
                                    title='Delete submission'
                                  >
                                    <Trash2 className='w-3 h-3 lg:w-4 lg:h-4' />
                                  </Button>
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Enhanced Pagination */}
            {pagination.pages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-gray-200 px-4 md:px-6 pb-4 gap-4'
              >
                <div className='text-sm text-gray-600 text-center sm:text-left'>
                  Showing {(pagination.current - 1) * pagination.limit + 1} to{' '}
                  {Math.min(
                    pagination.current * pagination.limit,
                    pagination.total
                  )}{' '}
                  of {pagination.total} submissions
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      fetchSubmissions(pagination.current - 1, pagination.limit)
                    }
                    disabled={pagination.current === 1}
                    className='border-gray-300 hover:bg-gray-50 cursor-pointer px-3 py-1 text-sm '
                  >
                    Previous
                  </Button>
                  <span className='flex items-center px-3 py-1 text-sm text-gray-700 bg-gray-50 rounded border'>
                    {pagination.current} / {pagination.pages}
                  </span>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      fetchSubmissions(pagination.current + 1, pagination.limit)
                    }
                    disabled={pagination.current === pagination.pages}
                    className='border-gray-300 hover:bg-gray-50 cursor-pointer px-3 py-1 text-sm'
                  >
                    Next
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Submission Details Modal */}
      <Dialog open={showSubmissionModal} onOpenChange={setShowSubmissionModal}>
        <DialogContent
          className='w-[95vw] h-[90vh] max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-0'
          style={{
            width: '55vw',
            maxWidth: '95vw',
          }}
        >
          {/* Clean White Header */}
          <div className='sticky top-0 z-10 bg-white'>
            <DialogHeader className='border-b border-gray-200 p-4 md:p-6 sticky top-0 bg-white'>
              <DialogTitle className='flex flex-col sm:flex-row sm:items-center gap-3 pr-8'>
                <div className='flex items-center gap-3'>
                  <div className='w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md'>
                    <FileText className='w-5 h-5 text-white' />
                  </div>
                  <span className='text-xl font-bold text-gray-900'>
                    Submission Details
                  </span>
                </div>
                {selectedSubmission && isFeedbackForm && (
                  <Badge
                    variant='outline'
                    className={`
                w-fit text-sm font-medium ${
                  detectedFormType === 'quiz'
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : ''
                }
                ${
                  detectedFormType === 'survey'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : ''
                }
                ${
                  detectedFormType === 'feedback'
                    ? 'bg-orange-50 text-orange-700 border-orange-300'
                    : ''
                }
                ${
                  detectedFormType === 'application'
                    ? 'bg-purple-50 text-purple-700 border-purple-300'
                    : ''
                }
              `}
                  >
                    <Brain className='w-4 h-4 mr-1' />
                    {detectedFormType.charAt(0).toUpperCase() +
                      detectedFormType.slice(1)}{' '}
                    Analysis
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className='text-gray-600 text-base leading-relaxed'>
                Comprehensive view of submission data, files, and AI-powered
                insights
              </DialogDescription>
            </DialogHeader>

            {/* Close Button */}
            <DialogClose className='absolute right-4 top-4 rounded-lg p-2 opacity-70 hover:opacity-100 hover:bg-gray-100 transition-all'>
              <X className='h-5 w-5 text-gray-500' />
              <span className='sr-only'>Close</span>
            </DialogClose>
          </div>

          {/* Scrollable Content */}
          <div className='overflow-y-auto flex-1'>
            {selectedSubmission && (
              <div className='space-y-8 p-6'>
                {/* Submission Meta Information */}
                <div className='bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl border border-slate-200 overflow-hidden'>
                  <div className='bg-white/60 backdrop-blur-sm border-b border-slate-200 p-6'>
                    <h4 className='font-bold text-slate-800 text-xl flex items-center gap-3'>
                      Submission Overview
                    </h4>
                  </div>
                  <div className='p-4'>
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                      <div className='bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow'>
                        <div className='flex items-center gap-3 mb-1'>
                          <span className='text-slate-700 font-semibold text-lg'>
                            Submission Time
                          </span>
                        </div>
                        <p className='text-slate-700 font-medium text-sm'>
                          {formatDateTime(selectedSubmission.submittedAt)}
                        </p>
                        <p className='text-blue-600 text-sm mt-0'>
                          {formatTimeAgo(selectedSubmission.submittedAt)}
                        </p>
                      </div>

                      <div className='bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow'>
                        <div className='flex items-center gap-3 mb-2'>
                          <span className='text-slate-700 font-semibold text-lg'>
                            Processing Status
                          </span>
                        </div>
                        {getStatusBadge(selectedSubmission.status)}
                      </div>

                      <div className='bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow'>
                        <div className='flex items-center gap-3 mb-2'>
                          <span className='text-slate-700 font-semibold text-lg'>
                            Read Status
                          </span>
                        </div>
                        <Badge
                          className={`text-xs ${
                            selectedSubmission.isRead
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {selectedSubmission.isRead ? (
                            <>
                              <CheckCircle className='w-4 h-4 mr-2' />
                              Read
                            </>
                          ) : (
                            <>
                              <Clock className='w-4 h-4 mr-2' />
                              Unread
                            </>
                          )}
                        </Badge>
                      </div>

                      <div className='bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow'>
                        <div className='flex items-center gap-3 mb-2'>
                          <span className='text-slate-700 font-semibold text-lg'>
                            Form Category
                          </span>
                        </div>
                        <Badge
                          variant='outline'
                          className='bg-indigo-50 text-indigo-700 border-indigo-300 text-sm font-medium'
                        >
                          {detectedFormType.charAt(0).toUpperCase() +
                            detectedFormType.slice(1)}{' '}
                          Form
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Identifiers */}
                {uniqueFields.length > 0 && (
                  <div className='bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 rounded-2xl border border-purple-200 overflow-hidden'>
                    <div className='bg-white/70 backdrop-blur-sm border-b border-purple-200 p-6'>
                      <h4 className='font-bold text-purple-800 text-lg flex items-center gap-3'>
                        <div className='w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center'>
                          <IdCard className='w-4 h-4 text-white' />
                        </div>
                        Key Identifiers
                      </h4>
                    </div>
                    <div className='p-6 space-y-4'>
                      {uniqueFields.map(field => (
                        <div
                          key={field.fieldId}
                          className='bg-white rounded-xl p-5 border border-purple-200 shadow-sm hover:shadow-md transition-shadow'
                        >
                          <div className='flex items-center gap-3 mb-4'>
                            <div className='w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center'>
                              {React.cloneElement(
                                field.icon as React.ReactElement<{
                                  className?: string;
                                }>,
                                {
                                  className: 'w-4 h-4 text-purple-600',
                                }
                              )}
                            </div>
                            <span className='text-purple-700 font-semibold text-lg'>
                              {field.label}
                            </span>
                          </div>
                          <div className='bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 rounded-lg border border-purple-200'>
                            <p className='text-slate-900 font-medium text-base break-words'>
                              {getFieldValueFromSubmission(
                                selectedSubmission,
                                field.fieldId
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Evaluation Results */}
                {isFeedbackForm && aiEvaluations[selectedSubmission.id] && (
                  <div className='bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl border border-emerald-200 overflow-hidden'>
                    <div className='bg-white/70 backdrop-blur-sm border-b border-emerald-200 p-6'>
                      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
                        <h4 className='font-bold text-emerald-800 text-lg flex items-center gap-3'>
                          AI Analysis Results
                        </h4>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            handleViewAIEvaluation(selectedSubmission.id)
                          }
                          className='bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50 shadow-sm font-medium cursor-pointer'
                        >
                          View Detailed Analysis
                        </Button>
                      </div>
                    </div>
                    <div className='p-5'>
                      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6'>
                        <div className='bg-white rounded-xl p-3 border border-emerald-200 shadow-sm'>
                          <div className='flex items-center gap-3 mb-2'>
                            <span className='text-emerald-800 font-medium text-lg'>
                              Analysis Type
                            </span>
                          </div>
                          <Badge className='border-emerald-200 text-emerald-700 font-normal text-sm'>
                            {aiEvaluations[selectedSubmission.id].formType
                              .charAt(0)
                              .toUpperCase() +
                              aiEvaluations[
                                selectedSubmission.id
                              ].formType.slice(1)}{' '}
                            Analysis
                          </Badge>
                        </div>

                        <div className='bg-white rounded-xl p-3 border border-emerald-200 shadow-sm'>
                          <div className='flex items-center gap-3 mb-2'>
                            <span className='text-emerald-800 font-medium text-lg'>
                              Sentiment
                            </span>
                          </div>
                          <Badge
                            className={`font-semibold text-sm ${
                              aiEvaluations[selectedSubmission.id].sentiment ===
                              'positive'
                                ? 'bg-green-100 text-emerald-700 font-normal border-emerald-200 text-sm'
                                : aiEvaluations[selectedSubmission.id]
                                    .sentiment === 'negative'
                                ? 'bg-red-100 text-red-800 border-red-300 font-normal text-sm'
                                : 'bg-amber-100 text-amber-800 border-amber-300 font-normal text-sm'
                            }`}
                          >
                            {aiEvaluations[selectedSubmission.id].sentiment ===
                            'positive' ? (
                              <CheckCircle className='w-4 h-4 mr-2' />
                            ) : aiEvaluations[selectedSubmission.id]
                                .sentiment === 'negative' ? (
                              <XCircle className='w-4 h-4 mr-2' />
                            ) : (
                              <AlertCircle className='w-4 h-4 mr-2' />
                            )}
                            {aiEvaluations[selectedSubmission.id].sentiment
                              .charAt(0)
                              .toUpperCase() +
                              aiEvaluations[
                                selectedSubmission.id
                              ].sentiment.slice(1)}
                          </Badge>
                        </div>
                      </div>

                      <div className=''>
                        <h5 className='text-emerald-800 font-semibold text-lg mb-2 flex items-center gap-2'>
                          Analysis Summary
                        </h5>
                        <div className='bg-white px-3 py-2 rounded-lg border border-emerald-200'>
                          <p className=' text-emerald-700 font-normal leading-relaxed text-base'>
                            {aiEvaluations[selectedSubmission.id].feedback}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submission Data */}
                <div className='bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm'>
                  <div className='bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200 p-6'>
                    <div className='flex items-center justify-between'>
                      <h3 className='font-bold text-slate-800 text-xl flex items-center gap-3'>
                        Submitted Data
                      </h3>
                      <Badge
                        variant='outline'
                        className='bg-slate-100 text-slate-700 border-slate-300 font-medium'
                      >
                        {Object.entries(selectedSubmission.data).length} fields
                      </Badge>
                    </div>
                  </div>

                  <div className='p-6'>
                    {Object.entries(selectedSubmission.data).length === 0 ? (
                      <div className='text-center py-12'>
                        <div className='w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                          <FileText className='w-8 h-8 text-slate-400' />
                        </div>
                        <p className='text-slate-500 text-lg font-medium'>
                          No data submitted
                        </p>
                        <p className='text-slate-400 text-sm mt-1'>
                          This submission contains no form data
                        </p>
                      </div>
                    ) : (
                      <div className='space-y-6'>
                        {/* Render Form Fields */}
                        {Object.entries(selectedSubmission.data).map(
                          ([fieldId, value], index) => {
                            // Check if this is a signature field
                            const label = fieldLabelsMap[fieldId] || fieldId;
                            const isSignatureField = (
                              value: any,
                              label: string
                            ): boolean => {
                              if (
                                typeof value === 'string' &&
                                value.startsWith('data:image/')
                              )
                                return true;
                              if (
                                typeof value === 'string' &&
                                value.includes('cloudinary.com') &&
                                label.toLowerCase().includes('signature')
                              )
                                return true;
                              return label.toLowerCase().includes('signature');
                            };

                            return (
                              <div key={`field-${fieldId}-${index}`}>
                                {isSignatureField(value, label) ? (
                                  // Signature Field Rendering
                                  <div className='space-y-4'>
                                    <div className='flex items-center justify-between border-b border-slate-200 pb-4'>
                                      <div className='flex items-center gap-3'>
                                        <div className='w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center'>
                                          <svg
                                            className='w-4 h-4 text-purple-600'
                                            fill='currentColor'
                                            viewBox='0 0 20 20'
                                          >
                                            <path
                                              fillRule='evenodd'
                                              d='M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z'
                                              clipRule='evenodd'
                                            />
                                          </svg>
                                        </div>
                                        <div>
                                          <h4 className='font-semibold text-slate-800 text-lg'>
                                            {label}
                                          </h4>
                                          <Badge
                                            variant='secondary'
                                            className='mt-1 bg-purple-100 text-purple-700 border-purple-300 text-xs'
                                          >
                                            Digital Signature
                                          </Badge>
                                        </div>
                                      </div>
                                      <div className='text-sm text-slate-500'>
                                        {typeof value === 'string' &&
                                        value.startsWith('data:image/')
                                          ? 'Base64 PNG'
                                          : 'Cloudinary Image'}
                                      </div>
                                    </div>

                                    <div className='bg-white border border-slate-300 rounded-lg p-6 shadow-sm'>
                                      <div className='flex flex-col items-center space-y-4'>
                                        <div className='w-full max-w-md bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-4'>
                                          <img
                                            src={value}
                                            alt={`Digital signature for ${label}`}
                                            className='w-full h-auto max-h-32 object-contain'
                                            style={{
                                              imageRendering: 'crisp-edges',
                                            }}
                                            onError={e => {
                                              console.error(
                                                '❌ Failed to load signature image'
                                              );
                                              e.currentTarget.style.display =
                                                'none';
                                            }}
                                          />
                                        </div>

                                        <div className='text-center space-y-3'>
                                          <p className='text-slate-600 text-sm'>
                                            Digital signature captured on{' '}
                                            {formatDateTime(
                                              selectedSubmission?.submittedAt ||
                                                ''
                                            )}
                                          </p>

                                          <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                                            <Button
                                              size='sm'
                                              variant='outline'
                                              onClick={() => {
                                                try {
                                                  const link =
                                                    document.createElement('a');
                                                  link.href = value;
                                                  link.download = `signature-${
                                                    selectedSubmission?.id ||
                                                    'unknown'
                                                  }-${Date.now()}.png`;
                                                  if (
                                                    typeof value === 'string' &&
                                                    value.includes(
                                                      'cloudinary.com'
                                                    )
                                                  ) {
                                                    link.target = '_blank';
                                                    link.rel =
                                                      'noopener noreferrer';
                                                  }
                                                  document.body.appendChild(
                                                    link
                                                  );
                                                  link.click();
                                                  document.body.removeChild(
                                                    link
                                                  );
                                                } catch (error) {
                                                  console.error(
                                                    '❌ Error downloading signature:',
                                                    error
                                                  );
                                                  toast.error(
                                                    'Failed to download signature'
                                                  );
                                                }
                                              }}
                                              className='bg-white hover:bg-purple-50 border-purple-300 text-purple-700'
                                            >
                                              <Download className='w-4 h-4 mr-2' />
                                              Download Signature
                                            </Button>

                                            <Button
                                              size='sm'
                                              variant='outline'
                                              onClick={() => {
                                                const newWindow = window.open(
                                                  '',
                                                  '_blank'
                                                );
                                                if (newWindow) {
                                                  newWindow.document.write(`
                                                  <html>
                                                    <head>
                                                      <title>Digital Signature - ${label}</title>
                                                      <style>
                                                        body { margin: 0; padding: 20px; background: #f5f5f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: Arial, sans-serif; }
                                                        .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
                                                        img { max-width: 100%; height: auto; border: 2px solid #e5e5e5; border-radius: 4px; background: white; image-rendering: crisp-edges; -webkit-image-rendering: crisp-edges; -moz-image-rendering: crisp-edges; -ms-image-rendering: crisp-edges; }
                                                        h2 { color: #333; margin-bottom: 20px; }
                                                        .info { margin-top: 20px; color: #666; font-size: 14px; }
                                                      </style>
                                                    </head>
                                                    <body>
                                                      <div class="container">
                                                        <h2>${label}</h2>
                                                        <img src="${value}" alt="Digital Signature" />
                                                        <div class="info">
                                                          <p>Submitted: ${formatDateTime(
                                                            selectedSubmission?.submittedAt ||
                                                              ''
                                                          )}</p>
                                                          <p>Submission ID: ${
                                                            selectedSubmission?.id ||
                                                            'Unknown'
                                                          }</p>
                                                        </div>
                                                      </div>
                                                    </body>
                                                  </html>
                                                `);
                                                  newWindow.document.close();
                                                }
                                              }}
                                              className='bg-white hover:bg-blue-50 border-blue-300 text-blue-700'
                                            >
                                              <Eye className='w-4 h-4 mr-2' />
                                              View Full Size
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  // Regular Field Rendering
                                  renderFieldValue(fieldId, value)
                                )}
                              </div>
                            );
                          }
                        )}

                        {/* File Attachments */}
                        {selectedSubmission.files &&
                          Array.isArray(selectedSubmission.files) &&
                          selectedSubmission.files.length > 0 && (
                            <div className='bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 rounded-2xl border border-indigo-200 overflow-hidden'>
                              <div className='bg-white/70 backdrop-blur-sm border-b border-indigo-200 p-6'>
                                <div className='flex items-center justify-between'>
                                  <h4 className='font-bold text-indigo-800 text-lg flex items-center gap-3'>
                                    <div className='w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center'>
                                      <FileText className='w-4 h-4 text-white' />
                                    </div>
                                    File Attachments
                                  </h4>
                                  <div className='flex items-center gap-3'>
                                    <Badge
                                      variant='outline'
                                      className='bg-indigo-100 text-indigo-700 border-indigo-300 font-medium'
                                    >
                                      {selectedSubmission.files.length} file
                                      {selectedSubmission.files.length > 1
                                        ? 's'
                                        : ''}
                                    </Badge>
                                    <Badge
                                      variant='outline'
                                      className='bg-blue-100 text-blue-700 border-blue-300 font-medium'
                                    >
                                      {formatFileSize(
                                        selectedSubmission.files.reduce(
                                          (sum: number, file: any) =>
                                            sum + (file.size || 0),
                                          0
                                        )
                                      )}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              <div className='p-6 space-y-6'>
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
                                            file.publicId ||
                                            `temp_${Date.now()}`,
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
                                          className='bg-white rounded-xl border border-indigo-200 shadow-sm overflow-hidden'
                                        >
                                          <div className='border-b border-indigo-200 p-5'>
                                            <div className='flex items-center gap-3'>
                                              <div className='w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center'>
                                                {normalizedFiles.length > 0 &&
                                                  getFileTypeInfo(
                                                    normalizedFiles[0]
                                                      ?.mimeType || ''
                                                  ).icon &&
                                                  React.createElement(
                                                    getFileTypeInfo(
                                                      normalizedFiles[0]
                                                        ?.mimeType || ''
                                                    ).icon,
                                                    {
                                                      className: `w-4 h-4 text-${
                                                        getFileTypeInfo(
                                                          normalizedFiles[0]
                                                            ?.mimeType || ''
                                                        ).color
                                                      }-600`,
                                                    }
                                                  )}
                                              </div>
                                              <div className='flex-1'>
                                                <h5 className='font-semibold text-indigo-900 text-lg'>
                                                  {label}
                                                </h5>
                                                <p className='text-indigo-600 text-sm mt-1'>
                                                  {normalizedFiles.length} file
                                                  {normalizedFiles.length > 1
                                                    ? 's'
                                                    : ''}{' '}
                                                  •{' '}
                                                  {formatFileSize(
                                                    normalizedFiles.reduce(
                                                      (
                                                        sum: number,
                                                        file: any
                                                      ) =>
                                                        sum + (file.size || 0),
                                                      0
                                                    )
                                                  )}
                                                </p>
                                              </div>
                                            </div>
                                          </div>

                                          <div className='p-5'>
                                            <FileManager
                                              files={
                                                normalizedFiles.length === 1
                                                  ? normalizedFiles[0]
                                                  : normalizedFiles
                                              }
                                              fieldId={fieldId}
                                              submissionId={
                                                selectedSubmission!.id
                                              }
                                              onFileDelete={async file => {
                                                await handleDeleteFile(
                                                  file,
                                                  selectedSubmission!.id,
                                                  fieldId
                                                );
                                              }}
                                              onFileDownload={async file => {
                                                await handleDownloadFile(file);
                                              }}
                                              showActions={true}
                                              compact={true}
                                              readOnly={false}
                                              downloadingFileId={
                                                downloadingFileId
                                              }
                                              maxPreviewSize={10}
                                            />
                                          </div>
                                        </div>
                                      );
                                    }
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Evaluation Call-to-Action */}
                {isFeedbackForm &&
                  !evaluatingSubmissions.has(selectedSubmission.id) &&
                  !aiEvaluations[selectedSubmission.id] && (
                    <div className='bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 rounded-2xl border border-violet-200 overflow-hidden'>
                      <div className='bg-white/70 backdrop-blur-sm border-b border-violet-200 p-6'>
                        <div className='text-center'>
                          <div className='w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                            <Brain className='w-8 h-8 text-white' />
                          </div>
                          <h4 className='font-bold text-violet-800 text-xl mb-2'>
                            AI Analysis Available
                          </h4>
                          <p className='text-violet-600 text-base leading-relaxed max-w-md mx-auto'>
                            This {detectedFormType} form is ready for
                            comprehensive AI-powered analysis and insights
                          </p>
                        </div>
                      </div>
                      <div className='p-6 text-center'>
                        <Button
                          variant='outline'
                          onClick={() =>
                            evaluateSubmissionWithAI(selectedSubmission)
                          }
                          className='bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all font-semibold px-8 py-3 text-lg'
                        >
                          <Brain className='w-5 h-5 mr-3' />
                          Start AI Evaluation
                        </Button>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Delete Submission Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className='bg-white text-gray-900 w-[95vw] max-w-md mx-auto'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-red-600 font-bold flex items-center gap-2'>
              <AlertTriangle className='w-5 h-5' />
              Permanent Deletion Warning
            </AlertDialogTitle>
          </AlertDialogHeader>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-gray-700 px-6'
          >
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
                    <div className='border border-gray-200 p-4 md:p-6 sticky top-0 bg-white'>
                      <div className='text-sm'>
                        <p className='font-medium text-gray-900 break-words'>
                          Submission:{' '}
                          {formatDateTime(submission?.submittedAt || '')}
                        </p>
                        {submission && hasFullNameField && (
                          <p className='text-gray-600 mt-1 break-words'>
                            Submitter: {getFullNameFromSubmission(submission)}
                          </p>
                        )}
                        {submission && hasEmailField && (
                          <p className='text-gray-600 mt-1 break-words'>
                            Email: {getEmailFromSubmission(submission)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Files Warning */}
                    {fileCount > 0 && (
                      <div className='p-3 bg-yellow-50 rounded-md border border-yellow-200'>
                        <div className='flex items-center gap-2 text-yellow-800 mb-2'>
                          <AlertTriangle className='w-4 h-4 flex-shrink-0' />
                          <span className='font-medium'>
                            Files to be deleted:
                          </span>
                        </div>
                        <div className='text-sm text-yellow-700'>
                          {submission?.files
                            ?.slice(0, 3)
                            .map((file: any, index: number) => (
                              <div key={index} className='truncate'>
                                • {file.originalName}
                              </div>
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
                          <Brain className='w-4 h-4 flex-shrink-0' />
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
          </motion.div>

          <AlertDialogFooter className='flex-col sm:flex-row gap-2'>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false);
                setSubmissionToDelete(null);
              }}
              disabled={isDeletingSubmissions}
              className='w-full sm:w-auto border-gray-300 hover:bg-gray-50'
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
              className='w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white'
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

      {/* AI Evaluation Details Modal */}
      <Dialog
        open={showAIEvaluationModal}
        onOpenChange={setShowAIEvaluationModal}
      >
        <DialogContent
          className='w-[95vw] h-[90vh] max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-0'
          style={{
            width: '55vw',
            maxWidth: '95vw',
          }}
        >
          <div className='sticky top-0 z-10 bg-white'>
            <DialogHeader className='border-b border-gray-200 p-4 md:p-6 sticky top-0 bg-white'>
              <DialogTitle className='flex flex-col sm:flex-row sm:items-center gap-2 text-lg md:text-xl font-bold text-gray-900'>
                <div className='flex items-center gap-2'>
                  <Brain className='w-6 h-6 text-purple-600' />
                  AI Evaluation Results
                </div>
                {selectedEvaluation && (
                  <Badge
                    variant='secondary'
                    className={`w-fit ${
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
              <DialogDescription className='text-gray-600'>
                Comprehensive AI-powered analysis including sentiment
                evaluation, performance metrics, and actionable insights for
                this submission.
              </DialogDescription>
            </DialogHeader>
            {/* Custom positioned close button */}
            <DialogClose className='absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground'>
              <X className='h-4 w-4' />
              <span className='sr-only'>Close</span>
            </DialogClose>
          </div>

          {selectedEvaluation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='space-y-6 p-4 md:p-6'
            >
              {/* Quiz Results */}
              {selectedEvaluation.formType === 'quiz' &&
                selectedEvaluation.quizResults && (
                  <motion.div
                    variants={staggerContainer}
                    initial='initial'
                    animate='animate'
                    className='space-y-6'
                  >
                    {/* Enhanced Quiz Summary */}
                    <motion.div
                      variants={fadeInUp}
                      className='bg-gradient-to-r from-blue-50 to-indigo-50 p-4 md:p-6 rounded-lg border border-blue-200'
                    >
                      <h3 className='text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2'>
                        <Star className='w-5 h-5' />
                        Quiz Performance Summary
                      </h3>
                      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6'>
                        <div className='text-center'>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className='text-3xl md:text-4xl font-bold text-blue-600 mb-2'
                          >
                            {selectedEvaluation.quizResults.percentage}%
                          </motion.div>
                          <div className='text-xs md:text-sm text-gray-600 font-medium'>
                            Overall Score
                          </div>
                        </div>
                        <div className='text-center'>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className='text-3xl md:text-4xl font-bold text-green-600 mb-2'
                          >
                            {selectedEvaluation.quizResults.correctAnswers}
                          </motion.div>
                          <div className='text-xs md:text-sm text-gray-600 font-medium'>
                            Correct Answers
                          </div>
                        </div>
                        <div className='text-center'>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className='text-3xl md:text-4xl font-bold text-red-600 mb-2'
                          >
                            {selectedEvaluation.quizResults.totalQuestions -
                              selectedEvaluation.quizResults.correctAnswers}
                          </motion.div>
                          <div className='text-xs md:text-sm text-gray-600 font-medium'>
                            Incorrect Answers
                          </div>
                        </div>
                        <div className='text-center'>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className='text-3xl md:text-4xl font-bold text-gray-600 mb-2'
                          >
                            {selectedEvaluation.quizResults.totalQuestions}
                          </motion.div>
                          <div className='text-xs md:text-sm text-gray-600 font-medium'>
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
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${selectedEvaluation.quizResults.percentage}%`,
                            }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className={`h-3 rounded-full ${
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
                          />
                        </div>
                      </div>
                    </motion.div>

                    {/* Question-by-Question Analysis */}
                    <motion.div
                      variants={fadeInUp}
                      className='bg-white border border-gray-200 rounded-lg p-4 md:p-6'
                    >
                      <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                        <FileText className='w-5 h-5' />
                        Detailed Question Analysis
                      </h3>
                      <div className='space-y-4'>
                        {selectedEvaluation.quizResults.explanations.map(
                          (explanation, index) => (
                            <motion.div
                              key={explanation.questionId}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={`p-4 md:p-5 rounded-lg border-l-4 ${
                                explanation.isCorrect
                                  ? 'border-l-green-500 bg-green-50'
                                  : 'border-l-red-500 bg-red-50'
                              }`}
                            >
                              <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3'>
                                <h4 className='font-medium text-gray-900 flex-1 break-words'>
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
                                  className={`flex-shrink-0 ${
                                    explanation.isCorrect
                                      ? 'bg-green-100 text-green-800 border-green-200'
                                      : 'bg-red-100 text-red-800 border-red-200'
                                  }`}
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
                                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                                  <div>
                                    <span className='font-medium text-gray-700 block mb-1'>
                                      Your Answer:
                                    </span>
                                    <div
                                      className={`p-3 rounded border break-words ${
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
                                      <span className='font-medium text-gray-700 block mb-1'>
                                        Correct Answer:
                                      </span>
                                      <div className='p-3 bg-green-100 border border-green-200 text-green-800 rounded break-words'>
                                        {explanation.correctAnswer}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className='mt-4 p-4 bg-white rounded-lg border'>
                                  <span className='font-medium text-gray-700 flex items-center gap-2 mb-2'>
                                    <FileText className='w-4 h-4' />
                                    Explanation:
                                  </span>
                                  <p className='text-gray-900 leading-relaxed break-words'>
                                    {explanation.explanation}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                )}

              {/* Enhanced Survey Results */}
              {selectedEvaluation.formType === 'survey' &&
                selectedEvaluation.surveyResults && (
                  <motion.div
                    variants={staggerContainer}
                    initial='initial'
                    animate='animate'
                    className='space-y-6'
                  >
                    {/* Sentiment Overview */}
                    <motion.div
                      variants={fadeInUp}
                      className='bg-gradient-to-r from-green-50 to-emerald-50 p-4 md:p-6 rounded-lg border border-green-200'
                    >
                      <h3 className='text-lg font-semibold text-green-900 mb-4 flex items-center gap-2'>
                        <Brain className='w-5 h-5' />
                        Sentiment Analysis Overview
                      </h3>
                      <div className='grid grid-cols-3 gap-4 md:gap-6 mb-6'>
                        <div className='text-center'>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className='text-3xl md:text-4xl font-bold text-green-600 mb-2'
                          >
                            {
                              selectedEvaluation.surveyResults.overallSentiment
                                .positive
                            }
                            %
                          </motion.div>
                          <div className='text-xs md:text-sm text-gray-600 font-medium'>
                            Positive
                          </div>
                        </div>
                        <div className='text-center'>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className='text-3xl md:text-4xl font-bold text-yellow-600 mb-2'
                          >
                            {
                              selectedEvaluation.surveyResults.overallSentiment
                                .neutral
                            }
                            %
                          </motion.div>
                          <div className='text-xs md:text-sm text-gray-600 font-medium'>
                            Neutral
                          </div>
                        </div>
                        <div className='text-center'>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className='text-3xl md:text-4xl font-bold text-red-600 mb-2'
                          >
                            {
                              selectedEvaluation.surveyResults.overallSentiment
                                .negative
                            }
                            %
                          </motion.div>
                          <div className='text-xs md:text-sm text-gray-600 font-medium'>
                            Negative
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Visual Sentiment Bar */}
                      <div className='space-y-3'>
                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm font-medium gap-2'>
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
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${selectedEvaluation.surveyResults.overallSentiment.positive}%`,
                              }}
                              transition={{ duration: 0.7, delay: 0.3 }}
                              className='bg-green-500'
                              title={`${selectedEvaluation.surveyResults.overallSentiment.positive}% Positive`}
                            />
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${selectedEvaluation.surveyResults.overallSentiment.neutral}%`,
                              }}
                              transition={{ duration: 0.7, delay: 0.5 }}
                              className='bg-yellow-500'
                              title={`${selectedEvaluation.surveyResults.overallSentiment.neutral}% Neutral`}
                            />
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${selectedEvaluation.surveyResults.overallSentiment.negative}%`,
                              }}
                              transition={{ duration: 0.7, delay: 0.7 }}
                              className='bg-red-500'
                              title={`${selectedEvaluation.surveyResults.overallSentiment.negative}% Negative`}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Enhanced Key Metrics */}
                    <motion.div
                      variants={fadeInUp}
                      className='bg-white border border-gray-200 rounded-lg p-4 md:p-6'
                    >
                      <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                        <Star className='w-5 h-5' />
                        Key Performance Metrics
                      </h3>
                      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6'>
                        {selectedEvaluation.surveyResults.keyMetrics.map(
                          (metric, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className='p-4 md:p-5 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-gray-200'
                            >
                              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3'>
                                <h4 className='font-medium text-gray-900 break-words'>
                                  {metric.metric}
                                </h4>
                                <Badge
                                  variant='secondary'
                                  className={`w-fit ${
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
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.1 + 0.3 }}
                                className='text-2xl md:text-3xl font-bold text-blue-600 mb-2'
                              >
                                {metric.value}
                                {metric.metric
                                  .toLowerCase()
                                  .includes('score') ||
                                metric.metric.toLowerCase().includes('quality')
                                  ? '/100'
                                  : ''}
                              </motion.div>
                              <div className='w-full bg-gray-200 rounded-full h-2'>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{
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
                                  transition={{
                                    duration: 0.5,
                                    delay: index * 0.1 + 0.5,
                                  }}
                                  className={`h-2 rounded-full ${
                                    metric.trend === 'up'
                                      ? 'bg-green-500'
                                      : metric.trend === 'down'
                                      ? 'bg-red-500'
                                      : 'bg-yellow-500'
                                  }`}
                                />
                              </div>
                            </motion.div>
                          )
                        )}
                      </div>
                    </motion.div>

                    {/* Enhanced Insights */}
                    <motion.div
                      variants={fadeInUp}
                      className='bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6'
                    >
                      <h3 className='text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2'>
                        <AlertCircle className='w-5 h-5' />
                        Key Insights & Recommendations
                      </h3>
                      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                        {selectedEvaluation.surveyResults.insights.map(
                          (insight, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className='flex items-start gap-3 p-4 bg-white rounded-lg border border-blue-200'
                            >
                              <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                                <span className='text-blue-600 text-sm font-bold'>
                                  {index + 1}
                                </span>
                              </div>
                              <div className='flex-1 min-w-0'>
                                <p className='text-gray-900 leading-relaxed break-words'>
                                  {insight}
                                </p>
                              </div>
                            </motion.div>
                          )
                        )}
                      </div>
                    </motion.div>

                    {/* Response Quality Indicator */}
                    <motion.div
                      variants={fadeInUp}
                      className='bg-white border border-gray-200 rounded-lg p-4 md:p-6'
                    >
                      <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                        <CheckCircle className='w-5 h-5' />
                        Response Quality Assessment
                      </h3>
                      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3'>
                        <span className='text-gray-700 font-medium'>
                          Overall Quality Score
                        </span>
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3 }}
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
                        </motion.span>
                      </div>
                      <div className='w-full bg-gray-200 rounded-full h-4'>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${selectedEvaluation.surveyResults.responseQuality}%`,
                          }}
                          transition={{ duration: 0.5, delay: 0.5 }}
                          className={`h-4 rounded-full ${
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
                        />
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
                    </motion.div>
                  </motion.div>
                )}

              {/* Enhanced Feedback Results */}
              {selectedEvaluation.formType === 'feedback' &&
                selectedEvaluation.feedbackResults && (
                  <motion.div
                    variants={staggerContainer}
                    initial='initial'
                    animate='animate'
                    className='space-y-6'
                  >
                    {/* Sentiment Analysis with Priority */}
                    <motion.div
                      variants={fadeInUp}
                      className='bg-gradient-to-r from-orange-50 to-red-50 p-4 md:p-6 rounded-lg border border-orange-200'
                    >
                      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4'>
                        <h3 className='text-lg font-semibold text-orange-900 flex items-center gap-2'>
                          <Brain className='w-5 h-5' />
                          Feedback Sentiment Analysis
                        </h3>
                        <Badge
                          variant='destructive'
                          className={`w-fit ${
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

                      <div className='grid grid-cols-3 gap-4 md:gap-6 mb-6'>
                        <div className='text-center'>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className='text-3xl md:text-4xl font-bold text-green-600 mb-2'
                          >
                            {
                              selectedEvaluation.feedbackResults
                                .sentimentBreakdown.positive
                            }
                            %
                          </motion.div>
                          <div className='text-xs md:text-sm text-gray-600 font-medium'>
                            Positive
                          </div>
                        </div>
                        <div className='text-center'>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className='text-3xl md:text-4xl font-bold text-yellow-600 mb-2'
                          >
                            {
                              selectedEvaluation.feedbackResults
                                .sentimentBreakdown.neutral
                            }
                            %
                          </motion.div>
                          <div className='text-xs md:text-sm text-gray-600 font-medium'>
                            Neutral
                          </div>
                        </div>
                        <div className='text-center'>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className='text-3xl md:text-4xl font-bold text-red-600 mb-2'
                          >
                            {
                              selectedEvaluation.feedbackResults
                                .sentimentBreakdown.negative
                            }
                            %
                          </motion.div>
                          <div className='text-xs md:text-sm text-gray-600 font-medium'>
                            Negative
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Visual Sentiment Bar */}
                      <div className='space-y-3'>
                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm font-medium gap-2'>
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
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${selectedEvaluation.feedbackResults.sentimentBreakdown.positive}%`,
                              }}
                              transition={{ duration: 0.7, delay: 0.3 }}
                              className='bg-green-500'
                            />
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${selectedEvaluation.feedbackResults.sentimentBreakdown.neutral}%`,
                              }}
                              transition={{ duration: 0.7, delay: 0.5 }}
                              className='bg-yellow-500'
                            />
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${selectedEvaluation.feedbackResults.sentimentBreakdown.negative}%`,
                              }}
                              transition={{ duration: 0.7, delay: 0.7 }}
                              className='bg-red-500'
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Enhanced Critical Themes */}
                    <motion.div
                      variants={fadeInUp}
                      className='bg-white border border-gray-200 rounded-lg p-4 md:p-6'
                    >
                      <h3 className='text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2'>
                        <AlertTriangle className='w-5 h-5' />
                        Critical Themes Analysis
                      </h3>
                      <div className='space-y-5'>
                        {selectedEvaluation.feedbackResults.criticalThemes.map(
                          (theme, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={`p-4 md:p-5 rounded-lg border-l-4 ${
                                theme.severity === 'high'
                                  ? 'border-l-red-500 bg-red-50'
                                  : theme.severity === 'medium'
                                  ? 'border-l-yellow-500 bg-yellow-50'
                                  : 'border-l-green-500 bg-green-50'
                              }`}
                            >
                              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3'>
                                <h4 className='font-medium text-gray-900 text-base md:text-lg break-words'>
                                  {theme.theme}
                                </h4>
                                <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3'>
                                  <Badge
                                    variant='secondary'
                                    className={`w-fit ${
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
                                <div className='grid grid-cols-1 lg:grid-cols-2 gap-3'>
                                  {theme.examples
                                    .slice(0, 4)
                                    .map((example, exampleIndex) => (
                                      <div
                                        key={exampleIndex}
                                        className='bg-white p-3 rounded border text-sm text-gray-800 leading-relaxed break-words'
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
                            </motion.div>
                          )
                        )}
                      </div>
                    </motion.div>

                    {/* Enhanced Actionable Insights */}
                    <motion.div
                      variants={fadeInUp}
                      className='bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6'
                    >
                      <h3 className='text-lg font-semibold text-blue-900 mb-6 flex items-center gap-2'>
                        <CheckCircle className='w-5 h-5' />
                        Actionable Insights & Recommendations
                      </h3>
                      <div className='space-y-4'>
                        {selectedEvaluation.feedbackResults.actionableInsights.map(
                          (insight, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className='flex items-start gap-4 p-4 md:p-5 bg-white rounded-lg border border-blue-200 shadow-sm'
                            >
                              <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                                <span className='text-blue-600 text-sm font-bold'>
                                  {index + 1}
                                </span>
                              </div>
                              <div className='flex-1 min-w-0'>
                                <p className='text-gray-900 leading-relaxed font-medium break-words'>
                                  {insight}
                                </p>
                                <div className='mt-2 flex flex-wrap items-center gap-2'>
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
                            </motion.div>
                          )
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                )}

              {selectedEvaluation.formType === 'application' &&
                selectedEvaluation.applicationResults && (
                  <motion.div
                    variants={staggerContainer}
                    initial='initial'
                    animate='animate'
                    className='space-y-6'
                  >
                    {/* Application Summary */}
                    <motion.div
                      variants={fadeInUp}
                      className='bg-gradient-to-r from-purple-50 to-indigo-50 p-4 md:p-6 rounded-lg border border-purple-200'
                    >
                      <h3 className='text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2'>
                        <Briefcase className='w-5 h-5' />
                        Application Evaluation Summary
                      </h3>

                      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6'>
                        <div className='text-center'>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className='text-3xl md:text-4xl font-bold text-purple-600 mb-2'
                          >
                            {selectedEvaluation.applicationResults.overallScore}
                            %
                          </motion.div>
                          <div className='text-xs md:text-sm text-gray-600 font-medium'>
                            Overall Score
                          </div>
                        </div>

                        <div className='text-center'>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className='text-3xl md:text-4xl font-bold text-blue-600 mb-2'
                          >
                            {
                              selectedEvaluation.applicationResults
                                .fieldCompletion.completionPercentage
                            }
                            %
                          </motion.div>
                          <div className='text-xs md:text-sm text-gray-600 font-medium'>
                            Field Completion
                          </div>
                        </div>

                        <div className='text-center'>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className='text-3xl md:text-4xl font-bold text-green-600 mb-2'
                          >
                            {
                              selectedEvaluation.applicationResults
                                .qualificationMatching.overallMatch
                            }
                            %
                          </motion.div>
                          <div className='text-xs md:text-sm text-gray-600 font-medium'>
                            Qualification Match
                          </div>
                        </div>

                        <div className='text-center'>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className='text-3xl md:text-4xl font-bold text-orange-600 mb-2'
                          >
                            {
                              selectedEvaluation.applicationResults
                                .keywordAnalysis.keywordScore
                            }
                            %
                          </motion.div>
                          <div className='text-xs md:text-sm text-gray-600 font-medium'>
                            Keyword Match
                          </div>
                        </div>
                      </div>

                      {/* Application Strength Indicator */}
                      <div className='mt-6 p-4 bg-white rounded-lg'>
                        <div className='flex items-center justify-between mb-2'>
                          <span className='text-sm font-medium text-gray-700'>
                            Application Strength
                          </span>
                          <span
                            className={`text-sm font-bold ${
                              selectedEvaluation.applicationResults
                                .applicationStrength === 'excellent'
                                ? 'text-green-600'
                                : selectedEvaluation.applicationResults
                                    .applicationStrength === 'strong'
                                ? 'text-blue-600'
                                : selectedEvaluation.applicationResults
                                    .applicationStrength === 'moderate'
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {selectedEvaluation.applicationResults.applicationStrength
                              .charAt(0)
                              .toUpperCase() +
                              selectedEvaluation.applicationResults.applicationStrength.slice(
                                1
                              )}{' '}
                            Candidate
                          </span>
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-3'>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${selectedEvaluation.applicationResults.overallScore}%`,
                            }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className={`h-3 rounded-full ${
                              selectedEvaluation.applicationResults
                                .applicationStrength === 'excellent'
                                ? 'bg-green-500'
                                : selectedEvaluation.applicationResults
                                    .applicationStrength === 'strong'
                                ? 'bg-blue-500'
                                : selectedEvaluation.applicationResults
                                    .applicationStrength === 'moderate'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                          />
                        </div>

                        {/* Recommendation */}
                        <div className='mt-4 flex items-center justify-between'>
                          <span className='text-sm font-medium text-gray-700'>
                            Recommendation:
                          </span>
                          <Badge
                            variant='outline'
                            className={`${
                              selectedEvaluation.applicationResults
                                .recommendedAction === 'hire'
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : selectedEvaluation.applicationResults
                                    .recommendedAction === 'interview'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : selectedEvaluation.applicationResults
                                    .recommendedAction === 'consider'
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                : 'bg-red-100 text-red-800 border-red-200'
                            }`}
                          >
                            {selectedEvaluation.applicationResults
                              .recommendedAction === 'hire' && ' '}
                            {selectedEvaluation.applicationResults
                              .recommendedAction === 'interview' && '🤝 '}
                            {selectedEvaluation.applicationResults
                              .recommendedAction === 'consider' && '🤔 '}
                            {selectedEvaluation.applicationResults
                              .recommendedAction === 'reject' && '❌ '}
                            {selectedEvaluation.applicationResults.recommendedAction
                              .charAt(0)
                              .toUpperCase() +
                              selectedEvaluation.applicationResults.recommendedAction.slice(
                                1
                              )}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>

                    {/* Score Breakdown */}
                    <motion.div
                      variants={fadeInUp}
                      className='bg-white border border-gray-200 rounded-lg p-4 md:p-6'
                    >
                      <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                        <Target className='w-5 h-5' />
                        Detailed Score Breakdown
                      </h3>
                      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6'>
                        {[
                          {
                            label: 'Personal Info',
                            score:
                              selectedEvaluation.applicationResults
                                .scoreBreakdown.personalInfo,
                            maxScore: 20,
                            color: 'blue',
                            icon: <User className='w-4 h-4' />,
                          },
                          {
                            label: 'Experience',
                            score:
                              selectedEvaluation.applicationResults
                                .scoreBreakdown.experience,
                            maxScore: 30,
                            color: 'green',
                            icon: <Briefcase className='w-4 h-4' />,
                          },
                          {
                            label: 'Education',
                            score:
                              selectedEvaluation.applicationResults
                                .scoreBreakdown.education,
                            maxScore: 20,
                            color: 'purple',
                            icon: <GraduationCap className='w-4 h-4' />,
                          },
                          {
                            label: 'Skills',
                            score:
                              selectedEvaluation.applicationResults
                                .scoreBreakdown.skills,
                            maxScore: 20,
                            color: 'orange',
                            icon: <Award className='w-4 h-4' />,
                          },
                          {
                            label: 'Additional',
                            score:
                              selectedEvaluation.applicationResults
                                .scoreBreakdown.additional,
                            maxScore: 10,
                            color: 'indigo',
                            icon: <Star className='w-4 h-4' />,
                          },
                        ].map((item, index) => (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-4 md:p-5 bg-gradient-to-br from-${item.color}-50 to-${item.color}-100 rounded-lg border border-${item.color}-200`}
                          >
                            <div className='flex items-center justify-between mb-3'>
                              <div className='flex items-center gap-2'>
                                {item.icon}
                                <h4 className='font-medium text-gray-900'>
                                  {item.label}
                                </h4>
                              </div>
                              <span
                                className={`text-lg font-bold text-${item.color}-600`}
                              >
                                {item.score}/{item.maxScore}
                              </span>
                            </div>
                            <div className='w-full bg-gray-200 rounded-full h-2'>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${
                                    (item.score / item.maxScore) * 100
                                  }%`,
                                }}
                                transition={{
                                  duration: 0.5,
                                  delay: index * 0.1 + 0.3,
                                }}
                                className={`h-2 rounded-full bg-${item.color}-500`}
                              />
                            </div>
                            <div className='mt-2 text-xs text-gray-600'>
                              {Math.round((item.score / item.maxScore) * 100)}%
                              of maximum
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Qualification Matching */}
                    <motion.div
                      variants={fadeInUp}
                      className='bg-white border border-gray-200 rounded-lg p-4 md:p-6'
                    >
                      <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                        <UserCheck className='w-5 h-5' />
                        Qualification Assessment
                      </h3>

                      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                        {/* Qualification Scores */}
                        <div>
                          <h4 className='font-medium text-gray-800 mb-3'>
                            Qualification Scores
                          </h4>
                          <div className='space-y-3'>
                            {[
                              {
                                label: 'Experience Match',
                                score:
                                  selectedEvaluation.applicationResults
                                    .qualificationMatching.experienceScore,
                                icon: <Briefcase className='w-4 h-4' />,
                              },
                              {
                                label: 'Education Match',
                                score:
                                  selectedEvaluation.applicationResults
                                    .qualificationMatching.educationScore,
                                icon: <GraduationCap className='w-4 h-4' />,
                              },
                              {
                                label: 'Skills Match',
                                score:
                                  selectedEvaluation.applicationResults
                                    .qualificationMatching.skillsScore,
                                icon: <Award className='w-4 h-4' />,
                              },
                              {
                                label: 'Certifications Match',
                                score:
                                  selectedEvaluation.applicationResults
                                    .qualificationMatching.certificationsScore,
                                icon: <Award className='w-4 h-4' />,
                              },
                            ].map((qual, index) => (
                              <div
                                key={qual.label}
                                className='flex items-center gap-3'
                              >
                                <div className='text-blue-600'>{qual.icon}</div>
                                <div className='flex-1'>
                                  <div className='flex items-center justify-between mb-1'>
                                    <span className='text-sm font-medium text-gray-700'>
                                      {qual.label}
                                    </span>
                                    <span className='text-sm font-bold text-gray-900'>
                                      {qual.score}%
                                    </span>
                                  </div>
                                  <div className='w-full bg-gray-200 rounded-full h-2'>
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${qual.score}%` }}
                                      transition={{
                                        duration: 0.5,
                                        delay: index * 0.1,
                                      }}
                                      className={`h-2 rounded-full ${
                                        qual.score >= 80
                                          ? 'bg-green-500'
                                          : qual.score >= 60
                                          ? 'bg-blue-500'
                                          : qual.score >= 40
                                          ? 'bg-yellow-500'
                                          : 'bg-red-500'
                                      }`}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Strengths and Gaps */}
                        <div className='space-y-4'>
                          {/* Strengths */}
                          <div>
                            <h4 className='font-medium text-green-800 mb-2 flex items-center gap-2'>
                              <CheckCircle className='w-4 h-4' />
                              Key Strengths
                            </h4>
                            <div className='space-y-2'>
                              {selectedEvaluation.applicationResults.qualificationMatching.strengths.map(
                                (strength, index) => (
                                  <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className='flex items-start gap-2 p-2 bg-green-50 rounded border border-green-200'
                                  >
                                    <span className='text-green-600 mt-0.5'>
                                      ✓
                                    </span>
                                    <span className='text-sm text-green-800 break-words'>
                                      {strength}
                                    </span>
                                  </motion.div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Keyword Analysis */}
                    <motion.div
                      variants={fadeInUp}
                      className='bg-white border border-gray-200 rounded-+lg p-4 md:p-6'
                    >
                      <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                        <Hash className='w-5 h-5' />
                        Keyword Analysis
                      </h3>

                      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                        {/* Relevant Keywords */}
                        <div>
                          <h4 className='font-medium text-gray-800 mb-3'>
                            Relevant Keywords Found (
                            {
                              selectedEvaluation.applicationResults
                                .keywordAnalysis.relevantKeywords.length
                            }
                            )
                          </h4>
                          <div className='space-y-2 max-h-60 overflow-y-auto'>
                            {selectedEvaluation.applicationResults.keywordAnalysis.relevantKeywords.map(
                              (keyword, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: index * 0.05 }}
                                  className='flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200'
                                >
                                  <div className='flex items-center gap-2'>
                                    <Badge
                                      variant='outline'
                                      className={`text-xs ${
                                        keyword.category === 'skill'
                                          ? 'bg-green-100 text-green-800 border-green-200'
                                          : keyword.category === 'technology'
                                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                                          : keyword.category === 'certification'
                                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                                          : 'bg-orange-100 text-orange-800 border-orange-200'
                                      }`}
                                    >
                                      {keyword.category}
                                    </Badge>
                                    <span className='text-sm font-medium text-gray-900'>
                                      {keyword.keyword}
                                    </span>
                                  </div>
                                  <div className='flex items-center gap-1 text-xs text-gray-600'>
                                    <span>×{keyword.frequency}</span>
                                    <span className='mx-1'>•</span>
                                    <span>W:{keyword.weight}</span>
                                  </div>
                                </motion.div>
                              )
                            )}
                            {selectedEvaluation.applicationResults
                              .keywordAnalysis.relevantKeywords.length ===
                              0 && (
                              <div className='p-4 bg-gray-50 rounded border border-gray-200 text-center'>
                                <span className='text-sm text-gray-600'>
                                  No relevant keywords found
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Missing Keywords */}
                        <div>
                          <h4 className='font-medium text-gray-800 mb-3'>
                            Recommended Keywords (
                            {
                              selectedEvaluation.applicationResults
                                .keywordAnalysis.missingKeywords.length
                            }
                            )
                          </h4>
                          {selectedEvaluation.applicationResults.keywordAnalysis
                            .missingKeywords.length > 0 ? (
                            <div className='space-y-2 max-h-60 overflow-y-auto'>
                              {selectedEvaluation.applicationResults.keywordAnalysis.missingKeywords.map(
                                (keyword, index) => (
                                  <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className='p-2 bg-gray-50 rounded border border-gray-200'
                                  >
                                    <span className='text-sm text-gray-700'>
                                      {keyword}
                                    </span>
                                  </motion.div>
                                )
                              )}
                            </div>
                          ) : (
                            <div className='p-4 bg-green-50 rounded border border-green-200 text-center'>
                              <span className='text-sm text-green-700'>
                                All recommended keywords found in application
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Keyword Score */}
                      <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
                        <div className='flex items-center justify-between mb-2'>
                          <span className='text-sm font-medium text-gray-700'>
                            Keyword Match Score
                          </span>
                          <span className='text-lg font-bold text-blue-600'>
                            {
                              selectedEvaluation.applicationResults
                                .keywordAnalysis.keywordScore
                            }
                            %
                          </span>
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-3'>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${selectedEvaluation.applicationResults.keywordAnalysis.keywordScore}%`,
                            }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className={`h-3 rounded-full ${
                              selectedEvaluation.applicationResults
                                .keywordAnalysis.keywordScore >= 80
                                ? 'bg-green-500'
                                : selectedEvaluation.applicationResults
                                    .keywordAnalysis.keywordScore >= 60
                                ? 'bg-blue-500'
                                : selectedEvaluation.applicationResults
                                    .keywordAnalysis.keywordScore >= 40
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                          />
                        </div>
                      </div>
                    </motion.div>
                    {/* AI Recommendations */}
                    <motion.div
                      variants={fadeInUp}
                      className='bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6'
                    >
                      <h3 className='text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2'>
                        <Brain className='w-5 h-5' />
                        AI Recommendations & Next Steps
                      </h3>
                      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                        {selectedEvaluation.applicationResults.aiRecommendations.map(
                          (recommendation, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className='flex items-start gap-3 p-4 bg-white rounded-lg border border-blue-200'
                            >
                              <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                                <span className='text-blue-600 text-sm font-bold'>
                                  {index + 1}
                                </span>
                              </div>
                              <div className='flex-1 min-w-0'>
                                <p className='text-gray-900 leading-relaxed font-medium break-words'>
                                  {recommendation}
                                </p>
                              </div>
                            </motion.div>
                          )
                        )}
                      </div>
                    </motion.div>

                    {/* Field Completion Details */}
                    <motion.div
                      variants={fadeInUp}
                      className='bg-white border border-gray-200 rounded-lg p-4 md:p-6'
                    >
                      <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                        <CheckCircle className='w-5 h-5' />
                        Application Completeness
                      </h3>

                      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                        <div className='lg:col-span-2'>
                          <div className='flex items-center justify-between mb-4'>
                            <span className='text-sm font-medium text-gray-700'>
                              Field Completion Rate
                            </span>
                            <span className='text-lg font-bold text-blue-600'>
                              {
                                selectedEvaluation.applicationResults
                                  .fieldCompletion.completedFields
                              }
                              /
                              {
                                selectedEvaluation.applicationResults
                                  .fieldCompletion.totalFields
                              }{' '}
                              fields
                            </span>
                          </div>
                          <div className='w-full bg-gray-200 rounded-full h-4 mb-4'>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${selectedEvaluation.applicationResults.fieldCompletion.completionPercentage}%`,
                              }}
                              transition={{ duration: 0.5, delay: 0.3 }}
                              className='h-4 rounded-full bg-blue-500'
                            />
                          </div>

                          {/* Missing Fields */}
                          {selectedEvaluation.applicationResults.fieldCompletion
                            .missingFields.length > 0 && (
                            <div className='mt-4'>
                              <h4 className='font-medium text-orange-800 mb-2'>
                                Missing Fields
                              </h4>
                              <div className='space-y-1'>
                                {selectedEvaluation.applicationResults.fieldCompletion.missingFields.map(
                                  (field, index) => (
                                    <div
                                      key={index}
                                      className='text-sm text-orange-700 bg-orange-50 px-2 py-1 rounded'
                                    >
                                      • {field}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Critical Missing */}
                        <div>
                          {selectedEvaluation.applicationResults.fieldCompletion
                            .criticalMissing.length > 0 ? (
                            <div>
                              <h4 className='font-medium text-red-800 mb-2'>
                                ❌ Critical Missing
                              </h4>
                              <div className='space-y-2'>
                                {selectedEvaluation.applicationResults.fieldCompletion.criticalMissing.map(
                                  (field, index) => (
                                    <div
                                      key={index}
                                      className='text-sm text-red-700 bg-red-50 px-3 py-2 rounded border border-red-200'
                                    >
                                      {field}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className='p-4 bg-green-50 rounded border border-green-200 text-center'>
                              <span className='text-sm text-green-700'>
                                All critical fields completed
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

              {/* General Form Results */}
              {selectedEvaluation.formType === 'general' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='bg-gray-50 border border-gray-200 rounded-lg p-4 md:p-6'
                >
                  <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                    <FileText className='w-5 h-5' />
                    General Analysis
                  </h3>
                  <div className='p-4 bg-white rounded border'>
                    <p className='text-gray-700 leading-relaxed break-words'>
                      {selectedEvaluation.feedback}
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
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
