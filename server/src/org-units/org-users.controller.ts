import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GlobalPermissionGuard } from '../rbac/guards/global-permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { RbacService } from '../rbac/rbac.service';
import { OrgUnitsService } from './org-units.service';
import { UserMembershipDto } from './dto/user-membership.dto';

@UseGuards(JwtAuthGuard)
@Controller('org/users')
export class OrgUsersController {
  constructor(
    private readonly org: OrgUnitsService,
    private readonly rbac: RbacService,
  ) {}

  @Get(':userId/memberships')
  async listUserMemberships(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Req() req: any,
  ) {
    const callerId = req.user.id;
    if (callerId !== userId) {
      const hasPermission = await this.rbac.userHasPermission(callerId, 'org.manage');
      if (!hasPermission) throw new ForbiddenException('Access denied');
    }
    return this.org.listUserMemberships(userId);
  }

  @UseGuards(GlobalPermissionGuard)
  @RequirePermission('org.manage')
  @Post(':userId/memberships')
  addUserToOrgUnit(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() dto: UserMembershipDto,
  ) {
    return this.org.addMember(dto.orgUnitId, { userId, positionId: dto.positionId });
  }

  @UseGuards(GlobalPermissionGuard)
  @RequirePermission('org.manage')
  @Delete(':userId/memberships')
  removeUserFromOrgUnit(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() dto: UserMembershipDto,
  ) {
    return this.org.removeMember(dto.orgUnitId, userId, dto.positionId);
  }
}
