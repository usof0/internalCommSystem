import type { Tag } from '../../../../../types';

export type OrgTagsSectionProps = {
  tags: Tag[];
  availableTags: Tag[];
  canManage: boolean;
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
};
