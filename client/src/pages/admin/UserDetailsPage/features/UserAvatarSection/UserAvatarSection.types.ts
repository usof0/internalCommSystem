export type UserAvatarSectionProps = {
  email: string;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  editingAvatarUrl: string;
  isEditing: boolean;
  onChangeAvatarUrl: (value: string) => void;
};
