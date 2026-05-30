import { useListMyRolesQuery } from '../../../../api/rbacApi';

export const useMyRoles = (userId?: string) =>
  useListMyRolesQuery(userId || '', {
    skip: !userId,
  });
