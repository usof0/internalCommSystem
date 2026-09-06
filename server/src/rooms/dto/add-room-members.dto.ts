import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class AddRoomMembersDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  userIds: string[];

  @IsOptional()
  @IsString()
  @IsUUID('4')
  roomRoleId?: string;
}
