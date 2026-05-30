import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './baseQueryWithAuth';
import type {
  Task,
  TaskSummary,
  TaskParticipant,
  CreateTaskRequest,
  UpdateTaskRequest,
  AssignParticipantsRequest,
  UpdateWorkStatusRequest,
  UpdateReviewRequest,
  GetTasksQuery,
} from '../types';

export const tasksApi = createApi({
  reducerPath: 'tasksApi',
  baseQuery: baseQueryWithAuth,
  refetchOnMountOrArgChange: true,
  tagTypes: ['Tasks', 'Task'],
  endpoints: (builder) => ({
    // Tasks where the current user is a participant
    getMyTasks: builder.query<TaskSummary[], GetTasksQuery | void>({
      query: (params) => ({ url: '/tasks/my', params: params ?? {} }),
      providesTags: (result) =>
        result
          ? ['Tasks', ...result.map((t) => ({ type: 'Task' as const, id: t.id }))]
          : ['Tasks'],
    }),

    // Tasks created by the current user
    getCreatedTasks: builder.query<TaskSummary[], GetTasksQuery | void>({
      query: (params) => ({ url: '/tasks/created', params: params ?? {} }),
      providesTags: (result) =>
        result
          ? ['Tasks', ...result.map((t) => ({ type: 'Task' as const, id: t.id }))]
          : ['Tasks'],
    }),

    // Full task details including all participants
    getTask: builder.query<Task, string>({
      query: (taskId) => `/tasks/${taskId}`,
      providesTags: (_res, _err, id) => [{ type: 'Task', id }],
    }),

    // Create a new task
    createTask: builder.mutation<Task, CreateTaskRequest>({
      query: (body) => ({ url: '/tasks', method: 'POST', body }),
      invalidatesTags: ['Tasks'],
    }),

    // Update task metadata (title, description, dueDate)
    updateTask: builder.mutation<Task, { taskId: string; body: UpdateTaskRequest }>({
      query: ({ taskId, body }) => ({ url: `/tasks/${taskId}`, method: 'PATCH', body }),
      invalidatesTags: (_res, _err, { taskId }) => ['Tasks', { type: 'Task', id: taskId }],
    }),

    // Soft-delete a task
    deleteTask: builder.mutation<void, string>({
      query: (taskId) => ({ url: `/tasks/${taskId}`, method: 'DELETE' }),
      invalidatesTags: ['Tasks'],
    }),

    // Assign participants (individual users and/or org-unit/tag based)
    assignParticipants: builder.mutation<
      TaskParticipant[],
      { taskId: string; body: AssignParticipantsRequest }
    >({
      query: ({ taskId, body }) => ({
        url: `/tasks/${taskId}/participants`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, { taskId }) => [{ type: 'Task', id: taskId }, 'Tasks'],
    }),

    // Remove a participant from a task
    removeParticipant: builder.mutation<void, { taskId: string; userId: string }>({
      query: ({ taskId, userId }) => ({
        url: `/tasks/${taskId}/participants/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { taskId }) => [{ type: 'Task', id: taskId }, 'Tasks'],
    }),

    // Participant updates their own work status
    updateWorkStatus: builder.mutation<
      TaskParticipant,
      { taskId: string; userId: string; body: UpdateWorkStatusRequest }
    >({
      query: ({ taskId, userId, body }) => ({
        url: `/tasks/${taskId}/participants/${userId}/work-status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_res, _err, { taskId }) => [{ type: 'Task', id: taskId }, 'Tasks'],
    }),

    // Task owner reviews a participant's submitted work
    reviewParticipant: builder.mutation<
      TaskParticipant,
      { taskId: string; userId: string; body: UpdateReviewRequest }
    >({
      query: ({ taskId, userId, body }) => ({
        url: `/tasks/${taskId}/participants/${userId}/review`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_res, _err, { taskId }) => [{ type: 'Task', id: taskId }, 'Tasks'],
    }),
  }),
});

export const {
  useGetMyTasksQuery,
  useGetCreatedTasksQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useAssignParticipantsMutation,
  useRemoveParticipantMutation,
  useUpdateWorkStatusMutation,
  useReviewParticipantMutation,
} = tasksApi;
