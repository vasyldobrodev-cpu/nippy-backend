import { Request, Response, NextFunction } from 'express';
import { UserController } from '../../controllers/UserController';
import { User, UserRole, UserStatus, BusinessType } from '../../entities/User';
import { AppDataSource } from '../../config/database';
import bcrypt from 'bcrypt';
import { createMockRequest, createMockResponse, createMockNext, createMockRepository } from '../helpers/mocks';

// Mock dependencies
jest.mock('../../config/database');
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('UserController', () => {
  let userController: UserController;
  let mockUserRepository: any;
  let mockNotificationRepository: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockUserRepository = createMockRepository<User>();
    mockNotificationRepository = createMockRepository();

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === User) return mockUserRepository;
      return mockNotificationRepository;
    });

    userController = new UserController();

    mockRequest = createMockRequest({
      user: { userId: 'user-123' },
    });
    mockResponse = createMockResponse();
    mockNext = createMockNext();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser: Partial<User> = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        avatar: '/uploads/avatar.jpg',
        phone: '1234567890',
        country: 'USA',
        city: 'New York',
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
        rating: 4.5,
        reviewCount: 10,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await userController.getProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: expect.any(Array),
      });
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            avatarUrl: mockUser.avatar,
            hasAvatar: true,
          }),
        })
      );
    });

    it('should return 404 if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await userController.getProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'User not found',
        })
      );
    });
  });

  describe('updateBasicProfile', () => {
    it('should update basic profile fields', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '9876543210',
        businessType: 'restaurant',
      };

      mockRequest.body = updateData;
      mockRequest.params = { id: 'user-123' };

      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      await userController.updateBasicProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { id: 'user-123' },
        expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Smith',
          phone: '9876543210',
          businessType: 'restaurant',
        })
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Basic profile updated successfully',
        })
      );
    });

    it('should return error if no valid fields provided', async () => {
      mockRequest.body = {};

      await userController.updateBasicProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'No valid fields provided for update',
        })
      );
    });
  });

  describe('updateLocation', () => {
    it('should update location information', async () => {
      const updateData = {
        country: 'Canada',
        city: 'Toronto',
        timezone: 'America/Toronto',
        language: 'English',
      };

      mockRequest.body = updateData;

      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      await userController.updateLocation(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { id: 'user-123' },
        expect.objectContaining(updateData)
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Location information updated successfully',
        })
      );
    });
  });

  describe('updateAccount', () => {
    it('should update email and password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'old@example.com',
        password: 'old-hashed-password',
      } as User;

      const updateData = {
        email: 'new@example.com',
        currentPassword: 'old-password',
        newPassword: 'new-password',
      };

      mockRequest.body = updateData;

      // Setup mocks: first call gets user, second call checks email
      // Simply return values in sequence - first user, then null for email check
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUser) // First call: get user by id
        .mockResolvedValueOnce(null); // Second call: check email doesn't exist

      // Ensure bcrypt.compare returns true for password validation
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      await userController.updateAccount(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Verify that findOne was called (to get user)
      expect(mockUserRepository.findOne).toHaveBeenCalled();
      
      // Verify the end result - successful update
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Account security updated successfully',
        })
      );
      
      // Verify that password was hashed and user was updated
      expect(bcrypt.hash).toHaveBeenCalledWith('new-password', 12);
      expect(mockUserRepository.update).toHaveBeenCalled();
    });

    it('should return error if current password is incorrect', async () => {
      const mockUser: Partial<User> = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-password',
      };

      mockRequest.body = {
        currentPassword: 'wrong-password',
        newPassword: 'new-password',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await userController.updateAccount(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Current password is incorrect',
        })
      );
    });

    it('should return error if email already exists', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'old@example.com',
        password: 'hashed-password',
      } as User;

      const existingUser = {
        id: 'other-user',
        email: 'new@example.com',
      } as User;

      mockRequest.body = {
        email: 'new@example.com',
        currentPassword: 'correct-password',
      };

      // Setup mocks: first call gets user, second call finds existing user with same email
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUser) // First call: get user by id
        .mockResolvedValueOnce(existingUser); // Second call: email already exists

      // Ensure bcrypt.compare returns true for password validation
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await userController.updateAccount(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Verify the end result - email already exists error
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Email already exists',
        })
      );
      
      // Verify password was checked (user lookup happened)
      expect(mockUserRepository.findOne).toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should return public user profile', async () => {
      const mockUser: Partial<User> = {
        id: 'user-456',
        firstName: 'John',
        lastName: 'Doe',
        avatar: '/uploads/avatar.jpg',
        country: 'USA',
        city: 'New York',
        businessType: BusinessType.CAFE,
        role: UserRole.FREELANCER,
        rating: 4.5,
        reviewCount: 10,
        createdAt: new Date(),
      };

      mockRequest.params = { id: 'user-456' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await userController.getUserById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-456' },
        select: expect.any(Array),
      });
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              displayName: 'John Doe',
              rating: 4.5,
            }),
          }),
        })
      );
    });

    it('should return 404 if user not found', async () => {
      mockRequest.params = { id: 'invalid-id' };
      mockUserRepository.findOne.mockResolvedValue(null);

      await userController.getUserById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'User not found',
        })
      );
    });
  });
});

