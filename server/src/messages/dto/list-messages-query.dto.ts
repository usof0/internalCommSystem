import { IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListMessagesQueryDto {
  @IsOptional()
  @IsUUID('4')
  parentId?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  offset?: number;
}
