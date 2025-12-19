import { Router } from 'express';
import passport, { authenticate } from 'passport';
import { AuthController } from '../controllers/AuthController';
import { validateRequest } from '../middleware/validation';
import { 
  registerSchema, 
  loginSchema, 
  resetPasswordSchema, 
  forgotPasswordSchema, 
  verifyEmailSchema 
} from '../validators/auth';

const router = Router();
const authController = new AuthController();

// Regular authentication routes
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword);
router.post('/verify-email', validateRequest(verifyEmailSchema), authController.verifyEmail);
// Google OAuth routes (conditional based on environment variables)
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (googleClientId && googleClientSecret) {
  router.get('/google/callback',
    passport.authenticate('google', { 
      failureRedirect: '/api/auth/google/failure' 
    }),
    authController.googleCallback
  );

  router.get('/google/failure', authController.googleFailure);

  console.log('✅ Google OAuth routes enabled');
} else {
  // Google OAuth is not configured - provide helpful error messages
  router.get('/google', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured on this server',
      hint: 'Please use email/password login or contact administrator to enable Google OAuth'
    });
  });

  router.get('/google/callback', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Google OAuth callback is not available',
      hint: 'Google OAuth is not configured on this server'
    });
  });

  router.get('/google/failure', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Google OAuth is not available',
      hint: 'Please use email/password login instead'
    });
  });

  console.log('⚠️  Google OAuth routes disabled (credentials not configured)');
}

// Protected routes (always available)
router.get('/me', passport.authenticate('jwt', { session: false }), authController.getCurrentUser);

// Development only testing endpoints
if (process.env.NODE_ENV === 'development') {
  router.get('/dev/verification-token/:email', authController.getVerificationToken);
  router.get('/dev/reset-token/:email', authController.getResetToken);
  router.get('/dev/users', authController.getAllUsersWithTokens);
  
  console.log('🧪 Development auth endpoints enabled:');
  console.log('   GET /api/auth/dev/verification-token/:email');
  console.log('   GET /api/auth/dev/reset-token/:email');
  console.log('   GET /api/auth/dev/users');
} else {
  console.log('🔒 Development endpoints disabled (production mode)');
}

export default router;