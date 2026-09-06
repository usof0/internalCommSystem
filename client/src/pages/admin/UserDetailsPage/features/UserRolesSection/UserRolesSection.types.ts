import type { Role, UserRoleRow } from '../../../../../types';

export type UserRolesSectionProps = {
  canManageRoles: boolean;
  isAssigningRoles: boolean;
  onToggleAssigning: () => void;
  userRoles: UserRoleRow[];
  allRoles?: Role[];
  onAssignRole: (roleId: string) => Promise<void>;
  onRemoveRole: (roleId: string, roleName: string) => Promise<void>;
};
