import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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

const MESSAGE_SELECT = {
  id: true,
  topicId: true,
  authorId: true,
  parentId: true,
  content: true,
  level: true,
  isPinned: true,
  createdAt: true,
  updatedAt: true,
  author: { select: CHAT_USER_SELECT },
  readBy: { select: { userId: true } },
  _count: { select: { replies: { where: { deletedAt: null } } } },
} as const;

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: ChatGateway,
  ) {}

  private formatMessage(m: any) {
    const { _count, readBy, ...rest } = m;
    const readByCount = (readBy as { userId: string }[] ?? [])
      .filter((r) => r.userId !== m.authorId).length;
    return { ...rest, replyCount: _count?.replies ?? 0, readByCount };
  }

  // ─── List root messages for a topic ───────────────────────

  async listMessages(topicId: string) {
    await this.assertTopicExists(topicId);

    const messages = await this.prisma.message.findMany({
      where: { topicId, deletedAt: null, parentId: null, level: 0 },
      select: MESSAGE_SELECT,
      orderBy: { createdAt: 'asc' },
    });

    return messages.map((m) => this.formatMessage(m));
  }

  // ─── Get direct replies for a message ─────────────────────

  async listReplies(messageId: string) {
    const parent = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, deletedAt: true },
    });
    if (!parent) throw new NotFoundException('Message not found');

    const replies = await this.prisma.message.findMany({
      where: { parentId: messageId, deletedAt: null },
      select: MESSAGE_SELECT,
      orderBy: { createdAt: 'asc' },
    });

    return replies.map((m) => this.formatMessage(m));
  }

  // ─── Create a message ─────────────────────────────────────

  async createMessage(
    topicId: string,
    authorId: string,
    data: { content: string; parentId?: string },
  ) {
    await this.assertTopicExists(topicId);

    let level = 0;
    if (data.parentId) {
      const parent = await this.prisma.message.findUnique({
        where: { id: data.parentId },
        select: { id: true, topicId: true, level: true, deletedAt: true },
      });
      if (!parent || parent.deletedAt) {
        throw new NotFoundException('Parent message not found');
      }
      if (parent.topicId !== topicId) {
        throw new BadRequestException(
          'Parent message does not belong to this topic',
        );
      }
      level = parent.level + 1;
    }

    const message = await this.prisma.message.create({
      data: {
        topicId,
        authorId,
        parentId: data.parentId ?? null,
        content: data.content,
        level,
      },
      select: MESSAGE_SELECT,
    });

    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      select: {
        roomId: true,
        title: true,
        room: {
          select: { memberships: { select: { userId: true } } },
        },
      },
    });

    if (topic) {
      const payload = {
        ...this.formatMessage(message),
        topicId,
        roomId: topic.roomId,
      };

      // Real-time: broadcast new message to everyone in the room socket channel
      this.gateway.emitToRoom(topic.roomId, 'message:new', payload);

      const recipientIds = topic.room.memberships
        .map((m) => m.userId)
        .filter((id) => id !== authorId);

      recipientIds.forEach((userId) => {
        this.gateway.emitToUser(userId, 'message:new', payload);
      });
    }

    return this.formatMessage(message);
  }

  // ─── Pin / unpin ──────────────────────────────────────────

  async pinMessage(messageId: string, isPinned: boolean) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, topicId: true, deletedAt: true },
    });
    if (!message || message.deletedAt) {
      throw new NotFoundException('Message not found');
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: { isPinned },
      select: MESSAGE_SELECT,
    });

    const topic = await this.prisma.topic.findUnique({
      where: { id: message.topicId },
      select: { roomId: true },
    });
    if (topic) {
      this.gateway.emitToRoom(topic.roomId, 'message:pinned', {
        ...this.formatMessage(updated),
        topicId: message.topicId,
      });
    }

    return this.formatMessage(updated);
  }

  // ─── Get single message ───────────────────────────────────

  async getMessage(messageId: string) {
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, deletedAt: null },
      select: MESSAGE_SELECT,
    });
    if (!message) throw new NotFoundException('Message not found');
    return this.formatMessage(message);
  }

  // ─── Get topic ID from message (for RBAC checks) ─────────

  async getMessageTopicId(messageId: string): Promise<string> {
    const msg = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { topicId: true },
    });
    if (!msg) throw new NotFoundException('Message not found');
    return msg.topicId;
  }

  async getTopicRoomId(topicId: string): Promise<string> {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      select: { roomId: true },
    });
    if (!topic) throw new NotFoundException('Topic not found');
    return topic.roomId;
  }

  // ─── Helpers ──────────────────────────────────────────────

  private async assertTopicExists(topicId: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, deletedAt: true },
    });
    if (!topic || topic.deletedAt) throw new NotFoundException('Topic not found');
  }
}
