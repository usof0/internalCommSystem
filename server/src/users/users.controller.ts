import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GlobalPermissionGuard } from '../rbac/guards/global-permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';

@UseGuards(JwtAuthGuard, GlobalPermissionGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // ─── List / Read ──────────────────────────────────────────

  @RequirePermission('users.read')
  @Get()
  list(@Query() query: ListUsersQueryDto) {
    return this.users.findMany(query);
  }

  @Get('directory')
  directory(@Query() query: ListUsersQueryDto, @Req() req: any) {
    return this.users.searchDirectory(query, req.user.id);
  }

  @Get('me/profile')
  meProfile(@Req() req: any) {
    return this.users.getProfile(req.user.id);
  }

  @RequirePermission('users.read')
  @Get(':userId')
  async getById(@Param('userId') userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @RequirePermission('users.read')
  @Get(':userId/profile')
  async getUserProfileById(@Param('userId') userId: string) {
    const user = await this.users.getProfile(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ─── Create ───────────────────────────────────────────────

  @RequirePermission('users.create')
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.adminCreateUser(dto);
  }

  // ─── Update ───────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Put('me')
  updateMe(@Req() req: any, @Body() dto: UpdateUserDto) {
    console.log(dto);
    return this.users.updateUser(req.user.id, dto);
  }
  
  @RequirePermission('users.manage')
  @Put(':userId')
  update(@Param('userId') userId: string, @Body() dto: UpdateUserDto) {
    return this.users.updateUser(userId, dto);
  }

  // ─── Activate / Deactivate ────────────────────────────────

  @RequirePermission('users.manage')
  @Post(':userId/activate')
  activate(@Param('userId') userId: string) {
    return this.users.activate(userId);
  }

  @RequirePermission('users.manage')
  @Post(':userId/deactivate')
  deactivate(@Param('userId') userId: string) {
    return this.users.deactivate(userId);
  }

  // ─── Block / Unblock ──────────────────────────────────────

  @RequirePermission('users.manage')
  @Post(':userId/block')
  block(@Param('userId') userId: string) {
    return this.users.block(userId);
  }

  @RequirePermission('users.manage')
  @Post(':userId/unblock')
  unblock(@Param('userId') userId: string) {
    return this.users.unblock(userId);
  }

  // ─── Delete ───────────────────────────────────────────────

  @RequirePermission('users.delete')
  @Delete(':userId')
  remove(@Param('userId') userId: string) {
    return this.users.softDelete(userId);
  }

  // ─── Reset Password ──────────────────────────────────────

  @RequirePermission('users.password.reset')
  @Post(':userId/reset-password')
  resetPassword(
    @Param('userId') userId: string,
    @Body() dto: ResetUserPasswordDto,
  ) {
    return this.users.resetPassword(userId, dto.newPassword);
  }
}
