import { IsArray, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class AddEventParticipantsDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[];

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
}
