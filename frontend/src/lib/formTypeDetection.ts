// src/utils/formTypeDetection.ts - Enhanced Client-Side Detection

export type FormType = 'quiz' | 'survey' | 'feedback' | 'general';

export interface FormTypeAnalysis {
  detectedType: FormType;
  confidence: 'high' | 'medium' | 'low';
  indicators: {
    quiz: number;
    survey: number;
    feedback: number;
  };
  reasoning: string[];
  shouldEvaluate: boolean;
}

/**
 * Enhanced form type detection that works with mixed content forms
 * @param formData - The form structure
 * @param submissionData - Optional submission data for additional context
 * @returns Detailed analysis of form type
 */
export const detectFormTypeEnhanced = (
  formData: any,
  submissionData?: any
): FormTypeAnalysis => {
  console.log('🔍 Enhanced client-side form type detection starting...', {
    title: formData?.title,
    pagesCount: formData?.pages?.length || 0,
    hasSubmissionData: !!submissionData,
  });

  const formTitle = formData?.title?.toLowerCase() || '';
  const formDescription = formData?.description?.toLowerCase() || '';

  let quizIndicators = 0;
  let surveyIndicators = 0;
  let feedbackIndicators = 0;
  const reasoning: string[] = [];

  // 1. Analyze title and description
  const titleDescText = formTitle + ' ' + formDescription;

  if (
    /quiz|test|exam|assessment|question|correct|answer|choose|select/.test(
      titleDescText
    )
  ) {
    quizIndicators += 3;
    reasoning.push('Title/description contains quiz-related keywords');
  }

  if (
    /survey|poll|research|opinion|rate|rating|satisfaction|scale|score/.test(
      titleDescText
    )
  ) {
    surveyIndicators += 3;
    reasoning.push('Title/description contains survey-related keywords');
  }

  if (
    /feedback|review|comment|experience|improve|suggestion|thoughts|opinion/.test(
      titleDescText
    )
  ) {
    feedbackIndicators += 3;
    reasoning.push('Title/description contains feedback-related keywords');
  }

  // 2. Analyze form structure
  let hasQuizFields = false;
  let hasSurveyFields = false;
  let hasFeedbackFields = false;
  let choiceFieldsWithAnswers = 0;
  let totalChoiceFields = 0;
  let longTextFields = 0;
  let ratingFields = 0;

  if (formData?.pages && Array.isArray(formData.pages)) {
    formData.pages.forEach((page: any) => {
      if (page.fields && Array.isArray(page.fields)) {
        page.fields.forEach((field: any) => {
          if (!field || field.type === 'heading') return;

          const fieldLabel = field.label?.toLowerCase() || '';

          // Analyze choice fields
          if (
            ['singleChoice', 'multipleChoice', 'dropdown'].includes(field.type)
          ) {
            totalChoiceFields++;

            // Quiz indicators
            if (
              field.correctAnswer ||
              /correct|answer|choose|select|which|what is|true|false/.test(
                fieldLabel
              )
            ) {
              quizIndicators += 2;
              hasQuizFields = true;
              choiceFieldsWithAnswers++;
            }

            // Survey indicators
            if (
              /rate|rating|satisfaction|quality|likely|recommend|scale|score|excellent|good|poor/.test(
                fieldLabel
              )
            ) {
              surveyIndicators += 2;
              hasSurveyFields = true;
              ratingFields++;
            }
          }

          // Analyze text fields
          if (['longText', 'paragraph', 'shortText'].includes(field.type)) {
            if (field.type === 'longText' || field.type === 'paragraph') {
              longTextFields++;
            }

            // Feedback indicators
            if (
              /feedback|comment|improve|experience|suggest|issue|problem|opinion|thoughts|recommendation/.test(
                fieldLabel
              )
            ) {
              feedbackIndicators += 2;
              hasFeedbackFields = true;
            }

            // Survey indicators for text fields
            if (
              /describe|explain|why|how|what.*think|opinion|additional.*comment/.test(
                fieldLabel
              )
            ) {
              surveyIndicators += 1;
            }
          }
        });
      }
    });
  }

  // 3. Analyze submission data if available
  if (submissionData && typeof submissionData === 'object') {
    const submissionText = Object.entries(submissionData)
      .map(([value]) => {
        if (typeof value === 'string') return value.toLowerCase();
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value).toLowerCase();
        }
        return String(value).toLowerCase();
      })
      .join(' ');

    if (
      /option|choice|answer|correct|wrong|true|false|select/.test(
        submissionText
      )
    ) {
      quizIndicators += 1;
      reasoning.push('Submission contains quiz-like responses');
    }

    if (
      /excellent|good|poor|satisfied|recommend|likely|rating|scale/.test(
        submissionText
      )
    ) {
      surveyIndicators += 1;
      reasoning.push('Submission contains survey-like responses');
    }

    if (
      /suggest|improve|better|issue|problem|feedback|comment/.test(
        submissionText
      )
    ) {
      feedbackIndicators += 1;
      reasoning.push('Submission contains feedback-like content');
    }
  }

  // 4. Add structural analysis to reasoning
  if (choiceFieldsWithAnswers > 0) {
    reasoning.push(
      `Found ${choiceFieldsWithAnswers} choice fields with correct answers`
    );
  }

  if (ratingFields > 0) {
    reasoning.push(`Found ${ratingFields} rating/satisfaction fields`);
  }

  if (longTextFields > 0) {
    reasoning.push(
      `Found ${longTextFields} long text fields for detailed responses`
    );
  }

  // 5. Determine form type with enhanced logic
  let detectedType: FormType = 'general';
  let confidence: 'high' | 'medium' | 'low' = 'low';

  // Quiz detection - needs both indicators AND quiz fields
  if (quizIndicators >= 2 && hasQuizFields) {
    detectedType = 'quiz';
    confidence = quizIndicators >= 5 ? 'high' : 'medium';
    reasoning.push(
      `Strong quiz indicators (${quizIndicators} points) with quiz fields present`
    );
  }
  // Survey detection - needs indicators AND survey-like fields
  else if (surveyIndicators >= 2 && (hasSurveyFields || ratingFields > 0)) {
    detectedType = 'survey';
    confidence = surveyIndicators >= 5 ? 'high' : 'medium';
    reasoning.push(
      `Strong survey indicators (${surveyIndicators} points) with survey fields present`
    );
  }
  // Feedback detection - needs indicators AND feedback fields
  else if (
    feedbackIndicators >= 2 &&
    (hasFeedbackFields || longTextFields > 0)
  ) {
    detectedType = 'feedback';
    confidence = feedbackIndicators >= 5 ? 'high' : 'medium';
    reasoning.push(
      `Strong feedback indicators (${feedbackIndicators} points) with feedback fields present`
    );
  }
  // Fallback logic - look for any significant indicators
  else if (
    quizIndicators >= surveyIndicators &&
    quizIndicators >= feedbackIndicators &&
    quizIndicators >= 1
  ) {
    detectedType = 'quiz';
    confidence = 'low';
    reasoning.push(
      `Weak quiz indicators (${quizIndicators} points) - low confidence`
    );
  } else if (surveyIndicators >= feedbackIndicators && surveyIndicators >= 1) {
    detectedType = 'survey';
    confidence = 'low';
    reasoning.push(
      `Weak survey indicators (${surveyIndicators} points) - low confidence`
    );
  } else if (feedbackIndicators >= 1) {
    detectedType = 'feedback';
    confidence = 'low';
    reasoning.push(
      `Weak feedback indicators (${feedbackIndicators} points) - low confidence`
    );
  }

  // Determine if form should be evaluated
  const shouldEvaluate =
    ['quiz', 'survey', 'feedback'].includes(detectedType) &&
    confidence !== 'low';

  const analysis: FormTypeAnalysis = {
    detectedType,
    confidence,
    indicators: {
      quiz: quizIndicators,
      survey: surveyIndicators,
      feedback: feedbackIndicators,
    },
    reasoning,
    shouldEvaluate,
  };

  console.log('🎯 Enhanced form type detection completed:', {
    detectedType,
    confidence,
    indicators: analysis.indicators,
    shouldEvaluate,
    reasoningCount: reasoning.length,
  });

  return analysis;
};

/**
 * Simple wrapper for backward compatibility
 */
export const detectFormTypeClient = (
  formData: any,
  submissionData?: any
): FormType => {
  const analysis = detectFormTypeEnhanced(formData, submissionData);
  return analysis.detectedType;
};

/**
 * Check if a form should be auto-evaluated
 */
export const shouldAutoEvaluateForm = (formData: any): boolean => {
  const analysis = detectFormTypeEnhanced(formData);
  return analysis.shouldEvaluate;
};

/**
 * Get detailed analysis for debugging
 */
export const getFormTypeAnalysis = (
  formData: any,
  submissionData?: any
): FormTypeAnalysis => {
  return detectFormTypeEnhanced(formData, submissionData);
};

/**
 * Validate if form has evaluable content
 */
export const hasEvaluableContent = (
  formData: any
): {
  hasContent: boolean;
  contentTypes: string[];
  fieldCounts: {
    choiceFields: number;
    textFields: number;
    choiceFieldsWithAnswers: number;
  };
} => {
  let choiceFields = 0;
  let textFields = 0;
  let choiceFieldsWithAnswers = 0;
  const contentTypes: string[] = [];

  if (formData?.pages && Array.isArray(formData.pages)) {
    formData.pages.forEach((page: any) => {
      if (page.fields && Array.isArray(page.fields)) {
        page.fields.forEach((field: any) => {
          if (!field || field.type === 'heading') return;

          if (
            ['singleChoice', 'multipleChoice', 'dropdown'].includes(field.type)
          ) {
            choiceFields++;
            if (field.correctAnswer) {
              choiceFieldsWithAnswers++;
            }
            if (!contentTypes.includes('choice')) {
              contentTypes.push('choice');
            }
          }

          if (['longText', 'paragraph', 'shortText'].includes(field.type)) {
            textFields++;
            if (!contentTypes.includes('text')) {
              contentTypes.push('text');
            }
          }
        });
      }
    });
  }

  const hasContent = choiceFields > 0 || textFields > 0;

  return {
    hasContent,
    contentTypes,
    fieldCounts: {
      choiceFields,
      textFields,
      choiceFieldsWithAnswers,
    },
  };
};
