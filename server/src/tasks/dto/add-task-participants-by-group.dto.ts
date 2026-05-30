import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class AddTaskParticipantsByGroupDto {
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
}
