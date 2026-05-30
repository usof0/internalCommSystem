import type { Room } from '../../../../types';

export type ChatPanelsProps = {
  selectedRoomId: string | null;
  selectedTopicId: string | null;
  selectedThreadMessageId: string | null;
  room?: Room;
  isDirect: boolean;
  header: React.ReactNode;
};
