import { Module } from '@nestjs/common';
import { TopicsController, TopicsReadController } from './topics.controller';
import { TopicsService } from './topics.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RbacModule } from 'src/rbac/rbac.module';
import { OrgUnitsModule } from 'src/org-units/org-units.module';
import { GatewayModule } from 'src/gateway/gateway.module';

@Module({
  imports: [PrismaModule, RbacModule, OrgUnitsModule, GatewayModule],
  controllers: [TopicsController, TopicsReadController],
  providers: [TopicsService],
  exports: [TopicsService],
})
export class TopicsModule {}
