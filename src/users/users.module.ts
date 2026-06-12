import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './users.entity';
import { Department } from '../departments/departments.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Department])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}