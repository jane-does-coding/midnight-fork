import { Controller, Get, Put, Body, Param, UseGuards, Req, ParseIntPipe, Delete, Post, Res, Sse } from '@nestjs/common';
import { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('api/admin')
@UseGuards(AuthGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('submissions')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async getAllSubmissions() {
    return this.adminService.getAllSubmissions();
  }

  @Get('edit-requests')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async getAllEditRequests() {
    return this.adminService.getAllEditRequests();
  }

  @Put('submissions/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async updateSubmission(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSubmissionDto: UpdateSubmissionDto,
    @Req() req: Request,
  ) {
    return this.adminService.updateSubmission(id, updateSubmissionDto, req.user.userId, req.user.email);
  }

  @Post('submissions/:id/quick-approve')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async quickApproveSubmission(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { hoursJustification?: string },
    @Req() req: Request,
  ) {
    return this.adminService.quickApproveSubmission(id, req.user.userId, req.user.email, body.hoursJustification);
  }

  @Put('projects/:id/unlock')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async unlockProject(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    return this.adminService.unlockProject(id, req.user.userId);
  }

  @Put('edit-requests/:id/approve')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async approveEditRequest(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    return this.adminService.approveEditRequest(id, req.user.userId);
  }

  @Put('edit-requests/:id/reject')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async rejectEditRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string },
    @Req() req: Request,
  ) {
    return this.adminService.rejectEditRequest(id, body.reason, req.user.userId);
  }

  @Get('projects')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async getAllProjects() {
    return this.adminService.getAllProjects();
  }

  @Post('projects/:id/recalculate')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async recalculateProjectHours(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.recalculateProjectHours(id);
  }

  @Post('projects/recalculate-all')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async recalculateAllProjects(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const sendProgress = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      await this.adminService.recalculateAllProjectsWithProgress(sendProgress);
      sendProgress({ type: 'complete' });
      res.end();
    } catch (error) {
      sendProgress({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
      res.end();
    }
  }

  @Delete('projects/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async deleteProject(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteProject(id);
  }

  @Get('users')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('metrics')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async getTotals() {
    return this.adminService.getTotals();
  }
}
