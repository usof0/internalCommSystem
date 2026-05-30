import { Module } from '@nestjs/common';
import { OrgUnitsController } from './org-units.controller';
import { PositionsController } from './positions.controller';
import { OrgTagsController } from './org-tags.controller';
import { OrgUsersController } from './org-users.controller';
import { OrgGroupsController } from './org-groups.controller';
import { OrgUnitsService } from './org-units.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RbacModule } from 'src/rbac/rbac.module';

@Module({
  imports: [PrismaModule, RbacModule],
  controllers: [
    OrgUnitsController,
    PositionsController,
    OrgTagsController,
    OrgUsersController,
    OrgGroupsController,
  ],
  providers: [OrgUnitsService],
  exports: [OrgUnitsService],
})
export class OrgUnitsModule {}
