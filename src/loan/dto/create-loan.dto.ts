import { IsUUID } from 'class-validator';

export class CreateLoanDto {
  @IsUUID()
  bookId: string;
}
