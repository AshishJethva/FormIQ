import express from 'express';
import { AIEvaluationService } from '../services/aiEvaluationService';
import Form from '../models/Form';
import Submission from '../models/Submission';
import { protect } from '../middleware/protect';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiBasicError';
import mongoose from 'mongoose';

const router = express.Router();
const aiEvaluationService = new AIEvaluationService();

const validateFormForEvaluation = (
  form: any
): { isValid: boolean; error?: string; analysis?: any } => {
  try {
    if (!form) {
      return { isValid: false, error: 'Form not found' };
    }

    if (!form.pages || !Array.isArray(form.pages) || form.pages.length === 0) {
      return { isValid: false, error: 'Form has no pages to evaluate' };
    }

    let totalFields = 0;
    let singleChoiceCount = 0;
    let multipleChoiceCount = 0;
    let ratingFields = 0;
    let feedbackFields = 0;
    let textFields = 0;
    let hasCorrectAnswers = false;
    let evaluableFields = 0;
    let hasRatingScales = 0;
    let choiceFieldsWithRatingOptions = 0;

    let hasPersonalInfoFields = 0;
    let hasWorkExperienceFields = 0;
    let hasEducationFields = 0;
    let hasSkillsFields = 0;
    let hasFileUploads = 0;
    let hasApplicationPatterns = false;
    let applicationFields = 0;
    let fileUploadFields = [];

    // Check title and description for type hints
    const formTitle = form.title?.toLowerCase() || '';
    const formDescription = form.description?.toLowerCase() || '';
    const titleDescText = `${formTitle} ${formDescription}`;

    form.pages.forEach((page: any) => {
      if (page?.fields && Array.isArray(page.fields)) {
        page.fields.forEach((field: any) => {
          if (field?.type && field?.id && field.type !== 'heading') {
            totalFields++;
            const fieldLabel = field.label?.toLowerCase() || '';
            const fieldType = field.type.toLowerCase();

            if (
              fieldType === 'fileupload' ||
              fieldType === 'image' ||
              /resume|cv|curriculum.*vitae|portfolio|cover.*letter|document|certificate|transcript|diploma|attachment|upload.*resume|upload.*cv|file.*upload|attach.*file|document.*upload/i.test(
                fieldLabel
              )
            ) {
              hasFileUploads++;
              fileUploadFields.push({
                id: field.id,
                label: field.label,
                type: fieldType,
              });

              if (/resume|cv|curriculum.*vitae|portfolio/i.test(fieldLabel)) {
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
              applicationFields++;
              if (/personal|contact|details|information/i.test(fieldLabel)) {
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
              evaluableFields++;
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
              evaluableFields++;
            }

            // Skills and competencies detection
            if (
              /skills|abilities|competencies|expertise|technical.*skills|soft.*skills|programming.*languages|languages.*spoken|certifications|achievements|portfolio|references|availability|salary.*expectation|expected.*salary|start.*date|notice.*period|why.*interested|motivation|cover.*letter|additional.*information/i.test(
                fieldLabel
              )
            ) {
              hasSkillsFields++;
              applicationFields++;
              hasApplicationPatterns = true;
              evaluableFields++;
            }

            // QUIZ DETECTION: Single choice with correct answers
            if (fieldType === 'singlechoice' || fieldType === 'dropdown') {
              singleChoiceCount++;
              evaluableFields++;

              // Check for correctAnswer property (primary quiz indicator)
              if (
                field.correctAnswer ||
                (field.options &&
                  field.options.some((opt: any) => opt.isCorrect))
              ) {
                hasCorrectAnswers = true;
              }
            }

            // Multiple choice with correct answers
            if (fieldType === 'multiplechoice') {
              multipleChoiceCount++;
              evaluableFields++;

              if (
                field.correctAnswer ||
                field.correctAnswers ||
                (field.options &&
                  field.options.some((opt: any) => opt.isCorrect))
              ) {
                hasCorrectAnswers = true;
              } else {
                // Check for rating-like options in multiple choice (SURVEY)
                if (field.options && Array.isArray(field.options)) {
                  const hasRatingOptions = field.options.some(
                    (opt: any) =>
                      opt.label &&
                      /excellent|very.*good|good|fair|poor|very.*poor|strongly.*agree|agree|neutral|disagree|strongly.*disagree|very.*satisfied|satisfied|dissatisfied|very.*dissatisfied|⭐|★|likely|unlikely|1.*star|2.*star|3.*star|4.*star|5.*star/i.test(
                        opt.label
                      )
                  );

                  if (hasRatingOptions) {
                    choiceFieldsWithRatingOptions++;
                    ratingFields++;
                  }
                }
              }
            }

            // SURVEY DETECTION: Rating/scale fields
            if (
              fieldType === 'rating' ||
              fieldType === 'scale' ||
              fieldType === 'slider'
            ) {
              ratingFields++;
              evaluableFields++;
              evaluableFields++;
            }

            // Single choice with rating patterns (SURVEY, NOT QUIZ)
            if (
              (fieldType === 'singlechoice' || fieldType === 'dropdown') &&
              !field.correctAnswer
            ) {
              if (field.options && Array.isArray(field.options)) {
                const hasRatingOptions = field.options.some(
                  (opt: any) =>
                    opt.label &&
                    /excellent|very.*good|good|fair|poor|very.*poor|strongly.*agree|agree|neutral|disagree|strongly.*disagree|very.*satisfied|satisfied|dissatisfied|very.*dissatisfied|⭐|★|likely|unlikely|1.*star|2.*star|3.*star|4.*star|5.*star/i.test(
                      opt.label
                    )
                );

                if (hasRatingOptions) {
                  choiceFieldsWithRatingOptions++;
                  ratingFields++;
                }
              }
            }

            // Rating patterns in labels
            if (
              /rate|rating|satisfaction|quality|likely.*recommend|how.*satisfied|scale.*1.*to|strongly.*agree|very.*satisfied|how.*would.*you.*rate|please.*rate|rate.*the|evaluate.*the|assess.*the|satisfaction.*level|quality.*of/i.test(
                fieldLabel
              )
            ) {
              ratingFields++;
              hasRatingScales++;
              evaluableFields++;
            }

            // FEEDBACK DETECTION: Text fields with feedback patterns
            if (
              fieldType === 'longtext' ||
              fieldType === 'paragraph' ||
              fieldType === 'shorttext'
            ) {
              textFields++;

              if (
                /feedback|comment|improve|experience.*with|how.*was.*your|tell.*us.*about|share.*your.*thoughts|what.*did.*you.*think|any.*suggestions|what.*could.*we|how.*can.*we.*improve|describe.*your.*experience|thoughts.*on|opinion.*about|better.*experience|how.*did.*we.*do|rate.*our.*service|your.*experience.*was|overall.*experience|service.*experience|thoughts.*about|comments.*about/i.test(
                  fieldLabel
                )
              ) {
                feedbackFields++;
                evaluableFields++;
              }

              // EXPERIENCE-SPECIFIC PATTERNS (Strong feedback indicators)
              if (
                /experience|how.*was|describe.*your|tell.*us.*about.*your|thoughts.*on.*your|what.*did.*you.*think.*about/i.test(
                  fieldLabel
                )
              ) {
                feedbackFields++;
                evaluableFields++;
              }
            }
          }
        });
      }
    });

    if (totalFields === 0) {
      return { isValid: false, error: 'Form has no fields defined' };
    }

    if (evaluableFields === 0) {
      return {
        isValid: false,
        error:
          'Form has no evaluable fields (only headings/static content found)',
      };
    }

    let formType = 'general';
    let canEvaluate = false;
    let expectedAccuracy = 90;
    let confidence = 0;
    let reasons = [];

    // PRIORITY 1: QUIZ CLASSIFICATION
    if (singleChoiceCount >= 5 && hasCorrectAnswers) {
      formType = 'quiz';
      canEvaluate = true;
      confidence = 100;
      expectedAccuracy = 99;
      reasons.push(
        `QUIZ: ${singleChoiceCount} single choice questions with correct answers (≥5 required)`
      );

      if (ratingFields > 0) {
        reasons.push(
          `Note: ${ratingFields} rating fields found but overridden by quiz classification`
        );
      }
    }

    // PRIORITY 2: APPLICATION CLASSIFICATION
    else {
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
        (applicationIndicators.title &&
          hasPersonalInfoFields >= 2 &&
          hasFileUploads >= 1) ||
        (hasApplicationPatterns &&
          hasPersonalInfoFields >= 2 &&
          hasFileUploads >= 1)
      ) {
        formType = 'application';
        canEvaluate = true;
        confidence = Math.min(98, 60 + applicationScore * 4);
        expectedAccuracy = 90;
        reasons.push(
          `APPLICATION: ${applicationFields} application-specific fields, structured candidate data collection`
        );

        if (hasFileUploads > 0) {
          reasons.push(
            `FILE UPLOADS: ${hasFileUploads} file upload fields detected for document submission`
          );
        }

        if (hasApplicationPatterns) {
          reasons.push('Application-specific field patterns detected');
        }
      }

      // PRIORITY 3: SURVEY CLASSIFICATION
      // Must have rating/scale elements WITHOUT correct answers
      else if (
        ratingFields >= 3 ||
        choiceFieldsWithRatingOptions >= 2 ||
        hasRatingScales >= 2 ||
        (/survey|poll|research|study|questionnaire|analysis|demographic/i.test(
          titleDescText
        ) &&
          ratingFields >= 2)
      ) {
        formType = 'survey';
        canEvaluate = true;
        confidence = 85;
        expectedAccuracy = 95;
        reasons.push(
          `SURVEY: ${ratingFields} rating fields, ${choiceFieldsWithRatingOptions} choice fields with rating options`
        );
      }

      // PRIORITY 4: FEEDBACK CLASSIFICATION
      // Focus on experience and improvement feedback
      else if (
        feedbackFields >= 2 ||
        (textFields >= 3 && feedbackFields >= 1) ||
        (/feedback|review|comment|experience|tell.*us/i.test(titleDescText) &&
          textFields >= 2)
      ) {
        formType = 'feedback';
        canEvaluate = true;
        confidence = 90;
        expectedAccuracy = 92;
        reasons.push(
          `FEEDBACK: ${feedbackFields} feedback fields, ${textFields} text fields`
        );
      }
      // FALLBACK: General form
      else {
        reasons.push(
          `GENERAL: ${singleChoiceCount} SCQ${hasCorrectAnswers ? ' (with answers)' : ''}, ${ratingFields} rating, ${feedbackFields} feedback, ${textFields} text fields`
        );
      }
    }

    const analysis = {
      totalFields,
      singleChoiceCount,
      multipleChoiceCount,
      ratingFields,
      feedbackFields,
      textFields,
      hasCorrectAnswers,
      formType,
      canEvaluate,
      expectedAccuracy,
      confidence,
      evaluableFields,
      reasons,
      choiceFieldsWithRatingOptions,
      hasRatingScales,
      hasPersonalInfoFields,
      hasWorkExperienceFields,
      hasEducationFields,
      hasSkillsFields,
      hasFileUploads,
      applicationFields,
      hasApplicationPatterns,
      fileUploadFields,
      titleHints: {
        hasQuizWords: /quiz|test|exam|assessment/i.test(titleDescText),
        hasFeedbackWords: /feedback|review|comment|experience/i.test(
          titleDescText
        ),
        hasSurveyWords: /survey|poll|research|study/i.test(titleDescText),
        hasApplicationWords:
          /application|apply|job|career|hiring|recruitment/i.test(
            titleDescText
          ),
      },
    };

    return { isValid: true, analysis };
  } catch (error: any) {
    console.error('form validation error:', error);
    return {
      isValid: false,
      error: `Form validation failed: ${error.message}`,
    };
  }
};

// Submission validation with quality checks
const validateSubmissionForEvaluation = (
  submission: any
): { isValid: boolean; error?: string; quality?: number } => {
  try {
    if (!submission) {
      return { isValid: false, error: 'Submission not found' };
    }

    if (!submission.data || typeof submission.data !== 'object') {
      return { isValid: false, error: 'Submission has no data to evaluate' };
    }

    const fieldCount = Object.keys(submission.data).length;
    const filesCount = submission.files?.length || 0;

    const validContent = Object.values(submission.data).filter(value => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'object' && value !== null) return true;
      return value !== null && value !== undefined;
    });

    if (fieldCount === 0 && filesCount === 0) {
      return { isValid: false, error: 'Submission data is completely empty' };
    }

    if (validContent.length === 0 && filesCount === 0) {
      return {
        isValid: false,
        error: 'Submission has no valid content or files to evaluate',
      };
    }

    const dataCompletionRate =
      fieldCount > 0 ? validContent.length / fieldCount : 0;
    let quality = Math.round(dataCompletionRate * 100);

    // Bonus for file uploads (important for applications)
    if (filesCount > 0) {
      const fileBonus = Math.min(15, filesCount * 5);
      quality = Math.min(100, quality + fileBonus);
    }

    // Adjust quality based on content richness
    const textResponses = validContent.filter(
      value => typeof value === 'string' && value.trim().length > 10
    ).length;

    const richContentBonus = Math.min(
      20,
      (textResponses / Math.max(1, fieldCount)) * 20
    );
    quality = Math.min(100, quality + richContentBonus);

    if (quality < 30) {
      return {
        isValid: false,
        error: 'Submission quality too low for reliable evaluation',
        quality,
      };
    }

    return { isValid: true, quality };
  } catch (error: any) {
    console.error('submission validation error:', error);
    return {
      isValid: false,
      error: `Submission validation failed: ${error.message}`,
    };
  }
};

router.post(
  '/evaluate/:submissionId',
  protect,
  asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    const startTime = Date.now();

    try {
      // Step 1: Validate submission ID format
      if (!mongoose.Types.ObjectId.isValid(submissionId)) {
        throw new ApiError('Invalid submission ID format', 400);
      }

      // Step 2: Get submission with error handling
      const submission = await Submission.findById(submissionId).lean().exec();
      if (!submission) {
        throw new ApiError('Submission not found', 404);
      }

      // Step 3: submission validation
      const submissionValidation = validateSubmissionForEvaluation(submission);
      if (!submissionValidation.isValid) {
        throw new ApiError(submissionValidation.error!, 400);
      }

      // Step 4: Get form structure
      const form = await Form.findById(submission.formId);
      if (!form) {
        throw new ApiError('Form not found for this submission', 404);
      }

      // Step 5: form validation
      const formValidation = validateFormForEvaluation(form);
      if (!formValidation.isValid) {
        throw new ApiError(formValidation.error!, 400);
      }

      // Step 6: Verify user has access to this form
      if (form.userId.toString() !== req.user.id) {
        throw new ApiError('Not authorized to evaluate this submission', 403);
      }

      // Step 7: Check if form is evaluable
      if (!formValidation.analysis?.canEvaluate) {
        const analysis = formValidation.analysis;
        let reason = `Form type "${analysis?.formType}" not suitable for AI evaluation.`;
        throw new ApiError(reason, 400);
      }

      let evaluation;
      try {
        // Ensure files are included in the submission data
        const submissionDataForEvaluation = {
          ...submission.data,
          files: submission.files || [],
        };

        // Verify specific resume field data
        const resumeFieldId = '60816a3f-eacb-439c-bfd2-51e9d56ac56b';
        const resumeFieldValue = submissionDataForEvaluation[resumeFieldId];
        const resumeFiles = submissionDataForEvaluation.files.filter(
          (f: any) => f.fieldId === resumeFieldId
        );

        evaluation = await aiEvaluationService.evaluateSubmissionWithValidation(
          form.toObject(),
          submissionDataForEvaluation,
          submissionId
        );

        // Validate evaluation results
        if (evaluation.status === 'completed') {
          const expectedAccuracy = formValidation.analysis.expectedAccuracy;
          if (
            evaluation.accuracy &&
            evaluation.accuracy < expectedAccuracy - 5
          ) {
            console.warn(
              ` Evaluation accuracy (${evaluation.accuracy}%) below expected (${expectedAccuracy}%)`
            );
          }
        }
      } catch (evaluationError: any) {
        console.error('❌ AI evaluation service error:', evaluationError);
        evaluation = {
          id: `eval_${submissionId}_${Date.now()}`,
          submissionId,
          formType: formValidation.analysis.formType as any,
          sentiment: 'neutral' as const,
          categories: ['evaluation-failed'],
          evaluatedAt: new Date().toISOString(),
          status: 'failed' as const,
          feedback: `AI evaluation failed: ${evaluationError.message}`,
          confidence: 0,
          accuracy: 0,
        };
      }

      const evaluationTime = Date.now() - startTime;

      // Return results
      res.json({
        success: true,
        data: evaluation,
        metadata: {
          evaluationTime,
          formId: form._id,
          formTitle: form.title,
          formType: evaluation.formType,
          evaluatedAt: evaluation.evaluatedAt,
          version: '3.1.0-file-upload-fixed',
          accuracy: evaluation.accuracy || 0,
          confidence: evaluation.confidence || 0,
          formAnalysis: {
            ...formValidation.analysis,
            dataQuality: submissionValidation.quality,
          },
        },
      });
    } catch (error: any) {
      const evaluationTime = Date.now() - startTime;
      console.error('AI evaluation error:', {
        submissionId,
        error: error.message,
        evaluationTime: `${evaluationTime}ms`,
      });

      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          error: 'EVALUATION_ERROR',
          metadata: {
            evaluationTime,
            submissionId,
            timestamp: new Date().toISOString(),
            version: '3.1.0-file-upload-fixed',
          },
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'AI evaluation service temporarily unavailable',
          error: 'SERVICE_ERROR',
          metadata: {
            evaluationTime,
            submissionId,
            timestamp: new Date().toISOString(),
            version: '3.1.0-file-upload-fixed',
          },
        });
      }
    }
  })
);

router.post(
  '/evaluate-batch',
  protect,
  asyncHandler(async (req, res) => {
    const { formId, submissionIds } = req.body;
    const startTime = Date.now();

    try {
      // request validation
      if (!formId || !submissionIds || !Array.isArray(submissionIds)) {
        throw new ApiError(
          'Invalid request parameters. formId and submissionIds array required.',
          400
        );
      }

      if (submissionIds.length === 0) {
        throw new ApiError('No submission IDs provided', 400);
      }

      if (submissionIds.length > 20) {
        throw new ApiError(
          'Maximum 20 submissions can be evaluated at once for optimal accuracy',
          400
        );
      }

      // Validate form ID format
      if (!mongoose.Types.ObjectId.isValid(formId)) {
        throw new ApiError('Invalid form ID format', 400);
      }

      // Validate all submission IDs
      const invalidIds = submissionIds.filter(
        id => !mongoose.Types.ObjectId.isValid(id)
      );

      if (invalidIds.length > 0) {
        throw new ApiError(
          `Invalid submission IDs: ${invalidIds.join(', ')}`,
          400
        );
      }

      const form = await Form.findById(formId);
      if (!form) {
        throw new ApiError('Form not found', 404);
      }

      const formValidation = validateFormForEvaluation(form);
      if (!formValidation.isValid) {
        throw new ApiError(formValidation.error!, 400);
      }

      // Verify user has access to this form
      if (form.userId.toString() !== req.user.id) {
        throw new ApiError(
          'Not authorized to evaluate submissions for this form',
          403
        );
      }

      // Check if form is evaluable
      if (!formValidation.analysis?.canEvaluate) {
        const analysis = formValidation.analysis;
        throw new ApiError(
          `Form not suitable for batch AI evaluation. Form type: ${analysis?.formType}. ` +
            `Requirements: Quiz needs 5+ single choice questions (has ${analysis?.singleChoiceCount || 0}), ` +
            `Application needs 2+ personal info + work experience/education + file upload (has ${analysis?.applicationFields || 0} app fields), ` +
            `Survey needs 3+ rating fields (has ${analysis?.ratingFields || 0}), ` +
            `Feedback needs 2+ feedback fields (has ${analysis?.feedbackFields || 0}).`,
          400
        );
      }

      // Get and validate submissions
      const submissions = await Submission.find({
        _id: { $in: submissionIds },
        formId: formId,
      })
        .lean()
        .exec();

      if (submissions.length !== submissionIds.length) {
        const foundIds = submissions.map(s => s._id.toString());
        const missingIds = submissionIds.filter(id => !foundIds.includes(id));
        throw new ApiError(
          `Submissions not found or don't belong to this form: ${missingIds.join(', ')}`,
          404
        );
      }

      // Validate submission quality
      const qualityResults = submissions.map(submission => {
        const validation = validateSubmissionForEvaluation(submission);
        return {
          submissionId: submission._id.toString(),
          isValid: validation.isValid,
          quality: validation.quality || 0,
          error: validation.error,
          hasFiles: (submission.files || []).length > 0,
          fileCount: (submission.files || []).length,
        };
      });

      const evaluations = [];
      const errors = [];
      let successCount = 0;
      let failureCount = 0;
      let totalAccuracy = 0;
      let totalConfidence = 0;

      for (let i = 0; i < submissions.length; i++) {
        const submission = submissions[i];
        const submissionStartTime = Date.now();
        const qualityInfo = qualityResults.find(
          q => q.submissionId === submission._id.toString()
        );

        try {
          // Skip low-quality submissions but still create results
          if (!qualityInfo?.isValid) {
            const failedEvaluation = {
              id: `eval_${submission._id}_quality_failed_${Date.now()}`,
              submissionId: submission._id.toString(),
              formType: formValidation.analysis.formType as any,
              sentiment: 'neutral' as const,
              categories: ['quality-failed'],
              evaluatedAt: new Date().toISOString(),
              status: 'failed' as const,
              feedback: `Evaluation skipped due to data quality issues: ${qualityInfo?.error}`,
              confidence: 0,
              accuracy: 0,
            };

            evaluations.push(failedEvaluation);
            failureCount++;
            errors.push({
              submissionId: submission._id.toString(),
              error: qualityInfo?.error || 'Data quality too low',
            });
            continue;
          }

          const submissionDataForEvaluation = {
            ...submission.data,
            files: submission.files || [],
          };

          // Perform evaluation
          let evaluation;
          try {
            evaluation =
              await aiEvaluationService.evaluateSubmissionWithValidation(
                form.toObject(),
                submissionDataForEvaluation,
                submission._id.toString()
              );

            if (evaluation.status === 'completed') {
              successCount++;
              totalAccuracy += evaluation.accuracy || 0;
              totalConfidence += evaluation.confidence || 0;
            } else {
              failureCount++;
            }
          } catch (evaluationError: any) {
            console.error(
              `❌ AI evaluation failed for submission ${i + 1}:`,
              evaluationError.message
            );

            evaluation = {
              id: `eval_${submission._id}_${Date.now()}`,
              submissionId: submission._id.toString(),
              formType: formValidation.analysis.formType as any,
              sentiment: 'neutral' as const,
              categories: ['evaluation-failed'],
              evaluatedAt: new Date().toISOString(),
              status: 'failed' as const,
              feedback: `AI evaluation failed: ${evaluationError.message}`,
              confidence: 0,
              accuracy: 0,
            };
            failureCount++;

            errors.push({
              submissionId: submission._id.toString(),
              error: evaluationError.message,
            });
          }

          const submissionTime = Date.now() - submissionStartTime;
          evaluations.push(evaluation);
        } catch (error: any) {
          const submissionTime = Date.now() - submissionStartTime;
          console.error(`❌ Failed to process submission ${i + 1}:`, {
            submissionId: submission._id,
            error: error.message,
            time: `${submissionTime}ms`,
          });

          const failedEvaluation = {
            id: `eval_${submission._id}_failed_${Date.now()}`,
            submissionId: submission._id.toString(),
            formType: formValidation.analysis.formType as any,
            sentiment: 'neutral' as const,
            categories: ['processing-failed'],
            evaluatedAt: new Date().toISOString(),
            status: 'failed' as const,
            feedback: `Processing failed: ${error.message}`,
            confidence: 0,
            accuracy: 0,
          };

          evaluations.push(failedEvaluation);
          failureCount++;
          errors.push({
            submissionId: submission._id.toString(),
            error: error.message,
          });
        }

        // Progressive delay to avoid overwhelming AI service
        if (i < submissions.length - 1) {
          const delay = Math.min(1000, 200 + i * 50);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      const totalTime = Date.now() - startTime;
      const averageAccuracy =
        successCount > 0 ? totalAccuracy / successCount : 0;
      const averageConfidence =
        successCount > 0 ? totalConfidence / successCount : 0;

      res.json({
        success: true,
        data: evaluations,
        metadata: {
          totalEvaluations: evaluations.length,
          successful: successCount,
          failed: failureCount,
          totalTime,
          avgTimePerSubmission: Math.round(totalTime / submissions.length),
          averageAccuracy: Math.round(averageAccuracy * 10) / 10,
          averageConfidence: Math.round(averageConfidence * 10) / 10,
          expectedAccuracy: formValidation.analysis.expectedAccuracy,
          formId,
          formTitle: form.title,
          formType: formValidation.analysis.formType,
          processedAt: new Date().toISOString(),
          version: '3.1.0-file-upload-fixed',
          formAnalysis: formValidation.analysis,
          qualityMetrics: {
            averageDataQuality: Math.round(
              qualityResults.reduce((sum, q) => sum + q.quality, 0) /
                qualityResults.length
            ),
            lowQualityCount: qualityResults.filter(q => !q.isValid).length,
            highQualityCount: qualityResults.filter(q => q.quality >= 80)
              .length,
            submissionsWithFiles: qualityResults.filter(q => q.hasFiles).length,
            totalFiles: qualityResults.reduce((sum, q) => sum + q.fileCount, 0),
          },
          errors: errors.length > 0 ? errors : undefined,
        },
      });
    } catch (error: any) {
      const totalTime = Date.now() - startTime;
      console.error('batch evaluation error:', {
        formId,
        submissionIds: submissionIds?.length || 0,
        error: error.message,
        totalTime: `${totalTime}ms`,
      });

      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          error: 'BATCH_EVALUATION_ERROR',
          metadata: {
            totalTime,
            formId,
            submissionCount: submissionIds?.length || 0,
            timestamp: new Date().toISOString(),
            version: '3.1.0-file-upload-fixed',
          },
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Batch AI evaluation service temporarily unavailable',
          error: 'SERVICE_ERROR',
          metadata: {
            totalTime,
            formId,
            submissionCount: submissionIds?.length || 0,
            timestamp: new Date().toISOString(),
            version: '3.1.0-file-upload-fixed',
          },
          ...(process.env.NODE_ENV === 'development' && {
            details: error.message,
          }),
        });
      }
    }
  })
);

router.get(
  '/capabilities',
  protect,
  asyncHandler(async (req, res) => {
    try {
      const capabilities = aiEvaluationService.getEvaluationCapabilities();

      res.json({
        success: true,
        data: capabilities,
        metadata: {
          version: '3.0.0-accuracy-enhanced',
          enhanced: true,
          maxBatchSize: 20,
          supportedLanguages: ['en'],
          errorHandling: 'enhanced-with-quality-checks',
          accuracyFocused: true,
          formTypeRules: {
            quiz: '5+ single choice questions required',
            survey: '3+ rating fields recommended',
            feedback: '2+ feedback text fields recommended',
          },
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('Error getting AI evaluation capabilities:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get evaluation capabilities',
        error: 'SERVICE_ERROR',
      });
    }
  })
);

// @desc    Get evaluation statistics for a form with accuracy tracking
// @route   GET /api/ai-evaluation/stats/:formId
// @access  Private
router.get(
  '/stats/:formId',
  protect,
  asyncHandler(async (req, res) => {
    const { formId } = req.params;

    try {
      if (!mongoose.Types.ObjectId.isValid(formId)) {
        throw new ApiError('Invalid form ID format', 400);
      }

      // Verify form access
      const form = await Form.findOne({ _id: formId, userId: req.user.id });
      if (!form) {
        throw new ApiError('Form not found or access denied', 404);
      }

      // form analysis
      const formValidation = validateFormForEvaluation(form);

      // Get submission statistics
      const totalSubmissions = await Submission.countDocuments({ formId });

      let detectedFormType = 'general';
      let canEvaluate = false;
      let expectedAccuracy = 90;
      let requirements = [];

      if (formValidation.isValid && formValidation.analysis) {
        const analysis = formValidation.analysis;
        detectedFormType = analysis.formType;
        canEvaluate = analysis.canEvaluate;
        expectedAccuracy = analysis.expectedAccuracy;

        // Generate requirements based on current state
        requirements = analysis.reasons || [];

        if (!canEvaluate) {
          if (
            analysis.singleChoiceCount > 0 &&
            analysis.singleChoiceCount < 5
          ) {
            requirements.push(
              `Need ${5 - analysis.singleChoiceCount} more single choice questions for quiz classification`
            );
          }
          if (analysis.ratingFields > 0 && analysis.ratingFields < 3) {
            requirements.push(
              `Need ${3 - analysis.ratingFields} more rating fields for survey classification`
            );
          }
          if (analysis.feedbackFields > 0 && analysis.feedbackFields < 2) {
            requirements.push(
              `Need ${2 - analysis.feedbackFields} more feedback fields for feedback classification`
            );
          }
        }
      }

      const stats = {
        totalSubmissions,
        formType: detectedFormType,
        evaluationCapable: canEvaluate,
        expectedAccuracy,
        confidence: formValidation.analysis?.confidence || 0,
        lastEvaluated: null,
        requirements,
        supportedFeatures: canEvaluate
          ? [
              `AI-powered ${detectedFormType} analysis`,
              'Mathematical precision sentiment detection',
              'Performance scoring with confidence metrics',
              'Detailed explanations with accuracy tracking',
              `Expected ${expectedAccuracy}% accuracy`,
            ]
          : [
              'Basic data processing available',
              'Manual review recommended',
              'Form structure needs modification for AI evaluation',
            ],
        formAnalysis: formValidation.analysis || {
          totalFields: 0,
          evaluableFields: 0,
          singleChoiceCount: 0,
          ratingFields: 0,
          feedbackFields: 0,
        },
      };

      res.json({
        success: true,
        data: stats,
        metadata: {
          formId,
          formTitle: form.title,
          generatedAt: new Date().toISOString(),
          version: '3.0.0-accuracy-enhanced',
          analysisValid: formValidation.isValid,
        },
      });
    } catch (error: any) {
      console.error('Error getting evaluation stats:', error);

      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          error: 'EVALUATION_ERROR',
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'AI evaluation service temporarily unavailable',
          error: 'SERVICE_ERROR',
          ...(process.env.NODE_ENV === 'development' && {
            details: error.message,
          }),
        });
      }
    }
  })
);

export default router;
