import type { Task, TaskParticipant, User } from '../../types';

export type TaskDetailsPageParams = {
  taskId: string;
};

export type RatingInputs = Record<string, string>;

export type TaskAssignableUser = User;

export type CurrentTaskParticipant = TaskParticipant | undefined;

export type TaskParticipantsCommonProps = {
  task: Task;
  currentUserId?: string;
  isCreator: boolean;
};
