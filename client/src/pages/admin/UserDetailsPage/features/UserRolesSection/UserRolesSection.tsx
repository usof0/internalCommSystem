import React from 'react';

import { Button } from '../../../../../components/ui/Button';
import { EmptyState } from '../../../../../components/ui/States';
import { ProfileSectionHeader } from '../shared/components/ProfileSectionHeader';

import type { UserRolesSectionProps } from './UserRolesSection.types';
import { RoleCard } from './components/RoleCard';

export const UserRolesSection: React.FC<UserRolesSectionProps> = ({
  canManageRoles,
  isAssigningRoles,
  onToggleAssigning,
  userRoles,
  allRoles,
  onAssignRole,
  onRemoveRole,
}) => {
  if (!canManageRoles) return null;

  const availableRoles = (allRoles ?? []).filter(
    (role) => !userRoles.some((userRole) => userRole.roleId === role.id)
  );

  return (
    <div className="profile-section">
      <ProfileSectionHeader>
        <h3>Роли пользователя</h3>
        <Button size="sm" variant="primary" onClick={onToggleAssigning}>
          {isAssigningRoles ? 'Закрыть' : '+ Назначить роли'}
        </Button>
      </ProfileSectionHeader>

      {isAssigningRoles ? (
        <div className="profile-assign-panel">
          <h4>Доступные роли</h4>

          {availableRoles.length === 0 ? (
            <EmptyState text="Все роли уже назначены" />
          ) : (
            <div className="positions-grid">
              {availableRoles.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  actionLabel="Назначить"
                  actionVariant="primary"
                  onAction={() => {
                    void onAssignRole(role.id);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {userRoles.length === 0 ? (
        <p className="placeholder-text">У пользователя нет ролей</p>
      ) : (
        <div className="positions-grid">
          {userRoles.map((userRole) => (
            <RoleCard
              key={userRole.role.id}
              role={userRole.role}
              actionLabel="Удалить"
              actionVariant="danger"
              onAction={() => {
                void onRemoveRole(userRole.role.id, userRole.role.name);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
