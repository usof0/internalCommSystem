import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class UpdatePollDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(1, 10000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  allowVoteChange?: boolean;
}
