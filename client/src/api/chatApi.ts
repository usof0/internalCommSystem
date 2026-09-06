import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './baseQueryWithAuth';
import type { PageResult } from '../types';
import type { RoomRole } from '../types/rbacTypes';
import type {
  Room,
  RoomMember,
  Topic,
  TopicVisibilityScope,
  Message,
  BulkOperationResult,
  // Room
  RoomsQuery,
  CreateRoomRequest,
  UpdateRoomRequest,
  // Members
  AddRoomMemberRequest,
  AddRoomMembersRequest,
  UpdateRoomMemberRequest,
  BulkAddRoomMembersRequest,
  BulkRemoveRoomMembersRequest,
  // Topics
  CreateTopicRequest,
  UpdateTopicRequest,
  // Visibility
  SetTopicVisibilityRequest,
  PatchTopicVisibilityRequest,
  // Messages
  SendMessageRequest,
  PinMessageRequest,
} from '../types';

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: baseQueryWithAuth,
  refetchOnMountOrArgChange: true,
  tagTypes: [
    'Rooms',
    'Room',
    'RoomMembers',
    'Topics',
    'Topic',
    'TopicVisibility',
    'Messages',
    'Thread',
  ],
  endpoints: (builder) => ({

    // ================================================================
    // Rooms  (Conversations)
    // ================================================================

    /**
     * GET /rooms
     * List rooms the current user is a member of.
     * Supports search, type filter, archive filter, and page/limit pagination.
     */
    getRooms: builder.query<PageResult<Room>, RoomsQuery | void>({
      query: (params) => ({
        url: '/rooms',
        params: params ?? {},
      }),
      providesTags: (result) =>
        result
          ? ['Rooms', ...result.items.map((r) => ({ type: 'Room' as const, id: r.id }))]
          : ['Rooms'],
    }),

    /**
     * GET /rooms/:roomId
     * Full room details.
     */
    getRoomById: builder.query<Room, string>({
      query: (roomId) => `/rooms/${roomId}`,
      providesTags: (_res, _err, id) => [{ type: 'Room', id }],
    }),

    /**
     * POST /rooms
     * Create a DIRECT or GROUP room.
     * For DIRECT rooms the backend deduplicates: returns 200 + existing room
     * if the pair already has a direct room.
     */
    createRoom: builder.mutation<Room, CreateRoomRequest>({
      query: (body) => ({
        url: '/rooms',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Rooms'],
    }),

    /**
     * PATCH /rooms/:roomId
     * Rename, update description/avatar, archive/unarchive.
     * Only OWNER or ADMIN room role (or global CHAT_UPDATE_ROOM permission) may call this.
     */
    updateRoom: builder.mutation<Room, { roomId: string; body: UpdateRoomRequest }>({
      query: ({ roomId, body }) => ({
        url: `/rooms/${roomId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_res, _err, { roomId }) => ['Rooms', { type: 'Room', id: roomId }],
    }),

    /**
     * DELETE /rooms/:roomId
     * Soft-delete (sets deletedAt). Only the room creator or a user with
     * global CHAT_DELETE_ROOM permission may call this.
     * Returns 204 No Content.
     */
    deleteRoom: builder.mutation<void, string>({
      query: (roomId) => ({
        url: `/rooms/${roomId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, roomId) => ['Rooms', { type: 'Room', id: roomId }],
    }),

    // ================================================================
    // Members
    // ================================================================

    /**
     * GET /rooms/:roomId/members
     * List all members of a room with their roles.
     */
    getRoomMembers: builder.query<RoomMember[], string>({
      query: (roomId) => `/rooms/${roomId}/members`,
      providesTags: (_res, _err, roomId) => [{ type: 'RoomMembers', id: roomId }],
    }),

    getAssignableRoomRoles: builder.query<Pick<RoomRole, 'id' | 'name' | 'description'>[], string>({
      query: (roomId) => `/rooms/${roomId}/member-roles`,
      providesTags: ['RoomMembers'],
    }),

    /**
     * POST /rooms/:roomId/members
     * Add a single member with an optional room role.
     * Requires CHAT_MANAGE_MEMBERS permission or OWNER/ADMIN room role.
     */
    addRoomMember: builder.mutation<RoomMember, { roomId: string; body: AddRoomMemberRequest }>({
      query: ({ roomId, body }) => ({
        url: `/rooms/${roomId}/members`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, { roomId }) => [{ type: 'RoomMembers', id: roomId }],
    }),

    /**
     * POST /rooms/:roomId/members/batch
     * Add multiple explicit members in one request.
     * Requires CHAT_MANAGE_MEMBERS permission or OWNER/ADMIN room role.
     */
    addRoomMembers: builder.mutation<
      RoomMember[],
      { roomId: string; body: AddRoomMembersRequest }
    >({
      query: ({ roomId, body }) => ({
        url: `/rooms/${roomId}/members/batch`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, { roomId }) => [{ type: 'RoomMembers', id: roomId }],
    }),

    /**
     * PATCH /rooms/:roomId/members/:userId
     * Update the room role of an existing member.
     * Requires OWNER/ADMIN room role.
     */
    updateRoomMember: builder.mutation<
      RoomMember,
      { roomId: string; userId: string; body: UpdateRoomMemberRequest }
    >({
      query: ({ roomId, userId, body }) => ({
        url: `/rooms/${roomId}/members/${userId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_res, _err, { roomId }) => [{ type: 'RoomMembers', id: roomId }],
    }),

    /**
     * DELETE /rooms/:roomId/members/:userId
     * Remove a member. A member may remove themselves (leave);
     * removing others requires CHAT_MANAGE_MEMBERS or OWNER/ADMIN room role.
     * Returns 204 No Content.
     */
    removeRoomMember: builder.mutation<void, { roomId: string; userId: string }>({
      query: ({ roomId, userId }) => ({
        url: `/rooms/${roomId}/members/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { roomId }) => [{ type: 'RoomMembers', id: roomId }],
    }),

    /**
     * POST /rooms/:roomId/members/bulk-add
     * Resolve members from org units / org unit tags and add them to the room.
     * Skips users already in the room; optionally previews changes with dryRun=true.
     * Requires CHAT_MANAGE_MEMBERS permission or OWNER/ADMIN room role.
     */
    bulkAddRoomMembers: builder.mutation<
      BulkOperationResult,
      { roomId: string; body: BulkAddRoomMembersRequest }
    >({
      query: ({ roomId, body }) => ({
        url: `/rooms/${roomId}/members/bulk-add`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, { body, roomId }) =>
        body.dryRun ? [] : [{ type: 'RoomMembers', id: roomId }],
    }),

    /**
     * POST /rooms/:roomId/members/bulk-remove
     * Remove members matching org units / org unit tags / explicit user IDs.
     * Optionally previews changes with dryRun=true.
     * Requires CHAT_MANAGE_MEMBERS permission or OWNER/ADMIN room role.
     */
    bulkRemoveRoomMembers: builder.mutation<
      BulkOperationResult,
      { roomId: string; body: BulkRemoveRoomMembersRequest }
    >({
      query: ({ roomId, body }) => ({
        url: `/rooms/${roomId}/members/bulk-remove`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, { body, roomId }) =>
        body.dryRun ? [] : [{ type: 'RoomMembers', id: roomId }],
    }),

    // ================================================================
    // Topics
    // ================================================================

    /**
     * GET /rooms/:roomId/topics
     * List topics in a room. The server filters out topics the current user
     * cannot see based on their visibility scope.
     */
    getTopics: builder.query<Topic[], string>({
      query: (roomId) => `/rooms/${roomId}/topics`,
      transformResponse: (raw: Topic[] | { items: Topic[] } | Topic) => {
        if (Array.isArray(raw)) return raw;
        if (raw && typeof raw === 'object' && 'items' in raw) return (raw as { items: Topic[] }).items;
        return [raw as Topic];
      },
      providesTags: (_res, _err, roomId) => [{ type: 'Topics', id: roomId }],
    }),

    /**
     * POST /rooms/:roomId/topics
     * Create a topic. Requires CHAT_MANAGE_TOPICS permission or OWNER/ADMIN room role.
     */
    createTopic: builder.mutation<Topic, CreateTopicRequest>({
      query: ({ roomId, ...body }) => ({
        url: `/rooms/${roomId}/topics`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, { roomId }) => [{ type: 'Topics', id: roomId }],
    }),

    /**
     * PATCH /rooms/:roomId/topics/:topicId
     * Rename, update description, archive/unarchive.
     * Requires CHAT_MANAGE_TOPICS permission or OWNER/ADMIN room role.
     */
    updateTopic: builder.mutation<Topic, { roomId: string; topicId: string; body: UpdateTopicRequest }>({
      query: ({ roomId, topicId, body }) => ({
        url: `/rooms/${roomId}/topics/${topicId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_res, _err, { roomId, topicId }) => [
        { type: 'Topics', id: roomId },
        { type: 'Topic', id: topicId },
      ],
    }),

    /**
     * DELETE /rooms/:roomId/topics/:topicId
     * Soft-delete a topic (sets deletedAt). All messages inside are also
     * soft-deleted. Requires CHAT_MANAGE_TOPICS permission or OWNER/ADMIN room role.
     * Returns 204 No Content.
     */
    deleteTopic: builder.mutation<void, { roomId: string; topicId: string }>({
      query: ({ roomId, topicId }) => ({
        url: `/rooms/${roomId}/topics/${topicId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { roomId, topicId }) => [
        { type: 'Topics', id: roomId },
        { type: 'Topic', id: topicId },
      ],
    }),

    // ================================================================
    // Topic Visibility
    // ================================================================

    /**
     * GET /rooms/:roomId/topics/:topicId/visibility
     * Retrieve the current visibility scope configuration for a topic.
     * Requires CHAT_MANAGE_VISIBILITY permission or OWNER/ADMIN room role.
     */
    getTopicVisibility: builder.query<
      TopicVisibilityScope,
      { roomId: string; topicId: string }
    >({
      query: ({ roomId, topicId }) =>
        `/rooms/${roomId}/topics/${topicId}/visibility`,
      providesTags: (_res, _err, { topicId }) => [{ type: 'TopicVisibility', id: topicId }],
    }),

    /**
     * PUT /rooms/:roomId/topics/:topicId/visibility
     * Replace the entire visibility scope (idempotent full replacement).
     * Requires CHAT_MANAGE_VISIBILITY permission or OWNER/ADMIN room role.
     */
    setTopicVisibility: builder.mutation<
      TopicVisibilityScope,
      { roomId: string; topicId: string; body: SetTopicVisibilityRequest }
    >({
      query: ({ roomId, topicId, body }) => ({
        url: `/rooms/${roomId}/topics/${topicId}/visibility`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_res, _err, { roomId, topicId }) => [
        { type: 'TopicVisibility', id: topicId },
        { type: 'Topics', id: roomId },
      ],
    }),

    /**
     * PATCH /rooms/:roomId/topics/:topicId/visibility
     * Incrementally add or remove members / org units / tags from an existing
     * INCLUDE_MEMBERS / EXCLUDE_MEMBERS / ORG_UNIT / ORG_UNIT_TAG scope.
     * Changing the scopeType itself requires a full PUT.
     * Requires CHAT_MANAGE_VISIBILITY permission or OWNER/ADMIN room role.
     */
    patchTopicVisibility: builder.mutation<
      TopicVisibilityScope,
      { roomId: string; topicId: string; body: PatchTopicVisibilityRequest }
    >({
      query: ({ roomId, topicId, body }) => ({
        url: `/rooms/${roomId}/topics/${topicId}/visibility`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_res, _err, { roomId, topicId }) => [
        { type: 'TopicVisibility', id: topicId },
        { type: 'Topics', id: roomId },
      ],
    }),

    // ================================================================
    // Messages
    // ================================================================

    /**
     * GET /topics/:topicId/messages
     * Returns root-level messages (level = 0, parentId = null) for a topic.
     * Future: add cursor/page params for pagination.
     */
    getMessages: builder.query<Message[], string>({
      query: (topicId) => `/topics/${topicId}/messages`,
      transformResponse: (raw: Message[] | { items: Message[] }) => {
        if (Array.isArray(raw)) return raw;
        if (raw && typeof raw === 'object' && 'items' in raw) return (raw as { items: Message[] }).items;
        return [];
      },
      providesTags: (_res, _err, topicId) => [{ type: 'Messages', id: topicId }],
    }),

    /**
     * GET /messages/:messageId
     * Single message by ID (used for thread parent preview).
     */
    getMessageById: builder.query<Message, string>({
      query: (messageId) => `/messages/${messageId}`,
      providesTags: (_res, _err, messageId) => [{ type: 'Thread', id: messageId }],
    }),

    /**
     * GET /messages/:messageId/replies
     * Returns all direct replies for a given parent message (thread view).
     */
    getThread: builder.query<Message[], string>({
      query: (messageId) => `/messages/${messageId}/replies`,
      transformResponse: (raw: Message[] | { items: Message[] }) => {
        if (Array.isArray(raw)) return raw;
        if (raw && typeof raw === 'object' && 'items' in raw) return (raw as { items: Message[] }).items;
        return [];
      },
      providesTags: (_res, _err, messageId) => [{ type: 'Thread', id: messageId }],
    }),

    /**
     * POST /topics/:topicId/messages
     * Send a new message. parentId makes it a thread reply.
     */
    sendMessage: builder.mutation<Message, SendMessageRequest>({
      query: ({ topicId, ...body }) => ({
        url: `/topics/${topicId}/messages`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, { topicId, parentId }) => {
        const tags: { type: 'Messages' | 'Thread' | 'Rooms'; id?: string }[] = [
          { type: 'Messages', id: topicId },
          { type: 'Rooms' },
        ];
        if (parentId) {
          tags.push({ type: 'Thread', id: parentId });
        }
        return tags;
      },
    }),

    /**
     * POST /topics/:topicId/read
     * Mark all messages in a topic as read for the current user.
     * Resets the unread counter for the parent room in the sidebar.
     */
    markTopicRead: builder.mutation<void, string>({
      query: (topicId) => ({
        url: `/topics/${topicId}/read`,
        method: 'POST',
      }),
      // Refresh room and topic lists so unreadCount badges update
      invalidatesTags: ['Rooms', 'Topics'],
    }),

    /**
     * PATCH /messages/:messageId/pin
     * Pin or unpin a message. Requires CHAT_PIN_MESSAGE permission or OWNER/ADMIN room role.
     */
    pinMessage: builder.mutation<Message, { messageId: string; body: PinMessageRequest }>({
      query: ({ messageId, body }) => ({
        url: `/messages/${messageId}/pin`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_res, _err, { messageId }) => [
        'Messages',
        { type: 'Thread', id: messageId },
      ],
    }),

  }),
});

export const {
  // Rooms
  useGetRoomsQuery,
  useGetRoomByIdQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useDeleteRoomMutation,
  // Members
  useGetRoomMembersQuery,
  useGetAssignableRoomRolesQuery,
  useAddRoomMemberMutation,
  useAddRoomMembersMutation,
  useUpdateRoomMemberMutation,
  useRemoveRoomMemberMutation,
  useBulkAddRoomMembersMutation,
  useBulkRemoveRoomMembersMutation,
  // Topics
  useGetTopicsQuery,
  useLazyGetTopicsQuery,
  useCreateTopicMutation,
  useUpdateTopicMutation,
  useDeleteTopicMutation,
  // Visibility
  useGetTopicVisibilityQuery,
  useSetTopicVisibilityMutation,
  usePatchTopicVisibilityMutation,
  // Messages
  useGetMessagesQuery,
  useGetMessageByIdQuery,
  useGetThreadQuery,
  useSendMessageMutation,
  usePinMessageMutation,
  useMarkTopicReadMutation,
} = chatApi;
