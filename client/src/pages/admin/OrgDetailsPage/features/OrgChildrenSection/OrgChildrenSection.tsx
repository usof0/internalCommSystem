import React from 'react';

import { Button } from '../../../../../components/ui/Button';
import { EmptyState } from '../../../../../components/ui/States';

import { OrgChildRow } from './components/OrgChildRow';
import type { OrgChildrenSectionProps } from './OrgChildrenSection.types';

export const OrgChildrenSection: React.FC<OrgChildrenSectionProps> = ({
  children,
  canManage,
  isCreating,
  childName,
  childDescription,
  childError,
  isSaving,
  onToggleCreating,
  onChangeChildName,
  onChangeChildDescription,
  onCancelCreate,
  onCreate,
  onOpenChild,
  onDeleteChild,
}) => {
  return (
    <div className="org-details-section">
      <div className="org-details-section__header">
        <h3 className="org-details-section__title">Дочерние подразделения ({children.length})</h3>
        {canManage ? (
          <Button size="sm" variant="primary" onClick={onToggleCreating}>
            {isCreating ? 'Отмена' : '+ Создать дочернее'}
          </Button>
        ) : null}
      </div>

      {isCreating ? (
        <div className="org-child-create-form">
          <div className="form-group">
            <label className="form-label">Название</label>
            <input
              className="input"
              value={childName}
              onChange={(event) => onChangeChildName(event.target.value)}
              autoFocus
              placeholder="Название подразделения"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Описание (необязательно)</label>
            <input
              className="input"
              value={childDescription}
              onChange={(event) => onChangeChildDescription(event.target.value)}
              placeholder="Описание"
            />
          </div>
          {childError ? <p className="org-details-error">{childError}</p> : null}
          <div className="org-child-create-form__actions">
            <Button onClick={onCancelCreate}>Отмена</Button>
            <Button variant="primary" loading={isSaving} onClick={onCreate}>Создать</Button>
          </div>
        </div>
      ) : null}

      {children.length === 0 && !isCreating ? <EmptyState text="Нет дочерних подразделений" /> : null}

      <div className="org-children-list">
        {children.map((child) => (
          <OrgChildRow
            key={child.id}
            child={child}
            canManage={canManage}
            onOpen={onOpenChild}
            onDelete={onDeleteChild}
          />
        ))}
      </div>
    </div>
  );
};
