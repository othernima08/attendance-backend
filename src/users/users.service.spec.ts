import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './users.entity';
import { Department } from '../departments/departments.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';

describe('UsersService', () => {
  let service: UsersService;

  let mockUserDB: any = {};

  const mockUsersRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((user) => {
      mockUserDB = { id: 'user-1', ...user };
      return Promise.resolve(mockUserDB);
    }),
    find: jest.fn().mockResolvedValue([{ id: 'user-1', full_name: 'John Doe' }]),
    findOne: jest.fn().mockImplementation(({ where }) => {
      if (where.id === 'user-1') return Promise.resolve(mockUserDB);
      return Promise.resolve(null);
    }),
    findOneBy: jest.fn().mockImplementation((param) => {
      if (param.email === 'test@test.com' && !mockUserDB.email) return Promise.resolve(null);
      if (param.email === 'test@test.com' || param.reset_token === 'valid-token') return Promise.resolve(mockUserDB);
      return Promise.resolve(null);
    }),
    delete: jest.fn().mockImplementation((id) => {
      if (id === 'user-1') return Promise.resolve({ affected: 1 });
      return Promise.resolve({ affected: 0 });
    }),
  };

  const mockDepartmentsRepository = {
    findOneBy: jest.fn().mockImplementation(({ id }) => {
      if (id === 'dept-1') return Promise.resolve({ id: 'dept-1', name: 'IT' });
      return Promise.resolve(null);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUsersRepository },
        { provide: getRepositoryToken(Department), useValue: mockDepartmentsRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    
    mockUserDB = {
      id: 'user-1',
      email: 'test@test.com',
      password: service['encrypt']('oldPassword123'),
      reset_token: 'valid-token',
      reset_token_expires: new Date(Date.now() + 3600000),
    };
  });

  it('should create a new user', async () => {
    mockUserDB = {}; 
    const result = await service.create({
      full_name: 'New User',
      email: 'test@test.com',
      password: 'myPassword',
      department_id: 'dept-1',
    });
    expect(result.password).not.toEqual('myPassword');
    expect(result.password).toContain(':');
  });

  it('should find all users', async () => {
    const result = await service.findAll();
    expect(result.length).toBeGreaterThan(0);
  });

  it('should find one user by id', async () => {
    const result = await service.findOne('user-1');
    expect(result.id).toEqual('user-1');
  });

  it('should throw NotFoundException if user not found', async () => {
    await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
  });

  it('should update user profile and optionally password', async () => {
    const result = await service.updateProfile('user-1', {
      full_name: 'Updated Name',
      password: 'newAdminPassword'
    });
    expect(result.full_name).toEqual('Updated Name');
    expect(result.password).not.toEqual('newAdminPassword'); 
  });

  it('should change password if old password is correct', async () => {
    const result = await service.changePassword('user-1', {
      old_password: 'oldPassword123',
      new_password: 'newSecurePassword'
    });
    expect(result.message).toEqual('Password berhasil diubah');
  });

  it('should throw BadRequestException if old password is wrong', async () => {
    await expect(service.changePassword('user-1', {
      old_password: 'wrongPassword',
      new_password: 'newSecurePassword'
    })).rejects.toThrow(BadRequestException);
  });

  it('should delete a user', async () => {
    const result = await service.remove('user-1');
    expect(result.message).toContain('berhasil dihapus');
  });

  it('should throw error when deleting non-existent user', async () => {
    await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
  });

  it('should generate reset token and send email', async () => {
    const result = await service.forgotPassword('test@test.com');
    expect(result.message).toEqual('Email reset password telah dikirim');
    expect(result.emailPreviewUrl).toBeDefined();
  });

  it('should reset password with valid token', async () => {
    const result = await service.resetPassword('valid-token', 'newPassword456');
    expect(result.message).toContain('berhasil di-reset');
  });

  it('should throw error if token is expired', async () => {
    mockUserDB.reset_token_expires = new Date(Date.now() - 3600000); 
    await expect(service.resetPassword('valid-token', 'newPassword456')).rejects.toThrow(BadRequestException);
  });
});