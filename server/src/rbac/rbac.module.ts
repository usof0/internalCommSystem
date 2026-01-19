import { Module } from "@nestjs/common";
import { RbacService } from "./rbac.service";
import { PrismaModule } from "src/prisma/prisma.module";
import { RbacController } from './rbac.controller';

@Module({
  imports: [PrismaModule],
  providers: [RbacService],
  exports: [RbacService],
  controllers: [RbacController],
})
export class RbacModule {}
