export class AIPromptValidator {
  private static readonly MAX_PROMPT_LENGTH = 1000;
  private static readonly MIN_PROMPT_LENGTH = 10;

  private static readonly INAPPROPRIATE_WORDS = [
    'hack',
    'malware',
    'virus',
    'illegal',
    'fraud',
    'scam',
    'phishing',
    'spam',
    'abuse',
    'harass',
    'threat',
  ];

  private static readonly FORM_KEYWORDS = [
    'form',
    'field',
    'input',
    'question',
    'survey',
    'application',
    'registration',
    'contact',
    'feedback',
    'booking',
    'order',
  ];

  static validate(prompt: string): { isValid: boolean; error?: string } {
    // Basic validation
    if (!prompt || typeof prompt !== 'string') {
      return { isValid: false, error: 'Prompt must be a valid string' };
    }

    if (prompt.trim().length < 5) {
      return {
        isValid: false,
        error: 'Prompt must be at least 5 characters long',
      };
    }

    if (prompt.length > 500) {
      return {
        isValid: false,
        error: 'Prompt must be less than 500 characters',
      };
    }

    // Check for harmful content
    const harmfulPatterns = [
      /script|javascript|eval|function/i,
      /<[^>]*>/g, // HTML tags
      /[{}].*[{}]/g, // Curly braces (potential code injection)
    ];

    for (const pattern of harmfulPatterns) {
      if (pattern.test(prompt)) {
        return {
          isValid: false,
          error: 'Invalid characters detected in prompt',
        };
      }
    }

    const trimmedPrompt = prompt.trim();

    // Length validation
    if (trimmedPrompt.length < this.MIN_PROMPT_LENGTH) {
      return {
        isValid: false,
        error: `Prompt must be at least ${this.MIN_PROMPT_LENGTH} characters`,
      };
    }

    if (trimmedPrompt.length > this.MAX_PROMPT_LENGTH) {
      return {
        isValid: false,
        error: `Prompt must not exceed ${this.MAX_PROMPT_LENGTH} characters`,
      };
    }

    // Content validation
    const lowercasePrompt = trimmedPrompt.toLowerCase();

    // Check for inappropriate content
    const hasInappropriateContent = this.INAPPROPRIATE_WORDS.some(word =>
      lowercasePrompt.includes(word)
    );

    if (hasInappropriateContent) {
      return { isValid: false, error: 'Prompt contains inappropriate content' };
    }

    // Check if prompt is form-related (optional - helps with relevance)
    const hasFormKeywords = this.FORM_KEYWORDS.some(keyword =>
      lowercasePrompt.includes(keyword)
    );

    if (!hasFormKeywords) {
      console.warn(
        ' Prompt may not be form-related:',
        trimmedPrompt.substring(0, 50)
      );
    }

    return { isValid: true };
  }

  static sanitize(prompt: string): string {
    return prompt
      .trim()
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .substring(0, this.MAX_PROMPT_LENGTH)
      .replace(/[{}]/g, '')
      .replace(/script|javascript|eval/gi, '')
      .replace(/\s+/g, ' ');
  }
}
