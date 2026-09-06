import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class AddRoomMembersByGroupDto {
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
  @IsUUID('4')
  roomRoleId?: string;
}
