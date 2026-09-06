import { IsUUID } from 'class-validator';

export class UserMembershipDto {
  @IsUUID('4')
  orgUnitId: string;

  @IsUUID('4')
  positionId: string;
}
