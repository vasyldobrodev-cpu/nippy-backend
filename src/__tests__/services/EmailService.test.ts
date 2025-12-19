import { EmailService } from '../../services/EmailService';
import nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('EmailService', () => {
  let emailService: EmailService;
  let mockTransporter: any;

  beforeEach(() => {
    mockTransporter = {
      sendMail: jest.fn(),
      verify: jest.fn(),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    emailService = new EmailService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const emailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        text: 'Test email body',
        html: '<p>Test email body</p>',
      };

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      await emailService.sendEmail(emailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: emailOptions.to,
          subject: emailOptions.subject,
          text: emailOptions.text,
          html: emailOptions.html,
        })
      );
    });

    it('should throw error if email sending fails', async () => {
      const emailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        text: 'Test email body',
      };

      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));

      await expect(emailService.sendEmail(emailOptions)).rejects.toThrow(
        'Failed to send email'
      );
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email with correct content', async () => {
      process.env.FRONTEND_URL = 'http://localhost:3000';
      process.env.APP_NAME = 'Test App';

      const email = 'user@example.com';
      const token = 'verification-token-123';
      const firstName = 'John';

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      await emailService.sendVerificationEmail(email, token, firstName);

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const callArgs = mockTransporter.sendMail.mock.calls[0][0];

      expect(callArgs.to).toBe(email);
      expect(callArgs.subject).toBe('Verify Your Email Address');
      expect(callArgs.html).toContain(firstName);
      expect(callArgs.html).toContain(token);
      expect(callArgs.html).toContain('verify-email?token=');
      expect(callArgs.text).toContain(token);
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with correct content', async () => {
      process.env.FRONTEND_URL = 'http://localhost:3000';
      process.env.APP_NAME = 'Test App';

      const email = 'user@example.com';
      const token = 'reset-token-123';
      const firstName = 'John';

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      await emailService.sendPasswordResetEmail(email, token, firstName);

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const callArgs = mockTransporter.sendMail.mock.calls[0][0];

      expect(callArgs.to).toBe(email);
      expect(callArgs.subject).toBe('Reset Your Password');
      expect(callArgs.html).toContain(firstName);
      expect(callArgs.html).toContain(token);
      expect(callArgs.html).toContain('reset-password?token=');
      expect(callArgs.html).toContain('10 minutes');
      expect(callArgs.text).toContain(token);
    });
  });

  describe('testConnection', () => {
    it('should return true if connection is verified', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const result = await emailService.testConnection();

      expect(mockTransporter.verify).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if connection verification fails', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));

      const result = await emailService.testConnection();

      expect(result).toBe(false);
    });
  });
});

