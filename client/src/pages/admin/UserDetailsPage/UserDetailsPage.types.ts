import type { UserProfile } from '../../../types';

export type UserProfileFormData = {
  firstName: string;
  secondName: string;
  lastName: string;
  displayName: string;
  avatarUrl: string;
};

export type UserDetailsPageParams = {
  userId: string;
};

export const createUserProfileFormData = (profile?: UserProfile): UserProfileFormData => ({
  firstName: profile?.firstName || '',
  secondName: profile?.secondName || '',
  lastName: profile?.lastName || '',
  displayName: profile?.displayName || '',
  avatarUrl: profile?.avatarUrl || '',
});
