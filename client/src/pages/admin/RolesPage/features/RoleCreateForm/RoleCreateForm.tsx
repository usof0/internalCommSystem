import React from 'react';

import type { RoleCreateFormProps } from './RoleCreateForm.types';

export const RoleCreateForm: React.FC<RoleCreateFormProps> = ({
  value,
  isCreating,
  onChange,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="create-role-form">
      <div className="form-row">
        <div className="form-group">
          <label>Название роли *</label>
          <input
            className="input"
            value={value.name}
            onChange={(event) => onChange({ ...value, name: event.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Описание</label>
          <input
            className="input"
            value={value.description}
            onChange={(event) => onChange({ ...value, description: event.target.value })}
          />
        </div>
      </div>

      <button className="btn btn-primary" type="submit" disabled={isCreating}>
        {isCreating ? 'Создание...' : 'Создать'}
      </button>
    </form>
  );
};
