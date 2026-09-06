import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { OrgUnitsModule } from 'src/org-units/org-units.module';
import { RbacModule } from 'src/rbac/rbac.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [PrismaModule, OrgUnitsModule, RbacModule, NotificationsModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
