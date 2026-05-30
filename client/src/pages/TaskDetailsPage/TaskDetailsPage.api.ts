import {
  useAssignParticipantsMutation,
  useGetTaskQuery,
  useRemoveParticipantMutation,
  useReviewParticipantMutation,
  useUpdateTaskMutation,
  useUpdateWorkStatusMutation,
} from '../../api/tasksApi';
import { useListUsersQuery } from '../../api/usersApi';

export const useTaskDetailsData = (taskId?: string) => useGetTaskQuery(taskId || '', { skip: !taskId });

export const useTaskAssignableUsers = (enabled: boolean, search: string) =>
  useListUsersQuery(
    { q: search, limit: 20 },
    { skip: !enabled || search.length < 2 },
  );

export const useUpdateTaskWorkStatus = useUpdateWorkStatusMutation;
export const useUpdateTask = useUpdateTaskMutation;
export const useReviewTaskParticipant = useReviewParticipantMutation;
export const useAssignTaskParticipants = useAssignParticipantsMutation;
export const useRemoveTaskParticipant = useRemoveParticipantMutation;
