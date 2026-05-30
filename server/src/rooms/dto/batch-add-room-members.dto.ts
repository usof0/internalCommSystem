import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class MemberEntry {
  @IsUUID('4')
  userId: string;

  @IsOptional()
  @IsUUID('4')
  roomRoleId?: string;
}

export class BatchAddRoomMembersDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MemberEntry)
  members: MemberEntry[];
}
