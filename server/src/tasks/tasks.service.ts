import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TaskWorkStatus, TaskReviewStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrgUnitsService } from '../org-units/org-units.service';
import { RbacService } from '../rbac/rbac.service';
import { NotificationsService } from '../notifications/notifications.service';

// ─── Shared select fragments ───────────────────────────────────────────────────

const TASK_USER_SELECT = {
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
  taskId: true,
  workStatus: true,
  reviewStatus: true,
  rating: true,
  submittedAt: true,
  user: { select: TASK_USER_SELECT },
} as const;

const TASK_FULL_SELECT = {
  id: true,
  creatorId: true,
  title: true,
  description: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  creator: { select: TASK_USER_SELECT },
  participants: { select: PARTICIPANT_SELECT },
} as const;

const isSubmittedLate = (dueDate?: Date | null, submittedAt?: Date | null) => {
  if (!dueDate || !submittedAt) return false;

  const dueEnd = new Date(dueDate);
  dueEnd.setHours(23, 59, 59, 999);
  return submittedAt.getTime() > dueEnd.getTime();
};

const attachLateFlags = <T extends { dueDate?: Date | null; participants: any[] }>(task: T) => ({
  ...task,
  participants: task.participants.map((participant) => ({
    ...participant,
    isLate: isSubmittedLate(task.dueDate, participant.submittedAt),
  })),
});

// Allowed work-status transitions
const WORK_STATUS_TRANSITIONS: Record<TaskWorkStatus, TaskWorkStatus[]> = {
  PENDING:     ['ACCEPTED', 'DECLINED'],
  ACCEPTED:    ['IN_PROGRESS'],
  IN_PROGRESS: ['SUBMITTED'],
  SUBMITTED:   [],
  DECLINED:    [],
};

// Allowed review-status transitions
const REVIEW_STATUS_TRANSITIONS: Record<TaskReviewStatus, TaskReviewStatus[]> = {
  PENDING:  ['APPROVED', 'REJECTED'],
  APPROVED: ['REJECTED'],
  REJECTED: ['APPROVED'],
};

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly org: OrgUnitsService,
    private readonly rbac: RbacService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── GET /tasks/my ────────────────────────────────────────

  async listMyTasks(
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

    const tasks = await this.prisma.task.findMany({
      where,
      select: {
        id: true,
        creatorId: true,
        title: true,
        description: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        creator: { select: TASK_USER_SELECT },
        _count: { select: { participants: true } },
        participants: {
          where: { userId },
          select: PARTICIPANT_SELECT,
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return tasks.map(({ _count, participants, ...task }) => {
      const withLateFlags = attachLateFlags({ ...task, participants });
      const { participants: _participants, ...summary } = withLateFlags;
      return {
        ...summary,
        participantCount: _count.participants,
        myParticipation: withLateFlags.participants[0] ?? null,
      };
    });
  }

  // ─── GET /tasks/created ───────────────────────────────────

  async listCreatedTasks(
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

    const tasks = await this.prisma.task.findMany({
      where,
      select: {
        id: true,
        creatorId: true,
        title: true,
        description: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        creator: { select: TASK_USER_SELECT },
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return tasks.map(({ _count, ...task }) => ({
      ...task,
      participantCount: _count.participants,
      myParticipation: null,
    }));
  }

  // ─── GET /tasks/:taskId ───────────────────────────────────

  async getTask(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { ...TASK_FULL_SELECT, deletedAt: true },
    });

    if (!task || task.deletedAt) throw new NotFoundException('Task not found');

    const isOwner = task.creatorId === userId;
    const isParticipant = task.participants.some((p) => p.userId === userId);
    const canViewParticipants =
      isOwner || (await this.rbac.userHasPermission(userId, 'task.participants.view'));

    if (!isOwner && !isParticipant && !canViewParticipants) {
      throw new ForbiddenException('Access denied');
    }

    const { deletedAt: _, participants, ...result } = task;
    const visibleParticipants = canViewParticipants
      ? participants
      : participants.filter((participant) => participant.userId === userId);

    return attachLateFlags({
      ...result,
      canViewParticipants,
      participants: visibleParticipants,
    });
  }

  // ─── POST /tasks ──────────────────────────────────────────

  async createTask(
    creatorId: string,
    data: { title: string; description: string; dueDate?: string | null },
  ) {
    return this.prisma.task.create({
      data: {
        creatorId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      select: TASK_FULL_SELECT,
    });
  }

  // ─── PATCH /tasks/:taskId ─────────────────────────────────

  async updateTask(
    taskId: string,
    userId: string,
    data: { title?: string; description?: string; dueDate?: string | null },
  ) {
    await this.assertTaskOwner(taskId, userId);

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if ('dueDate' in data) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: updateData,
      select: TASK_FULL_SELECT,
    });
  }

  // ─── DELETE /tasks/:taskId ────────────────────────────────

  async deleteTask(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, creatorId: true, deletedAt: true },
    });
    if (!task || task.deletedAt) throw new NotFoundException('Task not found');

    const isOwner = task.creatorId === userId;
    if (!isOwner) {
      const hasPermission = await this.rbac.userHasPermission(userId, 'task.delete');
      if (!hasPermission) throw new ForbiddenException('Access denied');
    }

    await this.prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    });
  }

  // ─── POST /tasks/:taskId/participants ─────────────────────

  async addParticipants(
    taskId: string,
    userId: string,
    params: {
      userIds?: string[];
      orgUnitIds?: string[];
      orgUnitTagIds?: string[];
      includeSubUnits?: boolean;
    },
  ) {
    const task = await this.assertTaskOwner(taskId, userId);

    const resolvedIds = await this.org.resolveByOrgIds({
      userIds: params.userIds,
      orgUnitIds: params.orgUnitIds,
      orgUnitTagIds: params.orgUnitTagIds,
      includeSubUnits: params.includeSubUnits ?? false,
    });

    if (resolvedIds.length === 0) return [];

    const existing = await this.prisma.taskParticipant.findMany({
      where: { taskId, userId: { in: resolvedIds } },
      select: { userId: true },
    });
    const existingIds = new Set(existing.map((p) => p.userId));
    const toAdd = resolvedIds.filter((id) => !existingIds.has(id));

    if (toAdd.length === 0) return [];

    await this.prisma.taskParticipant.createMany({
      data: toAdd.map((uid) => ({
        userId: uid,
        taskId,
        workStatus: 'PENDING' as TaskWorkStatus,
        reviewStatus: 'PENDING' as TaskReviewStatus,
      })),
    });

    const taskDetails = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { title: true },
    });

    this.notifications.create({
      type: 'TASK_ASSIGNED',
      title: 'You were assigned a task',
      body: `You have been assigned to task "${taskDetails!.title}"`,
      actorId: userId,
      entityType: 'TASK',
      entityId: taskId,
      recipientIds: toAdd,
    }).catch(() => {});

    return this.prisma.taskParticipant.findMany({
      where: { taskId, userId: { in: toAdd } },
      select: PARTICIPANT_SELECT,
    });
  }

  // ─── DELETE /tasks/:taskId/participants/:userId ───────────

  async removeParticipant(taskId: string, userId: string, targetUserId: string) {
    await this.assertTaskOwner(taskId, userId);

    const existing = await this.prisma.taskParticipant.findUnique({
      where: { userId_taskId: { userId: targetUserId, taskId } },
    });
    if (!existing) throw new NotFoundException('Participant not found');

    await this.prisma.taskParticipant.delete({
      where: { userId_taskId: { userId: targetUserId, taskId } },
    });
  }

  // ─── PATCH …/participants/:userId/work-status ─────────────

  async updateWorkStatus(
    taskId: string,
    currentUserId: string,
    targetUserId: string,
    newStatus: TaskWorkStatus,
  ) {
    if (currentUserId !== targetUserId) {
      throw new ForbiddenException('You can only update your own work status');
    }

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, deletedAt: true },
    });
    if (!task || task.deletedAt) throw new NotFoundException('Task not found');

    const p = await this.prisma.taskParticipant.findUnique({
      where: { userId_taskId: { userId: targetUserId, taskId } },
    });
    if (!p) throw new NotFoundException('Participant not found');

    const allowed = WORK_STATUS_TRANSITIONS[p.workStatus];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition work status from ${p.workStatus} to ${newStatus}`,
      );
    }

    const updated = await this.prisma.taskParticipant.update({
      where: { userId_taskId: { userId: targetUserId, taskId } },
      data: {
        workStatus: newStatus,
        submittedAt: newStatus === 'SUBMITTED' ? new Date() : undefined,
      },
      select: PARTICIPANT_SELECT,
    });

    if (newStatus === 'SUBMITTED') {
      const taskDetails = await this.prisma.task.findUnique({
        where: { id: taskId },
        select: { title: true, creatorId: true, dueDate: true },
      });
      const late = isSubmittedLate(taskDetails!.dueDate, updated.submittedAt);
      this.notifications.create({
        type: 'TASK_SUBMITTED',
        title: late ? 'Task work submitted late' : 'Task work submitted',
        body: `A participant submitted their work ${late ? 'late ' : ''}on task "${taskDetails!.title}"`,
        actorId: targetUserId,
        entityType: 'TASK',
        entityId: taskId,
        recipientIds: [taskDetails!.creatorId],
      }).catch(() => {});
    }

    const taskDue = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { dueDate: true },
    });

    return {
      ...updated,
      isLate: isSubmittedLate(taskDue?.dueDate, updated.submittedAt),
    };
  }

  // ─── PATCH …/participants/:userId/review ──────────────────

  async reviewParticipant(
    taskId: string,
    currentUserId: string,
    targetUserId: string,
    reviewStatus: TaskReviewStatus,
    rating?: number | null,
  ) {
    await this.assertTaskOwner(taskId, currentUserId);

    const p = await this.prisma.taskParticipant.findUnique({
      where: { userId_taskId: { userId: targetUserId, taskId } },
    });
    if (!p) throw new NotFoundException('Participant not found');

    if (p.workStatus !== 'SUBMITTED') {
      throw new BadRequestException('Can only review submitted work');
    }

    const allowed = REVIEW_STATUS_TRANSITIONS[p.reviewStatus];
    if (!allowed.includes(reviewStatus)) {
      throw new BadRequestException(
        `Cannot transition review status from ${p.reviewStatus} to ${reviewStatus}`,
      );
    }

    if (rating !== undefined && rating !== null && (rating < 1 || rating > 10)) {
      throw new BadRequestException('Rating must be between 1 and 10');
    }

    const data: any = { reviewStatus };
    if (rating !== undefined) data.rating = rating;

    const result = await this.prisma.taskParticipant.update({
      where: { userId_taskId: { userId: targetUserId, taskId } },
      data,
      select: PARTICIPANT_SELECT,
    });

    const taskDetails = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { title: true },
    });

    this.notifications.create({
      type: 'TASK_REVIEWED',
      title: 'Your task work was reviewed',
      body: `Your work on task "${taskDetails!.title}" was ${reviewStatus.toLowerCase()}`,
      actorId: currentUserId,
      entityType: 'TASK',
      entityId: taskId,
      recipientIds: [targetUserId],
    }).catch(() => {});

    return result;
  }

  // ─── Private helpers ──────────────────────────────────────

  private async assertTaskOwner(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, creatorId: true, deletedAt: true },
    });
    if (!task || task.deletedAt) throw new NotFoundException('Task not found');
    if (task.creatorId !== userId) throw new ForbiddenException('Access denied');
    return task;
  }
}
