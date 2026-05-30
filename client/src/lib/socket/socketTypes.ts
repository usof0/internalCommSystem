import type { Message, Notification, PasswordResetRequestItem, RegistrationRequestItem, Room, RoomMember, Topic } from '../../types';

export type RealtimeMessage = Message & {
  roomId?: string;
};

export interface ChatJoinPayload {
  roomId: string;
}

export interface TopicDeletedPayload {
  topicId: string;
  roomId: string;
}

export interface RoomMemberRemovedPayload {
  userId: string;
  roomId: string;
}

export interface MessagesReadPayload {
  topicId: string;
  userId: string;
  messageIds: string[];
}

export type RoomMemberAddedPayload =
  | RoomMember
  | {
      members: RoomMember[];
    };
    

export interface SocketServerEvents {
  connect: () => void;
  connect_error: (error: Error) => void;
  disconnect: (reason: string) => void;
  'notification:new': (notification: Notification) => void;
  'password-reset:request:new': (request: PasswordResetRequestItem) => void;
  'registration:request:new': (request: RegistrationRequestItem) => void;
  'message:new': (message: RealtimeMessage) => void;
  'message:pinned': (message: RealtimeMessage) => void;
  'messages:read': (payload: MessagesReadPayload) => void;
  'topic:new': (topic: Topic) => void;
  'topic:updated': (topic: Topic) => void;
  'topic:deleted': (payload: TopicDeletedPayload) => void;
  'room:updated': (room: Room) => void;
  'room:member:added': (payload: RoomMemberAddedPayload) => void;
  'room:member:removed': (payload: RoomMemberRemovedPayload) => void;
}

export interface SocketClientEvents {
  'chat:join': (payload: ChatJoinPayload) => void;
  'chat:leave': (payload: ChatJoinPayload) => void;
}
