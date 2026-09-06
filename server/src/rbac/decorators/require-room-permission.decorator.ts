import { SetMetadata } from '@nestjs/common';

export const ROOM_PERMISSIONS_KEY = 'room_permissions';

export const RequireRoomPermission = (...permissionCodes: string[]) =>
  SetMetadata(ROOM_PERMISSIONS_KEY, permissionCodes);
