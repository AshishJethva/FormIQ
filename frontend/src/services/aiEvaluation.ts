import axios from 'axios';
import { apiConfig } from '@/config/api';

export interface QuizEvaluationResult {
  correctAnswers: number;
  totalQuestions: number;
  percentage: number;
  explanations: Array<{
    questionId: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    explanation: string;
    isCorrect: boolean;
    confidence: number;
  }>;
  averageConfidence: number;
}

export interface SurveyEvaluationResult {
  overallSentiment: {
    positive: number;
    neutral: number;
    negative: number;
    confidence: number; // Confidence in sentiment analysis
  };
  keyMetrics: Array<{
    metric: string;
    value: number;
    trend: 'up' | 'down' | 'stable';
    confidence: number;
  }>;
  insights: string[];
  responseQuality: number;
  dataIntegrity: number; // How complete/consistent the responses are
}

export interface FeedbackEvaluationResult {
  criticalThemes: Array<{
    theme: string;
    frequency: number;
    severity: 'high' | 'medium' | 'low';
    examples: string[];
    confidence: number;
  }>;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
    confidence: number;
  };
  actionableInsights: string[];
  urgencyLevel: 'high' | 'medium' | 'low';
  qualityScore: number; // Overall feedback quality 0-100
}

export interface ApplicationEvaluationResult {
  overallScore: number; // 0-100 total score
  fieldCompletion: {
    totalFields: number;
    completedFields: number;
    completionPercentage: number;
    missingFields: string[];
    criticalMissing: string[];
  };
  qualificationMatching: {
    experienceScore: number; // 0-100
    educationScore: number; // 0-100
    skillsScore: number; // 0-100
    certificationsScore: number; // 0-100
    overallMatch: number; // 0-100
    strengths: string[];
    gaps: string[];
  };
  scoreBreakdown: {
    personalInfo: number; // 0-20
    experience: number; // 0-30
    education: number; // 0-20
    skills: number; // 0-20
    additional: number; // 0-10
  };
  keywordAnalysis: {
    relevantKeywords: Array<{
      keyword: string;
      category: 'skill' | 'technology' | 'certification' | 'experience';
      frequency: number;
      weight: number;
    }>;
    missingKeywords: string[];
    keywordScore: number; // 0-100
  };
  applicationStrength: 'excellent' | 'strong' | 'moderate' | 'weak';
  recommendedAction: 'hire' | 'interview' | 'consider' | 'reject';
  aiRecommendations: string[];
  confidence: number;
}

export interface AIEvaluationResult {
  id: string;
  submissionId: string;
  formType: 'quiz' | 'survey' | 'feedback' | 'application' | 'general';
  sentiment: 'positive' | 'neutral' | 'negative';
  categories: string[];
  evaluatedAt: string;
  status: 'completed' | 'failed';
  feedback: string;
  confidence: number;
  accuracy: number;

  quizResults?: QuizEvaluationResult;
  surveyResults?: SurveyEvaluationResult;
  feedbackResults?: FeedbackEvaluationResult;
  applicationResults?: ApplicationEvaluationResult;
}

export interface EvaluationResponse {
  success: boolean;
  data?: AIEvaluationResult;
  message?: string;
  error?: string;
  metadata?: {
    evaluationTime: number;
    formId: string;
    formTitle: string;
    formType: string;
    evaluatedAt: string;
    version: string;
    accuracy: number;
    confidence: number;
  };
}

export interface BatchEvaluationResponse {
  success: boolean;
  data?: AIEvaluationResult[];
  message?: string;
  error?: string;
  metadata?: {
    totalEvaluations: number;
    successful: number;
    failed: number;
    totalTime: number;
    avgTimePerSubmission: number;
    averageAccuracy: number;
    averageConfidence: number;
    formId: string;
    formTitle: string;
    processedAt: string;
    version: string;
    errors?: Array<{
      submissionId: string;
      error: string;
    }>;
  };
}

// Enhanced form type detection for frontend
interface ClientFormAnalysis {
  type: 'quiz' | 'survey' | 'feedback' | 'application' | 'general';
  confidence: number;
  reasons: string[];
  singleChoiceCount: number;
  requirements: {
    quiz: boolean;
    survey: boolean;
    feedback: boolean;
  };
}

class AIEvaluationService {
  private baseUrl: string;
  private timeout: number = 90000; // 90 seconds for enhanced AI operations

  constructor() {
    this.baseUrl = `${apiConfig.url}/ai-evaluation`;
  }

  // Enhanced client-side form type detection
  private analyzeFormType(formData: any): ClientFormAnalysis {
    const analysis: ClientFormAnalysis = {
      type: 'general',
      confidence: 0,
      reasons: [],
      singleChoiceCount: 0,
      requirements: {
        quiz: false,
        survey: false,
        feedback: false,
      },
    };

    if (!formData?.pages || !Array.isArray(formData.pages)) {
      analysis.reasons.push('No valid form structure');
      return analysis;
    }

    const formTitle = formData.title?.toLowerCase() || '';
    const formDescription = formData.description?.toLowerCase() || '';
    const titleDescText = `${formTitle} ${formDescription}`.trim();

    let ratingFields = 0;
    let feedbackFields = 0;
    let totalFields = 0;
    let hasCorrectAnswers = false;
    let choiceFieldsWithRatingOptions = 0;

    // APPLICATION DETECTION VARIABLES
    let hasPersonalInfoFields = 0;
    let hasWorkExperienceFields = 0;
    let hasEducationFields = 0;
    let hasSkillsFields = 0;
    let hasFileUploads = 0;
    let hasApplicationPatterns = false;
    let applicationFields = 0;

    // Analyze form fields
    formData.pages.forEach((page: any) => {
      if (page?.fields && Array.isArray(page.fields)) {
        page.fields.forEach((field: any) => {
          if (!field?.id || !field?.type || field.type === 'heading') return;

          totalFields++;
          const fieldLabel = field.label?.toLowerCase() || '';
          const fieldType = field.type.toLowerCase();

          // APPLICATION FIELD DETECTION

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

          // Skills and competencies detection
          if (
            /skills|abilities|competencies|expertise|technical.*skills|soft.*skills|programming.*languages|languages.*spoken|certifications|achievements|portfolio|references|availability|salary.*expectation|expected.*salary|start.*date|notice.*period|why.*interested|motivation|cover.*letter|additional.*information/i.test(
              fieldLabel
            )
          ) {
            hasSkillsFields++;
            applicationFields++;
            hasApplicationPatterns = true;
          }

          // File upload detection (resume, CV, portfolio)
          if (
            fieldType === 'fileupload' ||
            fieldType === 'image' ||
            /resume|cv|curriculum.*vitae|portfolio|cover.*letter|document|certificate|transcript|diploma|attachment|upload.*resume|upload.*cv/i.test(
              fieldLabel
            )
          ) {
            hasFileUploads++;
            if (/resume|cv|portfolio/i.test(fieldLabel)) {
              applicationFields++;
              hasApplicationPatterns = true;
            }
          }

          // QUIZ DETECTION: Count single choice questions
          if (fieldType === 'singlechoice' || fieldType === 'dropdown') {
            analysis.singleChoiceCount++;

            // Check for correctAnswer property (PRIMARY quiz indicator)
            if (
              field.correctAnswer ||
              (field.options &&
                field.options.some((opt: any) => opt.isCorrect)) ||
              /correct|answer|choose|select|which.*is|what.*is|true|false/i.test(
                fieldLabel
              )
            ) {
              hasCorrectAnswers = true;
            } else {
              // 🔧 FIXED: Check if this single choice has rating options (SURVEY, NOT QUIZ)
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

          // Multiple choice with correct answers (QUIZ)
          if (fieldType === 'multiplechoice') {
            if (field.correctAnswer || field.correctAnswers) {
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
                }
              }
            }
          }

          // SURVEY DETECTION: Rating/scale fields and choice fields with rating options
          if (
            fieldType === 'rating' ||
            fieldType === 'scale' ||
            /rate|rating|satisfaction|quality|likely|recommend|score|scale|1.*to.*10|1.*5|excellent.*poor/i.test(
              fieldLabel
            )
          ) {
            ratingFields++;
          }

          // FEEDBACK DETECTION: Text fields with feedback patterns
          if (
            (fieldType === 'longtext' || fieldType === 'paragraph') &&
            /feedback|comment|improve|experience|suggest|issue|problem|opinion|thoughts|recommendation|tell.*us|what.*do.*you.*think|how.*was|describe|explain|any.*additional/i.test(
              fieldLabel
            )
          ) {
            feedbackFields++;
          }
        });
      }
    });

    // Enhanced form type determination with STRICT priority order

    // PRIORITY 1: QUIZ CLASSIFICATION (HIGHEST PRIORITY)
    if (analysis.singleChoiceCount >= 5 && hasCorrectAnswers) {
      analysis.type = 'quiz';
      analysis.confidence = 100;
      analysis.requirements.quiz = true;
      analysis.reasons.push(
        `Found ${analysis.singleChoiceCount} single choice questions with correct answers (≥5 required for quiz)`
      );

      if (/quiz|test|exam|assessment/i.test(titleDescText)) {
        analysis.confidence = 100;
        analysis.reasons.push('Title/description confirms quiz/test nature');
      }

      return analysis;
    }

    // PRIORITY 2: APPLICATION CLASSIFICATION (NEW HIGH PRIORITY)
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
      analysis.type = 'application';
      analysis.confidence = Math.min(98, 60 + applicationScore * 4);
      analysis.requirements = { quiz: false, survey: false, feedback: false }; // Applications don't use the same requirements object
      analysis.reasons.push(
        `Application patterns detected: ${applicationFields} application-specific fields, structured candidate data collection`
      );

      if (applicationIndicators.title) {
        analysis.reasons.push('Application/job-related title/description');
      }
      if (applicationIndicators.hasPersonalInfo) {
        analysis.reasons.push(
          `${hasPersonalInfoFields} personal information fields`
        );
      }
      if (applicationIndicators.hasWorkExperience) {
        analysis.reasons.push(
          `${hasWorkExperienceFields} work experience fields`
        );
      }
      if (applicationIndicators.hasEducation) {
        analysis.reasons.push(
          `${hasEducationFields} education background fields`
        );
      }
      if (applicationIndicators.hasSkills) {
        analysis.reasons.push(
          `${hasSkillsFields} skills/qualifications fields`
        );
      }
      if (applicationIndicators.hasFileUpload) {
        analysis.reasons.push(
          `${hasFileUploads} file upload fields (resume/documents)`
        );
      }

      return analysis;
    }

    // PRIORITY 3: SURVEY CLASSIFICATION
    // Must have rating/scale elements WITHOUT correct answers
    const surveyIndicators = {
      title: /survey|poll|research|study|questionnaire/i.test(titleDescText),
      ratings: ratingFields >= 2,
      choiceRatings: choiceFieldsWithRatingOptions >= 2,
      structure: totalFields >= 5 && ratingFields >= 3,
    };

    const surveyScore = Object.values(surveyIndicators).filter(Boolean).length;

    if (
      surveyScore >= 2 ||
      ratingFields >= 3 ||
      choiceFieldsWithRatingOptions >= 2 ||
      (surveyIndicators.title && ratingFields >= 2)
    ) {
      analysis.type = 'survey';
      analysis.confidence = 60 + surveyScore * 15;
      analysis.requirements.survey = true;
      analysis.reasons.push(
        `Survey patterns detected: ${ratingFields} rating fields, ${choiceFieldsWithRatingOptions} choice fields with rating options`
      );

      if (surveyIndicators.title) {
        analysis.reasons.push('Title indicates survey/research');
      }

      return analysis;
    }

    // PRIORITY 4: FEEDBACK CLASSIFICATION
    // Focus on experience and improvement feedback
    const feedbackIndicators = {
      title: /feedback|review|comment|experience|testimonial/i.test(
        titleDescText
      ),
      textFields: feedbackFields >= 2,
      openEnded: feedbackFields >= totalFields * 0.4,
    };

    const feedbackScore =
      Object.values(feedbackIndicators).filter(Boolean).length;

    if (
      feedbackScore >= 2 ||
      (feedbackIndicators.title && feedbackFields >= 1)
    ) {
      analysis.type = 'feedback';
      analysis.confidence = 50 + feedbackScore * 20;
      analysis.requirements.feedback = true;
      analysis.reasons.push(
        `Feedback patterns detected: ${feedbackFields} feedback text fields`
      );

      if (feedbackIndicators.title) {
        analysis.reasons.push('Title indicates feedback/review');
      }

      return analysis;
    }

    // DEFAULT TO GENERAL
    analysis.type = 'general';
    analysis.confidence = 85;
    analysis.reasons.push(
      'No specific form type patterns detected - classified as general form'
    );

    return analysis;
  }

  // Utility function to validate sentiment percentages
  private validateSentimentPercentages(sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  }): boolean {
    const total = sentiment.positive + sentiment.neutral + sentiment.negative;
    const isValid = Math.abs(total - 100) <= 1; // Allow 1% tolerance for rounding

    if (!isValid) {
      console.warn(
        ` Sentiment percentages don't total 100%: ${total}%`,
        sentiment
      );
    }

    return isValid;
  }

  // Function to normalize sentiment percentages on frontend (as backup)
  private normalizeSentimentPercentages(sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  }): { positive: number; neutral: number; negative: number } {
    const positive = Math.max(0, Math.round(sentiment.positive));
    const neutral = Math.max(0, Math.round(sentiment.neutral));
    const negative = Math.max(0, Math.round(sentiment.negative));

    const total = positive + neutral + negative;

    if (total === 0) {
      return { positive: 0, neutral: 100, negative: 0 };
    }

    if (total === 100) {
      return { positive, neutral, negative };
    }

    // Normalize to exactly 100%
    const normalizedPositive = Math.round((positive / total) * 100);
    const normalizedNeutral = Math.round((neutral / total) * 100);
    const normalizedNegative = Math.round((negative / total) * 100);

    // Handle rounding discrepancies to ensure total is exactly 100
    const adjustedTotal =
      normalizedPositive + normalizedNeutral + normalizedNegative;
    let adjustedPositive = normalizedPositive;
    let adjustedNeutral = normalizedNeutral;
    let adjustedNegative = normalizedNegative;

    if (adjustedTotal !== 100) {
      const difference = 100 - adjustedTotal;
      const largest = Math.max(
        adjustedPositive,
        adjustedNeutral,
        adjustedNegative
      );

      if (adjustedPositive === largest) {
        adjustedPositive += difference;
      } else if (adjustedNeutral === largest) {
        adjustedNeutral += difference;
      } else {
        adjustedNegative += difference;
      }
    }

    return {
      positive: Math.max(0, Math.min(100, adjustedPositive)),
      neutral: Math.max(0, Math.min(100, adjustedNeutral)),
      negative: Math.max(0, Math.min(100, adjustedNegative)),
    };
  }

  // Process evaluation response and validate all data
  private processEvaluationResponse(
    response: EvaluationResponse
  ): EvaluationResponse {
    if (!response.success || !response.data) {
      return response;
    }

    const evaluation = response.data;

    // Validate and fix quiz results
    if (evaluation.quizResults) {
      // Ensure explanations have confidence scores
      evaluation.quizResults.explanations =
        evaluation.quizResults.explanations.map(exp => ({
          ...exp,
          confidence: exp.confidence || (exp.isCorrect ? 100 : 80),
        }));

      // Calculate average confidence if missing
      if (!evaluation.quizResults.averageConfidence) {
        const totalConfidence = evaluation.quizResults.explanations.reduce(
          (sum, exp) => sum + exp.confidence,
          0
        );
        evaluation.quizResults.averageConfidence =
          evaluation.quizResults.explanations.length > 0
            ? Math.round(
                totalConfidence / evaluation.quizResults.explanations.length
              )
            : 0;
      }
    }

    // Validate and fix survey sentiment
    if (evaluation.surveyResults?.overallSentiment) {
      const sentiment = evaluation.surveyResults.overallSentiment;

      if (!this.validateSentimentPercentages(sentiment)) {
        console.warn('🔧 Fixing survey sentiment percentages on frontend');
        const normalized = this.normalizeSentimentPercentages(sentiment);
        evaluation.surveyResults.overallSentiment = {
          ...normalized,
          confidence: sentiment.confidence || 75,
        };
      }

      // Ensure confidence score exists
      if (!sentiment.confidence) {
        evaluation.surveyResults.overallSentiment.confidence = 75;
      }

      // Validate metrics have confidence scores
      evaluation.surveyResults.keyMetrics =
        evaluation.surveyResults.keyMetrics.map(metric => ({
          ...metric,
          confidence: metric.confidence || 70,
        }));

      // Ensure data integrity score exists
      if (!evaluation.surveyResults.dataIntegrity) {
        evaluation.surveyResults.dataIntegrity = 85;
      }
    }

    // Validate and fix feedback sentiment
    if (evaluation.feedbackResults?.sentimentBreakdown) {
      const sentiment = evaluation.feedbackResults.sentimentBreakdown;

      if (!this.validateSentimentPercentages(sentiment)) {
        console.warn('🔧 Fixing feedback sentiment percentages on frontend');
        const normalized = this.normalizeSentimentPercentages(sentiment);
        evaluation.feedbackResults.sentimentBreakdown = {
          ...normalized,
          confidence: sentiment.confidence || 70,
        };
      }

      // Ensure confidence score exists
      if (!sentiment.confidence) {
        evaluation.feedbackResults.sentimentBreakdown.confidence = 70;
      }

      // Validate themes have confidence scores
      evaluation.feedbackResults.criticalThemes =
        evaluation.feedbackResults.criticalThemes.map(theme => ({
          ...theme,
          confidence: theme.confidence || 75,
        }));

      // Ensure quality score exists
      if (!evaluation.feedbackResults.qualityScore) {
        evaluation.feedbackResults.qualityScore = 75;
      }
    }

    // VALIDATE AND FIX APPLICATION RESULTS
    if (evaluation.applicationResults) {
      // Ensure all scores are within valid ranges
      evaluation.applicationResults.overallScore = Math.min(
        100,
        Math.max(0, evaluation.applicationResults.overallScore || 0)
      );

      // Validate field completion
      if (!evaluation.applicationResults.fieldCompletion) {
        evaluation.applicationResults.fieldCompletion = {
          totalFields: 0,
          completedFields: 0,
          completionPercentage: 0,
          missingFields: [],
          criticalMissing: [],
        };
      }

      // Validate qualification matching scores
      if (evaluation.applicationResults.qualificationMatching) {
        const qm = evaluation.applicationResults.qualificationMatching;
        qm.experienceScore = Math.min(
          100,
          Math.max(0, qm.experienceScore || 0)
        );
        qm.educationScore = Math.min(100, Math.max(0, qm.educationScore || 0));
        qm.skillsScore = Math.min(100, Math.max(0, qm.skillsScore || 0));
        qm.certificationsScore = Math.min(
          100,
          Math.max(0, qm.certificationsScore || 0)
        );
        qm.overallMatch = Math.min(100, Math.max(0, qm.overallMatch || 0));

        if (!qm.strengths) qm.strengths = ['Application completed'];
        if (!qm.gaps) qm.gaps = [];
      }

      // Validate score breakdown totals to 100
      if (evaluation.applicationResults.scoreBreakdown) {
        const sb = evaluation.applicationResults.scoreBreakdown;
        sb.personalInfo = Math.min(20, Math.max(0, sb.personalInfo || 0));
        sb.experience = Math.min(30, Math.max(0, sb.experience || 0));
        sb.education = Math.min(20, Math.max(0, sb.education || 0));
        sb.skills = Math.min(20, Math.max(0, sb.skills || 0));
        sb.additional = Math.min(10, Math.max(0, sb.additional || 0));
      }

      // Validate keyword analysis
      if (evaluation.applicationResults.keywordAnalysis) {
        const ka = evaluation.applicationResults.keywordAnalysis;
        ka.keywordScore = Math.min(100, Math.max(0, ka.keywordScore || 0));

        if (!ka.relevantKeywords) ka.relevantKeywords = [];
        if (!ka.missingKeywords) ka.missingKeywords = [];

        // Validate keyword structure
        ka.relevantKeywords = ka.relevantKeywords.filter(
          keyword =>
            keyword.keyword &&
            keyword.category &&
            ['skill', 'technology', 'certification', 'experience'].includes(
              keyword.category
            )
        );
      }

      // Validate application strength and recommendation
      if (
        !['excellent', 'strong', 'moderate', 'weak'].includes(
          evaluation.applicationResults.applicationStrength
        )
      ) {
        evaluation.applicationResults.applicationStrength = 'moderate';
      }

      if (
        !['hire', 'interview', 'consider', 'reject'].includes(
          evaluation.applicationResults.recommendedAction
        )
      ) {
        evaluation.applicationResults.recommendedAction = 'consider';
      }

      // Ensure confidence score exists
      if (!evaluation.applicationResults.confidence) {
        evaluation.applicationResults.confidence = 75;
      }

      // Validate AI recommendations
      if (
        !evaluation.applicationResults.aiRecommendations ||
        evaluation.applicationResults.aiRecommendations.length === 0
      ) {
        evaluation.applicationResults.aiRecommendations = [
          'Review application completeness',
          'Assess qualification match for role requirements',
          'Consider candidate for next stage if scores meet criteria',
        ];
      }
    }

    // Ensure overall confidence and accuracy exist
    if (!evaluation.confidence) {
      evaluation.confidence = 85;
    }
    if (!evaluation.accuracy) {
      evaluation.accuracy = 90;
    }

    return response;
  }

  // Enhanced error handling for AI evaluation responses
  private handleEvaluationError(error: any): {
    success: false;
    message: string;
    error: string;
    isRetryable: boolean;
    suggestedDelay: number;
  } {
    console.error('❌ AI Evaluation Error:', error);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          return {
            success: false,
            message: data.message || 'Invalid request data or form structure',
            error: 'VALIDATION_ERROR',
            isRetryable: false,
            suggestedDelay: 0,
          };
        case 401:
          return {
            success: false,
            message: 'Authentication required - please sign in again',
            error: 'AUTH_ERROR',
            isRetryable: false,
            suggestedDelay: 0,
          };
        case 403:
          return {
            success: false,
            message: 'Not authorized to evaluate this submission',
            error: 'PERMISSION_ERROR',
            isRetryable: false,
            suggestedDelay: 0,
          };
        case 404:
          return {
            success: false,
            message: 'Submission or form not found',
            error: 'NOT_FOUND_ERROR',
            isRetryable: false,
            suggestedDelay: 0,
          };
        case 429:
          return {
            success: false,
            message:
              'Too many evaluation requests. Please wait before trying again.',
            error: 'RATE_LIMIT_ERROR',
            isRetryable: true,
            suggestedDelay: 5000,
          };
        case 500:
          return {
            success: false,
            message:
              'AI evaluation service temporarily unavailable. Please try again.',
            error: 'SERVICE_ERROR',
            isRetryable: true,
            suggestedDelay: 3000,
          };
        case 503:
          return {
            success: false,
            message:
              'AI service is currently overloaded. Please try again in a few minutes.',
            error: 'SERVICE_OVERLOAD',
            isRetryable: true,
            suggestedDelay: 10000,
          };
        default:
          return {
            success: false,
            message: `Unexpected error (${status}): ${
              data.message || 'Unknown error'
            }`,
            error: 'UNKNOWN_ERROR',
            isRetryable: true,
            suggestedDelay: 3000,
          };
      }
    } else if (error.request) {
      return {
        success: false,
        message: 'Network error: Unable to connect to AI evaluation service',
        error: 'NETWORK_ERROR',
        isRetryable: true,
        suggestedDelay: 2000,
      };
    } else {
      return {
        success: false,
        message: 'Request setup error: ' + error.message,
        error: 'REQUEST_ERROR',
        isRetryable: false,
        suggestedDelay: 0,
      };
    }
  }

  // Get authentication headers
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Enhanced retry logic for AI operations with progressive delays
  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 2000
  ): Promise<T> {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        const errorInfo = this.handleEvaluationError(error);

        if (!errorInfo.isRetryable || attempt === maxRetries) {
          throw error;
        }

        // Use suggested delay or calculate with exponential backoff
        const delay =
          errorInfo.suggestedDelay > 0
            ? errorInfo.suggestedDelay
            : baseDelay * Math.pow(1.5, attempt);

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  // Enhanced single submission evaluation
  async evaluateSubmission(submissionId: string): Promise<EvaluationResponse> {
    try {
      if (!submissionId || submissionId.trim() === '') {
        return {
          success: false,
          message: 'Submission ID is required for evaluation',
          error: 'INVALID_INPUT',
        };
      }

      const operation = async () => {
        const response = await axios.post(
          `${this.baseUrl}/evaluate/${submissionId}`,
          {},
          {
            headers: this.getAuthHeaders(),
            timeout: this.timeout,
          }
        );
        return response.data;
      };

      const result = await this.retryOperation(operation);

      // Process and validate the response
      const processedResult = this.processEvaluationResponse(result);

      return processedResult;
    } catch (error: any) {
      console.error('❌ AI evaluation failed:', error);
      const errorInfo = this.handleEvaluationError(error);

      return {
        success: false,
        message: errorInfo.message,
        error: errorInfo.error,
      };
    }
  }

  // Enhanced batch evaluation with accuracy tracking
  async evaluateBatch(
    formId: string,
    submissionIds: string[]
  ): Promise<BatchEvaluationResponse> {
    try {
      if (!formId || !submissionIds || submissionIds.length === 0) {
        return {
          success: false,
          message:
            'Form ID and submission IDs are required for batch evaluation',
          error: 'INVALID_INPUT',
        };
      }

      if (submissionIds.length > 20) {
        return {
          success: false,
          message:
            'Maximum 20 submissions can be evaluated at once for optimal accuracy',
          error: 'BATCH_SIZE_LIMIT',
        };
      }

      const operation = async () => {
        const response = await axios.post(
          `${this.baseUrl}/evaluate-batch`,
          {
            formId,
            submissionIds,
          },
          {
            headers: this.getAuthHeaders(),
            timeout: this.timeout * 2, // Double timeout for batch operations
          }
        );
        return response.data;
      };

      const result = await this.retryOperation(operation, 2); // Fewer retries for batch

      // Process batch results and validate all evaluation data
      if (result.success && result.data && Array.isArray(result.data)) {
        result.data.forEach((evaluation: AIEvaluationResult) => {
          // Validate and fix survey sentiment if needed
          if (evaluation.surveyResults?.overallSentiment) {
            const sentiment = evaluation.surveyResults.overallSentiment;

            if (!this.validateSentimentPercentages(sentiment)) {
              console.warn(
                `🔧 Fixing survey sentiment for submission ${evaluation.submissionId}`
              );
              const normalized = this.normalizeSentimentPercentages(sentiment);
              evaluation.surveyResults.overallSentiment = {
                ...normalized,
                confidence: sentiment.confidence || 75,
              };
            }
          }

          // Validate and fix feedback sentiment if needed
          if (evaluation.feedbackResults?.sentimentBreakdown) {
            const sentiment = evaluation.feedbackResults.sentimentBreakdown;

            if (!this.validateSentimentPercentages(sentiment)) {
              console.warn(
                `🔧 Fixing feedback sentiment for submission ${evaluation.submissionId}`
              );
              const normalized = this.normalizeSentimentPercentages(sentiment);
              evaluation.feedbackResults.sentimentBreakdown = {
                ...normalized,
                confidence: sentiment.confidence || 70,
              };
            }
          }

          // Ensure confidence and accuracy scores exist
          if (!evaluation.confidence) evaluation.confidence = 85;
          if (!evaluation.accuracy) evaluation.accuracy = 90;
        });

        // Calculate batch statistics
        const successfulEvaluations = result.data.filter(
          (e: AIEvaluationResult) => e.status === 'completed'
        );
        const averageAccuracy =
          successfulEvaluations.length > 0
            ? successfulEvaluations.reduce(
                (sum: number, e: AIEvaluationResult) => sum + e.accuracy,
                0
              ) / successfulEvaluations.length
            : 0;
        const averageConfidence =
          successfulEvaluations.length > 0
            ? successfulEvaluations.reduce(
                (sum: number, e: AIEvaluationResult) => sum + e.confidence,
                0
              ) / successfulEvaluations.length
            : 0;

        // Add enhanced metadata
        if (result.metadata) {
          result.metadata.averageAccuracy =
            Math.round(averageAccuracy * 10) / 10;
          result.metadata.averageConfidence =
            Math.round(averageConfidence * 10) / 10;
        }
      }

      return result;
    } catch (error: any) {
      console.error('❌ Batch AI evaluation failed:', error);
      const errorInfo = this.handleEvaluationError(error);

      return {
        success: false,
        message: errorInfo.message,
        error: errorInfo.error,
      };
    }
  }

  // Get enhanced evaluation capabilities with accuracy information
  async getCapabilities(): Promise<{
    success: boolean;
    data?: any;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await axios.get(`${this.baseUrl}/capabilities`, {
        headers: this.getAuthHeaders(),
        timeout: 10000,
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get AI capabilities:', error);
      const errorInfo = this.handleEvaluationError(error);

      return {
        success: false,
        message: errorInfo.message,
        error: errorInfo.error,
      };
    }
  }

  // Get evaluation statistics for a form with accuracy tracking
  async getFormStats(formId: string): Promise<{
    success: boolean;
    data?: any;
    message?: string;
    error?: string;
  }> {
    try {
      if (!formId || formId.trim() === '') {
        return {
          success: false,
          message: 'Form ID is required for statistics',
          error: 'INVALID_INPUT',
        };
      }

      const response = await axios.get(`${this.baseUrl}/stats/${formId}`, {
        headers: this.getAuthHeaders(),
        timeout: 10000,
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get form stats:', error);
      const errorInfo = this.handleEvaluationError(error);

      return {
        success: false,
        message: errorInfo.message,
        error: errorInfo.error,
      };
    }
  }

  // Enhanced form type detection for client-side validation
  detectFormType(formData: any): {
    type: 'quiz' | 'survey' | 'feedback' | 'application' | 'general';
    confidence: number;
    reasons: string[];
    canEvaluate: boolean;
    requiredForEvaluation: string[];
  } {
    const analysis = this.analyzeFormType(formData);

    const canEvaluate = analysis.type !== 'general';
    const requiredForEvaluation: string[] = [];

    if (analysis.type === 'quiz' && analysis.singleChoiceCount < 5) {
      requiredForEvaluation.push(
        `Need ${
          5 - analysis.singleChoiceCount
        } more single choice questions for quiz classification`
      );
    }

    if (analysis.type === 'survey' && !analysis.requirements.survey) {
      requiredForEvaluation.push(
        'Need rating/scale fields and survey patterns for accurate analysis'
      );
    }

    if (analysis.type === 'feedback' && !analysis.requirements.feedback) {
      requiredForEvaluation.push(
        'Need feedback text fields and relevant patterns for accurate analysis'
      );
    }

    // APPLICATION REQUIREMENTS VALIDATION
    if (analysis.type === 'application') {
      // Applications are always evaluable if detected, but we can provide improvement suggestions
      const formTitle = formData.title?.toLowerCase() || '';
      const formDescription = formData.description?.toLowerCase() || '';
      const titleDescText = `${formTitle} ${formDescription}`;

      let hasPersonalInfoFields = 0;
      let hasWorkExperienceFields = 0;
      let hasEducationFields = 0;
      let hasFileUploads = 0;

      // Check if title/description indicates specific application type for targeted suggestions
      const isJobApplication =
        /job|position|employment|career|hiring|recruitment/i.test(
          titleDescText
        );
      const isInternshipApplication =
        /intern|internship|trainee|graduate/i.test(titleDescText);
      const isVolunteerApplication = /volunteer|volunteering|community/i.test(
        titleDescText
      );
      const isMembershipApplication =
        /member|membership|join|registration/i.test(titleDescText);

      // Quick re-analysis for requirements
      if (formData?.pages) {
        formData.pages.forEach((page: any) => {
          if (page?.fields) {
            page.fields.forEach((field: any) => {
              const fieldLabel = field.label?.toLowerCase() || '';
              const fieldType = field.type?.toLowerCase() || '';

              if (
                fieldType === 'fullname' ||
                fieldType === 'email' ||
                fieldType === 'phone' ||
                /full.*name|email|phone|address|contact/i.test(fieldLabel)
              ) {
                hasPersonalInfoFields++;
              }

              if (
                /work.*experience|job.*experience|employment|position|company/i.test(
                  fieldLabel
                )
              ) {
                hasWorkExperienceFields++;
              }

              if (
                /education|school|university|degree|diploma/i.test(fieldLabel)
              ) {
                hasEducationFields++;
              }

              if (
                fieldType === 'fileupload' ||
                /resume|cv|portfolio/i.test(fieldLabel)
              ) {
                hasFileUploads++;
              }
            });
          }
        });
      }

      // Provide optimization suggestions based on application type and current fields
      if (hasPersonalInfoFields < 2) {
        if (isJobApplication || isInternshipApplication) {
          requiredForEvaluation.push(
            'Add more personal information fields (name, email, phone, address) for comprehensive job application evaluation'
          );
        } else if (isMembershipApplication) {
          requiredForEvaluation.push(
            'Add more personal information fields for complete membership application processing'
          );
        } else {
          requiredForEvaluation.push(
            'Consider adding more personal information fields for comprehensive evaluation'
          );
        }
      }

      if (hasWorkExperienceFields < 1) {
        if (isJobApplication) {
          requiredForEvaluation.push(
            'Add work experience fields for proper job qualification matching'
          );
        } else if (isInternshipApplication) {
          requiredForEvaluation.push(
            'Add work/project experience fields for internship candidate assessment'
          );
        } else if (isVolunteerApplication) {
          requiredForEvaluation.push(
            'Add volunteer/community experience fields for better candidate matching'
          );
        } else {
          requiredForEvaluation.push(
            'Add work experience fields for better qualification matching'
          );
        }
      }

      if (hasEducationFields < 1) {
        if (isJobApplication || isInternshipApplication) {
          requiredForEvaluation.push(
            'Add education background fields for complete candidate assessment'
          );
        } else {
          requiredForEvaluation.push(
            'Add education background fields for complete assessment'
          );
        }
      }

      if (hasFileUploads < 1) {
        if (isJobApplication) {
          requiredForEvaluation.push(
            'Add file upload field for resume/CV to enable comprehensive document analysis and skills extraction'
          );
        } else if (isInternshipApplication) {
          requiredForEvaluation.push(
            'Add file upload field for resume/transcript to enable academic and skills assessment'
          );
        } else if (isVolunteerApplication) {
          requiredForEvaluation.push(
            'Add file upload field for background documents to enable volunteer screening'
          );
        } else if (isMembershipApplication) {
          requiredForEvaluation.push(
            'Add file upload field for supporting documents to enable membership verification'
          );
        } else {
          requiredForEvaluation.push(
            'Add file upload field for resume/CV to enable document analysis'
          );
        }
      }

      // Additional suggestions based on application type
      if (
        isJobApplication &&
        hasPersonalInfoFields >= 2 &&
        hasWorkExperienceFields >= 1 &&
        hasEducationFields >= 1 &&
        hasFileUploads >= 1
      ) {
        requiredForEvaluation.push(
          'Excellent job application structure! Consider adding skills assessment or reference fields for even more comprehensive evaluation.'
        );
      } else if (
        isInternshipApplication &&
        hasPersonalInfoFields >= 2 &&
        hasEducationFields >= 1
      ) {
        requiredForEvaluation.push(
          'Good internship application foundation! Consider adding project experience or academic achievement fields.'
        );
      }
    }

    return {
      type: analysis.type,
      confidence: analysis.confidence,
      reasons: analysis.reasons,
      canEvaluate,
      requiredForEvaluation,
    };
  }

  // Validation helpers for sentiment data with enhanced checks
  validateEvaluationResult(evaluation: AIEvaluationResult): {
    isValid: boolean;
    issues: string[];
    accuracy: number;
  } {
    const issues: string[] = [];
    let accuracy = evaluation.accuracy || 90;

    // Check score breakdown totals
    if (evaluation.applicationResults?.scoreBreakdown) {
      const scoreBreakdown = evaluation.applicationResults.scoreBreakdown;
      const total =
        scoreBreakdown.personalInfo +
        scoreBreakdown.experience +
        scoreBreakdown.education +
        scoreBreakdown.skills +
        scoreBreakdown.additional;

      if (total > 100) {
        issues.push('Score breakdown exceeds 100%');
        accuracy -= 10;
      }

      // Validate individual scores
      if (scoreBreakdown.personalInfo > 20) {
        issues.push('Personal info score exceeds maximum (20)');
        accuracy -= 3;
      }
      if (scoreBreakdown.experience > 30) {
        issues.push('Experience score exceeds maximum (30)');
        accuracy -= 3;
      }
      if (scoreBreakdown.education > 20) {
        issues.push('Education score exceeds maximum (20)');
        accuracy -= 3;
      }
      if (scoreBreakdown.skills > 20) {
        issues.push('Skills score exceeds maximum (20)');
        accuracy -= 3;
      }
      if (scoreBreakdown.additional > 10) {
        issues.push('Additional score exceeds maximum (10)');
        accuracy -= 3;
      }
    }

    // Check qualification scores
    if (evaluation.applicationResults?.qualificationMatching) {
      const qm = evaluation.applicationResults.qualificationMatching;

      if (qm.experienceScore > 100 || qm.experienceScore < 0) {
        issues.push('Invalid experience score range');
        accuracy -= 5;
      }
      if (qm.educationScore > 100 || qm.educationScore < 0) {
        issues.push('Invalid education score range');
        accuracy -= 5;
      }
      if (qm.skillsScore > 100 || qm.skillsScore < 0) {
        issues.push('Invalid skills score range');
        accuracy -= 5;
      }
      if (qm.certificationsScore > 100 || qm.certificationsScore < 0) {
        issues.push('Invalid certifications score range');
        accuracy -= 5;
      }
      if (qm.overallMatch > 100 || qm.overallMatch < 0) {
        issues.push('Invalid overall match score range');
        accuracy -= 5;
      }

      if (!qm.strengths || qm.strengths.length === 0) {
        issues.push('Missing candidate strengths analysis');
        accuracy -= 3;
      }
    }

    // Check field completion
    if (evaluation.applicationResults?.fieldCompletion) {
      const fc = evaluation.applicationResults.fieldCompletion;

      if (fc.completionPercentage > 100 || fc.completionPercentage < 0) {
        issues.push('Invalid completion percentage');
        accuracy -= 5;
      }

      if (fc.completedFields > fc.totalFields) {
        issues.push('Completed fields exceeds total fields');
        accuracy -= 5;
      }
    }

    // Check keyword analysis
    if (evaluation.applicationResults?.keywordAnalysis) {
      const ka = evaluation.applicationResults.keywordAnalysis;

      if (ka.keywordScore > 100 || ka.keywordScore < 0) {
        issues.push('Invalid keyword score range');
        accuracy -= 3;
      }

      // Validate keyword structure
      ka.relevantKeywords.forEach(
        (
          keyword: {
            keyword: string;
            category: 'skill' | 'technology' | 'certification' | 'experience';
            frequency: number;
            weight: number;
          },
          index: number
        ) => {
          if (!keyword.keyword || !keyword.category) {
            issues.push(`Invalid keyword structure at index ${index}`);
            accuracy -= 1;
          }
          if (
            !['skill', 'technology', 'certification', 'experience'].includes(
              keyword.category
            )
          ) {
            issues.push(`Invalid keyword category: ${keyword.category}`);
            accuracy -= 1;
          }
        }
      );
    }

    // Check overall score
    if (
      evaluation.applicationResults &&
      (evaluation.applicationResults.overallScore > 100 ||
        evaluation.applicationResults.overallScore < 0)
    ) {
      issues.push('Invalid overall score range');
      accuracy -= 10;
    }

    // Check application strength
    if (
      evaluation.applicationResults &&
      !['excellent', 'strong', 'moderate', 'weak'].includes(
        evaluation.applicationResults.applicationStrength
      )
    ) {
      issues.push('Invalid application strength value');
      accuracy -= 3;
    }

    // Check recommendation
    if (
      evaluation.applicationResults &&
      !['hire', 'interview', 'consider', 'reject'].includes(
        evaluation.applicationResults.recommendedAction
      )
    ) {
      issues.push('Invalid recommendation action');
      accuracy -= 3;
    }

    // Check survey sentiment if present
    if (evaluation.surveyResults?.overallSentiment) {
      if (
        !this.validateSentimentPercentages(
          evaluation.surveyResults.overallSentiment
        )
      ) {
        issues.push('Survey sentiment percentages do not total 100%');
        accuracy -= 5;
      }
      if (!evaluation.surveyResults.overallSentiment.confidence) {
        issues.push('Missing confidence score for survey sentiment');
        accuracy -= 2;
      }
    }

    // Check feedback sentiment if present
    if (evaluation.feedbackResults?.sentimentBreakdown) {
      if (
        !this.validateSentimentPercentages(
          evaluation.feedbackResults.sentimentBreakdown
        )
      ) {
        issues.push('Feedback sentiment percentages do not total 100%');
        accuracy -= 5;
      }
      if (!evaluation.feedbackResults.sentimentBreakdown.confidence) {
        issues.push('Missing confidence score for feedback sentiment');
        accuracy -= 2;
      }
    }

    // Check quiz results if present
    if (evaluation.quizResults) {
      const missingConfidence = evaluation.quizResults.explanations.filter(
        exp => !exp.confidence
      ).length;
      if (missingConfidence > 0) {
        issues.push(
          `${missingConfidence} quiz explanations missing confidence scores`
        );
        accuracy -= missingConfidence;
      }
    }

    // Check basic evaluation structure
    if (!evaluation.id || !evaluation.submissionId) {
      issues.push('Missing required evaluation identifiers');
      accuracy -= 10;
    }

    if (
      !['quiz', 'survey', 'feedback', 'general'].includes(evaluation.formType)
    ) {
      issues.push('Invalid form type');
      accuracy -= 5;
    }

    if (!['positive', 'neutral', 'negative'].includes(evaluation.sentiment)) {
      issues.push('Invalid overall sentiment');
      accuracy -= 3;
    }

    if (
      !evaluation.confidence ||
      evaluation.confidence < 0 ||
      evaluation.confidence > 100
    ) {
      issues.push('Invalid or missing confidence score');
      accuracy -= 5;
    }

    return {
      isValid: issues.length === 0,
      issues,
      accuracy: Math.max(0, Math.min(100, accuracy)),
    };
  }

  getApplicationSummary(application: ApplicationEvaluationResult): {
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    description: string;
    recommendation: string;
    topStrengths: string[];
    criticalGaps: string[];
    keywordMatch: 'high' | 'medium' | 'low';
  } {
    const score = application.overallScore;

    let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'C';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    let description = '';
    switch (application.applicationStrength) {
      case 'excellent':
        description = 'Outstanding candidate with exceptional qualifications';
        break;
      case 'strong':
        description = 'Strong candidate with solid qualifications and good fit';
        break;
      case 'moderate':
        description = 'Decent candidate with some relevant qualifications';
        break;
      case 'weak':
        description = 'Candidate needs significant development or better match';
        break;
    }

    let recommendation = '';
    switch (application.recommendedAction) {
      case 'hire':
        recommendation = 'Strong recommendation to proceed with hiring process';
        break;
      case 'interview':
        recommendation = 'Recommend for interview to assess further';
        break;
      case 'consider':
        recommendation = 'Consider for role based on specific requirements';
        break;
      case 'reject':
        recommendation = 'Does not meet minimum requirements for this position';
        break;
    }

    const topStrengths = application.qualificationMatching.strengths.slice(
      0,
      3
    );
    const criticalGaps = application.qualificationMatching.gaps.slice(0, 3);

    let keywordMatch: 'high' | 'medium' | 'low' = 'medium';
    if (application.keywordAnalysis.keywordScore >= 80) keywordMatch = 'high';
    else if (application.keywordAnalysis.keywordScore < 60)
      keywordMatch = 'low';

    return {
      grade,
      description,
      recommendation,
      topStrengths,
      criticalGaps,
      keywordMatch,
    };
  }

  formatApplicationDisplay(application: ApplicationEvaluationResult): string {
    const summary = this.getApplicationSummary(application);

    return (
      `Grade ${summary.grade} (${application.overallScore}%) - ${summary.description}. ` +
      `Field completion: ${application.fieldCompletion.completionPercentage}%. ` +
      `Qualification match: ${application.qualificationMatching.overallMatch}%. ` +
      `Keyword analysis: ${application.keywordAnalysis.keywordScore}% (${summary.keywordMatch}). ` +
      `Recommendation: ${application.recommendedAction}.`
    );
  }

  // Enhanced utility methods for sentiment analysis
  isSentimentAccurate(sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  }): boolean {
    return this.validateSentimentPercentages(sentiment);
  }

  getSentimentSummary(sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    confidence?: number;
  }): {
    dominant: 'positive' | 'neutral' | 'negative';
    description: string;
    isBalanced: boolean;
    confidence: number;
    reliability: 'high' | 'medium' | 'low';
  } {
    const { positive, neutral, negative } = sentiment;
    const confidence = sentiment.confidence || 75;

    let dominant: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (positive > neutral && positive > negative) {
      dominant = 'positive';
    } else if (negative > neutral && negative > positive) {
      dominant = 'negative';
    }

    let description = '';
    if (positive >= 80) {
      description = 'Overwhelmingly positive response';
    } else if (positive >= 60) {
      description = 'Mostly positive response';
    } else if (negative >= 80) {
      description = 'Overwhelmingly negative response';
    } else if (negative >= 60) {
      description = 'Mostly negative response';
    } else if (neutral >= 60) {
      description = 'Neutral response';
    } else {
      description = 'Mixed response with varying sentiments';
    }

    const isBalanced = positive <= 50 && neutral <= 50 && negative <= 50;

    let reliability: 'high' | 'medium' | 'low' = 'medium';
    if (confidence >= 85) {
      reliability = 'high';
    } else if (confidence < 60) {
      reliability = 'low';
    }

    return {
      dominant,
      description,
      isBalanced,
      confidence,
      reliability,
    };
  }

  formatSentimentDisplay(sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    confidence?: number;
  }): string {
    const conf = sentiment.confidence
      ? ` (${sentiment.confidence}% confidence)`
      : '';
    return `${sentiment.positive}% Positive, ${sentiment.neutral}% Neutral, ${sentiment.negative}% Negative${conf}`;
  }

  // Enhanced error handling and user feedback
  getUserFriendlyErrorMessage(error: string): string {
    const errorMessages: Record<string, string> = {
      VALIDATION_ERROR:
        'The form structure does not meet the requirements for AI evaluation. Please ensure: QUIZ forms need 5+ single choice questions with correct answers, APPLICATION forms need 2+ personal info fields + work experience/education + file upload, SURVEY forms need 3+ rating fields or choice fields with rating options, FEEDBACK forms need 2+ feedback-focused text fields.',
      AUTH_ERROR:
        'Your session has expired. Please sign in again to continue with AI evaluation.',
      PERMISSION_ERROR:
        'You do not have permission to evaluate this submission. Please check your access rights.',
      NOT_FOUND_ERROR:
        'The submission or form could not be found. It may have been deleted or moved.',
      RATE_LIMIT_ERROR:
        'Too many evaluation requests in a short time. Please wait a moment before trying again to ensure optimal accuracy.',
      SERVICE_ERROR:
        'The AI evaluation service is temporarily unavailable. Our systems are working to restore full functionality.',
      SERVICE_OVERLOAD:
        'The AI service is currently processing many requests. Please try again in a few minutes for the best results.',
      NETWORK_ERROR:
        'Unable to connect to the evaluation service. Please check your internet connection and try again.',
      BATCH_SIZE_LIMIT:
        'Too many submissions selected for batch evaluation. Please select up to 20 submissions for optimal processing and accuracy.',
      INVALID_INPUT:
        'Invalid information provided. Please check your request and try again.',
      UNKNOWN_ERROR:
        'An unexpected error occurred during evaluation. Please try again or contact support if the issue persists.',
    };

    return errorMessages[error] || errorMessages.UNKNOWN_ERROR;
  }

  isRetryableError(error: string): boolean {
    const retryableErrors = [
      'RATE_LIMIT_ERROR',
      'SERVICE_ERROR',
      'SERVICE_OVERLOAD',
      'NETWORK_ERROR',
      'UNKNOWN_ERROR',
    ];

    return retryableErrors.includes(error);
  }

  getRetryDelay(error: string): number {
    const delayMap: Record<string, number> = {
      RATE_LIMIT_ERROR: 5000,
      SERVICE_ERROR: 3000,
      SERVICE_OVERLOAD: 10000,
      NETWORK_ERROR: 2000,
      UNKNOWN_ERROR: 3000,
    };

    return delayMap[error] || 3000;
  }

  // Enhanced accuracy tracking methods
  calculateOverallAccuracy(evaluations: AIEvaluationResult[]): {
    overall: number;
    byType: Record<string, number>;
    confidence: number;
    reliability: 'high' | 'medium' | 'low';
  } {
    if (evaluations.length === 0) {
      return { overall: 0, byType: {}, confidence: 0, reliability: 'low' };
    }

    const successful = evaluations.filter(
      (e: AIEvaluationResult) => e.status === 'completed'
    );
    const overall =
      successful.length > 0
        ? successful.reduce(
            (sum: number, e: AIEvaluationResult) => sum + e.accuracy,
            0
          ) / successful.length
        : 0;

    const confidence =
      successful.length > 0
        ? successful.reduce(
            (sum: number, e: AIEvaluationResult) => sum + e.confidence,
            0
          ) / successful.length
        : 0;

    const byType: Record<string, number> = {};
    ['quiz', 'survey', 'feedback', 'general'].forEach((type: string) => {
      const typeEvals = successful.filter(
        (e: AIEvaluationResult) => e.formType === type
      );
      if (typeEvals.length > 0) {
        byType[type] =
          typeEvals.reduce(
            (sum: number, e: AIEvaluationResult) => sum + e.accuracy,
            0
          ) / typeEvals.length;
      }
    });

    let reliability: 'high' | 'medium' | 'low' = 'medium';
    if (overall >= 95 && confidence >= 85) {
      reliability = 'high';
    } else if (overall < 80 || confidence < 60) {
      reliability = 'low';
    }

    return {
      overall: Math.round(overall * 10) / 10,
      byType,
      confidence: Math.round(confidence * 10) / 10,
      reliability,
    };
  }
}

// Create and export singleton instance
export const aiEvaluationService = new AIEvaluationService();

export default aiEvaluationService;
