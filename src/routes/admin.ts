import { Router } from 'express';
import { EmailService } from '../services/EmailService';

const router = Router();
const emailService = new EmailService();

// Test email connection (Only available in development)
if (process.env.NODE_ENV === 'development') {
  router.get('/test-email', async (req, res) => {
    try {
      const isConnected = await emailService.testConnection();
      
      if (isConnected) {
        // Send test email
        await emailService.sendEmail({
          to: process.env.SMTP_USER || 'test@example.com',
          subject: 'Email Service Test',
          text: 'This is a test email from your application.',
          html: '<h1>Email Service Test</h1><p>This is a test email from your application.</p>',
        });

        res.json({
          success: true,
          message: 'Email service is working correctly',
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Email service connection failed',
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Email test failed',
        error: typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : String(error),
      });
    }
  });
}

export default router;