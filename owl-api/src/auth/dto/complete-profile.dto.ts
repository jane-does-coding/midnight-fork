import { IsDateString, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CompleteProfileDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  @IsNotEmpty()
  birthday: string;
}
