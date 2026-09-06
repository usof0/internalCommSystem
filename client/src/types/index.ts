export type { RegisterRequest, RegisterRequestResponse, LoginRequest, AuthzInfo, SessionResponse, MeResponse, RequestPasswordResetRequest, PasswordResetRequestItem, PasswordResetRequestStatus, ApprovePasswordResetResponse, ChangePasswordRequest, RegistrationRequestItem, RegistrationRequestStatus, ApproveRegistrationRequestResponse } from './authTypes';

export type { User, UserProfile, ProfileResponse, GetUsersQuery, UpdateMeRequest, UpdateUserRequest, CreateUserRequest, ResetPasswordResponse } from './usersTypes';

export type { OrganizationMembership, OrgUnit, OrgUnitNode, OrgTreeResponse, OrgUnitMember, OrgUnitMembersResponse, CreateOrgUnitRequest, UpdateOrgUnitRequest, AddOrgUnitMemberRequest, ChangeMemberPositionRequest, RemoveMemberRequest, Tag, CreateTagRequest, UpdateTagRequest, Position, PositionRole, CreatePositionRequest, UpdatePositionRequest, AssignPositionRolesRequest } from './orgTypes'

export type { Permission, Role, RoleWithPermissions, CreateRoleRequest, UpdateRoleRequest, AddRolePermissionsRequest, AssignUserRolesRequest, UserRoleRow, OkResponse, RoomPermission, RoomRole, CreateRoomRoleRequest, UpdateRoomRoleRequest, AddRoomRolePermissionsRequest } from './rbacTypes';

export type {
  EventUser,
  EventParticipant,
  EventSummary,
  Event,
  CreateEventRequest,
  UpdateEventRequest,
  InviteParticipantsRequest,
  ConfirmAttendanceRequest,
  GetEventsQuery,
} from './eventsTypes';

export type {
  TaskWorkStatus,
  TaskReviewStatus,
  TaskUser,
  TaskParticipant,
  TaskSummary,
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  AssignParticipantsRequest,
  UpdateWorkStatusRequest,
  UpdateReviewRequest,
  GetTasksQuery,
} from './tasksTypes';

export type {
  PollUser,
  PollOption,
  PollParticipant,
  PollSummary,
  Poll,
  CreatePollRequest,
  UpdatePollRequest,
  InvitePollParticipantsRequest,
  VoteRequest,
  GetPollsQuery,
} from './pollsTypes';

export type {
  NotificationEntityType,
  NotificationActor,
  Notification,
  GetNotificationsQuery,
  MarkAllReadResult,
} from './notificationsTypes';

export type {
  ChatUser,
  MessagePreview,
  RoomType,
  Room,
  RoomMember,
  Topic,
  VisibilityScopeType,
  TopicVisibilityScope,
  Message,
  BulkOperationResult,
  // Room request types
  RoomsQuery,
  CreateRoomRequest,
  UpdateRoomRequest,
  // Member request types
  AddRoomMemberRequest,
  AddRoomMembersRequest,
  UpdateRoomMemberRequest,
  BulkAddRoomMembersRequest,
  BulkRemoveRoomMembersRequest,
  // Topic request types
  CreateTopicRequest,
  UpdateTopicRequest,
  // Visibility request types
  SetTopicVisibilityRequest,
  PatchTopicVisibilityRequest,
  // Message request types
  SendMessageRequest,
  PinMessageRequest,
} from './chatTypes';


export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}














// export interface Role {
//   id: string;
//   name: string;
//   permissions: Permission[];
// }

// export interface Permission {
//   id: string;
//   key: string;
//   name: string;
//   description?: string;
// }

// export interface Room {
//   id: string;
//   title: string;
//   description?: string;
//   avatar?: string;
//   lastMessage?: Message;
//   unreadCount: number;
//   permissions: RoomPermission[];
// }

// export interface RoomPermission {
//   userId: string;
//   canRead: boolean;
//   canWrite: boolean;
//   canManageTopics: boolean;
//   canManageParticipants: boolean;
// }

// export interface Topic {
//   id: string;
//   roomId: string;
//   title: string;
//   description?: string;
//   createdAt: string;
//   createdBy: User;
// }

// export interface Message {
//   id: string;
//   roomId: string;
//   topicId?: string;
//   parentId?: string;
//   content: string;
//   author: User;
//   createdAt: string;
//   updatedAt?: string;
//   isPinned: boolean;
//   replies?: Message[];
//   replyCount?: number;
// }

// export interface Task {
//   id: string;
//   title: string;
//   description: string;
//   createdBy: User;
//   createdAt: string;
//   dueDate?: string;
//   workStatus: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
//   reviewStatus: 'pending' | 'approved' | 'rejected' | 'needs_revision';
//   participants: TaskParticipant[];
// }

// export interface TaskParticipant {
//   id: string;
//   taskId: string;
//   user: User;
//   organizationUnit?: OrganizationUnit;
//   assignedAt: string;
//   workStatus: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
//   reviewStatus: 'pending' | 'approved' | 'rejected' | 'needs_revision';
//   completedAt?: string;
//   reviewedAt?: string;
// }

// export interface Event {
//   id: string;
//   title: string;
//   description: string;
//   location?: string;
//   startDate: string;
//   endDate: string;
//   capacity?: number;
//   createdBy: User;
//   createdAt: string;
//   participants: EventParticipant[];
// }

// export interface EventParticipant {
//   id: string;
//   eventId: string;
//   user: User;
//   status: 'invited' | 'accepted' | 'declined';
//   invitedAt: string;
//   respondedAt?: string;
// }

// export interface Poll {
//   id: string;
//   question: string;
//   description?: string;
//   createdBy: User;
//   createdAt: string;
//   endsAt?: string;
//   options: PollOption[];
//   myVote?: string;
//   hasVoted: boolean;
// }

// export interface PollOption {
//   id: string;
//   pollId: string;
//   text: string;
//   voteCount: number;
//   percentage: number;
// }

// export interface Notification {
//   id: string;
//   type: 'message' | 'task' | 'event' | 'poll';
//   title: string;
//   message: string;
//   entityId?: string;
//   read: boolean;
//   createdAt: string;
// }

// export interface OrganizationUnit {
//   id: string;
//   name: string;
//   parentId?: string;
//   children?: OrganizationUnit[];
//   organizationId: string;
// }

// export interface Tag {
//   id: string;
//   name: string;
//   color?: string;
//   organizationId: string;
// }

// export interface Position {
//   id: string;
//   name: string;
//   organizationId: string;
// }
