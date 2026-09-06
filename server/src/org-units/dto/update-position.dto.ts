import { IsOptional, IsString, Length } from 'class-validator';

export class UpdatePositionDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;
}
