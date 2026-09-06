import {
  useDeletePollMutation,
  useGetPollQuery,
  useInviteParticipantsMutation,
  useRemoveParticipantMutation,
  useRetractVoteMutation,
  useUpdatePollMutation,
  useVoteMutation,
} from '../../api/pollsApi';
import { useListUsersQuery } from '../../api/usersApi';

export const usePollDetailsData = (pollId?: string) => useGetPollQuery(pollId || '', { skip: !pollId });

export const usePollInvitableUsers = (enabled: boolean, search: string) =>
  useListUsersQuery(
    { q: search, limit: 20 },
    { skip: !enabled || search.length < 2 },
  );

export const useVoteOnPoll = useVoteMutation;
export const useRetractPollVote = useRetractVoteMutation;
export const useUpdatePoll = useUpdatePollMutation;
export const useDeletePoll = useDeletePollMutation;
export const useInvitePollParticipants = useInviteParticipantsMutation;
export const useRemovePollParticipant = useRemoveParticipantMutation;
