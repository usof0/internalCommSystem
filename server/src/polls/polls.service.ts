import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrgUnitsService } from '../org-units/org-units.service';
import { NotificationsService } from '../notifications/notifications.service';

const POLL_USER_SELECT = {
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
  pollId: true,
  done: true,
  chosenOptionId: true,
  user: { select: POLL_USER_SELECT },
} as const;

const OPTION_SELECT = {
  id: true,
  pollId: true,
  value: true,
  chosen: true,
} as const;

@Injectable()
export class PollsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly org: OrgUnitsService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── Helpers ──────────────────────────────────────────────

  private async assertPollOwner(pollId: string, userId: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      select: { id: true, creatorId: true, deletedAt: true },
    });
    if (!poll || poll.deletedAt) throw new NotFoundException('Poll not found');
    if (poll.creatorId !== userId) throw new ForbiddenException('Not the poll creator');
    return poll;
  }

  private async fetchFullPoll(pollId: string) {
    return this.prisma.poll.findUnique({
      where: { id: pollId },
      select: {
        id: true,
        creatorId: true,
        title: true,
        description: true,
        allowVoteChange: true,
        createdAt: true,
        updatedAt: true,
        creator: { select: POLL_USER_SELECT },
        options: {
          where: { deletedAt: null },
          select: OPTION_SELECT,
          orderBy: { createdAt: 'asc' },
        },
        participants: { select: PARTICIPANT_SELECT },
      },
    });
  }

  // ─── CRUD ─────────────────────────────────────────────────

  async createPoll(
    creatorId: string,
    data: { title: string; description?: string; options: string[]; allowVoteChange?: boolean },
  ) {
    if (data.options.length < 2 || data.options.length > 8) {
      throw new BadRequestException('Options must have between 2 and 8 items');
    }
    const uniqueValues = new Set(data.options);
    if (uniqueValues.size !== data.options.length) {
      throw new BadRequestException('Option values must be unique');
    }

    const poll = await this.prisma.$transaction(async (tx) => {
      const created = await tx.poll.create({
        data: {
          creatorId,
          title: data.title,
          description: data.description ?? '',
          allowVoteChange: data.allowVoteChange ?? true,
        },
      });

      await tx.pollOption.createMany({
        data: data.options.map((value) => ({ pollId: created.id, value })),
      });

      return created;
    });

    return this.fetchFullPoll(poll.id);
  }

  async listMyPolls(userId: string, query: { page?: number; limit?: number; search?: string }) {
    return this.queryPollSummaries(
      { deletedAt: null, participants: { some: { userId } } },
      userId,
      query,
    );
  }

  async listCreatedPolls(userId: string, query: { page?: number; limit?: number; search?: string }) {
    return this.queryPollSummaries(
      { deletedAt: null, creatorId: userId },
      userId,
      query,
    );
  }

  private async queryPollSummaries(
    baseWhere: object,
    userId: string,
    query: { page?: number; limit?: number; search?: string },
  ) {
    const take = query.limit ?? 20;
    const skip = ((query.page ?? 1) - 1) * take;

    const where: any = { ...baseWhere };
    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    const polls = await this.prisma.poll.findMany({
      where,
      select: {
        id: true,
        creatorId: true,
        title: true,
        description: true,
        allowVoteChange: true,
        createdAt: true,
        updatedAt: true,
        creator: { select: POLL_USER_SELECT },
        options: {
          where: { deletedAt: null },
          select: OPTION_SELECT,
          orderBy: { createdAt: 'asc' },
        },
        participants: { select: PARTICIPANT_SELECT },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });

    return polls.map(({ participants, ...rest }) => ({
      ...rest,
      participantCount: participants.length,
      doneCount: participants.filter((p) => p.done).length,
      myParticipation: participants.find((p) => p.userId === userId) ?? null,
    }));
  }

  async getPoll(pollId: string, userId: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      select: {
        id: true,
        creatorId: true,
        title: true,
        description: true,
        allowVoteChange: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        creator: { select: POLL_USER_SELECT },
        options: {
          where: { deletedAt: null },
          select: OPTION_SELECT,
          orderBy: { createdAt: 'asc' },
        },
        participants: { select: PARTICIPANT_SELECT },
      },
    });

    if (!poll || poll.deletedAt) throw new NotFoundException('Poll not found');

    const isOwner = poll.creatorId === userId;
    const isParticipant = poll.participants.some((p) => p.userId === userId);
    if (!isOwner && !isParticipant) throw new ForbiddenException('Access denied');

    const { deletedAt: _, ...result } = poll;
    return result;
  }

  async updatePoll(
    pollId: string,
    userId: string,
    data: { title?: string; description?: string; allowVoteChange?: boolean },
  ) {
    await this.assertPollOwner(pollId, userId);

    await this.prisma.poll.update({
      where: { id: pollId },
      data,
    });

    return this.fetchFullPoll(pollId);
  }

  async deletePoll(pollId: string, userId: string) {
    await this.assertPollOwner(pollId, userId);

    await this.prisma.poll.update({
      where: { id: pollId },
      data: { deletedAt: new Date() },
    });
  }

  // ─── Participants ─────────────────────────────────────────

  async addParticipants(
    pollId: string,
    requesterId: string,
    data: {
      userIds?: string[];
      orgUnitIds?: string[];
      orgUnitTagIds?: string[];
      includeSubUnits?: boolean;
    },
  ) {
    await this.assertPollOwner(pollId, requesterId);

    const hasInput =
      data.userIds?.length || data.orgUnitIds?.length || data.orgUnitTagIds?.length;
    if (!hasInput) {
      throw new BadRequestException(
        'At least one of userIds, orgUnitIds, or orgUnitTagIds must be provided',
      );
    }

    const allUserIds = new Set<string>(data.userIds ?? []);

    if (data.orgUnitIds?.length) {
      let targetIds = [...data.orgUnitIds];
      if (data.includeSubUnits) {
        const subtreeIds: string[] = [];
        for (const id of data.orgUnitIds) {
          const sub = await this.org.getSubtreeIds(id);
          subtreeIds.push(...sub);
        }
        targetIds = [...new Set(subtreeIds)];
      }
      const memberships = await this.prisma.userOrgUnitMembership.findMany({
        where: { orgUnitId: { in: targetIds } },
        select: { userId: true },
      });
      for (const m of memberships) allUserIds.add(m.userId);
    }

    if (data.orgUnitTagIds?.length) {
      const taggedUnits = await this.prisma.orgUnitTag.findMany({
        where: { tagId: { in: data.orgUnitTagIds }, deletedAt: null },
        select: { orgUnitId: true },
      });
      const orgUnitIds = [...new Set(taggedUnits.map((t) => t.orgUnitId))];
      if (orgUnitIds.length) {
        const memberships = await this.prisma.userOrgUnitMembership.findMany({
          where: { orgUnitId: { in: orgUnitIds } },
          select: { userId: true },
        });
        for (const m of memberships) allUserIds.add(m.userId);
      }
    }

    if (allUserIds.size === 0) return [];

    const existing = await this.prisma.pollParticipant.findMany({
      where: { pollId, userId: { in: [...allUserIds] } },
      select: { userId: true },
    });
    const existingIds = new Set(existing.map((p) => p.userId));
    const newUserIds = [...allUserIds].filter((id) => !existingIds.has(id));

    if (newUserIds.length === 0) return [];

    await this.prisma.pollParticipant.createMany({
      data: newUserIds.map((userId) => ({ userId, pollId, done: false })),
    });

    const pollDetails = await this.prisma.poll.findUnique({
      where: { id: pollId },
      select: { title: true },
    });

    this.notifications.create({
      type: 'POLL_INVITATION',
      title: 'You were invited to vote on a poll',
      body: `You have been invited to vote on "${pollDetails!.title}"`,
      actorId: requesterId,
      entityType: 'POLL',
      entityId: pollId,
      recipientIds: newUserIds,
    }).catch((err) => {
      console.log(err);
    });

    return this.prisma.pollParticipant.findMany({
      where: { pollId, userId: { in: newUserIds } },
      select: PARTICIPANT_SELECT,
    });
  }

  async removeParticipant(pollId: string, requesterId: string, targetUserId: string) {
    await this.assertPollOwner(pollId, requesterId);

    const participant = await this.prisma.pollParticipant.findUnique({
      where: { userId_pollId: { userId: targetUserId, pollId } },
    });
    if (!participant) throw new NotFoundException('Participant not found');

    await this.prisma.$transaction(async (tx) => {
      if (participant.done && participant.chosenOptionId) {
        await tx.pollOption.update({
          where: { id: participant.chosenOptionId },
          data: { chosen: { decrement: 1 } },
        });
      }
      await tx.pollParticipant.delete({
        where: { userId_pollId: { userId: targetUserId, pollId } },
      });
    });
  }

  // ─── Voting ───────────────────────────────────────────────

  async vote(pollId: string, userId: string, optionId: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      select: { id: true, deletedAt: true, allowVoteChange: true },
    });
    if (!poll || poll.deletedAt) throw new NotFoundException('Poll not found');

    return this.prisma.$transaction(async (tx) => {
      const participant = await tx.pollParticipant.findUnique({
        where: { userId_pollId: { userId, pollId } },
      });
      if (!participant) throw new ForbiddenException('Not a participant');
      if (participant.done && !poll.allowVoteChange) {
        throw new ForbiddenException('Vote changes are not allowed for this poll');
      }

      const option = await tx.pollOption.findUnique({
        where: { id: optionId },
        select: { id: true, pollId: true, deletedAt: true },
      });
      if (!option || option.deletedAt || option.pollId !== pollId) {
        throw new BadRequestException('Invalid option for this poll');
      }

      if (participant.done && participant.chosenOptionId) {
        await tx.pollOption.update({
          where: { id: participant.chosenOptionId },
          data: { chosen: { decrement: 1 } },
        });
      }

      await tx.pollOption.update({
        where: { id: optionId },
        data: { chosen: { increment: 1 } },
      });

      await tx.pollParticipant.update({
        where: { userId_pollId: { userId, pollId } },
        data: { done: true, chosenOptionId: optionId },
      });

      return tx.pollParticipant.findUnique({
        where: { userId_pollId: { userId, pollId } },
        select: PARTICIPANT_SELECT,
      });
    });
  }

  async retractVote(pollId: string, userId: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      select: { id: true, deletedAt: true, allowVoteChange: true },
    });
    if (!poll || poll.deletedAt) throw new NotFoundException('Poll not found');

    return this.prisma.$transaction(async (tx) => {
      const participant = await tx.pollParticipant.findUnique({
        where: { userId_pollId: { userId, pollId } },
      });
      if (!participant) throw new ForbiddenException('Not a participant');
      if (!participant.done) throw new BadRequestException('User has not voted yet');
      if (!poll.allowVoteChange) {
        throw new ForbiddenException('Vote changes are not allowed for this poll');
      }

      if (participant.chosenOptionId) {
        await tx.pollOption.update({
          where: { id: participant.chosenOptionId },
          data: { chosen: { decrement: 1 } },
        });
      }

      await tx.pollParticipant.update({
        where: { userId_pollId: { userId, pollId } },
        data: { done: false, chosenOptionId: null },
      });

      return tx.pollParticipant.findUnique({
        where: { userId_pollId: { userId, pollId } },
        select: PARTICIPANT_SELECT,
      });
    });
  }
}
