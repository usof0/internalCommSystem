import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreatePollDto {
  @IsString()
  @Length(1, 255)
  title: string;

  @IsString()
  @IsOptional()
  @Length(0, 10000)
  description?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(2)
  @ArrayMaxSize(8)
  @IsString({ each: true })
  options: string[];

  @IsOptional()
  @IsBoolean()
  allowVoteChange?: boolean;
}
