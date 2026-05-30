import type { Permission, Role, RoleWithPermissions } from '../../../types';

export type RoleFormState = {
  name: string;
  description: string;
};

export type RolesPageSelection = string | null;

export type RolesListProps = {
  roles: Role[];
  selectedRoleId: string | null;
  onSelectRole: (roleId: string) => void;
};

export type RoleDetailsProps = {
  role: RoleWithPermissions;
  permissions: Permission[];
  onRenameRole: (roleId: string) => void;
  onDeleteRole: (roleId: string, roleName: string) => void;
  onAddPermission: (permissionCode: string) => void;
  onRemovePermission: (permissionId: string) => void;
};
