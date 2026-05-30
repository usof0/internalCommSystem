import { IsOptional, IsString, Length } from 'class-validator';

export class CreateTopicDto {
  @IsString()
  @Length(1, 255)
  title: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;
}
