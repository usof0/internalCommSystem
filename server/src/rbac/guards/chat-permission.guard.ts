import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  CHAT_PERMISSION_KEY,
  ChatPermissionMeta,
} from '../decorators/require-chat-permission.decorator';
import { RbacService } from '../rbac.service';

function extractRoomId(req: any): string | undefined {
  return (
    req?.params?.roomId ??
    req?.params?.id ??
    req?.body?.roomId ??
    req?.query?.roomId
  );
}

/**
 * Guard for actions inside an existing chat room.
 * Chat room actions are intentionally isolated from global system RBAC:
 * only the user's membership role in this room can grant the permission.
 *
 * Requires @RequireChatPermission(globalCode, roomCode) decorator on the handler.
 * The global code is kept for backwards-compatible metadata, but is not used here.
 */
@Injectable()
export class ChatPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbac: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.getAllAndOverride<ChatPermissionMeta>(
      CHAT_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!meta) return true;

    const req = context.switchToHttp().getRequest();
    const userId: string | undefined = req?.user?.id;

    if (!userId) throw new ForbiddenException('Not authenticated');

    const roomId = extractRoomId(req);
    if (roomId) {
      const hasRoom = await this.rbac.userHasRoomPermission(
        userId,
        roomId,
        meta.room,
      );
      if (hasRoom) return true;
    }

    throw new ForbiddenException('Insufficient permissions');
  }
}
