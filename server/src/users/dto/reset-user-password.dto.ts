import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ResetUserPasswordDto {
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword?: string;
}
