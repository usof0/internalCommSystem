import React from 'react';

import { ProfileSectionHeader } from '../shared/components/ProfileSectionHeader';

import type { UserOrganizationsSectionProps } from './UserOrganizationsSection.types';
import { OrganizationMembershipCard } from './components/OrganizationMembershipCard';

export const UserOrganizationsSection: React.FC<UserOrganizationsSectionProps> = ({ memberships }) => {
  return (
    <div className="profile-organizations">
      <ProfileSectionHeader>
        <h3>Организации</h3>
      </ProfileSectionHeader>

      {memberships.length === 0 ? (
        <p className="placeholder-text">Пользователь не состоит ни в одной организации</p>
      ) : (
        <div className="organizations-list">
          {memberships.map((membership) => (
            <OrganizationMembershipCard key={membership.id} membership={membership} />
          ))}
        </div>
      )}
    </div>
  );
};
