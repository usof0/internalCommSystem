import React from 'react';

import styles from './ProfileOrganizations.module.css';
import { getOrganizationCardKey } from './ProfileOrganizations.api';
import type { ProfileOrganizationsProps } from './ProfileOrganizations.types';
import { OrganizationMembershipCard } from './components/OrganizationMembershipCard';

export const ProfileOrganizations: React.FC<ProfileOrganizationsProps> = ({ memberships }) => {
  if (memberships.length === 0) {
    return <p className="placeholder-text">Пользователь не состоит ни в одной организации</p>;
  }

  return (
    <div className={styles.list}>
      {memberships.map((membership) => (
        <OrganizationMembershipCard
          key={getOrganizationCardKey(membership.id, membership.positionId)}
          membership={membership}
        />
      ))}
    </div>
  );
};
