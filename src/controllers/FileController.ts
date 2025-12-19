import { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { AppDataSource } from '../config/database';
import { File, FileType, FileStatus } from '../entities/File';
import { createError } from '../middleware/errorHandler';

export class FileController {
  private fileRepository = AppDataSource.getRepository(File);

  // Helper method to save file to database
  private async saveFileToDatabase(
    userId: string,
    file: Express.Multer.File,
    type: FileType,
    description?: string
  ): Promise<File> {
    try {
      console.log('saveFileToDatabase called with:', {
        userId,
        originalname: file.originalname,
        filename: file.filename,
        type,
        description
      });

      const fileEntity = this.fileRepository.create({
        userId: userId, // Use userId directly instead of user relation
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        url: `/uploads/${this.getTypeFolder(type)}/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size,
        type,
        description: description || undefined,
        metadata: JSON.stringify({
          uploadedAt: new Date().toISOString(),
          userAgent: '', // Could be added from request headers
        }),
        status: FileStatus.ACTIVE,
      });

      console.log('Created file entity:', fileEntity);
      const savedFile = await this.fileRepository.save(fileEntity);
      console.log('File saved successfully:', savedFile.id);
      return savedFile;
    } catch (error) {
      console.error('Error in saveFileToDatabase:', error);
      throw error;
    }
  }

  // Helper method to get folder name from file type
  private getTypeFolder(type: FileType): string {
    const folderMap = {
      [FileType.AVATAR]: 'avatars',
      [FileType.DOCUMENT]: 'documents',
      [FileType.PORTFOLIO]: 'portfolio',
      [FileType.ATTACHMENT]: 'attachments',
      [FileType.GENERAL]: 'general',
    };
    return folderMap[type];
  }

  // Helper method to get file type from fieldname
  private getFileTypeFromFieldname(fieldname: string): FileType {
    const typeMap: { [key: string]: FileType } = {
      'avatar': FileType.AVATAR,
      'documents': FileType.DOCUMENT,
      'portfolio': FileType.PORTFOLIO,
      'attachments': FileType.ATTACHMENT,
    };
    return typeMap[fieldname] || FileType.GENERAL;
  }

  // Upload single avatar
  uploadAvatar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return next(createError('No avatar file provided', 400));
      }

      const userId = (req as any).user.userId;
      const { description } = req.body;

      // Save to database
      const savedFile = await this.saveFileToDatabase(
        userId,
        req.file,
        FileType.AVATAR,
        description
      );

      // Update user table with avatar URL
      const userRepository = AppDataSource.getRepository('User');
      const user = await userRepository.findOne({ where: { id: userId } });

      if (!user) {
        // Clean up file if user not found
        await fs.unlink(req.file.path);
        return next(createError('User not found', 404));
      }

      user.avatarUrl = savedFile.url;

      console.log(user.avatarUrl);

      await userRepository.save(user);

      res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          id: savedFile.id,
          url: savedFile.url,
          filename: savedFile.filename,
          originalName: savedFile.originalName,
          size: savedFile.size,
          mimetype: savedFile.mimetype,
          type: savedFile.type,
        }
      });
    } catch (error) {
      // Clean up file if database save fails
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Failed to clean up file:', unlinkError);
        }
      }
      next(error);
    }
  };

  // Upload multiple documents
  uploadDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return next(createError('No documents provided', 400));
      }

      const userId = (req as any).user.userId;
      const { descriptions } = req.body; // Array of descriptions for each file

      const savedFiles = [];

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const description = descriptions && descriptions[i] ? descriptions[i] : undefined;
          
          const savedFile = await this.saveFileToDatabase(
            userId,
            file,
            FileType.DOCUMENT,
            description
          );
          
          savedFiles.push({
            id: savedFile.id,
            url: savedFile.url,
            filename: savedFile.filename,
            originalName: savedFile.originalName,
            size: savedFile.size,
            mimetype: savedFile.mimetype,
            type: savedFile.type,
          });
        }

        res.json({
          success: true,
          message: `${files.length} document(s) uploaded successfully`,
          data: {
            files: savedFiles,
            count: files.length
          }
        });
      } catch (dbError) {
        // Clean up all files if any database save fails
        for (const file of files) {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error('Failed to clean up file:', unlinkError);
          }
        }
        throw dbError;
      }
    } catch (error) {
      next(error);
    }
  };

  // Upload portfolio images
  uploadPortfolio = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return next(createError('No portfolio images provided', 400));
      }

      const userId = (req as any).user.userId;
      const { descriptions } = req.body;

      const savedFiles = [];

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const description = descriptions && descriptions[i] ? descriptions[i] : undefined;
          
          const savedFile = await this.saveFileToDatabase(
            userId,
            file,
            FileType.PORTFOLIO,
            description
          );
          
          savedFiles.push({
            id: savedFile.id,
            url: savedFile.url,
            filename: savedFile.filename,
            originalName: savedFile.originalName,
            size: savedFile.size,
            mimetype: savedFile.mimetype,
            type: savedFile.type,
          });
        }

        res.json({
          success: true,
          message: `${files.length} portfolio image(s) uploaded successfully`,
          data: {
            files: savedFiles,
            count: files.length
          }
        });
      } catch (dbError) {
        // Clean up all files if any database save fails
        for (const file of files) {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error('Failed to clean up file:', unlinkError);
          }
        }
        throw dbError;
      }
    } catch (error) {
      next(error);
    }
  };

  // Upload job/service attachments
  uploadAttachments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('uploadAttachments called');
      console.log('req.files:', req.files);
      console.log('req.body:', req.body);
      console.log('req.user:', (req as any).user);

      // Handle both array and fields format
      let files: Express.Multer.File[] = [];
      
      if (Array.isArray(req.files)) {
        files = req.files;
      } else if (req.files && typeof req.files === 'object') {
        // Handle .fields() format - combine all files from different field names
        const filesObj = req.files as { [fieldname: string]: Express.Multer.File[] };
        files = Object.values(filesObj).flat();
      }
      
      if (!files || files.length === 0) {
        console.log('No files provided');
        return next(createError('No attachments provided. Use field name "attachments", "files", or "uploads".', 400));
      }

      const userId = (req as any).user?.userId;
      if (!userId) {
        console.log('No userId found in request');
        return next(createError('Authentication required', 401));
      }

      console.log('Processing files for userId:', userId);
      const { descriptions } = req.body;

      const savedFiles = [];

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          console.log(`Processing file ${i + 1}:`, {
            fieldname: file.fieldname,
            originalname: file.originalname,
            filename: file.filename,
            size: file.size,
            mimetype: file.mimetype,
            destination: file.destination
          });

          const description = descriptions && descriptions[i] ? descriptions[i] : undefined;
          
          const savedFile = await this.saveFileToDatabase(
            userId,
            file,
            FileType.ATTACHMENT,
            description
          );
          
          console.log('File saved to database:', savedFile.id);
          
          savedFiles.push({
            id: savedFile.id,
            url: savedFile.url,
            filename: savedFile.filename,
            originalName: savedFile.originalName,
            size: savedFile.size,
            mimetype: savedFile.mimetype,
            type: savedFile.type,
          });
        }

        console.log('All files processed successfully');
        res.json({
          success: true,
          message: `${files.length} attachment(s) uploaded successfully`,
          data: {
            files: savedFiles,
            count: files.length
          }
        });
      } catch (dbError) {
        console.error('Database error during file save:', dbError);
        // Clean up all files if any database save fails
        for (const file of files) {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error('Failed to clean up file:', unlinkError);
          }
        }
        throw dbError;
      }
    } catch (error) {
      console.error('uploadAttachments error:', error);
      next(error);
    }
  };

  // Upload multiple types in one request
  uploadMultiple = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files || Object.keys(files).length === 0) {
        return next(createError('No files provided', 400));
      }

      const userId = (req as any).user.userId;
      const result: any = {
        success: true,
        message: 'Files uploaded successfully',
        data: {}
      };

      try {
        // Process each file type
        for (const fieldname of Object.keys(files)) {
          const fieldFiles = files[fieldname];
          const fileType = this.getFileTypeFromFieldname(fieldname);
          const savedFiles = [];

          for (const file of fieldFiles) {
            const savedFile = await this.saveFileToDatabase(userId, file, fileType);
            savedFiles.push({
              id: savedFile.id,
              url: savedFile.url,
              filename: savedFile.filename,
              originalName: savedFile.originalName,
              size: savedFile.size,
              mimetype: savedFile.mimetype,
              type: savedFile.type,
            });
          }

          result.data[fieldname] = savedFiles;
        }

        res.json(result);
      } catch (dbError) {
        // Clean up all files if any database save fails
        for (const fieldFiles of Object.values(files)) {
          for (const file of fieldFiles) {
            try {
              await fs.unlink(file.path);
            } catch (unlinkError) {
              console.error('Failed to clean up file:', unlinkError);
            }
          }
        }
        throw dbError;
      }
    } catch (error) {
      next(error);
    }
  };

  // Delete file (soft delete in database, hard delete from filesystem)
  deleteFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      // Find file in database
      const file = await this.fileRepository.findOne({
        where: { id, userId, status: FileStatus.ACTIVE }
      });

      if (!file) {
        return next(createError('File not found or already deleted', 404));
      }

      // Soft delete in database
      file.status = FileStatus.DELETED;
      await this.fileRepository.save(file);

      // Hard delete from filesystem
      try {
        await fs.unlink(file.path);
      } catch (fsError) {
        console.error('Failed to delete file from filesystem:', fsError);
        // Continue anyway since we've marked it as deleted in DB
      }

      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  // Get file info from database
  getFileInfo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const file = await this.fileRepository.findOne({
        where: { id, status: FileStatus.ACTIVE },
        relations: ['user'],
        select: {
          id: true,
          originalName: true,
          filename: true,
          url: true,
          mimetype: true,
          size: true,
          type: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          user: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      });

      if (!file) {
        return next(createError('File not found', 404));
      }

      res.json({
        success: true,
        data: file
      });
    } catch (error) {
      next(error);
    }
  };

  // List user's files from database
  getUserFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const { type, page = 1, limit = 20 } = req.query;

      const queryBuilder = this.fileRepository
        .createQueryBuilder('file')
        .where('file.userId = :userId', { userId })
        .andWhere('file.status = :status', { status: FileStatus.ACTIVE })
        .orderBy('file.createdAt', 'DESC');

      // Filter by file type if specified
      if (type) {
        queryBuilder.andWhere('file.type = :type', { type });
      }

      const [files, total] = await queryBuilder
        .skip((Number(page) - 1) * Number(limit))
        .take(Number(limit))
        .getManyAndCount();

      res.json({
        success: true,
        data: {
          files,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // Update file metadata
  updateFileMetadata = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;
      const { description } = req.body;

      const file = await this.fileRepository.findOne({
        where: { id, userId, status: FileStatus.ACTIVE }
      });

      if (!file) {
        return next(createError('File not found', 404));
      }

      if (description !== undefined) {
        file.description = description;
      }

      await this.fileRepository.save(file);

      res.json({
        success: true,
        message: 'File metadata updated successfully',
        data: file
      });
    } catch (error) {
      next(error);
    }
  };

  // Get file statistics
  getFileStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;

      const stats = await this.fileRepository
        .createQueryBuilder('file')
        .select('file.type', 'type')
        .addSelect('COUNT(*)', 'count')
        .addSelect('SUM(file.size)', 'totalSize')
        .where('file.userId = :userId', { userId })
        .andWhere('file.status = :status', { status: FileStatus.ACTIVE })
        .groupBy('file.type')
        .getRawMany();

      const totalFiles = await this.fileRepository.count({
        where: { userId, status: FileStatus.ACTIVE }
      });

      const totalSize = await this.fileRepository
        .createQueryBuilder('file')
        .select('SUM(file.size)', 'total')
        .where('file.userId = :userId', { userId })
        .andWhere('file.status = :status', { status: FileStatus.ACTIVE })
        .getRawOne();

      res.json({
        success: true,
        data: {
          byType: stats.map(stat => ({
            type: stat.type,
            count: parseInt(stat.count),
            totalSize: parseInt(stat.totalSize || 0)
          })),
          totals: {
            files: totalFiles,
            size: parseInt(totalSize.total || 0)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };
}