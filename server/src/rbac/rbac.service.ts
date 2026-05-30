import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignUserRolesDto } from './dto/assign-user-roles.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserPermissionCodes(userId: string): Promise<Set<string>> {
    const [directRoles, positionMemberships] = await Promise.all([
      this.prisma.userRole.findMany({
        where: {
          userId,
          deletedAt: null,
          role: { deletedAt: null },
        },
        select: {
          role: {
            select: {
              permissions: {
                where: {
                  deletedAt: null,
                  permission: { deletedAt: null },
                },
                select: { permission: { select: { code: true } } },
              },
            },
          },
        },
      }),
      this.prisma.userOrgUnitMembership.findMany({
        where: {
          userId,
          position: { deletedAt: null },
        },
        select: {
          position: {
            select: {
              positionRoles: {
                where: { role: { deletedAt: null } },
                select: {
                  role: {
                    select: {
                      permissions: {
                        where: {
                          deletedAt: null,
                          permission: { deletedAt: null },
                        },
                        select: { permission: { select: { code: true } } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const codes = new Set<string>();
    for (const ur of directRoles) {
      for (const rp of ur.role.permissions) {
        codes.add(rp.permission.code);
      }
    }
    for (const membership of positionMemberships) {
      for (const positionRole of membership.position.positionRoles) {
        for (const rp of positionRole.role.permissions) {
          codes.add(rp.permission.code);
        }
      }
    }
    return codes;
  }

  async userHasPermission(
    userId: string,
    permissionCode: string,
  ): Promise<boolean> {
    const codes = await this.getUserPermissionCodes(userId);
    return codes.has(permissionCode);
  }

  // Roles
  async createRole(data: { name: string; description?: string }) {
    const existing = await this.prisma.role.findUnique({
      where: { name: data.name },
      select: { id: true },
    });
    if (existing) throw new ConflictException('Role name already exists');

    return this.prisma.role.create({ data });
  }

  listRoles() {
    return this.prisma.role.findMany({
      orderBy: { createdAt: 'desc' },
      where: {deletedAt: null},
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getRole(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        permissions: {
          where: { deletedAt: null },
          select: {
            permission: {
              select: { id: true, code: true, module: true, description: true },
            },
          },
        },
      },
    });
    if (!role) throw new NotFoundException('Role not found');

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.permissions.map((rp) => rp.permission),
    };
  }

  async updateRole(roleId: string, dto: UpdateRoleDto) {
    if (dto.name) {
      const exists = await this.prisma.role.findFirst({
        where: {
          name: dto.name,
          deletedAt: null,
          NOT: { id: roleId },
        },
        select: { id: true },
      });
      if (exists) throw new BadRequestException('Role name already exists');
    }

    return this.prisma.role.update({
      where: { id: roleId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
      select: { id: true, name: true, description: true, createdAt: true, updatedAt: true },
    });
  }

  async deleteRole(roleId: string) {
    await this.prisma.role.update({
      where: { id: roleId },
      data: { deletedAt: new Date() },
    });
  }

  async addPermissionsToRole(roleId: string, permissionCodes: string[]) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true },
    });
    if (!role) throw new NotFoundException('Role not found');

    const perms = await this.prisma.permission.findMany({
      where: { code: { in: permissionCodes } },
      select: { id: true, code: true },
    });

    if (perms.length !== permissionCodes.length) {
      const found = new Set(perms.map((p) => p.code));
      const unknown = permissionCodes.filter((c) => !found.has(c));
      throw new BadRequestException(
        `Unknown permission codes: ${unknown.join(', ')}`,
      );
    }

    await this.prisma.rolePermission.createMany({
      data: perms.map((p) => ({ roleId, permissionId: p.id })),
      skipDuplicates: true,
    });

    return this.getRole(roleId);
  }

  async removePermissionFromRole(roleId: string, permissionId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true },
    });
    if (!role) throw new NotFoundException('Role not found');

    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
      select: { id: true },
    });
    if (!permission) throw new NotFoundException('Permission not found');

    await this.prisma.rolePermission.deleteMany({
      where: { roleId, permissionId },
    });

    return this.getRole(roleId);
  }

  // Permissions
  listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        module: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // User roles
  async assignRolesToUser(userId: string, dto: AssignUserRolesDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const roleIds = dto.roleIds ?? [];
    const roleNames = dto.roleNames ?? [];

    if (roleIds.length === 0 && roleNames.length === 0) {
      throw new BadRequestException('Provide roleIds or roleNames');
    }

    // Resolve roles
    const roles = await this.prisma.role.findMany({
      where: {
        deletedAt: null,
        ...(roleIds.length
          ? { id: { in: roleIds } }
          : { name: { in: roleNames } }),
      },
      select: { id: true, name: true },
    });

    if (roles.length === 0) {
      const unknown = roleNames.join(', ') || roleIds.join(', ');
      throw new BadRequestException(`Unknown role(s): ${unknown}`);
    }

    // Create userRole rows (skip duplicates)
    await this.prisma.userRole.createMany({
      data: roles.map((r) => ({ userId, roleId: r.id })),
      skipDuplicates: true,
    });

    // Return current user roles
    return this.listUserRoles(userId);
  }

  async removeRoleFromUser(userId: string, roleId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true },
    });
    if (!role) throw new NotFoundException('Role not found');

    await this.prisma.userRole.deleteMany({ where: { userId, roleId } });
    return this.listUserRoles(userId);
  }

  async listUserRoles(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.userRole.findMany({
      where: { userId, deletedAt: null, role: { deletedAt: null } },
      select: {
        userId: true,
        roleId: true,
        createdAt: true,
        deletedAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }


  // Room RBAC — runtime helpers
  async getUserRoomPermissionCodes(
    userId: string,
    roomId: string,
  ): Promise<Set<string>> {
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

  async userHasRoomPermission(
    userId: string,
    roomId: string,
    permissionCode: string,
  ): Promise<boolean> {
    const membership = await this.prisma.userRoomMembership.findUnique({
      where: { userId_roomId: { userId, roomId } },
      select: {
        roomRole: {
          select: {
            name: true,
            roleRoomPermissions: {
              select: {
                roomPermission: { select: { code: true } },
              },
            },
          },
        },
      },
    });

    if (!membership) return false;

    const roomRoleName = membership.roomRole.name.toLowerCase();
    if (roomRoleName === 'owner' || roomRoleName === 'admin') {
      return true;
    }

    return membership.roomRole.roleRoomPermissions.some(
      (permission) => permission.roomPermission.code === permissionCode,
    );
  }

  // Room RBAC — admin definitions
  private formatRoomRole(role: {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    roleRoomPermissions: {
      roomPermission: { id: string; code: string; description: string | null };
    }[];
  }) {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.roleRoomPermissions.map((rrp) => rrp.roomPermission),
    };
  }

  async createRoomRole(data: { name: string; description?: string }) {
    const existing = await this.prisma.roomRole.findUnique({
      where: { name: data.name },
      select: { id: true },
    });
    if (existing) throw new ConflictException('Room role name already exists');

    const role = await this.prisma.roomRole.create({
      data,
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        roleRoomPermissions: {
          select: {
            roomPermission: {
              select: { id: true, code: true, description: true },
            },
          },
        },
      },
    });

    return this.formatRoomRole(role);
  }

  async updateRoomRole(
    roomRoleId: string,
    data: { name?: string; description?: string },
  ) {
    const role = await this.prisma.roomRole.findUnique({
      where: { id: roomRoleId },
      select: { id: true },
    });
    if (!role) throw new NotFoundException('Room role not found');

    if (data.name) {
      const existing = await this.prisma.roomRole.findUnique({
        where: { name: data.name },
        select: { id: true },
      });
      if (existing && existing.id !== roomRoleId) {
        throw new ConflictException('Room role name already exists');
      }
    }

    const updated = await this.prisma.roomRole.update({
      where: { id: roomRoleId },
      data,
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        roleRoomPermissions: {
          select: {
            roomPermission: {
              select: { id: true, code: true, description: true },
            },
          },
        },
      },
    });

    return this.formatRoomRole(updated);
  }

  async listRoomRoles() {
    const roles = await this.prisma.roomRole.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        roleRoomPermissions: {
          select: {
            roomPermission: {
              select: { id: true, code: true, description: true },
            },
          },
        },
      },
    });

    return roles.map((r) => this.formatRoomRole(r));
  }

  async getRoomRole(roomRoleId: string) {
    const role = await this.prisma.roomRole.findUnique({
      where: { id: roomRoleId },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        roleRoomPermissions: {
          select: {
            roomPermission: {
              select: { id: true, code: true, description: true },
            },
          },
        },
      },
    });
    if (!role) throw new NotFoundException('Room role not found');

    return this.formatRoomRole(role);
  }

  listRoomPermissions() {
    return this.prisma.roomPermission.findMany({
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async addPermissionsToRoomRole(
    roomRoleId: string,
    permissionCodes: string[],
  ) {
    const role = await this.prisma.roomRole.findUnique({
      where: { id: roomRoleId },
      select: { id: true },
    });
    if (!role) throw new NotFoundException('Room role not found');

    const perms = await this.prisma.roomPermission.findMany({
      where: { code: { in: permissionCodes } },
      select: { id: true, code: true },
    });

    if (perms.length !== permissionCodes.length) {
      const found = new Set(perms.map((p) => p.code));
      const unknown = permissionCodes.filter((c) => !found.has(c));
      throw new BadRequestException(
        `Unknown room permission codes: ${unknown.join(', ')}`,
      );
    }

    await this.prisma.roleRoomPermission.createMany({
      data: perms.map((p) => ({ roomRoleId, roomPermissionId: p.id })),
      skipDuplicates: true,
    });

    return this.getRoomRole(roomRoleId);
  }

  async removePermissionFromRoomRole(
    roomRoleId: string,
    roomPermissionId: string,
  ) {
    const role = await this.prisma.roomRole.findUnique({
      where: { id: roomRoleId },
      select: { id: true },
    });
    if (!role) throw new NotFoundException('Room role not found');

    const perm = await this.prisma.roomPermission.findUnique({
      where: { id: roomPermissionId },
      select: { id: true },
    });
    if (!perm) throw new NotFoundException('Room permission not found');

    await this.prisma.roleRoomPermission.deleteMany({
      where: { roomRoleId, roomPermissionId },
    });

    return this.getRoomRole(roomRoleId);
  }
}
