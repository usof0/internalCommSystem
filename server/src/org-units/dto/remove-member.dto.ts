import { IsUUID } from 'class-validator';

export class RemoveMemberDto {
  @IsUUID('4')
  positionId: string;
}
