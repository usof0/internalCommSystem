import React from 'react';

import { Card } from '../../../../../components/ui/Card';
import type { UserRoleRow } from '../../../../../types';

type Props = {
  role: UserRoleRow['role'];
};

export const ProfileRoleCard: React.FC<Props> = ({ role }) => {
  return (
    <Card>
      <div>
        <h4 className="card-title">{role.name}</h4>
        {role.description ? <p className="card-text">{role.description}</p> : null}
      </div>
    </Card>
  );
};
