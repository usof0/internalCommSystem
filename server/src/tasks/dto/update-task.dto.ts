import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(1, 10000)
  description?: string;

  @IsOptional()
  @IsString()
  dueDate?: string | null;
}
