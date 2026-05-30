import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  ApprovePasswordResetResponse,
  ChangePasswordRequest,
  MeResponse,
  LoginRequest,
  PasswordResetRequestItem,
  RegisterRequestResponse,
  RegistrationRequestItem,
  RegisterRequest,
  RequestPasswordResetRequest,
  SessionResponse,
  ApproveRegistrationRequestResponse,
} from '../types';
import { baseQueryWithAuth } from './baseQueryWithAuth';
import { usersApi } from './usersApi';


export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithAuth,
  refetchOnMountOrArgChange: true,
  tagTypes: ['User', 'PasswordResetRequests', 'RegistrationRequests'],
  endpoints: (builder) => ({
    login: builder.mutation<SessionResponse, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: 'POST',
        body,
      }),
      transformResponse: (response: any): SessionResponse => ({
        user: response.user,
        token: response.token ?? response.access_token ?? response.accessToken,
        authz: {
          permissions: response.authz?.permissions ?? response.permissions ?? [],
          roles: response.authz?.roles ?? response.roles ?? [],
        },
        mustChangePassword: response.mustChangePassword,
      }),
    }),
    register: builder.mutation<RegisterRequestResponse, RegisterRequest>({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
    }),
    getMe: builder.query<MeResponse, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
      transformResponse: (response: any): MeResponse => ({
        user: response.user ?? response,
        authz: {
          permissions: response.authz?.permissions ?? response.permissions ?? [],
          roles: response.authz?.roles ?? response.roles ?? [],
        }
      }),
    }),
    refresh: builder.mutation<SessionResponse, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
      transformResponse: (response: any): SessionResponse => ({
        user: response.user,
        token: response.token ?? response.access_token ?? response.accessToken,
        authz: {
          permissions: response.authz?.permissions ?? response.permissions ?? [],
          roles: response.authz?.roles ?? response.roles ?? [],
        },
        mustChangePassword: response.mustChangePassword,
      }),
      invalidatesTags: ['User'],
    }),
    requestPasswordReset: builder.mutation<{ ok: true; message: string }, RequestPasswordResetRequest>({
      query: (body) => ({
        url: '/auth/password-reset/request',
        method: 'POST',
        body,
      }),
    }),
    listPasswordResetRequests: builder.query<PasswordResetRequestItem[], void>({
      query: () => '/auth/password-reset/requests',
      providesTags: ['PasswordResetRequests'],
    }),
    approvePasswordResetRequest: builder.mutation<ApprovePasswordResetResponse, string>({
      query: (id) => ({
        url: `/auth/password-reset/requests/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['PasswordResetRequests'],
    }),
    rejectPasswordResetRequest: builder.mutation<{ ok: true }, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/auth/password-reset/requests/${id}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['PasswordResetRequests'],
    }),
    listRegistrationRequests: builder.query<RegistrationRequestItem[], void>({
      query: () => '/auth/registration-requests',
      providesTags: ['RegistrationRequests'],
    }),
    approveRegistrationRequest: builder.mutation<ApproveRegistrationRequestResponse, string>({
      query: (id) => ({
        url: `/auth/registration-requests/${id}/approve`,
        method: 'POST',
      }),
      async onQueryStarted(_id, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(usersApi.util.invalidateTags(['Users']));
      },
      invalidatesTags: ['RegistrationRequests', 'User'],
    }),
    rejectRegistrationRequest: builder.mutation<{ ok: true }, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/auth/registration-requests/${id}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['RegistrationRequests'],
    }),
    changePassword: builder.mutation<{ ok: true }, ChangePasswordRequest>({
      query: (body) => ({
        url: '/auth/change-password',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
     logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useRefreshMutation,
  useRequestPasswordResetMutation,
  useListPasswordResetRequestsQuery,
  useApprovePasswordResetRequestMutation,
  useRejectPasswordResetRequestMutation,
  useListRegistrationRequestsQuery,
  useApproveRegistrationRequestMutation,
  useRejectRegistrationRequestMutation,
  useChangePasswordMutation,
  useLogoutMutation,
} = authApi;
