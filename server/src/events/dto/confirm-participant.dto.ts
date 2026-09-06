import { IsBoolean } from 'class-validator';

export class ConfirmParticipantDto {
  @IsBoolean()
  confirmed: boolean;
}
