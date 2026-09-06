import { IsInt, Max, Min } from 'class-validator';

export class SetRatingDto {
  @IsInt()
  @Min(0)
  @Max(100)
  rating: number;
}
