import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  clockIn(
    @Body('user_id') userId: string,
    @Body('picture') pictureBase64: string,
  ) {
    return this.attendanceService.clockIn(userId, pictureBase64);
  }

  @Post('clock-out')
  clockOut(
    @Body('user_id') userId: string,
    @Body('picture') pictureBase64: string,
  ) {
    return this.attendanceService.clockOut(userId, pictureBase64);
  }

  @Get()
  findAll() {
    return this.attendanceService.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.attendanceService.findByUser(userId);
  }
}