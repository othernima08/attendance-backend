import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/users.entity';

@Entity('attendance_records')
export class AttendanceRecords {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.attendance_records)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'datetime', nullable: true })
  clock_in: Date;

  @Column({ type: 'datetime', nullable: true })
  clock_out: Date;

  @Column({ type: 'longtext', nullable: true })
  clock_in_picture: string; 

  @Column({ type: 'longtext', nullable: true })
  clock_out_picture: string; 
}