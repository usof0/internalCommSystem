import type { ChatUser } from '../../../../types';

export function formatMessageTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

export function shouldShowMessageDateDivider(
  currentIsoDate: string,
  previousIsoDate?: string,
): boolean {
  if (!previousIsoDate) return true;
  return !isSameDay(new Date(currentIsoDate), new Date(previousIsoDate));
}

export function formatMessageDateDivider(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();

  if (isSameDay(date, now)) return 'Сегодня';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Вчера';

  const diffDays = Math.floor(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays > 1 && diffDays < 7) {
    return date.toLocaleDateString('ru-RU', { weekday: 'long' });
  }

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  }

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Short relative timestamp for the room list preview.
 * - Today → "14:32"
 * - This week → "Пн"
 * - Older → "15.03"
 */
export function formatRoomPreviewTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 7) {
    return date.toLocaleDateString('ru-RU', { weekday: 'short' });
  }

  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

/** Build a display name from a ChatUser, falling back to email. */
export function displayName(user: ChatUser): string {
  if (user.displayName) return user.displayName;
  const parts = [user.lastName, user.firstName].filter(Boolean);
  if (parts.length) return parts.join(' ');
  return user.email;
}

/** Build initials (≤2 chars) from a ChatUser. */
export function userInitials(user: ChatUser): string {
  if (user.displayName) {
    const words = user.displayName.trim().split(/\s+/);
    const a = words[0]?.[0] ?? '';
    const b = words[1]?.[0] ?? '';
    const result = (a + b).toUpperCase();
    if (result) return result;
  }
  const a = user.lastName?.[0] ?? '';
  const b = user.firstName?.[0] ?? '';
  const result = (a + b).toUpperCase();
  if (result) return result;
  return (user.email[0] ?? '?').toUpperCase();
}
