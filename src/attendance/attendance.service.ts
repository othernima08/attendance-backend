import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { AttendanceRecords } from './attendance_records.entity';
import { User } from '../users/users.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceRecords)
    private attendanceRepository: Repository<AttendanceRecords>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async clockIn(userId: string, pictureBase64: string): Promise<AttendanceRecords> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const activeRecord = await this.attendanceRepository.findOne({
      where: { user: { id: userId }, clock_out: IsNull() },
    });

    if (activeRecord) {
      throw new BadRequestException('Anda belum melakukan Clock-Out untuk absensi sebelumnya');
    }

    const newRecord = this.attendanceRepository.create({
      user,
      clock_in: new Date(),
      clock_in_picture: pictureBase64,
    });

    return this.attendanceRepository.save(newRecord);
  }


  async clockOut(userId: string, pictureBase64: string): Promise<AttendanceRecords> {
    const activeRecord = await this.attendanceRepository.findOne({
      where: { user: { id: userId }, clock_out: IsNull() },
      order: { clock_in: 'DESC' }, 
    });

    if (!activeRecord) {
      throw new BadRequestException('Anda belum Clock-In atau sudah melakukan Clock-Out sebelumnya');
    }

    activeRecord.clock_out = new Date(); 
    activeRecord.clock_out_picture = pictureBase64;

    return this.attendanceRepository.save(activeRecord);
  }

  findAll(): Promise<AttendanceRecords[]> {
    return this.attendanceRepository.find({
      relations: {
        user: {
          department: true, 
        },
      },
      order: {
        clock_in: 'DESC', 
      },
    });
  }

  findByUser(userId: string): Promise<AttendanceRecords[]> {
    return this.attendanceRepository.find({
      where: { user: { id: userId } },
      order: { clock_in: 'DESC' },
    });
  }
}