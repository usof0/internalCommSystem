import { IsDateString, IsOptional, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2048)
  avatarUrl?: string;

  /**
   * ISO date string to archive, or null to unarchive.
   * Omit to leave unchanged.
   */
  @IsOptional()
  archivedAt?: string | null;
}
