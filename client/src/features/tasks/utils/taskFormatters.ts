import type { TaskWorkStatus, TaskReviewStatus, TaskUser } from '../../../types';

export function taskWorkStatusLabel(status: TaskWorkStatus): string {
  const labels: Record<TaskWorkStatus, string> = {
    PENDING: 'Ожидает',
    ACCEPTED: 'Принято',
    IN_PROGRESS: 'В работе',
    SUBMITTED: 'Сдано',
    DECLINED: 'Отказался',
  };
  return labels[status] ?? status;
}

export function taskReviewStatusLabel(status: TaskReviewStatus): string {
  const labels: Record<TaskReviewStatus, string> = {
    PENDING: 'Ожидает проверки',
    APPROVED: 'Одобрено',
    REJECTED: 'Отклонено',
  };
  return labels[status] ?? status;
}

export function taskWorkStatusClass(status: TaskWorkStatus): string {
  const classes: Record<TaskWorkStatus, string> = {
    PENDING: 'status-gray',
    ACCEPTED: 'status-blue',
    IN_PROGRESS: 'status-blue',
    SUBMITTED: 'status-yellow',
    DECLINED: 'status-red',
  };
  return classes[status] ?? '';
}

export function taskReviewStatusClass(status: TaskReviewStatus): string {
  const classes: Record<TaskReviewStatus, string> = {
    PENDING: 'status-yellow',
    APPROVED: 'status-green',
    REJECTED: 'status-red',
  };
  return classes[status] ?? '';
}

export function displayTaskUser(user: TaskUser): string {
  if (user.displayName) return user.displayName;
  const parts = [user.lastName, user.firstName, user.secondName].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  return user.email;
}

export function taskUserInitials(user: TaskUser): string {
  const f = user.firstName?.[0] ?? '';
  const l = user.lastName?.[0] ?? '';
  const init = (f + l).toUpperCase();
  return init || user.email[0].toUpperCase();
}
