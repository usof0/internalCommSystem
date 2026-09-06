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
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { AddEventParticipantsDto } from './dto/add-event-participants.dto';
import { ConfirmParticipantDto } from './dto/confirm-participant.dto';

@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  // ─── GET /events/my ───────────────────────────────────────

  @Get('my')
  listMyEvents(@Req() req: any, @Query() query: ListEventsQueryDto) {
    return this.events.listMyEvents(req.user.id, query);
  }

  // ─── GET /events/created ──────────────────────────────────

  @Get('created')
  listCreatedEvents(@Req() req: any, @Query() query: ListEventsQueryDto) {
    return this.events.listCreatedEvents(req.user.id, query);
  }

  // ─── GET /events/:eventId ─────────────────────────────────

  @Get(':eventId')
  getEvent(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Req() req: any,
  ) {
    return this.events.getEvent(eventId, req.user.id);
  }

  // ─── POST /events ─────────────────────────────────────────

  @Post()
  @HttpCode(201)
  createEvent(@Req() req: any, @Body() dto: CreateEventDto) {
    return this.events.createEvent(req.user.id, dto);
  }

  // ─── PATCH /events/:eventId ───────────────────────────────

  @Patch(':eventId')
  updateEvent(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Req() req: any,
    @Body() dto: UpdateEventDto,
  ) {
    return this.events.updateEvent(eventId, req.user.id, dto);
  }

  // ─── DELETE /events/:eventId ──────────────────────────────

  @Delete(':eventId')
  @HttpCode(204)
  deleteEvent(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Req() req: any,
  ) {
    return this.events.deleteEvent(eventId, req.user.id);
  }

  // ─── POST /events/:eventId/participants ───────────────────

  @Post(':eventId/participants')
  @HttpCode(201)
  addParticipants(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Req() req: any,
    @Body() dto: AddEventParticipantsDto,
  ) {
    return this.events.addParticipants(eventId, req.user.id, dto);
  }

  // ─── DELETE /events/:eventId/participants/:userId ─────────

  @Delete(':eventId/participants/:userId')
  @HttpCode(204)
  removeParticipant(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Req() req: any,
  ) {
    return this.events.removeParticipant(eventId, req.user.id, userId);
  }

  // ─── PATCH …/participants/:userId/confirm ─────────────────

  @Patch(':eventId/participants/:userId/confirm')
  confirmParticipant(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Req() req: any,
    @Body() dto: ConfirmParticipantDto,
  ) {
    return this.events.confirmParticipant(eventId, req.user.id, userId, dto.confirmed);
  }
}
