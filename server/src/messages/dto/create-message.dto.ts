import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @Length(1, 10000)
  content: string;

  @IsOptional()
  @IsUUID('4')
  parentId?: string;
}
