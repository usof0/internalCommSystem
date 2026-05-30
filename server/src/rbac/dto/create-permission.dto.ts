import { IsOptional, IsString, Length } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @Length(2, 128)
  code: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  description?: string;

  @IsString()
  @Length(2, 64)
  module: string;
}
