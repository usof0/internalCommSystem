import {
  useConfirmAttendanceMutation,
  useGetEventQuery,
  useInviteParticipantsMutation,
  useRemoveParticipantMutation,
} from '../../api/eventsApi';
import { useListUsersQuery } from '../../api/usersApi';

export const useEventDetailsData = (eventId?: string) => useGetEventQuery(eventId || '', { skip: !eventId });

export const useEventInvitableUsers = (enabled: boolean, search: string) =>
  useListUsersQuery(
    { q: search, limit: 20 },
    { skip: !enabled || search.length < 2 },
  );

export const useConfirmEventAttendance = useConfirmAttendanceMutation;
export const useInviteEventParticipants = useInviteParticipantsMutation;
export const useRemoveEventParticipant = useRemoveParticipantMutation;
