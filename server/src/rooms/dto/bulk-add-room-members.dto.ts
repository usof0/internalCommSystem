import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class BulkAddRoomMembersDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  orgUnitIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  orgUnitTagIds?: string[];

  @IsOptional()
  @IsBoolean()
  includeSubUnits?: boolean;

  @IsOptional()
  @IsUUID('4')
  roomRoleId?: string;

  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}
