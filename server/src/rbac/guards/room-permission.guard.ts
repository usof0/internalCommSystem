import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROOM_PERMISSIONS_KEY } from '../decorators/require-room-permission.decorator';
import { RbacService } from '../rbac.service';

function extractRoomId(req: any): string | undefined {
  return (
    req?.params?.roomId ??
    req?.params?.id ??
    req?.body?.roomId ??
    req?.query?.roomId
  );
}

@Injectable()
export class RoomPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbac: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      ROOM_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no decorator, allow (same idea as global guard)
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();

    const userId = req?.user?.id;
    if (!userId) throw new ForbiddenException('Not authenticated');

    const roomId = extractRoomId(req);
    if (!roomId) throw new ForbiddenException('Room id is required');

    const codes = await this.rbac.getUserRoomPermissionCodes(userId, roomId);

    const ok = required.every((p) => codes.has(p));
    if (!ok) throw new ForbiddenException('Insufficient room permissions');

    return true;
  }
}
