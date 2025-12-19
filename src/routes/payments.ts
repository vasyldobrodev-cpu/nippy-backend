import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { authenticate } from '../middleware/auth';

const router = Router();
const paymentController = new PaymentController();

// All routes require authentication
router.use(authenticate);

// Payment management routes
router.post('/', paymentController.createPayment as any);
router.get('/', paymentController.getPayments as any);
router.get('/stats', paymentController.getPaymentStats as any);
router.get('/client', paymentController.getClientPayments as any);
router.get('/:id', paymentController.getPaymentById as any);

// Admin only routes
router.put('/:id/status', paymentController.updatePaymentStatus as any);
router.post('/:id/refund', paymentController.processRefund as any);

// Demo/simulation routes
router.post('/:id/simulate', paymentController.simulatePayment as any);

export default router;
