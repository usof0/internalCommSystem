import React from 'react';

import type { RolesListProps } from '../../RolesPage.types';

export const RolesList: React.FC<RolesListProps> = ({
  roles,
  selectedRoleId,
  onSelectRole,
}) => {
  return (
    <div>
      <h3 style={{ marginBottom: '1rem' }}>Список ролей</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {roles.map((role) => (
          <div
            key={role.id}
            className={`role-card ${selectedRoleId === role.id ? 'selected' : ''}`}
            onClick={() => onSelectRole(role.id)}
            style={{
              padding: '1rem',
              border: `2px solid ${selectedRoleId === role.id ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: '0.5rem',
              cursor: 'pointer',
              backgroundColor:
                selectedRoleId === role.id ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ marginBottom: '0.25rem' }}>{role.name}</h4>
                {role.description ? (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {role.description}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
