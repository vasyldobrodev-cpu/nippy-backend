import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

export enum ConversationStatus {
  NOT_HIRED = 'not-hired',
  HIRED = 'hired',
  CLOSED = 'closed',
}

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  clientId: string;

  @Column('uuid')
  freelancerId: string;

  @Column('uuid', { nullable: true })
  jobId: string;

  @Column({ nullable: true })
  projectTitle: string;

  @Column({
    type: 'enum',
    enum: ConversationStatus,
    default: ConversationStatus.NOT_HIRED,
  })
  status: ConversationStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt: Date;

  @Column({ nullable: true })
  lastMessage: string;

  @Column({ default: false })
  clientUnread: boolean;

  @Column({ default: false })
  freelancerUnread: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne('User')
  @JoinColumn({ name: 'clientId' })
  client: any;

  @ManyToOne('User')
  @JoinColumn({ name: 'freelancerId' })
  freelancer: any;

  @ManyToOne('Job', { nullable: true })
  @JoinColumn({ name: 'jobId' })
  job: any;

  @OneToMany('Message', 'conversation')
  messages: any[];
}
