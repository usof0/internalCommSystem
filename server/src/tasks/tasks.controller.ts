import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { AddTaskParticipantsDto } from './dto/add-task-participants.dto';
import { UpdateWorkStatusDto } from './dto/update-work-status.dto';
import { ReviewParticipantDto } from './dto/review-participant.dto';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  // ─── GET /tasks/my ────────────────────────────────────────

  @Get('my')
  listMyTasks(@Req() req: any, @Query() query: ListTasksQueryDto) {
    return this.tasks.listMyTasks(req.user.id, query);
  }

  // ─── GET /tasks/created ───────────────────────────────────

  @Get('created')
  listCreatedTasks(@Req() req: any, @Query() query: ListTasksQueryDto) {
    return this.tasks.listCreatedTasks(req.user.id, query);
  }

  // ─── GET /tasks/:taskId ───────────────────────────────────

  @Get(':taskId')
  getTask(
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
    @Req() req: any,
  ) {
    return this.tasks.getTask(taskId, req.user.id);
  }

  // ─── POST /tasks ──────────────────────────────────────────

  @Post()
  @HttpCode(201)
  createTask(@Req() req: any, @Body() dto: CreateTaskDto) {
    return this.tasks.createTask(req.user.id, dto);
  }

  // ─── PATCH /tasks/:taskId ─────────────────────────────────

  @Patch(':taskId')
  updateTask(
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
    @Req() req: any,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasks.updateTask(taskId, req.user.id, dto);
  }

  // ─── DELETE /tasks/:taskId ────────────────────────────────

  @Delete(':taskId')
  @HttpCode(204)
  deleteTask(
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
    @Req() req: any,
  ) {
    return this.tasks.deleteTask(taskId, req.user.id);
  }

  // ─── POST /tasks/:taskId/participants ─────────────────────

  @Post(':taskId/participants')
  @HttpCode(201)
  addParticipants(
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
    @Req() req: any,
    @Body() dto: AddTaskParticipantsDto,
  ) {
    return this.tasks.addParticipants(taskId, req.user.id, dto);
  }

  // ─── DELETE /tasks/:taskId/participants/:userId ───────────

  @Delete(':taskId/participants/:userId')
  @HttpCode(204)
  removeParticipant(
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Req() req: any,
  ) {
    return this.tasks.removeParticipant(taskId, req.user.id, userId);
  }

  // ─── PATCH …/participants/:userId/work-status ─────────────

  @Patch(':taskId/participants/:userId/work-status')
  updateWorkStatus(
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Req() req: any,
    @Body() dto: UpdateWorkStatusDto,
  ) {
    return this.tasks.updateWorkStatus(taskId, req.user.id, userId, dto.workStatus as any);
  }

  // ─── PATCH …/participants/:userId/review ──────────────────

  @Patch(':taskId/participants/:userId/review')
  reviewParticipant(
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Req() req: any,
    @Body() dto: ReviewParticipantDto,
  ) {
    return this.tasks.reviewParticipant(
      taskId,
      req.user.id,
      userId,
      dto.reviewStatus as any,
      dto.rating,
    );
  }
}
