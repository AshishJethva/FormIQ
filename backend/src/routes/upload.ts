import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage, Options } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiBasicError';
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

// Configure storage for logo uploads specifically
const logoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'form-logos', // The folder in Cloudinary where logos will be stored
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'], // Allowed file formats
    transformation: [{ width: 1000, crop: 'limit' }], 
  } as Options['params'],
});

// Multer configuration for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

// Configure multer for logo uploads specifically
const logoUpload = multer({
  storage: logoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max for logos
  },
  fileFilter: (req, file, cb) => {
    // Check if it's an image
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed for logos'));
    }

    // Check allowed formats
    const allowedFormats = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];

    if (!allowedFormats.includes(file.mimetype)) {
      return cb(new Error('Supported formats: JPG, PNG, GIF, WebP, SVG'));
    }

    cb(null, true);
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
      const uploadResult = await uploadFormFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        fieldId,
        formId
      );

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

// @desc    Upload logo specifically
// @route   POST /api/upload/logo
// @access  Public (or Protected - add middleware if needed)
router.post(
  '/logo',
  logoUpload.single('logo'),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No logo file uploaded',
        });
        return;
      }

      // Validate file size
      if (req.file.size > 5 * 1024 * 1024) {
        res.status(400).json({
          success: false,
          error: 'Logo file size must be less than 5MB',
        });
        return;
      }

      // Return the Cloudinary URL and other info
      res.status(200).json({
        success: true,
        url: req.file.path, // This is the URL of the uploaded image
        publicId: req.file.filename, // Cloudinary public ID
        message: 'Logo uploaded successfully',
        data: {
          originalName: req.file.originalname,
          fileName: req.file.filename,
          url: req.file.path,
          publicId: req.file.filename,
          size: req.file.size,
          mimeType: req.file.mimetype,
          uploadedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('❌ Logo upload error:', error);
      next(error);
    }
  })
);

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
      const uploadResult = await uploadFormFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        fieldId,
        formId
      );

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

// @desc    Upload single file for preview mode
// @route   POST /api/upload/preview/field/:fieldId
// @access  Public
router.post(
  '/preview/field/:fieldId',
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    const { fieldId } = req.params;

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
      const uploadResult = await uploadFormFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        fieldId,
        'preview' // Use 'preview' as formId
      );

      res.status(200).json({
        success: true,
        data: uploadResult,
        message: 'File uploaded successfully',
      });
    } catch (error: any) {
      console.error('❌ Preview file upload failed:', error);
      throw new ApiError(
        error.message || 'Failed to upload file',
        error.statusCode || 500
      );
    }
  })
);

// @desc    Upload image file for preview mode
// @route   POST /api/upload/preview/field/:fieldId/image
// @access  Public
router.post(
  '/preview/field/:fieldId/image',
  upload.single('image'),
  asyncHandler(async (req: Request, res: Response) => {
    const { fieldId } = req.params;

    if (!req.file) {
      throw new ApiError('No image uploaded', 400);
    }

    // Define allowed image types
    const allowedImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
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
      const uploadResult = await uploadFormFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        fieldId,
        'preview' // Use 'preview' as formId
      );

      res.status(200).json({
        success: true,
        data: uploadResult,
        message: 'Image uploaded successfully',
      });
    } catch (error: any) {
      console.error('❌ Preview image upload failed:', error);
      throw new ApiError(
        error.message || 'Failed to upload image',
        error.statusCode || 500
      );
    }
  })
);

// Handle upload errors
router.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 25MB.',
          error: 'FILE_TOO_LARGE',
        });
        return;
      } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        res.status(400).json({
          success: false,
          message: 'Unexpected file field.',
          error: 'UNEXPECTED_FILE',
        });
        return;
      }
    }

    if (error.message) {
      res.status(400).json({
        success: false,
        message: error.message,
        error: 'UPLOAD_ERROR',
      });
      return;
    }

    next(error);
  }
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
      const result = await deleteFormFile(
        publicId,
        resourceType as 'image' | 'video' | 'raw'
      );

      if (result.result === 'ok') {
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

router.use(
  (error: any, req: Request, res: Response, next: NextFunction): void => {
    console.error('Upload route error:', {
      message: error.message,
      code: error.code,
      field: error.field,
      stack: error.stack,
    });

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          message:
            'File too large. Maximum size is 25MB for files, 5MB for logos.',
          error: 'FILE_TOO_LARGE',
        });
        return;
      } else if (error.code === 'LIMIT_FILE_COUNT') {
        res.status(400).json({
          success: false,
          message: 'Too many files. Maximum is 10 files.',
          error: 'TOO_MANY_FILES',
        });
        return;
      } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        res.status(400).json({
          success: false,
          message: 'Unexpected file field.',
          error: 'UNEXPECTED_FILE',
        });
        return;
      }
    }

    if (error.message) {
      res.status(400).json({
        success: false,
        message: error.message,
        error: 'UPLOAD_ERROR',
      });
      return;
    }

    next(error);
  }
);

export default router;
