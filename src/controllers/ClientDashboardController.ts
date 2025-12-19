import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { User, UserRole, UserStatus } from '../entities/User';
import { Service, ServiceStatus } from '../entities/Service';
import { Job, JobStatus } from '../entities/Job';

export class ClientDashboardController {
  private userRepository = AppDataSource.getRepository(User);
  private serviceRepository = AppDataSource.getRepository(Service);
  private jobRepository = AppDataSource.getRepository(Job);

  // GET /api/client/dashboard/featured-freelancers - Get featured freelancers for dashboard
  getFeaturedFreelancers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit = 4 } = req.query;

      const freelancers = await this.userRepository
        .createQueryBuilder('user')
        .where('user.role = :role', { role: UserRole.FREELANCER })
        .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
        .andWhere('user.rating >= :minRating', { minRating: 4.5 })
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
          'user.createdAt'
        ])
        .orderBy('user.rating', 'DESC')
        .addOrderBy('user.reviewCount', 'DESC')
        .take(Number(limit))
        .getMany();

      // Transform data for frontend
      const transformedFreelancers = freelancers.map(freelancer => ({
        id: freelancer.id,
        name: `${freelancer.firstName} ${freelancer.lastName}`,
        rating: freelancer.rating || 0,
        reviewCount: freelancer.reviewCount || 0,
        skills: (freelancer.skills || []).slice(0, 3), // Limit to 3 skills for card display
        description: freelancer.bio || 'Experienced freelancer ready to help with your projects.',
        startingPrice: freelancer.hourlyRate ? `£${freelancer.hourlyRate}` : '£20',
        image: freelancer.avatar,
        badge: this.getFreelancerBadge(freelancer),
        isNewFreelancer: this.isNewFreelancer(freelancer.createdAt)
      }));

      res.json({
        success: true,
        data: transformedFreelancers
      });
    } catch (error) {
      console.error('Error fetching featured freelancers:', error);
      next(error);
    }
  };

  // GET /api/client/dashboard/popular-services - Get popular services for dashboard
  getPopularServices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit = 4 } = req.query;

      const services = await this.serviceRepository
        .createQueryBuilder('service')
        .leftJoinAndSelect('service.freelancer', 'freelancer')
        .where('service.status = :status', { status: ServiceStatus.ACTIVE })
        .andWhere('service.totalOrders >= :minOrders', { minOrders: 5 })
        .select([
          'service.id',
          'service.title',
          'service.shortDescription',
          'service.serviceType',
          'service.startingPrice',
          'service.rating',
          'service.totalOrders',
          'freelancer.firstName',
          'freelancer.lastName',
          'freelancer.avatar'
        ])
        .orderBy('service.totalOrders', 'DESC')
        .addOrderBy('service.rating', 'DESC')
        .take(Number(limit))
        .getMany();

      // Transform data for frontend service cards
      const transformedServices = services.map(service => ({
        id: service.id,
        title: service.title,
        description: service.shortDescription,
        icon: this.getServiceIcon(service.serviceType), // Generate icon based on service type
        price: `From £${service.startingPrice}`,
        rating: service.rating || 0,
        orders: service.totalOrders || 0,
        freelancer: {
          name: `${service.freelancer?.firstName} ${service.freelancer?.lastName}`,
          avatar: service.freelancer?.avatar
        }
      }));

      res.json({
        success: true,
        data: transformedServices
      });
    } catch (error) {
      console.error('Error fetching popular services:', error);
      next(error);
    }
  };

  // GET /api/client/dashboard/stats - Get client dashboard stats
  getClientStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;

      // Get client's jobs statistics
      const totalJobs = await this.jobRepository.count({
        where: { clientId: userId }
      });

      const activeJobs = await this.jobRepository.count({
        where: { 
          clientId: userId,
          status: JobStatus.OPEN 
        }
      });

      const completedJobs = await this.jobRepository.count({
        where: { 
          clientId: userId,
          status: JobStatus.COMPLETED 
        }
      });

      // Get user's total spent (if available)
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['totalSpent', 'jobsPosted']
      });

      const stats = {
        totalJobs,
        activeJobs,
        completedJobs,
        totalSpent: user?.totalSpent || 0,
        jobsPosted: user?.jobsPosted || totalJobs,
        averageJobValue: totalJobs > 0 ? (user?.totalSpent || 0) / totalJobs : 0
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching client stats:', error);
      next(error);
    }
  };

  // Helper method to get freelancer badge
  private getFreelancerBadge(freelancer: any): string | undefined {
    if (freelancer.rating >= 4.8 && freelancer.reviewCount >= 50) {
      return 'Top Rated';
    }
    if (freelancer.completedJobs >= 20 && freelancer.rating >= 4.5) {
      return 'Quick Delivery';
    }
    return undefined;
  }

  // Helper method to check if freelancer is new
  private isNewFreelancer(createdAt: Date): boolean {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(createdAt) > thirtyDaysAgo;
  }

  // Helper method to get service icon (placeholder - in real app would return proper icon component)
  private getServiceIcon(serviceType: string): any {
    const iconMap: { [key: string]: any } = {
      'video_editing': 'VideoIcon',
      'graphic_design': 'DesignIcon',
      'logo_design': 'LogoIcon',
      'content_writing': 'WritingIcon',
      'social_media': 'SocialIcon',
      'animation': 'AnimationIcon',
      'photography': 'PhotoIcon',
      'audio_editing': 'AudioIcon',
      'web_design': 'WebIcon',
      'branding': 'BrandIcon'
    };

    return iconMap[serviceType] || 'DefaultIcon';
  }
}
