import type { Event, EventParticipant, User } from '../../types';

export type EventDetailsPageParams = {
  eventId: string;
};

export type EventInvitableUser = User;

export type CurrentEventParticipant = EventParticipant | undefined;

export type EventParticipantsCommonProps = {
  event: Event;
  currentUserId?: string;
  isCreator: boolean;
  isPast: boolean;
};
