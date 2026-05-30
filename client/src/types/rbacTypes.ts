export interface Permission {
  id: string;
  code: string;
  description?: string | null;
  module?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
}

export interface AddRolePermissionsRequest {
  permissionCodes: string[];
}

export interface AssignUserRolesRequest {
  // New preferred way:
  roleIds?: string[];

  // Backward compatible:
  roleNames?: string[];
}

export interface OkResponse {
  ok: true;
}

export interface UserRoleRow {
  userId: string;
  roleId: string;
  createdAt?: string;
  deletedAt?: string | null;
  role: {
    id: string;
    name: string;
    description?: string | null;
  };
}

// ---- Room RBAC ----

export interface RoomPermission {
  id: string;
  code: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoomRole {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  permissions: RoomPermission[];
}

export interface CreateRoomRoleRequest {
  name: string;
  description?: string;
}

export interface UpdateRoomRoleRequest {
  name?: string;
  description?: string;
}

export interface AddRoomRolePermissionsRequest {
  permissionCodes: string[];
}
