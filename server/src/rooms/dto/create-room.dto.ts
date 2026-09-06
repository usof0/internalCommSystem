import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

class InitialTopicVisibilityScopeDto {
  @IsEnum(['ALL_MEMBERS', 'INCLUDE_MEMBERS', 'EXCLUDE_MEMBERS', 'ORG_UNIT', 'ORG_UNIT_TAG'])
  scopeType: string;
}

class InitialTopicDto {
  @IsString()
  @Length(1, 255)
  title: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => InitialTopicVisibilityScopeDto)
  visibilityScope?: InitialTopicVisibilityScopeDto;
}

export class CreateRoomDto {
  @IsEnum(['DIRECT', 'GROUP'])
  type: 'DIRECT' | 'GROUP';

  @IsOptional()
  @IsString()
  @Length(1, 255)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2048)
  avatarUrl?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  memberIds?: string[];

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
  memberRoomRoleId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InitialTopicDto)
  initialTopics?: InitialTopicDto[];
}
