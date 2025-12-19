import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Notification } from '../entities/Notification';
import bcrypt from 'bcrypt';

export class UserController {
  private userRepository = AppDataSource.getRepository(User);

  // Get user profile with avatar info
  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      
      console.log(`📋 Getting profile for user: ${userId}`);

      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: [
          'id', 'email', 'firstName', 'lastName', 'avatar', 'phone',
          'country', 'timezone', 'city', 'language', 'businessType',
          'role', 'status', 'rating', 'reviewCount', 'createdAt', 'updatedAt'
        ]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Include avatar information (already uploaded avatar URLs)
      const profileData = {
        ...user,
        avatarUrl: user.avatar || null,
        hasAvatar: !!user.avatar
      };

      console.log(`✅ Profile retrieved for user: ${userId}, ${user.avatar}`);

      res.json({
        success: true,
        data: profileData
      });
    } catch (error) {
      console.error('❌ Get profile error:', error);
      next(error);
    }
  };

  // 1. Upload Avatar
  updateAvatar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('📸 Avatar upload request received');
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No avatar file provided'
        });
      }

      const userId = (req as any).user?.userId;
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      
      console.log(`👤 User ${userId} uploading avatar: ${req.file.filename}`);

      // Update user's avatar URL in database
      await this.userRepository.update(
        { id: userId },
        { 
          avatar: avatarUrl,
          updatedAt: new Date()
        }
      );

      console.log('✅ Avatar uploaded and user updated successfully');

      res.status(201).json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          avatarUrl,
          file: {
            originalName: req.file.originalname,
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype
          }
        }
      });
    } catch (error) {
      console.error('❌ Avatar upload error:', error);
      next(error);
    }
  };

  // 2. Update Basic Profile (firstName, lastName, phone, businessType)
  updateBasicProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.id || (req as any).user?.userId;
      const { firstName, lastName, phone, businessType } = req.body;

      console.log(`🔄 Updating basic profile for user: ${userId}`);

      const updateData: any = { updatedAt: new Date() };
      const updatedFields: string[] = [];

      if (firstName !== undefined) {
        updateData.firstName = firstName.trim();
        updatedFields.push('firstName');
      }

      if (lastName !== undefined) {
        updateData.lastName = lastName.trim();
        updatedFields.push('lastName');
      }

      if (phone !== undefined) {
        updateData.phone = phone.trim();
        updatedFields.push('phone');
      }

      if (businessType !== undefined) {
        updateData.businessType = businessType;
        updatedFields.push('businessType');
      }

      if (updatedFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields provided for update'
        });
      }

      await this.userRepository.update({ id: userId }, updateData);

      console.log(`✅ Basic profile updated for user: ${userId}`);
      console.log(`📝 Updated fields: ${updatedFields.join(', ')}`);

      res.json({
        success: true,
        message: 'Basic profile updated successfully',
        data: {
          updatedFields,
          updates: updateData
        }
      });
    } catch (error) {
      console.error('❌ Update basic profile error:', error);
      next(error);
    }
  };

  // 3. Update Location (country, city, timezone, language)
  updateLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const { country, city, timezone, language } = req.body;

      console.log(`🌍 Updating location info for user: ${userId}`);

      const updateData: any = { updatedAt: new Date() };
      const updatedFields: string[] = [];

      if (country !== undefined) {
        updateData.country = country.trim();
        updatedFields.push('country');
      }

      if (city !== undefined) {
        updateData.city = city.trim();
        updatedFields.push('city');
      }

      if (timezone !== undefined) {
        updateData.timezone = timezone.trim();
        updatedFields.push('timezone');
      }

      if (language !== undefined) {
        updateData.language = language.trim();
        updatedFields.push('language');
      }

      if (updatedFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields provided for update'
        });
      }

      await this.userRepository.update({ id: userId }, updateData);

      console.log(`✅ Location info updated for user: ${userId}`);
      console.log(`📝 Updated fields: ${updatedFields.join(', ')}`);

      res.json({
        success: true,
        message: 'Location information updated successfully',
        data: {
          updatedFields,
          updates: updateData
        }
      });
    } catch (error) {
      console.error('❌ Update location error:', error);
      next(error);
    }
  };

  // 4. Update Account Security (email, password)
  updateAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const { email, currentPassword, newPassword } = req.body;

      console.log(`🔐 Updating account security for user: ${userId}`);

      // Get current user to verify password
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'email', 'password']
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      const updateData: any = { updatedAt: new Date() };
      const updatedFields: string[] = [];

      // Update email if provided
      if (email !== undefined) {
        // Check if email already exists
        const existingUser = await this.userRepository.findOne({
          where: { email: email.toLowerCase() }
        });

        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({
            success: false,
            error: 'Email already exists'
          });
        }

        updateData.email = email.toLowerCase().trim();
        updatedFields.push('email');
      }

      // Update password if provided
      if (newPassword !== undefined) {
        const saltRounds = 12;
        updateData.password = await bcrypt.hash(newPassword, saltRounds);
        updatedFields.push('password');
      }

      await this.userRepository.update({ id: userId }, updateData);

      console.log(`✅ Account security updated for user: ${userId}`);
      console.log(`📝 Updated fields: ${updatedFields.join(', ')}`);

      res.json({
        success: true,
        message: 'Account security updated successfully',
        data: {
          updatedFields: updatedFields.map(field => 
            field === 'password' ? 'password (hidden)' : field
          ),
          email: updateData.email || user.email
        }
      });
    } catch (error) {
      console.error('❌ Update account security error:', error);
      next(error);
    }
  };

  // Fetch notification settings for the current user
  getNotificationSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const notificationSettings = await AppDataSource.getRepository(Notification).findOne({
        where: { user: { id: userId } },
      });

      if (!notificationSettings) {
        return res.status(404).json({ success: false, message: "Notification settings not found" });
      }

      res.json({ success: true, data: notificationSettings });
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      next(error);
    }
  };

  // Update notification settings for the current user
  updateNotificationSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const updatedSettings = req.body;

      console.log("Received updated settings:", updatedSettings);

      // Validate and convert time fields to 24-hour format if they exist
      const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/; // Matches HH:mm format

      if (updatedSettings.quietHoursFrom && !timeRegex.test(updatedSettings.quietHoursFrom)) {
        return res.status(400).json({ success: false, message: "Invalid time format for quietHoursFrom. Use HH:mm." });
      }
      if (updatedSettings.quietHoursTo && !timeRegex.test(updatedSettings.quietHoursTo)) {
        return res.status(400).json({ success: false, message: "Invalid time format for quietHoursTo. Use HH:mm." });
      }

      if (updatedSettings.quietHoursFrom) {
        updatedSettings.quietHoursFrom = `${updatedSettings.quietHoursFrom}:00`;
      }
      if (updatedSettings.quietHoursTo) {
        updatedSettings.quietHoursTo = `${updatedSettings.quietHoursTo}:00`;
      }

      const notificationRepository = AppDataSource.getRepository(Notification);
      let notificationSettings = await notificationRepository.findOne({ where: { user: { id: userId } } });

      // Fix: Ensure user entity is fetched and notificationSettings is not null
      const user = await AppDataSource.getRepository(User).findOne({ where: { id: userId } });

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      if (!notificationSettings) {
        notificationSettings = new Notification();
        notificationSettings.user = user;
        Object.assign(notificationSettings, updatedSettings);
      } else {
        Object.assign(notificationSettings, updatedSettings);
      }

      await notificationRepository.save(notificationSettings);

      res.json({ success: true, message: "Notification settings updated successfully", data: notificationSettings });
    } catch (error) {
      console.error("Error updating notification settings:", error);
      next(error);
    }
  };

  // Get profile dropdown options
  getProfileOptions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('📋 Getting profile dropdown options');

      const options = {
        countries: [
          'United States',
          'Canada',
          'United Kingdom',
          'Germany',
          'France',
          'Australia',
          'Japan',
          'South Korea',
          'Singapore',
          'India',
          'Brazil',
          'Mexico'
        ],
        timezones: [
          'America/New_York',
          'America/Chicago',
          'America/Denver',
          'America/Los_Angeles',
          'Europe/London',
          'Europe/Paris',
          'Europe/Berlin',
          'Asia/Tokyo',
          'Asia/Seoul',
          'Asia/Singapore',
          'Australia/Sydney',
          'Pacific/Auckland'
        ],
        languages: [
          'English',
          'Spanish',
          'French',
          'German',
          'Italian',
          'Portuguese',
          'Japanese',
          'Korean',
          'Chinese',
          'Arabic',
          'Russian',
          'Hindi'
        ],
        businessTypes: [
          'cafe',
          'restaurant',
          'retail_store',
          'clothing_store',
          'beauty_salon',
          'barbershop',
          'grocery_store',
          'pharmacy',
          'bookstore',
          'electronics_store',
          'other'
        ],
        cities: {
          'United States': [
            'New York',
            'Los Angeles',
            'Chicago',
            'Houston',
            'Phoenix',
            'Philadelphia',
            'San Antonio',
            'San Diego',
            'Dallas',
            'San Jose',
            'Austin',
            'Jacksonville'
          ],
          'Canada': [
            'Toronto',
            'Montreal',
            'Vancouver',
            'Calgary',
            'Edmonton',
            'Ottawa',
            'Winnipeg',
            'Quebec City'
          ],
          'United Kingdom': [
            'London',
            'Birmingham',
            'Manchester',
            'Glasgow',
            'Liverpool',
            'Leeds',
            'Sheffield',
            'Edinburgh'
          ],
          'Germany': [
            'Berlin',
            'Hamburg',
            'Munich',
            'Cologne',
            'Frankfurt',
            'Stuttgart',
            'Düsseldorf',
            'Dortmund'
          ]
          // Add more...
        }
      };

      console.log('✅ Profile options retrieved successfully');

      res.json({
        success: true,
        data: options
      });
    } catch (error) {
      console.error('❌ Get profile options error:', error);
      next(error);
    }
  };

  // Get public user profile by ID
  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      console.log(`👤 Getting public profile for user: ${id}`);

      const user = await this.userRepository.findOne({
        where: { id },
        select: [
          'id',
          'firstName',
          'lastName',
          'avatar',
          'country',
          'city',
          'businessType',
          'role',
          'rating',
          'reviewCount',
          'createdAt'
        ]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const publicProfile = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: `${user.firstName} ${user.lastName}`,
        avatar: user.avatar,
        avatarUrl: user.avatar || null,
        location: {
          country: user.country,
          city: user.city
        },
        businessType: user.businessType,
        role: user.role,
        rating: user.rating || 0,
        reviewCount: user.reviewCount || 0,
        memberSince: user.createdAt,
        isVerified: true
      };

      console.log(`✅ Public profile retrieved for user: ${id}, ${user.avatar}`);

      res.json({
        success: true,
        data: {
          user: publicProfile
        }
      });
    } catch (error) {
      console.error('❌ Get user by ID error:', error);
      next(error);
    }
  };
}