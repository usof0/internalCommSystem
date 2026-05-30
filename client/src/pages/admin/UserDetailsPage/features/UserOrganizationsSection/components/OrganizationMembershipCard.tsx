import React from 'react';

import { Card } from '../../../../../../components/ui/Card';
import type { OrganizationMembership } from '../../../../../../types';

type Props = {
  membership: OrganizationMembership;
};

export const OrganizationMembershipCard: React.FC<Props> = ({ membership }) => {
  return (
    <Card>
      <h4 className="card-title">{membership.organizationName}</h4>

      {membership.orgUnitName ? (
        <p className="card-text">
          <strong>Подразделение:</strong> {membership.orgUnitName}
        </p>
      ) : null}

      {membership.positionName ? (
        <p className="card-text">
          <strong>Должность:</strong> {membership.positionName}
        </p>
      ) : null}
    </Card>
  );
};
