import React from 'react';

import { ProfileSectionHeader } from '../../../admin/UserDetailsPage/features';

import styles from './ProfileRoles.module.css';
import type { ProfileRolesProps } from './ProfileRoles.types';
import { ProfileRoleCard } from './components/ProfileRoleCard';

export const ProfileRoles: React.FC<ProfileRolesProps> = ({ roles }) => {
  return (
    <section>
      <ProfileSectionHeader>
        <h3>Роли</h3>
      </ProfileSectionHeader>

      <div className={styles.grid}>
        {roles.map((role) => (
          <ProfileRoleCard key={role.role.id} role={role.role} />
        ))}
      </div>
    </section>
  );
};
