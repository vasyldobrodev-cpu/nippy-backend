import { Request, Response, NextFunction } from 'express';
import { PaymentService, CreatePaymentData, PaymentFilters } from '../services/PaymentService';
import { PaymentStatus, PaymentMethod } from '../entities/Payment';
import { createError } from '../middleware/errorHandler';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
    status: string;
  };
}

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
    
    // Bind methods to preserve 'this' context
    this.createPayment = this.createPayment.bind(this);
    this.getPayments = this.getPayments.bind(this);
    this.getPaymentById = this.getPaymentById.bind(this);
    this.updatePaymentStatus = this.updatePaymentStatus.bind(this);
    this.processRefund = this.processRefund.bind(this);
    this.getPaymentStats = this.getPaymentStats.bind(this);
    this.simulatePayment = this.simulatePayment.bind(this);
    this.getClientPayments = this.getClientPayments.bind(this);
  }

  // Create a new payment
  async createPayment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId, amount, currency, method, description, metadata } = req.body;
      const clientId = req.user.userId;

      if (!orderId || !amount || !currency) {
        return next(createError('Order ID, amount, and currency are required', 400));
      }

      if (amount <= 0) {
        return next(createError('Amount must be greater than 0', 400));
      }

      const paymentData: CreatePaymentData = {
        orderId,
        clientId,
        amount: parseFloat(amount),
        currency: currency.toUpperCase(),
        method: method || PaymentMethod.STRIPE,
        description,
        metadata
      };

      const payment = await this.paymentService.createPayment(paymentData);

      res.status(201).json({
        success: true,
        message: 'Payment created successfully',
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all payments with filters
  async getPayments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        status,
        method,
        clientId,
        dateFrom,
        dateTo,
        page = '1',
        limit = '20'
      } = req.query;

      const filters: PaymentFilters = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      if (status && Object.values(PaymentStatus).includes(status as PaymentStatus)) {
        filters.status = status as PaymentStatus;
      }

      if (method && Object.values(PaymentMethod).includes(method as PaymentMethod)) {
        filters.method = method as PaymentMethod;
      }

      if (clientId) {
        filters.clientId = clientId as string;
      }

      if (dateFrom) {
        filters.dateFrom = new Date(dateFrom as string);
      }

      if (dateTo) {
        filters.dateTo = new Date(dateTo as string);
      }

      // If user is not admin, only show their own payments
      if (req.user.role !== 'admin') {
        filters.clientId = req.user.userId;
      }

      const result = await this.paymentService.getPayments(filters);

      res.json({
        success: true,
        message: 'Payments retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get payment by ID
  async getPaymentById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        return next(createError('Payment ID is required', 400));
      }

      const payment = await this.paymentService.getPaymentById(id);

      // Check if user has access to this payment
      if (req.user.role !== 'admin' && payment.clientId !== req.user.userId) {
        return next(createError('Access denied', 403));
      }

      res.json({
        success: true,
        message: 'Payment retrieved successfully',
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }

  // Update payment status (admin only)
  async updatePaymentStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, metadata } = req.body;

      if (req.user.role !== 'admin') {
        return next(createError('Admin access required', 403));
      }

      if (!id || !status) {
        return next(createError('Payment ID and status are required', 400));
      }

      if (!Object.values(PaymentStatus).includes(status)) {
        return next(createError('Invalid payment status', 400));
      }

      const payment = await this.paymentService.updatePaymentStatus(id, status, metadata);

      res.json({
        success: true,
        message: 'Payment status updated successfully',
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }

  // Process refund (admin only)
  async processRefund(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { refundAmount, reason } = req.body;

      if (req.user.role !== 'admin') {
        return next(createError('Admin access required', 403));
      }

      if (!id) {
        return next(createError('Payment ID is required', 400));
      }

      const refundPayment = await this.paymentService.processRefund(
        id,
        refundAmount ? parseFloat(refundAmount) : undefined,
        reason
      );

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: refundPayment
      });
    } catch (error) {
      next(error);
    }
  }

  // Get payment statistics
  async getPaymentStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clientId } = req.query;

      // If user is not admin, only show their own stats
      const finalClientId = req.user.role === 'admin' 
        ? clientId as string 
        : req.user.userId;

      const stats = await this.paymentService.getPaymentStats(finalClientId);

      res.json({
        success: true,
        message: 'Payment statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  // Simulate payment processing (for demo purposes)
  async simulatePayment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { shouldSucceed = true } = req.body;

      if (!id) {
        return next(createError('Payment ID is required', 400));
      }

      const payment = await this.paymentService.simulatePaymentProcessing(id, shouldSucceed);

      res.json({
        success: true,
        message: `Payment simulation ${shouldSucceed ? 'succeeded' : 'failed'}`,
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }

  // Get client's own payments
  async getClientPayments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '10' } = req.query;
      const clientId = req.user.userId;

      const result = await this.paymentService.getClientPayments(
        clientId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        message: 'Client payments retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
