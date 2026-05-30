import type { Room, Topic } from '../../types';

export type ChatPageViewState = {
  selectedRoomId: string | null;
  selectedTopicId: string | null;
  selectedThreadMessageId: string | null;
  chatInfoPanelOpen: boolean;
};

export type ChatHeaderState = {
  title: string;
  subtitle?: string;
  isDirect: boolean;
  hasSelectedRoom: boolean;
  chatInfoPanelOpen: boolean;
};

export type ChatResolvedState = {
  room?: Room;
  topics?: Topic[];
  selectedTopic?: Topic;
  isDirect: boolean;
  chatTitle: string;
  chatSubtitle?: string;
};
