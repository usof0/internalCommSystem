import type { Position, User } from '../../../../../types';

import type { GroupedOrgMember } from '../../OrgDetailsPage.types';

export type OrgMembersSectionProps = {
  members: GroupedOrgMember[];
  positions: Position[];
  canManage: boolean;
  isLoading: boolean;
  onOpenAddMember: () => void;
  onAddPosition: (userId: string, positionId: string) => void;
  onRemovePosition: (userId: string, positionId: string) => void;
  onRemoveMember: (member: GroupedOrgMember) => void;
};

export type AddMemberModalProps = {
  open: boolean;
  users: User[];
  positions: Position[];
  selectedUserId: string;
  selectedPositionId: string;
  error: string | null;
  isLoading: boolean;
  onClose: () => void;
  onChangeUser: (value: string) => void;
  onChangePosition: (value: string) => void;
  onSubmit: () => void;
};
