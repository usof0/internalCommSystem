export type UserDetailsHeaderProps = {
  onBack: () => void;
  email: string;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  isActive: boolean;
  isBlocked: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  isSaving?: boolean;
  canDelete: boolean;
  onDelete: () => void;
};
