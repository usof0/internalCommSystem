import type { Poll } from '../../../../types';

export type PollHeaderProps = {
  poll: Poll;
  isCreator: boolean;
  onBack: () => void;
  onOpenEdit: () => void;
  onOpenDelete: () => void;
};
