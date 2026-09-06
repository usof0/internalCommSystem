import { createApi } from '@reduxjs/toolkit/query/react';

import type {
  OrgTreeResponse,
  OrgUnit,
  CreateOrgUnitRequest,
  UpdateOrgUnitRequest,
  OkResponse,
  OrgUnitMembersResponse,
  AddOrgUnitMemberRequest,
  ChangeMemberPositionRequest,
  RemoveMemberRequest,
  Position,
  PositionRole,
  CreatePositionRequest,
  UpdatePositionRequest,
  AssignPositionRolesRequest,
  Tag,
  CreateTagRequest,
  UpdateTagRequest,
} from '../types/orgTypes';
import { baseQueryWithAuth } from './baseQueryWithAuth';

export const orgApi = createApi({
  reducerPath: 'orgApi',
  baseQuery: baseQueryWithAuth,
  refetchOnMountOrArgChange: true,
  tagTypes: ['OrgTree', 'OrgUnit', 'OrgUnitMembers', 'OrgUnitTags', 'Positions', 'PositionRoles', 'Tags'],
  endpoints: (builder) => ({
    // ====================================================== Org Units ===================================================

    getOrgTree: builder.query<OrgTreeResponse, void>({
      query: () => '/org/units/tree',
      providesTags: ['OrgTree'],
    }),

    getOrgUnitById: builder.query<OrgUnit, string>({
      query: (orgUnitId) => `/org/units/${orgUnitId}`,
      providesTags: (_res, _err, orgUnitId) => [{ type: 'OrgUnit', id: orgUnitId }],
    }),

    createOrgUnit: builder.mutation<OrgUnit, CreateOrgUnitRequest>({
      query: (body) => ({
        url: '/org/units',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['OrgTree'],
    }),

    updateOrgUnit: builder.mutation<OrgUnit, { orgUnitId: string; body: UpdateOrgUnitRequest }>({
      query: ({ orgUnitId, body }) => ({
        url: `/org/units/${orgUnitId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_res, _err, arg) => ['OrgTree', { type: 'OrgUnit', id: arg.orgUnitId }],
    }),

    deleteOrgUnit: builder.mutation<OkResponse, string>({
      query: (orgUnitId) => ({
        url: `/org/units/${orgUnitId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, orgUnitId) => ['OrgTree', { type: 'OrgUnit', id: orgUnitId }],
    }),

    // ========================================================== Members ===================================================

    getOrgUnitMembers: builder.query<OrgUnitMembersResponse, string>({
      query: (orgUnitId) => `/org/units/${orgUnitId}/members`,
      providesTags: (_res, _err, orgUnitId) => [{ type: 'OrgUnitMembers', id: orgUnitId }],
    }),

    addOrgUnitMember: builder.mutation<
      OkResponse,
      { orgUnitId: string; body: AddOrgUnitMemberRequest }
    >({
      query: ({ orgUnitId, body }) => ({
        url: `/org/units/${orgUnitId}/members`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [{ type: 'OrgUnitMembers', id: arg.orgUnitId }],
    }),

    changeOrgUnitMemberPosition: builder.mutation<
      OkResponse,
      { orgUnitId: string; userId: string; body: ChangeMemberPositionRequest }
    >({
      query: ({ orgUnitId, userId, body }) => ({
        url: `/org/units/${orgUnitId}/members/${userId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [{ type: 'OrgUnitMembers', id: arg.orgUnitId }],
    }),

    removeOrgUnitMember: builder.mutation<
      OkResponse,
      { orgUnitId: string; userId: string; body: RemoveMemberRequest }
    >({
      query: ({ orgUnitId, userId, body }) => ({
        url: `/org/units/${orgUnitId}/members/${userId}`,
        method: 'DELETE',
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [{ type: 'OrgUnitMembers', id: arg.orgUnitId }],
    }),

    // ================================================ Org Unit Tags ===================================================

    /**
     * GET /org/units/:id/tags
     * ⚠️  MISSING BACKEND ENDPOINT — needs implementation.
     * Returns tags assigned to a specific org unit.
     */
    getOrgUnitTags: builder.query<Tag[], string>({
      query: (orgUnitId) => `/org/units/${orgUnitId}/tags`,
      providesTags: (_res, _err, orgUnitId) => [{ type: 'OrgUnitTags', id: orgUnitId }],
    }),

    /**
     * POST /org/units/:id/tags/:tagId
     * ⚠️  MISSING BACKEND ENDPOINT — needs implementation.
     * Assigns a tag to an org unit.
     */
    addOrgUnitTag: builder.mutation<OkResponse, { orgUnitId: string; tagId: string }>({
      query: ({ orgUnitId, tagId }) => ({
        url: `/org/units/${orgUnitId}/tags/${tagId}`,
        method: 'POST',
      }),
      invalidatesTags: (_res, _err, { orgUnitId }) => [{ type: 'OrgUnitTags', id: orgUnitId }],
    }),

    /**
     * DELETE /org/units/:id/tags/:tagId
     * ⚠️  MISSING BACKEND ENDPOINT — needs implementation.
     * Removes a tag from an org unit.
     */
    removeOrgUnitTag: builder.mutation<OkResponse, { orgUnitId: string; tagId: string }>({
      query: ({ orgUnitId, tagId }) => ({
        url: `/org/units/${orgUnitId}/tags/${tagId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { orgUnitId }) => [{ type: 'OrgUnitTags', id: orgUnitId }],
    }),

    // ================================================ Positions =======================================================

    listPositions: builder.query<Position[], void>({
      query: () => '/org/positions',
      providesTags: ['Positions'],
    }),

    createPosition: builder.mutation<Position, CreatePositionRequest>({
      query: (body) => ({
        url: '/org/positions',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Positions'],
    }),

    updatePosition: builder.mutation<Position, { positionId: string; body: UpdatePositionRequest }>({
      query: ({ positionId, body }) => ({
        url: `/org/positions/${positionId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Positions'],
    }),

    deletePosition: builder.mutation<OkResponse, string>({
      query: (positionId) => ({
        url: `/org/positions/${positionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Positions'],
    }),

    listPositionRoles: builder.query<PositionRole[], string>({
      query: (positionId) => `/org/positions/${positionId}/roles`,
      providesTags: (_res, _err, positionId) => [{ type: 'PositionRoles', id: positionId }],
    }),

    assignPositionRoles: builder.mutation<
      PositionRole[],
      { positionId: string; body: AssignPositionRolesRequest }
    >({
      query: ({ positionId, body }) => ({
        url: `/org/positions/${positionId}/roles`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [{ type: 'PositionRoles', id: arg.positionId }],
    }),

    removePositionRole: builder.mutation<OkResponse, { positionId: string; roleId: string }>({
      query: ({ positionId, roleId }) => ({
        url: `/org/positions/${positionId}/roles/${roleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, arg) => [{ type: 'PositionRoles', id: arg.positionId }],
    }),

    // ======================================================= Tags =====================================================

    listTags: builder.query<Tag[], void>({
      query: () => '/org/tags',
      providesTags: ['Tags'],
    }),

    createTag: builder.mutation<Tag, CreateTagRequest>({
      query: (body) => ({
        url: '/org/tags',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Tags'],
    }),

    updateTag: builder.mutation<Tag, { tagId: string; body: UpdateTagRequest }>({
      query: ({ tagId, body }) => ({
        url: `/org/tags/${tagId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Tags'],
    }),

    deleteTag: builder.mutation<OkResponse, string>({
      query: (tagId) => ({
        url: `/org/tags/${tagId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tags'],
    }),
  }),
});

export const {
  useGetOrgTreeQuery,
  useGetOrgUnitByIdQuery,
  useCreateOrgUnitMutation,
  useUpdateOrgUnitMutation,
  useDeleteOrgUnitMutation,

  useGetOrgUnitMembersQuery,
  useAddOrgUnitMemberMutation,
  useChangeOrgUnitMemberPositionMutation,
  useRemoveOrgUnitMemberMutation,
  useGetOrgUnitTagsQuery,
  useAddOrgUnitTagMutation,
  useRemoveOrgUnitTagMutation,

  useListPositionsQuery,
  useCreatePositionMutation,
  useUpdatePositionMutation,
  useDeletePositionMutation,
  useListPositionRolesQuery,
  useAssignPositionRolesMutation,
  useRemovePositionRoleMutation,

  useListTagsQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
} = orgApi;
