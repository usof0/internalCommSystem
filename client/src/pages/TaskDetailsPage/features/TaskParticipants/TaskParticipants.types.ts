import type { TaskParticipant, TaskReviewStatus } from '../../../../types';

import type { RatingInputs, TaskAssignableUser, TaskParticipantsCommonProps } from '../../TaskDetailsPage.types';

export type TaskParticipantsProps = TaskParticipantsCommonProps & {
  isAssigningOpen: boolean;
  userSearch: string;
  selectedUserIds: string[];
  selectedOrgUnitIds: string[];
  selectedTagIds: string[];
  includeSubUnits: boolean;
  assignError: string;
  availableUsers: TaskAssignableUser[];
  isAssigning: boolean;
  isReviewing: boolean;
  ratingInputs: RatingInputs;
  onToggleAssigning: () => void;
  onChangeSearch: (value: string) => void;
  onToggleUserSelection: (userId: string) => void;
  onChangeOrgUnitSelection: (ids: string[]) => void;
  onChangeTagSelection: (ids: string[]) => void;
  onChangeIncludeSubUnits: (value: boolean) => void;
  onAssign: () => void;
  onCancelAssign: () => void;
  onReview: (participantUserId: string, reviewStatus: TaskReviewStatus) => void;
  onChangeRating: (participantUserId: string, value: string) => void;
  onRemove: (participantUserId: string) => void;
};

export type TaskParticipantCardProps = {
  participant: TaskParticipant;
  isMe: boolean;
  isCreator: boolean;
  isReviewing: boolean;
  ratingValue: string;
  onReview: (participantUserId: string, reviewStatus: TaskReviewStatus) => void;
  onChangeRating: (participantUserId: string, value: string) => void;
  onRemove: (participantUserId: string) => void;
};
