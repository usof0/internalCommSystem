import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GlobalPermissionGuard } from '../rbac/guards/global-permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { OrgUnitsService } from './org-units.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { AssignPositionRolesDto } from './dto/assign-position-roles.dto';

@UseGuards(JwtAuthGuard)
@Controller('org/positions')
export class PositionsController {
  constructor(private readonly org: OrgUnitsService) {}

  // ─── Positions ────────────────────────────────────────────

  @UseGuards(GlobalPermissionGuard)
  @RequirePermission('org.manage')
  @Post()
  createPosition(@Body() dto: CreatePositionDto) {
    return this.org.createPosition(dto);
  }

  @Get()
  listPositions() {
    return this.org.listPositions();
  }

  @UseGuards(GlobalPermissionGuard)
  @RequirePermission('org.manage')
  @Put(':positionId')
  updatePosition(
    @Param('positionId') positionId: string,
    @Body() dto: UpdatePositionDto,
  ) {
    return this.org.updatePosition(positionId, dto);
  }

  @UseGuards(GlobalPermissionGuard)
  @RequirePermission('org.manage')
  @Delete(':positionId')
  deletePosition(@Param('positionId') positionId: string) {
    return this.org.deletePosition(positionId);
  }

  // ─── Position ↔ Roles ────────────────────────────────────

  @UseGuards(GlobalPermissionGuard)
  @RequirePermission('org.manage')
  @Get(':positionId/roles')
  listPositionRoles(@Param('positionId') positionId: string) {
    return this.org.listPositionRoles(positionId);
  }

  @UseGuards(GlobalPermissionGuard)
  @RequirePermission('org.manage')
  @Post(':positionId/roles')
  assignRolesToPosition(
    @Param('positionId') positionId: string,
    @Body() dto: AssignPositionRolesDto,
  ) {
    return this.org.assignRolesToPosition(positionId, dto.roleIds);
  }

  @UseGuards(GlobalPermissionGuard)
  @RequirePermission('org.manage')
  @Delete(':positionId/roles/:roleId')
  removeRoleFromPosition(
    @Param('positionId') positionId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.org.removeRoleFromPosition(positionId, roleId);
  }
}
