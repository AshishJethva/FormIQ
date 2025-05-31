// server/routes/uploadRoutes.ts
import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage, Options } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import {
  uploadFormFile,
  uploadMultipleFiles,
  validateFile,
  deleteFormFile,
} from '../services/cloudinaryService';

dotenv.config();
const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'form-logos', // The folder in Cloudinary where images will be stored
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'svg'], // Allowed file formats
    transformation: [{ width: 1000, crop: 'limit' }], // Optional transformations
  } as Options['params'],
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size
    files: 10, // Maximum 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Basic file validation
    const validation = validateFile({
      size: 0, // Will be validated after upload
      mimeType: file.mimetype,
      originalName: file.originalname,
    });

    if (!validation.isValid) {
      cb(new Error(validation.error));
    } else {
      cb(null, true);
    }
  },
});

// @desc    Upload single file for form submission
// @route   POST /api/upload/form/:formId/field/:fieldId
// @access  Public
router.post(
  '/form/:formId/field/:fieldId',
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    const { formId, fieldId } = req.params;

    if (!req.file) {
      throw new ApiError('No file uploaded', 400);
    }

    // Validate file size (multer limits should catch this, but double-check)
    const validation = validateFile({
      size: req.file.size,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname,
    });

    if (!validation.isValid) {
      throw new ApiError(validation.error!, 400);
    }

    try {
      console.log('📎 Uploading file:', {
        formId,
        fieldId,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      });

      const uploadResult = await uploadFormFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        fieldId,
        formId
      );

      console.log('✅ File uploaded successfully:', uploadResult.url);

      res.status(200).json({
        success: true,
        data: uploadResult,
        message: 'File uploaded successfully',
      });
    } catch (error: any) {
      console.error('❌ File upload failed:', error);
      throw new ApiError(error.message || 'Failed to upload file', 500);
    }
  })
);

// @desc    Upload multiple files for form submission
// @route   POST /api/upload/form/:formId/field/:fieldId/multiple
// @access  Public
router.post(
  '/form/:formId/field/:fieldId/multiple',
  upload.array('files', 10), // Max 10 files
  asyncHandler(async (req: Request, res: Response) => {
    const { formId, fieldId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw new ApiError('No files uploaded', 400);
    }

    // Validate all files
    for (const file of files) {
      const validation = validateFile({
        size: file.size,
        mimeType: file.mimetype,
        originalName: file.originalname,
      });

      if (!validation.isValid) {
        throw new ApiError(`${file.originalname}: ${validation.error}`, 400);
      }
    }

    try {
      console.log('📎 Uploading multiple files:', {
        formId,
        fieldId,
        fileCount: files.length,
        totalSize: files.reduce((sum, file) => sum + file.size, 0),
      });

      const fileData = files.map(file => ({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
      }));

      const uploadResults = await uploadMultipleFiles(
        fileData,
        fieldId,
        formId
      );

      console.log(
        '✅ Multiple files uploaded successfully:',
        uploadResults.length
      );

      res.status(200).json({
        success: true,
        data: uploadResults,
        message: `${uploadResults.length} files uploaded successfully`,
      });
    } catch (error: any) {
      console.error('❌ Multiple file upload failed:', error);
      throw new ApiError(error.message || 'Failed to upload files', 500);
    }
  })
);

// Route to handle logo uploads
router.post('/logo', upload.single('logo'), (req: Request, res: Response) => {
  try {
    // multer-storage-cloudinary automatically uploads to Cloudinary
    // The file information is available in req.file
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Return the Cloudinary URL and other info
    res.status(200).json({
      url: req.file.path, // This is the URL of the uploaded image
      publicId: req.file.filename, // Cloudinary public ID
      message: 'Logo uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// @desc    Upload image with specific validation
// @route   POST /api/upload/form/:formId/field/:fieldId/image
// @access  Public
router.post(
  '/form/:formId/field/:fieldId/image',
  upload.single('image'),
  asyncHandler(async (req: Request, res: Response) => {
    const { formId, fieldId } = req.params;

    if (!req.file) {
      throw new ApiError('No image uploaded', 400);
    }

    // Validate image-specific requirements
    const allowedImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    const validation = validateFile(
      {
        size: req.file.size,
        mimeType: req.file.mimetype,
        originalName: req.file.originalname,
      },
      allowedImageTypes,
      10 * 1024 * 1024
    ); // 10MB for images

    if (!validation.isValid) {
      throw new ApiError(validation.error!, 400);
    }

    try {
      console.log('🖼️ Uploading image:', {
        formId,
        fieldId,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      });

      const uploadResult = await uploadFormFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        fieldId,
        formId
      );

      console.log('✅ Image uploaded successfully:', uploadResult.url);

      res.status(200).json({
        success: true,
        data: uploadResult,
        message: 'Image uploaded successfully',
      });
    } catch (error: any) {
      console.error('❌ Image upload failed:', error);
      throw new ApiError(error.message || 'Failed to upload image', 500);
    }
  })
);

// @desc    Delete uploaded file
// @route   DELETE /api/upload/file/:publicId
// @access  Public (in production, you might want to add authentication)
router.delete(
  '/file/:publicId',
  asyncHandler(async (req: Request, res: Response) => {
    const { publicId } = req.params;
    const { resourceType = 'raw' } = req.query;

    try {
      console.log('🗑️ Deleting file:', publicId);

      const result = await deleteFormFile(
        publicId,
        resourceType as 'image' | 'video' | 'raw'
      );

      if (result.result === 'ok') {
        console.log('✅ File deleted successfully');
        res.status(200).json({
          success: true,
          message: 'File deleted successfully',
        });
      } else {
        throw new ApiError('Failed to delete file', 500);
      }
    } catch (error: any) {
      console.error('❌ File deletion failed:', error);
      throw new ApiError(error.message || 'Failed to delete file', 500);
    }
  })
);

// Error handling middleware for multer errors
router.use(
  (error: any, req: Request, res: Response, next: NextFunction): void => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 25MB.',
        });
        return;
      } else if (error.code === 'LIMIT_FILE_COUNT') {
        res.status(400).json({
          success: false,
          message: 'Too many files. Maximum is 10 files.',
        });
        return;
      } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        res.status(400).json({
          success: false,
          message: 'Unexpected file field.',
        });
        return;
      }
    }

    if (error.message) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    next(error);
  }
);

export default router;
