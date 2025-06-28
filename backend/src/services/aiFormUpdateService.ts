import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';

export interface FormField {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  helpText?: string;
  labelAlignment?: 'LEFT' | 'RIGHT';
  options?: Array<{
    label: string;
    value: string;
    isCorrect?: boolean;
  }>;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  multiple?: boolean;
  accept?: string;
  defaultValue?: any;
}

export interface FormPage {
  id: string;
  fields: FormField[];
}

export interface Form {
  title: string;
  description?: string;
  pages: FormPage[];
  settings?: any;
  logo?: any;
  selectedPageId?: string;
  currentPageIndex?: number;
}

export class AIFormUpdateService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 4096,
      },
    });
  }

  async updateForm(
    currentForm: Form,
    updatePrompt: string,
    userId: string
  ): Promise<{
    success: boolean;
    data?: Form;
    error?: string;
    updateSummary?: string;
  }> {
    const startTime = Date.now();

    try {
      // Validate prompt
      if (!updatePrompt || updatePrompt.trim().length < 5) {
        return {
          success: false,
          error: 'Update prompt must be at least 5 characters long',
        };
      }

      // Analyze the update intent
      const updateIntent = this.analyzeUpdateIntent(updatePrompt);

      // Generate the system prompt for form updates
      const systemPrompt = this.buildUpdateSystemPrompt(
        currentForm,
        updatePrompt,
        updateIntent
      );

      // Get AI response
      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      const generatedText = response.text();

      // Parse the update instructions with enhanced error handling
      const parseResult = this.parseUpdateInstructions(generatedText);
      if (!parseResult.success) {
        console.error('❌ Failed to parse AI response:', parseResult.error);
        return {
          success: false,
          error: parseResult.error,
        };
      }

      // Apply updates to the form
      const updatedForm = this.applyUpdatesToForm(
        currentForm,
        parseResult.data
      );

      // Generate update summary
      const updateSummary = this.generateUpdateSummary(parseResult.data);

      return {
        success: true,
        data: updatedForm,
        updateSummary,
      };
    } catch (error: any) {
      console.error('❌ AI form update failed:', error);
      return {
        success: false,
        error: error.message || 'AI form update failed',
      };
    }
  }

  private analyzeUpdateIntent(prompt: string): {
    type: 'add' | 'modify' | 'remove' | 'reorder' | 'mixed';
    targets: string[];
    confidence: number;
  } {
    const lowerPrompt = prompt.toLowerCase();

    // Intent patterns
    const addPatterns = ['add', 'insert', 'include', 'create', 'new'];
    const modifyPatterns = ['change', 'update', 'modify', 'edit', 'replace'];
    const removePatterns = ['remove', 'delete', 'eliminate', 'take out'];
    const reorderPatterns = ['move', 'reorder', 'rearrange', 'position'];

    const addScore = addPatterns.filter(p => lowerPrompt.includes(p)).length;
    const modifyScore = modifyPatterns.filter(p =>
      lowerPrompt.includes(p)
    ).length;
    const removeScore = removePatterns.filter(p =>
      lowerPrompt.includes(p)
    ).length;
    const reorderScore = reorderPatterns.filter(p =>
      lowerPrompt.includes(p)
    ).length;

    // Determine primary intent
    const scores = {
      add: addScore,
      modify: modifyScore,
      remove: removeScore,
      reorder: reorderScore,
    };
    const maxScore = Math.max(...Object.values(scores));
    const primaryIntent = Object.keys(scores).find(
      key => scores[key as keyof typeof scores] === maxScore
    ) as keyof typeof scores;

    // Check if it's mixed intent
    const nonZeroScores = Object.values(scores).filter(s => s > 0).length;
    const type = nonZeroScores > 1 ? 'mixed' : primaryIntent;

    // Extract targets (field types, positions, etc.)
    const fieldTypePatterns = [
      'short text',
      'long text',
      'paragraph',
      'dropdown',
      'single choice',
      'multiple choice',
      'number',
      'email',
      'phone',
      'address',
      'date',
      'time',
      'file upload',
      'image',
      'signature',
      'heading',
    ];

    const targets = fieldTypePatterns.filter(pattern =>
      lowerPrompt.includes(pattern)
    );

    return {
      type,
      targets,
      confidence: Math.min(100, maxScore * 20 + targets.length * 10),
    };
  }

  private buildUpdateSystemPrompt(
    currentForm: Form,
    updatePrompt: string,
    intent: any
  ): string {
    const currentFormStructure = this.serializeFormStructure(currentForm);

    return `You are an expert form builder AI assistant. You need to update an existing form based on user instructions.

CURRENT FORM STRUCTURE:
${currentFormStructure}

USER REQUEST: "${updatePrompt}"

ANALYSIS:
- Intent: ${intent.type}
- Targets: ${intent.targets.join(', ') || 'General updates'}

CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON object with NO additional text, explanations, or formatting
2. Do not use markdown code blocks (no \`\`\`json)
3. Do not add any text before or after the JSON
4. The response must start with { and end with }

Required JSON Structure:
{
  "operations": [
    {
      "type": "add_field",
      "field": {
        "type": "shortText",
        "label": "Field Label",
        "required": true,
        "helpText": "Help text",
        "labelAlignment": "LEFT"
      },
      "position": {
        "pageId": "existing_page_id",
        "index": 0
      }
    }
  ],
  "summary": "Brief description of changes made"
}

FIELD TYPES (use exact values):
- shortText: Single line text input
- longText: Multi-line text (3-4 lines)
- paragraph: Large text area (5+ lines)
- email: Email address field
- phone: Phone number field
- number: Numeric input
- dropdown: Select dropdown
- singleChoice: Radio buttons
- multipleChoice: Checkboxes
- datePicker: Date selection
- time: Time selection
- image: Image upload
- fileUpload: File upload
- signature: Digital signature
- heading: Section title

OPERATION TYPES:
- add_field: Add new field
- update_field: Modify existing field (use fieldId)
- remove_field: Remove field (use fieldId)
- move_field: Move field to new position
- update_form_metadata: Change title/description

For choice fields (dropdown, singleChoice, multipleChoice), include options:
"options": [
  {"label": "Option 1", "value": "option1"},
  {"label": "Option 2", "value": "option2"}
]

EXAMPLES:

Adding a phone field:
{
  "operations": [
    {
      "type": "add_field",
      "field": {
        "type": "phone",
        "label": "Phone Number",
        "required": false,
        "helpText": "Enter your mobile number",
        "labelAlignment": "LEFT"
      },
      "position": {
        "pageId": "${currentForm.pages[0]?.id}",
        "index": ${currentForm.pages[0]?.fields?.length || 0}
      }
    }
  ],
  "summary": "Added phone number field"
}

Updating form title:
{
  "operations": [
    {
      "type": "update_form_metadata",
      "updates": {
        "title": "New Form Title"
      }
    }
  ],
  "summary": "Updated form title"
}

Now process the request and return ONLY the JSON:`;
  }

  private serializeFormStructure(form: Form): string {
    const structure = {
      title: form.title,
      description: form.description || '',
      totalFields: form.pages.reduce(
        (total, page) => total + (page.fields?.length || 0),
        0
      ),
      pages: form.pages.map((page, pageIndex) => ({
        id: page.id,
        index: pageIndex,
        fieldCount: page.fields?.length || 0,
        fields:
          page.fields?.map((field, fieldIndex) => ({
            id: field.id,
            index: fieldIndex,
            type: field.type,
            label: field.label,
            required: field.required,
            hasOptions: ['dropdown', 'singleChoice', 'multipleChoice'].includes(
              field.type
            ),
            optionCount: (field as any).options?.length || 0,
          })) || [],
      })),
    };

    return JSON.stringify(structure, null, 2);
  }

  private parseUpdateInstructions(rawResponse: string): {
    success: boolean;
    data?: any;
    error?: string;
  } {
    try {
      let cleanedResponse = rawResponse.trim();

      // Remove markdown code blocks
      cleanedResponse = cleanedResponse
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .replace(/^[^{]*/, '')
        .trim();

      // Find the JSON boundaries more precisely
      const firstBrace = cleanedResponse.indexOf('{');
      const lastBrace = cleanedResponse.lastIndexOf('}');

      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        console.error('❌ No valid JSON braces found');
        return {
          success: false,
          error: 'No valid JSON structure found in AI response',
        };
      }

      // Extract only the JSON part
      const jsonPart = cleanedResponse.substring(firstBrace, lastBrace + 1);

      // Validate JSON structure before parsing
      if (!jsonPart.startsWith('{') || !jsonPart.endsWith('}')) {
        return {
          success: false,
          error: 'Invalid JSON format - does not start with { or end with }',
        };
      }

      // Parse JSON
      const instructions = JSON.parse(jsonPart);

      // Validate structure
      if (!instructions.operations || !Array.isArray(instructions.operations)) {
        return {
          success: false,
          error: 'Invalid operations structure in AI response',
        };
      }

      // Validate each operation
      for (const op of instructions.operations) {
        if (!op.type) {
          return {
            success: false,
            error: 'Operation missing type',
          };
        }
      }

      return { success: true, data: instructions };
    } catch (error: any) {
      console.error('❌ JSON Parse error:', error.message);
      console.error(
        '❌ Failed to parse response:',
        rawResponse.substring(0, 500)
      );

      // Try alternative parsing strategies
      const fallbackResult = this.tryFallbackParsing(rawResponse);
      if (fallbackResult.success) {
        return fallbackResult;
      }

      return {
        success: false,
        error: `Failed to parse AI response: ${error.message}. Please try a simpler request.`,
      };
    }
  }

  private tryFallbackParsing(rawResponse: string): {
    success: boolean;
    data?: any;
    error?: string;
  } {
    // Strategy 1: Try to find and extract JSON using regex
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[0];

      const parsed = JSON.parse(jsonStr);
      if (parsed.operations && Array.isArray(parsed.operations)) {
        return { success: true, data: parsed };
      }
    }

    // Strategy 2: Try to clean up common AI response issues
    let cleaned = rawResponse
      .replace(/^\s*Here's the JSON response:\s*/i, '')
      .replace(/^\s*Here is the JSON:\s*/i, '')
      .replace(/^\s*Response:\s*/i, '')
      .replace(/\s*I hope this helps!\s*$/i, '')
      .replace(/\s*Let me know if you need any modifications!\s*$/i, '')
      .trim();

    const bracesMatch = cleaned.match(/\{[\s\S]*\}/);
    if (bracesMatch) {
      const parsed = JSON.parse(bracesMatch[0]);
      if (parsed.operations && Array.isArray(parsed.operations)) {
        return { success: true, data: parsed };
      }
    }

    return {
      success: false,
      error: 'Could not extract valid JSON from AI response',
    };
  }

  private applyUpdatesToForm(currentForm: Form, instructions: any): Form {
    let updatedForm = JSON.parse(JSON.stringify(currentForm));

    instructions.operations?.forEach((operation: any, index: number) => {
      try {
        switch (operation.type) {
          case 'add_field':
            this.addFieldToForm(updatedForm, operation);
            break;
          case 'update_field':
            this.updateFieldInForm(updatedForm, operation);
            break;
          case 'remove_field':
            this.removeFieldFromForm(updatedForm, operation);
            break;
          case 'move_field':
            this.moveFieldInForm(updatedForm, operation);
            break;
          case 'update_form_metadata':
            this.updateFormMetadata(updatedForm, operation);
            break;
          case 'add_page':
            this.addPageToForm(updatedForm, operation);
            break;
          default:
            console.warn('Unknown operation type:', operation.type);
        }
      } catch (error) {
        console.error(`❌ Failed to apply operation ${index + 1}:`, error);
      }
    });

    return updatedForm;
  }

  private addFieldToForm(form: Form, operation: any) {
    const { field, position } = operation;

    // Find the target page
    const targetPage =
      form.pages.find(p => p.id === position.pageId) || form.pages[0];

    if (!targetPage) {
      console.error('No target page found for add_field operation');
      return;
    }

    const newField: FormField = {
      id: uuidv4(),
      type: field.type,
      label: field.label,
      labelAlignment: field.labelAlignment || 'LEFT',
      ...field,
    };

    // Add field-specific properties
    if (field.type !== 'heading') {
      newField.required = field.required || false;
      newField.helpText = field.helpText || '';
    }

    // Handle choice fields
    if (['dropdown', 'singleChoice', 'multipleChoice'].includes(field.type)) {
      newField.options = field.options || [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
      ];
    }

    if (!targetPage.fields) targetPage.fields = [];

    const insertIndex = Math.min(position.index || 0, targetPage.fields.length);
    targetPage.fields.splice(insertIndex, 0, newField);
  }

  private updateFieldInForm(form: Form, operation: any) {
    const { fieldId, updates } = operation;

    for (const page of form.pages) {
      if (!page.fields) continue;

      const fieldIndex = page.fields.findIndex(f => f.id === fieldId);
      if (fieldIndex !== -1) {
        page.fields[fieldIndex] = {
          ...page.fields[fieldIndex],
          ...updates,
        };

        return;
      }
    }
    console.warn(`Field with ID ${fieldId} not found for update`);
  }

  private removeFieldFromForm(form: Form, operation: any) {
    const { fieldId } = operation;

    for (const page of form.pages) {
      if (!page.fields) continue;

      const fieldIndex = page.fields.findIndex(f => f.id === fieldId);
      if (fieldIndex !== -1) {
        const removedField = page.fields[fieldIndex];
        page.fields.splice(fieldIndex, 1);

        return;
      }
    }
    console.warn(`Field with ID ${fieldId} not found for removal`);
  }

  private moveFieldInForm(form: Form, operation: any) {
    const { fieldId, newPosition } = operation;

    // Find and remove the field
    let fieldToMove: FormField | null = null;
    for (const page of form.pages) {
      if (!page.fields) continue;

      const fieldIndex = page.fields.findIndex(f => f.id === fieldId);
      if (fieldIndex !== -1) {
        fieldToMove = page.fields.splice(fieldIndex, 1)[0];
        break;
      }
    }

    // Add field to new position
    if (fieldToMove) {
      const targetPage = form.pages.find(p => p.id === newPosition.pageId);
      if (targetPage) {
        if (!targetPage.fields) targetPage.fields = [];

        const insertIndex = Math.min(
          newPosition.index || 0,
          targetPage.fields.length
        );
        targetPage.fields.splice(insertIndex, 0, fieldToMove);
      }
    }
  }

  private updateFormMetadata(form: Form, operation: any) {
    const { updates } = operation;
    Object.assign(form, updates);
  }

  private addPageToForm(form: Form, operation: any) {
    const newPage = {
      id: uuidv4(),
      fields: operation.page?.fields || [],
    };

    form.pages.push(newPage);
  }

  private generateUpdateSummary(instructions: any): string {
    if (instructions.summary) {
      return instructions.summary;
    }

    const operations = instructions.operations || [];
    const counts = {
      add_field: 0,
      update_field: 0,
      remove_field: 0,
      move_field: 0,
      update_form_metadata: 0,
      add_page: 0,
    };

    operations.forEach((op: any) => {
      if (counts.hasOwnProperty(op.type)) {
        counts[op.type as keyof typeof counts]++;
      }
    });

    const summaryParts = [];

    if (counts.add_field > 0) {
      summaryParts.push(`Added ${counts.add_field} field(s)`);
    }
    if (counts.update_field > 0) {
      summaryParts.push(`Updated ${counts.update_field} field(s)`);
    }
    if (counts.remove_field > 0) {
      summaryParts.push(`Removed ${counts.remove_field} field(s)`);
    }
    if (counts.move_field > 0) {
      summaryParts.push(`Moved ${counts.move_field} field(s)`);
    }
    if (counts.update_form_metadata > 0) {
      summaryParts.push(`Updated form details`);
    }
    if (counts.add_page > 0) {
      summaryParts.push(`Added ${counts.add_page} page(s)`);
    }

    return summaryParts.length > 0
      ? summaryParts.join(', ')
      : 'Form updated successfully';
  }
}

export default AIFormUpdateService;
