import type { UserProfile } from '../../../../types';

export type ProfileFormData = {
  firstName: string;
  secondName: string;
  lastName: string;
  displayName: string;
  avatarUrl: string;
};

export type ProfileOverviewProps = {
  profile: UserProfile;
  formData: ProfileFormData;
  isEditing: boolean;
  isSaving: boolean;
  onStartEdit: () => void;
  onOpenPasswordChange: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onChange: (next: ProfileFormData) => void;
};
