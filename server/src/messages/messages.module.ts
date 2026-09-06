import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TopicsModule } from 'src/topics/topics.module';
import { RbacModule } from 'src/rbac/rbac.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { GatewayModule } from 'src/gateway/gateway.module';

@Module({
  imports: [PrismaModule, TopicsModule, RbacModule, NotificationsModule, GatewayModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
