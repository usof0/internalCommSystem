import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class AssignTagsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  tagIds: string[];
}
