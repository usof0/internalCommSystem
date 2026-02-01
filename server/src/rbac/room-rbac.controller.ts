import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GlobalPermissionGuard } from './guards/global-permission.guard';
import { RequirePermission } from './decorators/require-permission.decorator';
import { RbacService } from './rbac.service';
import { CreateRoomRoleDto } from './dto/create-room-role.dto';
import { UpdateRoomRoleDto } from './dto/update-room-role.dto';
import { AddRoomRolePermissionsDto } from './dto/add-room-role-permissions.dto';

@UseGuards(JwtAuthGuard, GlobalPermissionGuard)
@Controller('rbac/room')
export class RoomRbacController {
  constructor(private readonly rbac: RbacService) {}

  // Room roles
  @RequirePermission('rbac.roles.manage')
  @Get('roles')
  listRoomRoles() {
    return this.rbac.listRoomRoles();
  }

  @RequirePermission('rbac.roles.manage')
  @Post('roles')
  createRoomRole(@Body() dto: CreateRoomRoleDto) {
    return this.rbac.createRoomRole(dto);
  }

  @RequirePermission('rbac.roles.manage')
  @Get('roles/:roomRoleId')
  getRoomRole(@Param('roomRoleId') roomRoleId: string) {
    return this.rbac.getRoomRole(roomRoleId);
  }

  @RequirePermission('rbac.roles.manage')
  @Put('roles/:roomRoleId')
  updateRoomRole(@Param('roomRoleId') roomRoleId: string, @Body() dto: UpdateRoomRoleDto) {
    return this.rbac.updateRoomRole(roomRoleId, dto);
  }

  // Room permissions
  @RequirePermission('rbac.permissions.manage')
  @Get('permissions')
  listRoomPermissions() {
    return this.rbac.listRoomPermissions();
  }

  // Role <-> room permission mappings
  @RequirePermission('rbac.roles.manage')
  @Post('roles/:roomRoleId/permissions')
  addRoomRolePermissions(
    @Param('roomRoleId') roomRoleId: string,
    @Body() dto: AddRoomRolePermissionsDto,
  ) {
    return this.rbac.addPermissionsToRoomRole(roomRoleId, dto.permissionCodes);
  }

  @RequirePermission('rbac.roles.manage')
  @Delete('roles/:roomRoleId/permissions/:roomPermissionId')
  removeRoomRolePermission(
    @Param('roomRoleId') roomRoleId: string,
    @Param('roomPermissionId') roomPermissionId: string,
  ) {
    return this.rbac.removePermissionFromRoomRole(roomRoleId, roomPermissionId);
  }
}
