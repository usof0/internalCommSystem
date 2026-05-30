import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './baseQueryWithAuth';
import type {
  Poll,
  PollSummary,
  PollParticipant,
  CreatePollRequest,
  UpdatePollRequest,
  InvitePollParticipantsRequest,
  VoteRequest,
  GetPollsQuery,
} from '../types';

export const pollsApi = createApi({
  reducerPath: 'pollsApi',
  baseQuery: baseQueryWithAuth,
  refetchOnMountOrArgChange: true,
  tagTypes: ['Polls', 'Poll'],
  endpoints: (builder) => ({
    // Polls where the current user is a participant
    getMyPolls: builder.query<PollSummary[], GetPollsQuery | void>({
      query: (params) => ({ url: '/polls/my', params: params ?? {} }),
      providesTags: (result) =>
        result
          ? ['Polls', ...result.map((p) => ({ type: 'Poll' as const, id: p.id }))]
          : ['Polls'],
    }),

    // Polls created by the current user
    getCreatedPolls: builder.query<PollSummary[], GetPollsQuery | void>({
      query: (params) => ({ url: '/polls/created', params: params ?? {} }),
      providesTags: (result) =>
        result
          ? ['Polls', ...result.map((p) => ({ type: 'Poll' as const, id: p.id }))]
          : ['Polls'],
    }),

    // Full poll detail with all participants
    getPoll: builder.query<Poll, string>({
      query: (pollId) => `/polls/${pollId}`,
      providesTags: (_res, _err, id) => [{ type: 'Poll', id }],
    }),

    // Create a new poll with options
    createPoll: builder.mutation<Poll, CreatePollRequest>({
      query: (body) => ({ url: '/polls', method: 'POST', body }),
      invalidatesTags: ['Polls'],
    }),

    // Update poll metadata (title, description)
    updatePoll: builder.mutation<Poll, { pollId: string; body: UpdatePollRequest }>({
      query: ({ pollId, body }) => ({ url: `/polls/${pollId}`, method: 'PATCH', body }),
      invalidatesTags: (_res, _err, { pollId }) => ['Polls', { type: 'Poll', id: pollId }],
    }),

    // Soft-delete a poll
    deletePoll: builder.mutation<void, string>({
      query: (pollId) => ({ url: `/polls/${pollId}`, method: 'DELETE' }),
      invalidatesTags: ['Polls'],
    }),

    // Invite participants (individual users and/or org-unit/tag based)
    inviteParticipants: builder.mutation<
      PollParticipant[],
      { pollId: string; body: InvitePollParticipantsRequest }
    >({
      query: ({ pollId, body }) => ({
        url: `/polls/${pollId}/participants`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, { pollId }) => [{ type: 'Poll', id: pollId }, 'Polls'],
    }),

    // Remove a participant (creator only)
    removeParticipant: builder.mutation<void, { pollId: string; userId: string }>({
      query: ({ pollId, userId }) => ({
        url: `/polls/${pollId}/participants/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { pollId }) => [{ type: 'Poll', id: pollId }, 'Polls'],
    }),

    // Cast or change a vote
    vote: builder.mutation<PollParticipant, { pollId: string; body: VoteRequest }>({
      query: ({ pollId, body }) => ({
        url: `/polls/${pollId}/vote`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, { pollId }) => [{ type: 'Poll', id: pollId }, 'Polls'],
    }),

    // Retract a vote (reset done=false, chosenOptionId=null)
    retractVote: builder.mutation<PollParticipant, string>({
      query: (pollId) => ({ url: `/polls/${pollId}/vote`, method: 'DELETE' }),
      invalidatesTags: (_res, _err, pollId) => [{ type: 'Poll', id: pollId }, 'Polls'],
    }),
  }),
});

export const {
  useGetMyPollsQuery,
  useGetCreatedPollsQuery,
  useGetPollQuery,
  useCreatePollMutation,
  useUpdatePollMutation,
  useDeletePollMutation,
  useInviteParticipantsMutation,
  useRemoveParticipantMutation,
  useVoteMutation,
  useRetractVoteMutation,
} = pollsApi;
