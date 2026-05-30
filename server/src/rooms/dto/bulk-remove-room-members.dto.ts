import { IsArray, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class BulkRemoveRoomMembersDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  orgUnitIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  orgUnitTagIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[];

  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}
