import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RbacModule } from 'src/rbac/rbac.module';
import { OrgUnitsModule } from 'src/org-units/org-units.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { GatewayModule } from 'src/gateway/gateway.module';

@Module({
  imports: [PrismaModule, RbacModule, OrgUnitsModule, NotificationsModule, GatewayModule],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
