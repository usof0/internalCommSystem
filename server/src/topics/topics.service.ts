import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VisibilityScopeType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrgUnitsService } from '../org-units/org-units.service';
import { SetVisibilityScopeDto } from './dto/set-visibility-scope.dto';
import { PatchVisibilityScopeDto } from './dto/patch-visibility-scope.dto';
import { ChatGateway } from '../gateway/chat.gateway';

const CHAT_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  secondName: true,
  lastName: true,
  displayName: true,
  avatarUrl: true,
} as const;

@Injectable()
export class TopicsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly org: OrgUnitsService,
    private readonly gateway: ChatGateway,
  ) {}

  // ─── Access helpers ───────────────────────────────────────

  async assertRoomMember(userId: string, roomId: string) {
    const membership = await this.prisma.userRoomMembership.findUnique({
      where: { userId_roomId: { userId, roomId } },
      select: { userId: true },
    });
    if (!membership) throw new ForbiddenException('Not a member of this room');
  }

  async assertTopicVisible(userId: string, topicId: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      select: {
        id: true,
        roomId: true,
        deletedAt: true,
        visibilityScope: {
          select: {
            id: true,
            scopeType: true,
            includeSubUnits: true,
          },
        },
      },
    });
    if (!topic || topic.deletedAt) throw new NotFoundException('Topic not found');

    const canSee = await this.computeCanSee(userId, topic.roomId, topic.visibilityScope);
    if (!canSee) throw new ForbiddenException('No access to this topic');
  }

  // ─── Topics CRUD ──────────────────────────────────────────

  async listTopics(roomId: string, userId: string) {
    await this.assertRoomExists(roomId);

    const topics = await this.prisma.topic.findMany({
      where: { roomId, deletedAt: null },
      select: {
        id: true,
        roomId: true,
        creatorId: true,
        title: true,
        description: true,
        archivedAt: true,
        createdAt: true,
        updatedAt: true,
        creator: { select: CHAT_USER_SELECT },
        visibilityScope: {
          select: {
            id: true,
            scopeType: true,
            includeSubUnits: true,
            memberEntries: { where: { userId }, select: { userId: true } },
            orgUnitEntries: { select: { orgUnitId: true } },
            tagEntries: { select: { tagId: true } },
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                deletedAt: null,
                readBy: { none: { userId } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Filter based on visibility and attach currentUserCanSee + derived isPublic
    const result: any[] = [];
    for (const topic of topics) {
      const canSee = await this.computeCanSee(userId, roomId, topic.visibilityScope);
      if (canSee) {
        const isPublic = topic.visibilityScope?.scopeType === 'ALL_MEMBERS';
        const { visibilityScope: _, _count, ...rest } = topic;
        result.push({ ...rest, isPublic, currentUserCanSee: true, unreadCount: _count.messages });
      }
    }

    return result;
  }

  async createTopic(
    roomId: string,
    creatorId: string,
    data: { title: string; description?: string },
  ) {
    await this.assertRoomExists(roomId);

    const topic = await this.prisma.topic.create({
      data: { roomId, creatorId, title: data.title, description: data.description },
      select: {
        id: true,
        roomId: true,
        creatorId: true,
        title: true,
        description: true,
        archivedAt: true,
        createdAt: true,
        updatedAt: true,
        creator: { select: CHAT_USER_SELECT },
      },
    });

    const result = { ...topic, isPublic: true, currentUserCanSee: true };
    this.gateway.emitToRoom(roomId, 'topic:new', result);
    return result;
  }

  async updateTopic(
    topicId: string,
    roomId: string,
    data: { title?: string; description?: string; archivedAt?: string | null },
  ) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, roomId: true, deletedAt: true },
    });
    if (!topic || topic.deletedAt) throw new NotFoundException('Topic not found');
    if (topic.roomId !== roomId) throw new NotFoundException('Topic not found in this room');

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if ('archivedAt' in data) {
      updateData.archivedAt = data.archivedAt ? new Date(data.archivedAt) : null;
    }

    const updated = await this.prisma.topic.update({
      where: { id: topicId },
      data: updateData,
      select: {
        id: true,
        roomId: true,
        creatorId: true,
        title: true,
        description: true,
        archivedAt: true,
        createdAt: true,
        updatedAt: true,
        creator: { select: CHAT_USER_SELECT },
        visibilityScope: { select: { scopeType: true } },
      },
    });

    const { visibilityScope, ...rest } = updated;
    const result = { ...rest, isPublic: visibilityScope?.scopeType === 'ALL_MEMBERS' };
    this.gateway.emitToRoom(roomId, 'topic:updated', result);
    return result;
  }

  async deleteTopic(topicId: string, roomId: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, roomId: true, deletedAt: true },
    });
    if (!topic || topic.deletedAt) throw new NotFoundException('Topic not found');
    if (topic.roomId !== roomId) throw new NotFoundException('Topic not found in this room');

    const now = new Date();

    // Soft-delete topic and cascade to messages
    await this.prisma.$transaction([
      this.prisma.message.updateMany({
        where: { topicId, deletedAt: null },
        data: { deletedAt: now },
      }),
      this.prisma.topic.update({
        where: { id: topicId },
        data: { deletedAt: now },
      }),
    ]);

    this.gateway.emitToRoom(roomId, 'topic:deleted', { topicId, roomId });
  }

  // ─── Mark topic messages as read ─────────────────────────

  async markTopicRead(topicId: string, userId: string): Promise<{ markedCount: number }> {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, roomId: true, deletedAt: true },
    });
    if (!topic || topic.deletedAt) throw new NotFoundException('Topic not found');

    await this.assertRoomMember(userId, topic.roomId);
    await this.assertTopicVisible(userId, topicId);

    // Find all non-deleted messages in this topic not yet read by the user
    const unread = await this.prisma.message.findMany({
      where: {
        topicId,
        deletedAt: null,
        readBy: { none: { userId } },
      },
      select: { id: true },
    });

    if (unread.length === 0) return { markedCount: 0 };

    const messageIds = unread.map((m) => m.id);

    await this.prisma.userReadMessage.createMany({
      data: messageIds.map((messageId) => ({ userId, messageId })),
      skipDuplicates: true,
    });

    this.gateway.emitToRoom(topic.roomId, 'messages:read', {
      topicId,
      userId,
      messageIds,
    });

    return { markedCount: messageIds.length };
  }

  // ─── Visibility scope ─────────────────────────────────────

  async getVisibilityScope(topicId: string, roomId: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, roomId: true, deletedAt: true },
    });
    if (!topic || topic.deletedAt) throw new NotFoundException('Topic not found');
    if (topic.roomId !== roomId) throw new NotFoundException('Topic not found in this room');

    return this.fetchVisibilityScopeResponse(topicId);
  }

  async setVisibilityScope(
    topicId: string,
    roomId: string,
    dto: SetVisibilityScopeDto,
  ) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, roomId: true, deletedAt: true },
    });
    if (!topic || topic.deletedAt) throw new NotFoundException('Topic not found');
    if (topic.roomId !== roomId) throw new NotFoundException('Topic not found in this room');

    await this.prisma.$transaction(async (tx) => {
      // Delete existing scope and all pivots (cascade handles pivots)
      await tx.topicVisibilityScope.deleteMany({ where: { topicId } });

      const scope = await tx.topicVisibilityScope.create({
        data: {
          topicId,
          scopeType: dto.scopeType as VisibilityScopeType,
          includeSubUnits: dto.includeSubUnits ?? false,
        },
      });

      if (dto.memberIds?.length) {
        await tx.topicVisibilityMember.createMany({
          data: dto.memberIds.map((userId) => ({ scopeId: scope.id, userId })),
          skipDuplicates: true,
        });
      }

      if (dto.orgUnitIds?.length) {
        await tx.topicVisibilityOrgUnit.createMany({
          data: dto.orgUnitIds.map((orgUnitId) => ({ scopeId: scope.id, orgUnitId })),
          skipDuplicates: true,
        });
      }

      if (dto.orgUnitTagIds?.length) {
        await tx.topicVisibilityOrgUnitTag.createMany({
          data: dto.orgUnitTagIds.map((tagId) => ({ scopeId: scope.id, tagId })),
          skipDuplicates: true,
        });
      }
    });

    return this.fetchVisibilityScopeResponse(topicId);
  }

  async patchVisibilityScope(
    topicId: string,
    roomId: string,
    dto: PatchVisibilityScopeDto,
  ) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      select: {
        id: true,
        roomId: true,
        deletedAt: true,
        visibilityScope: { select: { id: true, scopeType: true } },
      },
    });
    if (!topic || topic.deletedAt) throw new NotFoundException('Topic not found');
    if (topic.roomId !== roomId) throw new NotFoundException('Topic not found in this room');

    const scope = topic.visibilityScope;
    if (!scope) {
      throw new BadRequestException(
        'No visibility scope found — use PUT to create one',
      );
    }

    if (scope.scopeType === 'ALL_MEMBERS') {
      throw new BadRequestException(
        'Cannot patch an ALL_MEMBERS scope — use PUT to change the scopeType',
      );
    }

    const hasMemberFields =
      dto.addMemberIds?.length || dto.removeMemberIds?.length;
    const hasOrgUnitFields =
      dto.addOrgUnitIds?.length || dto.removeOrgUnitIds?.length;
    const hasTagFields =
      dto.addOrgUnitTagIds?.length || dto.removeOrgUnitTagIds?.length;

    if (
      (scope.scopeType === 'INCLUDE_MEMBERS' || scope.scopeType === 'EXCLUDE_MEMBERS') &&
      (hasOrgUnitFields || hasTagFields)
    ) {
      throw new BadRequestException(
        `orgUnitIds and orgUnitTagIds fields are not compatible with ${scope.scopeType} scope`,
      );
    }
    if (scope.scopeType === 'ORG_UNIT' && (hasMemberFields || hasTagFields)) {
      throw new BadRequestException(
        'memberIds and orgUnitTagIds fields are not compatible with ORG_UNIT scope',
      );
    }
    if (scope.scopeType === 'ORG_UNIT_TAG' && (hasMemberFields || hasOrgUnitFields)) {
      throw new BadRequestException(
        'memberIds and orgUnitIds fields are not compatible with ORG_UNIT_TAG scope',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const scopeId = scope.id;

      // Members
      if (dto.addMemberIds?.length) {
        await tx.topicVisibilityMember.createMany({
          data: dto.addMemberIds.map((userId) => ({ scopeId, userId })),
          skipDuplicates: true,
        });
      }
      if (dto.removeMemberIds?.length) {
        await tx.topicVisibilityMember.deleteMany({
          where: { scopeId, userId: { in: dto.removeMemberIds } },
        });
      }

      // Org units
      if (dto.addOrgUnitIds?.length) {
        await tx.topicVisibilityOrgUnit.createMany({
          data: dto.addOrgUnitIds.map((orgUnitId) => ({ scopeId, orgUnitId })),
          skipDuplicates: true,
        });
      }
      if (dto.removeOrgUnitIds?.length) {
        await tx.topicVisibilityOrgUnit.deleteMany({
          where: { scopeId, orgUnitId: { in: dto.removeOrgUnitIds } },
        });
      }

      // Tags
      if (dto.addOrgUnitTagIds?.length) {
        await tx.topicVisibilityOrgUnitTag.createMany({
          data: dto.addOrgUnitTagIds.map((tagId) => ({ scopeId, tagId })),
          skipDuplicates: true,
        });
      }
      if (dto.removeOrgUnitTagIds?.length) {
        await tx.topicVisibilityOrgUnitTag.deleteMany({
          where: { scopeId, tagId: { in: dto.removeOrgUnitTagIds } },
        });
      }
    });

    return this.fetchVisibilityScopeResponse(topicId);
  }

  // ─── Private helpers ──────────────────────────────────────

  private async fetchVisibilityScopeResponse(topicId: string) {
    const scope = await this.prisma.topicVisibilityScope.findUnique({
      where: { topicId },
      select: {
        topicId: true,
        scopeType: true,
        includeSubUnits: true,
        updatedAt: true,
        memberEntries: { select: { userId: true } },
        orgUnitEntries: { select: { orgUnitId: true } },
        tagEntries: { select: { tagId: true } },
      },
    });

    if (!scope) {
      const topic = await this.prisma.topic.findUnique({
        where: { id: topicId },
        select: { createdAt: true },
      });
      return {
        topicId,
        scopeType: 'ALL_MEMBERS',
        includeSubUnits: false,
        updatedAt: topic!.createdAt,
        memberIds: [],
        orgUnitIds: [],
        orgUnitTagIds: [],
      };
    }

    return {
      topicId: scope.topicId,
      scopeType: scope.scopeType,
      includeSubUnits: scope.includeSubUnits,
      updatedAt: scope.updatedAt,
      memberIds: scope.memberEntries.map((e) => e.userId),
      orgUnitIds: scope.orgUnitEntries.map((e) => e.orgUnitId),
      orgUnitTagIds: scope.tagEntries.map((e) => e.tagId),
    };
  }

  /**
   * Compute whether a user can see a topic based on its visibility scope.
   * Returns true if the user should have access.
   */
  async computeCanSee(
    userId: string,
    roomId: string,
    scope: {
      id?: string;
      scopeType: string;
      includeSubUnits?: boolean;
      memberEntries?: { userId: string }[];
      orgUnitEntries?: { orgUnitId: string }[];
      tagEntries?: { tagId: string }[];
    } | null,
  ): Promise<boolean> {
    const privilegedMembership = await this.prisma.userRoomMembership.findUnique({
      where: { userId_roomId: { userId, roomId } },
      select: { roomRole: { select: { name: true } } },
    });

    const roomRoleName = privilegedMembership?.roomRole.name.toLowerCase();
    if (roomRoleName === 'owner' || roomRoleName === 'admin') {
      return true;
    }

    if (!scope) {
      // No scope configured → default to ALL_MEMBERS (visible to all room members)
      return true;
    }

    switch (scope.scopeType) {
      case 'ALL_MEMBERS':
        return true;

      case 'INCLUDE_MEMBERS': {
        if (!scope.id) return false;
        const entry = await this.prisma.topicVisibilityMember.findUnique({
          where: { scopeId_userId: { scopeId: scope.id, userId } },
          select: { userId: true },
        });
        return !!entry;
      }

      case 'EXCLUDE_MEMBERS': {
        if (!scope.id) return false;
        const entry = await this.prisma.topicVisibilityMember.findUnique({
          where: { scopeId_userId: { scopeId: scope.id, userId } },
          select: { userId: true },
        });
        return !entry;
      }

      case 'ORG_UNIT': {
        let orgUnitIds: string[];
        let includeSubUnits: boolean;

        if (scope.orgUnitEntries !== undefined) {
          orgUnitIds = scope.orgUnitEntries.map((e) => e.orgUnitId);
          includeSubUnits = scope.includeSubUnits ?? false;
        } else {
          if (!scope.id) return false;
          const scopeRecord = await this.prisma.topicVisibilityScope.findUnique({
            where: { id: scope.id },
            select: {
              orgUnitEntries: { select: { orgUnitId: true } },
              includeSubUnits: true,
            },
          });
          if (!scopeRecord) return false;
          orgUnitIds = scopeRecord.orgUnitEntries.map((e) => e.orgUnitId);
          includeSubUnits = scopeRecord.includeSubUnits;
        }

        if (!orgUnitIds.length) return false;

        let targetIds = [...orgUnitIds];
        if (includeSubUnits) {
          const subtreeIds: string[] = [];
          for (const id of orgUnitIds) {
            const sub = await this.org.getSubtreeIds(id);
            subtreeIds.push(...sub);
          }
          targetIds = [...new Set(subtreeIds)];
        }

        const membership = await this.prisma.userOrgUnitMembership.findFirst({
          where: { userId, orgUnitId: { in: targetIds } },
          select: { userId: true },
        });
        return !!membership;
      }

      case 'ORG_UNIT_TAG': {
        let tagIds: string[];

        if (scope.tagEntries !== undefined) {
          tagIds = scope.tagEntries.map((e) => e.tagId);
        } else {
          if (!scope.id) return false;
          const scopeRecord = await this.prisma.topicVisibilityScope.findUnique({
            where: { id: scope.id },
            select: { tagEntries: { select: { tagId: true } } },
          });
          if (!scopeRecord) return false;
          tagIds = scopeRecord.tagEntries.map((e) => e.tagId);
        }

        if (!tagIds.length) return false;

        // Find org units with any of these tags, then check if user is a member
        const taggedOrgUnits = await this.prisma.orgUnitTag.findMany({
          where: { tagId: { in: tagIds }, deletedAt: null },
          select: { orgUnitId: true },
        });
        const orgUnitIds = [...new Set(taggedOrgUnits.map((t) => t.orgUnitId))];
        if (!orgUnitIds.length) return false;

        const membership = await this.prisma.userOrgUnitMembership.findFirst({
          where: { userId, orgUnitId: { in: orgUnitIds } },
          select: { userId: true },
        });
        return !!membership;
      }

      default:
        return true;
    }
  }

  private async assertRoomExists(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: { id: true, deletedAt: true },
    });
    if (!room || room.deletedAt) throw new NotFoundException('Room not found');
  }
}
