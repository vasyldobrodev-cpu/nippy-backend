import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { User, UserRole, UserStatus } from '../entities/User';
import { Service, ServiceStatus } from '../entities/Service';

export class FreelancerController {
  private userRepository = AppDataSource.getRepository(User);
  private serviceRepository = AppDataSource.getRepository(Service);

  // GET /api/freelancers - Get all freelancers with pagination and filters
  getAllFreelancers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { 
        page = 1, 
        limit = 12, 
        search, 
        skills, 
        minRating = 0, 
        availability, 
        minHourlyRate, 
        maxHourlyRate 
      } = req.query;

      const queryBuilder = this.userRepository.createQueryBuilder('user')
        .where('user.role = :role', { role: UserRole.FREELANCER })
        .andWhere('user.status = :status', { status: UserStatus.ACTIVE });

      // Search by name
      if (search) {
        queryBuilder.andWhere(
          '(LOWER(user.firstName) LIKE LOWER(:search) OR LOWER(user.lastName) LIKE LOWER(:search))',
          { search: `%${search}%` }
        );
      }

      // Filter by skills (assuming skills are stored as JSON array)
      if (skills) {
        const skillsArray = Array.isArray(skills) ? skills : [skills];
        skillsArray.forEach((skill, index) => {
          queryBuilder.andWhere(`JSON_CONTAINS(user.skills, :skill${index})`, {
            [`skill${index}`]: JSON.stringify(skill)
          });
        });
      }

      // Filter by rating
      if (minRating && Number(minRating) > 0) {
        queryBuilder.andWhere('user.rating >= :minRating', { minRating: Number(minRating) });
      }

      // Filter by availability
      if (availability) {
        queryBuilder.andWhere('user.availability = :availability', { availability });
      }

      // Filter by hourly rate
      if (minHourlyRate) {
        queryBuilder.andWhere('user.hourlyRate >= :minHourlyRate', { minHourlyRate: Number(minHourlyRate) });
      }
      if (maxHourlyRate) {
        queryBuilder.andWhere('user.hourlyRate <= :maxHourlyRate', { maxHourlyRate: Number(maxHourlyRate) });
      }

      const [freelancers, total] = await queryBuilder
        .select([
          'user.id',
          'user.firstName',
          'user.lastName',
          'user.avatar',
          'user.rating',
          'user.reviewCount',
          'user.skills',
          'user.bio',
          'user.hourlyRate',
          'user.completedJobs',
          'user.totalEarnings',
          'user.createdAt',
          'user.lastLoginAt'
        ])
        .skip((Number(page) - 1) * Number(limit))
        .take(Number(limit))
        .orderBy('user.rating', 'DESC')
        .addOrderBy('user.reviewCount', 'DESC')
        .getManyAndCount();

      // Transform data for frontend
      const transformedFreelancers = freelancers.map(freelancer => ({
        id: freelancer.id,
        name: `${freelancer.firstName} ${freelancer.lastName}`,
        rating: freelancer.rating || 0,
        reviewCount: freelancer.reviewCount || 0,
        skills: freelancer.skills || [],
        description: freelancer.bio || 'Experienced freelancer ready to help with your projects.',
        startingPrice: freelancer.hourlyRate ? `£${freelancer.hourlyRate}` : '£20',
        image: freelancer.avatar,
        badge: this.getFreelancerBadge(freelancer),
        isNewFreelancer: this.isNewFreelancer(freelancer.createdAt),
        availability: 'Available', // Default availability since field doesn't exist yet
        completedJobs: freelancer.completedJobs || 0,
        totalEarnings: freelancer.totalEarnings || 0
      }));

      res.json({
        success: true,
        data: {
          freelancers: transformedFreelancers,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/freelancers/:id - Get freelancer profile
  getFreelancerById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const freelancer = await this.userRepository.findOne({
        where: { 
          id, 
          role: UserRole.FREELANCER,
          status: UserStatus.ACTIVE 
        },
        select: [
          'id', 'firstName', 'lastName', 'email', 'avatar', 'phone',
          'country', 'city', 'rating', 'reviewCount', 'skills', 'bio',
          'hourlyRate', 'completedJobs', 'totalEarnings',
          'createdAt', 'lastLoginAt'
        ]
      });

      if (!freelancer) {
        return res.status(404).json({
          success: false,
          message: 'Freelancer not found'
        });
      }

      // Get freelancer's services
      const services = await this.serviceRepository.find({
        where: { 
          freelancerId: id,
          status: ServiceStatus.ACTIVE 
        },
        select: ['id', 'title', 'shortDescription', 'startingPrice', 'rating', 'reviewCount'],
        take: 6 // Limit to 6 services
      });

      const freelancerProfile = {
        id: freelancer.id,
        name: `${freelancer.firstName} ${freelancer.lastName}`,
        email: freelancer.email,
        avatar: freelancer.avatar,
        phone: freelancer.phone,
        location: freelancer.city && freelancer.country ? `${freelancer.city}, ${freelancer.country}` : null,
        rating: freelancer.rating || 0,
        reviewCount: freelancer.reviewCount || 0,
        skills: freelancer.skills || [],
        bio: freelancer.bio,
        hourlyRate: freelancer.hourlyRate,
        availability: 'Available', // Default availability since field doesn't exist yet
        completedJobs: freelancer.completedJobs || 0,
        totalEarnings: freelancer.totalEarnings || 0,
        memberSince: freelancer.createdAt,
        lastActive: freelancer.lastLoginAt,
        services: services,
        badge: this.getFreelancerBadge(freelancer),
        isNewFreelancer: this.isNewFreelancer(freelancer.createdAt)
      };

      res.json({
        success: true,
        data: freelancerProfile
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/freelancers/:id/reviews - Get freelancer reviews
  getFreelancerReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      // For now, return mock reviews since we don't have a reviews table yet
      // In a real implementation, you would query a reviews/ratings table
      const mockReviews = [
        {
          id: '1',
          rating: 5,
          comment: 'Excellent work! Very professional and delivered on time.',
          reviewerName: 'John Smith',
          reviewerAvatar: null,
          projectTitle: 'Logo Design Project',
          createdAt: new Date('2024-01-10'),
          helpful: 12
        },
        {
          id: '2',
          rating: 4,
          comment: 'Good communication and quality work. Highly recommended.',
          reviewerName: 'Sarah Johnson',
          reviewerAvatar: null,
          projectTitle: 'Website Design',
          createdAt: new Date('2024-01-05'),
          helpful: 8
        }
      ];

      const startIndex = (Number(page) - 1) * Number(limit);
      const paginatedReviews = mockReviews.slice(startIndex, startIndex + Number(limit));

      res.json({
        success: true,
        data: {
          reviews: paginatedReviews,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: mockReviews.length,
            pages: Math.ceil(mockReviews.length / Number(limit))
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // Helper methods
  private getFreelancerBadge(freelancer: any): string | undefined {
    if (freelancer.rating >= 4.8 && freelancer.reviewCount >= 50) {
      return 'Top Rated';
    }
    if (freelancer.completedJobs >= 20 && freelancer.rating >= 4.5) {
      return 'Quick Delivery';
    }
    return undefined;
  }

  private isNewFreelancer(createdAt: Date): boolean {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(createdAt) > thirtyDaysAgo;
  }
}
