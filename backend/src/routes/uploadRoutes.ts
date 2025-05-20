// server/routes/uploadRoutes.ts
import express, { Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage, Options } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

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

// Configure multer with storage
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (_req, file, cb) => {
    // Check if the file is an image
    if (!file.mimetype.match(/image\/(jpeg|jpg|png|gif|svg\+xml)/)) {
      return cb(null, false);
    }
    cb(null, true);
  },
});

const router = express.Router();

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

export default router;
