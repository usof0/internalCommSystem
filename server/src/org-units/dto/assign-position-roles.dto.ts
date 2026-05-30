import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class AssignPositionRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  roleIds: string[];
}
