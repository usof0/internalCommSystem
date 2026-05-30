// ============================================================
// Shared primitive / embed types
// ============================================================

/** Lightweight user summary embedded in every chat API response. */
export interface ChatUser {
  id: string;
  email: string;
  firstName?: string | null;
  secondName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
}

/** Short preview of the last message shown in the room/sidebar list. */
export interface MessagePreview {
  id: string;
  content: string;
  author: ChatUser;
  createdAt: string;
}

// ============================================================
// Room  (≡ "Conversation" in the API contract)
// ============================================================

/**
 * Whether a room is a two-person direct exchange or a named group.
 * NEW — requires a `type` column on the `Room` table (schema addition).
 */
export type RoomType = 'DIRECT' | 'GROUP';

/** Corresponds to the Room model in schema.prisma. */
export interface Room {
  id: string;
  creatorId: string;
  /** NEW — requires schema addition: `type RoomType` */
  type: RoomType;
  title: string;
  description?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  /** NEW — soft-archive; null means active. Requires `archivedAt DateTime?` on Room. */
  archivedAt?: string | null;
  creator?: ChatUser;
  /** Server-computed: unread message count for the current user. */
  unreadCount: number;
  lastMessage?: MessagePreview | null;
  /**
   * DIRECT rooms only — server-computed per requesting user.
   * The OTHER participant in the conversation. Used by the frontend
   * to display the contact's name/avatar instead of the stored room title.
   */
  directRecipient?: ChatUser | null;
}

// ============================================================
// Room Member  (≡ UserRoomMembership joined with User + RoomRole)
// ============================================================

/** Corresponds to UserRoomMembership joined with User + RoomRole. */
export interface RoomMember {
  userId: string;
  roomId: string;
  roomRoleId: string;
  joinedAt: string;
  user: ChatUser;
  roomRole: {
    id: string;
    name: string;
    description?: string | null;
  };
}

// ============================================================
// Topic
// ============================================================

/** Corresponds to the Topic model in schema.prisma. */
export interface Topic {
  id: string;
  roomId: string;
  creatorId: string;
  title: string;
  description?: string | null;
  /** true → ALL_MEMBERS scope; false → governed by TopicVisibilityScope. Server-computed. */
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  /** NEW — soft-archive. Requires `archivedAt DateTime?` on Topic. */
  archivedAt?: string | null;
  creator?: ChatUser;
  /**
   * Server-computed: whether the current user can see this topic given its
   * visibility scope. Included in list responses to filter UI.
   */
  currentUserCanSee?: boolean;
  /** Server-computed: unread message count for the current user in this topic. */
  unreadCount?: number;
}

// ============================================================
// Topic Visibility Scope
// (extends / replaces the simple TopicVisibility join table)
// ============================================================

/**
 * How a topic's visibility is governed.
 *
 * Schema addition required:
 *   - New enum `VisibilityScopeType` on `Topic` or in a `TopicVisibilityScope` table
 *   - New `TopicVisibilityMember`, `TopicVisibilityOrgUnit`, `TopicVisibilityOrgUnitTag`
 *     pivot tables (see CLAUDE.md API contract for full schema spec)
 */
export type VisibilityScopeType =
  | 'ALL_MEMBERS'       // topic.isPublic = true; no pivot rows needed
  | 'INCLUDE_MEMBERS'   // explicit userId whitelist
  | 'EXCLUDE_MEMBERS'   // all room members except listed userIds
  | 'ORG_UNIT'          // members belonging to specified OrgUnits
  | 'ORG_UNIT_TAG';     // members belonging to OrgUnits with specified Tags

/**
 * Full visibility scope configuration for a topic.
 * Returned by GET .../visibility; sent via PUT .../visibility.
 */
export interface TopicVisibilityScope {
  topicId: string;
  scopeType: VisibilityScopeType;
  /** Used when scopeType is INCLUDE_MEMBERS or EXCLUDE_MEMBERS. */
  memberIds?: string[];
  /** Used when scopeType is ORG_UNIT or ORG_UNIT_TAG. */
  orgUnitIds?: string[];
  /**
   * When true and scopeType is ORG_UNIT, include members of all descendant
   * org units recursively.
   */
  includeSubUnits?: boolean;
  /** Used when scopeType is ORG_UNIT_TAG. */
  orgUnitTagIds?: string[];
  updatedAt: string;
}

// ============================================================
// Message
// ============================================================

/** Corresponds to the Message model in schema.prisma. */
export interface Message {
  id: string;
  topicId: string;
  authorId: string;
  parentId?: string | null;
  content: string;
  /** Nesting level: 0 = root message in topic, >0 = thread reply. */
  level: number;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  author: ChatUser;
  /** Server-computed count of direct replies. */
  replyCount?: number;
  /**
   * Server-computed count of OTHER members who have read this message.
   * 0 = sent but not yet read by anyone else; >0 = read.
   */
  readByCount?: number;
}

// ============================================================
// Bulk operation result
// ============================================================

/** Returned by bulk-add and bulk-remove member operations. */
export interface BulkOperationResult {
  addedCount: number;
  skippedCount: number;
  addedMembers: RoomMember[];
  skipped: { userId: string; reason: string }[];
}

// ============================================================
// Request payload types — Rooms
// ============================================================

/** Query params for GET /rooms */
export interface RoomsQuery {
  page?: number;
  limit?: number;
  /** Full-text search against room title and description. */
  search?: string;
  /** Filter by room type. */
  type?: RoomType;
  /**
   * true  → include only archived rooms
   * false → include only active rooms (default)
   * omit  → include all
   */
  archived?: boolean;
}

export interface CreateRoomRequest {
  type: RoomType;
  /**
   * Required when type = 'GROUP'.
   * For 'DIRECT' rooms, if omitted the backend auto-generates
   * a title from the participants' names.
   */
  title?: string;
  description?: string;
  avatarUrl?: string;
  /**
   * Initial member user IDs (excluding the creator who is added automatically).
   * For DIRECT rooms exactly one userId must be provided.
   */
  memberIds?: string[];
  /**
   * Optional room role to assign to every added member.
   * Defaults to the system "MEMBER" role when omitted.
   */
  memberRoomRoleId?: string;
  /** Topics to create immediately inside the new room. */
  initialTopics?: {
    title: string;
    description?: string;
    visibilityScope?: SetTopicVisibilityRequest;
  }[];
}

export interface UpdateRoomRequest {
  title?: string;
  description?: string;
  avatarUrl?: string;
  /**
   * Pass an ISO-8601 string to archive, null to unarchive.
   * Omit to leave the current state unchanged.
   */
  archivedAt?: string | null;
}

// ============================================================
// Request payload types — Members
// ============================================================

export interface AddRoomMemberRequest {
  userId: string;
  /** Defaults to the system "MEMBER" role when omitted. */
  roomRoleId?: string;
}

/** Add several members at once. */
export interface AddRoomMembersRequest {
  members: AddRoomMemberRequest[];
}

export interface UpdateRoomMemberRequest {
  roomRoleId: string;
}

/**
 * Resolve members from org-unit / tag membership and add them to a room.
 * At least one of `orgUnitIds` or `orgUnitTagIds` must be provided.
 */
export interface BulkAddRoomMembersRequest {
  /** Add all current members of these OrgUnits. */
  orgUnitIds?: string[];
  /** Add all current members of OrgUnits that have any of these Tags. */
  orgUnitTagIds?: string[];
  /**
   * When true, recursively traverse child OrgUnits.
   * Applies to orgUnitIds and to OrgUnits resolved via orgUnitTagIds.
   * Default: false.
   */
  includeSubUnits?: boolean;
  /**
   * Room role to assign to every newly added member.
   * Defaults to the system "MEMBER" role when omitted.
   */
  roomRoleId?: string;
  /**
   * When true, perform the full resolution but do NOT write any records.
   * Returns what would be added/skipped. Useful for a confirmation preview.
   * Default: false.
   */
  dryRun?: boolean;
}

export interface BulkRemoveRoomMembersRequest {
  /** Remove members who belong to these OrgUnits. */
  orgUnitIds?: string[];
  /** Remove members who belong to OrgUnits with these Tags. */
  orgUnitTagIds?: string[];
  /** Remove these specific user IDs regardless of org membership. */
  userIds?: string[];
  /** See BulkAddRoomMembersRequest.dryRun. */
  dryRun?: boolean;
}

// ============================================================
// Request payload types — Topics
// ============================================================

export interface CreateTopicRequest {
  roomId: string;
  title: string;
  description?: string;
  visibilityScope?: SetTopicVisibilityRequest;
}

export interface UpdateTopicRequest {
  title?: string;
  description?: string;
  /**
   * Pass an ISO-8601 string to archive, null to unarchive.
   * Omit to leave unchanged.
   */
  archivedAt?: string | null;
}

// ============================================================
// Request payload types — Topic Visibility
// ============================================================

/** Replaces the entire visibility scope configuration (PUT semantics). */
export interface SetTopicVisibilityRequest {
  scopeType: VisibilityScopeType;
  /** Required when scopeType is INCLUDE_MEMBERS or EXCLUDE_MEMBERS. */
  memberIds?: string[];
  /** Required when scopeType is ORG_UNIT. */
  orgUnitIds?: string[];
  /** Applies to ORG_UNIT scope; default false. */
  includeSubUnits?: boolean;
  /** Required when scopeType is ORG_UNIT_TAG. */
  orgUnitTagIds?: string[];
}

/** Incrementally modifies lists within an existing visibility scope (PATCH semantics). */
export interface PatchTopicVisibilityRequest {
  addMemberIds?: string[];
  removeMemberIds?: string[];
  addOrgUnitIds?: string[];
  removeOrgUnitIds?: string[];
  addOrgUnitTagIds?: string[];
  removeOrgUnitTagIds?: string[];
}

// ============================================================
// Request payload types — Messages (existing, kept for completeness)
// ============================================================

export interface SendMessageRequest {
  topicId: string;
  parentId?: string;
  content: string;
}

export interface PinMessageRequest {
  isPinned: boolean;
}
