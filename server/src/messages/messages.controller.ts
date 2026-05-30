import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacService } from '../rbac/rbac.service';
import { TopicsService } from '../topics/topics.service';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { PinMessageDto } from './dto/pin-message.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class MessagesController {
  constructor(
    private readonly messages: MessagesService,
    private readonly topics: TopicsService,
    private readonly rbac: RbacService,
  ) {}

  // ─── GET /topics/:topicId/messages ────────────────────────

  @Get('topics/:topicId/messages')
  async listMessages(
    @Param('topicId') topicId: string,
    @Req() req: any,
  ) {
    // Resolve room and check membership + visibility
    const roomId = await this.messages.getTopicRoomId(topicId);
    await this.topics.assertRoomMember(req.user.id, roomId);
    await this.topics.assertTopicVisible(req.user.id, topicId);
    return this.messages.listMessages(topicId);
  }

  // ─── GET /messages/:messageId ─────────────────────────────

  @Get('messages/:messageId')
  async getMessage(
    @Param('messageId') messageId: string,
    @Req() req: any,
  ) {
    const topicId = await this.messages.getMessageTopicId(messageId);
    const roomId = await this.messages.getTopicRoomId(topicId);
    await this.topics.assertRoomMember(req.user.id, roomId);
    await this.topics.assertTopicVisible(req.user.id, topicId);
    return this.messages.getMessage(messageId);
  }

  // ─── GET /messages/:messageId/replies ─────────────────────

  @Get('messages/:messageId/replies')
  async listReplies(
    @Param('messageId') messageId: string,
    @Req() req: any,
  ) {
    const topicId = await this.messages.getMessageTopicId(messageId);
    const roomId = await this.messages.getTopicRoomId(topicId);
    await this.topics.assertRoomMember(req.user.id, roomId);
    await this.topics.assertTopicVisible(req.user.id, topicId);
    return this.messages.listReplies(messageId);
  }

  // ─── POST /topics/:topicId/messages ───────────────────────

  @Post('topics/:topicId/messages')
  @HttpCode(201)
  async createMessage(
    @Param('topicId') topicId: string,
    @Req() req: any,
    @Body() dto: CreateMessageDto,
  ) {
    const roomId = await this.messages.getTopicRoomId(topicId);
    await this.topics.assertRoomMember(req.user.id, roomId);
    await this.topics.assertTopicVisible(req.user.id, topicId);
    const canCreateMessage = await this.rbac.userHasRoomPermission(
      req.user.id,
      roomId,
      'room.message.create',
    );
    if (!canCreateMessage) {
      throw new ForbiddenException('Insufficient permissions to send messages');
    }
    return this.messages.createMessage(topicId, req.user.id, dto);
  }

  // ─── PATCH /messages/:messageId/pin ───────────────────────

  @Patch('messages/:messageId/pin')
  async pinMessage(
    @Param('messageId') messageId: string,
    @Req() req: any,
    @Body() dto: PinMessageDto,
  ) {
    const topicId = await this.messages.getMessageTopicId(messageId);
    const roomId = await this.messages.getTopicRoomId(topicId);

    await this.topics.assertRoomMember(req.user.id, roomId);

    const hasRoom = await this.rbac.userHasRoomPermission(
      req.user.id,
      roomId,
      'room.message.bin',
    );
    if (!hasRoom) {
      throw new ForbiddenException('Insufficient permissions to pin/unpin messages');
    }

    return this.messages.pinMessage(messageId, dto.isPinned);
  }
}
