import { Router } from 'express';
import { FileController } from '../controllers/FileController';
import { authenticate } from '../middleware/auth';
import {
  avatarUpload,
  documentsUpload,
  portfolioUpload,
  attachmentsUpload,
  multipleFieldsUpload,
  uploadConfig
} from '../middleware/upload';

const router = Router();
const fileController = new FileController();

// All file upload routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/files/avatar:
 *   post:
 *     summary: Upload user avatar (max 2MB)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 */
router.post('/avatar', avatarUpload, fileController.uploadAvatar);

/**
 * @swagger
 * /api/files/documents:
 *   post:
 *     summary: Upload documents (max 5 files, 10MB each)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 */
router.post('/documents', documentsUpload, fileController.uploadDocuments);

/**
 * @swagger
 * /api/files/portfolio:
 *   post:
 *     summary: Upload portfolio images (max 10 files, 5MB each)
 *     tags: [Files]
 */
router.post('/portfolio', portfolioUpload, fileController.uploadPortfolio);

/**
 * @swagger
 * /api/files/attachments:
 *   post:
 *     summary: Upload job/service attachments (max 5 files, 10MB each)
 *     tags: [Files]
 */
router.post('/attachments', uploadConfig.any(), fileController.uploadAttachments);

/**
 * @swagger
 * /api/files/attachments-flexible:
 *   post:
 *     summary: Upload attachments with any field name (for debugging)
 *     tags: [Files]
 */
router.post('/attachments-flexible', uploadConfig.any(), fileController.uploadAttachments);

/**
 * @swagger
 * /api/files/test-upload:
 *   post:
 *     summary: Test file upload to debug field names
 *     tags: [Files]
 */
router.post('/test-upload', uploadConfig.any(), (req, res) => {
  console.log('Test upload request:');
  console.log('Body:', req.body);
  console.log('Files:', req.files);
  console.log('File keys:', req.files ? Object.keys(req.files) : 'No files');
  
  if (Array.isArray(req.files)) {
    console.log('Field names used:', req.files.map(f => f.fieldname));
  }
  
  res.json({
    success: true,
    message: 'Test upload received',
    body: req.body,
    files: req.files,
    fieldNames: Array.isArray(req.files) ? req.files.map(f => f.fieldname) : 'No files',
    fileCount: req.files ? (Array.isArray(req.files) ? req.files.length : Object.keys(req.files).length) : 0
  });
});

/**
 * @swagger
 * /api/files/multiple:
 *   post:
 *     summary: Upload multiple file types in one request
 *     tags: [Files]
 */
router.post('/multiple', multipleFieldsUpload, fileController.uploadMultiple);

// File management routes
router.get('/my-files', fileController.getUserFiles);
router.get('/stats', fileController.getFileStats);
router.get('/:id', fileController.getFileInfo);
router.patch('/:id', fileController.updateFileMetadata);
router.delete('/:id', fileController.deleteFile);

export default router;