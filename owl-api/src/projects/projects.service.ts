import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async createProject(createProjectDto: CreateProjectDto, userId: string) {
    const project = await this.prisma.project.create({
      data: {
        userId,
        projectName: createProjectDto.projectName,
        projectType: createProjectDto.projectType,
      },
      include: {
        user: {
          select: {
            userId: true,
            username: true,
            name: true,
          },
        },
      },
    });

    return project;
  }

  async getUserProjects(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: { userId },
      include: {
        submissions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects;
  }

  async getProject(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { projectId },
      include: {
        user: {
          select: {
            userId: true,
            username: true,
            name: true,
          },
        },
        submissions: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return project;
  }

  async createSubmission(createSubmissionDto: CreateSubmissionDto, userId: string) {
    const projectId = createSubmissionDto.projectId;
    
    const project = await this.prisma.project.findUnique({
      where: { projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const submission = await this.prisma.submission.create({
      data: {
        projectId,
        playableUrl: createSubmissionDto.playableUrl,
        imageUrl: createSubmissionDto.imageUrl,
        description: createSubmissionDto.description,
        repoUrl: createSubmissionDto.repoUrl,
      },
    });

    return submission;
  }

  async getProjectSubmissions(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const submissions = await this.prisma.submission.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return submissions;
  }
}
