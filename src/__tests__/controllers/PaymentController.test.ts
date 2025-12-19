import { Response, NextFunction } from 'express';
import { PaymentController } from '../../controllers/PaymentController';
import { PaymentService } from '../../services/PaymentService';
import { PaymentStatus, PaymentMethod } from '../../entities/Payment';
import { createMockRequest, createMockResponse, createMockNext } from '../helpers/mocks';

// Mock PaymentService
jest.mock('../../services/PaymentService');

describe('PaymentController', () => {
  let paymentController: PaymentController;
  let mockPaymentService: jest.Mocked<PaymentService>;
  let mockRequest: any;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockPaymentService = {
      createPayment: jest.fn(),
      getPayments: jest.fn(),
      getPaymentById: jest.fn(),
      updatePaymentStatus: jest.fn(),
      processRefund: jest.fn(),
      getPaymentStats: jest.fn(),
      simulatePaymentProcessing: jest.fn(),
      getClientPayments: jest.fn(),
    } as any;

    (PaymentService as jest.Mock).mockImplementation(() => mockPaymentService);

    paymentController = new PaymentController();

    mockRequest = createMockRequest({
      user: {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'client',
        status: 'active',
      },
    });
    mockResponse = createMockResponse();
    mockNext = createMockNext();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create payment successfully', async () => {
      const paymentData = {
        orderId: 'order-123',
        amount: 100.50,
        currency: 'usd',
        method: PaymentMethod.STRIPE,
      };

      const mockPayment = {
        id: 'payment-123',
        ...paymentData,
        status: PaymentStatus.PENDING,
      };

      mockRequest.body = paymentData;
      mockPaymentService.createPayment.mockResolvedValue(mockPayment as any);

      await paymentController.createPayment(mockRequest, mockResponse as Response, mockNext);

      expect(mockPaymentService.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: paymentData.orderId,
          clientId: mockRequest.user.userId,
          amount: paymentData.amount,
          currency: 'USD', // Should be uppercase
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Payment created successfully',
          data: mockPayment,
        })
      );
    });

    it('should return error if required fields are missing', async () => {
      mockRequest.body = { amount: 100 };

      await paymentController.createPayment(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Order ID, amount, and currency are required',
        })
      );
      expect(mockPaymentService.createPayment).not.toHaveBeenCalled();
    });

    it('should return error if amount is invalid', async () => {
      mockRequest.body = {
        orderId: 'order-123',
        amount: -10,
        currency: 'usd',
      };

      await paymentController.createPayment(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Amount must be greater than 0',
        })
      );
    });
  });

  describe('getPayments', () => {
    it('should get payments with filters', async () => {
      const mockPayments = {
        payments: [{ id: 'payment-1' }, { id: 'payment-2' }],
        total: 2,
        page: 1,
        limit: 20,
      };

      mockRequest.query = {
        status: PaymentStatus.COMPLETED,
        page: '1',
        limit: '20',
      };

      mockPaymentService.getPayments.mockResolvedValue(mockPayments as any);

      await paymentController.getPayments(mockRequest, mockResponse as Response, mockNext);

      expect(mockPaymentService.getPayments).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PaymentStatus.COMPLETED,
          page: 1,
          limit: 20,
        })
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockPayments,
        })
      );
    });

    it('should filter by clientId for non-admin users', async () => {
      mockRequest.user.role = 'client';
      mockRequest.query = { page: '1', limit: '10' };

      const mockPayments = {
        payments: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      mockPaymentService.getPayments.mockResolvedValue(mockPayments as any);

      await paymentController.getPayments(mockRequest, mockResponse as Response, mockNext);

      expect(mockPaymentService.getPayments).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: mockRequest.user.userId,
        })
      );
    });
  });

  describe('getPaymentById', () => {
    it('should get payment by id', async () => {
      const mockPayment = {
        id: 'payment-123',
        amount: 100,
        status: PaymentStatus.COMPLETED,
        clientId: mockRequest.user.userId,
      };

      mockRequest.params = { id: 'payment-123' };
      mockPaymentService.getPaymentById.mockResolvedValue(mockPayment as any);

      await paymentController.getPaymentById(mockRequest, mockResponse as Response, mockNext);

      expect(mockPaymentService.getPaymentById).toHaveBeenCalledWith('payment-123');
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockPayment,
        })
      );
    });

    it('should deny access if user is not admin and not the owner', async () => {
      const mockPayment = {
        id: 'payment-123',
        clientId: 'other-user-id',
      };

      mockRequest.user.role = 'client';
      mockRequest.params = { id: 'payment-123' };
      mockPaymentService.getPaymentById.mockResolvedValue(mockPayment as any);

      await paymentController.getPaymentById(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access denied',
        })
      );
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status (admin only)', async () => {
      mockRequest.user.role = 'admin';
      mockRequest.params = { id: 'payment-123' };
      mockRequest.body = { status: PaymentStatus.COMPLETED };

      const mockPayment = {
        id: 'payment-123',
        status: PaymentStatus.COMPLETED,
      };

      mockPaymentService.updatePaymentStatus.mockResolvedValue(mockPayment as any);

      await paymentController.updatePaymentStatus(
        mockRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockPaymentService.updatePaymentStatus).toHaveBeenCalledWith(
        'payment-123',
        PaymentStatus.COMPLETED,
        undefined
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it('should deny access for non-admin users', async () => {
      mockRequest.user.role = 'client';
      mockRequest.params = { id: 'payment-123' };
      mockRequest.body = { status: PaymentStatus.COMPLETED };

      await paymentController.updatePaymentStatus(
        mockRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Admin access required',
        })
      );
    });
  });

  describe('processRefund', () => {
    it('should process refund (admin only)', async () => {
      mockRequest.user.role = 'admin';
      mockRequest.params = { id: 'payment-123' };
      mockRequest.body = { refundAmount: 50, reason: 'Customer request' };

      const mockRefund = {
        id: 'refund-123',
        amount: -50,
      };

      mockPaymentService.processRefund.mockResolvedValue(mockRefund as any);

      await paymentController.processRefund(mockRequest, mockResponse as Response, mockNext);

      expect(mockPaymentService.processRefund).toHaveBeenCalledWith(
        'payment-123',
        50,
        'Customer request'
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });

  describe('getPaymentStats', () => {
    it('should get payment stats', async () => {
      const mockStats = {
        totalRevenue: 1000,
        totalPayouts: 900,
        totalRefunds: 100,
        pendingPayments: 5,
        completedPayments: 10,
        failedPayments: 2,
        recentTransactions: [],
      };

      mockRequest.user.role = 'admin';
      mockRequest.query = {};
      mockPaymentService.getPaymentStats.mockResolvedValue(mockStats as any);

      await paymentController.getPaymentStats(mockRequest, mockResponse as Response, mockNext);

      expect(mockPaymentService.getPaymentStats).toHaveBeenCalledWith(undefined);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockStats,
        })
      );
    });

    it('should filter stats by clientId for non-admin users', async () => {
      mockRequest.user.role = 'client';
      mockRequest.query = {};

      const mockStats = {
        totalRevenue: 500,
        totalPayouts: 450,
        totalRefunds: 50,
        pendingPayments: 2,
        completedPayments: 5,
        failedPayments: 1,
        recentTransactions: [],
      };

      mockPaymentService.getPaymentStats.mockResolvedValue(mockStats as any);

      await paymentController.getPaymentStats(mockRequest, mockResponse as Response, mockNext);

      expect(mockPaymentService.getPaymentStats).toHaveBeenCalledWith(mockRequest.user.userId);
    });
  });
});

