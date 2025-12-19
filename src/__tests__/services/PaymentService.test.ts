import { PaymentService, CreatePaymentData } from '../../services/PaymentService';
import { Payment, PaymentStatus, PaymentMethod } from '../../entities/Payment';
import { User, UserRole } from '../../entities/User';
import { Order } from '../../entities/Order';
import { AppDataSource } from '../../config/database';
import { createMockRepository, createMockQueryBuilder } from '../helpers/mocks';

// Mock AppDataSource
jest.mock('../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let mockPaymentRepository: any;
  let mockUserRepository: any;
  let mockOrderRepository: any;
  let mockQueryBuilder: any;

  beforeEach(() => {
    // Create mock repositories
    mockPaymentRepository = createMockRepository<Payment>();
    mockUserRepository = createMockRepository<User>();
    mockOrderRepository = createMockRepository<Order>();
    mockQueryBuilder = createMockQueryBuilder();

    // Setup AppDataSource mocks
    (AppDataSource.getRepository as jest.Mock)
      .mockImplementation((entity) => {
        if (entity === Payment) return mockPaymentRepository;
        if (entity === User) return mockUserRepository;
        if (entity === Order) return mockOrderRepository;
        return createMockRepository();
      });

    // Setup query builder mock
    mockPaymentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    paymentService = new PaymentService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    const mockPaymentData: CreatePaymentData = {
      orderId: 'order-123',
      clientId: 'client-123',
      amount: 100.50,
      currency: 'USD',
      method: PaymentMethod.STRIPE,
      description: 'Test payment',
    };

    it('should create a payment successfully', async () => {
      const mockOrder: Partial<Order> = { id: 'order-123' };
      const mockClient: Partial<User> = { id: 'client-123', role: UserRole.CLIENT };
      const mockPayment: Partial<Payment> = {
        id: 'payment-123',
        ...mockPaymentData,
        status: PaymentStatus.PENDING,
        stripePaymentIntentId: 'pi_test_123',
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockUserRepository.findOne.mockResolvedValue(mockClient);
      mockPaymentRepository.create.mockReturnValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue(mockPayment);

      const result = await paymentService.createPayment(mockPaymentData);

      expect(mockOrderRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockPaymentData.orderId },
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockPaymentData.clientId, role: UserRole.CLIENT },
      });
      expect(mockPaymentRepository.create).toHaveBeenCalled();
      expect(mockPaymentRepository.save).toHaveBeenCalled();
      expect(result.status).toBe(PaymentStatus.PENDING);
    });

    it('should throw error if order not found', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(paymentService.createPayment(mockPaymentData)).rejects.toThrow(
        'Order not found'
      );
    });

    it('should throw error if client not found', async () => {
      const mockOrder: Partial<Order> = { id: 'order-123' };
      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(paymentService.createPayment(mockPaymentData)).rejects.toThrow(
        'Client not found'
      );
    });
  });

  describe('getPaymentById', () => {
    it('should return payment by id', async () => {
      const mockPayment: Partial<Payment> = {
        id: 'payment-123',
        amount: 100,
        status: PaymentStatus.COMPLETED,
      };

      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);

      const result = await paymentService.getPaymentById('payment-123');

      expect(mockPaymentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'payment-123' },
        relations: ['client', 'order'],
      });
      expect(result).toEqual(mockPayment);
    });

    it('should throw error if payment not found', async () => {
      mockPaymentRepository.findOne.mockResolvedValue(null);

      await expect(paymentService.getPaymentById('invalid-id')).rejects.toThrow(
        'Payment not found'
      );
    });
  });

  describe('getPayments', () => {
    it('should return paginated payments with filters', async () => {
      const mockPayments: Partial<Payment>[] = [
        { id: 'payment-1', amount: 100, status: PaymentStatus.COMPLETED },
        { id: 'payment-2', amount: 200, status: PaymentStatus.PENDING },
      ];

      mockQueryBuilder.getCount.mockResolvedValue(2);
      mockQueryBuilder.getMany.mockResolvedValue(mockPayments);

      const result = await paymentService.getPayments({
        status: PaymentStatus.COMPLETED,
        page: 1,
        limit: 20,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'payment.status = :status',
        { status: PaymentStatus.COMPLETED }
      );
      expect(result.payments).toEqual(mockPayments);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should apply multiple filters', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await paymentService.getPayments({
        status: PaymentStatus.PENDING,
        method: PaymentMethod.STRIPE,
        clientId: 'client-123',
        page: 1,
        limit: 10,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'payment.status = :status',
        { status: PaymentStatus.PENDING }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'payment.method = :method',
        { method: PaymentMethod.STRIPE }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'payment.clientId = :clientId',
        { clientId: 'client-123' }
      );
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status successfully', async () => {
      const mockPayment: Partial<Payment> = {
        id: 'payment-123',
        status: PaymentStatus.PENDING,
        processedAt: undefined,
      };

      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
        processedAt: new Date(),
      });

      const result = await paymentService.updatePaymentStatus(
        'payment-123',
        PaymentStatus.COMPLETED
      );

      expect(result.status).toBe(PaymentStatus.COMPLETED);
      expect(result.processedAt).toBeDefined();
    });

    it('should update metadata if provided', async () => {
      const mockPayment: Partial<Payment> = {
        id: 'payment-123',
        status: PaymentStatus.PENDING,
        metadata: {},
      };

      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue(mockPayment);

      const metadata = { note: 'Test note' };
      await paymentService.updatePaymentStatus(
        'payment-123',
        PaymentStatus.COMPLETED,
        metadata
      );

      expect(mockPaymentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining(metadata),
        })
      );
    });
  });

  describe('processRefund', () => {
    it('should process full refund successfully', async () => {
      const mockPayment: Partial<Payment> = {
        id: 'payment-123',
        amount: 100,
        status: PaymentStatus.COMPLETED,
        orderId: 'order-123',
        clientId: 'client-123',
        currency: 'USD',
        method: PaymentMethod.STRIPE,
        stripePaymentIntentId: 'pi_123',
      };

      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);
      const mockRefund = {
        ...mockPayment,
        amount: -100,
        id: 'refund-123',
      };
      mockPaymentRepository.create.mockReturnValue(mockRefund);
      mockPaymentRepository.save
        .mockResolvedValueOnce(mockPayment) // First save for original payment
        .mockResolvedValueOnce(mockRefund); // Second save for refund

      const result = await paymentService.processRefund('payment-123');

      expect(mockPaymentRepository.save).toHaveBeenCalledTimes(2); // Original + refund
      expect(result.amount).toBe(-100);
    });

    it('should throw error if payment is not completed', async () => {
      const mockPayment: Partial<Payment> = {
        id: 'payment-123',
        status: PaymentStatus.PENDING,
      };

      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);

      await expect(paymentService.processRefund('payment-123')).rejects.toThrow(
        'Can only refund completed payments'
      );
    });

    it('should throw error if refund amount exceeds payment amount', async () => {
      const mockPayment: Partial<Payment> = {
        id: 'payment-123',
        amount: 100,
        status: PaymentStatus.COMPLETED,
      };

      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);

      await expect(
        paymentService.processRefund('payment-123', 150)
      ).rejects.toThrow('Refund amount cannot exceed original payment amount');
    });
  });

  describe('getPaymentStats', () => {
    it('should return payment statistics', async () => {
      const mockStats = {
        totalrevenue: '1000.00',
        totalrefunds: '100.00',
        pendingpayments: '5',
        completedpayments: '10',
        failedpayments: '2',
      };

      const mockRecentTransactions: Partial<Payment>[] = [
        { id: 'payment-1', amount: 100 },
      ];

      mockQueryBuilder.getRawOne.mockResolvedValue(mockStats);
      mockQueryBuilder.getMany.mockResolvedValue(mockRecentTransactions);

      const result = await paymentService.getPaymentStats();

      expect(result.totalRevenue).toBe(1000);
      expect(result.totalRefunds).toBe(100);
      expect(result.pendingPayments).toBe(5);
      expect(result.completedPayments).toBe(10);
      expect(result.failedPayments).toBe(2);
      expect(result.recentTransactions).toEqual(mockRecentTransactions);
    });

    it('should return zero stats when no payments exist', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue(null);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await paymentService.getPaymentStats();

      expect(result.totalRevenue).toBe(0);
      expect(result.totalRefunds).toBe(0);
      expect(result.pendingPayments).toBe(0);
    });
  });

  describe('simulatePaymentProcessing', () => {
    it('should simulate successful payment processing', async () => {
      const mockPayment: Partial<Payment> = {
        id: 'payment-123',
        status: PaymentStatus.PENDING,
      };

      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
      });

      const result = await paymentService.simulatePaymentProcessing(
        'payment-123',
        true
      );

      expect(result.status).toBe(PaymentStatus.COMPLETED);
    });

    it('should throw error if payment is not pending', async () => {
      const mockPayment: Partial<Payment> = {
        id: 'payment-123',
        status: PaymentStatus.COMPLETED,
      };

      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);

      await expect(
        paymentService.simulatePaymentProcessing('payment-123')
      ).rejects.toThrow('Payment is not in pending status');
    });
  });
});

