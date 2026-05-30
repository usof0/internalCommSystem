import { IsUUID } from 'class-validator';

export class VoteDto {
  @IsUUID('4')
  optionId: string;
}
