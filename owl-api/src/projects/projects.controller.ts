import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api/projects/auth')
@UseGuards(AuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  async createProject(
    @Body() createProjectDto: CreateProjectDto,
    @Req() req: Request,
  ) {
    return this.projectsService.createProject(createProjectDto, req.user.userId);
  }

  @Get()
  async getUserProjects(@Req() req: Request) {
    return this.projectsService.getUserProjects(req.user.userId);
  }

  @Get(':id')
  async getProject(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.projectsService.getProject(id, req.user.userId);
  }

  @Post('submissions')
  async createSubmission(
    @Body() createSubmissionDto: CreateSubmissionDto,
    @Req() req: Request,
  ) {
    return this.projectsService.createSubmission(createSubmissionDto, req.user.userId);
  }

  @Get(':id/submissions')
  async getProjectSubmissions(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.projectsService.getProjectSubmissions(id, req.user.userId);
  }
}
