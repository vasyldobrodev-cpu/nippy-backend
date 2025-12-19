import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  SYSTEM = 'system',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  conversationId: string;

  @Column('uuid')
  senderId: string;

  @Column('uuid')
  recipientId: string;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.SENT,
  })
  status: MessageStatus;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @Column('jsonb', { nullable: true })
  fileData: {
    name: string;
    size: string;
    type: string;
    url?: string;
  };

  @Column('text', { array: true, default: '{}' })
  attachments: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships using string references to avoid circular dependencies
  @ManyToOne('Conversation')
  @JoinColumn({ name: 'conversationId' })
  conversation: any;

  @ManyToOne('User')
  @JoinColumn({ name: 'senderId' })
  sender: any;

  @ManyToOne('User')
  @JoinColumn({ name: 'recipientId' })
  recipient: any;
}
