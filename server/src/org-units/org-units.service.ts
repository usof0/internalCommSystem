import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrgUnitsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Org Units ────────────────────────────────────────────

  async createOrgUnit(data: {
    name: string;
    description?: string;
    parentId?: string;
  }) {
    if (data.parentId) {
      await this.assertOrgUnitExists(data.parentId);
    }

    const existing = await this.prisma.orgUnit.findFirst({
      where: {
        parentId: data.parentId ?? null,
        name: data.name,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (existing)
      throw new ConflictException(
        'Org unit name already exists under this parent',
      );

    return this.prisma.orgUnit.create({
      data: {
        name: data.name,
        description: data.description,
        parentId: data.parentId ?? null,
      },
      select: {
        id: true,
        parentId: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async listOrgUnits(parentId?: string) {
    return this.prisma.orgUnit.findMany({
      where: {
        deletedAt: null,
        parentId: parentId !== undefined ? parentId : undefined,
      },
      select: {
        id: true,
        parentId: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getOrgUnit(orgUnitId: string) {
    const unit = await this.prisma.orgUnit.findUnique({
      where: { id: orgUnitId },
      select: {
        id: true,
        parentId: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });
    if (!unit || unit.deletedAt)
      throw new NotFoundException('Org unit not found');

    const { deletedAt: _, ...result } = unit;
    return result;
  }

  async getOrgUnitTree(query: { rootId?: string; depth?: number }) {
    const allUnits = await this.prisma.orgUnit.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        parentId: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    type TreeNode = (typeof allUnits)[0] & { children: TreeNode[] };
    const map = new Map<string, TreeNode>();
    for (const u of allUnits) {
      map.set(u.id, { ...u, children: [] });
    }

    const roots: TreeNode[] = [];
    for (const node of map.values()) {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.children.push(node);
      } else if (!node.parentId) {
        roots.push(node);
      } else {
        roots.push(node);
      }
    }

    let result: TreeNode[];
    if (query.rootId) {
      const root = map.get(query.rootId);
      if (!root) throw new NotFoundException('Root org unit not found');
      result = [root];
    } else {
      result = roots;
    }

    if (query.depth !== undefined && query.depth >= 0) {
      const prune = (nodes: TreeNode[], currentDepth: number): TreeNode[] => {
        return nodes.map((n) => ({
          ...n,
          children:
            currentDepth < query.depth!
              ? prune(n.children, currentDepth + 1)
              : [],
        }));
      };
      result = prune(result, 0);
    }

    return { items: result};
  }

  async updateOrgUnit(
    orgUnitId: string,
    data: { name?: string; description?: string; parentId?: string },
  ) {
    await this.assertOrgUnitExists(orgUnitId);

    if (data.parentId) {
      await this.assertOrgUnitExists(data.parentId);
    }

    if (data.name !== undefined) {
      const current = await this.prisma.orgUnit.findUnique({
        where: { id: orgUnitId },
        select: { parentId: true },
      });
      const targetParent = data.parentId ?? current!.parentId;
      const existing = await this.prisma.orgUnit.findFirst({
        where: {
          parentId: targetParent,
          name: data.name,
          deletedAt: null,
          id: { not: orgUnitId },
        },
        select: { id: true },
      });
      if (existing)
        throw new ConflictException(
          'Org unit name already exists under this parent',
        );
    }

    return this.prisma.orgUnit.update({
      where: { id: orgUnitId },
      data,
      select: {
        id: true,
        parentId: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteOrgUnit(orgUnitId: string) {
    await this.assertOrgUnitExists(orgUnitId);

    await this.prisma.orgUnit.update({
      where: { id: orgUnitId },
      data: { deletedAt: new Date() },
    });

    return { ok: true };
  }

  // ─── Org Unit Members ─────────────────────────────────────

  async listOrgUnitMembers(orgUnitId: string) {
    await this.assertOrgUnitExists(orgUnitId);

    const memberships = await this.prisma.userOrgUnitMembership.findMany({
      where: {
        orgUnitId,
        position: { deletedAt: null },
        user: { deletedAt: null },
      },
      select: {
        userId: true,
        positionId: true,
        joinedAt: true,
        user: {
          select: {
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        position: { select: { name: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });

    const members = memberships.map((m) => ({
      userId: m.userId,
      email: m.user.email,
      displayName: m.user.displayName,
      avatarUrl: m.user.avatarUrl,
      positionId: m.positionId,
      positionName: m.position.name,
      joinedAt: m.joinedAt,
    }));

    return { items: members };
  }

  async addMember(
    orgUnitId: string,
    data: { userId: string; positionId: string },
  ) {
    await this.assertOrgUnitExists(orgUnitId);
    await this.assertUserExists(data.userId);
    await this.assertPositionExists(data.positionId);

    const existing = await this.prisma.userOrgUnitMembership.findUnique({
      where: {
        userId_orgUnitId_positionId: {
          userId: data.userId,
          orgUnitId,
          positionId: data.positionId,
        },
      },
    });
    if (existing) throw new ConflictException('Membership already exists');

    const membership = await this.prisma.userOrgUnitMembership.create({
      data: {
        userId: data.userId,
        orgUnitId,
        positionId: data.positionId,
      },
      select: {
        userId: true,
        orgUnitId: true,
        positionId: true,
        joinedAt: true,
      },
    });

    return membership;
  }

  async changeMemberPosition(
    orgUnitId: string,
    userId: string,
    data: { fromPositionId: string; toPositionId: string },
  ) {
    await this.assertOrgUnitExists(orgUnitId);
    await this.assertUserExists(userId);
    await this.assertPositionExists(data.toPositionId);

    const existing = await this.prisma.userOrgUnitMembership.findUnique({
      where: {
        userId_orgUnitId_positionId: {
          userId,
          orgUnitId,
          positionId: data.fromPositionId,
        },
      },
    });
    if (!existing) throw new NotFoundException('Membership not found');

    await this.prisma.$transaction([
      this.prisma.userOrgUnitMembership.delete({
        where: {
          userId_orgUnitId_positionId: {
            userId,
            orgUnitId,
            positionId: data.fromPositionId,
          },
        },
      }),
      this.prisma.userOrgUnitMembership.create({
        data: {
          userId,
          orgUnitId,
          positionId: data.toPositionId,
        },
      }),
    ]);

    return { ok: true };
  }

  async removeMember(
    orgUnitId: string,
    userId: string,
    positionId: string,
  ) {
    await this.assertOrgUnitExists(orgUnitId);
    await this.assertUserExists(userId);

    const existing = await this.prisma.userOrgUnitMembership.findUnique({
      where: {
        userId_orgUnitId_positionId: {
          userId,
          orgUnitId,
          positionId,
        },
      },
    });
    if (!existing) throw new NotFoundException('Membership not found');

    await this.prisma.userOrgUnitMembership.delete({
      where: {
        userId_orgUnitId_positionId: {
          userId,
          orgUnitId,
          positionId,
        },
      },
    });

    return { ok: true };
  }

  async listUserMemberships(userId: string) {
    await this.assertUserExists(userId);

    const memberships = await this.prisma.userOrgUnitMembership.findMany({
      where: {
        userId,
        orgUnit: { deletedAt: null },
        position: { deletedAt: null },
      },
      select: {
        userId: true,
        orgUnitId: true,
        positionId: true,
        joinedAt: true,
        orgUnit: { select: { name: true } },
        position: { select: { name: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships.map((m) => ({
      userId: m.userId,
      orgUnitId: m.orgUnitId,
      orgUnitName: m.orgUnit.name,
      positionId: m.positionId,
      positionName: m.position.name,
      joinedAt: m.joinedAt,
    }));
  }

  // ─── Tags ─────────────────────────────────────────────────

  async createTag(data: { name: string }) {
    const existing = await this.prisma.tag.findUnique({
      where: { name: data.name },
      select: { id: true, deletedAt: true },
    });
    if (existing && !existing.deletedAt)
      throw new ConflictException('Tag name already exists');

    if (existing && existing.deletedAt) {
      return this.prisma.tag.update({
        where: { id: existing.id },
        data: { deletedAt: null },
        select: { id: true, name: true, createdAt: true },
      });
    }

    return this.prisma.tag.create({
      data,
      select: { id: true, name: true, createdAt: true },
    });
  }

  async listTags() {
      return this.prisma.tag.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
    
  }

  async deleteTag(tagId: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id: tagId },
      select: { id: true, deletedAt: true },
    });
    if (!tag || tag.deletedAt) throw new NotFoundException('Tag not found');

    await this.prisma.tag.update({
      where: { id: tagId },
      data: { deletedAt: new Date() },
    });

    return { ok: true };
  }

  // ─── OrgUnit ↔ Tags ──────────────────────────────────────

  async listOrgUnitTags(orgUnitId: string) {
    await this.assertOrgUnitExists(orgUnitId);

    const entries = await this.prisma.orgUnitTag.findMany({
      where: { orgUnitId, deletedAt: null, tag: { deletedAt: null } },
      select: {
        tagId: true,
        createdAt: true,
        tag: { select: { name: true } },
      },
    });

    return entries.map((e) => ({
      id: e.tagId,
      name: e.tag.name,
      createdAt: e.createdAt,
    }));
  }

  async assignTagsToOrgUnit(orgUnitId: string, tagIds: string[]) {
    await this.assertOrgUnitExists(orgUnitId);

    const tags = await this.prisma.tag.findMany({
      where: { id: { in: tagIds }, deletedAt: null },
      select: { id: true },
    });
    if (tags.length !== tagIds.length) {
      const found = new Set(tags.map((t) => t.id));
      const missing = tagIds.filter((id) => !found.has(id));
      throw new NotFoundException(`Tags not found: ${missing.join(', ')}`);
    }

    await this.prisma.orgUnitTag.createMany({
      data: tagIds.map((tagId) => ({ orgUnitId, tagId })),
      skipDuplicates: true,
    });

    return this.listOrgUnitTags(orgUnitId);
  }

  async addTagToOrgUnit(orgUnitId: string, tagId: string) {
    await this.assertOrgUnitExists(orgUnitId);

    const tag = await this.prisma.tag.findUnique({
      where: { id: tagId, deletedAt: null },
      select: { id: true },
    });
    if (!tag) throw new NotFoundException('Tag not found');

    await this.prisma.orgUnitTag.upsert({
      where: { orgUnitId_tagId: { orgUnitId, tagId } },
      create: { orgUnitId, tagId },
      update: { deletedAt: null },
    });

    return { ok: true };
  }

  async removeTagFromOrgUnit(orgUnitId: string, tagId: string) {
    await this.assertOrgUnitExists(orgUnitId);

    await this.prisma.orgUnitTag.deleteMany({
      where: { orgUnitId, tagId },
    });

    return { ok: true };
  }

  // ─── Positions ────────────────────────────────────────────

  async createPosition(data: { name: string; description?: string }) {
    const existing = await this.prisma.position.findUnique({
      where: { name: data.name },
      select: { id: true, deletedAt: true },
    });
    if (existing && !existing.deletedAt)
      throw new ConflictException('Position name already exists');

    if (existing && existing.deletedAt) {
      return this.prisma.position.update({
        where: { id: existing.id },
        data: { deletedAt: null, description: data.description },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    return this.prisma.position.create({
      data,
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async listPositions() {
    return this.prisma.position.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async updatePosition(
    positionId: string,
    data: { name?: string; description?: string },
  ) {
    await this.assertPositionExists(positionId);

    if (data.name) {
      const existing = await this.prisma.position.findUnique({
        where: { name: data.name },
        select: { id: true },
      });
      if (existing && existing.id !== positionId) {
        throw new ConflictException('Position name already exists');
      }
    }

    return this.prisma.position.update({
      where: { id: positionId },
      data,
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deletePosition(positionId: string) {
    await this.assertPositionExists(positionId);

    await this.prisma.position.update({
      where: { id: positionId },
      data: { deletedAt: new Date() },
    });

    return { ok: true };
  }

  // ─── Position ↔ Roles ────────────────────────────────────

  async listPositionRoles(positionId: string) {
    await this.assertPositionExists(positionId);

    const entries = await this.prisma.positionRole.findMany({
      where: { positionId },
      select: {
        roleId: true,
        role: { select: { name: true, description: true } },
      },
    });

    return entries.map((e) => ({
      roleId: e.roleId,
      roleName: e.role.name,
      roleDescription: e.role.description,
    }));
  }

  async assignRolesToPosition(positionId: string, roleIds: string[]) {
    await this.assertPositionExists(positionId);

    const roles = await this.prisma.role.findMany({
      where: { id: { in: roleIds }, deletedAt: null },
      select: { id: true },
    });
    if (roles.length !== roleIds.length) {
      const found = new Set(roles.map((r) => r.id));
      const missing = roleIds.filter((id) => !found.has(id));
      throw new NotFoundException(`Roles not found: ${missing.join(', ')}`);
    }

    await this.prisma.positionRole.createMany({
      data: roleIds.map((roleId) => ({ positionId, roleId })),
      skipDuplicates: true,
    });

    return this.listPositionRoles(positionId);
  }

  async removeRoleFromPosition(positionId: string, roleId: string) {
    await this.assertPositionExists(positionId);

    await this.prisma.positionRole.deleteMany({
      where: { positionId, roleId },
    });

    return { ok: true };
  }

  // ─── Group Resolution ────────────────────────────────────

  /**
   * Resolve user IDs from multiple org unit IDs, tag IDs (by UUID), or explicit user IDs.
   * Used by the chat API bulk-add/remove and visibility scope checks.
   */
  async resolveByOrgIds(params: {
    orgUnitIds?: string[];
    orgUnitTagIds?: string[];
    includeSubUnits?: boolean;
    userIds?: string[];
  }): Promise<string[]> {
    const all = new Set<string>();

    if (params.orgUnitIds?.length) {
      let targetIds: string[] = [...params.orgUnitIds];

      if (params.includeSubUnits) {
        const expanded: string[] = [];
        for (const id of params.orgUnitIds) {
          const sub = await this.getSubtreeIds(id);
          expanded.push(...sub);
        }
        targetIds = [...new Set(expanded)];
      }

      const memberships = await this.prisma.userOrgUnitMembership.findMany({
        where: { orgUnitId: { in: targetIds }, orgUnit: { deletedAt: null } },
        select: { userId: true },
      });
      for (const m of memberships) all.add(m.userId);
    }

    if (params.orgUnitTagIds?.length) {
      // orgUnitTagIds refers to Tag.id values
      const taggedUnits = await this.prisma.orgUnitTag.findMany({
        where: {
          tagId: { in: params.orgUnitTagIds },
          deletedAt: null,
          orgUnit: { deletedAt: null },
        },
        select: { orgUnitId: true },
      });
      const orgUnitIds = [...new Set(taggedUnits.map((t) => t.orgUnitId))];
      if (orgUnitIds.length > 0) {
        const memberships = await this.prisma.userOrgUnitMembership.findMany({
          where: { orgUnitId: { in: orgUnitIds } },
          select: { userId: true },
        });
        for (const m of memberships) all.add(m.userId);
      }
    }

    if (params.userIds?.length) {
      for (const id of params.userIds) all.add(id);
    }

    return [...all];
  }

  async resolveUserIds(params: {
    orgUnitId?: string;
    includeDescendants?: boolean;
    tagNames?: string[];
    userIds?: string[];
  }): Promise<string[]> {
    const all = new Set<string>();

    if (params.orgUnitId) {
      let orgUnitIds: string[];

      if (params.includeDescendants) {
        orgUnitIds = await this.getSubtreeIds(params.orgUnitId);
      } else {
        orgUnitIds = [params.orgUnitId];
      }

      const memberships = await this.prisma.userOrgUnitMembership.findMany({
        where: { orgUnitId: { in: orgUnitIds }, orgUnit: { deletedAt: null } },
        select: { userId: true },
      });

      for (const m of memberships) all.add(m.userId);
    }

    if (params.tagNames && params.tagNames.length > 0) {
      const taggedUnits = await this.prisma.orgUnitTag.findMany({
        where: {
          deletedAt: null,
          tag: { name: { in: params.tagNames }, deletedAt: null },
          orgUnit: { deletedAt: null },
        },
        select: { orgUnitId: true },
      });

      const orgUnitIds = [...new Set(taggedUnits.map((t) => t.orgUnitId))];

      if (orgUnitIds.length > 0) {
        const memberships = await this.prisma.userOrgUnitMembership.findMany({
          where: { orgUnitId: { in: orgUnitIds } },
          select: { userId: true },
        });
        for (const m of memberships) all.add(m.userId);
      }
    }

    if (params.userIds && params.userIds.length > 0) {
      for (const id of params.userIds) all.add(id);
    }

    return [...all];
  }

  async getSubtreeIds(rootId: string): Promise<string[]> {
    const result = [rootId];
    let currentLevel = [rootId];

    while (currentLevel.length > 0) {
      const children = await this.prisma.orgUnit.findMany({
        where: { parentId: { in: currentLevel }, deletedAt: null },
        select: { id: true },
      });

      currentLevel = children.map((c) => c.id);
      result.push(...currentLevel);
    }

    return result;
  }

  // ─── Helpers ──────────────────────────────────────────────

  private async assertOrgUnitExists(orgUnitId: string) {
    const unit = await this.prisma.orgUnit.findUnique({
      where: { id: orgUnitId },
      select: { id: true, deletedAt: true },
    });
    if (!unit || unit.deletedAt)
      throw new NotFoundException('Org unit not found');
  }

  private async assertPositionExists(positionId: string) {
    const pos = await this.prisma.position.findUnique({
      where: { id: positionId },
      select: { id: true, deletedAt: true },
    });
    if (!pos || pos.deletedAt)
      throw new NotFoundException('Position not found');
  }

  private async assertUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, deletedAt: true },
    });
    if (!user || user.deletedAt) throw new NotFoundException('User not found');
  }
}
