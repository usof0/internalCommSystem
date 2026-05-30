import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrgUnitsService } from './org-units.service';
import { ResolveGroupDto } from './dto/resolve-group.dto';

@UseGuards(JwtAuthGuard)
@Controller('org/groups')
export class OrgGroupsController {
  constructor(private readonly org: OrgUnitsService) {}

  @Post('resolve')
  async resolveGroup(@Body() dto: ResolveGroupDto) {
    const userIds = await this.org.resolveUserIds(dto);
    return { userIds, count: userIds.length };
  }
}
