import type { OrgUnit, OrgUnitMember, OrgUnitNode, Position, Tag, User } from '../../../types';

export type OrgDetailsPageParams = {
  orgId: string;
};

export type GroupedOrgMember = {
  userId: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  positions: { positionId: string; positionName: string }[];
};

export type OrgDetailsPageData = {
  org?: OrgUnit;
  tree: OrgUnitNode[];
  members: OrgUnitMember[];
  positions: Position[];
  allTags: Tag[];
  orgTags: Tag[];
  allUsers: User[];
};
