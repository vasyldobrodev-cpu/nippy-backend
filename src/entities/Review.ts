import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
} from 'typeorm';

@Entity('reviews')
@Check('rating >= 1 AND rating <= 5')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  clientId: string; // References User.id where role = CLIENT

  @Column('uuid')
  freelancerId: string; // References User.id where role = FREELANCER

  @Column('uuid')
  serviceId: string;

  @Column('uuid')
  orderId: string;

  @Column('int')
  rating: number;

  @Column('text', { nullable: true })
  comment: string;

  @Column({ default: true })
  isVisible: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships using string references to avoid circular dependencies
  @ManyToOne('User')
  @JoinColumn({ name: 'clientId' })
  client: any;

  @ManyToOne('User')
  @JoinColumn({ name: 'freelancerId' })
  freelancer: any;

  @ManyToOne('Service')
  @JoinColumn({ name: 'serviceId' })
  service: any;

  @ManyToOne('Order')
  @JoinColumn({ name: 'orderId' })
  order: any;
}
