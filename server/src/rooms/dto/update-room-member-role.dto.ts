import { IsString, IsUUID } from 'class-validator';

export class UpdateRoomMemberRoleDto {
  @IsString()
  @IsUUID('4')
  roomRoleId: string;
}
