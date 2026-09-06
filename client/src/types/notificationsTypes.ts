// ============================================================
// Shared / embed types
// ============================================================

/** The user who triggered the notification (actor). */
export interface NotificationActor {
  id: string;
  email: string;
  firstName?: string | null;
  secondName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
}

// ============================================================
// Core entity types
// ============================================================

/** Matches the Prisma NotificationEntityType enum. */
export type NotificationEntityType = 'ROOM' | 'TOPIC' | 'MESSAGE' | 'TASK' | 'EVENT' | 'POLL';

/**
 * Notification as returned to the requesting user.
 * The backend merges the Notification row with the caller's
 * NotificationRecipient row so per-user state is included inline.
 */
export interface Notification {
  id: string;
  /** Semantic type string set by the system (e.g. "task.assigned", "event.invited"). */
  type: string;
  title: string;
  body: string;
  actorId?: string | null;
  entityType: NotificationEntityType;
  entityId: string;
  createdAt: string;
  /** Embedded actor user (optional — may be omitted for system-generated notifications). */
  actor?: NotificationActor | null;
  // ----- Per-user state (from NotificationRecipient) -----
  /** When the notification was delivered to this user (null = not yet delivered). */
  deliveredAt?: string | null;
  /** When this user read the notification (null = unread). */
  readAt?: string | null;
  /** Whether this user has hidden the notification. */
  isHidden: boolean;
}

// ============================================================
// Request payload types
// ============================================================

/** Query params for GET /notifications */
export interface GetNotificationsQuery {
  page?: number;
  limit?: number;
  /** true → return only unread (readAt IS NULL) notifications */
  unreadOnly?: boolean;
}

/** Returned by POST /notifications/read-all */
export interface MarkAllReadResult {
  updatedCount: number;
}
