// Enums matching Prisma schema exactly
export type TaskWorkStatus = 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'DECLINED';
export type TaskReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// Minimal user shape embedded in task responses
export interface TaskUser {
  id: string;
  email: string;
  firstName?: string | null;
  secondName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
}

// Participant record (composite PK: userId + taskId) with embedded user
export interface TaskParticipant {
  userId: string;
  taskId: string;
  workStatus: TaskWorkStatus;
  reviewStatus: TaskReviewStatus;
  rating?: number | null;
  submittedAt?: string | null;
  isLate?: boolean;
  user: TaskUser;
}

// Light shape returned by list endpoints
export interface TaskSummary {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  creator: TaskUser;
  participantCount: number;
  // Present when the current user is a participant (returned by GET /tasks/my)
  myParticipation?: TaskParticipant | null;
}

// Full shape returned by GET /tasks/:taskId
export interface Task {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  creator: TaskUser;
  participants: TaskParticipant[];
  canViewParticipants?: boolean;
}

// ── Request types ──────────────────────────────────────────────────────────────

export interface CreateTaskRequest {
  title: string;
  description: string;
  dueDate?: string | null;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  dueDate?: string | null;
}

export interface AssignParticipantsRequest {
  userIds?: string[];
  orgUnitIds?: string[];
  orgUnitTagIds?: string[];
  includeSubUnits?: boolean;
}

export interface UpdateWorkStatusRequest {
  workStatus: TaskWorkStatus;
}

export interface UpdateReviewRequest {
  reviewStatus: TaskReviewStatus;
  rating?: number | null;
}

export interface GetTasksQuery {
  page?: number;
  limit?: number;
  search?: string;
}
