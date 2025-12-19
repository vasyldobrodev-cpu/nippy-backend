import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Job, JobStatus, JobType, ExperienceLevel } from '../entities/Job';
import { User, UserRole } from '../entities/User';
import { Category } from '../entities/Category';
import { createError } from '../middleware/errorHandler';

export class JobController {
  private jobRepository = AppDataSource.getRepository(Job);
  private userRepository = AppDataSource.getRepository(User);
  private categoryRepository = AppDataSource.getRepository(Category);

  getAllJobs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 10, category, type, experience } = req.query;
      
      const queryBuilder = this.jobRepository.createQueryBuilder('job')
        .leftJoinAndSelect('job.client', 'client')
        .leftJoinAndSelect('job.category', 'category')
        .where('job.status = :status', { status: JobStatus.OPEN });

      if (category) {
        queryBuilder.andWhere('job.categoryId = :category', { category });
      }

      if (type) {
        queryBuilder.andWhere('job.jobType = :type', { type });
      }

      if (experience) {
        queryBuilder.andWhere('job.experienceLevel = :experience', { experience });
      }

      const [jobs, total] = await queryBuilder
        .skip((Number(page) - 1) * Number(limit))
        .take(Number(limit))
        .orderBy('job.createdAt', 'DESC')
        .getManyAndCount();

      res.json({
        success: true,
        data: {
          jobs,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getJobById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const job = await this.jobRepository.findOne({
        where: { id },
        relations: ['client', 'category'],
      });

      if (!job) {
        return next(createError('Job not found', 404));
      }

      // Increment view count
      job.viewCount += 1;
      await this.jobRepository.save(job);

      res.json({
        success: true,
        data: { job },
      });
    } catch (error) {
      next(error);
    }
  };

  createJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract userid and newjob from the new request structure
      const { userid, newjob } = req.body;
      
      const {
        title,
        description,
        requirements,
        jobType,
        budget,
        hourlyRateMin,
        hourlyRateMax,
        estimatedHours,
        duration,
        experienceLevel,
        skillsRequired,
        categoryId,
        deadline,
      } = newjob;

      // Use userid from request body instead of token
      const userId = userid;

      // Check if user exists and is a client
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return next(createError('User not found', 404));
      }
      
      if (user.role !== UserRole.CLIENT) {
        return next(createError('Only clients can post jobs', 403));
      }

      // Handle categoryId - create default category if not provided or doesn't exist
      let finalCategoryId = categoryId;
      
      if (!categoryId) {
        // No categoryId provided, create or get default category
        let defaultCategory = await this.categoryRepository.findOne({ 
          where: { name: 'General' } 
        });
        
        if (!defaultCategory) {
          // Create default category if it doesn't exist
          defaultCategory = this.categoryRepository.create({
            name: 'General',
            description: 'General category for uncategorized jobs',
            slug: 'general'
          });
          await this.categoryRepository.save(defaultCategory);
        }
        
        finalCategoryId = defaultCategory.id;
      } else {
        // categoryId provided, check if it exists
        const category = await this.categoryRepository.findOne({ 
          where: { id: categoryId } 
        });
        
        if (!category) {
          // Provided categoryId doesn't exist, use default
          let defaultCategory = await this.categoryRepository.findOne({ 
            where: { name: 'General' } 
          });
          
          if (!defaultCategory) {
            // Create default category if it doesn't exist
            defaultCategory = this.categoryRepository.create({
              name: 'General',
              description: 'General category for uncategorized jobs',
              slug: 'general'
            });
            await this.categoryRepository.save(defaultCategory);
          }
          
          finalCategoryId = defaultCategory.id;
        }
      }

      // Generate slug from title
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const job = this.jobRepository.create({
        client: { id: userId },
        category: { id: finalCategoryId },
        title,
        slug: `${slug}-${Date.now()}`,
        description,
        requirements,
        jobType,
        budget,
        hourlyRateMin,
        hourlyRateMax,
        estimatedHours,
        duration,
        experienceLevel,
        skillsRequired: skillsRequired || [],
        deadline: deadline ? new Date(deadline) : undefined,
      });

      await this.jobRepository.save(job);

      res.status(201).json({
        success: true,
        message: 'Job created successfully',
        data: { job },
      });
    } catch (error) {
      next(error);
    }
  };

  createDraft = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract userid and newjob from the request structure
      const { userid, newjob } = req.body;
      
      const {
        title,
        description,
        requirements,
        jobType,
        budget,
        hourlyRateMin,
        hourlyRateMax,
        estimatedHours,
        duration,
        experienceLevel,
        skillsRequired,
        categoryId,
        deadline,
      } = newjob;

      // Use userid from request body instead of token
      const userId = userid;

      // Check if user exists and is a client
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return next(createError('User not found', 404));
      }
      
      if (user.role !== UserRole.CLIENT) {
        return next(createError('Only clients can create drafts', 403));
      }

      // Handle categoryId - create default category if not provided or doesn't exist
      let finalCategoryId = categoryId;
      
      if (!categoryId) {
        // No categoryId provided, create or get default category
        let defaultCategory = await this.categoryRepository.findOne({ 
          where: { name: 'General' } 
        });
        
        if (!defaultCategory) {
          // Create default category if it doesn't exist
          defaultCategory = this.categoryRepository.create({
            name: 'General',
            description: 'General category for uncategorized jobs',
            slug: 'general'
          });
          await this.categoryRepository.save(defaultCategory);
        }
        
        finalCategoryId = defaultCategory.id;
      } else {
        // categoryId provided, check if it exists
        const category = await this.categoryRepository.findOne({ 
          where: { id: categoryId } 
        });
        
        if (!category) {
          // Provided categoryId doesn't exist, use default
          let defaultCategory = await this.categoryRepository.findOne({ 
            where: { name: 'General' } 
          });
          
          if (!defaultCategory) {
            // Create default category if it doesn't exist
            defaultCategory = this.categoryRepository.create({
              name: 'General',
              description: 'General category for uncategorized jobs',
              slug: 'general'
            });
            await this.categoryRepository.save(defaultCategory);
          }
          
          finalCategoryId = defaultCategory.id;
        }
      }

      // Generate slug from title (if title exists)
      let slug = 'draft';
      if (title && title.trim()) {
        slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        slug = `${slug}-draft-${Date.now()}`;
      } else {
        slug = `draft-${Date.now()}`;
      }

      const draftJob = this.jobRepository.create({
        client: { id: userId },
        category: { id: finalCategoryId },
        title: title || `Draft - ${new Date().toLocaleDateString()}`,
        slug,
        description: description || '',
        requirements,
        jobType: jobType || JobType.FIXED,
        budget,
        hourlyRateMin,
        hourlyRateMax,
        estimatedHours,
        duration,
        experienceLevel: experienceLevel || ExperienceLevel.INTERMEDIATE,
        skillsRequired: skillsRequired || [],
        deadline: deadline ? new Date(deadline) : undefined,
        status: JobStatus.DRAFT,
      });

      await this.jobRepository.save(draftJob);

      res.status(201).json({
        success: true,
        message: 'Draft saved successfully',
        data: { job: draftJob },
      });
    } catch (error) {
      next(error);
    }
  };

  // Get user's draft jobs
  getDraftJobs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        return next(createError('Authentication required', 401));
      }

      // Check if user exists and is a client
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return next(createError('User not found', 404));
      }
      
      if (user.role !== UserRole.CLIENT) {
        return next(createError('Only clients can view drafts', 403));
      }

      const drafts = await this.jobRepository.find({
        where: { 
          client: { id: userId },
          status: JobStatus.DRAFT 
        },
        relations: ['client', 'category'],
        order: { updatedAt: 'DESC' }
      });

      res.json({
        success: true,
        data: { jobs: drafts },
      });
    } catch (error) {
      next(error);
    }
  };

  updateJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const job = await this.jobRepository.findOne({ where: { id } });
      if (!job) {
        return next(createError('Job not found', 404));
      }

      // Check if user owns this job
      if (job.clientId !== userId) {
        return next(createError('You can only update your own jobs', 403));
      }

      Object.assign(job, req.body);
      await this.jobRepository.save(job);

      res.json({
        success: true,
        message: 'Job updated successfully',
        data: { job },
      });
    } catch (error) {
      next(error);
    }
  };

  deleteJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const job = await this.jobRepository.findOne({ where: { id } });
      if (!job) {
        return next(createError('Job not found', 404));
      }

      // Check if user owns this job
      if (job.clientId !== userId) {
        return next(createError('You can only delete your own jobs', 403));
      }

      await this.jobRepository.remove(job);

      res.json({
        success: true,
        message: 'Job deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Get jobs by client (for client dashboard)
  getMyJobs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const { status, page = 1, limit = 10 } = req.query;

      const pageNumber = parseInt(page as string);
      const limitNumber = parseInt(limit as string);
      const offset = (pageNumber - 1) * limitNumber;

      console.log(`📋 Getting jobs for client: ${userId}`);

      // Verify user is a client
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'role', 'status']
      });

      if (!user) {
        return next(createError('User not found', 404));
      }

      if (user.role !== UserRole.CLIENT) {
        return next(createError('Only clients can access this endpoint', 403));
      }

      // Build query for client's jobs (without proposals for now)
      const queryBuilder = this.jobRepository
        .createQueryBuilder('job')
        .leftJoinAndSelect('job.category', 'category')
        .where('job.clientId = :clientId', { clientId: userId })
        .orderBy('job.createdAt', 'DESC');

      // Filter by status if provided
      if (status) {
        const validStatuses = Object.values(JobStatus);
        if (!validStatuses.includes(status as JobStatus)) {
          return next(createError('Invalid job status', 400));
        }
        queryBuilder.andWhere('job.status = :status', { status });
      }

      // Get total count for pagination
      const totalCount = await queryBuilder.getCount();

      // Get paginated results
      const jobs = await queryBuilder
        .skip(offset)
        .take(limitNumber)
        .getMany();

      console.log(`📋 Retrieved ${jobs.length} jobs for client: ${userId}`);

      // For now, add basic stats without proposals
      // You can implement proposal counting later when Proposal entity is ready
      const jobsWithStats = jobs.map(job => ({
        ...job,
        proposalCount: 0, // TODO: Implement when Proposal entity is ready
        hasProposals: false, // TODO: Implement when Proposal entity is ready
        // proposals: [] // Remove this line for now
      }));

      res.json({
        success: true,
        data: {
          jobs: jobsWithStats,
          pagination: {
            page: pageNumber,
            limit: limitNumber,
            total: totalCount,
            pages: Math.ceil(totalCount / limitNumber)
          },
          summary: {
            totalJobs: totalCount,
            currentStatus: status || 'all'
          }
        }
      });
    } catch (error) {
      console.error('❌ Get my jobs error:', error);
      next(error);
    }
  };

  // Get job statistics for client dashboard
  getMyJobStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;

      console.log(`📊 Getting job statistics for client: ${userId}`);

      // Verify user is a client
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'role']
      });

      if (!user) {
        return next(createError('User not found', 404));
      }

      if (user.role !== UserRole.CLIENT) {
        return next(createError('Only clients can access this endpoint', 403));
      }

      // Get job counts by status
      const stats = await this.jobRepository
        .createQueryBuilder('job')
        .select('job.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('job.clientId = :clientId', { clientId: userId })
        .groupBy('job.status')
        .getRawMany();

      // Format statistics
      const formattedStats = {
        open: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
        ...stats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.count);
          return acc;
        }, {} as any)
      };

      const totalJobs = Object.values(formattedStats).reduce((sum: number, count) => sum + (count as number), 0);

      res.json({
        success: true,
        data: {
          jobStats: formattedStats,
          totalJobs,
          totalProposals: 0, // TODO: Implement when Proposal entity is ready
          summary: {
            activeJobs: formattedStats.open + formattedStats.in_progress,
            completedJobs: formattedStats.completed,
            successRate: totalJobs > 0 ? ((formattedStats.completed / totalJobs) * 100).toFixed(1) : '0'
          }
        }
      });
    } catch (error) {
      console.error('❌ Get job stats error:', error);
      next(error);
    }
  };
}