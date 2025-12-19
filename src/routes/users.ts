import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { 
  updateBasicProfileSchema, 
  updateLocationSchema, 
  updateAccountSchema,
  updateNotificationSettingsSchema
} from '../validators/user';
import { avatarUpload } from '../middleware/upload';

const router = Router();
const userController = new UserController();

// Public routes
router.get('/options', userController.getProfileOptions);  // Get dropdown options
router.get('/:id', userController.getUserById);           // Get public user profile

// Protected routes - require authentication
router.use(authenticate);

// Get current user's profile (with avatar info)
router.get('/profile/me', userController.getProfile);

// 1. Avatar upload (separate endpoint)
// router.post('/profile/avatar', 
//   avatarUpload,  // Handle avatar upload
//   userController.uploadAvatar
// );

// 2. Basic profile update (firstName, lastName, phone, businessType)
router.put('/profile/basic/:id', 
  validateRequest(updateBasicProfileSchema),  // Validate basic profile fields
  userController.updateBasicProfile
);

// 3. Location info update (country, city, timezone, language)
router.put('/profile/location', 
  validateRequest(updateLocationSchema),  // Validate location fields
  userController.updateLocation
);

// 4. Account security update (email, password)
router.put('/profile/account', 
  validateRequest(updateAccountSchema),  // Validate account security fields
  userController.updateAccount
);

// 5. Email notification settings update
router.put('/profile/email_notifications',
  validateRequest(updateNotificationSettingsSchema),
  userController.updateNotificationSettings
);

export default router;