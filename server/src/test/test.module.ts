import { Module } from "@nestjs/common";
import { TestController } from "./test.controller";
import { RbacModule } from "src/rbac/rbac.module";

@Module({
  imports: [RbacModule],
  controllers: [TestController]
})
export class TestModule {}

