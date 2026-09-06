import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class AddRolePermissionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissionCodes: string[];
}
