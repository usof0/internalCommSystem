import type { EventUser } from '../../../types';

export function displayEventUser(user: EventUser): string {
  if (user.displayName) return user.displayName;
  const parts = [user.lastName, user.firstName, user.secondName].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  return user.email;
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Returns true if the event end time has passed
export function isEventPast(timeEnd: string): boolean {
  return new Date(timeEnd) < new Date();
}

// Returns true if the event is currently ongoing
export function isEventOngoing(timeStart: string, timeEnd: string): boolean {
  const now = new Date();
  return new Date(timeStart) <= now && now <= new Date(timeEnd);
}
