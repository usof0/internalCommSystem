import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class ResolveGroupDto {
  @IsOptional()
  @IsUUID('4')
  orgUnitId?: string;

  @IsOptional()
  @IsBoolean()
  includeDescendants?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagNames?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[];
}
