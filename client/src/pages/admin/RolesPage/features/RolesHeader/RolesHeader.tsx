import React from 'react';

import type { RolesHeaderProps } from './RolesHeader.types';

export const RolesHeader: React.FC<RolesHeaderProps> = ({ isCreating, onToggleCreate }) => {
  return (
    <div className="page-header">
      <h1>Роли и права</h1>
      <button onClick={onToggleCreate} className="btn btn-primary">
        {isCreating ? 'Отмена' : '+ Создать роль'}
      </button>
    </div>
  );
};
