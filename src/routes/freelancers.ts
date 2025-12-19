import { Router } from 'express';
import { FreelancerController } from '../controllers/FreelancerController';
import { authenticate } from '../middleware/auth';

const router = Router();
const freelancerController = new FreelancerController();

// Public routes
router.get('/', freelancerController.getAllFreelancers);
router.get('/:id', freelancerController.getFreelancerById);
router.get('/:id/reviews', freelancerController.getFreelancerReviews);

export default router;
