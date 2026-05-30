export type OrgDetailsEditFormProps = {
  name: string;
  description: string;
  error: string | null;
  isSaving: boolean;
  onChangeName: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
};
