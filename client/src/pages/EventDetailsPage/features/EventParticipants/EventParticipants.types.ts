import type { EventParticipant } from '../../../../types';

import type { EventInvitableUser, EventParticipantsCommonProps } from '../../EventDetailsPage.types';

export type EventParticipantsProps = EventParticipantsCommonProps & {
  confirmedCount: number;
  isInviteOpen: boolean;
  userSearch: string;
  selectedUserIds: string[];
  selectedOrgUnitIds: string[];
  selectedTagIds: string[];
  includeSubUnits: boolean;
  inviteError: string;
  availableUsers: EventInvitableUser[];
  isInviting: boolean;
  onToggleInvite: () => void;
  onChangeSearch: (value: string) => void;
  onToggleUserSelection: (userId: string) => void;
  onChangeOrgUnitSelection: (ids: string[]) => void;
  onChangeTagSelection: (ids: string[]) => void;
  onChangeIncludeSubUnits: (value: boolean) => void;
  onInvite: () => void;
  onCancelInvite: () => void;
  onRemove: (participantUserId: string) => void;
};

export type EventParticipantCardProps = {
  participant: EventParticipant;
  isMe: boolean;
  isCreator: boolean;
  onRemove: (participantUserId: string) => void;
};
