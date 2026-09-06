import type { PollOption, PollUser } from '../../../../types';

// Poll accents are derived from the app base palette so they stay theme-safe.
export const POLL_COLORS = [
  'var(--primary)',
  'var(--success)',
  'var(--warning)',
  'var(--secondary)',
  'var(--danger)',
  'color-mix(in srgb, var(--primary) 68%, var(--warning))',
  'color-mix(in srgb, var(--secondary) 72%, var(--success))',
] as const;

export function pollOptionColor(index: number): string {
  return POLL_COLORS[index % POLL_COLORS.length];
}

export function displayPollUser(user: PollUser): string {
  if (user.displayName) return user.displayName;
  const parts = [user.lastName, user.firstName, user.secondName].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  return user.email;
}

export function totalVotes(options: PollOption[]): number {
  return options.reduce((sum, o) => sum + o.chosen, 0);
}

export function optionPct(option: PollOption, total: number): number {
  return total > 0 ? (option.chosen / total) * 100 : 0;
}

export function winnerOptionId(options: PollOption[]): string | null {
  const max = Math.max(...options.map((o) => o.chosen));
  if (max === 0) return null;
  const winner = options.find((o) => o.chosen === max);
  return winner?.id ?? null;
}

export function formatPollDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
