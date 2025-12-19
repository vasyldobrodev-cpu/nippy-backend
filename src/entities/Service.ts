import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum ServiceType {
  VIDEO_EDITING = 'video_editing',
  GRAPHIC_DESIGN = 'graphic_design',
  CONTENT_WRITING = 'content_writing',
  LOGO_DESIGN = 'logo_design',
  SOCIAL_MEDIA = 'social_media',
  ANIMATION = 'animation',
  PHOTOGRAPHY = 'photography',
  AUDIO_EDITING = 'audio_editing',
  WEB_DESIGN = 'web_design',
  BRANDING = 'branding',
}

export enum ServiceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
  SUSPENDED = 'suspended',
}

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  freelancerId: string; // References User.id where role = FREELANCER

  @Column('uuid')
  categoryId: string;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column('text')
  description: string;

  @Column('text')
  shortDescription: string;

  @Column({
    type: 'enum',
    enum: ServiceType,
  })
  serviceType: ServiceType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  startingPrice: number;

  @Column({ default: 7 })
  deliveryDays: number;

  @Column({ default: 3 })
  revisions: number;

  @Column('text', { array: true, default: '{}' })
  features: string[];

  @Column('text', { array: true, default: '{}' })
  tags: string[];

  @Column('text', { array: true, default: '{}' })
  portfolioImages: string[];

  @Column({
    type: 'enum',
    enum: ServiceStatus,
    default: ServiceStatus.ACTIVE,
  })
  status: ServiceStatus;

  @Column({ default: 0 })
  totalOrders: number;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships using string references to avoid circular dependencies
  @ManyToOne('User')
  @JoinColumn({ name: 'freelancerId' })
  freelancer: any;

  @ManyToOne('Category')
  @JoinColumn({ name: 'categoryId' })
  category: any;
}
