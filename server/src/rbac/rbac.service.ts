import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserPermissionCodes(userId: string): Promise<Set<string>> {
    const rows = await this.prisma.userRole.findMany({
      where: {
        userId,
        deletedAt: null,
        role: { deletedAt: null },
      },
      select: {
        role: {
          select: {
            permissions: {
              where: { deletedAt: null },
              select: { permission: { select: { code: true } } },
            },
          },
        },
      },
    });

    const codes = new Set<string>();
    for (const ur of rows) {
      for (const rp of ur.role.permissions) {
        codes.add(rp.permission.code);
      }
    }
    return codes;
  }

  async userHasPermission(userId: string, permissionCode: string): Promise<boolean> {
    const codes = await this.getUserPermissionCodes(userId);
    return codes.has(permissionCode);
  }

  // Roles
  createRole(data: { name: string; description?: string }) {
    return this.prisma.role.create({ data });
  }

  listRoles() {
    return this.prisma.role.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, description: true, createdAt: true, updatedAt: true },
    });
  }

  async getRole(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async addPermissionsToRole(roleId: string, permissionCodes: string[]) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId }, select: { id: true } });
    if (!role) throw new NotFoundException('Role not found');

    const perms = await this.prisma.permission.findMany({
      where: { code: { in: permissionCodes } },
      select: { id: true, code: true },
    });

    if (perms.length !== permissionCodes.length) {
      const found = new Set(perms.map(p => p.code));
      const missing = permissionCodes.filter(c => !found.has(c));
      throw new NotFoundException(`Permissions not found: ${missing.join(', ')}`);
    }

    await this.prisma.rolePermission.createMany({
      data: perms.map(p => ({ roleId, permissionId: p.id })),
      skipDuplicates: true,
    });

    return this.getRole(roleId);
  }

  async removePermissionFromRole(roleId: string, permissionId: string) {
    await this.prisma.rolePermission.deleteMany({
      where: { roleId, permissionId },
    });
    return this.getRole(roleId);
  }

  // // Permissions
  // createPermission(data: { code: string; description?: string }) {
  //   return this.prisma.permission.create({ data });
  // }

  listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: { code: 'asc' },
      select: { id: true, code: true, description: true, createdAt: true, updatedAt: true },
    });
  }

  // User roles
  async assignRolesToUser(userId: string, roleNames: string[]) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');

    const roles = await this.prisma.role.findMany({
      where: { name: { in: roleNames } },
      select: { id: true, name: true },
    });

    if (roles.length !== roleNames.length) {
      const found = new Set(roles.map(r => r.name));
      const missing = roleNames.filter(c => !found.has(c));
      throw new NotFoundException(`Roles not found: ${missing.join(', ')}`);
    }

    await this.prisma.userRole.createMany({
      data: roles.map(r => ({ userId, roleId: r.id })),
      skipDuplicates: true,
    });

    return this.listUserRoles(userId);
  }

  async removeRoleFromUser(userId: string, roleId: string) {
    await this.prisma.userRole.deleteMany({ where: { userId, roleId } });
    return this.listUserRoles(userId);
  }

  listUserRoles(userId: string) {
    return this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // room RBAC
  async getUserRoomPermissionCodes(userId: string, roomId: string): Promise<Set<string>> {
    const membership = await this.prisma.userRoomMembership.findUnique({
      where: { userId_roomId: { userId, roomId } },
      select: {
        roomRole: {
          select: {
            roleRoomPermissions: {
              select: {
                roomPermission: { select: { code: true } },
              },
            },
          },
        },
      },
    });

    if (!membership) return new Set<string>();

    const codes = new Set<string>();
    for (const rrp of membership.roomRole.roleRoomPermissions) {
      codes.add(rrp.roomPermission.code);
    }
    return codes;
  }

  async userHasRoomPermission(userId: string, roomId: string, permissionCode: string): Promise<boolean> {
    const codes = await this.getUserRoomPermissionCodes(userId, roomId);
    return codes.has(permissionCode);
  }

  listRoomRoles() {
    return this.prisma.roomRole.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, description: true, createdAt: true, updatedAt: true },
    });
  }
  
  async addPermissionsToRoomRole(roleId: string, permissionIds: string[]) {
    const role = await this.prisma.roomRole.findUnique({ where: { id: roleId }, select: { id: true } });
    if (!role) throw new NotFoundException('Room role not found');
    const perms = await this.prisma.roomPermission.findMany({
      where: { id: { in: permissionIds } },
      select: { id: true },
    });

    if (perms.length !== permissionIds.length) {
      const found = new Set(perms.map(p => p.id));
      const missing = permissionIds.filter(c => !found.has(c));
      throw new NotFoundException(`Room permissions not found: ${missing.join(', ')}`);
    }

    await this.prisma.roleRoomPermission.createMany({
      data: perms.map(p => ({ roomRoleId: roleId, roomPermissionId: p.id })),
      skipDuplicates: true,
    });

    return this.listRoomRoles();
  }

  async removePermissionFromRoomRole(roleId: string, permissionId: string) {
    await this.prisma.roleRoomPermission.deleteMany({
      where: { roomRoleId: roleId, roomPermissionId: permissionId },
    });
    return this.listRoomRoles();
  }
}
