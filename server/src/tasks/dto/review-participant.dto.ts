import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ReviewParticipantDto {
  @IsEnum(['APPROVED', 'REJECTED'])
  reviewStatus: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  rating?: number | null;
}
