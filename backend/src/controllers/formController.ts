// server/controllers/formController.ts
import { Request, Response } from 'express';
import Form from '../models/Form';
import mongoose from 'mongoose';
import cloudinaryService from '../services/cloudinaryService';

// Get all forms for current user
export const getForms = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    const forms = await Form.find({ userId })
      .select('title logo isPublished createdAt updatedAt')
      .sort({ updatedAt: -1 });

    return res.status(200).json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    return res.status(500).json({ error: 'Failed to fetch forms' });
  }
};

// Get a specific form
export const getForm = async (req: Request, res: Response) => {
  try {
    const { formId } = req.params;
    const userId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(formId)) {
      return res.status(400).json({ error: 'Invalid form ID' });
    }

    const form = await Form.findOne({ _id: formId, userId });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    return res.status(200).json(form);
  } catch (error) {
    console.error('Error fetching form:', error);
    return res.status(500).json({ error: 'Failed to fetch form' });
  }
};

// Create a new form
export const createForm = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { title, description } = req.body;

    const newForm = new Form({
      title: title || 'Untitled Form',
      description,
      userId,
    });

    await newForm.save();

    return res.status(201).json(newForm);
  } catch (error) {
    console.error('Error creating form:', error);
    return res.status(500).json({ error: 'Failed to create form' });
  }
};

// Update an existing form
export const updateForm = async (req: Request, res: Response) => {
  try {
    const { formId } = req.params;
    const userId = req.user?._id;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(formId)) {
      return res.status(400).json({ error: 'Invalid form ID' });
    }

    // Remove any attempt to update the logo directly through this endpoint
    if (updateData.logo) {
      delete updateData.logo;
    }

    const updatedForm = await Form.findOneAndUpdate(
      { _id: formId, userId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedForm) {
      return res.status(404).json({ error: 'Form not found' });
    }

    return res.status(200).json(updatedForm);
  } catch (error) {
    console.error('Error updating form:', error);
    return res.status(500).json({ error: 'Failed to update form' });
  }
};

// Delete a form
export const deleteForm = async (req: Request, res: Response) => {
  try {
    const { formId } = req.params;
    const userId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(formId)) {
      return res.status(400).json({ error: 'Invalid form ID' });
    }

    // Get the form to check if it has a logo
    const form = await Form.findOne({ _id: formId, userId });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // If the form has an uploaded logo, delete it from Cloudinary
    if (form.logo?.type === 'uploaded' && form.logo.publicId) {
      await cloudinaryService.deleteImage(form.logo.publicId);
    }

    // Delete the form
    await Form.deleteOne({ _id: formId, userId });

    return res.status(200).json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error deleting form:', error);
    return res.status(500).json({ error: 'Failed to delete form' });
  }
};

// Update form logo
export const updateLogo = async (req: Request, res: Response) => {
  try {
    const { formId } = req.params;
    const userId = req.user?._id;
    const { src, type, alignment, size } = req.body;

    if (!mongoose.Types.ObjectId.isValid(formId)) {
      return res.status(400).json({ error: 'Invalid form ID' });
    }

    // Find the form
    const form = await Form.findOne({ _id: formId, userId });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // If the form already has an uploaded logo and we're updating with a new one,
    // delete the old one from Cloudinary
    if (
      form.logo?.type === 'uploaded' &&
      form.logo.publicId &&
      (type !== 'uploaded' || (type === 'uploaded' && src !== form.logo.src))
    ) {
      await cloudinaryService.deleteImage(form.logo.publicId);
    }

    // Extract publicId from the Cloudinary URL if it's an uploaded image
    let publicId = undefined;
    if (type === 'uploaded') {
      // The publicId is usually included in the response when uploading to Cloudinary
      // but here we'll extract it from the URL if available
      const urlParts = src.split('/');
      const fileNameWithExt = urlParts[urlParts.length - 1];
      publicId = fileNameWithExt.split('.')[0]; // Remove file extension
    }

    // Update the logo
    form.logo = {
      src,
      type,
      publicId,
      alignment: alignment || 'CENTER',
      size: size || 50,
    };

    await form.save();

    return res.status(200).json(form);
  } catch (error) {
    console.error('Error updating logo:', error);
    return res.status(500).json({ error: 'Failed to update logo' });
  }
};

// Remove form logo
export const removeLogo = async (req: Request, res: Response) => {
  try {
    const { formId } = req.params;
    const userId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(formId)) {
      return res.status(400).json({ error: 'Invalid form ID' });
    }

    // Find the form
    const form = await Form.findOne({ _id: formId, userId });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // If the form has an uploaded logo, delete it from Cloudinary
    if (form.logo?.type === 'uploaded' && form.logo.publicId) {
      await cloudinaryService.deleteImage(form.logo.publicId);
    }

    // Remove the logo
    form.logo = undefined;
    await form.save();

    return res.status(200).json(form);
  } catch (error) {
    console.error('Error removing logo:', error);
    return res.status(500).json({ error: 'Failed to remove logo' });
  }
};

export default {
  getForms,
  getForm,
  createForm,
  updateForm,
  deleteForm,
  updateLogo,
  removeLogo,
};
