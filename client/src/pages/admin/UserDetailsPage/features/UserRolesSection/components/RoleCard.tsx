import React from 'react';

import { Button } from '../../../../../../components/ui/Button';
import { Card } from '../../../../../../components/ui/Card';
import type { Role, UserRoleRow } from '../../../../../../types';

type Props = {
  role: Role | UserRoleRow['role'];
  actionLabel: string;
  actionVariant: 'primary' | 'danger';
  onAction: () => void;
};

export const RoleCard: React.FC<Props> = ({ role, actionLabel, actionVariant, onAction }) => {
  return (
    <Card
      actions={
        <Button size="sm" variant={actionVariant} onClick={onAction}>
          {actionLabel}
        </Button>
      }
    >
      <div>
        <h4 className="card-title">{role.name}</h4>
        {role.description ? <p className="card-text">{role.description}</p> : null}
      </div>
    </Card>
  );
};
