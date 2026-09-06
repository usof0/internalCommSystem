import React from 'react';

import { FormGroup, Input } from '../../../../../components/ui/Form';
import { ProfileInfoItem } from '../shared/components/ProfileInfoItem';
import { ProfileSectionHeader } from '../shared/components/ProfileSectionHeader';

import type { UserBasicInfoSectionProps } from './UserBasicInfoSection.types';

export const UserBasicInfoSection: React.FC<UserBasicInfoSectionProps> = ({
  email,
  profile,
  isEditing,
  formData,
  onChange,
}) => {
  return (
    <div className="profile-section">
      <ProfileSectionHeader>
        <h3>Основная информация</h3>
      </ProfileSectionHeader>

      <ProfileInfoItem>
        <span className="label">Email:</span>
        <span className="value">{email}</span>
      </ProfileInfoItem>

      {isEditing ? (
        <>
          <FormGroup>
            <label>Отображаемое имя</label>
            <Input
              value={formData.displayName}
              onChange={(e) => onChange({ ...formData, displayName: e.target.value })}
              placeholder="Введите отображаемое имя"
            />
          </FormGroup>

          <FormGroup>
            <label>Имя</label>
            <Input
              value={formData.firstName}
              onChange={(e) => onChange({ ...formData, firstName: e.target.value })}
              placeholder="Введите имя"
            />
          </FormGroup>

          <FormGroup>
            <label>Отчество</label>
            <Input
              value={formData.secondName}
              onChange={(e) => onChange({ ...formData, secondName: e.target.value })}
              placeholder="Введите отчество"
            />
          </FormGroup>

          <FormGroup>
            <label>Фамилия</label>
            <Input
              value={formData.lastName}
              onChange={(e) => onChange({ ...formData, lastName: e.target.value })}
              placeholder="Введите фамилию"
            />
          </FormGroup>
        </>
      ) : (
        <>
          <ProfileInfoItem>
            <span className="label">Отображаемое имя:</span>
            <span className="value">{profile.displayName || ''}</span>
          </ProfileInfoItem>

          <ProfileInfoItem>
            <span className="label">Имя:</span>
            <span className="value">{profile.firstName || ''}</span>
          </ProfileInfoItem>

          <ProfileInfoItem>
            <span className="label">Отчество:</span>
            <span className="value">{profile.secondName || ''}</span>
          </ProfileInfoItem>

          <ProfileInfoItem>
            <span className="label">Фамилия:</span>
            <span className="value">{profile.lastName || ''}</span>
          </ProfileInfoItem>
        </>
      )}
    </div>
  );
};
