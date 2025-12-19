import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import { Request } from 'express';
import { createError } from './errorHandler';

// Generate SHA256 filename
const generateSecureFilename = (originalname: string): string => {
  const randomBytes = crypto.randomBytes(32);
  const hash = crypto.createHash('sha256').update(randomBytes).digest('hex');
  const ext = path.extname(originalname);
  return `${hash}${ext}`;
};

// File storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    // Organize files by type based on fieldname and route
    if (file.fieldname === 'avatar') {
      uploadPath += 'avatars/';
    } else if (file.fieldname === 'documents') {
      uploadPath += 'documents/';
    } else if (file.fieldname === 'portfolio') {
      uploadPath += 'portfolio/';
    } else if (file.fieldname === 'attachments' || 
               file.fieldname.includes('attachment') || 
               file.fieldname === 'files' ||
               file.fieldname === 'uploads' ||
               req.originalUrl?.includes('attachments')) {
      // Use attachments folder for attachment-related uploads
      uploadPath += 'attachments/';
    } else {
      uploadPath += 'general/';
    }
    
    console.log(`File destination: ${uploadPath} (fieldname: ${file.fieldname}, route: ${req.originalUrl})`);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate secure filename using SHA256
    const secureFilename = generateSecureFilename(file.originalname);
    cb(null, secureFilename);
  }
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = {
    avatar: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    documents: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ],
    portfolio: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    attachments: [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf', 'application/zip', 'application/x-zip-compressed',
      'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/svg+xml'
    ]
  };

  // For attachment uploads, be more flexible with field names
  let fieldAllowedTypes: string[] = [];
  
  if (file.fieldname === 'avatar') {
    fieldAllowedTypes = allowedTypes.avatar;
  } else if (file.fieldname === 'documents') {
    fieldAllowedTypes = allowedTypes.documents;
  } else if (file.fieldname === 'portfolio') {
    fieldAllowedTypes = allowedTypes.portfolio;
  } else if (file.fieldname === 'attachments' || file.fieldname.includes('attachment') || file.fieldname === 'files' || !file.fieldname) {
    // For attachments, files, or unknown field names, use attachment rules
    fieldAllowedTypes = allowedTypes.attachments;
  } else {
    // Default to attachment rules for any other field name
    fieldAllowedTypes = allowedTypes.attachments;
  }
  
  if (fieldAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${file.fieldname}. Allowed types: ${fieldAllowedTypes.join(', ')}`));
  }
};

// Upload configurations
export const uploadConfig = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB general limit
    files: 10 // Maximum 10 files per request
  }
});

// Specific upload middlewares
export const avatarUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB for avatars
    files: 1
  }
}).single('avatar');

export const documentsUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for documents
    files: 5
  }
}).array('documents', 5);

export const portfolioUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for portfolio images
    files: 10
  }
}).array('portfolio', 10);

export const attachmentsUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for attachments
    files: 5
  }
}).fields([
  { name: 'attachments', maxCount: 5 },
  { name: 'files', maxCount: 5 }, // Alternative field name
  { name: 'uploads', maxCount: 5 } // Another alternative
]);

// Alternative: specific field name (use this if you want strict field names)
export const attachmentsUploadStrict = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for attachments
    files: 5
  }
}).array('attachments', 5);

// Multiple field upload
export const multipleFieldsUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 15
  }
}).fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'documents', maxCount: 5 },
  { name: 'portfolio', maxCount: 10 },
  { name: 'attachments', maxCount: 5 }
]);