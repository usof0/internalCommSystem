import { Module } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RbacController } from './rbac.controller';
import { RoomRbacController } from './room-rbac.controller';
import { ChatPermissionGuard } from './guards/chat-permission.guard';

@Module({
  imports: [PrismaModule],
  providers: [RbacService, ChatPermissionGuard],
  exports: [RbacService, ChatPermissionGuard],
  controllers: [RbacController, RoomRbacController],
})
export class RbacModule {}
