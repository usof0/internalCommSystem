import React from 'react';
import type { VisibilityScopeType, SetTopicVisibilityRequest } from '../../../types';
import { UserPicker } from './UserPicker';
import { OrgUnitPicker } from './OrgUnitPicker';
import { TagPicker } from './TagPicker';

interface Props {
  value: SetTopicVisibilityRequest;
  onChange: (v: SetTopicVisibilityRequest) => void;
}

const SCOPE_OPTIONS: { value: VisibilityScopeType; label: string; hint: string }[] = [
  {
    value: 'ALL_MEMBERS',
    label: 'Все участники',
    hint: 'Тема видна всем участникам комнаты',
  },
  {
    value: 'INCLUDE_MEMBERS',
    label: 'Только выбранные',
    hint: 'Тема видна только выбранным пользователям. Остальные участники не увидят эту тему.',
  },
  {
    value: 'EXCLUDE_MEMBERS',
    label: 'Все, кроме',
    hint: 'Тема скрыта от выбранных пользователей. Остальные участники видят тему.',
  },
  {
    value: 'ORG_UNIT',
    label: 'Подразделение',
    hint: 'Тема видна участникам выбранных подразделений',
  },
  {
    value: 'ORG_UNIT_TAG',
    label: 'Тег подразделения',
    hint: 'Тема видна участникам подразделений с выбранными тегами',
  },
];

export const VisibilityScopeEditor: React.FC<Props> = ({ value, onChange }) => {
  const setScopeType = (scopeType: VisibilityScopeType) => {
    // Reset sub-fields when changing scope type
    onChange({ scopeType });
  };

  const current = SCOPE_OPTIONS.find((o) => o.value === value.scopeType);

  return (
    <div className="visibility-editor">
      {/* Scope type tabs */}
      <div className="visibility-editor__tabs">
        {SCOPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`visibility-tab${value.scopeType === opt.value ? ' visibility-tab--active' : ''}`}
            onClick={() => setScopeType(opt.value)}
            title={opt.hint}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {current && value.scopeType !== 'ALL_MEMBERS' && (
        <p className="visibility-editor__hint">{current.hint}</p>
      )}

      {/* INCLUDE: selected users CAN see the topic */}
      {value.scopeType === 'INCLUDE_MEMBERS' && (
        <>
          <p className="visibility-editor__picker-label visibility-editor__picker-label--allow">
            ✓ Выбранные пользователи <strong>будут видеть</strong> тему:
          </p>
          <p className="visibility-editor__auto-note">
            Вы будете добавлены автоматически как создатель темы.
          </p>
          <UserPicker
            selectedIds={value.memberIds ?? []}
            onChange={(ids) => onChange({ ...value, memberIds: ids })}
            selectionMode="allow"
          />
        </>
      )}

      {/* EXCLUDE: selected users CANNOT see the topic */}
      {value.scopeType === 'EXCLUDE_MEMBERS' && (
        <>
          <p className="visibility-editor__picker-label visibility-editor__picker-label--deny">
            ✕ Выбранные пользователи <strong>НЕ будут видеть</strong> тему:
          </p>
          <UserPicker
            selectedIds={value.memberIds ?? []}
            onChange={(ids) => onChange({ ...value, memberIds: ids })}
            selectionMode="deny"
          />
        </>
      )}

      {/* Org unit picker */}
      {value.scopeType === 'ORG_UNIT' && (
        <div className="visibility-editor__org">
          <OrgUnitPicker
            selectedIds={value.orgUnitIds ?? []}
            onChange={(ids) => onChange({ ...value, orgUnitIds: ids })}
          />
          <label className="visibility-editor__subunits">
            <input
              type="checkbox"
              checked={value.includeSubUnits ?? false}
              onChange={(e) =>
                onChange({ ...value, includeSubUnits: e.target.checked })
              }
            />
            Включить дочерние подразделения
          </label>
        </div>
      )}

      {/* Tag picker */}
      {value.scopeType === 'ORG_UNIT_TAG' && (
        <TagPicker
          selectedIds={value.orgUnitTagIds ?? []}
          onChange={(ids) => onChange({ ...value, orgUnitTagIds: ids })}
        />
      )}
    </div>
  );
};
