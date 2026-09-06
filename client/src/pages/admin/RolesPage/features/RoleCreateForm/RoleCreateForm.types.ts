import type { RoleFormState } from '../../RolesPage.types';

export type RoleCreateFormProps = {
  value: RoleFormState;
  isCreating: boolean;
  onChange: (next: RoleFormState) => void;
  onSubmit: (event: React.FormEvent) => void;
};
