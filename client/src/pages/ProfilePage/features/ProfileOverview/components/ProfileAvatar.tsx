import React from 'react';

import { FormGroup, Input } from '../../../../../components/ui/Form';

type Props = {
  email: string;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  editingAvatarUrl: string;
  isEditing: boolean;
  onChangeAvatarUrl: (value: string) => void;
};

export const ProfileAvatar: React.FC<Props> = ({
  email,
  displayName,
  firstName,
  lastName,
  avatarUrl,
  editingAvatarUrl,
  isEditing,
  onChangeAvatarUrl,
}) => {
  const initials = `${lastName?.[0] ?? ''}${firstName?.[0] ?? ''}`;
  const src = isEditing ? editingAvatarUrl : avatarUrl || '';

  return (
    <div className="profile-avatar-section">
      {src ? (
        <img
          src={src}
          alt={displayName ?? email}
          className="profile-avatar"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <div className="profile-avatar-placeholder">{initials || email[0].toUpperCase()}</div>
      )}

      {isEditing ? (
        <FormGroup label="URL аватара" className="profile-avatar-edit">
          <Input
            type="text"
            value={editingAvatarUrl}
            onChange={(event) => onChangeAvatarUrl(event.target.value)}
            placeholder="https://example.com/avatar.jpg"
          />
        </FormGroup>
      ) : null}
    </div>
  );
};
