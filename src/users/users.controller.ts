import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('/login')
  login(@Body() loginData: any) {
    return this.usersService.login(loginData);
  }

  @Post()
  create(@Body() userData: any) {
    return this.usersService.create(userData);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  updateProfile(@Param('id') id: string, @Body() updateData: any) {
    return this.usersService.updateProfile(id, updateData);
  }

  @Patch(':id/password')
  changePassword(@Param('id') id: string, @Body() passwordData: any) {
    return this.usersService.changePassword(id, passwordData);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post('/forgot-password')
  forgotPassword(@Body('email') email: string) {
    return this.usersService.forgotPassword(email);
  }

  @Post('/reset-password')
  resetPassword(
    @Body('token') token: string,
    @Body('new_password') new_password: string,
  ) {
    return this.usersService.resetPassword(token, new_password);
  }
}