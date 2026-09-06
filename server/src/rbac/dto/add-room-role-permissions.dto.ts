import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class AddRoomRolePermissionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissionCodes: string[];
}
