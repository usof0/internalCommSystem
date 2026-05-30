import { IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class TreeQueryDto {
  @IsOptional()
  @IsUUID('4')
  rootId?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  depth?: number;
}
