import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GlobalPermissionGuard } from '../rbac/guards/global-permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { ListUsersDto } from './dto/list-users.dto';

@UseGuards(JwtAuthGuard, GlobalPermissionGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @RequirePermission('users.list')
  @Get()
  list(@Query() query: ListUsersDto) {
    return this.users.findMany(query);
  }

  @RequirePermission('users.read')
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.users.findById(id);
  }
}
