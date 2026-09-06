import type { OrgUnit } from '../../../../../types';

export type OrgBreadcrumbItem = Pick<OrgUnit, 'id' | 'name'>;

export type OrgDetailsHeaderProps = {
  org: OrgUnit;
  breadcrumb: OrgBreadcrumbItem[];
  canManage: boolean;
  isEditing: boolean;
  memberCount: number;
  childCount: number;
  tagCount: number;
  onNavigateToList: () => void;
  onNavigateToOrg: (orgId: string) => void;
  onStartEdit: () => void;
  onRequestDelete: () => void;
};
