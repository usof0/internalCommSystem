import { ArrayNotEmpty, IsArray, IsOptional, IsUUID, IsString } from 'class-validator';

export class AssignUserRolesDto {
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  roleIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  roleNames?: string[];
}
