import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum FileType {
  AVATAR = 'avatar',
  DOCUMENT = 'document',
  PORTFOLIO = 'portfolio',
  ATTACHMENT = 'attachment',
  GENERAL = 'general',
}

export enum FileStatus {
  ACTIVE = 'active',
  DELETED = 'deleted',
  QUARANTINED = 'quarantined',
}

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string; // References User.id

  @Column()
  originalName: string; // Original filename from user

  @Column({ unique: true })
  filename: string; // SHA256 generated filename

  @Column()
  path: string; // Full file path

  @Column()
  url: string; // Public URL to access file

  @Column()
  mimetype: string; // File MIME type

  @Column({ type: 'bigint' })
  size: number; // File size in bytes

  @Column({
    type: 'enum',
    enum: FileType,
  })
  type: FileType; // File category

  @Column({
    type: 'enum',
    enum: FileStatus,
    default: FileStatus.ACTIVE,
  })
  status: FileStatus; // File status

  @Column('text', { nullable: true })
  description: string; // Optional file description

  @Column('text', { nullable: true })
  metadata: string; // JSON string for additional metadata

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  deletedAt: Date;

  // Relationship
  @ManyToOne('User')
  @JoinColumn({ name: 'userId' })
  user: any;
}