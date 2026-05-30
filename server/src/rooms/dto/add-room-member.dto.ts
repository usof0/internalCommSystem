import { IsOptional, IsUUID } from 'class-validator';

export class AddRoomMemberDto {
  @IsUUID('4')
  userId: string;

  @IsOptional()
  @IsUUID('4')
  roomRoleId?: string;
}
