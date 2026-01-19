import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { GlobalPermissionGuard } from "../rbac/guards/global-permission.guard";
import { RequirePermission } from "../rbac/decorators/require-permission.decorator";

@Controller("test")
export class TestController {
  @UseGuards(JwtAuthGuard, GlobalPermissionGuard)
  @RequirePermission("room.create")
  @Get("room-create")
  ok() {
    return { ok: true };
  }
}
