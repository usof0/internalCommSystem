import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateTopicDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  /**
   * ISO date string to archive, or null to unarchive.
   * Omit to leave unchanged.
   */
  @IsOptional()
  archivedAt?: string | null;
}
