import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateRoomRoleDto {
  @IsOptional()
  @IsString()
  @Length(2, 64)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  description?: string;
}
