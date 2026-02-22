import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { SendEmailDto } from './dto/email.dto';

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}

  private createTransporter() {
    return nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: this.configService.get<number>('EMAIL_PORT') === 465,
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  async sendEmail(dto: SendEmailDto) {
    const transporter = this.createTransporter();

    try {
      await transporter.sendMail({
        from: `"LMS Support" <${this.configService.get<string>('EMAIL_USER')}>`,
        to: dto.recipients,
        subject: dto.subject,
        html: dto.html,
      });
    } catch (error) {
      console.error('Email send failed:', error);
      throw new InternalServerErrorException('Failed to send email');
    }
  }
}
