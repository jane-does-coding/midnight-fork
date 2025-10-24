import { IsOptional, IsString, IsUrl, IsNotEmpty } from 'class-validator';

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
  description?: string;

  @IsOptional()
  @IsUrl()
  repoUrl?: string;
}
