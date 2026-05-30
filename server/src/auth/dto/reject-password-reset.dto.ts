import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectPasswordResetDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
