import React from 'react';

import { Button } from '../../../../../components/ui/Button';

import type { OrgDetailsEditFormProps } from './OrgDetailsEditForm.types';

export const OrgDetailsEditForm: React.FC<OrgDetailsEditFormProps> = ({
  name,
  description,
  error,
  isSaving,
  onChangeName,
  onChangeDescription,
  onCancel,
  onSave,
}) => {
  return (
    <div className="org-details-section">
      <h3 className="org-details-section__title">Редактирование</h3>
      <div className="org-edit-form">
        <div className="form-group">
          <label className="form-label">Название</label>
          <input
            className="input"
            value={name}
            onChange={(event) => onChangeName(event.target.value)}
            autoFocus
          />
        </div>
        <div className="form-group">
          <label className="form-label">Описание</label>
          <input
            className="input"
            value={description}
            onChange={(event) => onChangeDescription(event.target.value)}
            placeholder="Описание (необязательно)"
          />
        </div>
        {error ? <p className="org-details-error">{error}</p> : null}
        <div className="org-edit-form__actions">
          <Button onClick={onCancel}>Отмена</Button>
          <Button variant="primary" loading={isSaving} onClick={onSave}>Сохранить</Button>
        </div>
      </div>
    </div>
  );
};
