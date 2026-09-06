import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../app/store';
import {
  incrementThreadUnread,
  setSelectedRoom,
  setSelectedTopic,
} from '../app/slices/uiSlice';
import { chatApi } from '../api/chatApi';
import { authApi } from '../api/authApi';
import { notificationsApi } from '../api/notificationsApi';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket/socketClient';
import type {
  Message,
  Notification,
  PageResult,
  PasswordResetRequestItem,
  RegistrationRequestItem,
  Room,
  RoomMember,
  Topic,
} from '../types';
import type {
  MessagesReadPayload,
  RealtimeMessage,
  RoomMemberAddedPayload,
  RoomMemberRemovedPayload,
  TopicDeletedPayload,
} from '../lib/socket/socketTypes';


function prependUniqueNotification(
  draft: PageResult<Notification>,
  notification: Notification,
): void {
  if (draft.items.some((item) => item.id === notification.id)) return;
  draft.items.unshift(notification);
  draft.total += 1;
  if (draft.items.length > draft.limit) {
    draft.items.length = draft.limit;
  }
}

function prependUniquePasswordResetRequest(
  draft: PasswordResetRequestItem[],
  request: PasswordResetRequestItem,
): void {
  const index = draft.findIndex((item) => item.id === request.id);
  if (index >= 0) {
    draft[index] = { ...draft[index], ...request };
    return;
  }
  draft.unshift(request);
}

function prependUniqueRegistrationRequest(
  draft: RegistrationRequestItem[],
  request: RegistrationRequestItem,
): void {
  const index = draft.findIndex((item) => item.id === request.id);
  if (index >= 0) {
    draft[index] = { ...draft[index], ...request };
    return;
  }
  draft.unshift(request);
}

function upsertTopic(topics: Topic[], topic: Topic): void {
  const index = topics.findIndex((item) => item.id === topic.id);
  if (index >= 0) {
    topics[index] = { ...topics[index], ...topic };
    return;
  }
  topics.unshift(topic);
}

function upsertMessage(messages: Message[], message: Message): void {
  const index = messages.findIndex((item) => item.id === message.id);
  if (index >= 0) {
    messages[index] = { ...messages[index], ...message };
    return;
  }
  messages.push(message);
}

function upsertRoomMember(members: RoomMember[], member: RoomMember): void {
  const index = members.findIndex((item) => item.userId === member.userId);
  if (index >= 0) {
    members[index] = { ...members[index], ...member };
    return;
  }
  members.push(member);
}

function normalizeMembers(payload: RoomMemberAddedPayload): RoomMember[] {
  return 'members' in payload ? payload.members : [payload];
}

function toMessagePreview(message: Message): Room['lastMessage'] {
  return {
    id: message.id,
    content: message.content,
    author: message.author,
    createdAt: message.createdAt,
  };
}

function applyReadReceipt(messages: Message[], messageIds: string[]): void {
  const seen = new Set(messageIds);
  messages.forEach((message) => {
    if (!seen.has(message.id)) return;
    message.readByCount = (message.readByCount ?? 0) + 1;
  });
}

function stripRealtimeFields(message: RealtimeMessage): Message {
  const { roomId: _roomId, ...rest } = message;
  return rest;
}

export function SocketManager() {
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((state: RootState) => state.auth.token);
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  const selectedRoomId = useSelector((state: RootState) => state.ui.selectedRoomId);
  const selectedTopicId = useSelector((state: RootState) => state.ui.selectedTopicId);
  const selectedThreadMessageId = useSelector(
    (state: RootState) => state.ui.selectedThreadMessageId
  );

  const activeRoomRef = useRef<string | null>(selectedRoomId);
  const selectedTopicRef = useRef<string | null>(selectedTopicId);
  const selectedThreadRef = useRef<string | null>(selectedThreadMessageId);
  const processedMessageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    selectedTopicRef.current = selectedTopicId;
  }, [selectedTopicId]);

  useEffect(() => {
    selectedThreadRef.current = selectedThreadMessageId;
  }, [selectedThreadMessageId]);

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket(token);

    const handleConnect = () => {
      if (activeRoomRef.current) {
        socket.emit('chat:join', { roomId: activeRoomRef.current });
      }
    };

    const applyIncomingMessage = (message: RealtimeMessage, roomId?: string | null) => {
      if (processedMessageIdsRef.current.has(message.id)) return;
      processedMessageIdsRef.current.add(message.id);

      const resolvedRoomId = roomId ?? message.roomId;
      const cleanMessage = stripRealtimeFields(message);
      const isViewingTopic =
        window.location.pathname === '/chat' &&
        selectedTopicRef.current === message.topicId;
      const shouldCountUnread = message.authorId !== currentUserId && !isViewingTopic;

      if (!message.parentId) {
        dispatch(
          chatApi.util.updateQueryData('getMessages', message.topicId, (draft) => {
            upsertMessage(draft, cleanMessage);
          }),
        );
      } else {
        dispatch(
          chatApi.util.updateQueryData('getThread', message.parentId, (draft) => {
            upsertMessage(draft, cleanMessage);
          }),
        );

        if (message.authorId !== currentUserId && selectedThreadRef.current !== message.parentId) {
          dispatch(incrementThreadUnread(message.parentId));
        }

        dispatch(
          chatApi.util.updateQueryData('getMessageById', message.parentId, (draft) => {
            draft.replyCount = (draft.replyCount ?? 0) + 1;
          }),
        );

        dispatch(
          chatApi.util.updateQueryData('getMessages', message.topicId, (draft) => {
            const parentMessage = draft.find((item) => item.id === message.parentId);
            if (!parentMessage) return;
            parentMessage.replyCount = (parentMessage.replyCount ?? 0) + 1;
          }),
        );
      }

      dispatch(chatApi.util.invalidateTags([{ type: 'Messages', id: message.topicId }]));

      if (message.parentId) {
        dispatch(chatApi.util.invalidateTags([{ type: 'Thread', id: message.parentId }]));
      }

      if (resolvedRoomId) {
        dispatch(
          chatApi.util.updateQueryData('getTopics', resolvedRoomId, (draft) => {
            const topic = draft.find((item) => item.id === message.topicId);
            if (!topic) return;
            if (!shouldCountUnread) {
              topic.unreadCount = 0;
              return;
            }
            topic.unreadCount = (topic.unreadCount ?? 0) + 1;
          }),
        );

        dispatch(
          chatApi.util.updateQueryData('getRooms', undefined, (draft) => {
            const room = draft.items.find((item) => item.id === resolvedRoomId);
            if (!room) return;
            room.lastMessage = toMessagePreview(cleanMessage);
            room.updatedAt = message.updatedAt;
            if (shouldCountUnread) {
              room.unreadCount = (room.unreadCount ?? 0) + 1;
            } else if (isViewingTopic) {
              room.unreadCount = Math.max(0, room.unreadCount ?? 0);
            }
          }),
        );
      }
    };

    const hydrateMessageFromNotification = async (messageId: string) => {
      try {
        const request = dispatch(
          chatApi.endpoints.getMessageById.initiate(messageId, {
            subscribe: false,
            forceRefetch: true,
          }),
        );
        const message = await request.unwrap();
        applyIncomingMessage(message);
        dispatch(
          chatApi.endpoints.getMessages.initiate(message.topicId, {
            subscribe: false,
            forceRefetch: true,
          }),
        );
        if (message.parentId) {
          dispatch(
            chatApi.endpoints.getThread.initiate(message.parentId, {
              subscribe: false,
              forceRefetch: true,
            }),
          );
        }
      } catch {
        dispatch(chatApi.util.invalidateTags(['Messages', 'Rooms']));
      }
    };

    const handleNotification = (notification: Notification) => {
      dispatch(
        notificationsApi.util.updateQueryData(
          'getNotifications',
          { unreadOnly: true, page: 1, limit: 1 },
          (draft) => {
            prependUniqueNotification(draft, notification);
          },
        ),
      );

      dispatch(
        notificationsApi.util.updateQueryData('getNotifications', { limit: 100 }, (draft) => {
          prependUniqueNotification(draft, notification);
        }),
      );

      dispatch(
        notificationsApi.util.updateQueryData(
          'getNotifications',
          { unreadOnly: true, limit: 100 },
          (draft) => {
            prependUniqueNotification(draft, notification);
          },
        ),
      );

      if (notification.type === 'NEW_MESSAGE' || notification.type === 'ROOM_INVITATION') {
        dispatch(chatApi.util.invalidateTags(['Rooms']));
      }

      if (notification.type === 'NEW_MESSAGE' && notification.entityType === 'MESSAGE') {
        void hydrateMessageFromNotification(notification.entityId);
      }

      if (notification.entityType === 'ROOM') {
        dispatch(chatApi.util.invalidateTags([{ type: 'Room', id: notification.entityId }]));
      }

      dispatch(notificationsApi.util.invalidateTags(['Notifications']));
    };

    const handlePasswordResetRequest = (request: PasswordResetRequestItem) => {
      dispatch(
        authApi.util.updateQueryData('listPasswordResetRequests', undefined, (draft) => {
          prependUniquePasswordResetRequest(draft, request);
        }),
      );
      dispatch(authApi.util.invalidateTags(['PasswordResetRequests']));
    };

    const handleRegistrationRequest = (request: RegistrationRequestItem) => {
      dispatch(
        authApi.util.updateQueryData('listRegistrationRequests', undefined, (draft) => {
          prependUniqueRegistrationRequest(draft, request);
        }),
      );
      dispatch(authApi.util.invalidateTags(['RegistrationRequests']));
    };

    const handleMessageNew = (message: RealtimeMessage) => {
      applyIncomingMessage(message, message.roomId ?? activeRoomRef.current);
    };

    const handlePinned = (message: Message) => {
      dispatch(
        chatApi.util.updateQueryData('getMessages', message.topicId, (draft) => {
          upsertMessage(draft, message);
        }),
      );

      if (message.parentId) {
        dispatch(
          chatApi.util.updateQueryData('getThread', message.parentId, (draft) => {
            upsertMessage(draft, message);
          }),
        );
      }
    };

    const handleMessagesRead = ({ topicId, userId, messageIds }: MessagesReadPayload) => {
      if (!messageIds.length || (currentUserId && userId === currentUserId)) return;

      dispatch(
        chatApi.util.updateQueryData('getMessages', topicId, (draft) => {
          applyReadReceipt(draft, messageIds);
        }),
      );

      if (selectedThreadRef.current) {
        dispatch(
          chatApi.util.updateQueryData('getThread', selectedThreadRef.current, (draft) => {
            applyReadReceipt(draft, messageIds);
          }),
        );
      }
    };

    const handleTopicNew = (topic: Topic) => {
      dispatch(
        chatApi.util.updateQueryData('getTopics', topic.roomId, (draft) => {
          upsertTopic(draft, topic);
        }),
      );
    };

    const handleTopicUpdated = (topic: Topic) => {
      dispatch(
        chatApi.util.updateQueryData('getTopics', topic.roomId, (draft) => {
          upsertTopic(draft, topic);
        }),
      );
    };

    const handleTopicDeleted = ({ roomId, topicId }: TopicDeletedPayload) => {
      dispatch(
        chatApi.util.updateQueryData('getTopics', roomId, (draft) => {
          return draft.filter((topic) => topic.id !== topicId);
        }),
      );

      if (selectedTopicRef.current === topicId) {
        dispatch(setSelectedTopic(null));
      }
    };

    const handleRoomUpdated = (room: Room) => {
      dispatch(
        chatApi.util.updateQueryData('getRoomById', room.id, (draft) => {
          Object.assign(draft, room);
        }),
      );

      dispatch(
        chatApi.util.updateQueryData('getRooms', undefined, (draft) => {
          const index = draft.items.findIndex((item) => item.id === room.id);
          if (index >= 0) {
            draft.items[index] = { ...draft.items[index], ...room };
          }
        }),
      );
    };

    const handleMembersAdded = (payload: RoomMemberAddedPayload) => {
      const members = normalizeMembers(payload);
      const roomId = members[0]?.roomId;
      if (!roomId) return;

      dispatch(
        chatApi.util.updateQueryData('getRoomMembers', roomId, (draft) => {
          members.forEach((member) => upsertRoomMember(draft, member));
        }),
      );
    };

    const handleMemberRemoved = ({ roomId, userId }: RoomMemberRemovedPayload) => {
      dispatch(
        chatApi.util.updateQueryData('getRoomMembers', roomId, (draft) =>
          draft.filter((member) => member.userId !== userId),
        ),
      );

      if (currentUserId && userId === currentUserId) {
        dispatch(setSelectedTopic(null));
        dispatch(setSelectedRoom(null));
        dispatch(chatApi.util.invalidateTags(['Rooms', { type: 'Room', id: roomId }]));
      }
    };

    socket.on('connect', handleConnect);
    socket.on('notification:new', handleNotification);
    socket.on('password-reset:request:new', handlePasswordResetRequest);
    socket.on('registration:request:new', handleRegistrationRequest);
    socket.on('message:new', handleMessageNew);
    socket.on('message:pinned', handlePinned);
    socket.on('messages:read', handleMessagesRead);
    socket.on('topic:new', handleTopicNew);
    socket.on('topic:updated', handleTopicUpdated);
    socket.on('topic:deleted', handleTopicDeleted);
    socket.on('room:updated', handleRoomUpdated);
    socket.on('room:member:added', handleMembersAdded);
    socket.on('room:member:removed', handleMemberRemoved);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('notification:new', handleNotification);
      socket.off('password-reset:request:new', handlePasswordResetRequest);
      socket.off('registration:request:new', handleRegistrationRequest);
      socket.off('message:new', handleMessageNew);
      socket.off('message:pinned', handlePinned);
      socket.off('messages:read', handleMessagesRead);
      socket.off('topic:new', handleTopicNew);
      socket.off('topic:updated', handleTopicUpdated);
      socket.off('topic:deleted', handleTopicDeleted);
      socket.off('room:updated', handleRoomUpdated);
      socket.off('room:member:added', handleMembersAdded);
      socket.off('room:member:removed', handleMemberRemoved);
    };
  }, [currentUserId, dispatch, token]);

  useEffect(() => {
    const socket = getSocket();
    const previousRoomId = activeRoomRef.current;

    if (socket?.connected && previousRoomId && previousRoomId !== selectedRoomId) {
      socket.emit('chat:leave', { roomId: previousRoomId });
    }
    if (socket?.connected && selectedRoomId && previousRoomId !== selectedRoomId) {
      socket.emit('chat:join', { roomId: selectedRoomId });
    }

    activeRoomRef.current = selectedRoomId;
  }, [selectedRoomId]);

  return null;
}
