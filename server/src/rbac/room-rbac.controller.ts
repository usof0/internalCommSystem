import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GlobalPermissionGuard } from './guards/global-permission.guard';
import { RequirePermission } from './decorators/require-permission.decorator';
import { RbacService } from './rbac.service';
import { AddRoomRolePermissionsDto } from './dto/add-room-role-permissions.dto';

@UseGuards(JwtAuthGuard, GlobalPermissionGuard)
@Controller('rbac/room-roles')
export class RoomRbacController {
  constructor(private readonly rbac: RbacService) {}

  @RequirePermission('rbac.roles.manage')
  @Get()
  listRoles() {
    return this.rbac.listRoomRoles();
  }

  @RequirePermission('rbac.roles.manage')
  @Post(':roleId/permissions')
  addPermissions(
    @Param('roleId') roleId: string,
    @Body() dto: AddRoomRolePermissionsDto,
  ) {
    return this.rbac.addPermissionsToRoomRole(roleId, dto.permissionIds);
  }

  @RequirePermission('rbac.roles.manage')
  @Delete(':roleId/permissions/:permissionId')
  removePermission(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rbac.removePermissionFromRoomRole(roleId, permissionId);
  }
}
