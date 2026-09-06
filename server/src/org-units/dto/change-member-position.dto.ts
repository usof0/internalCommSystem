import { IsUUID } from 'class-validator';

export class ChangeMemberPositionDto {
  @IsUUID('4')
  fromPositionId: string;

  @IsUUID('4')
  toPositionId: string;
}
