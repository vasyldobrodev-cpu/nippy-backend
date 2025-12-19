import { Request, Response, NextFunction } from 'express';
import { AuthController } from '../../controllers/AuthController';
import { User, UserRole, UserStatus } from '../../entities/User';
import { AppDataSource } from '../../config/database';
import { EmailService } from '../../services/EmailService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createMockRequest, createMockResponse, createMockNext, createMockRepository } from '../helpers/mocks';

// Mock dependencies
jest.mock('../../config/database');
jest.mock('../../services/EmailService');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthController', () => {
  let authController: AuthController;
  let mockUserRepository: any;
  let mockEmailService: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Setup mocks
    mockUserRepository = createMockRepository<User>();
    mockEmailService = {
      sendVerificationEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepository);
    (EmailService as jest.Mock).mockImplementation(() => mockEmailService);

    authController = new AuthController();

    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
    mockNext = createMockNext();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.CLIENT,
      businessType: 'cafe',
    };

    it('should register a new user successfully', async () => {
      const mockUser: Partial<User> = {
        id: 'user-123',
        email: registerData.email,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        role: registerData.role,
        status: UserStatus.PENDING_VERIFICATION,
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('jwt-token');

      mockRequest.body = registerData;

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerData.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerData.password, 12);
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            token: 'jwt-token',
          }),
        })
      );
    });

    it('should return error if user already exists', async () => {
      const existingUser: Partial<User> = { id: 'existing-user' };
      mockUserRepository.findOne.mockResolvedValue(existingUser);

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User already exists with this email',
        })
      );
    });
  });

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      const mockUser: Partial<User> = {
        id: 'user-123',
        email: loginData.email,
        password: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
        avatar: undefined,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUserRepository.save.mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('jwt-token');

      mockRequest.body = loginData;

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginData.password,
        mockUser.password
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Login successful',
          data: expect.objectContaining({
            token: 'jwt-token',
          }),
        })
      );
    });

    it('should return error for invalid credentials', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      mockRequest.body = loginData;

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid credentials',
        })
      );
    });

    it('should return error for incorrect password', async () => {
      const mockUser: Partial<User> = {
        id: 'user-123',
        email: loginData.email,
        password: 'hashed-password',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      mockRequest.body = loginData;

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid credentials',
        })
      );
    });

    it('should allow login but warn if email not verified', async () => {
      const mockUser: Partial<User> = {
        id: 'user-123',
        email: loginData.email,
        password: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.CLIENT,
        status: UserStatus.PENDING_VERIFICATION,
        avatar: undefined,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('jwt-token');

      mockRequest.body = loginData;

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Login successful, but email verification required',
          warning: 'Please verify your email to access all features',
        })
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const mockUser: Partial<User> = {
        id: 'user-123',
        passwordResetToken: 'valid-token',
        passwordResetExpires: new Date(Date.now() + 600000), // 10 minutes from now
        password: 'old-hashed-password',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      mockUserRepository.save.mockResolvedValue(mockUser);

      mockRequest.body = {
        token: 'valid-token',
        password: 'new-password',
      };

      await authController.resetPassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('new-password', 12);
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Password reset successful',
        })
      );
    });

    it('should return error for invalid or expired token', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      mockRequest.body = {
        token: 'invalid-token',
        password: 'new-password',
      };

      await authController.resetPassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid or expired reset token',
        })
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const mockUser: Partial<User> = {
        id: 'user-123',
        emailVerificationToken: 'valid-token',
        status: UserStatus.PENDING_VERIFICATION,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      });

      mockRequest.body = { token: 'valid-token' };

      await authController.verifyEmail(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Email verified successfully',
        })
      );
    });

    it('should return error for invalid token', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      mockRequest.body = { token: 'invalid-token' };

      await authController.verifyEmail(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid verification token',
        })
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      const mockUser: Partial<User> = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        avatar: undefined,
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (mockRequest as any).user = { userId: 'user-123' };

      await authController.getCurrentUser(
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
          data: { user: mockUser },
        })
      );
    });
  });
});

