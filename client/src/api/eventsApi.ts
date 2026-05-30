import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './baseQueryWithAuth';
import type {
  Event,
  EventSummary,
  EventParticipant,
  CreateEventRequest,
  UpdateEventRequest,
  InviteParticipantsRequest,
  ConfirmAttendanceRequest,
  GetEventsQuery,
} from '../types';

export const eventsApi = createApi({
  reducerPath: 'eventsApi',
  baseQuery: baseQueryWithAuth,
  refetchOnMountOrArgChange: true,
  tagTypes: ['Events', 'Event'],
  endpoints: (builder) => ({
    // Events where the current user is a participant
    getMyEvents: builder.query<EventSummary[], GetEventsQuery | void>({
      query: (params) => ({ url: '/events/my', params: params ?? {} }),
      providesTags: (result) =>
        result
          ? ['Events', ...result.map((e) => ({ type: 'Event' as const, id: e.id }))]
          : ['Events'],
    }),

    // Events created by the current user
    getCreatedEvents: builder.query<EventSummary[], GetEventsQuery | void>({
      query: (params) => ({ url: '/events/created', params: params ?? {} }),
      providesTags: (result) =>
        result
          ? ['Events', ...result.map((e) => ({ type: 'Event' as const, id: e.id }))]
          : ['Events'],
    }),

    // Full event details with all participants
    getEvent: builder.query<Event, string>({
      query: (eventId) => `/events/${eventId}`,
      providesTags: (_res, _err, id) => [{ type: 'Event', id }],
    }),

    // Create a new event
    createEvent: builder.mutation<Event, CreateEventRequest>({
      query: (body) => ({ url: '/events', method: 'POST', body }),
      invalidatesTags: ['Events'],
    }),

    // Update event metadata
    updateEvent: builder.mutation<Event, { eventId: string; body: UpdateEventRequest }>({
      query: ({ eventId, body }) => ({ url: `/events/${eventId}`, method: 'PATCH', body }),
      invalidatesTags: (_res, _err, { eventId }) => ['Events', { type: 'Event', id: eventId }],
    }),

    // Soft-delete an event
    deleteEvent: builder.mutation<void, string>({
      query: (eventId) => ({ url: `/events/${eventId}`, method: 'DELETE' }),
      invalidatesTags: ['Events'],
    }),

    // Invite participants (individual users and/or org-unit/tag based)
    inviteParticipants: builder.mutation<
      EventParticipant[],
      { eventId: string; body: InviteParticipantsRequest }
    >({
      query: ({ eventId, body }) => ({
        url: `/events/${eventId}/participants`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, { eventId }) => [{ type: 'Event', id: eventId }, 'Events'],
    }),

    // Remove a participant
    removeParticipant: builder.mutation<void, { eventId: string; userId: string }>({
      query: ({ eventId, userId }) => ({
        url: `/events/${eventId}/participants/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { eventId }) => [{ type: 'Event', id: eventId }, 'Events'],
    }),

    // Confirm or unconfirm attendance (participant action)
    confirmAttendance: builder.mutation<
      EventParticipant,
      { eventId: string; userId: string; body: ConfirmAttendanceRequest }
    >({
      query: ({ eventId, userId, body }) => ({
        url: `/events/${eventId}/participants/${userId}/confirm`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_res, _err, { eventId }) => [{ type: 'Event', id: eventId }, 'Events'],
    }),
  }),
});

export const {
  useGetMyEventsQuery,
  useGetCreatedEventsQuery,
  useGetEventQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useInviteParticipantsMutation,
  useRemoveParticipantMutation,
  useConfirmAttendanceMutation,
} = eventsApi;
