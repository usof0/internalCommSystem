import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { User, Role, Permission } from '../types';
import type { RootState } from '../app/store';

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'ENDPOINT_ADMIN_BASE',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Users', 'Roles', 'Permissions'],
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => 'ENDPOINT GET ALL USERS',
      providesTags: ['Users'],
    }),
    getUser: builder.query<User, string>({
      query: (userId) => `ENDPOINT GET USER BY ID ${userId}`,
      providesTags: (_result, _error, id) => [{ type: 'Users', id }],
    }),
    createUser: builder.mutation<
      User,
      {
        email: string;
        firstName: string;
        lastName: string;
        password: string;
      }
    >({
      query: (data) => ({
        url: 'ENDPOINT POST CREATE USER',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Users'],
    }),
    updateUser: builder.mutation<
      User,
      {
        userId: string;
        email?: string;
        firstName?: string;
        lastName?: string;
      }
    >({
      query: ({ userId, ...data }) => ({
        url: `ENDPOINT PUT UPDATE USER ${userId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { userId }) => [{ type: 'Users', id: userId }, 'Users'],
    }),
    deleteUser: builder.mutation<void, string>({
      query: (userId) => ({
        url: `ENDPOINT DELETE USER ${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users'],
    }),
    getRoles: builder.query<Role[], void>({
      query: () => 'ENDPOINT GET ALL ROLES',
      providesTags: ['Roles'],
    }),
    createRole: builder.mutation<Role, { name: string; permissionIds: string[] }>({
      query: (data) => ({
        url: 'ENDPOINT POST CREATE ROLE',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Roles'],
    }),
    updateRole: builder.mutation<
      Role,
      { roleId: string; name?: string; permissionIds?: string[] }
    >({
      query: ({ roleId, ...data }) => ({
        url: `ENDPOINT PUT UPDATE ROLE ${roleId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Roles'],
    }),
    deleteRole: builder.mutation<void, string>({
      query: (roleId) => ({
        url: `ENDPOINT DELETE ROLE ${roleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Roles'],
    }),
    getPermissions: builder.query<Permission[], void>({
      query: () => 'ENDPOINT GET ALL PERMISSIONS',
      providesTags: ['Permissions'],
    }),
    assignRole: builder.mutation<void, { userId: string; roleId: string; organizationId: string }>({
      query: (data) => ({
        url: 'ENDPOINT POST ASSIGN ROLE TO USER',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Users'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetPermissionsQuery,
  useAssignRoleMutation,
} = adminApi;
