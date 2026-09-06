import type { TaskParticipant, TaskWorkStatus } from '../../../../types';

export type TaskMyStatusProps = {
  participation: TaskParticipant;
  isUpdating: boolean;
  onChangeWorkStatus: (workStatus: TaskWorkStatus) => void;
};
