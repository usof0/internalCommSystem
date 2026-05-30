import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class PatchVisibilityScopeDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  addMemberIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  removeMemberIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  addOrgUnitIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  removeOrgUnitIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  addOrgUnitTagIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  removeOrgUnitTagIds?: string[];
}
