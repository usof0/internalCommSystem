import React from 'react';

import { UserBasicInfoSection } from '../../../admin/UserDetailsPage/features';
import { UserStatusSection } from '../../../admin/UserDetailsPage/features';

import styles from './ProfileOverview.module.css';
import type { ProfileOverviewProps } from './ProfileOverview.types';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileAvatar } from './components/ProfileAvatar';

export const ProfileOverview: React.FC<ProfileOverviewProps> = ({
  profile,
  formData,
  isEditing,
  isSaving,
  onStartEdit,
  onOpenPasswordChange,
  onCancelEdit,
  onSave,
  onChange,
}) => {
  const handleBasicInfoChange = (next: {
    firstName: string;
    secondName: string;
    lastName: string;
    displayName: string;
  }) => {
    onChange({
      ...formData,
      ...next,
    });
  };

  return (
    <div className={styles.layout}>
      <ProfileHeader
        isEditing={isEditing}
        isSaving={isSaving}
        onStartEdit={onStartEdit}
        onOpenPasswordChange={onOpenPasswordChange}
        onCancel={onCancelEdit}
        onSave={onSave}
      />

      <div className={`profile-content ${styles.content}`}>
        <ProfileAvatar
          email={profile.email}
          displayName={profile.displayName}
          firstName={profile.firstName}
          lastName={profile.lastName}
          avatarUrl={profile.avatarUrl}
          editingAvatarUrl={formData.avatarUrl}
          isEditing={isEditing}
          onChangeAvatarUrl={(avatarUrl) => onChange({ ...formData, avatarUrl })}
        />

        <div className="profile-info">
          <UserBasicInfoSection
            email={profile.email}
            profile={profile}
            isEditing={isEditing}
            formData={formData}
            onChange={handleBasicInfoChange}
          />

          <UserStatusSection
            isActive={!!profile.isActive}
            isBlocked={!!profile.isBlocked}
          />
        </div>
      </div>
    </div>
  );
};
