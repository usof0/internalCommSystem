export interface OrganizationMembership {
  id: string;

  organizationId: string;
  organizationName: string;

  unitId?: string | null;
  orgUnitName?: string | null;

  positionId?: string | null;
  positionName?: string | null;

  roles: {
    id: string;
    name: string;
  }[];
}

export interface OrgUnit {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;

  createdAt?: string;
  updatedAt?: string;
}

export interface OrgUnitNode extends OrgUnit {
  children: OrgUnitNode[];
}

export interface OrgTreeResponse {
  items: OrgUnitNode[];
}

export interface CreateOrgUnitRequest {
  name: string;
  description?: string | null;
  parentId?: string | null;
}

export interface UpdateOrgUnitRequest {
  name?: string;
  description?: string | null;
  parentId?: string | null;
}

export interface OkResponse {
  ok: true;
}

// ---- Members ----

export interface OrgUnitMember {
  userId: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;

  positionId: string;
  positionName: string;

  joinedAt?: string;
}

export interface OrgUnitMembersResponse {
  items: OrgUnitMember[];
}

export interface AddOrgUnitMemberRequest {
  userId: string;
  positionId: string;
}

export interface ChangeMemberPositionRequest {
  fromPositionId: string;
  toPositionId: string;
}

export interface RemoveMemberRequest {
  positionId: string;
}

// ---- Positions ----

export interface Position {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PositionRole {
  roleId: string;
  roleName: string;
  roleDescription?: string | null;
}

export interface CreatePositionRequest {
  name: string;
  description?: string | null;
}

export interface UpdatePositionRequest {
  name?: string;
  description?: string | null;
}

export interface AssignPositionRolesRequest {
  roleIds: string[];
}


// -------- Tags --------

export interface Tag {
  id: string;
  name: string;
  createdAt?: string;
  deletedAt?: string | null;
}

export interface CreateTagRequest {
  name: string;
}

export interface UpdateTagRequest {
  name?: string;
}
