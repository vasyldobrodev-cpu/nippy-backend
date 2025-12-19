import { Router } from 'express';
import authRoutes from './auth';
import jobRoutes from './jobs';
import serviceRoutes from './services';
import freelancerRoutes from './freelancers';
import clientDashboardRoutes from './client-dashboard';
import userRoutes from './users';
import messageRoutes from './messages';
import fileRoutes from './files';
import paymentRoutes from './payments';

const router = Router();

// Route prefixes
router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/services', serviceRoutes);
router.use('/freelancers', freelancerRoutes);
router.use('/client/dashboard', clientDashboardRoutes);
router.use('/users', userRoutes);
router.use('/messages', messageRoutes);
router.use('/files', fileRoutes);
router.use('/payments', paymentRoutes);

export default router;