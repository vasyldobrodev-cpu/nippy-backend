import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { createError } from './errorHandler';

interface JwtPayload {
  userId: string;
}

// Make sure this is exported correctly
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(createError('Authentication required', 401));
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return next(createError('Authentication token required', 401));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JwtPayload;
    
    // Get user from database
    const userRepository = AppDataSource.getRepository('User');
    const user = await userRepository.findOne({
      where: { id: decoded.userId },
      select: ['id', 'email', 'role', 'status']
    });

    if (!user) {
      return next(createError('User not found', 401));
    }

    if (user.status === 'suspended') {
      return next(createError('Account is suspended', 401));
    }

    // Add user to request object
    (req as any).user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(createError('Invalid authentication token', 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(createError('Authentication token expired', 401));
    }
    
    console.error('Authentication error:', error);
    return next(createError('Authentication failed', 401));
  }
};

// Export as default as well (alternative import method)
export default authenticate;