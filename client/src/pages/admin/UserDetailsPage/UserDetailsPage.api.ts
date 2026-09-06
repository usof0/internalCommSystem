import {
  useActivateUserMutation,
  useBlockUserMutation,
  useDeactivateUserMutation,
  useDeleteUserMutation,
  useGetUserProfileByIdQuery,
  useResetUserPasswordMutation,
  useUnblockUserMutation,
  useUpdateUserMutation,
} from '../../../api/usersApi';
import {
  useAssignUserRolesMutation,
  useListRolesQuery,
  useListUserRolesQuery,
  useRemoveUserRoleMutation,
} from '../../../api/rbacApi';
import type { UpdateUserRequest } from '../../../types';

import type { UserProfileFormData } from './UserDetailsPage.types';

export const useUserDetailsData = (userId?: string) =>
  useGetUserProfileByIdQuery(userId || '', {
    skip: !userId,
  });

export const useUserRolesData = (userId?: string) =>
  useListUserRolesQuery(userId || '', {
    skip: !userId,
  });

export const useAvailableRolesData = () => useListRolesQuery();

export const useUpdateUserProfile = useUpdateUserMutation;
export const useBlockUser = useBlockUserMutation;
export const useUnblockUser = useUnblockUserMutation;
export const useActivateUser = useActivateUserMutation;
export const useDeactivateUser = useDeactivateUserMutation;
export const useDeleteUser = useDeleteUserMutation;
export const useAssignUserRoles = useAssignUserRolesMutation;
export const useRemoveUserRole = useRemoveUserRoleMutation;
export const useResetUserPassword = useResetUserPasswordMutation;

export const toUpdateUserRequest = (formData: UserProfileFormData): UpdateUserRequest => ({
  firstName: formData.firstName || null,
  secondName: formData.secondName || null,
  lastName: formData.lastName || null,
  displayName: formData.displayName || null,
  avatarUrl: formData.avatarUrl || null,
});
