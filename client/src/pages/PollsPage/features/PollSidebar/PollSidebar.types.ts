import type { Poll, User } from '../../../../types';

export type PollSidebarProps = {
  poll: Poll;
  currentUserId?: string;
  myOptionId: string | null;
  hasVoted: boolean;
  isRetracting: boolean;
  isCreator: boolean;
  isInviteOpen: boolean;
  userSearch: string;
  selectedUserIds: string[];
  selectedOrgUnitIds: string[];
  selectedTagIds: string[];
  includeSubUnits: boolean;
  inviteError: string;
  users: User[];
  isInviting: boolean;
  existingParticipantIds: Set<string>;
  onRetractVote: () => void;
  onToggleInvite: () => void;
  onChangeSearch: (value: string) => void;
  onToggleUserSelect: (userId: string) => void;
  onChangeOrgUnitSelection: (ids: string[]) => void;
  onChangeTagSelection: (ids: string[]) => void;
  onChangeIncludeSubUnits: (value: boolean) => void;
  onInvite: () => void;
  onRemoveParticipant: (userId: string) => void;
};
