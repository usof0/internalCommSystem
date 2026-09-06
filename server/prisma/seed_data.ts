import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const TEST_PASSWORD = 'Password123!';

type CounterName =
  | 'users'
  | 'orgUnits'
  | 'tags'
  | 'positions'
  | 'roles'
  | 'rooms'
  | 'topics'
  | 'messages'
  | 'tasks'
  | 'events'
  | 'polls'
  | 'notifications';

const summary: Record<CounterName, { created: number; reused: number }> = {
  users: { created: 0, reused: 0 },
  orgUnits: { created: 0, reused: 0 },
  tags: { created: 0, reused: 0 },
  positions: { created: 0, reused: 0 },
  roles: { created: 0, reused: 0 },
  rooms: { created: 0, reused: 0 },
  topics: { created: 0, reused: 0 },
  messages: { created: 0, reused: 0 },
  tasks: { created: 0, reused: 0 },
  events: { created: 0, reused: 0 },
  polls: { created: 0, reused: 0 },
  notifications: { created: 0, reused: 0 },
};

function count(name: CounterName, created: boolean) {
  summary[name][created ? 'created' : 'reused'] += 1;
}

function daysFromNow(days: number, hour = 10, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function dateOnlyFromNow(days: number) {
  const date = daysFromNow(days, 0, 0);
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
}

async function upsertPermission(
  code: string,
  module: string,
  description: string,
) {
  return prisma.permission.upsert({
    where: { code },
    update: { module, description, deletedAt: null },
    create: { code, module, description },
  });
}

async function upsertRole(
  name: string,
  description: string,
  permissionCodes: string[],
) {
  const existing = await prisma.role.findUnique({ where: { name } });
  const role = await prisma.role.upsert({
    where: { name },
    update: { description, deletedAt: null },
    create: { name, description },
  });
  count('roles', !existing);

  const permissions = await prisma.permission.findMany({
    where: { code: { in: permissionCodes } },
    select: { id: true, code: true },
  });

  const found = new Set(permissions.map((permission) => permission.code));
  const missing = permissionCodes.filter((code) => !found.has(code));
  if (missing.length) {
    throw new Error(
      `Missing permissions for role ${name}: ${missing.join(', ')}`,
    );
  }

  await prisma.rolePermission.createMany({
    data: permissions.map((permission) => ({
      roleId: role.id,
      permissionId: permission.id,
    })),
    skipDuplicates: true,
  });

  return role;
}

async function upsertRoomPermission(code: string, description: string) {
  return prisma.roomPermission.upsert({
    where: { code },
    update: { description },
    create: { code, description },
  });
}

async function upsertRoomRole(
  name: string,
  description: string,
  permissionCodes: string[],
) {
  const role = await prisma.roomRole.upsert({
    where: { name },
    update: { description },
    create: { name, description },
  });

  const permissions = await prisma.roomPermission.findMany({
    where: { code: { in: permissionCodes } },
    select: { id: true, code: true },
  });

  const found = new Set(permissions.map((permission) => permission.code));
  const missing = permissionCodes.filter((code) => !found.has(code));
  if (missing.length) {
    throw new Error(
      `Missing room permissions for role ${name}: ${missing.join(', ')}`,
    );
  }

  await prisma.roleRoomPermission.createMany({
    data: permissions.map((permission) => ({
      roomRoleId: role.id,
      roomPermissionId: permission.id,
    })),
    skipDuplicates: true,
  });

  return role;
}

async function upsertUser(data: {
  email: string;
  firstName: string;
  secondName?: string;
  lastName: string;
  displayName?: string;
}) {
  const email = data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      firstName: data.firstName,
      secondName: data.secondName ?? null,
      lastName: data.lastName,
      displayName: data.displayName ?? `${data.firstName} ${data.lastName}`,
      isActive: true,
      isBlocked: false,
      blockedAt: null,
      deletedAt: null,
    },
    create: {
      email,
      passwordHash,
      firstName: data.firstName,
      secondName: data.secondName ?? null,
      lastName: data.lastName,
      displayName: data.displayName ?? `${data.firstName} ${data.lastName}`,
      isActive: true,
      isBlocked: false,
    },
  });

  count('users', !existing);
  return user;
}

async function upsertOrgUnit(
  name: string,
  parentId: string | null,
  description?: string,
) {
  const existing = await prisma.orgUnit.findFirst({
    where: { name, parentId, deletedAt: null },
  });

  if (existing) {
    count('orgUnits', false);
    return prisma.orgUnit.update({
      where: { id: existing.id },
      data: { description },
    });
  }

  const created = await prisma.orgUnit.create({
    data: { name, parentId, description },
  });
  count('orgUnits', true);
  return created;
}

async function upsertTag(name: string) {
  const existing = await prisma.tag.findUnique({ where: { name } });
  const tag = await prisma.tag.upsert({
    where: { name },
    update: { deletedAt: null },
    create: { name },
  });
  count('tags', !existing);
  return tag;
}

async function assignTag(orgUnitId: string, tagId: string) {
  await prisma.orgUnitTag.upsert({
    where: { orgUnitId_tagId: { orgUnitId, tagId } },
    update: { deletedAt: null },
    create: { orgUnitId, tagId },
  });
}

async function upsertPosition(name: string, description: string) {
  const existing = await prisma.position.findUnique({ where: { name } });
  const position = await prisma.position.upsert({
    where: { name },
    update: { description, deletedAt: null },
    create: { name, description },
  });
  count('positions', !existing);
  return position;
}

async function assignRoleToPosition(positionId: string, roleId: string) {
  await prisma.positionRole.upsert({
    where: { positionId_roleId: { positionId, roleId } },
    update: {},
    create: { positionId, roleId },
  });
}

async function assignRoleToUser(userId: string, roleId: string) {
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId } },
    update: { deletedAt: null },
    create: { userId, roleId },
  });
}

async function connectUserToOrgUnit(
  userId: string,
  orgUnitId: string,
  positionId: string,
) {
  await prisma.userOrgUnitMembership.upsert({
    where: { userId_orgUnitId_positionId: { userId, orgUnitId, positionId } },
    update: {},
    create: { userId, orgUnitId, positionId },
  });
}

async function resolveUsersByOrgUnits(orgUnitIds: string[]) {
  const memberships = await prisma.userOrgUnitMembership.findMany({
    where: { orgUnitId: { in: orgUnitIds } },
    select: { userId: true },
  });
  return [...new Set(memberships.map((membership) => membership.userId))];
}

async function upsertRoom(data: {
  title: string;
  description: string;
  creatorId: string;
  memberIds: string[];
  ownerRoleId: string;
  memberRoleId: string;
}) {
  const existing = await prisma.room.findFirst({
    where: { title: data.title, creatorId: data.creatorId, deletedAt: null },
  });

  const room = existing
    ? await prisma.room.update({
        where: { id: existing.id },
        data: {
          description: data.description,
          type: 'GROUP',
          archivedAt: null,
        },
      })
    : await prisma.room.create({
        data: {
          title: data.title,
          description: data.description,
          creatorId: data.creatorId,
          type: 'GROUP',
        },
      });

  count('rooms', !existing);

  const uniqueMembers = [...new Set([data.creatorId, ...data.memberIds])];
  await prisma.userRoomMembership.createMany({
    data: uniqueMembers.map((userId) => ({
      userId,
      roomId: room.id,
      roomRoleId:
        userId === data.creatorId ? data.ownerRoleId : data.memberRoleId,
    })),
    skipDuplicates: true,
  });

  await prisma.userRoomMembership.update({
    where: { userId_roomId: { userId: data.creatorId, roomId: room.id } },
    data: { roomRoleId: data.ownerRoleId },
  });

  return room;
}

async function upsertTopic(data: {
  roomId: string;
  creatorId: string;
  title: string;
  description?: string;
  scopeType:
    | 'ALL_MEMBERS'
    | 'INCLUDE_MEMBERS'
    | 'EXCLUDE_MEMBERS'
    | 'ORG_UNIT'
    | 'ORG_UNIT_TAG';
  memberIds?: string[];
  orgUnitIds?: string[];
  tagIds?: string[];
  includeSubUnits?: boolean;
}) {
  const existing = await prisma.topic.findFirst({
    where: { roomId: data.roomId, title: data.title, deletedAt: null },
  });

  const topic = existing
    ? await prisma.topic.update({
        where: { id: existing.id },
        data: {
          description: data.description,
          archivedAt: null,
        },
      })
    : await prisma.topic.create({
        data: {
          roomId: data.roomId,
          creatorId: data.creatorId,
          title: data.title,
          description: data.description,
        },
      });

  count('topics', !existing);

  await prisma.$transaction(async (tx) => {
    await tx.topicVisibilityScope.deleteMany({ where: { topicId: topic.id } });
    const scope = await tx.topicVisibilityScope.create({
      data: {
        topicId: topic.id,
        scopeType: data.scopeType,
        includeSubUnits: data.includeSubUnits ?? false,
      },
    });

    if (data.memberIds?.length) {
      await tx.topicVisibilityMember.createMany({
        data: [...new Set(data.memberIds)].map((userId) => ({
          scopeId: scope.id,
          userId,
        })),
        skipDuplicates: true,
      });
    }

    if (data.orgUnitIds?.length) {
      await tx.topicVisibilityOrgUnit.createMany({
        data: [...new Set(data.orgUnitIds)].map((orgUnitId) => ({
          scopeId: scope.id,
          orgUnitId,
        })),
        skipDuplicates: true,
      });
    }

    if (data.tagIds?.length) {
      await tx.topicVisibilityOrgUnitTag.createMany({
        data: [...new Set(data.tagIds)].map((tagId) => ({
          scopeId: scope.id,
          tagId,
        })),
        skipDuplicates: true,
      });
    }
  });

  return topic;
}

async function createMessageIfNotExists(data: {
  topicId: string;
  authorId: string;
  content: string;
  parentId?: string | null;
  level?: number;
  isPinned?: boolean;
}) {
  const existing = await prisma.message.findFirst({
    where: {
      topicId: data.topicId,
      authorId: data.authorId,
      content: data.content,
      parentId: data.parentId ?? null,
      deletedAt: null,
    },
  });

  if (existing) {
    count('messages', false);
    if (existing.isPinned !== (data.isPinned ?? false)) {
      return prisma.message.update({
        where: { id: existing.id },
        data: { isPinned: data.isPinned ?? false },
      });
    }
    return existing;
  }

  const created = await prisma.message.create({
    data: {
      topicId: data.topicId,
      authorId: data.authorId,
      parentId: data.parentId ?? null,
      content: data.content,
      level: data.level ?? (data.parentId ? 1 : 0),
      isPinned: data.isPinned ?? false,
    },
  });
  count('messages', true);
  return created;
}

async function createTaskIfNotExists(data: {
  creatorId: string;
  title: string;
  description: string;
  dueDate: Date;
  participantIds: string[];
  states?: Record<
    string,
    {
      workStatus:
        | 'PENDING'
        | 'ACCEPTED'
        | 'IN_PROGRESS'
        | 'SUBMITTED'
        | 'DECLINED';
      reviewStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
      rating?: number;
      submittedAt?: Date | null;
    }
  >;
}) {
  const existing = await prisma.task.findFirst({
    where: { creatorId: data.creatorId, title: data.title, deletedAt: null },
  });

  const task = existing
    ? await prisma.task.update({
        where: { id: existing.id },
        data: { description: data.description, dueDate: data.dueDate },
      })
    : await prisma.task.create({
        data: {
          creatorId: data.creatorId,
          title: data.title,
          description: data.description,
          dueDate: data.dueDate,
        },
      });

  count('tasks', !existing);

  for (const userId of [...new Set(data.participantIds)]) {
    const state = data.states?.[userId];
    await prisma.taskParticipant.upsert({
      where: { userId_taskId: { userId, taskId: task.id } },
      update: state
        ? {
            workStatus: state.workStatus,
            reviewStatus: state.reviewStatus ?? 'PENDING',
            rating: state.rating ?? null,
            submittedAt: state.submittedAt ?? null,
          }
        : {},
      create: {
        userId,
        taskId: task.id,
        workStatus: state?.workStatus ?? 'PENDING',
        reviewStatus: state?.reviewStatus ?? 'PENDING',
        rating: state?.rating ?? null,
        submittedAt: state?.submittedAt ?? null,
      },
    });
  }

  return task;
}

async function createEventIfNotExists(data: {
  creatorId: string;
  title: string;
  description: string;
  address: string;
  timeStart: Date;
  timeEnd: Date;
  participantIds: string[];
  confirmedIds?: string[];
}) {
  const existing = await prisma.event.findFirst({
    where: { creatorId: data.creatorId, title: data.title, deletedAt: null },
  });

  const event = existing
    ? await prisma.event.update({
        where: { id: existing.id },
        data: {
          description: data.description,
          address: data.address,
          timeStart: data.timeStart,
          timeEnd: data.timeEnd,
        },
      })
    : await prisma.event.create({
        data: {
          creatorId: data.creatorId,
          title: data.title,
          description: data.description,
          address: data.address,
          timeStart: data.timeStart,
          timeEnd: data.timeEnd,
        },
      });

  count('events', !existing);

  const confirmed = new Set(data.confirmedIds ?? []);
  let maxNumber =
    (
      await prisma.eventParticipant.aggregate({
        where: { eventId: event.id },
        _max: { participantNumber: true },
      })
    )._max.participantNumber ?? 0;

  for (const userId of [...new Set(data.participantIds)]) {
    const existingParticipant = await prisma.eventParticipant.findUnique({
      where: { userId_eventId: { userId, eventId: event.id } },
    });

    await prisma.eventParticipant.upsert({
      where: { userId_eventId: { userId, eventId: event.id } },
      update: { confirmed: confirmed.has(userId) },
      create: {
        userId,
        eventId: event.id,
        participantNumber:
          existingParticipant?.participantNumber ?? ++maxNumber,
        confirmed: confirmed.has(userId),
      },
    });
  }

  return event;
}

async function createPollIfNotExists(data: {
  creatorId: string;
  title: string;
  description: string;
  options: string[];
  allowVoteChange: boolean;
  participantIds: string[];
  votes?: Record<string, string>;
}) {
  const existing = await prisma.poll.findFirst({
    where: { creatorId: data.creatorId, title: data.title, deletedAt: null },
  });

  const poll = existing
    ? await prisma.poll.update({
        where: { id: existing.id },
        data: {
          description: data.description,
          allowVoteChange: data.allowVoteChange,
        },
      })
    : await prisma.poll.create({
        data: {
          creatorId: data.creatorId,
          title: data.title,
          description: data.description,
          allowVoteChange: data.allowVoteChange,
        },
      });

  count('polls', !existing);

  for (const value of data.options) {
    await prisma.pollOption.upsert({
      where: { pollId_value: { pollId: poll.id, value } },
      update: { deletedAt: null },
      create: { pollId: poll.id, value },
    });
  }

  await prisma.pollOption.updateMany({
    where: { pollId: poll.id },
    data: { chosen: 0 },
  });

  const options = await prisma.pollOption.findMany({
    where: { pollId: poll.id },
  });
  const optionByValue = new Map(
    options.map((option) => [option.value, option]),
  );

  for (const userId of [...new Set(data.participantIds)]) {
    const voteValue = data.votes?.[userId];
    const option = voteValue ? optionByValue.get(voteValue) : null;
    await prisma.pollParticipant.upsert({
      where: { userId_pollId: { userId, pollId: poll.id } },
      update: {
        done: !!option,
        chosenOptionId: option?.id ?? null,
      },
      create: {
        userId,
        pollId: poll.id,
        done: !!option,
        chosenOptionId: option?.id ?? null,
      },
    });
  }

  const chosenCounts = await prisma.pollParticipant.groupBy({
    by: ['chosenOptionId'],
    where: { pollId: poll.id, done: true, chosenOptionId: { not: null } },
    _count: { chosenOptionId: true },
  });

  for (const row of chosenCounts) {
    if (!row.chosenOptionId) continue;
    await prisma.pollOption.update({
      where: { id: row.chosenOptionId },
      data: { chosen: row._count.chosenOptionId },
    });
  }

  return poll;
}

async function createNotificationIfNotExists(data: {
  type: string;
  title: string;
  body: string;
  actorId?: string;
  entityType: 'ROOM' | 'TOPIC' | 'MESSAGE' | 'TASK' | 'EVENT' | 'POLL';
  entityId: string;
  recipients: Array<{ userId: string; read?: boolean; hidden?: boolean }>;
}) {
  const existing = await prisma.notification.findFirst({
    where: {
      type: data.type,
      entityType: data.entityType,
      entityId: data.entityId,
      title: data.title,
    },
  });

  const notification = existing
    ? await prisma.notification.update({
        where: { id: existing.id },
        data: { body: data.body, actorId: data.actorId ?? null },
      })
    : await prisma.notification.create({
        data: {
          type: data.type,
          title: data.title,
          body: data.body,
          actorId: data.actorId ?? null,
          entityType: data.entityType,
          entityId: data.entityId,
        },
      });

  count('notifications', !existing);

  for (const recipient of data.recipients) {
    await prisma.notificationRecipient.upsert({
      where: {
        notificationId_userId: {
          notificationId: notification.id,
          userId: recipient.userId,
        },
      },
      update: {
        deliveredAt: new Date(),
        readAt: recipient.read ? new Date() : null,
        isHidden: recipient.hidden ?? false,
      },
      create: {
        notificationId: notification.id,
        userId: recipient.userId,
        deliveredAt: new Date(),
        readAt: recipient.read ? new Date() : null,
        isHidden: recipient.hidden ?? false,
      },
    });
  }

  return notification;
}

async function main() {
  const globalPermissions = [
    {
      code: 'admin.panel.access',
      module: 'admin',
      description: 'Access admin panel',
    },
    { code: 'rbac.roles.manage', module: 'rbac', description: 'Manage roles' },
    {
      code: 'rbac.permissions.manage',
      module: 'rbac',
      description: 'Manage permissions',
    },
    {
      code: 'rbac.user_roles.manage',
      module: 'rbac',
      description: 'Manage user roles',
    },
    { code: 'users.read', module: 'users', description: 'Read and list users' },
    {
      code: 'users.create',
      module: 'users',
      description: 'Create users and process registrations',
    },
    { code: 'users.manage', module: 'users', description: 'Manage users' },
    { code: 'users.delete', module: 'users', description: 'Delete users' },
    {
      code: 'users.password.reset',
      module: 'users',
      description: 'Reset user passwords',
    },
    {
      code: 'org.manage',
      module: 'org',
      description: 'Manage organization structure',
    },
    { code: 'room.create', module: 'rooms', description: 'Create rooms' },
    {
      code: 'room.manage',
      module: 'rooms',
      description: 'Manage rooms globally',
    },
    {
      code: 'room.update',
      module: 'rooms',
      description: 'Update room metadata',
    },
    { code: 'room.delete', module: 'rooms', description: 'Delete rooms' },
    {
      code: 'room.members.manage',
      module: 'rooms',
      description: 'Manage room members',
    },
    {
      code: 'room.topics.manage',
      module: 'rooms',
      description: 'Manage room topics',
    },
    {
      code: 'room.topic.visibility.manage',
      module: 'rooms',
      description: 'Manage topic visibility',
    },
    {
      code: 'room.message.bin',
      module: 'rooms',
      description: 'Pin or unpin messages',
    },
    { code: 'task.create', module: 'tasks', description: 'Create tasks' },
    {
      code: 'task.participants.view',
      module: 'tasks',
      description: 'View task participants and results',
    },
    { code: 'task.delete', module: 'tasks', description: 'Delete tasks' },
    { code: 'event.create', module: 'events', description: 'Create events' },
    { code: 'event.delete', module: 'events', description: 'Delete events' },
    { code: 'poll.create', module: 'polls', description: 'Create polls' },
  ];

  for (const permission of globalPermissions) {
    await upsertPermission(
      permission.code,
      permission.module,
      permission.description,
    );
  }

  const roomPermissions = [
    { code: 'room.topic.create', description: 'Create topics in room' },
    { code: 'room.message.create', description: 'Create messages in room' },
    { code: 'room.message.delete', description: 'Delete messages in room' },
    { code: 'room.member.invite', description: 'Invite users to room' },
    { code: 'room.member.kick', description: 'Remove users from room' },
    { code: 'room.settings.manage', description: 'Manage room settings' },
    { code: 'room.update', description: 'Update room metadata' },
    { code: 'room.delete', description: 'Delete room' },
    { code: 'room.members.manage', description: 'Manage room members' },
    {
      code: 'room.topics.manage',
      description: 'Create, update and delete topics',
    },
    {
      code: 'room.topic.visibility.manage',
      description: 'Manage topic visibility',
    },
    { code: 'room.message.bin', description: 'Pin or unpin messages' },
  ];

  for (const permission of roomPermissions) {
    await upsertRoomPermission(permission.code, permission.description);
  }

  const allPermissionCodes = globalPermissions.map(
    (permission) => permission.code,
  );
  const adminRole = await upsertRole(
    'Администратор системы',
    'Полный доступ к административным функциям',
    allPermissionCodes,
  );
  const officeRole = await upsertRole(
    'Учебный отдел',
    'Управление событиями, опросами и организационной структурой',
    [
      'admin.panel.access',
      'users.read',
      'org.manage',
      'event.create',
      'event.delete',
      'poll.create',
      'task.participants.view',
    ],
  );
  const teacherRole = await upsertRole(
    'Преподаватель',
    'Создание комнат, задач и учебных коммуникаций',
    [
      'users.read',
      'room.create',
      'task.create',
      'task.participants.view',
      'poll.create',
      'event.create',
    ],
  );
  const studentRole = await upsertRole(
    'Студент',
    'Базовый пользователь системы',
    [],
  );

  const ownerRoomRole = await upsertRoomRole(
    'owner',
    'Владелец комнаты',
    roomPermissions.map((permission) => permission.code),
  );
  const adminRoomRole = await upsertRoomRole('admin', 'Администратор комнаты', [
    'room.topic.create',
    'room.message.create',
    'room.member.invite',
    'room.member.kick',
    'room.settings.manage',
    'room.update',
    'room.members.manage',
    'room.topics.manage',
    'room.topic.visibility.manage',
    'room.message.bin',
  ]);
  await upsertRoomRole('moderator', 'Модератор комнаты', [
    'room.topic.create',
    'room.message.create',
    'room.message.delete',
    'room.topics.manage',
    'room.message.bin',
  ]);
  const memberRoomRole = await upsertRoomRole('member', 'Участник комнаты', [
    'room.message.create',
  ]);

  const university = await upsertOrgUnit(
    'Университет цифровых технологий',
    null,
    'Тестовая образовательная организация',
  );
  const faculty = await upsertOrgUnit(
    'Факультет информационных технологий',
    university.id,
    'Факультет для тестирования учебных сценариев',
  );
  const isDepartment = await upsertOrgUnit(
    'Кафедра информационных систем',
    faculty.id,
    'Кафедра информационных систем',
  );
  const seDepartment = await upsertOrgUnit(
    'Кафедра программной инженерии',
    faculty.id,
    'Кафедра программной инженерии',
  );
  const officeUnit = await upsertOrgUnit(
    'Учебный отдел',
    university.id,
    'Подразделение сопровождения учебного процесса',
  );
  const is21 = await upsertOrgUnit(
    'ИС-21',
    isDepartment.id,
    'Учебная группа информационных систем',
  );
  const is22 = await upsertOrgUnit(
    'ИС-22',
    isDepartment.id,
    'Учебная группа информационных систем',
  );
  const pi21 = await upsertOrgUnit(
    'ПИ-21',
    seDepartment.id,
    'Учебная группа программной инженерии',
  );

  const studentsTag = await upsertTag('Студенты');
  const teachersTag = await upsertTag('Преподаватели');
  const groupsTag = await upsertTag('Учебные группы');
  const adminTag = await upsertTag('Администрация');

  await Promise.all([
    assignTag(is21.id, studentsTag.id),
    assignTag(is22.id, studentsTag.id),
    assignTag(pi21.id, studentsTag.id),
    assignTag(is21.id, groupsTag.id),
    assignTag(is22.id, groupsTag.id),
    assignTag(pi21.id, groupsTag.id),
    assignTag(isDepartment.id, teachersTag.id),
    assignTag(seDepartment.id, teachersTag.id),
    assignTag(officeUnit.id, adminTag.id),
    assignTag(university.id, adminTag.id),
  ]);

  const adminPosition = await upsertPosition(
    'Администратор',
    'Администратор системы',
  );
  const officePosition = await upsertPosition(
    'Сотрудник учебного отдела',
    'Сотрудник, сопровождающий учебный процесс',
  );
  const teacherPosition = await upsertPosition(
    'Преподаватель',
    'Преподаватель учебной дисциплины',
  );
  const headmanPosition = await upsertPosition(
    'Староста',
    'Представитель учебной группы',
  );
  const studentPosition = await upsertPosition(
    'Студент',
    'Обучающийся учебной группы',
  );

  await Promise.all([
    assignRoleToPosition(adminPosition.id, adminRole.id),
    assignRoleToPosition(officePosition.id, officeRole.id),
    assignRoleToPosition(teacherPosition.id, teacherRole.id),
    assignRoleToPosition(studentPosition.id, studentRole.id),
    assignRoleToPosition(headmanPosition.id, studentRole.id),
  ]);

  const users = {
    admin: await upsertUser({
      email: 'admin@test.local',
      firstName: 'Администратор',
      lastName: 'Системы',
    }),
    office: await upsertUser({
      email: 'office@test.local',
      firstName: 'Марина',
      secondName: 'Викторовна',
      lastName: 'Орлова',
    }),
    teacherPetrov: await upsertUser({
      email: 'teacher.petrov@test.local',
      firstName: 'Алексей',
      secondName: 'Игоревич',
      lastName: 'Петров',
    }),
    teacherSmirnova: await upsertUser({
      email: 'teacher.smirnova@test.local',
      firstName: 'Елена',
      secondName: 'Андреевна',
      lastName: 'Смирнова',
    }),
    is21Ivanov: await upsertUser({
      email: 'is21.ivanov@test.local',
      firstName: 'Иван',
      lastName: 'Иванов',
    }),
    is21Sokolova: await upsertUser({
      email: 'is21.sokolova@test.local',
      firstName: 'Анна',
      lastName: 'Соколова',
    }),
    is21Karimov: await upsertUser({
      email: 'is21.karimov@test.local',
      firstName: 'Тимур',
      lastName: 'Каримов',
    }),
    is22Orlova: await upsertUser({
      email: 'is22.orlova@test.local',
      firstName: 'Ольга',
      lastName: 'Орлова',
    }),
    is22Morozov: await upsertUser({
      email: 'is22.morozov@test.local',
      firstName: 'Дмитрий',
      lastName: 'Морозов',
    }),
    is22Nikitin: await upsertUser({
      email: 'is22.nikitin@test.local',
      firstName: 'Сергей',
      lastName: 'Никитин',
    }),
    pi21Volkov: await upsertUser({
      email: 'pi21.volkov@test.local',
      firstName: 'Андрей',
      lastName: 'Волков',
    }),
    pi21Fedorova: await upsertUser({
      email: 'pi21.fedorova@test.local',
      firstName: 'Мария',
      lastName: 'Фёдорова',
    }),
    pi21Ahmed: await upsertUser({
      email: 'pi21.ahmed@test.local',
      firstName: 'Амир',
      lastName: 'Ахмед',
    }),
  };

  await Promise.all([
    assignRoleToUser(users.admin.id, adminRole.id),
    assignRoleToUser(users.office.id, officeRole.id),
    assignRoleToUser(users.teacherPetrov.id, teacherRole.id),
    assignRoleToUser(users.teacherSmirnova.id, teacherRole.id),
    assignRoleToUser(users.is21Ivanov.id, studentRole.id),
    assignRoleToUser(users.is21Sokolova.id, studentRole.id),
    assignRoleToUser(users.is21Karimov.id, studentRole.id),
    assignRoleToUser(users.is22Orlova.id, studentRole.id),
    assignRoleToUser(users.is22Morozov.id, studentRole.id),
    assignRoleToUser(users.is22Nikitin.id, studentRole.id),
    assignRoleToUser(users.pi21Volkov.id, studentRole.id),
    assignRoleToUser(users.pi21Fedorova.id, studentRole.id),
    assignRoleToUser(users.pi21Ahmed.id, studentRole.id),
  ]);

  await Promise.all([
    connectUserToOrgUnit(users.admin.id, university.id, adminPosition.id),
    connectUserToOrgUnit(users.office.id, officeUnit.id, officePosition.id),
    connectUserToOrgUnit(
      users.teacherPetrov.id,
      isDepartment.id,
      teacherPosition.id,
    ),
    connectUserToOrgUnit(
      users.teacherSmirnova.id,
      seDepartment.id,
      teacherPosition.id,
    ),
    connectUserToOrgUnit(users.is21Ivanov.id, is21.id, headmanPosition.id),
    connectUserToOrgUnit(users.is21Sokolova.id, is21.id, studentPosition.id),
    connectUserToOrgUnit(users.is21Karimov.id, is21.id, studentPosition.id),
    connectUserToOrgUnit(users.is22Orlova.id, is22.id, headmanPosition.id),
    connectUserToOrgUnit(users.is22Morozov.id, is22.id, studentPosition.id),
    connectUserToOrgUnit(users.is22Nikitin.id, is22.id, studentPosition.id),
    connectUserToOrgUnit(users.pi21Volkov.id, pi21.id, headmanPosition.id),
    connectUserToOrgUnit(users.pi21Fedorova.id, pi21.id, studentPosition.id),
    connectUserToOrgUnit(users.pi21Ahmed.id, pi21.id, studentPosition.id),
  ]);

  const is21Users = await resolveUsersByOrgUnits([is21.id]);
  const is22Users = await resolveUsersByOrgUnits([is22.id]);
  const pi21Users = await resolveUsersByOrgUnits([pi21.id]);
  const teacherUsers = [users.teacherPetrov.id, users.teacherSmirnova.id];
  const allStudentUsers = [
    ...new Set([...is21Users, ...is22Users, ...pi21Users]),
  ];
  const allRoomMembers = [...new Set([...allStudentUsers, ...teacherUsers])];

  const pisRoom = await upsertRoom({
    title: 'ПИС',
    description: 'Комната дисциплины «Проектирование информационных систем»',
    creatorId: users.teacherPetrov.id,
    memberIds: allRoomMembers,
    ownerRoleId: ownerRoomRole.id,
    memberRoleId: memberRoomRole.id,
  });

  await prisma.userRoomMembership.upsert({
    where: {
      userId_roomId: { userId: users.teacherSmirnova.id, roomId: pisRoom.id },
    },
    update: { roomRoleId: adminRoomRole.id },
    create: {
      userId: users.teacherSmirnova.id,
      roomId: pisRoom.id,
      roomRoleId: adminRoomRole.id,
    },
  });

  const topicGeneral = await upsertTopic({
    roomId: pisRoom.id,
    creatorId: users.teacherPetrov.id,
    title: 'Общие объявления',
    description: 'Общие объявления по дисциплине',
    scopeType: 'ALL_MEMBERS',
  });
  await upsertTopic({
    roomId: pisRoom.id,
    creatorId: users.teacherPetrov.id,
    title: 'Группа ИС-21',
    description: 'Обсуждение для группы ИС-21',
    scopeType: 'INCLUDE_MEMBERS',
    memberIds: [...is21Users, ...teacherUsers],
  });
  await upsertTopic({
    roomId: pisRoom.id,
    creatorId: users.teacherPetrov.id,
    title: 'Группа ИС-22',
    description: 'Обсуждение для группы ИС-22',
    scopeType: 'INCLUDE_MEMBERS',
    memberIds: [...is22Users, ...teacherUsers],
  });
  await upsertTopic({
    roomId: pisRoom.id,
    creatorId: users.teacherPetrov.id,
    title: 'Группа ПИ-21',
    description: 'Обсуждение для группы ПИ-21',
    scopeType: 'INCLUDE_MEMBERS',
    memberIds: [...pi21Users, ...teacherUsers],
  });
  await upsertTopic({
    roomId: pisRoom.id,
    creatorId: users.teacherPetrov.id,
    title: 'Обсуждение преподавателей',
    description: 'Закрытое обсуждение преподавателей',
    scopeType: 'INCLUDE_MEMBERS',
    memberIds: teacherUsers,
  });

  const announcement = await createMessageIfNotExists({
    topicId: topicGeneral.id,
    authorId: users.teacherPetrov.id,
    content:
      'Добрый день! В этой комнате будут публиковаться объявления по дисциплине «Проектирование информационных систем».',
  });

  const pinned = await createMessageIfNotExists({
    topicId: topicGeneral.id,
    authorId: users.teacherPetrov.id,
    content: 'Срок сдачи лабораторной работы №1 — до пятницы 18:00.',
    isPinned: true,
  });

  const studentReply = await createMessageIfNotExists({
    topicId: topicGeneral.id,
    authorId: users.is21Ivanov.id,
    parentId: announcement.id,
    level: 1,
    content:
      'Подскажите, пожалуйста, отчёт нужно загружать в систему или отправлять преподавателю?',
  });

  await createMessageIfNotExists({
    topicId: topicGeneral.id,
    authorId: users.teacherPetrov.id,
    parentId: studentReply.id,
    level: 2,
    content: 'Отчёт необходимо прикрепить к задаче в системе.',
  });

  const task1 = await createTaskIfNotExists({
    creatorId: users.teacherPetrov.id,
    title: 'Лабораторная работа №1: анализ требований',
    description:
      'Подготовить краткое описание предметной области и перечень функциональных требований.',
    dueDate: dateOnlyFromNow(7),
    participantIds: is21Users,
    states: {
      [users.is21Ivanov.id]: { workStatus: 'IN_PROGRESS' },
      [users.is21Sokolova.id]: {
        workStatus: 'SUBMITTED',
        submittedAt: daysFromNow(1, 14, 30),
      },
      [users.is21Karimov.id]: {
        workStatus: 'SUBMITTED',
        reviewStatus: 'APPROVED',
        rating: 5,
        submittedAt: daysFromNow(1, 15, 0),
      },
    },
  });
  const task2 = await createTaskIfNotExists({
    creatorId: users.teacherPetrov.id,
    title: 'Лабораторная работа №1: построение ER-диаграммы',
    description:
      'Построить ER-диаграмму для выбранного фрагмента информационной системы.',
    dueDate: dateOnlyFromNow(9),
    participantIds: is22Users,
    states: {
      [users.is22Orlova.id]: { workStatus: 'ACCEPTED' },
      [users.is22Morozov.id]: { workStatus: 'IN_PROGRESS' },
    },
  });
  const task3 = await createTaskIfNotExists({
    creatorId: users.teacherPetrov.id,
    title: 'Практическое задание: описание пользовательских сценариев',
    description:
      'Описать основные пользовательские сценарии для проектируемой системы.',
    dueDate: dateOnlyFromNow(11),
    participantIds: pi21Users,
    states: {
      [users.pi21Volkov.id]: { workStatus: 'ACCEPTED' },
    },
  });
  const task4 = await createTaskIfNotExists({
    creatorId: users.teacherPetrov.id,
    title: 'Подготовить вопросы к консультации',
    description:
      'Сформировать список вопросов по лабораторной работе и отправить результат на проверку.',
    dueDate: dateOnlyFromNow(4),
    participantIds: [users.is21Ivanov.id],
    states: {
      [users.is21Ivanov.id]: { workStatus: 'IN_PROGRESS' },
    },
  });

  const event1 = await createEventIfNotExists({
    creatorId: users.office.id,
    title: 'Методический семинар для преподавателей',
    description:
      'Обсуждение организации учебного процесса и цифровых инструментов взаимодействия.',
    address: 'Аудитория 301',
    timeStart: daysFromNow(6, 11, 0),
    timeEnd: daysFromNow(6, 13, 0),
    participantIds: teacherUsers,
    confirmedIds: [users.teacherPetrov.id],
  });
  const event2 = await createEventIfNotExists({
    creatorId: users.teacherPetrov.id,
    title: 'Консультация по дисциплине “Проектирование информационных систем”',
    description:
      'Консультация по лабораторным работам и вопросам проектирования системы.',
    address: 'Аудитория 215',
    timeStart: daysFromNow(3, 15, 0),
    timeEnd: daysFromNow(3, 16, 30),
    participantIds: allStudentUsers,
    confirmedIds: [users.is21Ivanov.id, users.is22Orlova.id],
  });

  const poll1 = await createPollIfNotExists({
    creatorId: users.teacherPetrov.id,
    title: 'Выбор времени консультации',
    description: 'Выберите удобное время для общей консультации по дисциплине.',
    options: ['10:00', '12:00', '15:00'],
    allowVoteChange: false,
    participantIds: allStudentUsers,
    votes: {
      [users.is21Ivanov.id]: '12:00',
      [users.is21Sokolova.id]: '12:00',
      [users.is22Orlova.id]: '15:00',
      [users.pi21Volkov.id]: '10:00',
    },
  });

  const poll2 = await createPollIfNotExists({
    creatorId: users.office.id,
    title: 'Оценка удобства цифровой коммуникационной среды',
    description:
      'Оцените удобство использования единой коммуникационной среды.',
    options: ['Удобно', 'Скорее удобно', 'Нужно доработать', 'Неудобно'],
    allowVoteChange: true,
    participantIds: allStudentUsers,
    votes: {
      [users.is21Ivanov.id]: 'Удобно',
      [users.is21Sokolova.id]: 'Скорее удобно',
      [users.is22Morozov.id]: 'Скорее удобно',
      [users.pi21Fedorova.id]: 'Нужно доработать',
    },
  });

  await createNotificationIfNotExists({
    type: 'ROOM_INVITATION',
    title: 'Вы добавлены в комнату',
    body: 'Вы добавлены в комнату дисциплины «Проектирование информационных систем».',
    actorId: users.teacherPetrov.id,
    entityType: 'ROOM',
    entityId: pisRoom.id,
    recipients: [
      { userId: users.is21Ivanov.id },
      { userId: users.is21Sokolova.id, read: true },
      { userId: users.is22Orlova.id },
    ],
  });
  await createNotificationIfNotExists({
    type: 'TASK_ASSIGNED',
    title: 'Назначена задача',
    body: 'Вам назначена задача «Лабораторная работа №1: анализ требований».',
    actorId: users.teacherPetrov.id,
    entityType: 'TASK',
    entityId: task1.id,
    recipients: [
      { userId: users.is21Ivanov.id },
      { userId: users.is21Sokolova.id, read: true },
      { userId: users.is21Karimov.id },
    ],
  });
  await createNotificationIfNotExists({
    type: 'TASK_REVIEWED',
    title: 'Результат задачи проверен',
    body: 'Результат выполнения задачи проверен преподавателем.',
    actorId: users.teacherPetrov.id,
    entityType: 'TASK',
    entityId: task1.id,
    recipients: [{ userId: users.is21Karimov.id, read: true }],
  });
  await createNotificationIfNotExists({
    type: 'EVENT_INVITATION',
    title: 'Приглашение на событие',
    body: 'Вы приглашены на консультацию по дисциплине.',
    actorId: users.teacherPetrov.id,
    entityType: 'EVENT',
    entityId: event2.id,
    recipients: [
      { userId: users.is21Ivanov.id },
      { userId: users.is22Orlova.id, read: true },
      { userId: users.pi21Volkov.id },
    ],
  });
  await createNotificationIfNotExists({
    type: 'POLL_INVITATION',
    title: 'Приглашение к опросу',
    body: 'Вы приглашены пройти опрос о времени консультации.',
    actorId: users.teacherPetrov.id,
    entityType: 'POLL',
    entityId: poll1.id,
    recipients: [
      { userId: users.is21Ivanov.id },
      { userId: users.is21Sokolova.id, read: true },
      { userId: users.pi21Ahmed.id },
    ],
  });

  console.log('\nSeed data complete.');
  console.log('Summary:');
  for (const [name, value] of Object.entries(summary)) {
    console.log(`- ${name}: created ${value.created}, reused ${value.reused}`);
  }

  console.log('\nTest login credentials:');
  console.log(`Password for all test users: ${TEST_PASSWORD}`);
  [
    'admin@test.local',
    'office@test.local',
    'teacher.petrov@test.local',
    'teacher.smirnova@test.local',
    'is21.ivanov@test.local',
    'is21.sokolova@test.local',
    'is21.karimov@test.local',
    'is22.orlova@test.local',
    'is22.morozov@test.local',
    'is22.nikitin@test.local',
    'pi21.volkov@test.local',
    'pi21.fedorova@test.local',
    'pi21.ahmed@test.local',
  ].forEach((email) => console.log(`- ${email}`));

  console.log('\nCreated / reused key objects:');
  console.log(`- Organization root: ${university.name}`);
  console.log(`- Room: ${pisRoom.title}`);
  console.log(`- Pinned message id: ${pinned.id}`);
  console.log(
    `- Tasks: ${[task1.title, task2.title, task3.title, task4.title].join('; ')}`,
  );
  console.log(`- Events: ${[event1.title, event2.title].join('; ')}`);
  console.log(`- Polls: ${[poll1.title, poll2.title].join('; ')}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
