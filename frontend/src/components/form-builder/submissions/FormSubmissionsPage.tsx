// src/components/form-builder/submissions/FormSubmissionsPage.tsx
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
  Briefcase, // For work experience
  GraduationCap, // For education
  Award, // For skills/certifications
  Target, // For scoring
  UserCheck,
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

        console.log(
          `📋 FIXED: Analyzing field: "${fieldLabel}" (${fieldType})`
        );

        // 🎯 QUIZ DETECTION: Single choice questions with correct answers (HIGHEST PRIORITY)
        if (fieldType === 'singlechoice' || fieldType === 'dropdown') {
          result.singleChoiceCount++;

          // 🚨 CRITICAL: Check for correctAnswer property (PRIMARY quiz indicator)
          if (
            field.correctAnswer ||
            (field.options && field.options.some((opt: any) => opt.isCorrect))
          ) {
            hasCorrectAnswers = true;
            console.log(
              `🎯 QUIZ INDICATOR: correctAnswer found in "${fieldLabel}"`
            );
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
                console.log(
                  `📊 SURVEY INDICATOR: Rating options in single choice "${fieldLabel}" (NOT QUIZ)`
                );
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
            console.log(
              `🎯 QUIZ INDICATOR: correct answers in multiple choice "${fieldLabel}"`
            );
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
                console.log(
                  `📊 SURVEY INDICATOR: Rating options in multiple choice "${fieldLabel}"`
                );
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
            console.log(
              `📄 APPLICATION INDICATOR: File upload field "${fieldLabel}"`
            );
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
            console.log(
              `👤 APPLICATION INDICATOR: Personal info field "${fieldLabel}"`
            );
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
          console.log(
            `💼 APPLICATION INDICATOR: Work experience field "${fieldLabel}"`
          );
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
          console.log(
            `🎓 APPLICATION INDICATOR: Education field "${fieldLabel}"`
          );
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
          console.log(
            `🛠️ APPLICATION INDICATOR: Skills/other field "${fieldLabel}"`
          );
        }

        // 🎯 SURVEY DETECTION: Rating/scale fields
        if (
          fieldType === 'rating' ||
          fieldType === 'scale' ||
          fieldType === 'slider'
        ) {
          ratingFields++;
          hasRatingScales++;
          hasSurveyPatterns = true;
          console.log(
            `📊 SURVEY INDICATOR: ${fieldType} field "${fieldLabel}"`
          );
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
          console.log(
            `📊 SURVEY PATTERN: rating pattern in label "${fieldLabel}"`
          );
        }

        // 🎯 FEEDBACK DETECTION: Text fields with feedback patterns
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
            console.log(
              `💬 FEEDBACK PATTERN: feedback pattern in label "${fieldLabel}"`
            );
          }

          // Experience-specific patterns
          if (
            /experience|how.*was|describe.*your|tell.*us.*about|thoughts.*on.*your|what.*did.*you.*think.*about/i.test(
              fieldLabel
            )
          ) {
            experienceFields++;
            hasFeedbackPatterns = true;
            console.log(
              `💬 EXPERIENCE PATTERN: experience pattern in label "${fieldLabel}"`
            );
          }

          // APPLICATION-SPECIFIC TEXT PATTERNS
          else if (
            /describe.*yourself|tell.*us.*about|why.*do.*you.*want|what.*makes.*you|your.*experience.*with|goals|objectives|achievements|cover.*letter.*text|additional.*information|anything.*else/i.test(
              fieldLabel
            )
          ) {
            applicationFields++;
            hasApplicationPatterns = true;
            console.log(
              `📄 APPLICATION PATTERN: application text pattern in label "${fieldLabel}"`
            );
          }

          // SURVEY-SPECIFIC TEXT PATTERNS (Research/data collection focused)
          else if (
            /how.*would.*you.*rate|how.*important.*is|rank.*the.*following|what.*is.*your.*preference|demographic|background.*information|research.*purposes|study.*participation|please.*evaluate|additional.*comments.*for.*research|other.*comments.*for.*study/i.test(
              fieldLabel
            )
          ) {
            surveyFields++;
            hasSurveyPatterns = true;
            console.log(
              `📊 SURVEY PATTERN: survey research pattern in label "${fieldLabel}"`
            );
          }
        }
      });
    }
  });

  // 🎯 PRIORITY 1: QUIZ DETECTION (Highest Priority)
  // Must have 5+ single choice questions AND correct answers
  if (result.singleChoiceCount >= 5 && hasCorrectAnswers) {
    result.type = 'quiz';
    result.confidence = 100;
    result.canEvaluate = true;
    result.accuracyExpected = 99;
    result.reasons.push(
      `✅ QUIZ: ${result.singleChoiceCount} single choice questions with correct answers`
    );
    result.requirements.met.push(
      `${result.singleChoiceCount} single choice questions with correct answers`
    );

    if (titleHasQuizWords) {
      result.reasons.push('✅ Title confirms quiz/test nature');
      result.requirements.met.push('Quiz-related title/description');
    }

    // 🚨 OVERRIDE: Even if there are rating fields, if it's a quiz, it stays a quiz
    if (ratingFields > 0) {
      result.reasons.push(
        `Note: ${ratingFields} rating fields found but overridden by quiz classification`
      );
    }

    console.log(
      `🎯 FINAL CLASSIFICATION: QUIZ (${result.confidence}% confidence)`
    );
    return result;
  }

  // 🎯 PRIORITY 2: APPLICATION DETECTION (New High Priority)
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

    console.log(
      `📄 FINAL CLASSIFICATION: APPLICATION (${result.confidence}% confidence, score: ${applicationScore})`
    );
    return result;
  }

  // 🎯 PRIORITY 3: SURVEY DETECTION (Before feedback to prevent misclassification)
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
      `✅ SURVEY: ${ratingFields} rating fields, ${choiceFieldsWithRatingOptions} choice fields with rating options`
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

    console.log(
      `📊 FINAL CLASSIFICATION: SURVEY (${result.confidence}% confidence, score: ${surveyScore})`
    );
    return result;
  }

  // 🎯 PRIORITY 4: FEEDBACK DETECTION
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

  console.log('💬 Feedback Analysis:', {
    feedbackIndicators,
    feedbackScore,
    feedbackFields,
    surveyFields,
  });

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
      `✅ FEEDBACK: ${feedbackFields} feedback fields, ${hasLongTextFields} text fields`
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

    console.log(
      `💬 FINAL CLASSIFICATION: FEEDBACK (${result.confidence}% confidence, score: ${feedbackScore})`
    );
    return result;
  }

  // 🎯 DEFAULT TO GENERAL with enhanced guidance
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
    hasEducationFields >= 1
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

  console.log(
    `📝 FINAL CLASSIFICATION: GENERAL (${result.confidence}% confidence)`
  );
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
            className='p-1 h-6 w-6'
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
            className='p-2 h-8 w-8'
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
            className='p-2 h-8 w-8 text-red-600 hover:bg-red-50'
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
          className='text-xs px-3 py-1 h-7'
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
  const [showFormAnalysis, setShowFormAnalysis] = useState(false);

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
      setIsMobile(window.innerWidth < 768);
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

            // 🚨 FIXED: Enhanced full name field detection with quiz exclusion
            if (detectedUniqueFields.length < 1) {
              const fieldLabel = field.label?.toLowerCase() || '';
              const fieldId = field.id?.toLowerCase() || '';

              // ✅ STRICT: Only match explicit full name patterns
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

              // ✅ Only set fullNameFound if it's explicit AND not a quiz question
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
      // 🚨 ADDITIONAL CHECK: Don't show name field for quiz forms unless explicit
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
      if (!formAnalysis.canEvaluate)
        return 'bg-gray-100 text-gray-600 border-gray-200';

      switch (formAnalysis.type) {
        case 'quiz':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'survey':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'feedback':
          return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'application':
          return 'bg-purple-100 text-purple-800 border-purple-200';
        default:
          return 'bg-gray-100 text-gray-600 border-gray-200';
      }
    };

    const getIcon = () => {
      if (!formAnalysis.canEvaluate) return '❌';

      switch (formAnalysis.type) {
        case 'quiz':
          return '📝';
        case 'survey':
          return '📊';
        case 'feedback':
          return '💬';
        case 'application':
          return '📄';
        default:
          return '📄';
      }
    };

    return (
      <div className='flex items-center gap-2'>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-sm font-medium cursor-pointer ${getBadgeColor()}`}
          onClick={() => setShowFormAnalysis(!showFormAnalysis)}
          title='Click to view detailed form analysis'
        >
          <span>{getIcon()}</span>
          <span>
            {formAnalysis.type.charAt(0).toUpperCase() +
              formAnalysis.type.slice(1)}{' '}
            Form
          </span>
          {formAnalysis.canEvaluate && (
            <span className='text-xs opacity-75'>
              ({formAnalysis.accuracyExpected}% accuracy)
            </span>
          )}
          {formAnalysis.type === 'quiz' && (
            <span className='text-xs opacity-75'>
              ({formAnalysis.singleChoiceCount} SCQ)
            </span>
          )}
          {formAnalysis.type === 'application' && (
            <span className='text-xs opacity-75'>(Candidate Eval)</span>
          )}
          <ChevronDown
            className={`w-3 h-3 transition-transform ${
              showFormAnalysis ? 'rotate-180' : ''
            }`}
          />
        </motion.div>

        {/* Enhanced evaluation info */}
        {formAnalysis.canEvaluate && (
          <Badge
            variant='outline'
            className='bg-green-50 text-green-700 border-green-200'
          >
            <Brain className='w-3 h-3 mr-1' />
            AI Ready
          </Badge>
        )}
      </div>
    );
  };

  const FormAnalysisDetails = () => {
    if (!formAnalysis || !showFormAnalysis) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className='mb-6 overflow-hidden'
        >
          <Card className='border-blue-200 bg-blue-50'>
            <CardContent className='p-4'>
              <div className='space-y-4'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
                  <h4 className='font-semibold text-blue-900'>
                    Form Analysis Results
                  </h4>
                  <div className='flex items-center gap-2 text-sm'>
                    <span className='text-blue-700'>
                      Confidence: {formAnalysis.confidence}%
                    </span>
                    {formAnalysis.canEvaluate && (
                      <span className='text-green-700'>
                        Expected Accuracy: {formAnalysis.accuracyExpected}%
                      </span>
                    )}
                  </div>
                </div>

                {formAnalysis.reasons.length > 0 && (
                  <div>
                    <h5 className='font-medium text-blue-800 mb-2'>
                      Analysis Details:
                    </h5>
                    <ul className='text-sm text-blue-700 space-y-1'>
                      {formAnalysis.reasons.map((reason, index) => (
                        <li key={index} className='flex items-start gap-2'>
                          <span className='mt-1 text-xs'>•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                  {formAnalysis.requirements.met.length > 0 && (
                    <div>
                      <h5 className='font-medium text-green-700 mb-2'>
                        ✅ Requirements Met:
                      </h5>
                      <ul className='text-sm text-green-600 space-y-1'>
                        {formAnalysis.requirements.met.map((req, index) => (
                          <li key={index} className='flex items-start gap-2'>
                            <span className='mt-1'>✓</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {formAnalysis.requirements.missing.length > 0 && (
                    <div>
                      <h5 className='font-medium text-orange-700 mb-2'>
                        ⚠️ Missing Requirements:
                      </h5>
                      <ul className='text-sm text-orange-600 space-y-1'>
                        {formAnalysis.requirements.missing.map((req, index) => (
                          <li key={index} className='flex items-start gap-2'>
                            <span className='mt-1'>⚠</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {formAnalysis.type === 'quiz' && (
                  <div className='p-3 bg-blue-100 rounded border border-blue-300'>
                    <p className='text-sm text-blue-800'>
                      <strong>Quiz Classification Rule:</strong> Forms with 5+
                      single choice questions are automatically classified as
                      quizzes for AI evaluation with up to 99% accuracy.
                    </p>
                  </div>
                )}

                {!formAnalysis.canEvaluate && (
                  <div className='p-3 bg-yellow-100 rounded border border-yellow-300'>
                    <p className='text-sm text-yellow-800'>
                      <strong>Note:</strong> This form doesn&apos;t meet the
                      requirements for AI evaluation. Consider adding the
                      missing requirements above to enable advanced AI analysis.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
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
        if (failedCount === 0) {
          console.log('Batch evaluation completed successfully!', {
            description: `All ${successCount} submissions evaluated successfully.`,
            duration: 1000,
          });
        } else if (successCount === 0) {
          toast.error('Batch evaluation failed', {
            description: `All ${failedCount} evaluations failed. Please try again or contact support.`,
            duration: 8000,
          });
        } else {
          toast.warning('Batch evaluation partially completed', {
            description: `${successCount} successful, ${failedCount} failed. Check individual submissions for details.`,
            duration: 6000,
          });
        }

        // Show errors if any
        if (result.metadata?.errors && result.metadata.errors.length > 0) {
          console.warn('⚠️ Batch evaluation errors:', result.metadata.errors);
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

    // Enhanced badges with accuracy information
    switch (evaluation.formType) {
      case 'quiz':
        if (evaluation.quizResults) {
          const percentage = evaluation.quizResults.percentage;
          const accuracy = evaluation.accuracy || 98;
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
              className={`bg-${scoreColor}-100 text-${scoreColor}-800 border-${scoreColor}-200 hover:bg-${scoreColor}-50 cursor-pointer text-xs`}
              title={`Quiz Score: ${evaluation.quizResults.correctAnswers}/${evaluation.quizResults.totalQuestions} correct (${percentage}%) | Accuracy: ${accuracy}%`}
            >
              <Star className='w-3 h-3 mr-1' />
              {percentage}% ({accuracy}% acc)
            </Badge>
          );
        }
        break;

      case 'survey':
        if (evaluation.surveyResults) {
          const positivePercent =
            evaluation.surveyResults.overallSentiment.positive;
          const accuracy = evaluation.accuracy || 95;
          const surveyColor =
            positivePercent >= 70
              ? 'green'
              : positivePercent >= 50
              ? 'blue'
              : 'yellow';

          return (
            <Badge
              variant='default'
              className={`bg-${surveyColor}-100 text-${surveyColor}-800 border-${surveyColor}-200 hover:bg-${surveyColor}-50 cursor-pointer text-xs`}
              title={`Survey: ${positivePercent}% positive | Accuracy: ${accuracy}%`}
            >
              <Brain className='w-3 h-3 mr-1' />
              {positivePercent}% Pos ({accuracy}% acc)
            </Badge>
          );
        }
        break;

      case 'feedback':
        if (evaluation.feedbackResults) {
          const positivePercent =
            evaluation.feedbackResults.sentimentBreakdown.positive;
          const urgencyLevel = evaluation.feedbackResults.urgencyLevel;
          const accuracy = evaluation.accuracy || 92;
          const feedbackColor =
            urgencyLevel === 'high'
              ? 'red'
              : urgencyLevel === 'medium'
              ? 'yellow'
              : 'green';

          return (
            <Badge
              variant='default'
              className={`bg-${feedbackColor}-100 text-${feedbackColor}-800 border-${feedbackColor}-200 hover:bg-${feedbackColor}-50 cursor-pointer text-xs`}
              title={`Feedback: ${positivePercent}% positive, ${urgencyLevel} priority | Accuracy: ${accuracy}%`}
            >
              <Brain className='w-3 h-3 mr-1' />
              {urgencyLevel === 'high'
                ? 'High Priority'
                : `${positivePercent}% Pos`}{' '}
              ({accuracy}% acc)
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
          const accuracy = evaluation.accuracy || 90;

          const applicationColor =
            overallScore >= 80
              ? 'green'
              : overallScore >= 70
              ? 'blue'
              : overallScore >= 60
              ? 'yellow'
              : 'red';

          const actionIcon =
            recommendedAction === 'hire'
              ? '✅'
              : recommendedAction === 'interview'
              ? '🤝'
              : recommendedAction === 'consider'
              ? '🤔'
              : '❌';

          return (
            <Badge
              variant='default'
              className={`bg-${applicationColor}-100 text-${applicationColor}-800 border-${applicationColor}-200 hover:bg-${applicationColor}-50 cursor-pointer text-xs`}
              title={`Application: ${overallScore}% score, ${applicationStrength} candidate, recommend: ${recommendedAction} | Accuracy: ${accuracy}%`}
            >
              <span className='mr-1'>{actionIcon}</span>
              {overallScore}%{' '}
              {applicationStrength.charAt(0).toUpperCase() +
                applicationStrength.slice(1)}{' '}
              ({accuracy}% acc)
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
        Analyzed ({accuracy}% acc)
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
          toast.info('Starting AI evaluation...', {
            description: 'This may take a few moments',
            duration: 3000,
          });
          evaluateSubmissionWithAI(submission);
        }
      } else {
        toast.info('AI evaluation not available', {
          description: 'This form type does not support AI evaluation.',
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
          className='space-y-4'
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
        <label className='text-sm font-semibold text-gray-700 block'>
          {label}
        </label>
        <div className='bg-gray-50 p-3 rounded-lg border'>
          <p className='text-gray-900 leading-relaxed whitespace-pre-wrap break-words'>
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

          <FormAnalysisDetails />

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
                className='w-full flex items-center justify-between'
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
                  <div className='p-4 space-y-4'>
                    <motion.div
                      variants={staggerContainer}
                      initial='initial'
                      animate='animate'
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
                  /* Desktop Table View */
                  <div className='overflow-x-auto'>
                    <Table className='w-full table-fixed'>
                      <TableHeader>
                        <TableRow className='border-b-2 border-gray-200 bg-gray-50'>
                          <TableHead className='border-r border-gray-200 px-4 py-3 w-[16%]'>
                            <div className='flex items-center gap-2 font-semibold text-gray-700'>
                              <Clock className='w-4 h-4' />
                              Submission Date
                            </div>
                          </TableHead>

                          {uniqueFields.map(field => (
                            <TableHead
                              key={field.fieldId}
                              className='border-r border-gray-200 px-4 py-3 w-[16%]'
                            >
                              <div className='flex items-center gap-2 font-semibold text-gray-700'>
                                {field.icon}
                                <span className='truncate'>{field.label}</span>
                              </div>
                            </TableHead>
                          ))}

                          {uniqueFields.length < 2 && hasEmailField && (
                            <TableHead className='border-r border-gray-200 px-4 py-3 w-[16%]'>
                              <div className='flex items-center gap-2 font-semibold text-gray-700'>
                                <Mail className='w-4 h-4' />
                                Email
                              </div>
                            </TableHead>
                          )}

                          {uniqueFields.length < 1 && hasFullNameField && (
                            <TableHead className='border-r border-gray-200 px-4 py-3 w-[16%]'>
                              <div className='flex items-center gap-2 font-semibold text-gray-700'>
                                <User className='w-4 h-4' />
                                Full Name
                              </div>
                            </TableHead>
                          )}

                          {isFeedbackForm && (
                            <TableHead className='border-r border-gray-200 px-4 py-3 w-[16%]'>
                              <div className='flex items-center gap-2 font-semibold text-gray-700'>
                                <Brain className='w-4 h-4' />
                                AI Analysis
                              </div>
                            </TableHead>
                          )}

                          <TableHead className='border-r border-gray-200 px-4 py-3 w-[12%]'>
                            <div className='flex items-center gap-2 font-semibold text-gray-700'>
                              <AlertCircle className='w-4 h-4' />
                              Status
                            </div>
                          </TableHead>

                          <TableHead className='border-r border-gray-200 px-4 py-3 w-[8%]'>
                            <div className='flex items-center justify-center gap-2 font-semibold text-gray-700'>
                              Read
                            </div>
                          </TableHead>

                          <TableHead className='px-4 py-3 w-[8%]'>
                            <div className='font-semibold text-center text-gray-700'>
                              Actions
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
                                  handleToggleRead(
                                    submission.id,
                                    submission.isRead
                                  );
                                }}
                                className='p-1 hover:bg-gray-200 rounded-full transition-colors cursor-pointer'
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
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
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
                    className='border-gray-300 hover:bg-gray-50 cursor-pointer px-3 py-1 text-sm'
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

      {/* Enhanced Submission Details Modal */}
      <Dialog open={showSubmissionModal} onOpenChange={setShowSubmissionModal}>
        <DialogContent
          className='w-[95vw] h-[90vh] max-h-[90vh] overflow-y-auto bg-white p-0'
          style={{
            width: '55vw',
            maxWidth: '95vw',
          }}
        >
          <div className='sticky top-0 z-10 bg-white'>
            <DialogHeader className='border-b border-gray-200 p-4 md:p-6 sticky top-0 bg-white'>
              <DialogTitle className='flex flex-col sm:flex-row sm:items-center gap-2'>
                <span className='text-lg md:text-xl font-bold text-gray-900'>
                  Submission Details
                </span>
                {selectedSubmission && isFeedbackForm && (
                  <Badge
                    variant='outline'
                    className={`
                    w-fit ${
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
              <DialogDescription className='text-gray-600'>
                View and manage detailed submission information including
                submitted data, files, and AI analysis results.
              </DialogDescription>
            </DialogHeader>

            {/* Custom positioned close button */}
            <DialogClose className='absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground'>
              <X className='h-4 w-4' />
              <span className='sr-only'>Close</span>
            </DialogClose>
          </div>

          {selectedSubmission && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='space-y-6 p-4 md:p-6'
            >
              {/* Enhanced Submission Meta Info */}
              <motion.div
                variants={fadeInUp}
                className='bg-gradient-to-r from-blue-50 to-indigo-50 p-4 md:p-6 rounded-lg border border-blue-200'
              >
                <h4 className='font-semibold text-blue-900 mb-4 flex items-center gap-2'>
                  <Calendar className='w-5 h-5' />
                  Submission Information
                </h4>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm'>
                  <div>
                    <span className='text-blue-700 font-medium block mb-1'>
                      Submitted:
                    </span>
                    <p className='text-gray-900 font-medium break-words'>
                      {formatDateTime(selectedSubmission.submittedAt)}
                    </p>
                  </div>
                  <div>
                    <span className='text-blue-700 font-medium block mb-1'>
                      Status:
                    </span>
                    <div>{getStatusBadge(selectedSubmission.status)}</div>
                  </div>
                  <div>
                    <span className='text-blue-700 font-medium block mb-1'>
                      Read Status:
                    </span>
                    <div>
                      <Badge
                        variant={
                          selectedSubmission.isRead ? 'default' : 'secondary'
                        }
                        className='text-xs'
                      >
                        {selectedSubmission.isRead ? 'Read' : 'Unread'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className='text-blue-700 font-medium block mb-1'>
                      Form Type:
                    </span>
                    <div>
                      <Badge variant='outline' className='bg-white text-xs'>
                        {detectedFormType.charAt(0).toUpperCase() +
                          detectedFormType.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Enhanced Unique Fields Summary */}
              {uniqueFields.length > 0 && (
                <motion.div
                  variants={fadeInUp}
                  className='bg-gradient-to-r from-purple-50 to-pink-50 p-4 md:p-6 rounded-lg border border-purple-200'
                >
                  <h4 className='font-semibold text-purple-900 mb-4 flex items-center gap-2'>
                    <IdCard className='w-5 h-5' />
                    Key Identifiers
                  </h4>
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm'>
                    {uniqueFields.map(field => (
                      <div key={field.fieldId}>
                        <span className='text-purple-700 font-medium flex items-center gap-2 mb-2'>
                          {field.icon}
                          {field.label}:
                        </span>
                        <div className='font-semibold text-gray-900 bg-white px-4 py-3 rounded-lg border shadow-sm break-words'>
                          {getFieldValueFromSubmission(
                            selectedSubmission,
                            field.fieldId
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Enhanced AI Evaluation Details */}
              {isFeedbackForm && aiEvaluations[selectedSubmission.id] && (
                <motion.div
                  variants={fadeInUp}
                  className='bg-gradient-to-r from-green-50 to-emerald-50 p-4 md:p-6 rounded-lg border border-green-200'
                >
                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4'>
                    <h4 className='font-semibold text-green-900 flex items-center gap-2'>
                      <Brain className='w-5 h-5' />
                      AI Evaluation Results
                    </h4>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        handleViewAIEvaluation(selectedSubmission.id)
                      }
                      className='text-green-700 border-green-300 hover:bg-green-100 cursor-pointer w-fit text-sm'
                    >
                      View Full Analysis
                    </Button>
                  </div>
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm'>
                    <div>
                      <span className='text-green-700 font-medium block mb-1'>
                        Form Type:
                      </span>
                      <div>
                        <Badge className='bg-green-100 text-green-800 font-bold capitalize text-xs'>
                          {aiEvaluations[selectedSubmission.id].formType}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className='text-green-700 font-medium block mb-1'>
                        Sentiment:
                      </span>
                      <div>
                        <Badge
                          className={`font-bold capitalize text-xs ${
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
                    <div className='sm:col-span-2 lg:col-span-1'>
                      <span className='text-green-700 font-medium block mb-1'>
                        Score:
                      </span>
                      <div>
                        {(() => {
                          const evaluation =
                            aiEvaluations[selectedSubmission.id];
                          if (evaluation.quizResults) {
                            return (
                              <Badge className='bg-blue-100 text-blue-800 font-bold text-xs'>
                                {evaluation.quizResults.percentage}% (
                                {evaluation.quizResults.correctAnswers}/
                                {evaluation.quizResults.totalQuestions})
                              </Badge>
                            );
                          } else if (evaluation.surveyResults) {
                            return (
                              <Badge className='bg-green-100 text-green-800 font-bold text-xs'>
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
                                className={`font-bold text-xs ${
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
                            <Badge className='bg-gray-100 text-gray-800 text-xs'>
                              Analyzed
                            </Badge>
                          );
                        })()}
                      </div>
                    </div>
                    <div className='col-span-1 sm:col-span-2 lg:col-span-3'>
                      <span className='text-green-700 font-medium block mb-2'>
                        Summary:
                      </span>
                      <div className='bg-white p-4 rounded-lg border'>
                        <p className='text-gray-900 leading-relaxed text-sm break-words'>
                          {aiEvaluations[selectedSubmission.id].feedback}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Enhanced Submission Data */}
              <motion.div variants={fadeInUp} className='bg-white'>
                <h3 className='text-lg font-bold text-gray-900 mb-6 flex items-center gap-2'>
                  <FileText className='w-5 h-5' />
                  Submitted Data
                </h3>

                <div className='space-y-4 bg-gradient-to-r from-gray-50 to-slate-50 p-4 md:p-6 rounded-lg border border-gray-200'>
                  {Object.entries(selectedSubmission.data).length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className='text-center py-8'
                    >
                      <div className='text-gray-400 mb-4'>
                        <FileText className='w-16 h-16 mx-auto' />
                      </div>
                      <p className='text-gray-500 italic text-lg'>
                        No data submitted
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      variants={staggerContainer}
                      initial='initial'
                      animate='animate'
                    >
                      {/* Render regular form fields */}
                      {Object.entries(selectedSubmission.data).map(
                        ([fieldId, value], index) => (
                          <motion.div
                            key={`field-${fieldId}-${index}`}
                            variants={fadeInUp}
                          >
                            {renderFieldValue(fieldId, value)}
                          </motion.div>
                        )
                      )}

                      {/* Enhanced file fields rendering */}
                      {selectedSubmission.files &&
                        Array.isArray(selectedSubmission.files) &&
                        selectedSubmission.files.length > 0 && (
                          <motion.div variants={fadeInUp}>
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
                                    <motion.div
                                      key={`file-field-${fieldId}`}
                                      variants={fadeInUp}
                                      className='space-y-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm'
                                    >
                                      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-3 gap-2'>
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
                                          <motion.div
                                            key={`file-${fieldId}-${index}`}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className='flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50 p-4 rounded-lg border'
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
                                              <div className='flex flex-wrap items-center gap-4 mt-1'>
                                                <p className='text-xs text-gray-500'>
                                                  {formatFileSize(file.size)}
                                                </p>
                                                <p className='text-xs text-gray-500 break-all'>
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
                                            <div className='flex flex-col sm:flex-row gap-2 flex-shrink-0'>
                                              {/* Download Button */}
                                              <motion.div
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                              >
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
                                                  className='w-full sm:w-auto px-3 py-2 hover:bg-green-50 hover:border-green-300 cursor-pointer text-xs'
                                                  title={`Download ${file.originalName}`}
                                                >
                                                  {downloadingFileId ===
                                                  file.publicId ? (
                                                    <Loader2 className='w-4 h-4 animate-spin' />
                                                  ) : (
                                                    <Download className='w-4 h-4' />
                                                  )}
                                                  <span className='ml-1'>
                                                    Download
                                                  </span>
                                                </Button>
                                              </motion.div>

                                              {/* Delete Button */}
                                              <motion.div
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                              >
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
                                                  className='w-full sm:w-auto px-3 py-2 text-red-600 hover:bg-red-50 hover:border-red-300 cursor-pointer text-xs'
                                                  title={`Delete ${file.originalName}`}
                                                >
                                                  <Trash2 className='w-4 h-4' />
                                                  <span className='ml-1'>
                                                    Delete
                                                  </span>
                                                </Button>
                                              </motion.div>
                                            </div>
                                          </motion.div>
                                        ))}
                                      </div>
                                    </motion.div>
                                  );
                                }
                              );
                            })()}
                          </motion.div>
                        )}
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Enhanced Action Buttons in Modal */}
              <motion.div
                variants={fadeInUp}
                className='flex justify-center items-center border-t border-gray-200 pt-6'
              >
                <div className='flex gap-3'>
                  {/* AI Evaluation Button */}
                  {isFeedbackForm &&
                    !evaluatingSubmissions.has(selectedSubmission.id) &&
                    !aiEvaluations[selectedSubmission.id] && (
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant='outline'
                          onClick={() =>
                            evaluateSubmissionWithAI(selectedSubmission)
                          }
                          className='bg-purple-500 hover:bg-purple-600 text-white border-purple-500 cursor-pointer'
                        >
                          <Brain className='w-4 h-4 mr-2' />
                          Start AI Evaluation
                        </Button>
                      </motion.div>
                    )}
                </div>
              </motion.div>
            </motion.div>
          )}
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
                    <div className='p-3 bg-gray-50 rounded-md border border-gray-200'>
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

      {/* Enhanced AI Evaluation Details Modal */}
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
                              .recommendedAction === 'hire' && '✅ '}
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
                      className='bg-white border border-gray-200 rounded-lg p-4 md:p-6'
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
                                ✅ All recommended keywords found in application
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
                                ✅ All critical fields completed
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
