import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GlobalPermissionGuard } from '../rbac/guards/global-permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { OrgUnitsService } from './org-units.service';
import { CreateTagDto } from './dto/create-tag.dto';


@UseGuards(JwtAuthGuard)
@Controller('org/tags')
export class OrgTagsController {
  constructor(private readonly org: OrgUnitsService) {}

  // ─── Tags ─────────────────────────────────────────────────

  @UseGuards(GlobalPermissionGuard)
  @RequirePermission('org.manage')
  @Post()
  createTag(@Body() dto: CreateTagDto) {
    return this.org.createTag(dto);
  }

  @Get()
  listTags() {
    return this.org.listTags();
  }

  @UseGuards(GlobalPermissionGuard)
  @RequirePermission('org.manage')
  @Delete(':tagId')
  deleteTag(@Param('tagId', new ParseUUIDPipe()) tagId: string) {
    return this.org.deleteTag(tagId);
  }
}
