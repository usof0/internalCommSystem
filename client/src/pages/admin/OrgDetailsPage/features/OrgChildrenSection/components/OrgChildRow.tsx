import React from 'react';

import { Button } from '../../../../../../components/ui/Button';
import type { OrgUnitNode } from '../../../../../../types';

type Props = {
  child: OrgUnitNode;
  canManage: boolean;
  onOpen: (childId: string) => void;
  onDelete: (childId: string, name: string) => void;
};

export const OrgChildRow: React.FC<Props> = ({ child, canManage, onOpen, onDelete }) => {
  return (
    <div className="org-child-row">
      <div className="org-child-row__left">
        <button className="org-child-row__name" onClick={() => onOpen(child.id)}>
          {child.name}
          {child.children.length > 0 ? (
            <span className="org-child-row__sub-count">{child.children.length} вложенных</span>
          ) : null}
        </button>
        {child.description ? <span className="org-child-row__desc">{child.description}</span> : null}
      </div>
      <div className="org-child-row__actions">
        <Button size="sm" onClick={() => onOpen(child.id)}>Открыть →</Button>
        {canManage ? (
          <Button size="sm" variant="danger" onClick={() => onDelete(child.id, child.name)}>
            Удалить
          </Button>
        ) : null}
      </div>
    </div>
  );
};
