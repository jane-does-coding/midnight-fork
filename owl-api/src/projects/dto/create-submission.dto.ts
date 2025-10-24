import { IsOptional, IsString, IsUrl, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateSubmissionDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsOptional()
  @IsUrl()
  playableUrl?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsUrl()
  repoUrl?: string;
}
