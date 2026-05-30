import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { RbacModule } from './rbac/rbac.module';
// import { TestController } from './test/test.controller';
// import { TestModule } from './test/test.module';
import { RoomsModule } from './rooms/rooms.module';
import { TopicsModule } from './topics/topics.module';
import { MessagesModule } from './messages/messages.module';
import { OrgUnitsModule } from './org-units/org-units.module';
import { TasksModule } from './tasks/tasks.module';
import { EventsModule } from './events/events.module';
import { PollsModule } from './polls/polls.module';
import { NotificationsModule } from './notifications/notifications.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    PrismaModule,
    RbacModule,
    OrgUnitsModule,
    // TestModule,
    RoomsModule,
    TopicsModule,
    MessagesModule,
    TasksModule,
    EventsModule,
    PollsModule,
    NotificationsModule,
    GatewayModule,
  ],
  // controllers: [TestController],
  providers: [],
})
export class AppModule {}
