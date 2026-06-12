import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { AttendanceRecords } from './attendance_records.entity';
import { User } from '../users/users.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AttendanceRecords, User])], 
  providers: [AttendanceService],
  controllers: [AttendanceController],
})
export class AttendanceModule {}