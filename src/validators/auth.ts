import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 7 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['client', 'freelancer'], {
    message: 'Role must be either client or freelancer',
  }),
  businessType: z.enum(['cafe', 'saloon', 'clothing_store', 'food_business', 'other'], {
    message: 'Business type must be one of the predefined types',
  }),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Password reset request - only email required
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// Actual password reset - requires token and new password
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Email verification - requires verification token
export const verifyEmailSchema = z.object({
  token: z.string()
    .min(32, 'Verification token must be at least 32 characters')
    .max(128, 'Verification token is too long'),
});