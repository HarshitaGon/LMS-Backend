import { IsOptional, IsString } from 'class-validator';

export class SearchBookDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  isbn?: string;
}
