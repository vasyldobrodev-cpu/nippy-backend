import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Payment, PaymentStatus, PaymentMethod } from '../entities/Payment';
import { User, UserRole } from '../entities/User';
import { Order } from '../entities/Order';
import { createError } from '../middleware/errorHandler';

export interface CreatePaymentData {
  orderId: string;
  clientId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  description?: string;
  metadata?: Record<string, any>;
}

export interface PaymentFilters {
  status?: PaymentStatus;
  method?: PaymentMethod;
  clientId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface PaymentStats {
  totalRevenue: number;
  totalPayouts: number;
  totalRefunds: number;
  totalCommissions: number;
  pendingPayments: number;
  completedPayments: number;
  failedPayments: number;
  recentTransactions: Payment[];
}

export class PaymentService {
  private paymentRepository: Repository<Payment>;
  private userRepository: Repository<User>;
  private orderRepository: Repository<Order>;

  constructor() {
    this.paymentRepository = AppDataSource.getRepository(Payment);
    this.userRepository = AppDataSource.getRepository(User);
    this.orderRepository = AppDataSource.getRepository(Order);
  }

  // Create a new payment
  async createPayment(data: CreatePaymentData): Promise<Payment> {
    try {
      // Validate order exists
      const order = await this.orderRepository.findOne({
        where: { id: data.orderId }
      });
      if (!order) {
        throw createError('Order not found', 404);
      }

      // Validate client exists
      const client = await this.userRepository.findOne({
        where: { id: data.clientId, role: UserRole.CLIENT }
      });
      if (!client) {
        throw createError('Client not found', 404);
      }

      // Generate a mock Stripe payment intent ID for now
      const stripePaymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const payment = this.paymentRepository.create({
        ...data,
        stripePaymentIntentId,
        status: PaymentStatus.PENDING,
      });

      return await this.paymentRepository.save(payment);
    } catch (error) {
      throw error;
    }
  }

  // Get all payments with filters
  async getPayments(filters: PaymentFilters = {}): Promise<{
    payments: Payment[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const {
        status,
        method,
        clientId,
        dateFrom,
        dateTo,
        page = 1,
        limit = 20
      } = filters;

      const queryBuilder = this.paymentRepository
        .createQueryBuilder('payment')
        .leftJoinAndSelect('payment.client', 'client')
        .leftJoinAndSelect('payment.order', 'order');

      // Apply filters
      if (status) {
        queryBuilder.andWhere('payment.status = :status', { status });
      }

      if (method) {
        queryBuilder.andWhere('payment.method = :method', { method });
      }

      if (clientId) {
        queryBuilder.andWhere('payment.clientId = :clientId', { clientId });
      }

      if (dateFrom) {
        queryBuilder.andWhere('payment.createdAt >= :dateFrom', { dateFrom });
      }

      if (dateTo) {
        queryBuilder.andWhere('payment.createdAt <= :dateTo', { dateTo });
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination
      const payments = await queryBuilder
        .orderBy('payment.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      return {
        payments,
        total,
        page,
        limit
      };
    } catch (error) {
      throw error;
    }
  }

  // Get payment by ID
  async getPaymentById(id: string): Promise<Payment> {
    try {
      const payment = await this.paymentRepository.findOne({
        where: { id },
        relations: ['client', 'order']
      });

      if (!payment) {
        throw createError('Payment not found', 404);
      }

      return payment;
    } catch (error) {
      throw error;
    }
  }

  // Update payment status
  async updatePaymentStatus(id: string, status: PaymentStatus, metadata?: Record<string, any>): Promise<Payment> {
    try {
      const payment = await this.getPaymentById(id);

      payment.status = status;
      if (status === PaymentStatus.COMPLETED || status === PaymentStatus.FAILED) {
        payment.processedAt = new Date();
      }

      if (metadata) {
        payment.metadata = { ...payment.metadata, ...metadata };
      }

      return await this.paymentRepository.save(payment);
    } catch (error) {
      throw error;
    }
  }

  // Process refund
  async processRefund(paymentId: string, refundAmount?: number, reason?: string): Promise<Payment> {
    try {
      const payment = await this.getPaymentById(paymentId);

      if (payment.status !== PaymentStatus.COMPLETED) {
        throw createError('Can only refund completed payments', 400);
      }

      const finalRefundAmount = refundAmount || payment.amount;
      
      if (finalRefundAmount > payment.amount) {
        throw createError('Refund amount cannot exceed original payment amount', 400);
      }

      // Create refund payment record
      const refundPayment = this.paymentRepository.create({
        orderId: payment.orderId,
        clientId: payment.clientId,
        amount: -finalRefundAmount, // Negative amount for refunds
        currency: payment.currency,
        method: payment.method,
        status: PaymentStatus.COMPLETED,
        stripePaymentIntentId: `refund_${payment.stripePaymentIntentId}`,
        description: `Refund for payment ${payment.id}${reason ? `: ${reason}` : ''}`,
        metadata: {
          originalPaymentId: payment.id,
          refundReason: reason,
          refundType: 'full'
        },
        processedAt: new Date()
      });

      // Update original payment status if fully refunded
      if (finalRefundAmount === payment.amount) {
        payment.status = PaymentStatus.REFUNDED;
        await this.paymentRepository.save(payment);
      }

      return await this.paymentRepository.save(refundPayment);
    } catch (error) {
      throw error;
    }
  }

  // Get payment statistics
  async getPaymentStats(clientId?: string): Promise<PaymentStats> {
    try {
      const queryBuilder = this.paymentRepository.createQueryBuilder('payment');

      if (clientId) {
        queryBuilder.where('payment.clientId = :clientId', { clientId });
      }

      // Get aggregate data
      const stats = await queryBuilder
        .select([
          'SUM(CASE WHEN payment.amount > 0 AND payment.status = :completed THEN payment.amount ELSE 0 END) as totalRevenue',
          'SUM(CASE WHEN payment.amount < 0 AND payment.status = :completed THEN ABS(payment.amount) ELSE 0 END) as totalRefunds',
          'COUNT(CASE WHEN payment.status = :pending THEN 1 END) as pendingPayments',
          'COUNT(CASE WHEN payment.status = :completed THEN 1 END) as completedPayments',
          'COUNT(CASE WHEN payment.status = :failed THEN 1 END) as failedPayments'
        ])
        .setParameters({
          completed: PaymentStatus.COMPLETED,
          pending: PaymentStatus.PENDING,
          failed: PaymentStatus.FAILED
        })
        .getRawOne();

      // Handle case when no payments exist
      if (!stats) {
        return {
          totalRevenue: 0,
          totalPayouts: 0,
          totalRefunds: 0,
          totalCommissions: 0,
          pendingPayments: 0,
          completedPayments: 0,
          failedPayments: 0,
          recentTransactions: []
        };
      }

      // Calculate commissions (assuming 10% platform fee)
      const totalCommissions = (parseFloat(stats.totalrevenue) || 0) * 0.1;
      const totalPayouts = (parseFloat(stats.totalrevenue) || 0) - totalCommissions;

      // Get recent transactions with a fresh query builder
      const recentTransactionsQuery = this.paymentRepository.createQueryBuilder('payment');
      
      if (clientId) {
        recentTransactionsQuery.where('payment.clientId = :clientId', { clientId });
      }

      const recentTransactions = await recentTransactionsQuery
        .leftJoinAndSelect('payment.client', 'client')
        .leftJoinAndSelect('payment.order', 'order')
        .orderBy('payment.createdAt', 'DESC')
        .limit(10)
        .getMany();

      return {
        totalRevenue: parseFloat(stats.totalrevenue) || 0,
        totalPayouts: totalPayouts,
        totalRefunds: parseFloat(stats.totalrefunds) || 0,
        totalCommissions: totalCommissions,
        pendingPayments: parseInt(stats.pendingpayments) || 0,
        completedPayments: parseInt(stats.completedpayments) || 0,
        failedPayments: parseInt(stats.failedpayments) || 0,
        recentTransactions
      };
    } catch (error) {
      throw error;
    }
  }

  // Simulate payment processing (for demo purposes)
  async simulatePaymentProcessing(paymentId: string, shouldSucceed: boolean = true): Promise<Payment> {
    try {
      const payment = await this.getPaymentById(paymentId);

      if (payment.status !== PaymentStatus.PENDING) {
        throw createError('Payment is not in pending status', 400);
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newStatus = shouldSucceed ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;
      const metadata = {
        simulationRun: true,
        processedBy: 'simulation',
        processingTime: new Date().toISOString()
      };

      return await this.updatePaymentStatus(paymentId, newStatus, metadata);
    } catch (error) {
      throw error;
    }
  }

  // Get payments by client ID
  async getClientPayments(clientId: string, page: number = 1, limit: number = 10): Promise<{
    payments: Payment[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.getPayments({ clientId, page, limit });
  }
}
