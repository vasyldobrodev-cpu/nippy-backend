import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { User } from "./User";

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: "CASCADE" })
  user: User;

  @Column({ default: false })
  emailNotifications: boolean;

  @Column({ default: false })
  newFreelancerProposals: boolean;

  @Column({ default: false })
  jobStatusUpdates: boolean;

  @Column({ default: false })
  newMessageAlertsWeb: boolean;

  @Column({ default: false })
  newMessageAlertsEmail: boolean;

  @Column({ default: false })
  messageReadReceipts: boolean;

  @Column({ default: false })
  platformUpdates: boolean;

  @Column({ default: false })
  promotionsOffers: boolean;

  @Column({ default: false })
  pushNotifications: boolean;

  @Column({ default: false })
  desktopNotifications: boolean;

  @Column({ default: false })
  mobilePushNotifications: boolean;

  @Column({ type: "enum", enum: ["realtime", "daily", "weekly"], default: "realtime" })
  notificationFrequency: "realtime" | "daily" | "weekly";

  @Column({ default: false })
  quietHoursEnabled: boolean;

  @Column({ default: false })
  quietHoursWeekends: boolean;

  @Column({ type: "time", nullable: true })
  quietHoursFrom: string;

  @Column({ type: "time", nullable: true })
  quietHoursTo: string;

  @Column({ type: "enum", enum: ["on", "off"], default: "on" })
  notificationSound: "on" | "off";
}
