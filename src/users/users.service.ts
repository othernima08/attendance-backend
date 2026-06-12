import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';
import { Department } from '../departments/departments.entity';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'utf8');
  private transporter: nodemailer.Transporter;
  private isProduction: boolean;
  
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Department)
    private departmentsRepository: Repository<Department>,
  ) {
    this.isProduction = process.env.NODE_ENV === 'production';
    
    if (this.key.length !== 32) {
      throw new Error('ENCRYPTION_KEY di file .env harus tepat 32 karakter!');
    }

    if (this.isProduction) {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: true,
            auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
            },
        });
    } else {
        nodemailer.createTestAccount().then((account) => {
            this.transporter = nodemailer.createTransport({
            host: account.smtp.host,
            port: account.smtp.port,
            secure: account.smtp.secure,
            auth: {
                user: account.user,
                pass: account.pass,
            },
            });
        });
    }
  }

  // ==========================================
  // HELPER ENKRIPSI AES-256-CBC
  // ==========================================
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16); 
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  private decrypt(encryptedText: string): string {
    const [ivHex, encrypted] = encryptedText.split(':');
    if (!ivHex || !encrypted) throw new BadRequestException('Format password tidak valid');
    
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // ==========================================
  // BUSINESS LOGIC CRUD USERS
  // ==========================================

  async create(userData: any): Promise<User> {
    const { full_name, email, password, profile_picture, department_id } = userData;

    const existingUser = await this.usersRepository.findOneBy({ email });
    if (existingUser) {
      throw new BadRequestException('Email sudah digunakan');
    }

    const department = await this.departmentsRepository.findOneBy({ id: department_id });
    if (!department) {
      throw new NotFoundException('Department tidak ditemukan');
    }

    const encryptedPassword = this.encrypt(password);

    const newUser = this.usersRepository.create({
      full_name,
      email,
      password: encryptedPassword,
      profile_picture, 
      department,
      created_at: new Date(),
      modified_at: new Date(),
    });

    return this.usersRepository.save(newUser);
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find({
      relations: {
        department: true 
    }
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
        where: { id },
        relations: {
        department: true 
        },
    });
    
    if (!user) {
        throw new NotFoundException('User tidak ditemukan');
    }
    return user;
  }

  async forgotPassword(email: string): Promise<any> {
    const user = await this.usersRepository.findOneBy({ email });
    if (!user) {
      throw new NotFoundException('Email tidak terdaftar di sistem');
    }

    const token = crypto.randomBytes(32).toString('hex');
    
    const expireDate = new Date();
    expireDate.setHours(expireDate.getHours() + 1); 

    user.reset_token = token;
    user.reset_token_expires = expireDate;
    await this.usersRepository.save(user);

    const frontendUrl = this.isProduction ? process.env.FRONTEND_URL : 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    const info = await this.transporter.sendMail({
      from: '"HR Admin" <no-reply@dexa.com>',
      to: email,
      subject: 'Permintaan Reset Password',
      text: `Silakan klik link ini untuk mereset password Anda: ${resetLink}`,
      html: `<p>Silakan klik link di bawah ini untuk mereset password Anda:</p>
             <a href="${resetLink}" target="_blank">Reset Password Saya</a>
             <p>Link ini akan hangus dalam 1 jam.</p>`,
    });

    return {
      message: 'Email reset password telah dikirim',
      emailPreviewUrl: nodemailer.getTestMessageUrl(info), 
    };
  }

  async resetPassword(token: string, new_password: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findOneBy({ reset_token: token });
    
    if (!user) {
      throw new BadRequestException('Token tidak valid atau salah');
    }

    if (user.reset_token_expires 
        && new Date() > user.reset_token_expires) {
      throw new BadRequestException('Token sudah kedaluwarsa, silakan minta link baru');
    }

    user.password = this.encrypt(new_password);
    user.reset_token = null;
    user.reset_token_expires = null;
    
    await this.usersRepository.save(user);

    return { message: 'Password Anda berhasil di-reset. Silakan login.' };
  }

  async changePassword(id: string, passwordData: any): Promise<{ message: string }> {
    const { old_password, new_password } = passwordData;
    const user = await this.findOne(id);

    try {
      const decryptedOldPassword = this.decrypt(user.password);
      
      if (decryptedOldPassword !== old_password) {
        throw new BadRequestException('Password lama yang Anda masukkan salah');
      }
    } catch (error) {
      throw new BadRequestException('Gagal memverifikasi password lama. Pastikan password benar.');
    }

    user.password = this.encrypt(new_password);
    await this.usersRepository.save(user);

    return { message: 'Password berhasil diubah' };
  }

  async updateProfile(id: string, updateData: any): Promise<User> {
    const user = await this.findOne(id); 

    if (updateData.full_name) user.full_name = updateData.full_name;
    if (updateData.email) user.email = updateData.email;
    if (updateData.profile_picture) user.profile_picture = updateData.profile_picture;

    if (updateData.password) {
      user.password = this.encrypt(updateData.password);
    }

    if (updateData.department_id) {
      const department = await this.departmentsRepository.findOneBy({ id: updateData.department_id });
      if (!department) {
        throw new NotFoundException('Department tidak ditemukan');
      }
      user.department = department;
    }

    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.usersRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`User dengan ID "${id}" tidak ditemukan`);
    }

    return { message: `User dengan ID "${id}" berhasil dihapus` };
  }
}