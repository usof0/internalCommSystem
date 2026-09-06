import React from 'react';

import { PermissionRow } from './components/PermissionRow';
import type { RoleDetailsProps } from '../../RolesPage.types';

export const RoleDetails: React.FC<RoleDetailsProps> = ({
  role,
  permissions,
  onRenameRole,
  onDeleteRole,
  onAddPermission,
  onRemovePermission,
}) => {
  const availablePermissions = permissions.filter(
    (permission) => !role.permissions.some((rolePermission) => rolePermission.id === permission.id)
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>Детали роли: {role.name}</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-sm" onClick={() => onRenameRole(role.id)}>
            Переименовать
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onDeleteRole(role.id, role.name)}
          >
            Удалить
          </button>
        </div>
      </div>

      <div className="role-permissions-section" style={{ marginTop: '1.5rem' }}>
        <h4 style={{ marginBottom: '1rem' }}>Права доступа ({role.permissions.length})</h4>

        {permissions.length === 0 ? (
          <div className="empty-state">Нет доступных прав</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {role.permissions.map((permission) => (
              <PermissionRow
                key={permission.id}
                permission={permission}
                actionLabel="Убрать"
                actionClassName="btn btn-danger btn-sm"
                actionStyle={{
                  color: 'var(--text-on-primary)',
                }}
                onAction={() => onRemovePermission(permission.id)}
              />
            ))}

            {availablePermissions.map((permission) => (
              <PermissionRow
                key={permission.id}
                permission={permission}
                actionLabel="Добавить"
                actionClassName="btn btn-sm"
                actionStyle={{
                  backgroundColor: 'var(--success)',
                  borderColor: 'var(--success)',
                  color: 'var(--text-on-primary)',
                }}
                onAction={() => onAddPermission(permission.code)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
