import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrgUnitsService } from '../org-units/org-units.service';
import { RbacService } from '../rbac/rbac.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  secondName: true,
  lastName: true,
  displayName: true,
  avatarUrl: true,
  isActive: true,
  isBlocked: true,
  blockedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orgUnits: OrgUnitsService,
    private readonly rbac: RbacService,
  ) {}

  // ─── Queries ──────────────────────────────────────────────

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: USER_SELECT,
    });
    if (!user) return null;
    return user;    
  }

  async getUserWithAuth(userId: string) {
    const user = await this.findById(userId);
    const roles = await this.rbac.listUserRoles(userId) || null;
    const permissions = await this.rbac.getUserPermissionCodes(userId) || null;

    if (!user) return null;

    return {
      user,
      authz: {
        roles,
        permissions: [...permissions],
      },
    };
  }

  async getProfile(userId: string) {
    const result = await this.findById(userId);
    if (!result) throw new NotFoundException('User not found');

    const organizationMemberships = await this.orgUnits.listUserMemberships(userId);
    return { ...result, organizationMemberships };
  }

  async findByIdWithHash(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, passwordHash: true },
    });
  }

  async updatePasswordHash(userId: string, passwordHash: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async findMany(params: {
    search?: string;
    q?: string;
    isActive?: boolean;
    isBlocked?: boolean;
    cursor?: string;
    page?: number;
    limit?: number;
  }) {
    const { isActive, isBlocked, cursor, page = 1, limit = 20 } = params;
    const search = (params.search ?? params.q)?.trim();

    const where: any = { deletedAt: null };

    if (isActive !== undefined) where.isActive = isActive;
    if (isBlocked !== undefined) where.isBlocked = isBlocked;

    if (search) {
      const searchParts = search.split(/\s+/).filter(Boolean);
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { secondName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        ...(searchParts.length > 1
          ? [
              {
                AND: searchParts.map((part) => ({
                  OR: [
                    { firstName: { contains: part, mode: 'insensitive' } },
                    { secondName: { contains: part, mode: 'insensitive' } },
                    { lastName: { contains: part, mode: 'insensitive' } },
                    { displayName: { contains: part, mode: 'insensitive' } },
                  ],
                })),
              },
            ]
          : []),
      ];
    }

    const total = await this.prisma.user.count({ where });
    const items = await this.prisma.user.findMany({
      where,
      take: cursor ? limit + 1 : limit,
      ...(cursor
        ? { skip: 1, cursor: { id: cursor } }
        : { skip: (Math.max(page, 1) - 1) * limit }),
      orderBy: { createdAt: 'desc' },
      select: USER_SELECT,
    });

    const hasMore = items.length > limit;
    if (hasMore) items.pop();

    const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

    return { items, nextCursor, total, page, limit };
  }

  async searchDirectory(params: { search?: string; q?: string; limit?: number }, currentUserId?: string) {
    const search = (params.search ?? params.q)?.trim();
    const limit = Math.min(Math.max(params.limit ?? 50, 1), 50);

    const where: any = {
      deletedAt: null,
      isActive: true,
      isBlocked: false,
    };

    if (currentUserId) where.id = { not: currentUserId };

    if (search) {
      const searchParts = search.split(/\s+/).filter(Boolean);
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { secondName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        ...(searchParts.length > 1
          ? [
              {
                AND: searchParts.map((part) => ({
                  OR: [
                    { firstName: { contains: part, mode: 'insensitive' } },
                    { secondName: { contains: part, mode: 'insensitive' } },
                    { lastName: { contains: part, mode: 'insensitive' } },
                    { displayName: { contains: part, mode: 'insensitive' } },
                  ],
                })),
              },
            ]
          : []),
      ];
    }

    const items = await this.prisma.user.findMany({
      where,
      take: limit,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }, { email: 'asc' }],
      select: USER_SELECT,
    });

    return { items, total: items.length, page: 1, limit };
  }

  // ─── Commands ─────────────────────────────────────────────

  async createUser(data: {
    email: string;
    passwordHash: string;
    firstName?: string;
    secondName?: string;
    lastName?: string;
    displayName?: string;
    avatarUrl?: string;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        secondName: data.secondName,
        lastName: data.lastName,
        displayName: data.displayName,
      },
      select: {
        ...USER_SELECT,
      },
    });
  }

  async adminCreateUser(dto: {
    email: string;
    password: string;
    firstName?: string;
    secondName?: string;
    lastName?: string;
    displayName?: string;
  }) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.findByEmail(email);
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: dto.firstName,
        secondName: dto.secondName,
        lastName: dto.lastName,
        displayName: dto.displayName,
      },
      select: USER_SELECT,
    });
  }

  async updateUser(
    userId: string,
    data: { email?: string; firstName?: string; lastName?: string, displayName?: string },
  ) {
    const user = await this.assertUserExists(userId);

    if (data.email) {
      const email = data.email.trim().toLowerCase();
      const existing = await this.prisma.user.findFirst({
        where: { email, deletedAt: null, id: { not: userId } },
      });
      if (existing) throw new ConflictException('Email already in use');
      data.email = email;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: USER_SELECT,
    });
  }

  async activate(userId: string) {
    await this.assertUserExists(userId);
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
      select: USER_SELECT,
    });
  }

  async deactivate(userId: string) {
    await this.assertUserExists(userId);
    await this.revokeRefreshSessions(userId);
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: USER_SELECT,
    });
  }

  async block(userId: string) {
    await this.assertUserExists(userId);
    await this.revokeRefreshSessions(userId);
    return this.prisma.user.update({
      where: { id: userId },
      data: { isBlocked: true, blockedAt: new Date() },
      select: USER_SELECT,
    });
  }

  async unblock(userId: string) {
    await this.assertUserExists(userId);
    return this.prisma.user.update({
      where: { id: userId },
      data: { isBlocked: false, blockedAt: null },
      select: USER_SELECT,
    });
  }

  async softDelete(userId: string) {
    await this.assertUserExists(userId);
    await this.revokeRefreshSessions(userId);
    return this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
      select: USER_SELECT,
    });
  }

  private generateTemporaryPassword() {
    return `Tmp-${randomBytes(9).toString('base64url')}1!`;
  }

  async resetPassword(userId: string, newPassword?: string) {
    await this.assertUserExists(userId);
    const password = newPassword?.trim() || this.generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(password, 12);
    await this.revokeRefreshSessions(userId);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    return { ok: true, temporaryPassword: newPassword ? undefined : password };
  }

  // ─── Helpers ──────────────────────────────────────────────

  private async assertUserExists(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async revokeRefreshSessions(userId: string) {
    await this.prisma.refreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
