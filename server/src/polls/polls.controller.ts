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
import { GlobalPermissionGuard } from '../rbac/guards/global-permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { PollsService } from './polls.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';
import { ListPollsQueryDto } from './dto/list-polls-query.dto';
import { AddPollParticipantsDto } from './dto/add-poll-participants.dto';
import { VoteDto } from './dto/vote.dto';

@UseGuards(JwtAuthGuard)
@Controller('polls')
export class PollsController {
  constructor(private readonly polls: PollsService) {}

  // ─── CRUD ─────────────────────────────────────────────────

  @UseGuards(GlobalPermissionGuard)
  @RequirePermission('poll.create')
  @Post()
  @HttpCode(201)
  createPoll(@Req() req: any, @Body() dto: CreatePollDto) {
    return this.polls.createPoll(req.user.id, dto);
  }

  @Get('my')
  listMyPolls(@Req() req: any, @Query() query: ListPollsQueryDto) {
    return this.polls.listMyPolls(req.user.id, query);
  }

  @Get('created')
  listCreatedPolls(@Req() req: any, @Query() query: ListPollsQueryDto) {
    return this.polls.listCreatedPolls(req.user.id, query);
  }

  @Get(':pollId')
  getPoll(@Param('pollId', ParseUUIDPipe) pollId: string, @Req() req: any) {
    return this.polls.getPoll(pollId, req.user.id);
  }

  @Patch(':pollId')
  updatePoll(
    @Param('pollId', ParseUUIDPipe) pollId: string,
    @Req() req: any,
    @Body() dto: UpdatePollDto,
  ) {
    return this.polls.updatePoll(pollId, req.user.id, dto);
  }

  @Delete(':pollId')
  @HttpCode(204)
  deletePoll(@Param('pollId', ParseUUIDPipe) pollId: string, @Req() req: any) {
    return this.polls.deletePoll(pollId, req.user.id);
  }

  // ─── Participants ─────────────────────────────────────────

  @Post(':pollId/participants')
  @HttpCode(201)
  addParticipants(
    @Param('pollId', ParseUUIDPipe) pollId: string,
    @Req() req: any,
    @Body() dto: AddPollParticipantsDto,
  ) {
    return this.polls.addParticipants(pollId, req.user.id, dto);
  }

  @Delete(':pollId/participants/:userId')
  @HttpCode(204)
  removeParticipant(
    @Param('pollId', ParseUUIDPipe) pollId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() req: any,
  ) {
    return this.polls.removeParticipant(pollId, req.user.id, userId);
  }

  // ─── Voting ───────────────────────────────────────────────

  @Post(':pollId/vote')
  vote(
    @Param('pollId', ParseUUIDPipe) pollId: string,
    @Req() req: any,
    @Body() dto: VoteDto,
  ) {
    return this.polls.vote(pollId, req.user.id, dto.optionId);
  }

  @Delete(':pollId/vote')
  retractVote(@Param('pollId', ParseUUIDPipe) pollId: string, @Req() req: any) {
    return this.polls.retractVote(pollId, req.user.id);
  }
}
