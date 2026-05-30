import React from 'react';

import type { Permission } from '../../../../../../types';

type Props = {
  permission: Permission;
  actionLabel: string;
  actionClassName: string;
  actionStyle: React.CSSProperties;
  onAction: () => void;
};

export const PermissionRow: React.FC<Props> = ({
  permission,
  actionLabel,
  actionClassName,
  actionStyle,
  onAction,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '0.375rem',
        opacity: actionLabel === 'Добавить' ? 0.7 : 1,
      }}
    >
      <div>
        <div style={{ fontWeight: 500 }}>{permission.code}</div>
        {permission.description ? (
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {permission.description}
          </div>
        ) : null}
        {permission.module ? (
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              marginTop: '0.25rem',
            }}
          >
            Модуль: {permission.module}
          </div>
        ) : null}
      </div>
      <button className={actionClassName} onClick={onAction} style={actionStyle}>
        {actionLabel}
      </button>
    </div>
  );
};
