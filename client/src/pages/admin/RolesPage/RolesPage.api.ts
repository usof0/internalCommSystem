import {
  useAddRolePermissionsMutation,
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useGetRoleQuery,
  useListPermissionsQuery,
  useListRolesQuery,
  useRemoveRolePermissionMutation,
  useUpdateRoleMutation,
} from '../../../api/rbacApi';

export const useRolesData = () => useListRolesQuery();
export const usePermissionsData = () => useListPermissionsQuery();
export const useRoleDetailsData = (roleId?: string | null) =>
  useGetRoleQuery(roleId || '', {
    skip: !roleId,
  });

export const useCreateRole = useCreateRoleMutation;
export const useUpdateRole = useUpdateRoleMutation;
export const useDeleteRole = useDeleteRoleMutation;
export const useAddRolePermissions = useAddRolePermissionsMutation;
export const useRemoveRolePermission = useRemoveRolePermissionMutation;
