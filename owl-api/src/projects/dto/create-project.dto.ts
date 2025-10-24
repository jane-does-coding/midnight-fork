import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ProjectType } from '../../enums/project-type.enum';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  projectName: string;

  @IsEnum(ProjectType)
  @IsNotEmpty()
  projectType: ProjectType;
}
