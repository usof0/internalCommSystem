import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import { RbacService } from 'src/rbac/rbac.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../gateway/chat.gateway';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

type RefreshPayload = {
  sub: string;
  email: string;
  sid: string;
  iat: number;
  exp: number;
};

const PASSWORD_RESET_TTL_MS = 24 * 60 * 60 * 1000;
const REGISTRATION_REQUEST_RESPONSE = {
  ok: true,
  message: 'Заявка на регистрацию отправлена. Дождитесь подтверждения администратора.',
};

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly rbac: RbacService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly gateway: ChatGateway,
  ) {}

  private signAccessToken(payload: { sub: string; email: string }) {
    return this.jwt.sign(payload);
  }

  private signRefreshToken(payload: { sub: string; email: string; sid: string }) {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) throw new Error('JWT_REFRESH_SECRET is not configured');

    return this.jwt.sign(payload, {
      secret,
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '30d') as any,
    });
  }

  private getRefreshTokenExpiresAt(refreshToken: string) {
    const decoded = this.jwt.decode(refreshToken) as { exp?: number } | null;
    if (!decoded?.exp) throw new Error('Refresh token exp is missing');
    return new Date(decoded.exp * 1000);
  }

  private async buildSessionResponse(user: { id: string; email: string }) {
    const publicUser = await this.users.findById(user.id);
    if (!publicUser) throw new UnauthorizedException('Invalid credentials');
    if (!publicUser.isActive || publicUser.isBlocked)
      throw new ForbiddenException('Account is disabled');

    const accessToken = this.signAccessToken({
      sub: user.id,
      email: user.email,
    });
    const userRoles = await this.rbac.listUserRoles(user.id);
    const permissions = await this.rbac.getUserPermissionCodes(user.id);

    return {
      accessToken,
      user: publicUser,
      authz: {
        roles: userRoles,
        permissions: [...permissions],
      },
    };
  }

  private async createRefreshSession(
    user: { id: string; email: string },
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    const sessionId = randomUUID();
    const refreshToken = this.signRefreshToken({
      sub: user.id,
      email: user.email,
      sid: sessionId,
    });
    const tokenHash = await bcrypt.hash(refreshToken, 12);

    await this.prisma.refreshSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        tokenHash,
        userAgent: meta?.userAgent,
        ipAddress: meta?.ipAddress,
        expiresAt: this.getRefreshTokenExpiresAt(refreshToken),
      },
    });

    return refreshToken;
  }

  private async revokeRefreshSession(sessionId: string) {
    await this.prisma.refreshSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private generateTemporaryPassword() {
    return `Tmp-${randomBytes(9).toString('base64url')}1!`;
  }

  private async expireStalePasswordResetRequests() {
    await this.prisma.passwordResetRequest.updateMany({
      where: {
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          { expiresAt: { lte: new Date() } },
          { temporaryPasswordExpiresAt: { lte: new Date() } },
        ],
      },
      data: { status: 'EXPIRED' },
    });
  }

  private async findValidTemporaryPasswordRequest(userId: string, password: string) {
    await this.expireStalePasswordResetRequests();
    const requests = await this.prisma.passwordResetRequest.findMany({
      where: {
        userId,
        status: 'APPROVED',
        temporaryPasswordHash: { not: null },
        temporaryPasswordExpiresAt: { gt: new Date() },
      },
      orderBy: { processedAt: 'desc' },
    });

    for (const request of requests) {
      if (!request.temporaryPasswordHash) continue;
      const matches = await bcrypt.compare(password, request.temporaryPasswordHash);
      if (matches) return request;
    }
    return null;
  }

  private async findAdminIdsByPermission(permissionCode: string) {
    const admins = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        isBlocked: false,
        OR: [
          {
            roles: {
              some: {
                deletedAt: null,
                role: {
                  deletedAt: null,
                  permissions: {
                    some: {
                      deletedAt: null,
                      permission: {
                        code: permissionCode,
                        deletedAt: null,
                      },
                    },
                  },
                },
              },
            },
          },
          {
            orgUnitMemberships: {
              some: {
                position: {
                  deletedAt: null,
                  positionRoles: {
                    some: {
                      role: {
                        deletedAt: null,
                        permissions: {
                          some: {
                            deletedAt: null,
                            permission: {
                              code: permissionCode,
                              deletedAt: null,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    return admins.map((admin) => admin.id);
  }

  private findPasswordResetAdminIds() {
    return this.findAdminIdsByPermission('users.password.reset');
  }

  private findRegistrationRequestAdminIds() {
    return this.findAdminIdsByPermission('users.create');
  }

  private async getPasswordResetRequestForClient(requestId: string) {
    return this.prisma.passwordResetRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            secondName: true,
            lastName: true,
            displayName: true,
            isActive: true,
            isBlocked: true,
          },
        },
        processedBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  private async emitPasswordResetRequestCreated(requestId: string) {
    const [request, adminIds] = await Promise.all([
      this.getPasswordResetRequestForClient(requestId),
      this.findPasswordResetAdminIds(),
    ]);
    if (!request || adminIds.length === 0) return;

    for (const adminId of adminIds) {
      this.gateway.emitToUser(adminId, 'password-reset:request:new', request);
    }
  }

  private async getRegistrationRequestForClient(requestId: string) {
    return this.prisma.registrationRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        email: true,
        firstName: true,
        secondName: true,
        lastName: true,
        displayName: true,
        status: true,
        processedById: true,
        processedAt: true,
        rejectReason: true,
        createdUserId: true,
        createdAt: true,
        updatedAt: true,
        processedBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  private async emitRegistrationRequestCreated(requestId: string) {
    const [request, adminIds] = await Promise.all([
      this.getRegistrationRequestForClient(requestId),
      this.findRegistrationRequestAdminIds(),
    ]);
    if (!request || adminIds.length === 0) return;

    for (const adminId of adminIds) {
      this.gateway.emitToUser(adminId, 'registration:request:new', request);
    }
  }

  async register(dto: {
    email: string;
    password: string;
    firstName?: string;
    secondName?: string;
    lastName?: string;
    displayName?: string;
  }) {
    const email = normalizeEmail(dto.email);

    const existing = await this.users.findByEmail(email);
    if (existing) return REGISTRATION_REQUEST_RESPONSE;

    const existingRequest = await this.prisma.registrationRequest.findFirst({
      where: { email, status: 'PENDING' },
      select: { id: true },
    });
    if (existingRequest) return REGISTRATION_REQUEST_RESPONSE;

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const request = await this.prisma.registrationRequest.create({
      data: {
        email,
        passwordHash,
        firstName: dto.firstName?.trim() || undefined,
        secondName: dto.secondName?.trim() || undefined,
        lastName: dto.lastName?.trim() || undefined,
        displayName: dto.displayName?.trim() || undefined,
      },
      select: { id: true },
    });

    void this.emitRegistrationRequestCreated(request.id);

    return REGISTRATION_REQUEST_RESPONSE;
  }

  async listRegistrationRequests() {
    return this.prisma.registrationRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        email: true,
        firstName: true,
        secondName: true,
        lastName: true,
        displayName: true,
        status: true,
        processedById: true,
        processedAt: true,
        rejectReason: true,
        createdUserId: true,
        createdAt: true,
        updatedAt: true,
        processedBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async approveRegistrationRequest(requestId: string, adminId: string) {
    const request = await this.prisma.registrationRequest.findUnique({
      where: { id: requestId },
    });
    if (!request || request.status !== 'PENDING') {
      throw new UnauthorizedException('Registration request is not available');
    }

    const existing = await this.users.findByEmail(request.email);
    if (existing) {
      await this.prisma.registrationRequest.update({
        where: { id: request.id },
        data: {
          status: 'REJECTED',
          rejectReason: 'Аккаунт с таким email уже существует.',
          processedById: adminId,
          processedAt: new Date(),
        },
      });
      throw new ConflictException('Аккаунт с таким email уже существует.');
    }

    const deletedUser = await this.prisma.user.findUnique({
      where: { email: request.email },
      select: { id: true, deletedAt: true },
    });

    const user = deletedUser?.deletedAt
      ? await this.prisma.user.update({
          where: { id: deletedUser.id },
          data: {
            passwordHash: request.passwordHash,
            firstName: request.firstName,
            secondName: request.secondName,
            lastName: request.lastName,
            displayName: request.displayName,
            isActive: true,
            isBlocked: false,
            blockedAt: null,
            deletedAt: null,
          },
          select: {
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
          },
        })
      : await this.users.createUser({
          email: request.email,
          passwordHash: request.passwordHash,
          firstName: request.firstName ?? undefined,
          secondName: request.secondName ?? undefined,
          lastName: request.lastName ?? undefined,
          displayName: request.displayName ?? undefined,
        });

    await this.prisma.refreshSession.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.prisma.registrationRequest.update({
      where: { id: request.id },
      data: {
        status: 'APPROVED',
        processedById: adminId,
        processedAt: new Date(),
        createdUserId: user.id,
      },
    });

    return { ok: true, user };
  }

  async rejectRegistrationRequest(requestId: string, adminId: string, reason?: string) {
    const request = await this.prisma.registrationRequest.findUnique({
      where: { id: requestId },
      select: { id: true, status: true },
    });
    if (!request || request.status !== 'PENDING') {
      throw new UnauthorizedException('Registration request is not available');
    }

    await this.prisma.registrationRequest.update({
      where: { id: request.id },
      data: {
        status: 'REJECTED',
        rejectReason: reason?.trim() || undefined,
        processedById: adminId,
        processedAt: new Date(),
      },
    });

    return { ok: true };
  }

  async login(dto: { email: string; password: string }, meta?: { userAgent?: string; ipAddress?: string }) {
    const email = normalizeEmail(dto.email);

    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (user.deletedAt) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive || user.isBlocked)
      throw new ForbiddenException('Account is disabled');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    let mustChangePassword = false;
    if (!ok) {
      const resetRequest = await this.findValidTemporaryPasswordRequest(user.id, dto.password);
      if (!resetRequest) throw new UnauthorizedException('Invalid credentials');
      mustChangePassword = true;
    }

    const response = await this.buildSessionResponse(user);
    const refreshToken = await this.createRefreshSession(user, meta);
    return { ...response, refreshToken, mustChangePassword };
  }

  async refresh(refreshToken: string | undefined, meta?: { userAgent?: string; ipAddress?: string }) {
    if (!refreshToken) throw new UnauthorizedException('Refresh token missing');

    let payload: RefreshPayload;
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      }) as RefreshPayload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.prisma.refreshSession.findUnique({
      where: { id: payload.sid },
      include: { user: true },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Refresh session expired');
    }

    const matches = await bcrypt.compare(refreshToken, session.tokenHash);
    if (!matches) {
      await this.revokeRefreshSession(payload.sid);
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.revokeRefreshSession(payload.sid);
    const response = await this.buildSessionResponse(session.user);
    const nextRefreshToken = await this.createRefreshSession(session.user, meta);
    return { ...response, refreshToken: nextRefreshToken };
  }

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) return { ok: true };
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      }) as RefreshPayload;
      await this.revokeRefreshSession(payload.sid);
    } catch {
      // Logout must be idempotent even with an expired or malformed cookie.
    }
    return { ok: true };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.users.findByIdWithHash(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      const resetRequest = await this.findValidTemporaryPasswordRequest(userId, currentPassword);
      if (!resetRequest) throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.users.updatePasswordHash(userId, passwordHash);
    await this.prisma.refreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.prisma.passwordResetRequest.updateMany({
      where: { userId, status: 'APPROVED' },
      data: { status: 'USED', temporaryPasswordHash: null },
    });

    return { ok: true };
  }

  async requestPasswordReset(data: { email: string; reason?: string }) {
    await this.expireStalePasswordResetRequests();
    const email = normalizeEmail(data.email);
    const genericResponse = {
      ok: true,
      message: 'Если аккаунт существует, запрос на восстановление будет создан.',
    };

    const user = await this.users.findByEmail(email);
    if (!user || user.deletedAt || !user.isActive || user.isBlocked) {
      return genericResponse;
    }

    const existing = await this.prisma.passwordResetRequest.findFirst({
      where: {
        userId: user.id,
        status: { in: ['PENDING', 'APPROVED'] },
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });
    if (existing) return genericResponse;

    const request = await this.prisma.passwordResetRequest.create({
      data: {
        userId: user.id,
        requestedEmail: email,
        reason: data.reason?.trim() || undefined,
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
      select: { id: true },
    });

    void this.emitPasswordResetRequestCreated(request.id);

    return genericResponse;
  }

  async listPasswordResetRequests() {
    await this.expireStalePasswordResetRequests();
    return this.prisma.passwordResetRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            secondName: true,
            lastName: true,
            displayName: true,
            isActive: true,
            isBlocked: true,
          },
        },
        processedBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async approvePasswordResetRequest(requestId: string, adminId: string) {
    await this.expireStalePasswordResetRequests();
    const request = await this.prisma.passwordResetRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });
    if (!request || request.status !== 'PENDING' || request.expiresAt <= new Date()) {
      throw new UnauthorizedException('Password reset request is not available');
    }
    if (!request.user.isActive || request.user.isBlocked || request.user.deletedAt) {
      throw new ForbiddenException('User account is disabled');
    }

    const temporaryPassword = this.generateTemporaryPassword();
    const temporaryPasswordHash = await bcrypt.hash(temporaryPassword, 12);
    await this.prisma.passwordResetRequest.update({
      where: { id: request.id },
      data: {
        status: 'APPROVED',
        temporaryPasswordHash,
        temporaryPasswordExpiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        processedById: adminId,
        processedAt: new Date(),
      },
    });

    await this.prisma.refreshSession.updateMany({
      where: { userId: request.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { ok: true, temporaryPassword };
  }

  async rejectPasswordResetRequest(requestId: string, adminId: string, reason?: string) {
    await this.expireStalePasswordResetRequests();
    const request = await this.prisma.passwordResetRequest.findUnique({
      where: { id: requestId },
      select: { id: true, status: true },
    });
    if (!request || request.status !== 'PENDING') {
      throw new UnauthorizedException('Password reset request is not available');
    }

    await this.prisma.passwordResetRequest.update({
      where: { id: request.id },
      data: {
        status: 'REJECTED',
        rejectReason: reason?.trim() || undefined,
        processedById: adminId,
        processedAt: new Date(),
      },
    });

    return { ok: true };
  }
}
