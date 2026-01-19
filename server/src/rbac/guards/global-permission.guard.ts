import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { REQUIRE_PERMISSION_KEY } from "../decorators/require-permission.decorator";
import { RbacService } from "../rbac.service";

@Injectable()
export class GlobalPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly rbac: RbacService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string>(REQUIRE_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user as { id: string } | undefined;

    if (!user?.id) {
      throw new ForbiddenException("Authentication required");
    }

    const ok = await this.rbac.userHasPermission(user.id, required);
    if (!ok) throw new ForbiddenException("Insufficient permissions");

    return true;
  }
}
