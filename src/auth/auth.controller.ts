import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { VerifyChangePasswordOtpDto } from './dto/verify-change-password-otp.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /* ================= FORGOT PASSWORD ================= */

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.otp);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(
      dto.email,
      dto.newPassword,
      dto.confirmPassword,
    );
  }

  /* ================= CHANGE PASSWORD ================= */

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  requestChangePassword(@Req() req, @Body() dto: ChangePasswordDto) {
    return this.authService.requestChangePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword,
      dto.confirmPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('confirm-change-password')
  confirmChangePassword(@Req() req, @Body() dto: VerifyChangePasswordOtpDto) {
    return this.authService.confirmChangePassword(req.user.id, dto.otp);
  }
}
