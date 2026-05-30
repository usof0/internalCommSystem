import {
  Body,
  ConsoleLogger,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatPermissionGuard } from '../rbac/guards/chat-permission.guard';
import { RequireChatPermission } from '../rbac/decorators/require-chat-permission.decorator';
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { SetVisibilityScopeDto } from './dto/set-visibility-scope.dto';
import { PatchVisibilityScopeDto } from './dto/patch-visibility-scope.dto';

@UseGuards(JwtAuthGuard)
@Controller('topics')
export class TopicsReadController {
  constructor(private readonly topics: TopicsService) {}

  @Post(':topicId/read')
  @HttpCode(200)
  markTopicRead(@Param('topicId') topicId: string, @Req() req: any) {
    return this.topics.markTopicRead(topicId, req.user.id);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('rooms/:roomId/topics')
export class TopicsController {
  constructor(private readonly topics: TopicsService) {}

  // ─── Topics CRUD ──────────────────────────────────────────

  @Get()
  async listTopics(@Param('roomId') roomId: string, @Req() req: any) {
    await this.topics.assertRoomMember(req.user.id, roomId);
    return this.topics.listTopics(roomId, req.user.id);
  }

  @UseGuards(ChatPermissionGuard)
  @RequireChatPermission('room.topics.manage', 'room.topics.manage')
  @Post()
  @HttpCode(201)
  async createTopic(
    @Param('roomId') roomId: string,
    @Req() req: any,
    @Body() dto: CreateTopicDto,
  ) {
    await this.topics.assertRoomMember(req.user.id, roomId);
    return this.topics.createTopic(roomId, req.user.id, dto);
  }

  @UseGuards(ChatPermissionGuard)
  @RequireChatPermission('room.topics.manage', 'room.topics.manage')
  @Patch(':topicId')
  async updateTopic(
    @Param('roomId') roomId: string,
    @Param('topicId') topicId: string,
    @Body() dto: UpdateTopicDto,
  ) {
    return this.topics.updateTopic(topicId, roomId, dto);
  }

  @UseGuards(ChatPermissionGuard)
  @RequireChatPermission('room.topics.manage', 'room.topics.manage')
  @Delete(':topicId')
  @HttpCode(204)
  async deleteTopic(
    @Param('roomId') roomId: string,
    @Param('topicId') topicId: string,
  ) {
    await this.topics.deleteTopic(topicId, roomId);
  }

  // ─── Topic Visibility ─────────────────────────────────────

  @UseGuards(ChatPermissionGuard)
  @RequireChatPermission('room.topic.visibility.manage', 'room.topic.visibility.manage')
  @Get(':topicId/visibility')
  getVisibilityScope(
    @Param('roomId') roomId: string,
    @Param('topicId') topicId: string,
  ) {
    return this.topics.getVisibilityScope(topicId, roomId);
  }

  @UseGuards(ChatPermissionGuard)
  @RequireChatPermission('room.topic.visibility.manage', 'room.topic.visibility.manage')
  @Put(':topicId/visibility')
  setVisibilityScope(
    @Param('roomId') roomId: string,
    @Param('topicId') topicId: string,
    @Body() dto: SetVisibilityScopeDto,
  ) {
    return this.topics.setVisibilityScope(topicId, roomId, dto);
  }

  @UseGuards(ChatPermissionGuard)
  @RequireChatPermission('room.topic.visibility.manage', 'room.topic.visibility.manage')
  @Patch(':topicId/visibility')
  patchVisibilityScope(
    @Param('roomId') roomId: string,
    @Param('topicId') topicId: string,
    @Body() dto: PatchVisibilityScopeDto,
  ) {
    return this.topics.patchVisibilityScope(topicId, roomId, dto);
  }
}
