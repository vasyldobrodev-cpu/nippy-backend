import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Service, ServiceStatus, ServiceType } from '../entities/Service';
import { User, UserRole } from '../entities/User';
import { createError } from '../middleware/errorHandler';

export class ServiceController {
  private serviceRepository = AppDataSource.getRepository(Service);
  private userRepository = AppDataSource.getRepository(User);

  getAllServices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 12, category, type, minPrice, maxPrice } = req.query;
      
      const queryBuilder = this.serviceRepository.createQueryBuilder('service')
        .leftJoinAndSelect('service.freelancer', 'freelancer')
        .leftJoinAndSelect('service.category', 'category')
        .where('service.status = :status', { status: ServiceStatus.ACTIVE });

      if (category) {
        queryBuilder.andWhere('service.categoryId = :category', { category });
      }

      if (type) {
        queryBuilder.andWhere('service.serviceType = :type', { type });
      }

      if (minPrice) {
        queryBuilder.andWhere('service.startingPrice >= :minPrice', { minPrice });
      }

      if (maxPrice) {
        queryBuilder.andWhere('service.startingPrice <= :maxPrice', { maxPrice });
      }

      const [services, total] = await queryBuilder
        .skip((Number(page) - 1) * Number(limit))
        .take(Number(limit))
        .orderBy('service.rating', 'DESC')
        .getManyAndCount();

      res.json({
        success: true,
        data: {
          services,
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

  getServiceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const service = await this.serviceRepository.findOne({
        where: { id },
        relations: ['freelancer', 'category'],
      });

      if (!service) {
        return next(createError('Service not found', 404));
      }

      // Increment view count
      service.viewCount += 1;
      await this.serviceRepository.save(service);

      res.json({
        success: true,
        data: { service },
      });
    } catch (error) {
      next(error);
    }
  };

  createService = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const {
        title,
        description,
        shortDescription,
        serviceType,
        startingPrice,
        deliveryDays,
        revisions,
        features,
        tags,
        categoryId,
      } = req.body;

      // Check if user is a freelancer
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user || user.role !== UserRole.FREELANCER) {
        return next(createError('Only freelancers can create services', 403));
      }

      // Generate slug from title
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const service = this.serviceRepository.create({
        freelancerId: userId,
        categoryId,
        title,
        slug: `${slug}-${Date.now()}`,
        description,
        shortDescription,
        serviceType,
        startingPrice,
        deliveryDays,
        revisions,
        features: features || [],
        tags: tags || [],
      });

      await this.serviceRepository.save(service);

      res.status(201).json({
        success: true,
        message: 'Service created successfully',
        data: { service },
      });
    } catch (error) {
      next(error);
    }
  };

  updateService = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const service = await this.serviceRepository.findOne({ where: { id } });
      if (!service) {
        return next(createError('Service not found', 404));
      }

      // Check if user owns this service
      if (service.freelancerId !== userId) {
        return next(createError('You can only update your own services', 403));
      }

      Object.assign(service, req.body);
      await this.serviceRepository.save(service);

      res.json({
        success: true,
        message: 'Service updated successfully',
        data: { service },
      });
    } catch (error) {
      next(error);
    }
  };

  deleteService = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const service = await this.serviceRepository.findOne({ where: { id } });
      if (!service) {
        return next(createError('Service not found', 404));
      }

      // Check if user owns this service
      if (service.freelancerId !== userId) {
        return next(createError('You can only delete your own services', 403));
      }

      await this.serviceRepository.remove(service);

      res.json({
        success: true,
        message: 'Service deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}