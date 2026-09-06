import type { OrgUnitNode } from '../../../../../types';

export type OrgChildrenSectionProps = {
  children: OrgUnitNode[];
  canManage: boolean;
  isCreating: boolean;
  childName: string;
  childDescription: string;
  childError: string | null;
  isSaving: boolean;
  onToggleCreating: () => void;
  onChangeChildName: (value: string) => void;
  onChangeChildDescription: (value: string) => void;
  onCancelCreate: () => void;
  onCreate: () => void;
  onOpenChild: (childId: string) => void;
  onDeleteChild: (childId: string, name: string) => void;
};
