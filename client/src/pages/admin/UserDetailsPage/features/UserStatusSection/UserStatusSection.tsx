import React from 'react';

import type { UserStatusSectionProps } from './UserStatusSection.types';

export const UserStatusSection: React.FC<UserStatusSectionProps> = ({ isActive, isBlocked }) => {
  return (
    <div className="profile-section">
      <h3>Статус</h3>

      <div className="profile-info-item">
        <span className="label">Активен:</span>
        <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
          {isActive ? 'Да' : 'Нет'}
        </span>
      </div>

      <div className="profile-info-item">
        <span className="label">Заблокирован:</span>
        <span className={`status-badge ${isBlocked ? 'blocked' : 'active'}`}>
          {isBlocked ? 'Да' : 'Нет'}
        </span>
      </div>
    </div>
  );
};
