import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { BusinessType, User, UserRole, UserStatus } from "../entities/User";
import { createError } from "../middleware/errorHandler";
import { EmailService } from "../services/EmailService";
import crypto from "crypto";

export class AuthController {
  private userRepository = AppDataSource.getRepository(User);
  private emailService = new EmailService();

  private generateToken(userId: string): string {
    return jwt.sign({ userId }, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "7d",
    });
  }

  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  // Regular email/password registration
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, firstName, lastName, role, businessType } = req.body;

      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });
      if (existingUser) {
        return next(createError("User already exists with this email", 400));
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Generate verification token
      const emailVerificationToken = this.generateVerificationToken();
      console.log(
        `🔑 Generated verification token for ${email}: ${emailVerificationToken}`
      );

      // Create user
      const user = this.userRepository.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role as UserRole,
        businessType: businessType as BusinessType,
        emailVerificationToken,
        status: UserStatus.PENDING_VERIFICATION,
      });

      await this.userRepository.save(user);

      // Generate JWT token
      const token = this.generateToken(user.id);

      // Send verification email
      try {
        // await this.emailService.sendVerificationEmail(email, emailVerificationToken, firstName);
        console.log(`✅ Verification email sent to ${email}`);
      } catch (emailError) {
        console.error(
          `❌ Failed to send verification email to ${email}:`,
          emailError
        );
        // Don't fail registration if email fails - log token for manual verification
        console.log(
          `📝 Manual verification token for ${email}: ${emailVerificationToken}`
        );
      }

      res.status(201).json({
        success: true,
        message: "User registered successfully. Please verify your email.",
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // Regular email/password login
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        console.log(`❌ Login failed: User not found for email ${email}`);
        return next(createError("Invalid credentials", 401));
      }

      // Check if this is a Google OAuth user
      if (user.password === "google-oauth") {
        return next(createError("Please sign in with Google", 400));
      }

      // Check password
      //const isPasswordValid = true;
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        console.log(`❌ Login failed: Invalid password for ${email}`);
        return next(createError("Invalid credentials", 401));
      }

      // Check if account is active
      if (user.status === UserStatus.SUSPENDED) {
        return next(createError("Account is suspended", 401));
      }

      // Handle pending verification status
      if (user.status === UserStatus.PENDING_VERIFICATION) {
        // Allow login but warn about email verification
        const token = this.generateToken(user.id);

        return res.json({
          success: true,
          message: "Login successful, but email verification required",
          warning: "Please verify your email to access all features",
          data: {
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              status: user.status,
              avatar: user.avatar,
              requiresVerification: true,
            },
            token,
          },
        });
      }

      // Update last login
      user.lastLoginAt = new Date();
      await this.userRepository.save(user);

      // Generate JWT token
      const token = this.generateToken(user.id);

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status,
            avatar: user.avatar,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // Google OAuth success handler
  googleCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as User;

      if (!user) {
        console.error("Google OAuth callback: No user found");
        return res.redirect(
          `${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/login?error=auth_failed`
        );
      }

      // Update last login
      user.lastLoginAt = new Date();
      await this.userRepository.save(user);

      // Generate JWT token
      const token = this.generateToken(user.id);

      console.log(`✅ Google OAuth success for user: ${user.email}`);

      // Redirect to frontend with token
      res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/auth/success?token=${token}`
      );
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/login?error=auth_failed`
      );
    }
  };

  // Google OAuth failure handler
  googleFailure = (req: Request, res: Response) => {
    console.error("Google OAuth authentication failed");
    res.status(400).json({
      success: false,
      message: "Google OAuth authentication failed",
      hint: "Please try again or use email/password login",
    });
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;

      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        return next(createError("User not found", 404));
      }

      // Check if this is a Google OAuth user
      if (user.password === "google-oauth") {
        return next(
          createError(
            "Google users cannot reset password. Please sign in with Google.",
            400
          )
        );
      }

      // Generate reset token
      const resetToken = this.generateVerificationToken();
      const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      user.passwordResetToken = resetToken;
      user.passwordResetExpires = resetExpires;
      await this.userRepository.save(user);

      // Send reset email
      try {
        // TODO: Setup company email
        // await this.emailService.sendPasswordResetEmail(email, resetToken, user.firstName);
        console.log(`✅ Password reset email sent to ${email}`);
      } catch (emailError) {
        console.error(`❌ Failed to send reset email to ${email}:`, emailError);
        // Log token for manual reset
        console.log(`📝 Manual reset token for ${email}: ${resetToken}`);
      }

      res.json({
        success: true,
        message: "Password reset token sent to email",
      });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, password } = req.body;

      const user = await this.userRepository.findOne({
        where: {
          passwordResetToken: token,
        },
      });

      if (
        !user ||
        !user.passwordResetExpires ||
        user.passwordResetExpires < new Date()
      ) {
        return next(createError("Invalid or expired reset token", 400));
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 12);

      user.password = hashedPassword;
      user.passwordResetToken = "";
      user.passwordResetExpires = new Date(0);
      await this.userRepository.save(user);

      res.json({
        success: true,
        message: "Password reset successful",
      });
    } catch (error) {
      next(error);
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;

      const user = await this.userRepository.findOne({
        where: { emailVerificationToken: token },
      });

      if (!user) {
        return next(createError("Invalid verification token", 400));
      }

      user.emailVerifiedAt = new Date();
      user.emailVerificationToken = "";
      user.status = UserStatus.ACTIVE;
      await this.userRepository.save(user);

      res.json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;

      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: [
          "id",
          "email",
          "firstName",
          "lastName",
          "avatar",
          "role",
          "status",
          "phone",
          "bio",
          "rating",
          "reviewCount",
          "emailVerifiedAt",
        ],
      });

      if (!user) {
        return next(createError("User not found", 404));
      }

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  // Development only: Get verification token for user
  getVerificationToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (process.env.NODE_ENV !== "development") {
      return next(
        createError("This endpoint is only available in development", 403)
      );
    }

    try {
      const { email } = req.params;

      const user = await this.userRepository.findOne({
        where: { email },
        select: [
          "id",
          "email",
          "firstName",
          "emailVerificationToken",
          "status",
          "emailVerifiedAt",
        ],
      });

      if (!user) {
        return next(createError("User not found", 404));
      }

      res.json({
        success: true,
        message: "Development only - Verification token retrieved",
        data: {
          email: user.email,
          verificationToken: user.emailVerificationToken,
          status: user.status,
          emailVerifiedAt: user.emailVerifiedAt,
          isAlreadyVerified: !!user.emailVerifiedAt,
          tokenType: "emailVerificationToken",
          usage: "POST /api/auth/verify-email",
          note: user.emailVerifiedAt
            ? "Email already verified"
            : "Use this token for email verification",
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // Development only: Get password reset token for user
  getResetToken = async (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV !== "development") {
      return next(
        createError("This endpoint is only available in development", 403)
      );
    }

    try {
      const { email } = req.params;

      const user = await this.userRepository.findOne({
        where: { email },
        select: [
          "id",
          "email",
          "firstName",
          "passwordResetToken",
          "passwordResetExpires",
        ],
      });

      if (!user) {
        return next(createError("User not found", 404));
      }

      const isTokenValid =
        user.passwordResetToken &&
        user.passwordResetExpires &&
        user.passwordResetExpires > new Date();

      res.json({
        success: true,
        message: "Development only - Reset token retrieved",
        data: {
          email: user.email,
          resetToken: user.passwordResetToken,
          resetExpires: user.passwordResetExpires,
          isTokenValid,
          tokenType: "passwordResetToken",
          usage: "POST /api/auth/reset-password",
          note: isTokenValid
            ? "Token is valid and not expired"
            : "Token is missing or expired",
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // Development only: Get all users with tokens
  getAllUsersWithTokens = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (process.env.NODE_ENV !== "development") {
      return next(
        createError("This endpoint is only available in development", 403)
      );
    }

    try {
      const users = await this.userRepository.find({
        select: [
          "id",
          "email",
          "firstName",
          "lastName",
          "role",
          "status",
          "emailVerificationToken",
          "emailVerifiedAt",
          "passwordResetToken",
          "passwordResetExpires",
          "createdAt",
          "lastLoginAt",
        ],
        order: { createdAt: "DESC" },
      });

      const formattedUsers = users.map((user) => ({
        ...user,
        emailVerified: !!user.emailVerifiedAt,
        resetTokenValid:
          user.passwordResetToken &&
          user.passwordResetExpires &&
          user.passwordResetExpires > new Date(),
      }));

      res.json({
        success: true,
        message: "Development only - All users with tokens",
        data: {
          users: formattedUsers,
          count: users.length,
          note: "Use emailVerificationToken for email verification, passwordResetToken for password reset",
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
