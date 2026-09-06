import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrgUnitsService } from '../org-units/org-units.service';
import { RbacService } from '../rbac/rbac.service';
import { NotificationsService } from '../notifications/notifications.service';

// ─── Shared select fragments ───────────────────────────────────────────────────

const EVENT_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  secondName: true,
  lastName: true,
  displayName: true,
  avatarUrl: true,
} as const;

const PARTICIPANT_SELECT = {
  userId: true,
  eventId: true,
  participantNumber: true,
  confirmed: true,
  user: { select: EVENT_USER_SELECT },
} as const;

const EVENT_FULL_SELECT = {
  id: true,
  creatorId: true,
  title: true,
  description: true,
  address: true,
  timeStart: true,
  timeEnd: true,
  createdAt: true,
  updatedAt: true,
  creator: { select: EVENT_USER_SELECT },
  participants: { select: PARTICIPANT_SELECT },
} as const;

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly org: OrgUnitsService,
    private readonly rbac: RbacService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── GET /events/my ───────────────────────────────────────

  async listMyEvents(
    userId: string,
    query: { search?: string; page?: number; limit?: number },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null, participants: { some: { userId } } };
    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    const events = await this.prisma.event.findMany({
      where,
      select: {
        id: true,
        creatorId: true,
        title: true,
        description: true,
        address: true,
        timeStart: true,
        timeEnd: true,
        createdAt: true,
        updatedAt: true,
        creator: { select: EVENT_USER_SELECT },
        participants: { select: PARTICIPANT_SELECT },
      },
      orderBy: { timeStart: 'asc' },
      skip,
      take: limit,
    });

    return events.map(({ participants, ...event }) => ({
      ...event,
      participantCount: participants.length,
      confirmedCount: participants.filter((p) => p.confirmed).length,
      myParticipation: participants.find((p) => p.userId === userId) ?? null,
    }));
  }

  // ─── GET /events/created ──────────────────────────────────

  async listCreatedEvents(
    userId: string,
    query: { search?: string; page?: number; limit?: number },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null, creatorId: userId };
    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    const events = await this.prisma.event.findMany({
      where,
      select: {
        id: true,
        creatorId: true,
        title: true,
        description: true,
        address: true,
        timeStart: true,
        timeEnd: true,
        createdAt: true,
        updatedAt: true,
        creator: { select: EVENT_USER_SELECT },
        participants: { select: PARTICIPANT_SELECT },
      },
      orderBy: { timeStart: 'asc' },
      skip,
      take: limit,
    });

    return events.map(({ participants, ...event }) => ({
      ...event,
      participantCount: participants.length,
      confirmedCount: participants.filter((p) => p.confirmed).length,
      myParticipation: participants.find((p) => p.userId === userId) ?? null,
    }));
  }

  // ─── GET /events/:eventId ─────────────────────────────────

  async getEvent(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { ...EVENT_FULL_SELECT, deletedAt: true },
    });

    if (!event || event.deletedAt) throw new NotFoundException('Event not found');

    const isOwner = event.creatorId === userId;
    const isParticipant = event.participants.some((p) => p.userId === userId);
    if (!isOwner && !isParticipant) throw new ForbiddenException('Access denied');

    const { deletedAt: _, ...result } = event;
    return result;
  }

  // ─── POST /events ─────────────────────────────────────────

  async createEvent(
    creatorId: string,
    data: {
      title: string;
      description: string;
      address: string;
      timeStart: string;
      timeEnd: string;
    },
  ) {
    const start = new Date(data.timeStart);
    const end = new Date(data.timeEnd);
    if (end <= start) {
      throw new BadRequestException('timeEnd must be after timeStart');
    }

    return this.prisma.event.create({
      data: {
        creatorId,
        title: data.title,
        description: data.description,
        address: data.address,
        timeStart: start,
        timeEnd: end,
      },
      select: EVENT_FULL_SELECT,
    });
  }

  // ─── PATCH /events/:eventId ───────────────────────────────

  async updateEvent(
    eventId: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      address?: string;
      timeStart?: string;
      timeEnd?: string;
    },
  ) {
    const event = await this.assertEventOwner(eventId, userId);

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.timeStart !== undefined) updateData.timeStart = new Date(data.timeStart);
    if (data.timeEnd !== undefined) updateData.timeEnd = new Date(data.timeEnd);

    // Validate time ordering against merged values
    const start = updateData.timeStart ?? event.timeStart;
    const end = updateData.timeEnd ?? event.timeEnd;
    if (end <= start) {
      throw new BadRequestException('timeEnd must be after timeStart');
    }

    return this.prisma.event.update({
      where: { id: eventId },
      data: updateData,
      select: EVENT_FULL_SELECT,
    });
  }

  // ─── DELETE /events/:eventId ──────────────────────────────

  async deleteEvent(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, creatorId: true, deletedAt: true },
    });
    if (!event || event.deletedAt) throw new NotFoundException('Event not found');

    const isOwner = event.creatorId === userId;
    if (!isOwner) {
      const hasPermission = await this.rbac.userHasPermission(userId, 'event.delete');
      if (!hasPermission) throw new ForbiddenException('Access denied');
    }

    await this.prisma.event.update({
      where: { id: eventId },
      data: { deletedAt: new Date() },
    });
  }

  // ─── POST /events/:eventId/participants ───────────────────

  async addParticipants(
    eventId: string,
    userId: string,
    params: {
      userIds?: string[];
      orgUnitIds?: string[];
      orgUnitTagIds?: string[];
      includeSubUnits?: boolean;
    },
  ) {
    await this.assertEventOwner(eventId, userId);

    const resolvedIds = await this.org.resolveByOrgIds({
      userIds: params.userIds,
      orgUnitIds: params.orgUnitIds,
      orgUnitTagIds: params.orgUnitTagIds,
      includeSubUnits: params.includeSubUnits ?? false,
    });

    if (resolvedIds.length === 0) return [];

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { title: true },
    });

    const newParticipants = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.eventParticipant.findMany({
        where: { eventId, userId: { in: resolvedIds } },
        select: { userId: true },
      });
      const existingIds = new Set(existing.map((e) => e.userId));
      const toAdd = resolvedIds.filter((id) => !existingIds.has(id));

      if (toAdd.length === 0) return [];

      const maxResult = await tx.eventParticipant.aggregate({
        where: { eventId },
        _max: { participantNumber: true },
      });
      let nextNumber = (maxResult._max.participantNumber ?? 0) + 1;

      await tx.eventParticipant.createMany({
        data: toAdd.map((uid) => ({
          userId: uid,
          eventId,
          participantNumber: nextNumber++,
          confirmed: false,
        })),
      });

      return tx.eventParticipant.findMany({
        where: { eventId, userId: { in: toAdd } },
        select: PARTICIPANT_SELECT,
      });
    });

    if (newParticipants.length > 0) {
      this.notifications.create({
        type: 'EVENT_INVITATION',
        title: 'You were invited to an event',
        body: `You have been invited to "${event!.title}"`,
        actorId: userId,
        entityType: 'EVENT',
        entityId: eventId,
        recipientIds: newParticipants.map((p) => p.userId),
      }).catch(() => {});
    }

    return newParticipants;
  }

  // ─── DELETE /events/:eventId/participants/:userId ─────────

  async removeParticipant(eventId: string, userId: string, targetUserId: string) {
    await this.assertEventOwner(eventId, userId);

    const existing = await this.prisma.eventParticipant.findUnique({
      where: { userId_eventId: { userId: targetUserId, eventId } },
    });
    if (!existing) throw new NotFoundException('Participant not found');

    await this.prisma.eventParticipant.delete({
      where: { userId_eventId: { userId: targetUserId, eventId } },
    });

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { title: true },
    });

    this.notifications.create({
      type: 'EVENT_REMOVED',
      title: 'You were removed from an event',
      body: `You have been removed from "${event!.title}"`,
      actorId: userId,
      entityType: 'EVENT',
      entityId: eventId,
      recipientIds: [targetUserId],
    }).catch(() => {});
  }

  // ─── PATCH …/participants/:userId/confirm ─────────────────

  async confirmParticipant(
    eventId: string,
    currentUserId: string,
    targetUserId: string,
    confirmed: boolean,
  ) {
    if (currentUserId !== targetUserId) {
      throw new ForbiddenException('You can only update your own confirmation');
    }

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, deletedAt: true },
    });
    if (!event || event.deletedAt) throw new NotFoundException('Event not found');

    const p = await this.prisma.eventParticipant.findUnique({
      where: { userId_eventId: { userId: targetUserId, eventId } },
    });
    if (!p) throw new NotFoundException('Participant not found');

    return this.prisma.eventParticipant.update({
      where: { userId_eventId: { userId: targetUserId, eventId } },
      data: { confirmed },
      select: PARTICIPANT_SELECT,
    });
  }

  // ─── Private helpers ──────────────────────────────────────

  private async assertEventOwner(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, creatorId: true, timeStart: true, timeEnd: true, deletedAt: true },
    });
    if (!event || event.deletedAt) throw new NotFoundException('Event not found');
    if (event.creatorId !== userId) throw new ForbiddenException('Access denied');
    return event;
  }
}
