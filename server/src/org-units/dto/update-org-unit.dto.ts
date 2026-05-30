import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class UpdateOrgUnitDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @IsOptional()
  @IsUUID('4')
  parentId?: string;
}
