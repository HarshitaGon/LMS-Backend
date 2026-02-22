import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SendEmailDto {
  @IsEmail({}, { each: true })
  recipients: string | string[];

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  html: string;
}
