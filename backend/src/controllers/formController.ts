import { Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import FormModel, { IForm } from '../models/Form';
import FormSubmissionModel, { IFormSubmission } from '../models/FormSubmission';
import { FieldType, LabelAlignment } from '../types/form';

// Define Zod enum for field types that matches your FieldType enum
const FieldTypeEnum = z.enum([
  FieldType.HEADING,
  FieldType.FULL_NAME,
  FieldType.EMAIL,
  FieldType.PHONE,
  FieldType.ADDRESS,
  FieldType.DATE_PICKER,
  FieldType.APPOINTMENT,
  FieldType.SIGNATURE,
  FieldType.FILL_BLANK,
  FieldType.PRODUCT_LIST,
]);

// Define Zod enum for label alignment
const LabelAlignmentEnum = z.enum(['LEFT', 'CENTER', 'RIGHT', 'TOP']);

// Define Zod schema for field validation
const FieldSchema = z.object({
  id: z.string(),
  type: FieldTypeEnum,
  label: z.string(),
  required: z.boolean(),
  helpText: z.string().optional(),
  placeholder: z.string().optional(),
  labelAlignment: LabelAlignmentEnum.optional(),
  options: z.array(z.string()).optional(),
});

// Define Zod schema for page validation
const PageSchema = z.object({
  id: z.string(),
  fields: z.array(FieldSchema),
});

// Define Zod schema for form settings validation
const FormSettingsSchema = z.object({
  submitButtonText: z.string(),
  defaultLabelAlignment: LabelAlignmentEnum,
  thankyouMessage: z.string(),
  defaultRequiredField: z.boolean(),
});

// Define Zod schema for logo state validation
const LogoStateSchema = z
  .object({
    url: z.string(),
    size: z.number(),
    alignment: z.enum(['LEFT', 'CENTER', 'RIGHT']),
  })
  .nullable();

// Define Zod schema for form validation
const FormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
  pages: z.array(PageSchema),
  selectedFieldId: z.string().nullable(),
  selectedPageId: z.string().nullable(),
  currentPageIndex: z.number().int().min(0),
  propertiesPanelOpen: z.boolean(),
  settings: FormSettingsSchema,
  logo: LogoStateSchema,
});

// Define Zod schema for form submission validation
const FormSubmissionSchema = z.object({
  formId: z.string().min(1, 'Form ID is required'),
  data: z.record(z.any()),
  submittedBy: z.string().email().nullable(),
});

/**
 * Create a new form
 */
export const createForm = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = FormSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors,
      });
    }

    const formData = validationResult.data;

    // Ensure user is authenticated
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Create new form with required creator field
    const newForm = await FormModel.create({
      ...formData,
      creator: req.user._id,
      lastSaved: new Date().toISOString(),
    });

    return res.status(201).json({
      success: true,
      message: 'Form created successfully',
      data: newForm,
    });
  } catch (error) {
    console.error('Error creating form:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create form',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get all forms for the authenticated user
 */
export const getAllForms = async (req: Request, res: Response) => {
  try {
    // Ensure user is authenticated
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const forms = await FormModel.find({ creator: req.user._id })
      .select('id title description createdAt updatedAt lastSaved')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: forms.length,
      data: forms,
    });
  } catch (error) {
    console.error('Error fetching forms:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch forms',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get a single form by ID
 */
export const getFormById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID format',
      });
    }

    const form = await FormModel.findById(id);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found',
      });
    }

    // If user is authenticated, check if they are the creator
    // Otherwise, this could be a public form access
    if (req.user?._id && form.creator && !form.creator.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access this form",
      });
    }

    return res.status(200).json({
      success: true,
      data: form,
    });
  } catch (error) {
    console.error('Error fetching form:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch form',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update a form
 */
export const updateForm = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID format',
      });
    }

    // Validate request body
    const validationResult = FormSchema.partial().safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors,
      });
    }

    const formData = validationResult.data;

    // Ensure user is authenticated
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Check if form exists and user has permission
    const existingForm = await FormModel.findById(id);

    if (!existingForm) {
      return res.status(404).json({
        success: false,
        message: 'Form not found',
      });
    }

    // Check if user is the creator
    if (!existingForm.creator.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this form",
      });
    }

    // Update form with lastSaved timestamp
    const updatedForm = await FormModel.findByIdAndUpdate(
      id,
      {
        ...formData,
        lastSaved: new Date().toISOString(),
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Form updated successfully',
      data: updatedForm,
    });
  } catch (error) {
    console.error('Error updating form:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update form',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Delete a form
 */
export const deleteForm = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID format',
      });
    }

    // Ensure user is authenticated
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Check if form exists and user has permission
    const existingForm = await FormModel.findById(id);

    if (!existingForm) {
      return res.status(404).json({
        success: false,
        message: 'Form not found',
      });
    }

    // Check if user is the creator
    if (!existingForm.creator.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this form",
      });
    }

    // Delete form
    await FormModel.findByIdAndDelete(id);

    // Also delete all submissions for this form
    await FormSubmissionModel.deleteMany({ form: id });

    return res.status(200).json({
      success: true,
      message: 'Form and all associated submissions deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting form:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete form',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Add a new page to a form
 */
export const addPage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID format',
      });
    }

    // Validate request body
    const validationResult = PageSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors,
      });
    }

    const pageData = validationResult.data;

    // Ensure user is authenticated
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Check if form exists and user has permission
    const existingForm = await FormModel.findById(id);

    if (!existingForm) {
      return res.status(404).json({
        success: false,
        message: 'Form not found',
      });
    }

    // Check if user is the creator
    if (!existingForm.creator.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this form",
      });
    }

    // Add the new page
    existingForm.pages.push(pageData);
    existingForm.lastSaved = new Date().toISOString();

    // Save the updated form
    await existingForm.save();

    return res.status(200).json({
      success: true,
      message: 'Page added successfully',
      data: existingForm,
    });
  } catch (error) {
    console.error('Error adding page:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add page',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update a specific page in a form
 */
export const updatePage = async (req: Request, res: Response) => {
  try {
    const { formId, pageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(formId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID format',
      });
    }

    // Validate request body
    const validationResult = PageSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors,
      });
    }

    const pageData = validationResult.data;

    // Ensure user is authenticated
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Check if form exists and user has permission
    const existingForm = await FormModel.findById(formId);

    if (!existingForm) {
      return res.status(404).json({
        success: false,
        message: 'Form not found',
      });
    }

    // Check if user is the creator
    if (!existingForm.creator.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this form",
      });
    }

    // Find the page index
    const pageIndex = existingForm.pages.findIndex(page => page.id === pageId);

    if (pageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Page not found in this form',
      });
    }

    // Update the page
    existingForm.pages[pageIndex] = pageData;
    existingForm.lastSaved = new Date().toISOString();

    // Save the updated form
    await existingForm.save();

    return res.status(200).json({
      success: true,
      message: 'Page updated successfully',
      data: existingForm,
    });
  } catch (error) {
    console.error('Error updating page:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update page',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Delete a specific page from a form
 */
export const deletePage = async (req: Request, res: Response) => {
  try {
    const { formId, pageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(formId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID format',
      });
    }

    // Ensure user is authenticated
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Check if form exists and user has permission
    const existingForm = await FormModel.findById(formId);

    if (!existingForm) {
      return res.status(404).json({
        success: false,
        message: 'Form not found',
      });
    }

    // Check if user is the creator
    if (!existingForm.creator.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this form",
      });
    }

    // Ensure form has more than one page before deletion
    if (existingForm.pages.length <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the only page in a form',
      });
    }

    // Find the page index
    const pageIndex = existingForm.pages.findIndex(page => page.id === pageId);

    if (pageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Page not found in this form',
      });
    }

    // Remove the page
    existingForm.pages.splice(pageIndex, 1);

    // Update currentPageIndex if necessary
    if (existingForm.currentPageIndex >= existingForm.pages.length) {
      existingForm.currentPageIndex = existingForm.pages.length - 1;
    }

    // Reset selectedPageId if it was this page
    if (existingForm.selectedPageId === pageId) {
      existingForm.selectedPageId = null;
    }

    existingForm.lastSaved = new Date().toISOString();

    // Save the updated form
    await existingForm.save();

    return res.status(200).json({
      success: true,
      message: 'Page deleted successfully',
      data: existingForm,
    });
  } catch (error) {
    console.error('Error deleting page:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete page',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update form settings
 */
export const updateFormSettings = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID format',
      });
    }

    // Validate request body
    const validationResult = FormSettingsSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors,
      });
    }

    const settingsData = validationResult.data;

    // Ensure user is authenticated
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Check if form exists and user has permission
    const existingForm = await FormModel.findById(id);

    if (!existingForm) {
      return res.status(404).json({
        success: false,
        message: 'Form not found',
      });
    }

    // Check if user is the creator
    if (!existingForm.creator.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this form",
      });
    }

    // Update settings
    const updatedForm = await FormModel.findByIdAndUpdate(
      id,
      {
        settings: settingsData,
        lastSaved: new Date().toISOString(),
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Form settings updated successfully',
      data: updatedForm,
    });
  } catch (error) {
    console.error('Error updating form settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update form settings',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update form logo
 */
export const updateFormLogo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID format',
      });
    }

    // Validate request body
    const validationResult = LogoStateSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors,
      });
    }

    const logoData = validationResult.data;

    // Ensure user is authenticated
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Check if form exists and user has permission
    const existingForm = await FormModel.findById(id);

    if (!existingForm) {
      return res.status(404).json({
        success: false,
        message: 'Form not found',
      });
    }

    // Check if user is the creator
    if (!existingForm.creator.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this form",
      });
    }

    // Update logo
    const updatedForm = await FormModel.findByIdAndUpdate(
      id,
      {
        logo: logoData,
        lastSaved: new Date().toISOString(),
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Form logo updated successfully',
      data: updatedForm,
    });
  } catch (error) {
    console.error('Error updating form logo:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update form logo',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Submit a completed form
 */
export const submitForm = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = FormSubmissionSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors,
      });
    }

    const { formId, data, submittedBy } = validationResult.data;

    if (!mongoose.Types.ObjectId.isValid(formId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID format',
      });
    }

    // Check if form exists
    const existingForm = await FormModel.findById(formId);

    if (!existingForm) {
      return res.status(404).json({
        success: false,
        message: 'Form not found',
      });
    }

    // Create new submission
    const newSubmission = await FormSubmissionModel.create({
      form: formId,
      data,
      submittedBy,
      submittedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: 'Form submitted successfully',
      data: {
        submissionId: newSubmission._id,
        thankyouMessage: existingForm.settings.thankyouMessage,
      },
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit form',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get all submissions for a form
 */
export const getFormSubmissions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID format',
      });
    }

    // Ensure user is authenticated
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Check if form exists and user has permission
    const existingForm = await FormModel.findById(id);

    if (!existingForm) {
      return res.status(404).json({
        success: false,
        message: 'Form not found',
      });
    }

    // Check if user is the creator
    if (!existingForm.creator.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view submissions for this form",
      });
    }

    // Get all submissions for this form
    const submissions = await FormSubmissionModel.find({ form: id }).sort({
      submittedAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    console.error('Error fetching form submissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch form submissions',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Clone an existing form
 */
export const cloneForm = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID format',
      });
    }

    // Ensure user is authenticated
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Check if form exists
    const existingForm = await FormModel.findById(id).lean();

    if (!existingForm) {
      return res.status(404).json({
        success: false,
        message: 'Form not found',
      });
    }

    // Create a new form based on the existing one
    const newForm = {
      ...existingForm,
      _id: undefined,
      id: undefined,
      title: `${existingForm.title} (Copy)`,
      creator: req.user._id,
      lastSaved: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create new form
    const clonedForm = await FormModel.create(newForm);

    return res.status(201).json({
      success: true,
      message: 'Form cloned successfully',
      data: clonedForm,
    });
  } catch (error) {
    console.error('Error cloning form:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clone form',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Export form data to JSON
 */
export const exportFormToJSON = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID format',
      });
    }

    // Ensure user is authenticated
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Check if form exists and user has permission
    const existingForm = await FormModel.findById(id).lean();

    if (!existingForm) {
      return res.status(404).json({
        success: false,
        message: 'Form not found',
      });
    }

    // Check if user is the creator
    if (!existingForm.creator.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to export this form",
      });
    }

    // Get form submissions if requested
    let submissions = [];
    if (req.query.includeSubmissions === 'true') {
      submissions = await FormSubmissionModel.find({ form: id }).lean();
    }

    // Prepare export data
    const exportData = {
      form: {
        ...existingForm,
        creator: undefined, // Remove sensitive data
      },
      submissions:
        req.query.includeSubmissions === 'true' ? submissions : undefined,
    };

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=form_${id}_export.json`
    );

    return res.status(200).json(exportData);
  } catch (error) {
    console.error('Error exporting form:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to export form',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Import form from JSON
 */
export const importForm = async (req: Request, res: Response) => {
  try {
    // Ensure user is authenticated
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Validate imported data structure
    if (!req.body.form) {
      return res.status(400).json({
        success: false,
        message: 'Invalid import format. Expected a form object.',
      });
    }

    const formData = req.body.form;

    // Create a new form based on the imported data
    const newForm = {
      ...formData,
      _id: undefined,
      id: undefined,
      creator: req.user._id,
      lastSaved: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create new form
    const importedForm = await FormModel.create(newForm);

    return res.status(201).json({
      success: true,
      message: 'Form imported successfully',
      data: importedForm,
    });
  } catch (error) {
    console.error('Error importing form:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to import form',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
