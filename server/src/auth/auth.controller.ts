import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { RejectPasswordResetDto } from './dto/reject-password-reset.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { GlobalPermissionGuard } from '../rbac/guards/global-permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';

const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME ?? 'refresh_token';

function isRefreshCookieSecure() {
  if (process.env.REFRESH_COOKIE_SECURE !== undefined) {
    return process.env.REFRESH_COOKIE_SECURE === 'true';
  }
  return process.env.NODE_ENV === 'production';
}

function getRefreshCookie(req: any): string | undefined {
  const cookieHeader = req.headers?.cookie as string | undefined;
  if (!cookieHeader) return undefined;

  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .map((part) => {
      const separator = part.indexOf('=');
      return separator === -1
        ? [part, '']
        : [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
    })
    .find(([name]) => name === REFRESH_COOKIE_NAME)?.[1];
}

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isRefreshCookieSecure(),
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: Number(process.env.JWT_REFRESH_COOKIE_MAX_AGE_MS ?? 30 * 24 * 60 * 60 * 1000),
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isRefreshCookieSecure(),
    sameSite: 'lax',
    path: '/api/v1/auth',
  });
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: any, @Res({ passthrough: true }) res: Response) {
    const session = await this.auth.login(dto, {
      userAgent: req.headers?.['user-agent'],
      ipAddress: req.ip,
    });
    setRefreshCookie(res, session.refreshToken);
    const { refreshToken: _refreshToken, ...body } = session;
    return body;
  }

  @Post('refresh')
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const session = await this.auth.refresh(getRefreshCookie(req), {
      userAgent: req.headers?.['user-agent'],
      ipAddress: req.ip,
    });
    setRefreshCookie(res, session.refreshToken);
    const { refreshToken: _refreshToken, ...body } = session;
    return body;
  }

  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.logout(getRefreshCookie(req));
    clearRefreshCookie(res);
    return result;
  }

  @Post('password-reset/request')
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.auth.requestPasswordReset(dto);
  }

  @UseGuards(JwtAuthGuard, GlobalPermissionGuard)
  @RequirePermission('users.create')
  @Get('registration-requests')
  listRegistrationRequests() {
    return this.auth.listRegistrationRequests();
  }

  @UseGuards(JwtAuthGuard, GlobalPermissionGuard)
  @RequirePermission('users.create')
  @Post('registration-requests/:id/approve')
  approveRegistrationRequest(@Req() req: any) {
    return this.auth.approveRegistrationRequest(req.params.id, req.user.id);
  }

  @UseGuards(JwtAuthGuard, GlobalPermissionGuard)
  @RequirePermission('users.create')
  @Post('registration-requests/:id/reject')
  rejectRegistrationRequest(@Req() req: any, @Body() dto: RejectPasswordResetDto) {
    return this.auth.rejectRegistrationRequest(req.params.id, req.user.id, dto.reason);
  }

  @UseGuards(JwtAuthGuard, GlobalPermissionGuard)
  @RequirePermission('users.password.reset')
  @Get('password-reset/requests')
  listPasswordResetRequests() {
    return this.auth.listPasswordResetRequests();
  }

  @UseGuards(JwtAuthGuard, GlobalPermissionGuard)
  @RequirePermission('users.password.reset')
  @Post('password-reset/requests/:id/approve')
  approvePasswordResetRequest(@Req() req: any) {
    return this.auth.approvePasswordResetRequest(req.params.id, req.user.id);
  }

  @UseGuards(JwtAuthGuard, GlobalPermissionGuard)
  @RequirePermission('users.password.reset')
  @Post('password-reset/requests/:id/reject')
  rejectPasswordResetRequest(@Req() req: any, @Body() dto: RejectPasswordResetDto) {
    return this.auth.rejectPasswordResetRequest(req.params.id, req.user.id, dto.reason);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    return this.users.getUserWithAuth(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
