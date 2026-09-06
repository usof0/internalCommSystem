import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersController } from './users.controller';
import { RbacModule } from 'src/rbac/rbac.module';
import { OrgUnitsModule } from 'src/org-units/org-units.module';

@Module({
  imports: [PrismaModule, RbacModule, OrgUnitsModule],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
