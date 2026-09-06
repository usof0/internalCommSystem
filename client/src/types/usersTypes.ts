import type { OrganizationMembership, AuthzInfo } from ".";

export interface User {
  id: string;
  email: string;

  firstName?: string | null;
  secondName?: string | null;
  lastName?: string | null;
  displayName?: string | null;

  avatarUrl?: string | null;

  isActive: boolean;
  isBlocked: boolean;
}

export interface UserProfile extends User{
  organizationMemberships: OrganizationMembership[];
}

export interface ProfileResponse {
  user: UserProfile;
  authz: AuthzInfo;
}

export interface GetUsersQuery {
  q?: string;
  isActive?: boolean;
  isBlocked?: boolean;
  page?: number;
  limit?: number;
}

export interface UpdateMeRequest {
  firstName?: string | null;
  secondName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export interface UpdateUserRequest {
  firstName?: string | null;
  secondName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export interface CreateUserRequest {
  email: string;
  firstName?: string;
  secondName?: string;
  lastName?: string;
  displayName?: string;
  roleIds?: string[];
  password: string;
}

export interface ResetPasswordResponse {
  ok: true;
  temporaryPassword?: string;
}
