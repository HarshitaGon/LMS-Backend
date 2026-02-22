import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  /* ========================= SIGNUP ========================= */

  async signup(dto: SignupDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: 'MEMBER',
      },
    });

    return {
      message: 'User created successfully',
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  /* ========================= LOGIN ========================= */

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  /* ========================= FORGOT PASSWORD ========================= */

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // valid 10 minutes

    await this.prisma.user.update({
      where: { email },
      data: {
        otp,
        otpExpiry,
      },
    });

    await this.emailService.sendEmail({
      recipients: email,
      subject: 'Password Reset OTP',
      html: `<h3>Your OTP is: ${otp}</h3><p>This OTP is valid for 10 minutes.</p>`,
    });

    return { message: 'OTP sent to email' };
  }

  /* ========================= VERIFY OTP ========================= */

  async verifyOtp(email: string, otp: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.otp || !user.otpExpiry) {
      throw new BadRequestException('Invalid request');
    }

    if (user.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (new Date() > user.otpExpiry) {
      throw new BadRequestException('OTP expired');
    }

    return { message: 'OTP verified successfully' };
  }

  /* ========================= RESET PASSWORD ========================= */

  async resetPassword(
    email: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpiry: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  async requestChangePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new BadRequestException('User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        tempPassword: hashedNewPassword,
        otp,
        otpExpiry,
      },
    });

    await this.emailService.sendEmail({
      recipients: user.email,
      subject: 'OTP for Change Password',
      html: `<h3>Your OTP is: ${otp}</h3>`,
    });

    return { message: 'OTP sent to your email' };
  }

  async confirmChangePassword(userId: string, otp: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.otp || !user.otpExpiry || !user.tempPassword) {
      throw new BadRequestException('Invalid request');
    }

    if (user.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (new Date() > user.otpExpiry) {
      throw new BadRequestException('OTP expired');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: user.tempPassword,
        tempPassword: null,
        otp: null,
        otpExpiry: null,
      },
    });

    return { message: 'Password changed successfully' };
  }
}
