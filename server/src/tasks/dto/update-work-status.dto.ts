import { IsEnum } from 'class-validator';

export class UpdateWorkStatusDto {
  @IsEnum(['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'SUBMITTED', 'DECLINED'])
  workStatus: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'DECLINED';
}
