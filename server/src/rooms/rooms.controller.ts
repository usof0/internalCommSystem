import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatPermissionGuard } from '../rbac/guards/chat-permission.guard';
import { RequireChatPermission } from '../rbac/decorators/require-chat-permission.decorator';
import { RoomsService } from './rooms.service';
import { ListRoomsQueryDto } from './dto/list-rooms-query.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { AddRoomMemberDto } from './dto/add-room-member.dto';
import { BatchAddRoomMembersDto } from './dto/batch-add-room-members.dto';
import { UpdateRoomMemberRoleDto } from './dto/update-room-member-role.dto';
import { BulkAddRoomMembersDto } from './dto/bulk-add-room-members.dto';
import { BulkRemoveRoomMembersDto } from './dto/bulk-remove-room-members.dto';

@UseGuards(JwtAuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  // ─── Rooms ──────────────────────────────────────────────────

  @Get()
  listRooms(@Req() req: any, @Query() query: ListRoomsQueryDto) {
    return this.rooms.listRooms(req.user.id, query);
  }

  @Get(':roomId')
  getRoom(@Param('roomId') roomId: string, @Req() req: any) {
    return this.rooms.getRoom(roomId, req.user.id);
  }

  @Post()
  async createRoom(
    @Req() req: any,
    @Res() res: any,
    @Body() dto: CreateRoomDto,
  ) {
    const { room, isExisting } = await this.rooms.createRoom(req.user.id, dto);
    // DIRECT dedup returns 200; new room returns 201
    res.status(isExisting ? 200 : 201).json(room);
  }

  @UseGuards(ChatPermissionGuard)
  @RequireChatPermission('room.update', 'room.update')
  @Patch(':roomId')
  updateRoom(
    @Param('roomId') roomId: string,
    @Req() req: any,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.rooms.updateRoom(roomId, req.user.id, dto);
  }

  @UseGuards(ChatPermissionGuard)
  @RequireChatPermission('room.delete', 'room.update')
  @Delete(':roomId')
  @HttpCode(204)
  async deleteRoom(@Param('roomId') roomId: string, @Req() req: any) {
    await this.rooms.deleteRoom(roomId, req.user.id);
  }

  // ─── Members ────────────────────────────────────────────────

  @Get(':roomId/members')
  async listMembers(@Param('roomId') roomId: string, @Req() req: any) {
    await this.rooms.assertRoomMember(req.user.id, roomId);
    return this.rooms.listMembers(roomId);
  }

  @UseGuards(ChatPermissionGuard)
  @RequireChatPermission('room.members.manage', 'room.members.manage')
  @Get(':roomId/member-roles')
  listAssignableMemberRoles() {
    return this.rooms.listAssignableMemberRoles();
  }

  @UseGuards(ChatPermissionGuard)
  @RequireChatPermission('room.members.manage', 'room.members.manage')
  @Post(':roomId/members')
  @HttpCode(201)
  addMember(
    @Param('roomId') roomId: string,
    @Req() req: any,
    @Body() dto: AddRoomMemberDto,
  ) {
    return this.rooms.addMember(roomId, dto.userId, dto.roomRoleId, req.user.id);
  }

  @UseGuards(ChatPermissionGuard)
  @RequireChatPermission('room.members.manage', 'room.members.manage')
  @Post(':roomId/members/batch')
  @HttpCode(201)
  batchAddMembers(
    @Param('roomId') roomId: string,
    @Req() req: any,
    @Body() dto: BatchAddRoomMembersDto,
  ) {
    return this.rooms.batchAddMembers(roomId, dto.members, req.user.id);
  }

  @UseGuards(ChatPermissionGuard)
  @RequireChatPermission('room.members.manage', 'room.members.manage')
  @Post(':roomId/members/bulk-add')
  @HttpCode(200)
  bulkAddMembers(
    @Param('roomId') roomId: string,
    @Req() req: any,
    @Body() dto: BulkAddRoomMembersDto,
  ) {
    return this.rooms.bulkAddMembers(roomId, dto, req.user.id);
  }

  @UseGuards(ChatPermissionGuard)
  @RequireChatPermission('room.members.manage', 'room.members.manage')
  @Post(':roomId/members/bulk-remove')
  @HttpCode(200)
  bulkRemoveMembers(
    @Param('roomId') roomId: string,
    @Req() req: any,
    @Body() dto: BulkRemoveRoomMembersDto,
  ) {
    return this.rooms.bulkRemoveMembers(roomId, dto, req.user.id);
  }

  @UseGuards(ChatPermissionGuard)
  @RequireChatPermission('room.members.manage', 'room.members.manage')
  @Patch(':roomId/members/:userId')
  updateMemberRole(
    @Param('roomId') roomId: string,
    @Param('userId') userId: string,
    @Req() req: any,
    @Body() dto: UpdateRoomMemberRoleDto,
  ) {
    return this.rooms.updateMemberRole(roomId, userId, dto.roomRoleId, req.user.id);
  }

  @Delete(':roomId/members/:userId')
  @HttpCode(204)
  async removeMember(
    @Param('roomId') roomId: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    await this.rooms.removeMember(roomId, userId, req.user.id);
  }
}
