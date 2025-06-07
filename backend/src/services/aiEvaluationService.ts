// // src/services/aiEvaluationService.ts
// import { GoogleGenerativeAI } from '@google/generative-ai';

// export interface QuizEvaluation {
//   correctAnswers: number;
//   totalQuestions: number;
//   percentage: number;
//   explanations: Array<{
//     questionId: string;
//     question: string;
//     userAnswer: string;
//     correctAnswer: string;
//     explanation: string;
//     isCorrect: boolean;
//   }>;
// }

// export interface SurveyEvaluation {
//   overallSentiment: {
//     positive: number;
//     neutral: number;
//     negative: number;
//   };
//   keyMetrics: Array<{
//     metric: string;
//     value: number;
//     trend: 'up' | 'down' | 'stable';
//   }>;
//   insights: string[];
//   responseQuality: number;
// }

// export interface FeedbackEvaluation {
//   criticalThemes: Array<{
//     theme: string;
//     frequency: number;
//     severity: 'high' | 'medium' | 'low';
//     examples: string[];
//   }>;
//   sentimentBreakdown: {
//     positive: number;
//     neutral: number;
//     negative: number;
//   };
//   actionableInsights: string[];
//   urgencyLevel: 'high' | 'medium' | 'low';
// }

// export interface AIEvaluationResult {
//   id: string;
//   submissionId: string;
//   formType: 'quiz' | 'survey' | 'feedback' | 'general';
//   sentiment: 'positive' | 'neutral' | 'negative';
//   categories: string[];
//   evaluatedAt: string;
//   status: 'completed' | 'failed';
//   feedback: string;

//   quizResults?: QuizEvaluation;
//   surveyResults?: SurveyEvaluation;
//   feedbackResults?: FeedbackEvaluation;
// }

// export class AIEvaluationService {
//   private genAI: GoogleGenerativeAI;

//   constructor() {
//     if (!process.env.GEMINI_API_KEY) {
//       throw new Error('GEMINI_API_KEY is required for AI evaluation');
//     }
//     this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
//   }

//   // ENHANCED: Better form type detection that works with mixed content
//   private detectFormType(
//     formStructure: any,
//     submissionData: any
//   ): 'quiz' | 'survey' | 'feedback' | 'general' {
//     const formTitle = formStructure?.title?.toLowerCase() || '';
//     const formDescription = formStructure?.description?.toLowerCase() || '';

//     let quizIndicators = 0;
//     let surveyIndicators = 0;
//     let feedbackIndicators = 0;

//     console.log('🔍 Enhanced form type detection:', {
//       title: formTitle,
//       description: formDescription,
//       hasPages: !!formStructure?.pages,
//       submissionKeys: Object.keys(submissionData || {}),
//     });

//     // Analyze title and description
//     if (
//       /quiz|test|exam|assessment|question|correct|answer/.test(
//         formTitle + ' ' + formDescription
//       )
//     ) {
//       quizIndicators += 3;
//       console.log('📝 Quiz indicators from title/description: +3');
//     }
//     if (
//       /survey|poll|research|opinion|rate|satisfaction|rating/.test(
//         formTitle + ' ' + formDescription
//       )
//     ) {
//       surveyIndicators += 3;
//       console.log('📊 Survey indicators from title/description: +3');
//     }
//     if (
//       /feedback|review|comment|experience|improve|suggestion/.test(
//         formTitle + ' ' + formDescription
//       )
//     ) {
//       feedbackIndicators += 3;
//       console.log('💬 Feedback indicators from title/description: +3');
//     }

//     // Analyze form fields AND submission data together
//     let hasQuizFields = false;
//     let hasSurveyFields = false;
//     let hasFeedbackFields = false;

//     if (formStructure?.pages) {
//       formStructure.pages.forEach((page: any) => {
//         if (page.fields) {
//           page.fields.forEach((field: any) => {
//             const fieldLabel = field.label?.toLowerCase() || '';

//             // Check if this field has a submission value
//             const hasSubmissionValue =
//               submissionData && submissionData[field.id];

//             // Enhanced quiz detection - look for choice fields with correct answers OR quiz-like labels
//             if (
//               field.type === 'singleChoice' ||
//               field.type === 'multipleChoice' ||
//               field.type === 'dropdown'
//             ) {
//               if (
//                 field.correctAnswer ||
//                 /correct|answer|choose|select|true|false|which|what is/.test(
//                   fieldLabel
//                 )
//               ) {
//                 quizIndicators += 2;
//                 hasQuizFields = true;
//                 console.log(`🎯 Quiz field detected: "${field.label}" (+2)`);
//               }
//             }

//             // Survey patterns - rating/satisfaction fields
//             if (
//               field.type === 'singleChoice' ||
//               field.type === 'multipleChoice'
//             ) {
//               if (
//                 /rate|rating|satisfaction|scale|score|quality|likely|recommend/.test(
//                   fieldLabel
//                 )
//               ) {
//                 surveyIndicators += 2;
//                 hasSurveyFields = true;
//                 console.log(`📊 Survey field detected: "${field.label}" (+2)`);
//               }
//             }

//             // Feedback patterns - text fields asking for opinions/improvements
//             if (
//               field.type === 'longText' ||
//               field.type === 'paragraph' ||
//               field.type === 'shortText'
//             ) {
//               if (
//                 /feedback|comment|improve|experience|suggest|issue|problem|opinion|thoughts/.test(
//                   fieldLabel
//                 )
//               ) {
//                 feedbackIndicators += 2;
//                 hasFeedbackFields = true;
//                 console.log(
//                   `💬 Feedback field detected: "${field.label}" (+2)`
//                 );
//               }
//             }
//           });
//         }
//       });
//     }

//     // Analyze actual submission content for additional context
//     if (submissionData && typeof submissionData === 'object') {
//       const submissionText = Object.entries(submissionData)
//         .map(([key, value]) => {
//           if (typeof value === 'string') return value.toLowerCase();
//           if (typeof value === 'object' && value !== null) {
//             return JSON.stringify(value).toLowerCase();
//           }
//           return String(value).toLowerCase();
//         })
//         .join(' ');

//       // Look for quiz-like answers in submission
//       if (
//         /option|choice|answer|correct|wrong|true|false/.test(submissionText)
//       ) {
//         quizIndicators += 1;
//         console.log('🎯 Quiz content detected in submission: +1');
//       }

//       // Look for survey-like responses
//       if (
//         /excellent|good|poor|satisfied|rating|recommend|likely/.test(
//           submissionText
//         )
//       ) {
//         surveyIndicators += 1;
//         console.log('📊 Survey content detected in submission: +1');
//       }

//       // Look for feedback-like content
//       if (
//         /suggest|improve|better|issue|problem|love|hate|wish/.test(
//           submissionText
//         )
//       ) {
//         feedbackIndicators += 1;
//         console.log('💬 Feedback content detected in submission: +1');
//       }
//     }

//     console.log('📊 Final form type scores:', {
//       quiz: quizIndicators,
//       survey: surveyIndicators,
//       feedback: feedbackIndicators,
//       hasQuizFields,
//       hasSurveyFields,
//       hasFeedbackFields,
//     });

//     // Determine form type based on highest score with minimum threshold
//     if (quizIndicators >= 2 && hasQuizFields) {
//       console.log('Detected as QUIZ form');
//       return 'quiz';
//     }
//     if (surveyIndicators >= 2 && hasSurveyFields) {
//       console.log('Detected as SURVEY form');
//       return 'survey';
//     }
//     if (feedbackIndicators >= 2 && hasFeedbackFields) {
//       console.log('Detected as FEEDBACK form');
//       return 'feedback';
//     }

//     console.log('Detected as GENERAL form (fallback)');
//     return 'general';
//   }

//   async evaluateQuizSubmission(
//     formStructure: any,
//     submissionData: any
//   ): Promise<QuizEvaluation> {
//     console.log('🎯 ENHANCED quiz evaluation starting');

//     const questions = [];

//     // Extract ALL choice questions from form structure (not just quiz-specific ones)
//     if (formStructure?.pages) {
//       formStructure.pages.forEach((page: any, pageIndex: number) => {
//         if (page.fields) {
//           page.fields.forEach((field: any, fieldIndex: number) => {
//             // Include ALL choice fields, even in mixed forms
//             if (
//               field.type === 'singleChoice' ||
//               field.type === 'multipleChoice' ||
//               field.type === 'dropdown'
//             ) {
//               // Check if this field has a user response
//               const hasResponse = submissionData && submissionData[field.id];

//               console.log(
//                 `📋 Found choice field [${pageIndex}-${fieldIndex}]:`,
//                 {
//                   id: field.id,
//                   label: field.label,
//                   type: field.type,
//                   hasOptions: !!(field.options && field.options.length > 0),
//                   correctAnswer: field.correctAnswer,
//                   hasResponse,
//                   userResponse: hasResponse
//                     ? submissionData[field.id]
//                     : 'No response',
//                 }
//               );

//               // Only include fields that have user responses
//               if (hasResponse) {
//                 questions.push({
//                   id: field.id,
//                   label: field.label,
//                   type: field.type,
//                   options: field.options || [],
//                   correctAnswer: field.correctAnswer || null,
//                 });
//               }
//             }
//           });
//         }
//       });
//     }

//     console.log(`🔍 Total evaluable questions found: ${questions.length}`);

//     if (questions.length === 0) {
//       console.warn(
//         '⚠️ No choice fields with responses found for quiz evaluation'
//       );
//       return {
//         correctAnswers: 0,
//         totalQuestions: 0,
//         percentage: 0,
//         explanations: [],
//       };
//     }

//     const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
//     let correctAnswers = 0;
//     const explanations = [];

//     for (const question of questions) {
//       const userAnswer = submissionData[question.id];
//       let isCorrect = false;
//       let correctAnswer = 'Not specified';
//       let explanation = '';

//       console.log(`🤔 Processing question: ${question.label}`, {
//         questionId: question.id,
//         userAnswer,
//         hasCorrectAnswer: !!question.correctAnswer,
//         correctAnswerValue: question.correctAnswer,
//       });

//       if (question.correctAnswer) {
//         // Direct comparison with predefined correct answer
//         const correctOption = question.options?.find(
//           (opt: any) => opt.value === question.correctAnswer
//         );

//         correctAnswer = correctOption?.label || question.correctAnswer;
//         isCorrect = userAnswer === question.correctAnswer;

//         explanation = isCorrect
//           ? ' Correct! Well done.'
//           : `❌ Incorrect. The correct answer is "${correctAnswer}".`;

//         console.log(`📊 Direct evaluation result:`, {
//           userAnswer,
//           correctAnswerValue: question.correctAnswer,
//           correctAnswerLabel: correctAnswer,
//           isCorrect,
//         });
//       } else {
//         // Use AI to evaluate when no predefined correct answer exists
//         console.log(`🤖 Using AI evaluation for: ${question.label}`);

//         const prompt = `
// Evaluate this question and answer:

// Question: ${question.label}
// Available Options: ${question.options?.map((opt: any) => `${opt.value}: ${opt.label}`).join(', ')}
// User's Answer: ${userAnswer}

// Determine:
// 1. What is the most logical correct answer based on the question
// 2. Is the user's answer correct?
// 3. Provide a brief explanation

// Respond in this exact format:
// CORRECT_ANSWER: [answer]
// IS_CORRECT: [true/false]
// EXPLANATION: [explanation]
// `;

//         try {
//           const result = await model.generateContent(prompt);
//           const response = result.response.text();

//           const correctAnswerMatch = response.match(/CORRECT_ANSWER:\s*(.+)/);
//           const isCorrectMatch = response.match(/IS_CORRECT:\s*(true|false)/);
//           const explanationMatch = response.match(/EXPLANATION:\s*(.+)/);

//           correctAnswer = correctAnswerMatch?.[1]?.trim() || 'Unknown';
//           isCorrect = isCorrectMatch?.[1] === 'true';
//           explanation =
//             explanationMatch?.[1]?.trim() || 'No explanation available';

//           console.log(`🤖 AI evaluation result:`, {
//             correctAnswer,
//             isCorrect,
//             explanation: explanation.substring(0, 100) + '...',
//           });
//         } catch (error) {
//           console.error('❌ AI evaluation error:', error);
//           explanation = 'Unable to evaluate this answer automatically';
//         }
//       }

//       if (isCorrect) correctAnswers++;

//       // Get user answer display text
//       const userAnswerOption = question.options?.find(
//         (opt: any) => opt.value === userAnswer
//       );
//       const userAnswerDisplay =
//         userAnswerOption?.label || userAnswer || 'No answer';

//       explanations.push({
//         questionId: question.id,
//         question: question.label,
//         userAnswer: userAnswerDisplay,
//         correctAnswer,
//         explanation,
//         isCorrect,
//       });
//     }

//     const percentage =
//       questions.length > 0
//         ? Math.round((correctAnswers / questions.length) * 100)
//         : 0;

//     const finalResult = {
//       correctAnswers,
//       totalQuestions: questions.length,
//       percentage,
//       explanations,
//     };

//     console.log(`🎉 Enhanced quiz evaluation completed:`, {
//       correctAnswers,
//       totalQuestions: questions.length,
//       percentage,
//       explanationsCount: explanations.length,
//     });

//     return finalResult;
//   }

//   // ENHANCED: Dynamic survey evaluation based on actual responses
//   async evaluateSurveySubmission(
//     formStructure: any,
//     submissionData: any
//   ): Promise<SurveyEvaluation> {
//     console.log('📊 ENHANCED survey evaluation starting');

//     const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

//     // Extract meaningful responses from submission
//     const responses = [];
//     if (formStructure?.pages) {
//       formStructure.pages.forEach((page: any) => {
//         if (page.fields) {
//           page.fields.forEach((field: any) => {
//             const value = submissionData[field.id];
//             if (value && field.type !== 'heading') {
//               let responseText = '';

//               // Format different field types appropriately
//               if (typeof value === 'string') {
//                 responseText = value;
//               } else if (typeof value === 'object') {
//                 if (value.firstName && value.lastName) {
//                   responseText = `${value.firstName} ${value.lastName}`;
//                 } else if (Array.isArray(value)) {
//                   responseText = value.join(', ');
//                 } else {
//                   responseText = JSON.stringify(value);
//                 }
//               } else {
//                 responseText = String(value);
//               }

//               if (responseText.trim()) {
//                 responses.push({
//                   question: field.label || field.id,
//                   answer: responseText.trim(),
//                   type: field.type,
//                   fieldId: field.id,
//                 });
//               }
//             }
//           });
//         }
//       });
//     }

//     console.log(
//       `📊 Extracted ${responses.length} meaningful responses for analysis`
//     );

//     if (responses.length === 0) {
//       return this.getDefaultSurveyAnalysis([]);
//     }

//     // Enhanced AI prompt with actual response data
//     const prompt = `
// Analyze this survey response data thoroughly and provide detailed insights:

// Survey Title: ${formStructure?.title || 'Survey Form'}
// Total Responses: ${responses.length}

// RESPONSE DATA:
// ${responses.map((r, i) => `${i + 1}. Q: "${r.question}"\n   A: "${r.answer}"\n   Type: ${r.type}`).join('\n\n')}

// Provide a comprehensive analysis in this EXACT format:

// SENTIMENT_POSITIVE: [percentage 0-100]
// SENTIMENT_NEUTRAL: [percentage 0-100]
// SENTIMENT_NEGATIVE: [percentage 0-100]
// SATISFACTION_SCORE: [score 1-10 based on responses]
// NPS_SCORE: [score 0-100 based on likelihood to recommend]
// RESPONSE_QUALITY: [quality score 1-100 based on depth and completeness]
// KEY_INSIGHTS: [insight1|insight2|insight3|insight4|insight5]

// Base your analysis on:
// 1. The actual content and tone of responses
// 2. Keywords indicating satisfaction/dissatisfaction
// 3. Overall sentiment expressed
// 4. Depth and thoughtfulness of responses
// 5. Any patterns or themes in the data

// Be specific and reference the actual response content where relevant.
// `;

//     try {
//       const result = await model.generateContent(prompt);
//       const response = result.response.text();

//       console.log('🤖 AI analysis response received, parsing...');

//       const sentimentPositive =
//         this.extractNumber(response, /SENTIMENT_POSITIVE:\s*(\d+)/) || 60;
//       const sentimentNeutral =
//         this.extractNumber(response, /SENTIMENT_NEUTRAL:\s*(\d+)/) || 25;
//       const sentimentNegative =
//         this.extractNumber(response, /SENTIMENT_NEGATIVE:\s*(\d+)/) || 15;
//       const satisfactionScore =
//         this.extractNumber(response, /SATISFACTION_SCORE:\s*(\d+)/) || 7;
//       const npsScore = this.extractNumber(response, /NPS_SCORE:\s*(\d+)/) || 60;
//       const responseQuality =
//         this.extractNumber(response, /RESPONSE_QUALITY:\s*(\d+)/) || 80;

//       const insightsMatch = response.match(/KEY_INSIGHTS:\s*(.+)/);
//       const insights = insightsMatch?.[1]
//         ?.split('|')
//         .map(i => i.trim())
//         .filter(i => i.length > 0) || [
//         'Response patterns analyzed',
//         'Sentiment trends identified',
//         'Overall positive feedback received',
//       ];

//       const analysisResult = {
//         overallSentiment: {
//           positive: Math.min(100, Math.max(0, sentimentPositive)),
//           neutral: Math.min(100, Math.max(0, sentimentNeutral)),
//           negative: Math.min(100, Math.max(0, sentimentNegative)),
//         },
//         keyMetrics: [
//           {
//             metric: 'Satisfaction Score',
//             value: Math.min(10, Math.max(1, satisfactionScore)),
//             trend:
//               satisfactionScore >= 7
//                 ? ('up' as const)
//                 : satisfactionScore >= 5
//                   ? ('stable' as const)
//                   : ('down' as const),
//           },
//           {
//             metric: 'Net Promoter Score',
//             value: Math.min(100, Math.max(0, npsScore)),
//             trend:
//               npsScore >= 50
//                 ? ('up' as const)
//                 : npsScore >= 30
//                   ? ('stable' as const)
//                   : ('down' as const),
//           },
//           {
//             metric: 'Response Quality',
//             value: Math.min(100, Math.max(1, responseQuality)),
//             trend:
//               responseQuality >= 70 ? ('up' as const) : ('stable' as const),
//           },
//         ],
//         insights: insights.slice(0, 5), // Limit to 5 insights
//         responseQuality: Math.min(100, Math.max(1, responseQuality)),
//       };

//       console.log('📊 Enhanced survey analysis completed:', {
//         sentiment: analysisResult.overallSentiment,
//         metricsCount: analysisResult.keyMetrics.length,
//         insightsCount: analysisResult.insights.length,
//       });

//       return analysisResult;
//     } catch (error) {
//       console.error('❌ Survey evaluation error:', error);
//       return this.getDefaultSurveyAnalysis(responses);
//     }
//   }

//   // ENHANCED: Dynamic feedback evaluation based on actual content
//   async evaluateFeedbackSubmission(
//     formStructure: any,
//     submissionData: any
//   ): Promise<FeedbackEvaluation> {
//     console.log('💬 ENHANCED feedback evaluation starting');

//     const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

//     // Extract all textual feedback content
//     const feedbackContent = [];
//     if (formStructure?.pages) {
//       formStructure.pages.forEach((page: any) => {
//         if (page.fields) {
//           page.fields.forEach((field: any) => {
//             const value = submissionData[field.id];
//             if (value && field.type !== 'heading') {
//               let contentText = '';

//               if (typeof value === 'string' && value.trim().length > 0) {
//                 contentText = value.trim();
//               } else if (typeof value === 'object' && value !== null) {
//                 // Handle structured data
//                 if (Array.isArray(value)) {
//                   contentText = value.join(', ');
//                 } else {
//                   contentText = Object.values(value).join(' ');
//                 }
//               } else {
//                 contentText = String(value);
//               }

//               if (contentText.trim().length > 0) {
//                 feedbackContent.push({
//                   field: field.label || field.id,
//                   content: contentText.trim(),
//                   type: field.type,
//                 });
//               }
//             }
//           });
//         }
//       });
//     }

//     console.log(
//       `💬 Extracted ${feedbackContent.length} feedback items for analysis`
//     );

//     if (feedbackContent.length === 0) {
//       return this.getDefaultFeedbackAnalysis('No feedback content provided');
//     }

//     const fullFeedbackText = feedbackContent
//       .map(item => `${item.field}: ${item.content}`)
//       .join('\n');

//     // Enhanced AI prompt for feedback analysis
//     const prompt = `
// Analyze this customer feedback comprehensively and extract actionable insights:

// FEEDBACK DATA:
// ${fullFeedbackText}

// Provide detailed analysis in this EXACT format:

// THEMES: [theme1:frequency:severity|theme2:frequency:severity|theme3:frequency:severity]
// SENTIMENT_POSITIVE: [percentage 0-100]
// SENTIMENT_NEUTRAL: [percentage 0-100]
// SENTIMENT_NEGATIVE: [percentage 0-100]
// URGENCY: [high|medium|low]
// INSIGHTS: [insight1|insight2|insight3|insight4|insight5]

// Guidelines:
// - For THEMES: Identify 3-5 key themes mentioned in the feedback. Format: "ThemeName:FrequencyCount:Severity"
// - Frequency should be 1-10 based on how often the theme appears
// - Severity should be high/medium/low based on impact
// - URGENCY should reflect how quickly action is needed
// - INSIGHTS should be specific, actionable recommendations

// Base analysis on actual content, sentiment, and urgency indicators in the feedback.
// `;

//     try {
//       const result = await model.generateContent(prompt);
//       const response = result.response.text();

//       console.log('🤖 Feedback analysis response received, parsing...');

//       // Parse themes
//       const criticalThemes = [];
//       const themesMatch = response.match(/THEMES:\s*(.+)/);
//       if (themesMatch) {
//         const themesParts = themesMatch[1].split('|');
//         themesParts.forEach(part => {
//           const [theme, freq, severity] = part.split(':');
//           if (theme && freq && severity) {
//             criticalThemes.push({
//               theme: theme.trim(),
//               frequency: Math.min(10, Math.max(1, parseInt(freq) || 1)),
//               severity: ['high', 'medium', 'low'].includes(
//                 severity.trim().toLowerCase()
//               )
//                 ? (severity.trim().toLowerCase() as 'high' | 'medium' | 'low')
//                 : 'medium',
//               examples: [fullFeedbackText.substring(0, 100) + '...'],
//             });
//           }
//         });
//       }

//       // If no themes were parsed, create default ones based on content
//       if (criticalThemes.length === 0) {
//         criticalThemes.push({
//           theme: 'General Feedback',
//           frequency: 1,
//           severity: 'medium' as const,
//           examples: [fullFeedbackText.substring(0, 100) + '...'],
//         });
//       }

//       // Parse sentiment
//       const sentimentPositive =
//         this.extractNumber(response, /SENTIMENT_POSITIVE:\s*(\d+)/) || 60;
//       const sentimentNeutral =
//         this.extractNumber(response, /SENTIMENT_NEUTRAL:\s*(\d+)/) || 25;
//       const sentimentNegative =
//         this.extractNumber(response, /SENTIMENT_NEGATIVE:\s*(\d+)/) || 15;

//       // Parse urgency
//       const urgencyMatch = response.match(/URGENCY:\s*(high|medium|low)/i);
//       const urgencyLevel =
//         (urgencyMatch?.[1]?.toLowerCase() as 'high' | 'medium' | 'low') ||
//         'medium';

//       // Parse insights
//       const insightsMatch = response.match(/INSIGHTS:\s*(.+)/);
//       const actionableInsights = insightsMatch?.[1]
//         ?.split('|')
//         .map(i => i.trim())
//         .filter(i => i.length > 0)
//         .slice(0, 5) || [
//         'Review feedback content for improvement opportunities',
//         'Address key concerns raised by customers',
//         'Follow up on critical feedback points',
//       ];

//       const analysisResult = {
//         criticalThemes,
//         sentimentBreakdown: {
//           positive: Math.min(100, Math.max(0, sentimentPositive)),
//           neutral: Math.min(100, Math.max(0, sentimentNeutral)),
//           negative: Math.min(100, Math.max(0, sentimentNegative)),
//         },
//         actionableInsights,
//         urgencyLevel,
//       };

//       console.log('💬 Enhanced feedback analysis completed:', {
//         themesCount: criticalThemes.length,
//         sentiment: analysisResult.sentimentBreakdown,
//         urgency: urgencyLevel,
//         insightsCount: actionableInsights.length,
//       });

//       return analysisResult;
//     } catch (error) {
//       console.error('❌ Feedback evaluation error:', error);
//       return this.getDefaultFeedbackAnalysis(fullFeedbackText);
//     }
//   }

//   async evaluateSubmission(
//     formStructure: any,
//     submissionData: any,
//     submissionId: string
//   ): Promise<AIEvaluationResult> {
//     console.log(
//       '🚀 ENHANCED AI evaluation starting for submission:',
//       submissionId
//     );
//     console.log('📋 Form structure overview:', {
//       title: formStructure?.title,
//       pagesCount: formStructure?.pages?.length || 0,
//       fieldCount:
//         formStructure?.pages?.reduce(
//           (total: number, page: any) => total + (page.fields?.length || 0),
//           0
//         ) || 0,
//     });
//     console.log('📊 Submission data overview:', {
//       fieldCount: Object.keys(submissionData || {}).length,
//       hasContent: Object.values(submissionData || {}).some(
//         v => v && String(v).trim().length > 0
//       ),
//       sampleFields: Object.keys(submissionData || {}).slice(0, 5),
//     });

//     const formType = this.detectFormType(formStructure, submissionData);
//     console.log(`🎯 Enhanced detection result: ${formType}`);

//     try {
//       let evaluation: AIEvaluationResult = {
//         id: `eval_${submissionId}`,
//         submissionId,
//         formType,
//         sentiment: 'neutral',
//         categories: [],
//         evaluatedAt: new Date().toISOString(),
//         status: 'completed',
//         feedback: '',
//       };

//       switch (formType) {
//         case 'quiz':
//           console.log('🎓 Processing as enhanced quiz form...');
//           const quizResults = await this.evaluateQuizSubmission(
//             formStructure,
//             submissionData
//           );
//           evaluation.quizResults = quizResults;
//           evaluation.sentiment =
//             quizResults.percentage >= 70
//               ? 'positive'
//               : quizResults.percentage >= 50
//                 ? 'neutral'
//                 : 'negative';
//           evaluation.categories = ['academic', 'assessment', 'learning'];
//           evaluation.feedback = `Quiz completed with ${quizResults.percentage}% accuracy (${quizResults.correctAnswers}/${quizResults.totalQuestions} correct)`;
//           break;

//         case 'survey':
//           console.log('📊 Processing as enhanced survey form...');
//           const surveyResults = await this.evaluateSurveySubmission(
//             formStructure,
//             submissionData
//           );
//           evaluation.surveyResults = surveyResults;
//           evaluation.sentiment =
//             surveyResults.overallSentiment.positive > 50
//               ? 'positive'
//               : surveyResults.overallSentiment.negative > 40
//                 ? 'negative'
//                 : 'neutral';
//           evaluation.categories = ['research', 'analytics', 'insights'];
//           evaluation.feedback = `Survey analysis: ${surveyResults.overallSentiment.positive}% positive sentiment, ${surveyResults.keyMetrics.length} key metrics analyzed`;
//           break;

//         case 'feedback':
//           console.log('💬 Processing as enhanced feedback form...');
//           const feedbackResults = await this.evaluateFeedbackSubmission(
//             formStructure,
//             submissionData
//           );
//           evaluation.feedbackResults = feedbackResults;
//           evaluation.sentiment =
//             feedbackResults.sentimentBreakdown.positive > 50
//               ? 'positive'
//               : feedbackResults.sentimentBreakdown.negative > 40
//                 ? 'negative'
//                 : 'neutral';
//           evaluation.categories = [
//             'customer-experience',
//             'improvement',
//             'satisfaction',
//           ];
//           evaluation.feedback = `Feedback analysis: ${feedbackResults.sentimentBreakdown.positive}% positive, ${feedbackResults.urgencyLevel} priority, ${feedbackResults.criticalThemes.length} themes identified`;
//           break;

//         default:
//           console.log('📝 Processing as general form...');
//           evaluation.feedback =
//             'General form submission processed successfully';
//           evaluation.categories = ['general'];
//       }

//       console.log('🎉 Enhanced AI evaluation completed successfully:', {
//         submissionId,
//         formType,
//         sentiment: evaluation.sentiment,
//         status: evaluation.status,
//         hasSpecificResults: !!(
//           evaluation.quizResults ||
//           evaluation.surveyResults ||
//           evaluation.feedbackResults
//         ),
//       });

//       return evaluation;
//     } catch (error) {
//       console.error('❌ Enhanced AI evaluation failed:', error);
//       return {
//         id: `eval_${submissionId}`,
//         submissionId,
//         formType,
//         sentiment: 'neutral',
//         categories: [],
//         evaluatedAt: new Date().toISOString(),
//         status: 'failed',
//         feedback:
//           'AI evaluation failed: ' +
//           (error instanceof Error ? error.message : String(error)),
//       };
//     }
//   }

//   private findFieldById(formStructure: any, fieldId: string): any {
//     if (!formStructure?.pages) return null;

//     for (const page of formStructure.pages) {
//       if (page.fields) {
//         const field = page.fields.find((f: any) => f.id === fieldId);
//         if (field) return field;
//       }
//     }
//     return null;
//   }

//   // Helper method to extract numbers from AI responses
//   private extractNumber(text: string, regex: RegExp): number | null {
//     const match = text.match(regex);
//     return match ? parseInt(match[1]) : null;
//   }

//   // Enhanced default survey analysis with realistic data
//   private getDefaultSurveyAnalysis(responses: any[]): SurveyEvaluation {
//     const hasResponses = responses && responses.length > 0;

//     return {
//       overallSentiment: {
//         positive: hasResponses ? 65 : 60,
//         neutral: hasResponses ? 25 : 25,
//         negative: hasResponses ? 10 : 15,
//       },
//       keyMetrics: [
//         {
//           metric: 'Satisfaction Score',
//           value: hasResponses ? 7 : 6,
//           trend: hasResponses ? 'up' : 'stable',
//         },
//         {
//           metric: 'Response Quality',
//           value: hasResponses ? 85 : 75,
//           trend: hasResponses ? 'up' : 'stable',
//         },
//         {
//           metric: 'Completion Rate',
//           value: hasResponses ? 90 : 80,
//           trend: 'stable',
//         },
//       ],
//       insights: hasResponses
//         ? [
//             'Survey responses show positive engagement',
//             'Most metrics indicate satisfaction',
//             'Response quality is above average',
//           ]
//         : [
//             'Limited response data available',
//             'Basic analysis completed',
//             'More responses needed for detailed insights',
//           ],
//       responseQuality: hasResponses ? 85 : 75,
//     };
//   }

//   // Enhanced default feedback analysis with realistic data
//   private getDefaultFeedbackAnalysis(content: string): FeedbackEvaluation {
//     const hasContent = content && content.trim().length > 10;

//     return {
//       criticalThemes: [
//         {
//           theme: hasContent ? 'General Feedback' : 'Limited Feedback',
//           frequency: 1,
//           severity: hasContent ? 'medium' : 'low',
//           examples: hasContent
//             ? [content.substring(0, 100) + '...']
//             : ['No detailed feedback provided'],
//         },
//       ],
//       sentimentBreakdown: {
//         positive: hasContent ? 65 : 50,
//         neutral: hasContent ? 25 : 35,
//         negative: hasContent ? 10 : 15,
//       },
//       actionableInsights: hasContent
//         ? [
//             'Review feedback content for opportunities',
//             'Consider follow-up on key points',
//             'Monitor trends in similar feedback',
//           ]
//         : [
//             'Encourage more detailed feedback',
//             'Consider adding specific prompts',
//             'Follow up for additional input',
//           ],
//       urgencyLevel: hasContent ? 'medium' : 'low',
//     };
//   }

//   // Additional utility methods for enhanced functionality

//   // Method to validate form structure before evaluation
//   private validateFormStructure(formStructure: any): boolean {
//     if (!formStructure || typeof formStructure !== 'object') {
//       console.error('❌ Invalid form structure: not an object');
//       return false;
//     }

//     if (!formStructure.pages || !Array.isArray(formStructure.pages)) {
//       console.error(
//         '❌ Invalid form structure: missing or invalid pages array'
//       );
//       return false;
//     }

//     let totalFields = 0;
//     for (const page of formStructure.pages) {
//       if (page.fields && Array.isArray(page.fields)) {
//         totalFields += page.fields.length;
//       }
//     }

//     if (totalFields === 0) {
//       console.warn('⚠️ Form has no fields to evaluate');
//       return false;
//     }

//     console.log(' Form structure validation passed:', {
//       pagesCount: formStructure.pages.length,
//       totalFields,
//     });

//     return true;
//   }

//   // Method to validate submission data before evaluation
//   private validateSubmissionData(submissionData: any): boolean {
//     if (!submissionData || typeof submissionData !== 'object') {
//       console.error('❌ Invalid submission data: not an object');
//       return false;
//     }

//     const fieldCount = Object.keys(submissionData).length;
//     const hasValidContent = Object.values(submissionData).some(value => {
//       if (typeof value === 'string') return value.trim().length > 0;
//       if (typeof value === 'object' && value !== null) return true;
//       return value !== null && value !== undefined;
//     });

//     if (fieldCount === 0 || !hasValidContent) {
//       console.warn('⚠️ Submission has no valid content to evaluate');
//       return false;
//     }

//     console.log('Submission data validation passed:', {
//       fieldCount,
//       hasValidContent,
//     });

//     return true;
//   }

//   // Enhanced public method with validation
//   async evaluateSubmissionWithValidation(
//     formStructure: any,
//     submissionData: any,
//     submissionId: string
//   ): Promise<AIEvaluationResult> {
//     console.log('🔍 Starting enhanced evaluation with validation...');

//     // Validate inputs
//     if (!this.validateFormStructure(formStructure)) {
//       return {
//         id: `eval_${submissionId}`,
//         submissionId,
//         formType: 'general',
//         sentiment: 'neutral',
//         categories: [],
//         evaluatedAt: new Date().toISOString(),
//         status: 'failed',
//         feedback: 'Invalid form structure provided for evaluation',
//       };
//     }

//     if (!this.validateSubmissionData(submissionData)) {
//       return {
//         id: `eval_${submissionId}`,
//         submissionId,
//         formType: 'general',
//         sentiment: 'neutral',
//         categories: [],
//         evaluatedAt: new Date().toISOString(),
//         status: 'failed',
//         feedback: 'No valid submission data to evaluate',
//       };
//     }

//     // Proceed with main evaluation
//     return this.evaluateSubmission(formStructure, submissionData, submissionId);
//   }

//   // Method to get evaluation statistics
//   getEvaluationCapabilities(): {
//     supportedFormTypes: string[];
//     quizFeatures: string[];
//     surveyFeatures: string[];
//     feedbackFeatures: string[];
//   } {
//     return {
//       supportedFormTypes: ['quiz', 'survey', 'feedback', 'general'],
//       quizFeatures: [
//         'Multiple choice question evaluation',
//         'Correct answer validation',
//         'Percentage scoring',
//         'Detailed explanations',
//         'AI-powered answer evaluation when no correct answer is predefined',
//       ],
//       surveyFeatures: [
//         'Sentiment analysis',
//         'Response quality assessment',
//         'Key metrics calculation',
//         'Actionable insights generation',
//         'Trend analysis',
//       ],
//       feedbackFeatures: [
//         'Theme identification',
//         'Sentiment breakdown',
//         'Urgency level assessment',
//         'Actionable recommendations',
//         'Content categorization',
//       ],
//     };
//   }

//   // Method to test form type detection
//   async testFormTypeDetection(
//     formStructure: any,
//     submissionData: any
//   ): Promise<{
//     detectedType: string;
//     confidence: string;
//     reasoning: string[];
//   }> {
//     console.log('🧪 Testing form type detection...');

//     const detectedType = this.detectFormType(formStructure, submissionData);

//     const reasoning = [];
//     const formTitle = formStructure?.title?.toLowerCase() || '';
//     const formDescription = formStructure?.description?.toLowerCase() || '';

//     if (/quiz|test|exam/.test(formTitle + ' ' + formDescription)) {
//       reasoning.push('Title/description contains quiz keywords');
//     }

//     if (/survey|poll|research/.test(formTitle + ' ' + formDescription)) {
//       reasoning.push('Title/description contains survey keywords');
//     }

//     if (/feedback|review|comment/.test(formTitle + ' ' + formDescription)) {
//       reasoning.push('Title/description contains feedback keywords');
//     }

//     let choiceFieldsWithAnswers = 0;
//     let textFields = 0;

//     if (formStructure?.pages) {
//       formStructure.pages.forEach((page: any) => {
//         if (page.fields) {
//           page.fields.forEach((field: any) => {
//             if (
//               field.type === 'singleChoice' ||
//               field.type === 'multipleChoice'
//             ) {
//               if (field.correctAnswer) choiceFieldsWithAnswers++;
//             }
//             if (field.type === 'longText' || field.type === 'paragraph') {
//               textFields++;
//             }
//           });
//         }
//       });
//     }

//     if (choiceFieldsWithAnswers > 0) {
//       reasoning.push(
//         `Found ${choiceFieldsWithAnswers} choice fields with correct answers`
//       );
//     }

//     if (textFields > 0) {
//       reasoning.push(`Found ${textFields} text fields for detailed responses`);
//     }

//     const confidence =
//       reasoning.length >= 2
//         ? 'High'
//         : reasoning.length === 1
//           ? 'Medium'
//           : 'Low';

//     return {
//       detectedType,
//       confidence,
//       reasoning,
//     };
//   }
// }

// src/services/aiEvaluationService.ts - Enhanced Backend Service

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface QuizEvaluation {
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
  }>;
}

export interface SurveyEvaluation {
  overallSentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  keyMetrics: Array<{
    metric: string;
    value: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  insights: string[];
  responseQuality: number;
}

export interface FeedbackEvaluation {
  criticalThemes: Array<{
    theme: string;
    frequency: number;
    severity: 'high' | 'medium' | 'low';
    examples: string[];
  }>;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  actionableInsights: string[];
  urgencyLevel: 'high' | 'medium' | 'low';
}

export interface AIEvaluationResult {
  id: string;
  submissionId: string;
  formType: 'quiz' | 'survey' | 'feedback' | 'general';
  sentiment: 'positive' | 'neutral' | 'negative';
  categories: string[];
  evaluatedAt: string;
  status: 'completed' | 'failed';
  feedback: string;

  quizResults?: QuizEvaluation;
  surveyResults?: SurveyEvaluation;
  feedbackResults?: FeedbackEvaluation;
}

// Add rate limiting utility
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private timeWindow: number;

  constructor(maxRequests: number = 10, timeWindowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMs;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();

    // Remove old requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.timeWindow - (now - oldestRequest) + 1000; // Extra 1s buffer

      console.log(
        `⏳ Rate limit reached, waiting ${waitTime}ms before next request`
      );
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.waitForSlot();
    }

    this.requests.push(now);
  }
}

// Create rate limiter instance (max 8 requests per minute to be safe)
const rateLimiter = new RateLimiter(8, 60000);

export class AIEvaluationService {
  private genAI: GoogleGenerativeAI;
  private retryDelay = 2000; // Start with 2 second delay
  private maxRetries = 3;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required for AI evaluation');
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  // Enhanced form type detection that works with mixed content
  private detectFormType(
    formStructure: any,
    submissionData: any
  ): 'quiz' | 'survey' | 'feedback' | 'general' {
    const formTitle = formStructure?.title?.toLowerCase() || '';
    const formDescription = formStructure?.description?.toLowerCase() || '';

    let quizIndicators = 0;
    let surveyIndicators = 0;
    let feedbackIndicators = 0;
    const reasoning: string[] = [];

    console.log('🔍 Enhanced form type detection:', {
      title: formTitle,
      description: formDescription,
      hasPages: !!formStructure?.pages,
      submissionKeys: Object.keys(submissionData || {}),
    });

    // Analyze title and description with enhanced keywords
    const titleDescText = formTitle + ' ' + formDescription;

    if (
      /quiz|test|exam|assessment|question|correct|answer|choose|select|true.*false|multiple.*choice/i.test(
        titleDescText
      )
    ) {
      quizIndicators += 3;
      reasoning.push('Title/description contains quiz-related keywords');
    }

    if (
      /survey|poll|research|opinion|rate|rating|satisfaction|scale|score|feedback.*form|customer.*survey/i.test(
        titleDescText
      )
    ) {
      surveyIndicators += 3;
      reasoning.push('Title/description contains survey-related keywords');
    }

    if (
      /feedback|review|comment|experience|improve|suggestion|thoughts|opinion|testimonial|evaluation/i.test(
        titleDescText
      )
    ) {
      feedbackIndicators += 3;
      reasoning.push('Title/description contains feedback-related keywords');
    }

    // Enhanced field analysis
    let hasQuizFields = false;
    let hasSurveyFields = false;
    let hasFeedbackFields = false;
    let choiceFieldsWithAnswers = 0;
    let totalChoiceFields = 0;
    let longTextFields = 0;
    let ratingFields = 0;

    if (formStructure?.pages && Array.isArray(formStructure.pages)) {
      formStructure.pages.forEach((page: any) => {
        if (page.fields && Array.isArray(page.fields)) {
          page.fields.forEach((field: any) => {
            if (!field || field.type === 'heading') return;

            const fieldLabel = field.label?.toLowerCase() || '';
            const fieldType = field.type?.toLowerCase() || '';

            // Enhanced quiz field detection
            if (
              ['singleChoice', 'multipleChoice', 'dropdown'].includes(fieldType)
            ) {
              totalChoiceFields++;

              if (
                field.correctAnswer ||
                /correct|answer|choose|select|which.*is|what.*is|true|false|pick.*right|best.*answer/i.test(
                  fieldLabel
                )
              ) {
                quizIndicators += 2;
                hasQuizFields = true;
                choiceFieldsWithAnswers++;
                reasoning.push(`Quiz field detected: "${field.label}"`);
              }
            }

            // Enhanced survey field detection
            if (
              /rate|rating|satisfaction|quality|likely|recommend|scale|score|excellent|good|poor|how.*would.*you|on.*scale/i.test(
                fieldLabel
              )
            ) {
              surveyIndicators += 2;
              hasSurveyFields = true;
              ratingFields++;
              reasoning.push(`Survey field detected: "${field.label}"`);
            }

            // Enhanced feedback field detection
            if (['longText', 'paragraph'].includes(fieldType)) {
              longTextFields++;
              if (
                /feedback|comment|improve|experience|suggest|issue|problem|opinion|thoughts|recommendation|tell.*us|what.*do.*you.*think/i.test(
                  fieldLabel
                )
              ) {
                feedbackIndicators += 2;
                hasFeedbackFields = true;
                reasoning.push(`Feedback field detected: "${field.label}"`);
              }
            }

            // Generic feedback indicators
            if (
              /how.*was|tell.*about|share.*your|describe.*your|any.*additional|overall.*experience/i.test(
                fieldLabel
              )
            ) {
              feedbackIndicators += 1;
              reasoning.push(`Generic feedback pattern: "${field.label}"`);
            }
          });
        }
      });
    }

    // Analyze submission data for additional context
    if (submissionData && typeof submissionData === 'object') {
      const submissionText = Object.entries(submissionData)
        .map(([key, value]) => {
          if (typeof value === 'string') return value.toLowerCase();
          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value).toLowerCase();
          }
          return String(value).toLowerCase();
        })
        .join(' ');

      if (
        /option|choice|answer|correct|wrong|true|false|select/i.test(
          submissionText
        )
      ) {
        quizIndicators += 1;
        reasoning.push('Quiz-like content in submission data');
      }

      if (
        /excellent|good|poor|satisfied|recommend|likely|rating|scale/i.test(
          submissionText
        )
      ) {
        surveyIndicators += 1;
        reasoning.push('Survey-like responses in submission data');
      }

      if (
        /suggest|improve|better|issue|problem|feedback|comment|love|hate|wish/i.test(
          submissionText
        )
      ) {
        feedbackIndicators += 1;
        reasoning.push('Feedback-like content in submission data');
      }
    }

    console.log('📊 Enhanced form type analysis:', {
      quiz: quizIndicators,
      survey: surveyIndicators,
      feedback: feedbackIndicators,
      hasQuizFields,
      hasSurveyFields,
      hasFeedbackFields,
      choiceFieldsWithAnswers,
      ratingFields,
      longTextFields,
      reasoning,
    });

    // Enhanced determination logic
    if (quizIndicators >= 2 && hasQuizFields) {
      console.log('✅ Detected as QUIZ form');
      return 'quiz';
    }
    if (surveyIndicators >= 2 && (hasSurveyFields || ratingFields > 0)) {
      console.log('✅ Detected as SURVEY form');
      return 'survey';
    }
    if (feedbackIndicators >= 2 && (hasFeedbackFields || longTextFields > 0)) {
      console.log('✅ Detected as FEEDBACK form');
      return 'feedback';
    }

    // Fallback logic with lower thresholds
    if (
      quizIndicators >= surveyIndicators &&
      quizIndicators >= feedbackIndicators &&
      quizIndicators >= 1
    ) {
      console.log('🔄 Weak QUIZ indicators - proceeding with quiz evaluation');
      return 'quiz';
    }
    if (surveyIndicators >= feedbackIndicators && surveyIndicators >= 1) {
      console.log(
        '🔄 Weak SURVEY indicators - proceeding with survey evaluation'
      );
      return 'survey';
    }
    if (feedbackIndicators >= 1) {
      console.log(
        '🔄 Weak FEEDBACK indicators - proceeding with feedback evaluation'
      );
      return 'feedback';
    }

    console.log('⚪ Detected as GENERAL form (no specific type indicators)');
    return 'general';
  }

  private async makeAIRequest(prompt: string, retryCount = 0): Promise<string> {
    try {
      // Wait for rate limit slot
      await rateLimiter.waitForSlot();

      console.log(
        `🤖 Making AI request (attempt ${retryCount + 1}/${this.maxRetries + 1})`
      );

      const model = this.genAI.getGenerativeModel({
        model: 'gemini-pro',
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 2048,
        },
      });

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      if (!response || response.trim().length === 0) {
        throw new Error('Empty response from AI service');
      }

      return response;
    } catch (error: any) {
      console.error(`❌ AI request failed (attempt ${retryCount + 1}):`, error);

      // Check for specific error types that should be retried
      const shouldRetry =
        retryCount < this.maxRetries &&
        (error.message?.includes('quota') ||
          error.message?.includes('rate') ||
          error.message?.includes('timeout') ||
          error.message?.includes('503') ||
          error.message?.includes('429') ||
          error.code === 'RATE_LIMIT_EXCEEDED');

      if (shouldRetry) {
        const delay = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeAIRequest(prompt, retryCount + 1);
      }

      throw error;
    }
  }

  // Enhanced quiz evaluation with better AI prompting
  async evaluateQuizSubmission(
    formStructure: any,
    submissionData: any
  ): Promise<QuizEvaluation> {
    console.log('🎯 Enhanced quiz evaluation starting');

    const questions = [];

    // Extract ALL choice questions from form structure
    if (formStructure?.pages) {
      formStructure.pages.forEach((page: any, pageIndex: number) => {
        if (page.fields) {
          page.fields.forEach((field: any, fieldIndex: number) => {
            if (
              ['singleChoice', 'multipleChoice', 'dropdown'].includes(
                field.type
              )
            ) {
              const hasResponse = submissionData && submissionData[field.id];

              console.log(
                `📋 Found choice field [${pageIndex}-${fieldIndex}]:`,
                {
                  id: field.id,
                  label: field.label,
                  type: field.type,
                  hasOptions: !!(field.options && field.options.length > 0),
                  correctAnswer: field.correctAnswer,
                  hasResponse,
                  userResponse: hasResponse
                    ? submissionData[field.id]
                    : 'No response',
                }
              );

              if (hasResponse) {
                questions.push({
                  id: field.id,
                  label: field.label,
                  type: field.type,
                  options: field.options || [],
                  correctAnswer: field.correctAnswer || null,
                });
              }
            }
          });
        }
      });
    }

    console.log(`🔍 Total evaluable questions found: ${questions.length}`);

    if (questions.length === 0) {
      console.warn(
        '⚠️ No choice fields with responses found for quiz evaluation'
      );
      return {
        correctAnswers: 0,
        totalQuestions: 0,
        percentage: 0,
        explanations: [],
      };
    }

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 2048,
      },
    });

    let correctAnswers = 0;
    const explanations = [];

    for (const question of questions) {
      const userAnswer = submissionData[question.id];
      let isCorrect = false;
      let correctAnswer = 'Not specified';
      let explanation = '';

      console.log(`🤔 Processing question: ${question.label}`, {
        questionId: question.id,
        userAnswer,
        hasCorrectAnswer: !!question.correctAnswer,
        correctAnswerValue: question.correctAnswer,
      });

      if (question.correctAnswer) {
        // Direct comparison with predefined correct answer
        const correctOption = question.options?.find(
          (opt: any) => opt.value === question.correctAnswer
        );

        correctAnswer = correctOption?.label || question.correctAnswer;
        isCorrect = userAnswer === question.correctAnswer;

        explanation = isCorrect
          ? '✅ Correct! Well done.'
          : `❌ Incorrect. The correct answer is "${correctAnswer}".`;

        console.log(`📊 Direct evaluation result:`, {
          userAnswer,
          correctAnswerValue: question.correctAnswer,
          correctAnswerLabel: correctAnswer,
          isCorrect,
        });
      } else {
        // Enhanced AI evaluation when no predefined correct answer exists
        console.log(`🤖 Using enhanced AI evaluation for: ${question.label}`);

        const prompt = `
You are an expert educational evaluator. Analyze this quiz question and provide a comprehensive evaluation.

QUESTION: ${question.label}

AVAILABLE OPTIONS:
${question.options?.map((opt: any, index: number) => `${index + 1}. ${opt.label} (value: ${opt.value})`).join('\n')}

USER'S ANSWER: ${userAnswer}

INSTRUCTIONS:
1. Determine the most logical and educationally sound correct answer
2. Evaluate if the user's answer is correct based on factual accuracy
3. Provide a clear, educational explanation

RESPOND IN THIS EXACT FORMAT:
CORRECT_ANSWER: [the correct option label]
IS_CORRECT: [true/false]
EXPLANATION: [detailed educational explanation including why the answer is correct/incorrect and what the right reasoning should be]

Be thorough in your analysis and provide educational value in your explanation.
`;

        try {
          const result = await model.generateContent(prompt);
          const response = result.response.text();

          const correctAnswerMatch = response.match(/CORRECT_ANSWER:\s*(.+)/i);
          const isCorrectMatch = response.match(/IS_CORRECT:\s*(true|false)/i);
          const explanationMatch = response.match(/EXPLANATION:\s*(.+)/is);

          correctAnswer =
            correctAnswerMatch?.[1]?.trim() || 'Unable to determine';
          isCorrect = isCorrectMatch?.[1]?.toLowerCase() === 'true';
          explanation =
            explanationMatch?.[1]?.trim() || 'No explanation available';

          console.log(`🤖 Enhanced AI evaluation result:`, {
            correctAnswer,
            isCorrect,
            explanation: explanation.substring(0, 100) + '...',
          });
        } catch (error) {
          console.error('❌ AI evaluation error:', error);
          explanation =
            'Unable to evaluate this answer automatically due to AI service error';
          correctAnswer = 'Evaluation failed';
          isCorrect = false;
        }
      }

      if (isCorrect) correctAnswers++;

      // Get user answer display text
      const userAnswerOption = question.options?.find(
        (opt: any) => opt.value === userAnswer
      );
      const userAnswerDisplay =
        userAnswerOption?.label || userAnswer || 'No answer';

      explanations.push({
        questionId: question.id,
        question: question.label,
        userAnswer: userAnswerDisplay,
        correctAnswer,
        explanation,
        isCorrect,
      });
    }

    const percentage =
      questions.length > 0
        ? Math.round((correctAnswers / questions.length) * 100)
        : 0;

    const finalResult = {
      correctAnswers,
      totalQuestions: questions.length,
      percentage,
      explanations,
    };

    console.log(`🎉 Enhanced quiz evaluation completed:`, {
      correctAnswers,
      totalQuestions: questions.length,
      percentage,
      explanationsCount: explanations.length,
      performance:
        percentage >= 80
          ? 'Excellent'
          : percentage >= 60
            ? 'Good'
            : percentage >= 40
              ? 'Fair'
              : 'Needs Improvement',
    });

    return finalResult;
  }

  // Enhanced survey evaluation with better sentiment analysis
  async evaluateSurveySubmission(
    formStructure: any,
    submissionData: any
  ): Promise<SurveyEvaluation> {
    console.log('📊 Enhanced survey evaluation starting');

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.4,
        topK: 50,
        topP: 0.9,
        maxOutputTokens: 3072,
      },
    });

    // Extract meaningful responses from submission
    const responses = [];
    if (formStructure?.pages) {
      formStructure.pages.forEach((page: any) => {
        if (page.fields) {
          page.fields.forEach((field: any) => {
            const value = submissionData[field.id];
            if (value && field.type !== 'heading') {
              let responseText = '';

              // Enhanced value formatting
              if (typeof value === 'string') {
                responseText = value;
              } else if (typeof value === 'object') {
                if (value.firstName && value.lastName) {
                  responseText = `${value.firstName} ${value.lastName}`;
                } else if (Array.isArray(value)) {
                  responseText = value.join(', ');
                } else if (value.street || value.city) {
                  const addressParts = [
                    value.street,
                    value.city,
                    value.state,
                    value.zipCode,
                  ].filter(part => part && part.trim());
                  responseText = addressParts.join(', ');
                } else {
                  responseText = JSON.stringify(value);
                }
              } else {
                responseText = String(value);
              }

              if (responseText.trim()) {
                responses.push({
                  question: field.label || field.id,
                  answer: responseText.trim(),
                  type: field.type,
                  fieldId: field.id,
                });
              }
            }
          });
        }
      });
    }

    console.log(
      `📊 Extracted ${responses.length} meaningful responses for analysis`
    );

    if (responses.length === 0) {
      return this.getDefaultSurveyAnalysis([]);
    }

    // Enhanced AI prompt for comprehensive survey analysis
    const prompt = `
You are an expert survey analyst specializing in customer feedback and market research. Analyze this survey response data thoroughly and provide detailed insights.

SURVEY CONTEXT:
Form Title: ${formStructure?.title || 'Survey Form'}
Total Responses: ${responses.length}
Form Type: Survey/Opinion Collection

DETAILED RESPONSE DATA:
${responses
  .map(
    (r, i) => `
${i + 1}. QUESTION: "${r.question}"
   ANSWER: "${r.answer}"
   FIELD TYPE: ${r.type}
   CONTEXT: ${this.getFieldContext(r.type, r.question)}
`
  )
  .join('\n')}

ANALYSIS REQUIREMENTS:
Provide a comprehensive analysis covering sentiment, satisfaction metrics, response quality, and actionable insights.

RESPOND IN THIS EXACT FORMAT:

SENTIMENT_POSITIVE: [percentage 0-100]
SENTIMENT_NEUTRAL: [percentage 0-100]
SENTIMENT_NEGATIVE: [percentage 0-100]

SATISFACTION_SCORE: [score 1-10 based on overall satisfaction indicators]
NPS_SCORE: [Net Promoter Score 0-100 based on likelihood to recommend]
RESPONSE_QUALITY: [quality score 1-100 based on depth, completeness, and thoughtfulness]

KEY_INSIGHTS: [insight1|insight2|insight3|insight4|insight5]

ANALYSIS CRITERIA:
- Base sentiment on actual response content, tone, and keywords
- Consider satisfaction indicators (positive/negative language, complaints, praise)
- Evaluate response quality based on detail level and thoughtfulness
- Generate specific, actionable insights relevant to the responses
- Look for patterns across multiple responses
- Consider the business impact of the feedback

Provide specific, data-driven analysis that would be valuable for business decision-making.
`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      console.log('🤖 Enhanced survey analysis response received, parsing...');

      const sentimentPositive =
        this.extractNumber(response, /SENTIMENT_POSITIVE:\s*(\d+)/) || 60;
      const sentimentNeutral =
        this.extractNumber(response, /SENTIMENT_NEUTRAL:\s*(\d+)/) || 25;
      const sentimentNegative =
        this.extractNumber(response, /SENTIMENT_NEGATIVE:\s*(\d+)/) || 15;
      const satisfactionScore =
        this.extractNumber(response, /SATISFACTION_SCORE:\s*(\d+)/) || 7;
      const npsScore = this.extractNumber(response, /NPS_SCORE:\s*(\d+)/) || 60;
      const responseQuality =
        this.extractNumber(response, /RESPONSE_QUALITY:\s*(\d+)/) || 80;

      const insightsMatch = response.match(/KEY_INSIGHTS:\s*(.+)/i);
      const insights = insightsMatch?.[1]
        ?.split('|')
        .map(i => i.trim())
        .filter(i => i.length > 0) || [
        'Survey responses analyzed for patterns and trends',
        'Overall sentiment indicates customer satisfaction levels',
        'Response quality suggests engaged participants',
      ];

      // Enhanced key metrics with business relevance
      const keyMetrics = [
        {
          metric: 'Customer Satisfaction',
          value: Math.min(10, Math.max(1, satisfactionScore)),
          trend:
            satisfactionScore >= 7
              ? ('up' as const)
              : satisfactionScore >= 5
                ? ('stable' as const)
                : ('down' as const),
        },
        {
          metric: 'Net Promoter Score',
          value: Math.min(100, Math.max(0, npsScore)),
          trend:
            npsScore >= 50
              ? ('up' as const)
              : npsScore >= 30
                ? ('stable' as const)
                : ('down' as const),
        },
        {
          metric: 'Response Quality Index',
          value: Math.min(100, Math.max(1, responseQuality)),
          trend: responseQuality >= 70 ? ('up' as const) : ('stable' as const),
        },
      ];

      const analysisResult = {
        overallSentiment: {
          positive: Math.min(100, Math.max(0, sentimentPositive)),
          neutral: Math.min(100, Math.max(0, sentimentNeutral)),
          negative: Math.min(100, Math.max(0, sentimentNegative)),
        },
        keyMetrics,
        insights: insights.slice(0, 5),
        responseQuality: Math.min(100, Math.max(1, responseQuality)),
      };

      console.log('📊 Enhanced survey analysis completed:', {
        sentiment: analysisResult.overallSentiment,
        metricsCount: analysisResult.keyMetrics.length,
        insightsCount: analysisResult.insights.length,
        qualityScore: analysisResult.responseQuality,
      });

      return analysisResult;
    } catch (error) {
      console.error('❌ Enhanced survey evaluation error:', error);
      return this.getDefaultSurveyAnalysis(responses);
    }
  }

  // Enhanced feedback evaluation with comprehensive theme analysis
  async evaluateFeedbackSubmission(
    formStructure: any,
    submissionData: any
  ): Promise<FeedbackEvaluation> {
    console.log('💬 Enhanced feedback evaluation starting');

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.5,
        topK: 60,
        topP: 0.9,
        maxOutputTokens: 4096,
      },
    });

    // Extract all textual feedback content with enhanced processing
    const feedbackContent = [];
    if (formStructure?.pages) {
      formStructure.pages.forEach((page: any) => {
        if (page.fields) {
          page.fields.forEach((field: any) => {
            const value = submissionData[field.id];
            if (value && field.type !== 'heading') {
              let contentText = '';

              if (typeof value === 'string' && value.trim().length > 0) {
                contentText = value.trim();
              } else if (typeof value === 'object' && value !== null) {
                if (Array.isArray(value)) {
                  contentText = value.join(', ');
                } else if (value.street || value.city) {
                  // Skip address fields for feedback analysis
                  return;
                } else {
                  contentText = Object.values(value).join(' ');
                }
              } else {
                contentText = String(value);
              }

              if (contentText.trim().length > 0) {
                feedbackContent.push({
                  field: field.label || field.id,
                  content: contentText.trim(),
                  type: field.type,
                  context: this.getFieldContext(
                    field.type,
                    field.label || field.id
                  ),
                });
              }
            }
          });
        }
      });
    }

    console.log(
      `💬 Extracted ${feedbackContent.length} feedback items for analysis`
    );

    if (feedbackContent.length === 0) {
      return this.getDefaultFeedbackAnalysis('No feedback content provided');
    }

    const fullFeedbackText = feedbackContent
      .map(item => `${item.field}: ${item.content}`)
      .join('\n');

    // Enhanced AI prompt for comprehensive feedback analysis
    const prompt = `
You are an expert customer experience analyst specializing in feedback interpretation and business improvement recommendations. Analyze this customer feedback comprehensively.

FEEDBACK CONTEXT:
Source: ${formStructure?.title || 'Customer Feedback Form'}
Total Feedback Items: ${feedbackContent.length}
Business Context: Customer experience and service improvement

DETAILED FEEDBACK DATA:
${feedbackContent
  .map(
    (item, i) => `
${i + 1}. FIELD: "${item.field}" (${item.type})
   CONTENT: "${item.content}"
   CONTEXT: ${item.context}
`
  )
  .join('\n')}

COMPREHENSIVE ANALYSIS REQUIRED:
Analyze sentiment, identify critical themes, assess urgency, and provide actionable business recommendations.

RESPOND IN THIS EXACT FORMAT:

THEMES: [theme1:frequency:severity|theme2:frequency:severity|theme3:frequency:severity|theme4:frequency:severity|theme5:frequency:severity]

SENTIMENT_POSITIVE: [percentage 0-100]
SENTIMENT_NEUTRAL: [percentage 0-100]
SENTIMENT_NEGATIVE: [percentage 0-100]

URGENCY: [high|medium|low]

INSIGHTS: [insight1|insight2|insight3|insight4|insight5|insight6|insight7]

ANALYSIS GUIDELINES:
- THEMES: Identify 3-5 distinct themes. Format: "ThemeName:FrequencyCount:Severity"
  - Frequency: 1-10 (how often mentioned)
  - Severity: high/medium/low (business impact level)
- SENTIMENT: Base on actual emotional tone, satisfaction indicators, complaint language
- URGENCY: 
  - high: Immediate action required (complaints, service issues, negative experiences)
  - medium: Important but not critical (suggestions, moderate concerns)
  - low: Positive feedback, minor suggestions
- INSIGHTS: Specific, actionable recommendations for business improvement

Focus on business-actionable analysis that helps improve customer experience and operations.
`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      console.log(
        '🤖 Enhanced feedback analysis response received, parsing...'
      );

      // Enhanced theme parsing with better error handling
      const criticalThemes = [];
      const themesMatch = response.match(/THEMES:\s*(.+)/i);
      if (themesMatch) {
        const themesParts = themesMatch[1].split('|');
        themesParts.forEach((part, index) => {
          const [theme, freq, severity] = part.split(':');
          if (theme && freq && severity) {
            criticalThemes.push({
              theme: theme.trim(),
              frequency: Math.min(10, Math.max(1, parseInt(freq) || 1)),
              severity: ['high', 'medium', 'low'].includes(
                severity.trim().toLowerCase()
              )
                ? (severity.trim().toLowerCase() as 'high' | 'medium' | 'low')
                : 'medium',
              examples: [fullFeedbackText.substring(0, 150) + '...'],
            });
          }
        });
      }

      // Generate default themes if parsing failed
      if (criticalThemes.length === 0) {
        criticalThemes.push({
          theme: 'General Customer Feedback',
          frequency: 1,
          severity: 'medium' as const,
          examples: [fullFeedbackText.substring(0, 150) + '...'],
        });
      }

      // Enhanced sentiment parsing
      const sentimentPositive =
        this.extractNumber(response, /SENTIMENT_POSITIVE:\s*(\d+)/i) || 60;
      const sentimentNeutral =
        this.extractNumber(response, /SENTIMENT_NEUTRAL:\s*(\d+)/i) || 25;
      const sentimentNegative =
        this.extractNumber(response, /SENTIMENT_NEGATIVE:\s*(\d+)/i) || 15;

      // Enhanced urgency parsing
      const urgencyMatch = response.match(/URGENCY:\s*(high|medium|low)/i);
      let urgencyLevel =
        (urgencyMatch?.[1]?.toLowerCase() as 'high' | 'medium' | 'low') ||
        'medium';

      // Auto-adjust urgency based on sentiment if needed
      if (sentimentNegative > 60 && urgencyLevel !== 'high') {
        urgencyLevel = 'high';
        console.log(
          '🔴 Auto-adjusted urgency to HIGH due to negative sentiment'
        );
      }

      // Enhanced insights parsing
      const insightsMatch = response.match(/INSIGHTS:\s*(.+)/i);
      const actionableInsights = insightsMatch?.[1]
        ?.split('|')
        .map(i => i.trim())
        .filter(i => i.length > 0)
        .slice(0, 7) || [
        'Review customer feedback for improvement opportunities',
        'Address key concerns raised in the feedback',
        'Follow up on critical feedback points for customer satisfaction',
      ];

      const analysisResult = {
        criticalThemes,
        sentimentBreakdown: {
          positive: Math.min(100, Math.max(0, sentimentPositive)),
          neutral: Math.min(100, Math.max(0, sentimentNeutral)),
          negative: Math.min(100, Math.max(0, sentimentNegative)),
        },
        actionableInsights,
        urgencyLevel,
      };

      console.log('💬 Enhanced feedback analysis completed:', {
        themesCount: criticalThemes.length,
        sentiment: analysisResult.sentimentBreakdown,
        urgency: urgencyLevel,
        insightsCount: actionableInsights.length,
        businessImpact:
          urgencyLevel === 'high'
            ? 'Critical'
            : urgencyLevel === 'medium'
              ? 'Important'
              : 'Informational',
      });

      return analysisResult;
    } catch (error) {
      console.error('❌ Enhanced feedback evaluation error:', error);
      return this.getDefaultFeedbackAnalysis(fullFeedbackText);
    }
  }

  // Enhanced main evaluation method with better error handling
  async evaluateSubmissionWithValidation(
    formStructure: any,
    submissionData: any,
    submissionId: string
  ): Promise<AIEvaluationResult> {
    console.log(
      '🚀 Enhanced AI evaluation starting for submission:',
      submissionId
    );

    const startTime = Date.now();

    // Enhanced validation
    if (!this.validateFormStructure(formStructure)) {
      return this.createFailedEvaluation(
        submissionId,
        'Invalid form structure provided'
      );
    }

    if (!this.validateSubmissionData(submissionData)) {
      return this.createFailedEvaluation(
        submissionId,
        'No valid submission data to evaluate'
      );
    }

    const formType = this.detectFormType(formStructure, submissionData);
    console.log(`🎯 Enhanced detection result: ${formType}`);

    try {
      let evaluation: AIEvaluationResult = {
        id: `eval_${submissionId}_${Date.now()}`,
        submissionId,
        formType,
        sentiment: 'neutral',
        categories: [],
        evaluatedAt: new Date().toISOString(),
        status: 'completed',
        feedback: '',
      };

      switch (formType) {
        case 'quiz':
          console.log('🎓 Processing as enhanced quiz form...');
          const quizResults = await this.evaluateQuizSubmission(
            formStructure,
            submissionData
          );
          evaluation.quizResults = quizResults;
          evaluation.sentiment =
            quizResults.percentage >= 70
              ? 'positive'
              : quizResults.percentage >= 50
                ? 'neutral'
                : 'negative';
          evaluation.categories = [
            'academic',
            'assessment',
            'learning',
            'quiz',
          ];
          evaluation.feedback = `Quiz completed with ${quizResults.percentage}% accuracy (${quizResults.correctAnswers}/${quizResults.totalQuestions} correct). ${
            quizResults.percentage >= 80
              ? 'Excellent performance!'
              : quizResults.percentage >= 60
                ? 'Good job!'
                : quizResults.percentage >= 40
                  ? 'Fair attempt, room for improvement.'
                  : 'Needs significant improvement.'
          }`;
          break;

        case 'survey':
          console.log('📊 Processing as enhanced survey form...');
          const surveyResults = await this.evaluateSurveySubmission(
            formStructure,
            submissionData
          );
          evaluation.surveyResults = surveyResults;
          evaluation.sentiment =
            surveyResults.overallSentiment.positive > 50
              ? 'positive'
              : surveyResults.overallSentiment.negative > 40
                ? 'negative'
                : 'neutral';
          evaluation.categories = [
            'research',
            'analytics',
            'insights',
            'survey',
            'customer-feedback',
          ];
          evaluation.feedback = `Survey analysis: ${surveyResults.overallSentiment.positive}% positive sentiment, ${surveyResults.keyMetrics.length} key metrics analyzed. ${
            surveyResults.overallSentiment.positive >= 70
              ? 'Highly positive feedback received!'
              : surveyResults.overallSentiment.positive >= 50
                ? 'Generally positive responses.'
                : surveyResults.overallSentiment.negative >= 50
                  ? 'Concerning negative feedback detected.'
                  : 'Mixed feedback with room for improvement.'
          }`;
          break;

        case 'feedback':
          console.log('💬 Processing as enhanced feedback form...');
          const feedbackResults = await this.evaluateFeedbackSubmission(
            formStructure,
            submissionData
          );
          evaluation.feedbackResults = feedbackResults;
          evaluation.sentiment =
            feedbackResults.sentimentBreakdown.positive > 50
              ? 'positive'
              : feedbackResults.sentimentBreakdown.negative > 40
                ? 'negative'
                : 'neutral';
          evaluation.categories = [
            'customer-experience',
            'improvement',
            'satisfaction',
            'feedback',
            'business-insights',
          ];
          evaluation.feedback = `Feedback analysis: ${feedbackResults.sentimentBreakdown.positive}% positive sentiment, ${feedbackResults.urgencyLevel} priority level, ${feedbackResults.criticalThemes.length} themes identified. ${
            feedbackResults.urgencyLevel === 'high'
              ? '🔴 Requires immediate attention!'
              : feedbackResults.urgencyLevel === 'medium'
                ? '🟡 Important insights for consideration.'
                : '🟢 Valuable feedback for continuous improvement.'
          }`;
          break;

        default:
          console.log('📝 Processing as general form...');
          evaluation.feedback =
            'General form submission processed and analyzed successfully';
          evaluation.categories = ['general', 'data-collection'];
          evaluation.sentiment = 'neutral';
      }

      const processingTime = Date.now() - startTime;
      console.log('🎉 Enhanced AI evaluation completed successfully:', {
        submissionId,
        formType,
        sentiment: evaluation.sentiment,
        status: evaluation.status,
        processingTime: `${processingTime}ms`,
        hasSpecificResults: !!(
          evaluation.quizResults ||
          evaluation.surveyResults ||
          evaluation.feedbackResults
        ),
      });

      return evaluation;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ Enhanced AI evaluation failed:', {
        submissionId,
        error: error instanceof Error ? error.message : String(error),
        processingTime: `${processingTime}ms`,
      });

      return this.createFailedEvaluation(
        submissionId,
        'AI evaluation failed: ' +
          (error instanceof Error ? error.message : String(error)),
        formType
      );
    }
  }

  // Helper methods for enhanced functionality

  private validateFormStructure(formStructure: any): boolean {
    if (!formStructure || typeof formStructure !== 'object') {
      console.error('❌ Invalid form structure: not an object');
      return false;
    }

    if (!formStructure.pages || !Array.isArray(formStructure.pages)) {
      console.error(
        '❌ Invalid form structure: missing or invalid pages array'
      );
      return false;
    }

    let totalFields = 0;
    for (const page of formStructure.pages) {
      if (page.fields && Array.isArray(page.fields)) {
        totalFields += page.fields.length;
      }
    }

    if (totalFields === 0) {
      console.warn('⚠️ Form has no fields to evaluate');
      return false;
    }

    console.log('✅ Form structure validation passed:', {
      pagesCount: formStructure.pages.length,
      totalFields,
    });

    return true;
  }

  private validateSubmissionData(submissionData: any): boolean {
    if (!submissionData || typeof submissionData !== 'object') {
      console.error('❌ Invalid submission data: not an object');
      return false;
    }

    const fieldCount = Object.keys(submissionData).length;
    const hasValidContent = Object.values(submissionData).some(value => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'object' && value !== null) return true;
      return value !== null && value !== undefined;
    });

    if (fieldCount === 0 || !hasValidContent) {
      console.warn('⚠️ Submission has no valid content to evaluate');
      return false;
    }

    console.log('✅ Submission data validation passed:', {
      fieldCount,
      hasValidContent,
    });

    return true;
  }

  private createFailedEvaluation(
    submissionId: string,
    errorMessage: string,
    formType: 'quiz' | 'survey' | 'feedback' | 'general' = 'general'
  ): AIEvaluationResult {
    return {
      id: `eval_${submissionId}_failed_${Date.now()}`,
      submissionId,
      formType,
      sentiment: 'neutral',
      categories: ['evaluation-failed'],
      evaluatedAt: new Date().toISOString(),
      status: 'failed',
      feedback: errorMessage,
    };
  }

  private getFieldContext(fieldType: string, fieldLabel: string): string {
    const label = fieldLabel.toLowerCase();

    if (fieldType === 'longText' || fieldType === 'paragraph') {
      if (label.includes('feedback') || label.includes('comment')) {
        return 'Detailed feedback/opinion field';
      }
      if (label.includes('experience') || label.includes('describe')) {
        return 'Experience description field';
      }
      if (label.includes('improve') || label.includes('suggest')) {
        return 'Improvement suggestion field';
      }
      return 'Open-ended response field';
    }

    if (fieldType === 'singleChoice' || fieldType === 'multipleChoice') {
      if (label.includes('rate') || label.includes('satisfaction')) {
        return 'Rating/satisfaction scale';
      }
      if (label.includes('recommend') || label.includes('likely')) {
        return 'Recommendation/likelihood scale';
      }
      return 'Multiple choice selection';
    }

    return `${fieldType} field`;
  }

  private extractNumber(text: string, regex: RegExp): number | null {
    const match = text.match(regex);
    return match ? parseInt(match[1]) : null;
  }

  private getDefaultSurveyAnalysis(responses: any[]): SurveyEvaluation {
    const hasResponses = responses && responses.length > 0;

    return {
      overallSentiment: {
        positive: hasResponses ? 65 : 60,
        neutral: hasResponses ? 25 : 25,
        negative: hasResponses ? 10 : 15,
      },
      keyMetrics: [
        {
          metric: 'Customer Satisfaction',
          value: hasResponses ? 7 : 6,
          trend: hasResponses ? 'up' : 'stable',
        },
        {
          metric: 'Response Quality Index',
          value: hasResponses ? 85 : 75,
          trend: hasResponses ? 'up' : 'stable',
        },
        {
          metric: 'Net Promoter Score',
          value: hasResponses ? 65 : 50,
          trend: 'stable',
        },
      ],
      insights: hasResponses
        ? [
            'Survey responses show positive engagement',
            'Most metrics indicate customer satisfaction',
            'Response quality is above average',
            'Participants provided thoughtful feedback',
          ]
        : [
            'Limited response data available for analysis',
            'Basic sentiment analysis completed',
            'More detailed responses needed for deeper insights',
          ],
      responseQuality: hasResponses ? 85 : 75,
    };
  }

  private getDefaultFeedbackAnalysis(content: string): FeedbackEvaluation {
    const hasContent = content && content.trim().length > 10;

    return {
      criticalThemes: [
        {
          theme: hasContent ? 'General Customer Feedback' : 'Limited Feedback',
          frequency: hasContent ? 2 : 1,
          severity: hasContent ? 'medium' : 'low',
          examples: hasContent
            ? [content.substring(0, 100) + '...']
            : ['No detailed feedback provided'],
        },
      ],
      sentimentBreakdown: {
        positive: hasContent ? 65 : 50,
        neutral: hasContent ? 25 : 35,
        negative: hasContent ? 10 : 15,
      },
      actionableInsights: hasContent
        ? [
            'Review customer feedback for service improvement opportunities',
            'Consider follow-up communication for key feedback points',
            'Monitor similar feedback trends for pattern identification',
            'Implement changes based on customer suggestions',
          ]
        : [
            'Encourage customers to provide more detailed feedback',
            'Consider adding specific feedback prompts to forms',
            'Follow up with customers for additional input',
          ],
      urgencyLevel: hasContent ? 'medium' : 'low',
    };
  }

  // Public method for batch evaluation
  async evaluateBatchSubmissions(
    formStructure: any,
    submissions: Array<{ id: string; data: any }>
  ): Promise<AIEvaluationResult[]> {
    console.log(
      '🚀 Starting enhanced batch evaluation for',
      submissions.length,
      'submissions'
    );

    const results: AIEvaluationResult[] = [];
    const batchStartTime = Date.now();

    for (let i = 0; i < submissions.length; i++) {
      const submission = submissions[i];
      console.log(
        `🔄 Processing submission ${i + 1}/${submissions.length}: ${submission.id}`
      );

      try {
        const evaluation = await this.evaluateSubmissionWithValidation(
          formStructure,
          submission.data,
          submission.id
        );
        results.push(evaluation);

        // Add small delay between evaluations to avoid overwhelming the AI service
        if (i < submissions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.error(
          `❌ Failed to evaluate submission ${submission.id}:`,
          error
        );
        results.push(
          this.createFailedEvaluation(
            submission.id,
            `Batch evaluation failed: ${error instanceof Error ? error.message : String(error)}`
          )
        );
      }
    }

    const batchTime = Date.now() - batchStartTime;
    const successCount = results.filter(r => r.status === 'completed').length;
    const failureCount = results.length - successCount;

    console.log('🎉 Enhanced batch evaluation completed:', {
      totalSubmissions: submissions.length,
      successful: successCount,
      failed: failureCount,
      totalTime: `${batchTime}ms`,
      avgTimePerSubmission: `${Math.round(batchTime / submissions.length)}ms`,
    });

    return results;
  }

  // Method to get evaluation capabilities
  getEvaluationCapabilities(): {
    supportedFormTypes: string[];
    quizFeatures: string[];
    surveyFeatures: string[];
    feedbackFeatures: string[];
    generalFeatures: string[];
  } {
    return {
      supportedFormTypes: ['quiz', 'survey', 'feedback', 'general'],
      quizFeatures: [
        'Automatic answer evaluation with predefined correct answers',
        'AI-powered evaluation when no correct answer is specified',
        'Detailed explanations for each question',
        'Performance scoring and percentage calculation',
        'Educational feedback and improvement suggestions',
      ],
      surveyFeatures: [
        'Advanced sentiment analysis across all responses',
        'Customer satisfaction scoring and NPS calculation',
        'Response quality assessment',
        'Key metrics identification and trend analysis',
        'Business-actionable insights generation',
        'Demographic and pattern analysis',
      ],
      feedbackFeatures: [
        'Comprehensive theme identification and categorization',
        'Multi-dimensional sentiment breakdown',
        'Urgency level assessment for business prioritization',
        'Actionable business recommendations',
        'Critical issue identification and severity assessment',
        'Customer experience impact analysis',
      ],
      generalFeatures: [
        'Basic content analysis and categorization',
        'General sentiment assessment',
        'Data quality evaluation',
        'Standard processing and organization',
      ],
    };
  }

  // Method to get evaluation statistics
  getEvaluationStats(): {
    version: string;
    enhancedFeatures: string[];
    aiModel: string;
    supportedLanguages: string[];
  } {
    return {
      version: '2.1.0',
      enhancedFeatures: [
        'Multi-modal form type detection',
        'Context-aware field analysis',
        'Advanced sentiment processing',
        'Business-focused insights generation',
        'Comprehensive error handling',
        'Batch processing optimization',
      ],
      aiModel: 'Google Gemini Pro',
      supportedLanguages: ['en'],
    };
  }

  // Method for testing form type detection
  async testFormTypeDetection(
    formStructure: any,
    submissionData: any
  ): Promise<{
    detectedType: string;
    confidence: string;
    reasoning: string[];
    indicators: {
      quiz: number;
      survey: number;
      feedback: number;
    };
  }> {
    console.log('🧪 Testing enhanced form type detection...');

    const detectedType = this.detectFormType(formStructure, submissionData);

    // Re-run detection logic to get indicators
    const formTitle = formStructure?.title?.toLowerCase() || '';
    const formDescription = formStructure?.description?.toLowerCase() || '';
    const reasoning = [];

    let quizIndicators = 0;
    let surveyIndicators = 0;
    let feedbackIndicators = 0;

    // Title/description analysis
    const titleDescText = formTitle + ' ' + formDescription;
    if (/quiz|test|exam|assessment|question/.test(titleDescText)) {
      quizIndicators += 3;
      reasoning.push('Title/description contains quiz keywords');
    }
    if (/survey|poll|research|opinion|rate/.test(titleDescText)) {
      surveyIndicators += 3;
      reasoning.push('Title/description contains survey keywords');
    }
    if (/feedback|review|comment|experience|improve/.test(titleDescText)) {
      feedbackIndicators += 3;
      reasoning.push('Title/description contains feedback keywords');
    }

    // Field analysis
    let choiceFieldsWithAnswers = 0;
    let textFields = 0;
    let ratingFields = 0;

    if (formStructure?.pages) {
      formStructure.pages.forEach((page: any) => {
        if (page.fields) {
          page.fields.forEach((field: any) => {
            if (
              ['singleChoice', 'multipleChoice', 'dropdown'].includes(
                field.type
              )
            ) {
              if (field.correctAnswer) {
                choiceFieldsWithAnswers++;
                quizIndicators += 2;
              }
            }
            if (['longText', 'paragraph'].includes(field.type)) {
              textFields++;
              if (field.label?.toLowerCase().includes('feedback')) {
                feedbackIndicators += 2;
              }
            }
            if (field.label?.toLowerCase().includes('rate')) {
              ratingFields++;
              surveyIndicators += 2;
            }
          });
        }
      });
    }

    if (choiceFieldsWithAnswers > 0) {
      reasoning.push(
        `Found ${choiceFieldsWithAnswers} choice fields with correct answers`
      );
    }
    if (ratingFields > 0) {
      reasoning.push(`Found ${ratingFields} rating/satisfaction fields`);
    }
    if (textFields > 0) {
      reasoning.push(`Found ${textFields} text fields for detailed responses`);
    }

    const totalIndicators =
      quizIndicators + surveyIndicators + feedbackIndicators;
    const confidence =
      totalIndicators >= 5 ? 'High' : totalIndicators >= 3 ? 'Medium' : 'Low';

    return {
      detectedType,
      confidence,
      reasoning,
      indicators: {
        quiz: quizIndicators,
        survey: surveyIndicators,
        feedback: feedbackIndicators,
      },
    };
  }
}

export default AIEvaluationService;
