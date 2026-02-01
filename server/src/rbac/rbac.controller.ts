import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GlobalPermissionGuard } from './guards/global-permission.guard';
import { RequirePermission } from './decorators/require-permission.decorator';
import { RbacService } from './rbac.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { AddRolePermissionsDto } from './dto/add-role-permissions.dto';
import { AssignUserRolesDto } from './dto/assign-user-roles.dto';

@UseGuards(JwtAuthGuard, GlobalPermissionGuard)
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbac: RbacService) {}

  // Roles
  @RequirePermission('rbac.roles.manage')
  @Post('roles')
  createRole(@Body() dto: CreateRoleDto) {
    return this.rbac.createRole(dto);
  }

  @RequirePermission('rbac.roles.manage')
  @Get('roles')
  listRoles() {
    return this.rbac.listRoles();
  }

  @RequirePermission('rbac.roles.manage')
  @Get('roles/:roleId')
  getRole(@Param('roleId') roleId: string) {
    return this.rbac.getRole(roleId);
  }

  @RequirePermission('rbac.roles.manage')
  @Post('roles/:roleId/permissions')
  addRolePermissions(@Param('roleId') roleId: string, @Body() dto: AddRolePermissionsDto) {
    return this.rbac.addPermissionsToRole(roleId, dto.permissionCodes);
  }

  @RequirePermission('rbac.roles.manage')
  @Delete('roles/:roleId/permissions/:permissionId')
  removeRolePermission(@Param('roleId') roleId: string, @Param('permissionId') permissionId: string) {
    return this.rbac.removePermissionFromRole(roleId, permissionId);
  }

  // Permissions
  @RequirePermission('rbac.permissions.manage')
  @Get('permissions')
  listPermissions() {
    return this.rbac.listPermissions();
  }

  // User roles
  @RequirePermission('rbac.user_roles.manage')
  @Post('users/:userId/roles')
  assignUserRoles(@Param('userId') userId: string, @Body() dto: AssignUserRolesDto) {
    return this.rbac.assignRolesToUser(userId, dto.roleNames);
  }

  @RequirePermission('rbac.user_roles.manage')
  @Get('users/:userId/roles')
  listUserRoles(@Param('userId') userId: string) {
    return this.rbac.listUserRoles(userId);
  }

  @RequirePermission('rbac.user_roles.manage')
  @Delete('users/:userId/roles/:roleId')
  removeUserRole(@Param('userId') userId: string, @Param('roleId') roleId: string) {
    return this.rbac.removeRoleFromUser(userId, roleId);
  }
}
