import { IsArray, IsString } from 'class-validator';

export class AddRoomRolePermissionsDto {
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}