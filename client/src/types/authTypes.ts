import type { User } from '.';

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  secondName?: string;
  displayName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthzInfo {
  roles?: string[];
  permissions: string[];
}

export interface SessionResponse {
  token: string;
  user: User;
  authz: AuthzInfo;
  mustChangePassword?: boolean;
}

export interface RegisterRequestResponse {
  ok: true;
  message: string;
}

export interface MeResponse {
  user: User;
  authz: AuthzInfo;
}

export interface RequestPasswordResetRequest {
  email: string;
  reason?: string;
}

export interface PasswordResetRequestUser {
  id: string;
  email: string;
  firstName?: string | null;
  secondName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  isActive: boolean;
  isBlocked: boolean;
}

export type PasswordResetRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'USED' | 'EXPIRED';

export interface PasswordResetRequestItem {
  id: string;
  userId: string;
  requestedEmail: string;
  reason?: string | null;
  status: PasswordResetRequestStatus;
  expiresAt: string;
  temporaryPasswordExpiresAt?: string | null;
  processedAt?: string | null;
  rejectReason?: string | null;
  createdAt: string;
  updatedAt: string;
  user: PasswordResetRequestUser;
  processedBy?: {
    id: string;
    email: string;
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

export interface ApprovePasswordResetResponse {
  ok: true;
  temporaryPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export type RegistrationRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RegistrationRequestItem {
  id: string;
  email: string;
  firstName?: string | null;
  secondName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  status: RegistrationRequestStatus;
  processedById?: string | null;
  processedAt?: string | null;
  rejectReason?: string | null;
  createdUserId?: string | null;
  createdAt: string;
  updatedAt: string;
  processedBy?: {
    id: string;
    email: string;
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

export interface ApproveRegistrationRequestResponse {
  ok: true;
  user: User;
}
