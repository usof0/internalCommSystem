import React from 'react';

import type { OrgTagsSectionProps } from './OrgTagsSection.types';

export const OrgTagsSection: React.FC<OrgTagsSectionProps> = ({
  tags,
  availableTags,
  canManage,
  onAddTag,
  onRemoveTag,
}) => {
  return (
    <div className="org-details-section">
      <div className="org-details-section__header">
        <h3 className="org-details-section__title">Теги</h3>
      </div>
      <div className="org-tags-row">
        {tags.map((tag) => (
          <span key={tag.id} className="org-tag-chip">
            {tag.name}
            {canManage ? (
              <button
                className="org-tag-chip__remove"
                onClick={() => onRemoveTag(tag.id)}
                title="Убрать тег"
              >
                ✕
              </button>
            ) : null}
          </span>
        ))}
        {canManage && availableTags.length > 0 ? (
          <select
            className="select org-tag-add-select"
            value=""
            onChange={(event) => event.target.value && onAddTag(event.target.value)}
          >
            <option value="">+ Добавить тег</option>
            {availableTags.map((tag) => (
              <option key={tag.id} value={tag.id}>{tag.name}</option>
            ))}
          </select>
        ) : null}
        {tags.length === 0 && !(canManage && availableTags.length > 0) ? (
          <span className="org-details-empty-hint">Теги не назначены</span>
        ) : null}
      </div>
    </div>
  );
};
