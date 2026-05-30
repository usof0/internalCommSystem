import { useGetMyProfileQuery, useUpdateMeMutation } from '../../../../api/usersApi';
import type { UpdateMeRequest, UserProfile } from '../../../../types';

import type { ProfileFormData } from './ProfileOverview.types';

export const useMyProfileData = (skip: boolean) =>
  useGetMyProfileQuery(undefined, {
    skip,
  });

export const useUpdateMyProfile = useUpdateMeMutation;

export const createProfileFormData = (profile?: UserProfile): ProfileFormData => ({
  firstName: profile?.firstName || '',
  secondName: profile?.secondName || '',
  lastName: profile?.lastName || '',
  displayName: profile?.displayName || '',
  avatarUrl: profile?.avatarUrl || '',
});

export const toUpdateMeRequest = (formData: ProfileFormData): UpdateMeRequest => ({
  firstName: formData.firstName || null,
  secondName: formData.secondName || null,
  lastName: formData.lastName || null,
  displayName: formData.displayName || null,
  avatarUrl: formData.avatarUrl || null,
});
