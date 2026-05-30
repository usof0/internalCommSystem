import React from 'react';

import { Button } from '../../../../../components/ui/Button';
import { BackButton } from '../../../../../components/ui/BackButton';

import type { UserDetailsHeaderProps } from './UserDetailsHeader.types';

export const UserDetailsHeader: React.FC<UserDetailsHeaderProps> = ({
  onBack,
  email,
  displayName,
  firstName,
  lastName,
  isActive,
  isBlocked,
  isEditing,
  onStartEdit,
  onCancel,
  onSave,
  isSaving,
  canDelete,
  onDelete,
}) => {
  const name = displayName || [firstName, lastName].filter(Boolean).join(' ') || email;

  return (
    <header className="user-details-admin-header">
      <div className="user-details-admin-header__main">
        <BackButton onClick={onBack} label="К пользователям" compact />

        <div className="user-details-heading">
          <span>Профиль пользователя</span>
          <h1>{name}</h1>
          <p>{email}</p>
          <div className="user-details-admin-header__meta">
            <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
              {isActive ? 'Активен' : 'Неактивен'}
            </span>
            <span className={`status-badge ${isBlocked ? 'blocked' : 'active'}`}>
              {isBlocked ? 'Заблокирован' : 'Не заблокирован'}
            </span>
          </div>
        </div>
      </div>

      <div className="user-details-admin-header__actions">
        {!isEditing ? (
          <>
            <Button variant="primary" onClick={onStartEdit}>
              Редактировать
            </Button>
            {canDelete ? (
              <Button variant="danger" onClick={onDelete}>
                Удалить
              </Button>
            ) : null}
          </>
        ) : (
          <>
            <Button onClick={onCancel} disabled={!!isSaving}>
              Отмена
            </Button>
            <Button variant="primary" onClick={onSave} disabled={!!isSaving}>
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </>
        )}
      </div>
    </header>
  );
};
