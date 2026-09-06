import { createApi } from '@reduxjs/toolkit/query/react';
import type {
    PageResult,
    UpdateMeRequest,
    User,
    UserProfile,
    GetUsersQuery,
    CreateUserRequest,
    UpdateUserRequest,
    ResetPasswordResponse
} from '../types';
import { baseQueryWithAuth } from './baseQueryWithAuth';

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: baseQueryWithAuth,
  refetchOnMountOrArgChange: true,
  tagTypes: ['Me', 'Profile', 'Users', 'User'],
  endpoints: (builder) => ({
    getMyProfile: builder.query<UserProfile, void>({
      query: () => '/users/me/profile',
      providesTags: ['User', 'Me'],
    }),

    updateMe: builder.mutation<User, UpdateMeRequest>({
      query: (body) => ({
        url: '/users/me',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Me', 'Profile'],
    }),

    listUsers: builder.query<PageResult<User>, GetUsersQuery | void>({
      query: (params) => ({
        url: '/users',
        method: 'GET',
        params: params
          ? {
              search: params.q || undefined,
              isActive: params.isActive,
              isBlocked: params.isBlocked,
              page: params.page,
              limit: params.limit,
            }
          : {},
      }),
      providesTags: (result) =>
        result
          ? [
              'Users',
              ...result.items.map((u) => ({ type: 'User' as const, id: u.id })),
            ]
          : ['Users'],
    }),

    searchUsersDirectory: builder.query<PageResult<User>, GetUsersQuery | void>({
      query: (params) => ({
        url: '/users/directory',
        method: 'GET',
        params: params
          ? {
              search: params.q || undefined,
              page: params.page,
              limit: params.limit,
            }
          : {},
      }),
      providesTags: ['Users'],
    }),

    getUserById: builder.query<UserProfile, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'User', id }],
    }),

    getUserProfileById: builder.query<UserProfile, string>({
      query: (id) => `/users/${id}/profile`,
      providesTags: (_res, _err, id) => [{ type: 'User', id }],
    }),

    createUser: builder.mutation<User, CreateUserRequest>({
    query: (body) => ({
        url: '/users',
        method: 'POST',
        body,
    }),
    invalidatesTags: ['Users'],
    }),

    updateUser: builder.mutation<User, { id: string; body: UpdateUserRequest }> ({
        query: ({ id, body }) => ({
            url: `/users/${id}`,
            method: 'PUT',
            body,
        }),
        invalidatesTags: (_res, _err, { id }) => [{ type: 'User', id }],
    }),

    blockUser: builder.mutation<{ ok: true }, string>({
      query: (id) => ({
        url: `/users/${id}/block`,
        method: 'POST',
      }),
      invalidatesTags: (_res, _err, id) => ['Users', { type: 'User', id }],
    }),

    unblockUser: builder.mutation<{ ok: true }, string>({
      query: (id) => ({
        url: `/users/${id}/unblock`,
        method: 'POST',
      }),
      invalidatesTags: (_res, _err, id) => ['Users', { type: 'User', id }],
    }),

    activateUser: builder.mutation<{ ok: true }, string>({
      query: (id) => ({
        url: `/users/${id}/activate`,
        method: 'POST',
      }),
      invalidatesTags: (_res, _err, id) => ['Users', { type: 'User', id }],
    }),

    deactivateUser: builder.mutation<{ ok: true }, string>({
      query: (id) => ({
        url: `/users/${id}/deactivate`,
        method: 'POST',
      }),
      invalidatesTags: (_res, _err, id) => ['Users', { type: 'User', id }],
    }),

    resetUserPassword: builder.mutation<ResetPasswordResponse, { id: string; newPassword?: string }>({
      query: ({ id, newPassword }) => ({
        url: `/users/${id}/reset-password`,
        method: 'POST',
        body: newPassword ? { newPassword } : {},
      }),
      invalidatesTags: (_res, _err, { id }) => ['Users', { type: 'User', id }],
    }),

    deleteUser: builder.mutation<{ ok: true }, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users'],
    }),

  }),
});

export const {
  useGetMyProfileQuery,
  useUpdateMeMutation,

  useListUsersQuery,
  useSearchUsersDirectoryQuery,
  useGetUserByIdQuery,
  useGetUserProfileByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
  useActivateUserMutation,
  useDeactivateUserMutation,
  useResetUserPasswordMutation,
  useDeleteUserMutation,
} = usersApi;
