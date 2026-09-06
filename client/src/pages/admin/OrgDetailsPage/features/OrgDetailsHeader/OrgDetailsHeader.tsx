import React from 'react';

import { Button } from '../../../../../components/ui/Button';
import { BackButton } from '../../../../../components/ui/BackButton';

import type { OrgDetailsHeaderProps } from './OrgDetailsHeader.types';

export const OrgDetailsHeader: React.FC<OrgDetailsHeaderProps> = ({
  org,
  breadcrumb,
  canManage,
  isEditing,
  memberCount,
  childCount,
  tagCount,
  onNavigateToList,
  onNavigateToOrg,
  onStartEdit,
  onRequestDelete,
}) => {
  return (
    <>
      <nav className="org-breadcrumb">
        <button className="org-breadcrumb__link" onClick={onNavigateToList}>
          Подразделения
        </button>
        {breadcrumb.slice(0, -1).map((ancestor) => (
          <React.Fragment key={ancestor.id}>
            <span className="org-breadcrumb__sep">/</span>
            <button
              className="org-breadcrumb__link"
              onClick={() => onNavigateToOrg(ancestor.id)}
            >
              {ancestor.name}
            </button>
          </React.Fragment>
        ))}
        {breadcrumb.length > 0 ? (
          <>
            <span className="org-breadcrumb__sep">/</span>
            <span className="org-breadcrumb__current">{org.name}</span>
          </>
        ) : null}
      </nav>

      <div className="org-details-header">
        <BackButton onClick={onNavigateToList} label="К подразделениям" compact />
        <div className="org-details-header__info">
          <span className="org-details-header__eyebrow">Подразделение</span>
          <h2 className="org-details-header__name">{org.name}</h2>
          <p className="org-details-header__desc">{org.description || 'Описание подразделения не задано'}</p>
          <div className="org-details-header__stats">
            <span>
              <strong>{memberCount}</strong>
              <small>участников</small>
            </span>
            <span>
              <strong>{childCount}</strong>
              <small>дочерних</small>
            </span>
            <span>
              <strong>{tagCount}</strong>
              <small>тегов</small>
            </span>
          </div>
        </div>
        {canManage ? (
          <div className="org-details-header__actions">
            {!isEditing ? <Button size="sm" onClick={onStartEdit}>Редактировать</Button> : null}
            <Button size="sm" variant="danger" onClick={onRequestDelete}>Удалить</Button>
          </div>
        ) : null}
      </div>
    </>
  );
};
