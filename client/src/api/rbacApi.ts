import { createApi } from '@reduxjs/toolkit/query/react';

import type {
  Permission,
  Role,
  RoleWithPermissions,
  CreateRoleRequest,
  UpdateRoleRequest,
  AddRolePermissionsRequest,
  AssignUserRolesRequest,
  UserRoleRow,
  OkResponse,
  RoomPermission,
  RoomRole,
  CreateRoomRoleRequest,
  UpdateRoomRoleRequest,
  AddRoomRolePermissionsRequest,
} from '../types/rbacTypes';
import { baseQueryWithAuth } from './baseQueryWithAuth';


export const rbacApi = createApi({
  reducerPath: 'rbacApi',
  baseQuery: baseQueryWithAuth,
  refetchOnMountOrArgChange: true,
  tagTypes: ['Roles', 'Role', 'Permissions', 'UserRoles', 'RoomRoles', 'RoomPerms'],
  endpoints: (builder) => ({
    // -------------------------
    // Global RBAC
    // -------------------------

    listRoles: builder.query<Role[], void>({
      query: () => '/rbac/roles',
      providesTags: ['Roles'],
    }),

    getRole: builder.query<RoleWithPermissions, string>({
      query: (roleId) => `/rbac/roles/${roleId}`,
      providesTags: (_res, _err, roleId) => [{ type: 'Role', id: roleId }],
    }),

    createRole: builder.mutation<Role, CreateRoleRequest>({
      query: (body) => ({
        url: '/rbac/roles',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Roles'],
    }),

    // ✅ NEW: update role
    updateRole: builder.mutation<Role, { roleId: string; body: UpdateRoleRequest }>({
      query: ({ roleId, body }) => ({
        url: `/rbac/roles/${roleId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_res, _err, arg) => ['Roles', { type: 'Role', id: arg.roleId }],
    }),

    // ✅ NEW: delete role (soft delete)
    deleteRole: builder.mutation<OkResponse, string>({
      query: (roleId) => ({
        url: `/rbac/roles/${roleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Roles'],
    }),

    addRolePermissions: builder.mutation<
      RoleWithPermissions,
      { roleId: string; body: AddRolePermissionsRequest }
    >({
      query: ({ roleId, body }) => ({
        url: `/rbac/roles/${roleId}/permissions`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, arg) => ['Roles', { type: 'Role', id: arg.roleId }],
    }),

    removeRolePermission: builder.mutation<
      RoleWithPermissions,
      { roleId: string; permissionId: string }
    >({
      query: ({ roleId, permissionId }) => ({
        url: `/rbac/roles/${roleId}/permissions/${permissionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, arg) => ['Roles', { type: 'Role', id: arg.roleId }],
    }),

    // Permissions are read-only ✅
    listPermissions: builder.query<Permission[], void>({
      query: () => '/rbac/permissions',
      providesTags: ['Permissions'],
    }),

    // Assign roles to user (roleIds preferred; roleNames supported)
    assignUserRoles: builder.mutation<
      UserRoleRow[],
      { userId: string; body: AssignUserRolesRequest }
    >({
      query: ({ userId, body }) => ({
        url: `/rbac/users/${userId}/roles`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [{ type: 'UserRoles', id: arg.userId }],
    }),

    listUserRoles: builder.query<UserRoleRow[], string>({
      query: (userId) => `/rbac/users/${userId}/roles`,
      providesTags: (_res, _err, userId) => [{ type: 'UserRoles', id: userId }],
    }),

    listMyRoles: builder.query<UserRoleRow[], string>({
      query: () => `/rbac/users/me/roles`,
      providesTags: (_res, _err, userId) => [{ type: 'UserRoles', id: userId }],
    }),

    removeUserRole: builder.mutation<UserRoleRow[], { userId: string; roleId: string }>({
      query: ({ userId, roleId }) => ({
        url: `/rbac/users/${userId}/roles/${roleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, arg) => [{ type: 'UserRoles', id: arg.userId }],
    }),

    // -------------------------
    // Room RBAC
    // -------------------------

    listRoomRoles: builder.query<RoomRole[], void>({
      query: () => '/rbac/room/roles',
      providesTags: ['RoomRoles'],
    }),

    getRoomRole: builder.query<RoomRole, string>({
      query: (roomRoleId) => `/rbac/room/roles/${roomRoleId}`,
      providesTags: (_res, _err, id) => [{ type: 'RoomRoles', id }],
    }),

    createRoomRole: builder.mutation<RoomRole, CreateRoomRoleRequest>({
      query: (body) => ({
        url: '/rbac/room/roles',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['RoomRoles'],
    }),

    updateRoomRole: builder.mutation<
      RoomRole,
      { roomRoleId: string; body: UpdateRoomRoleRequest }
    >({
      query: ({ roomRoleId, body }) => ({
        url: `/rbac/room/roles/${roomRoleId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_res, _err, arg) => ['RoomRoles', { type: 'RoomRoles', id: arg.roomRoleId }],
    }),

    listRoomPermissions: builder.query<RoomPermission[], void>({
      query: () => '/rbac/room/permissions',
      providesTags: ['RoomPerms'],
    }),

    addRoomRolePermissions: builder.mutation<
      RoomRole,
      { roomRoleId: string; body: AddRoomRolePermissionsRequest }
    >({
      query: ({ roomRoleId, body }) => ({
        url: `/rbac/room/roles/${roomRoleId}/permissions`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, arg) => ['RoomRoles', { type: 'RoomRoles', id: arg.roomRoleId }],
    }),

    removeRoomRolePermission: builder.mutation<
      RoomRole,
      { roomRoleId: string; roomPermissionId: string }
    >({
      query: ({ roomRoleId, roomPermissionId }) => ({
        url: `/rbac/room/roles/${roomRoleId}/permissions/${roomPermissionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, arg) => ['RoomRoles', { type: 'RoomRoles', id: arg.roomRoleId }],
    }),
  }),
});

export const {
  useListRolesQuery,
  useGetRoleQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useAddRolePermissionsMutation,
  useRemoveRolePermissionMutation,
  useListPermissionsQuery,
  useAssignUserRolesMutation,
  useListUserRolesQuery,
  useListMyRolesQuery,
  useRemoveUserRoleMutation,

  useListRoomRolesQuery,
  useGetRoomRoleQuery,
  useCreateRoomRoleMutation,
  useUpdateRoomRoleMutation,
  useListRoomPermissionsQuery,
  useAddRoomRolePermissionsMutation,
  useRemoveRoomRolePermissionMutation,
} = rbacApi;
