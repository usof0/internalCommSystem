import { IsString, Length } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @Length(1, 255)
  title: string;

  @IsString()
  @Length(1, 10000)
  description: string;

  @IsString()
  @Length(1, 500)
  address: string;

  @IsString()
  timeStart: string;

  @IsString()
  timeEnd: string;
}
