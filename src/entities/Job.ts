import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm';
import { User } from './User';
import { Category } from './Category';
import { Proposal } from './Proposal';

export enum JobStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum JobType {
  FIXED = 'fixed',
  HOURLY = 'hourly'
}

export enum ExperienceLevel {
  ENTRY = 'entry',
  INTERMEDIATE = 'intermediate',
  EXPERT = 'expert'
}

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  slug: string;

  @Column('text')
  description: string;

  @Column('text', { nullable: true })
  requirements: string;

  @Column({
    type: 'enum',
    enum: JobType,
    default: JobType.FIXED
  })
  jobType: JobType;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  budget: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  hourlyRateMin: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  hourlyRateMax: number;

  @Column('int', { nullable: true })
  estimatedHours: number;

  @Column({ nullable: true })
  duration: string;

  @Column({
    type: 'enum',
    enum: ExperienceLevel,
    default: ExperienceLevel.INTERMEDIATE
  })
  experienceLevel: ExperienceLevel;

  @Column('simple-array', { nullable: true })
  skillsRequired: string[];

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.OPEN
  })
  status: JobStatus;

  @Column('timestamp', { nullable: true })
  deadline: Date;

  @Column('int', { default: 0 })
  viewCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @Column()
  clientId: string;

  @ManyToOne(() => User, user => user.jobs)
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column()
  categoryId: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  // Add this relationship for proposals
  @OneToMany(() => Proposal, proposal => proposal.job, { cascade: true })
  proposals: Proposal[];
}