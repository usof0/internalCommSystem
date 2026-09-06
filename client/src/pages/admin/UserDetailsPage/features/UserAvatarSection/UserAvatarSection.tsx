import React from 'react';

import { Input } from '../../../../../components/ui/Form';

import type { UserAvatarSectionProps } from './UserAvatarSection.types';

export const UserAvatarSection: React.FC<UserAvatarSectionProps> = ({
  email,
  displayName,
  firstName,
  lastName,
  avatarUrl,
  editingAvatarUrl,
  isEditing,
  onChangeAvatarUrl,
}) => {
  const initials = (lastName?.[0] ?? '') + (firstName?.[0] ?? '');
  const src = isEditing ? editingAvatarUrl : avatarUrl || '';

  return (
    <div className="profile-avatar-section">
      {src ? (
        <img
          src={src}
          alt={displayName ?? email}
          className="profile-avatar"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <div className="profile-avatar-placeholder">{initials || email[0].toUpperCase()}</div>
      )}

      {isEditing ? (
        <div className="form-group profile-avatar-edit">
          <label>URL аватара</label>
          <Input
            type="text"
            value={editingAvatarUrl}
            onChange={(e) => onChangeAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.jpg"
          />
        </div>
      ) : null}
    </div>
  );
};
