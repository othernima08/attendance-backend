import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Department } from '../departments/departments.entity';
import { AttendanceRecords } from '../attendance/attendance_records.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  full_name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; 

  @Column({ type: 'longtext', nullable: true })
  profile_picture: string; 

  @ManyToOne(() => Department, (department) => department?.users)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @OneToMany(() => AttendanceRecords, (record) => record?.user)
  attendance_records: AttendanceRecords[];

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  modified_at: Date;

  @Column({ type: 'varchar', nullable: true })
  reset_token: string | null; 

  @Column({ type: 'datetime', nullable: true })
  reset_token_expires: Date | null;
}