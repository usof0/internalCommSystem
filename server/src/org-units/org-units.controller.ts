import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Post,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GlobalPermissionGuard } from '../rbac/guards/global-permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { OrgUnitsService } from './org-units.service';
import { CreateOrgUnitDto } from './dto/create-org-unit.dto';
import { UpdateOrgUnitDto } from './dto/update-org-unit.dto';
import { TreeQueryDto } from './dto/tree-query.dto';
import { AssignTagsDto } from './dto/assign-tags.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { ChangeMemberPositionDto } from './dto/change-member-position.dto';
import { RemoveMemberDto } from './dto/remove-member.dto';

@UseGuards(JwtAuthGuard)
@Controller('org/units')
export class OrgUnitsController {
  constructor(private readonly org: OrgUnitsService) {}

  // ─── Org Units ────────────────────────────────────────────

  @Get()
  listOrgUnits(@Query('parentId') parentId?: string) {
    return this.org.listOrgUnits(parentId);
  }

  @Get('tree')
  getOrgUnitTree(@Query() query: TreeQueryDto) {
    return this.org.getOrgUnitTree(query);
  }

  @Get(':orgUnitId')
  getOrgUnit(@Param('orgUnitId', new ParseUUIDPipe()) orgUnitId: string) {
    return this.org.getOrgUnit(orgUnitId);
  }

  @UseGuards(GlobalPermissionGuard)
  @RequirePermission('org.manage')
  @Post()
  createOrgUnit(@Body() dto: CreateOrgUnitDto) {
    return this.org.createOrgUnit(dto);
  }

  @UseGuards(GlobalPermissionGuard)
  @RequirePermission('org.manage')
  @Put(':orgUnitId')
  updateOrgUnit(
    @Param('orgUnitId') orgUnitId: string,
    @Body() dto: UpdateOrgUnitDto,
  ) {
    return this.org.updateOrgUnit(orgUnitId, dto);
  }

  @UseGuards(GlobalPermissionGuard)
  @RequirePermission('org.manage')
  @Delete(':orgUnitId')
  deleteOrgUnit(@Param('orgUnitId', new ParseUUIDPipe()) orgUnitId: string) {
    return this.org.deleteOrgUnit(orgUnitId);
  }

  // ─── Org Unit Members ─────────────────────────────────────

  @Get(':orgUnitId/members')
  listMembers(@Param('orgUnitId', new ParseUUIDPipe()) orgUnitId: string) {
    return this.org.listOrgUnitMembers(orgUnitId);
  }

  @UseGuards(GlobalPermissionGuard)
  @RequirePermission('org.manage')
  @Post(':orgUnitId/members')
  addMember(
    @Param('orgUnitId') orgUnitId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.org.addMember(orgUnitId, dto);
  }

  @UseGuards(GlobalPermissionGuard)
  @RequirePermission('org.manage')
  @Put(':orgUnitId/members/:userId')
  changeMemberPosition(
    @Param('orgUnitId', new ParseUUIDPipe()) orgUnitId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() dto: ChangeMemberPositionDto,
  ) {
    return this.org.changeMemberPosition(orgUnitId, userId, dto);
  }

  @UseGuards(GlobalPermissionGuard)
  @RequirePermission('org.manage')
  @Delete(':orgUnitId/members/:userId')
  removeMember(
    @Param('orgUnitId', new ParseUUIDPipe()) orgUnitId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() dto: RemoveMemberDto,
  ) {
    return this.org.removeMember(orgUnitId, userId, dto.positionId);
  }

  // ─── OrgUnit ↔ Tags ──────────────────────────────────────

  @Get(':orgUnitId/tags')
  listOrgUnitTags(@Param('orgUnitId', new ParseUUIDPipe()) orgUnitId: string) {
    return this.org.listOrgUnitTags(orgUnitId);
  }

  @UseGuards(GlobalPermissionGuard)
  @RequirePermission('org.manage')
  @Post(':orgUnitId/tags')
  assignTagsToOrgUnit(
    @Param('orgUnitId', new ParseUUIDPipe()) orgUnitId: string,
    @Body() dto: AssignTagsDto,
  ) {
    return this.org.assignTagsToOrgUnit(orgUnitId, dto.tagIds);
  }

  @UseGuards(GlobalPermissionGuard)
  @RequirePermission('org.manage')
  @Post(':orgUnitId/tags/:tagId')
  addTagToOrgUnit(
    @Param('orgUnitId', new ParseUUIDPipe()) orgUnitId: string,
    @Param('tagId', new ParseUUIDPipe()) tagId: string,
  ) {
    return this.org.addTagToOrgUnit(orgUnitId, tagId);
  }

  @UseGuards(GlobalPermissionGuard)
  @RequirePermission('org.manage')
  @Delete(':orgUnitId/tags/:tagId')
  removeTagFromOrgUnit(
    @Param('orgUnitId', new ParseUUIDPipe()) orgUnitId: string,
    @Param('tagId', new ParseUUIDPipe()) tagId: string,
  ) {
    return this.org.removeTagFromOrgUnit(orgUnitId, tagId);
  }
}
