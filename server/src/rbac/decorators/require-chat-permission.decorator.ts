import { SetMetadata } from '@nestjs/common';

export const CHAT_PERMISSION_KEY = 'chat_permission';

export interface ChatPermissionMeta {
  /** Legacy/global code kept for backwards-compatible route metadata. */
  global: string;
  /** Room-level permission code enforced by ChatPermissionGuard. */
  room: string;
}

export const RequireChatPermission = (
  global: string,
  room: string,
): MethodDecorator & ClassDecorator =>
  SetMetadata(CHAT_PERMISSION_KEY, { global, room } satisfies ChatPermissionMeta);
