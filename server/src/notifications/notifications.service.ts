import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationEntityType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../gateway/chat.gateway';

const ACTOR_SELECT = {
  id: true,
  email: true,
  firstName: true,
  secondName: true,
  lastName: true,
  displayName: true,
  avatarUrl: true,
} as const;

const NOTIFICATION_SELECT = {
  id: true,
  type: true,
  title: true,
  body: true,
  actorId: true,
  entityType: true,
  entityId: true,
  createdAt: true,
  actor: { select: ACTOR_SELECT },
} as const;

const RECIPIENT_SELECT = {
  deliveredAt: true,
  readAt: true,
  isHidden: true,
  notification: { select: NOTIFICATION_SELECT },
} as const;

export interface CreateNotificationInput {
  type: string;
  title: string;
  body: string;
  actorId?: string;
  entityType: NotificationEntityType;
  entityId: string;
  recipientIds: string[];
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: ChatGateway,
  ) {}

  async list(
    userId: string,
    query: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      showHidden?: boolean;
    },
  ) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 50, 200);
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (!query.showHidden) where.isHidden = false;
    if (query.unreadOnly) where.readAt = null;

    const [recipients, total] = await Promise.all([
      this.prisma.notificationRecipient.findMany({
        where,
        orderBy: { notification: { createdAt: 'desc' } },
        skip,
        take: limit,
        select: RECIPIENT_SELECT,
      }),
      this.prisma.notificationRecipient.count({ where }),
    ]);

    return {
      items: recipients.map((r) => this.merge(r)),
      total,
      page,
      limit,
    };
  }

  async markRead(userId: string, notificationId: string) {
    const recipient = await this.prisma.notificationRecipient.findUnique({
      where: { notificationId_userId: { notificationId, userId } },
      select: { readAt: true },
    });
    if (!recipient) throw new NotFoundException('Notification not found');

    const updated = await this.prisma.notificationRecipient.update({
      where: { notificationId_userId: { notificationId, userId } },
      data: { readAt: recipient.readAt ?? new Date() },
      select: RECIPIENT_SELECT,
    });

    return this.merge(updated);
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notificationRecipient.updateMany({
      where: { userId, readAt: null, isHidden: false },
      data: { readAt: new Date() },
    });

    return { updatedCount: result.count };
  }

  async hide(userId: string, notificationId: string) {
    const recipient = await this.prisma.notificationRecipient.findUnique({
      where: { notificationId_userId: { notificationId, userId } },
      select: { isHidden: true },
    });
    if (!recipient) throw new NotFoundException('Notification not found');

    const updated = await this.prisma.notificationRecipient.update({
      where: { notificationId_userId: { notificationId, userId } },
      data: { isHidden: true },
      select: RECIPIENT_SELECT,
    });

    return this.merge(updated);
  }

  async create(input: CreateNotificationInput) {
    if (!input.recipientIds.length) return;

    const now = new Date();

    const notification = await this.prisma.notification.create({
      data: {
        type: input.type,
        title: input.title,
        body: input.body,
        actorId: input.actorId ?? null,
        entityType: input.entityType,
        entityId: input.entityId,
        recipients: {
          createMany: {
            data: input.recipientIds.map((userId) => ({
              userId,
              deliveredAt: now,
            })),
            skipDuplicates: true,
          },
        },
      },
    });

    const payload = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      actorId: notification.actorId,
      entityType: notification.entityType,
      entityId: notification.entityId,
      createdAt: notification.createdAt,
      deliveredAt: now,
      readAt: null,
      isHidden: false,
    };

    for (const userId of input.recipientIds) {
      this.gateway.emitToUser(userId, 'notification:new', payload);
    }
  }

  private merge(r: {
    deliveredAt: Date | null;
    readAt: Date | null;
    isHidden: boolean;
    notification: any;
  }) {
    const { notification, ...recipientState } = r;
    return { ...notification, ...recipientState };
  }
}
