import type { PollResultsCommonProps } from '../../PollDetailsPage.types';

export type PollResultsProps = PollResultsCommonProps & {
  canVote: boolean;
  hasAnyVotes: boolean;
  onVote: (optionId: string) => void;
};
