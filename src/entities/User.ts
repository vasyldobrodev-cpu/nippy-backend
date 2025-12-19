import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from 'typeorm';
import bcrypt from 'bcryptjs';
import { Job } from './Job'; // Adjust the import path as necessary
import { Notification } from './Notification'; // Adjust the import path as necessary

export enum UserRole {
  CLIENT = 'client',
  FREELANCER = 'freelancer',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  PENDING_VERIFICATION = 'pending_verification',
  SUSPENDED = 'suspended',
  DEACTIVATED = 'deactivated',
}

export enum BusinessType {
  CAFE = 'cafe',
  SALOON = 'saloon',
  CLOTHING_STORE = 'clothing_store',
  FOOD_BUSINESS = 'food_business',
  OTHER = 'other',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Basic Info
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  avatar: string; // Max 2MB - URL to uploaded image

  @Column({ nullable: true })
  phone: string; // Valid phone number with country code

  // Location & Business Info
  @Column({ nullable: true })
  country: string; // Auto-detected from input

  @Column({ nullable: true })
  timezone: string; // Selected from combobox

  @Column({ nullable: true })
  city: string; // Selected from combobox

  @Column({ nullable: true })
  language: string; // Selected from combobox

  @Column({
    type: 'enum',
    enum: BusinessType,
    nullable: true,
  })
  businessType: BusinessType; // Cafe, saloon, clothing store, food business, other

  // User System Fields
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION,
  })
  status: UserStatus;

  // Additional Profile Fields
  @Column('text', { nullable: true })
  bio: string;

  @Column({ nullable: true })
  website: string;

  // Rating & Reviews
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  // Client-specific fields
  @Column({ nullable: true })
  companyName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSpent: number;

  @Column({ default: 0 })
  jobsPosted: number;

  // Freelancer-specific fields
  @Column({ nullable: true })
  title: string; // Professional title

  @Column('text', { array: true, default: '{}' })
  skills: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRate: number;

  @Column('text', { array: true, default: '{}' })
  portfolioItems: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEarnings: number;

  @Column({ default: 0 })
  completedJobs: number;

  // Verification & Security
  @Column({ nullable: true })
  emailVerificationToken: string;

  @Column({ type: 'timestamp', nullable: true })
  emailVerifiedAt: Date;

  @Column({ nullable: true })
  passwordResetToken: string;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpires: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => Job, job => job.client)
  jobs: Job[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  // Hash password before saving
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && this.password !== 'google-oauth') {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }
}
