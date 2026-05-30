import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoomType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrgUnitsService } from '../org-units/org-units.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatGateway } from '../gateway/chat.gateway';
import { RbacService } from '../rbac/rbac.service';

// ─── Shared select fragments ───────────────────────────────────────────────────

const CHAT_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  secondName: true,
  lastName: true,
  displayName: true,
  avatarUrl: true,
} as const;

const ROOM_ROLE_SELECT = {
  id: true,
  name: true,
  description: true,
} as const;

const ASSIGNABLE_ROOM_ROLE_NAMES = new Set(['admin', 'member']);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface BulkOperationResult {
  addedCount: number;
  skippedCount: number;
  addedMembers: any[];
  skipped: { userId: string; reason: string }[];
}

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly org: OrgUnitsService,
    private readonly notifications: NotificationsService,
    private readonly gateway: ChatGateway,
    private readonly rbac: RbacService,
  ) {}

  // ─── Rooms ──────────────────────────────────────────────────

  async listRooms(
    userId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      type?: 'DIRECT' | 'GROUP';
      archived?: string;
    },
  ): Promise<PageResult<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      memberships: { some: { userId } },
    };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.archived === 'true') {
      where.archivedAt = { not: null };
    } else if (query.archived === 'false') {
      where.archivedAt = null;
    }

    const [rooms, total] = await Promise.all([
      this.prisma.room.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          creatorId: true,
          type: true,
          title: true,
          description: true,
          avatarUrl: true,
          archivedAt: true,
          createdAt: true,
          updatedAt: true,
          creator: { select: CHAT_USER_SELECT },
          memberships: {
            where: { userId: { not: userId } },
            select: { userId: true, user: { select: CHAT_USER_SELECT } },
            take: 1,
          },
          topics: {
            where: { deletedAt: null },
            select: {
              messages: {
                where: { deletedAt: null },
                select: {
                  id: true,
                  content: true,
                  createdAt: true,
                  authorId: true,
                  author: { select: CHAT_USER_SELECT },
                  readBy: { where: { userId }, select: { userId: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
              _count: {
                select: {
                  messages: { where: { deletedAt: null, readBy: { none: { userId } } } },
                },
              },
            },
          },
        },
      }),
      this.prisma.room.count({ where }),
    ]);

    const items = rooms.map((r) => {
      // Compute lastMessage and unreadCount across all topics
      let lastMessage: any = null;
      let unreadCount = 0;

      for (const topic of r.topics) {
        unreadCount += topic._count.messages;
        for (const msg of topic.messages) {
          if (!lastMessage || msg.createdAt > lastMessage.createdAt) {
            lastMessage = {
              id: msg.id,
              content: msg.content,
              createdAt: msg.createdAt,
              authorId: msg.authorId,
              author: msg.author,
            };
          }
        }
      }

      const { topics: _, memberships: __, ...room } = r;
      const result: any = { ...room, unreadCount, lastMessage };
      if (r.type === 'DIRECT' && r.memberships.length > 0) {
        result.directRecipient = r.memberships[0].user;
      }
      return result;
    });

    return { items, total, page, limit };
  }

  async getRoom(roomId: string, userId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        creatorId: true,
        type: true,
        title: true,
        description: true,
        avatarUrl: true,
        archivedAt: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        creator: { select: CHAT_USER_SELECT },
        memberships: {
          select: { userId: true, user: { select: CHAT_USER_SELECT } },
        },
        topics: {
          where: { deletedAt: null },
          select: {
            messages: {
              where: { deletedAt: null },
              select: {
                id: true,
                content: true,
                createdAt: true,
                authorId: true,
                author: { select: CHAT_USER_SELECT },
                readBy: { where: { userId }, select: { userId: true } },
              },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            _count: {
              select: {
                messages: { where: { deletedAt: null, readBy: { none: { userId } } } },
              },
            },
          },
        },
      },
    });

    if (!room || room.deletedAt) throw new NotFoundException('Room not found');

    const isMember = room.memberships.some((m) => m.userId === userId);
    if (!isMember) throw new ForbiddenException('Not a member of this room');

    let lastMessage: any = null;
    let unreadCount = 0;
    for (const topic of room.topics) {
      unreadCount += topic._count.messages;
      for (const msg of topic.messages) {
        if (!lastMessage || msg.createdAt > lastMessage.createdAt) {
          lastMessage = {
            id: msg.id,
            content: msg.content,
            createdAt: msg.createdAt,
            authorId: msg.authorId,
            author: msg.author,
          };
        }
      }
    }

    const { deletedAt: _, memberships: __, topics: ___, ...rest } = room;
    const result: any = { ...rest, unreadCount, lastMessage };
    if (room.type === 'DIRECT') {
      const other = room.memberships.find((m) => m.userId !== userId);
      if (other) result.directRecipient = other.user;
    }
    return result;
  }

  async createRoom(
    creatorId: string,
    data: {
      type: 'DIRECT' | 'GROUP';
      title?: string;
      description?: string;
      avatarUrl?: string;
      memberIds?: string[];
      memberRoomRoleId?: string;
      initialTopics?: Array<{
        title: string;
        description?: string;
        visibilityScope?: { scopeType: string };
      }>;
    },
  ): Promise<{ room: any; isExisting: boolean }> {
    // DIRECT dedup: if a DIRECT room already exists between these two users, return it
    if (data.type === 'DIRECT') {
      const otherUserId =
        data.memberIds?.find((id) => id !== creatorId) ?? null;

      if (otherUserId) {
        const existing = await this.findDirectRoom(creatorId, otherUserId);
        if (existing) {
          const room = await this.getRoom(existing.id, creatorId);
          return { room, isExisting: true };
        }
      }
    }

    const ownerRole = await this.prisma.roomRole.findUnique({
      where: { name: 'owner' },
      select: { id: true },
    });
    if (!ownerRole) throw new NotFoundException('Room role "owner" not found');

    const memberRole = await this.resolveRoleId(data.memberRoomRoleId);

    const allMemberIds = Array.from(
      new Set([creatorId, ...(data.memberIds ?? [])]),
    );

    // Validate all extra members exist
    if (allMemberIds.length > 1) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: allMemberIds }, deletedAt: null },
        select: { id: true },
      });
      if (users.length !== allMemberIds.length) {
        const found = new Set(users.map((u) => u.id));
        const missing = allMemberIds.filter((id) => !found.has(id));
        throw new NotFoundException(`Users not found: ${missing.join(', ')}`);
      }
    }

    const title =
      data.title ?? (data.type === 'DIRECT' ? 'Direct Message' : 'New Room');

    const room = await this.prisma.$transaction(async (tx) => {
      const newRoom = await tx.room.create({
        data: {
          creatorId,
          type: data.type as RoomType,
          title,
          description: data.description,
          avatarUrl: data.avatarUrl,
        },
      });

      // Add all members (creator gets owner role, others get member role)
      await tx.userRoomMembership.createMany({
        data: allMemberIds.map((uid) => ({
          userId: uid,
          roomId: newRoom.id,
          roomRoleId: uid === creatorId ? ownerRole.id : memberRole,
        })),
        skipDuplicates: true,
      });

      // Create initial topics
      if (data.initialTopics && data.initialTopics.length > 0) {
        for (const topicData of data.initialTopics) {
          const topic = await tx.topic.create({
            data: {
              roomId: newRoom.id,
              creatorId,
              title: topicData.title,
              description: topicData.description,
            },
          });

          const scopeType =
            (topicData.visibilityScope?.scopeType as any) ?? 'ALL_MEMBERS';
          await tx.topicVisibilityScope.create({
            data: {
              topicId: topic.id,
              scopeType,
            },
          });
        }
      }

      return newRoom;
    });

    const result = await this.getRoom(room.id, creatorId);
    return { room: result, isExisting: false };
  }

  async updateRoom(
    roomId: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      avatarUrl?: string;
      archivedAt?: string | null;
    },
  ) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: { id: true, deletedAt: true },
    });
    if (!room || room.deletedAt) throw new NotFoundException('Room not found');

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if ('archivedAt' in data) {
      updateData.archivedAt = data.archivedAt ? new Date(data.archivedAt) : null;
    }

    await this.prisma.room.update({
      where: { id: roomId },
      data: updateData,
    });

    const result = await this.getRoom(roomId, userId);
    this.gateway.emitToRoom(roomId, 'room:updated', result);
    return result;
  }

  async deleteRoom(roomId: string, userId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: { id: true, creatorId: true, deletedAt: true },
    });
    if (!room || room.deletedAt) throw new NotFoundException('Room not found');

    await this.prisma.room.update({
      where: { id: roomId },
      data: { deletedAt: new Date() },
    });
  }

  // ─── Members ────────────────────────────────────────────────

  async listMembers(roomId: string) {
    await this.assertRoomExists(roomId);

    const memberships = await this.prisma.userRoomMembership.findMany({
      where: { roomId },
      select: {
        userId: true,
        roomId: true,
        roomRoleId: true,
        joinedAt: true,
        user: { select: CHAT_USER_SELECT },
        roomRole: { select: ROOM_ROLE_SELECT },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships.map((m) => ({
      userId: m.userId,
      roomId: m.roomId,
      roomRoleId: m.roomRoleId,
      joinedAt: m.joinedAt,
      user: m.user,
      roomRole: m.roomRole,
    }));
  }

  async listAssignableMemberRoles() {
    return this.prisma.roomRole.findMany({
      where: { name: { in: Array.from(ASSIGNABLE_ROOM_ROLE_NAMES) } },
      select: ROOM_ROLE_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async addMember(roomId: string, userId: string, roomRoleId?: string, actorId?: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: { id: true, title: true, deletedAt: true },
    });
    if (!room || room.deletedAt) throw new NotFoundException('Room not found');

    const resolvedRoleId = await this.resolveRoleId(roomRoleId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.prisma.userRoomMembership.findUnique({
      where: { userId_roomId: { userId, roomId } },
    });
    if (existing) throw new ConflictException('User is already a member');

    const membership = await this.prisma.userRoomMembership.create({
      data: { userId, roomId, roomRoleId: resolvedRoleId },
      select: {
        userId: true,
        roomId: true,
        roomRoleId: true,
        joinedAt: true,
        user: { select: CHAT_USER_SELECT },
        roomRole: { select: ROOM_ROLE_SELECT },
      },
    });

    this.notifications.create({
      type: 'ROOM_INVITATION',
      title: 'You were added to a room',
      body: `You have been added to "${room.title}"`,
      actorId,
      entityType: 'ROOM',
      entityId: roomId,
      recipientIds: [userId],
    }).catch(() => {});

    const memberResult = {
      userId: membership.userId,
      roomId: membership.roomId,
      roomRoleId: membership.roomRoleId,
      joinedAt: membership.joinedAt,
      user: membership.user,
      roomRole: membership.roomRole,
    };
    this.gateway.emitToRoom(roomId, 'room:member:added', memberResult);
    return memberResult;
  }

  async batchAddMembers(
    roomId: string,
    members: Array<{ userId: string; roomRoleId?: string }>,
    actorId?: string,
  ) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: { id: true, title: true, deletedAt: true },
    });
    if (!room || room.deletedAt) throw new NotFoundException('Room not found');

    const defaultRoleId = await this.resolveRoleId(undefined);

    const results: any[] = [];
    for (const m of members) {
      const roleId = m.roomRoleId
        ? await this.resolveRoleId(m.roomRoleId)
        : defaultRoleId;

      const user = await this.prisma.user.findUnique({
        where: { id: m.userId, deletedAt: null },
        select: { id: true },
      });
      if (!user) continue;

      const existing = await this.prisma.userRoomMembership.findUnique({
        where: { userId_roomId: { userId: m.userId, roomId } },
      });
      if (existing) continue;

      const membership = await this.prisma.userRoomMembership.create({
        data: { userId: m.userId, roomId, roomRoleId: roleId },
        select: {
          userId: true,
          roomId: true,
          roomRoleId: true,
          joinedAt: true,
          user: { select: CHAT_USER_SELECT },
          roomRole: { select: ROOM_ROLE_SELECT },
        },
      });

      results.push({
        userId: membership.userId,
        roomId: membership.roomId,
        roomRoleId: membership.roomRoleId,
        joinedAt: membership.joinedAt,
        user: membership.user,
        roomRole: membership.roomRole,
      });
    }

    if (results.length > 0) {
      this.notifications.create({
        type: 'ROOM_INVITATION',
        title: 'You were added to a room',
        body: `You have been added to "${room.title}"`,
        actorId,
        entityType: 'ROOM',
        entityId: roomId,
        recipientIds: results.map((r) => r.userId),
      }).catch(() => {});

      this.gateway.emitToRoom(roomId, 'room:member:added', { members: results });
    }

    return results;
  }

  async updateMemberRole(
    roomId: string,
    targetUserId: string,
    roomRoleId: string,
    actorId: string,
  ) {
    await this.assertRoomExists(roomId);

    const targetRole = await this.prisma.roomRole.findUnique({
      where: { id: roomRoleId },
      select: { id: true, name: true },
    });
    if (!targetRole) throw new NotFoundException('Room role not found');
    if (!this.isAssignableRoomRole(targetRole.name)) {
      throw new ForbiddenException('This room role cannot be assigned manually');
    }

    await this.assertCanManageMembers(roomId, actorId);

    const membership = await this.prisma.userRoomMembership.findUnique({
      where: { userId_roomId: { userId: targetUserId, roomId } },
      include: { roomRole: { select: { name: true } } },
    });
    if (!membership) throw new NotFoundException('Membership not found');

    if (this.isOwnerRole(membership.roomRole.name)) {
      throw new ForbiddenException('Room owner role cannot be changed');
    }

    const updated = await this.prisma.userRoomMembership.update({
      where: { userId_roomId: { userId: targetUserId, roomId } },
      data: { roomRoleId },
      select: {
        userId: true,
        roomId: true,
        roomRoleId: true,
        joinedAt: true,
        user: { select: CHAT_USER_SELECT },
        roomRole: { select: ROOM_ROLE_SELECT },
      },
    });

    return {
      userId: updated.userId,
      roomId: updated.roomId,
      roomRoleId: updated.roomRoleId,
      joinedAt: updated.joinedAt,
      user: updated.user,
      roomRole: updated.roomRole,
    };
  }

  async removeMember(roomId: string, targetUserId: string, requestingUserId: string) {
    await this.assertRoomExists(roomId);

    const membership = await this.prisma.userRoomMembership.findUnique({
      where: { userId_roomId: { userId: targetUserId, roomId } },
      include: { roomRole: { select: { name: true } } },
    });
    if (!membership) throw new NotFoundException('Membership not found');

    if (this.isOwnerRole(membership.roomRole.name)) {
      throw new ForbiddenException('Room owner cannot be removed');
    }

    if (targetUserId !== requestingUserId) {
      await this.assertCanManageMembers(roomId, requestingUserId);
    } else {
      await this.assertRoomMember(requestingUserId, roomId);
    }

    await this.prisma.userRoomMembership.delete({
      where: { userId_roomId: { userId: targetUserId, roomId } },
    });

    this.gateway.emitToRoom(roomId, 'room:member:removed', {
      userId: targetUserId,
      roomId,
    });
  }

  async bulkAddMembers(
    roomId: string,
    params: {
      orgUnitIds?: string[];
      orgUnitTagIds?: string[];
      includeSubUnits?: boolean;
      roomRoleId?: string;
      dryRun?: boolean;
    },
    actorId?: string,
  ): Promise<BulkOperationResult> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: { id: true, title: true, deletedAt: true },
    });
    if (!room || room.deletedAt) throw new NotFoundException('Room not found');

    if (!params.orgUnitIds?.length && !params.orgUnitTagIds?.length) {
      throw new BadRequestException(
        'At least one of orgUnitIds or orgUnitTagIds must be provided',
      );
    }

    const resolvedRoleId = await this.resolveRoleId(params.roomRoleId);

    const userIds = await this.org.resolveByOrgIds({
      orgUnitIds: params.orgUnitIds,
      orgUnitTagIds: params.orgUnitTagIds,
      includeSubUnits: params.includeSubUnits ?? false,
    });

    const existing = await this.prisma.userRoomMembership.findMany({
      where: { roomId, userId: { in: userIds } },
      select: { userId: true },
    });
    const alreadyMemberIds = new Set(existing.map((m) => m.userId));

    const toAdd = userIds.filter((id) => !alreadyMemberIds.has(id));
    const skipped = userIds
      .filter((id) => alreadyMemberIds.has(id))
      .map((userId) => ({ userId, reason: 'already_member' }));

    let addedMembers: any[] = [];

    if (!params.dryRun && toAdd.length > 0) {
      await this.prisma.userRoomMembership.createMany({
        data: toAdd.map((userId) => ({ userId, roomId, roomRoleId: resolvedRoleId })),
        skipDuplicates: true,
      });

      const memberships = await this.prisma.userRoomMembership.findMany({
        where: { roomId, userId: { in: toAdd } },
        select: {
          userId: true,
          roomId: true,
          roomRoleId: true,
          joinedAt: true,
          user: { select: CHAT_USER_SELECT },
          roomRole: { select: ROOM_ROLE_SELECT },
        },
      });

      addedMembers = memberships.map((m) => ({
        userId: m.userId,
        roomId: m.roomId,
        roomRoleId: m.roomRoleId,
        joinedAt: m.joinedAt,
        user: m.user,
        roomRole: m.roomRole,
      }));

      this.notifications.create({
        type: 'ROOM_INVITATION',
        title: 'You were added to a room',
        body: `You have been added to "${room.title}"`,
        actorId,
        entityType: 'ROOM',
        entityId: roomId,
        recipientIds: addedMembers.map((m) => m.userId),
      }).catch(() => {});

      this.gateway.emitToRoom(roomId, 'room:member:added', { members: addedMembers });
    }

    return {
      addedCount: toAdd.length,
      skippedCount: skipped.length,
      addedMembers,
      skipped,
    };
  }

  async bulkRemoveMembers(
    roomId: string,
    params: {
      orgUnitIds?: string[];
      orgUnitTagIds?: string[];
      userIds?: string[];
      dryRun?: boolean;
    },
    actorId: string,
  ): Promise<BulkOperationResult> {
    await this.assertRoomExists(roomId);
    await this.assertCanManageMembers(roomId, actorId);

    const resolvedUserIds = await this.org.resolveByOrgIds({
      orgUnitIds: params.orgUnitIds,
      orgUnitTagIds: params.orgUnitTagIds,
      includeSubUnits: false,
      userIds: params.userIds,
    });

    const existing = await this.prisma.userRoomMembership.findMany({
      where: { roomId, userId: { in: resolvedUserIds } },
      select: { userId: true, roomRole: { select: { name: true } } },
    });
    const memberById = new Map(existing.map((m) => [m.userId, m]));

    const toRemove: string[] = [];
    const skipped: { userId: string; reason: string }[] = [];

    for (const userId of resolvedUserIds) {
      const member = memberById.get(userId);
      if (!member) {
        skipped.push({ userId, reason: 'not_a_member' });
        continue;
      }
      if (this.isOwnerRole(member.roomRole.name)) {
        skipped.push({ userId, reason: 'owner_protected' });
        continue;
      }
      toRemove.push(userId);
    }

    if (!params.dryRun && toRemove.length > 0) {
      await this.prisma.userRoomMembership.deleteMany({
        where: { roomId, userId: { in: toRemove } },
      });
    }

    return {
      addedCount: 0,
      skippedCount: skipped.length,
      addedMembers: [],
      skipped,
    };
  }

  // ─── Helpers ────────────────────────────────────────────────

  async assertRoomExists(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: { id: true, deletedAt: true },
    });
    if (!room || room.deletedAt) throw new NotFoundException('Room not found');
  }

  async assertRoomMember(userId: string, roomId: string) {
    const membership = await this.prisma.userRoomMembership.findUnique({
      where: { userId_roomId: { userId, roomId } },
      select: { userId: true },
    });
    if (!membership) throw new ForbiddenException('Not a member of this room');
  }

  private async findDirectRoom(userA: string, userB: string) {
    const rooms = await this.prisma.room.findMany({
      where: {
        type: 'DIRECT',
        deletedAt: null,
        memberships: { some: { userId: userA } },
      },
      select: {
        id: true,
        memberships: { select: { userId: true } },
      },
    });

    return rooms.find((r) => {
      const memberIds = new Set(r.memberships.map((m) => m.userId));
      return memberIds.has(userA) && memberIds.has(userB) && memberIds.size === 2;
    }) ?? null;
  }

  private async resolveRoleId(roomRoleId?: string): Promise<string> {
    if (roomRoleId) {
      const role = await this.prisma.roomRole.findUnique({
        where: { id: roomRoleId },
        select: { id: true, name: true },
      });
      if (!role) throw new NotFoundException('Room role not found');
      if (!this.isAssignableRoomRole(role.name)) {
        throw new ForbiddenException('This room role cannot be assigned manually');
      }
      return role.id;
    }

    const memberRole = await this.prisma.roomRole.findUnique({
      where: { name: 'member' },
      select: { id: true },
    });
    if (!memberRole) throw new NotFoundException('Room role "member" not found');
    return memberRole.id;
  }

  private async assertNotLastOwner(roomId: string) {
    const ownerRole = await this.prisma.roomRole.findUnique({
      where: { name: 'owner' },
      select: { id: true },
    });
    if (!ownerRole) return;

    const ownerCount = await this.prisma.userRoomMembership.count({
      where: { roomId, roomRoleId: ownerRole.id },
    });

    if (ownerCount <= 1) {
      throw new BadRequestException(
        'Cannot remove or downgrade the last owner of the room',
      );
    }
  }

  private isOwnerRole(roleName?: string | null) {
    return roleName?.toLowerCase() === 'owner';
  }

  private isAssignableRoomRole(roleName?: string | null) {
    return !!roleName && ASSIGNABLE_ROOM_ROLE_NAMES.has(roleName.toLowerCase());
  }

  private async assertCanManageMembers(roomId: string, userId: string) {
    const hasRoomPermission = await this.rbac.userHasRoomPermission(
      userId,
      roomId,
      'room.members.manage',
    );
    if (!hasRoomPermission) {
      throw new ForbiddenException('Not allowed to manage room members');
    }
  }
}
