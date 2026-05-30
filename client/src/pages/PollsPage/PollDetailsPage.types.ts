import type { Poll, PollParticipant, User } from '../../types';

export type PollDetailsPageParams = {
  pollId: string;
};

export type PollInvitableUser = User;

export type CurrentPollParticipant = PollParticipant | undefined;

export type PollEditFormState = {
  title: string;
  description: string;
  error: string;
};

export type PollResultsCommonProps = {
  poll: Poll;
  totalVotes: number;
  winnerOptionId: string | null;
  myOptionId: string | null;
  showStats: boolean;
};
