import { Module } from '@nestjs/common';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { OrgUnitsModule } from 'src/org-units/org-units.module';
import { RbacModule } from 'src/rbac/rbac.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [PrismaModule, OrgUnitsModule, RbacModule, NotificationsModule],
  controllers: [PollsController],
  providers: [PollsService],
})
export class PollsModule {}
