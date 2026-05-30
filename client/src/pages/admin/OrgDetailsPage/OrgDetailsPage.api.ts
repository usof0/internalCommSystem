import {
  useAddOrgUnitMemberMutation,
  useAddOrgUnitTagMutation,
  useCreateOrgUnitMutation,
  useDeleteOrgUnitMutation,
  useGetOrgTreeQuery,
  useGetOrgUnitByIdQuery,
  useGetOrgUnitMembersQuery,
  useGetOrgUnitTagsQuery,
  useListPositionsQuery,
  useListTagsQuery,
  useRemoveOrgUnitMemberMutation,
  useRemoveOrgUnitTagMutation,
  useUpdateOrgUnitMutation,
} from '../../../api/orgsApi';
import { useListUsersQuery } from '../../../api/usersApi';

export const useOrgDetailsData = (orgId?: string) => {
  const orgQuery = useGetOrgUnitByIdQuery(orgId || '', { skip: !orgId });
  const membersQuery = useGetOrgUnitMembersQuery(orgId || '', { skip: !orgId });
  const treeQuery = useGetOrgTreeQuery();
  const positionsQuery = useListPositionsQuery();
  const tagsQuery = useListTagsQuery();
  const orgTagsQuery = useGetOrgUnitTagsQuery(orgId || '', { skip: !orgId });
  const usersQuery = useListUsersQuery({ limit: 100 });

  return {
    orgQuery,
    membersQuery,
    treeQuery,
    positionsQuery,
    tagsQuery,
    orgTagsQuery,
    usersQuery,
  };
};

export const useUpdateOrgUnit = useUpdateOrgUnitMutation;
export const useDeleteOrgUnit = useDeleteOrgUnitMutation;
export const useCreateOrgUnit = useCreateOrgUnitMutation;
export const useAddOrgMember = useAddOrgUnitMemberMutation;
export const useRemoveOrgMember = useRemoveOrgUnitMemberMutation;
export const useAddOrgTag = useAddOrgUnitTagMutation;
export const useRemoveOrgTag = useRemoveOrgUnitTagMutation;
