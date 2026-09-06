import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestPasswordResetDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
