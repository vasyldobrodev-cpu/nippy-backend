import { Router } from 'express';
import { ClientDashboardController } from '../controllers/ClientDashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();
const clientDashboardController = new ClientDashboardController();

// Protected routes - require authentication
router.use(authenticate);

router.get('/featured-freelancers', clientDashboardController.getFeaturedFreelancers);
router.get('/popular-services', clientDashboardController.getPopularServices);
router.get('/stats', clientDashboardController.getClientStats);

export default router;
