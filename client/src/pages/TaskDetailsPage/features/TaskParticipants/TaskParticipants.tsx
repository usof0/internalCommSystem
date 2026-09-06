import React from 'react';

import { OrgUnitPicker } from '../../../ChatPage/features/OrgUnitPicker';
import { TagPicker } from '../../../ChatPage/features/TagPicker';
import { AssignableUsersList } from './components/AssignableUsersList';
import { TaskParticipantCard } from './components/TaskParticipantCard';
import type { TaskParticipantsProps } from './TaskParticipants.types';

export const TaskParticipants: React.FC<TaskParticipantsProps> = ({
  task,
  currentUserId,
  isCreator,
  isAssigningOpen,
  userSearch,
  selectedUserIds,
  selectedOrgUnitIds,
  selectedTagIds,
  includeSubUnits,
  assignError,
  availableUsers,
  isAssigning,
  isReviewing,
  ratingInputs,
  onToggleAssigning,
  onChangeSearch,
  onToggleUserSelection,
  onChangeOrgUnitSelection,
  onChangeTagSelection,
  onChangeIncludeSubUnits,
  onAssign,
  onCancelAssign,
  onReview,
  onChangeRating,
  onRemove,
}) => {
  const selectedTargetCount = selectedUserIds.length + selectedOrgUnitIds.length + selectedTagIds.length;

  return (
    <div className="task-participants">
      <div className="task-participants__header">
        <div>
          <span className="task-section-kicker">Команда</span>
          <h3>Участники ({task.participants.length})</h3>
        </div>
        {isCreator ? (
          <button onClick={onToggleAssigning} className="btn btn-primary btn-sm task-participants__add">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            <span>{isAssigningOpen ? 'Отмена' : 'Добавить участников'}</span>
          </button>
        ) : null}
      </div>

      {isCreator && isAssigningOpen ? (
        <div className="task-assign-form">
          <input
            type="text"
            placeholder="Поиск пользователей (мин. 2 символа)..."
            value={userSearch}
            onChange={(event) => onChangeSearch(event.target.value)}
            className="form-input"
          />

          {userSearch.length >= 2 && availableUsers.length > 0 ? (
            <AssignableUsersList
              users={availableUsers}
              selectedUserIds={selectedUserIds}
              onToggle={onToggleUserSelection}
            />
          ) : null}

          {userSearch.length >= 2 && availableUsers.length === 0 ? (
            <p className="task-form-hint">Пользователи не найдены</p>
          ) : null}

          {selectedUserIds.length > 0 ? (
            <p className="task-form-hint">Выбрано пользователей: {selectedUserIds.length}</p>
          ) : null}

          <div className="participant-targets">
            <div className="participant-targets__section">
              <div className="participant-targets__heading">
                <span>Подразделения</span>
                <small>{selectedOrgUnitIds.length} выбрано</small>
              </div>
              <OrgUnitPicker selectedIds={selectedOrgUnitIds} onChange={onChangeOrgUnitSelection} />
              <label className="participant-targets__toggle">
                <input
                  type="checkbox"
                  checked={includeSubUnits}
                  onChange={(event) => onChangeIncludeSubUnits(event.target.checked)}
                />
                <span>Включить дочерние подразделения</span>
              </label>
            </div>

            <div className="participant-targets__section">
              <div className="participant-targets__heading">
                <span>Теги подразделений</span>
                <small>{selectedTagIds.length} выбрано</small>
              </div>
              <TagPicker selectedIds={selectedTagIds} onChange={onChangeTagSelection} />
            </div>
          </div>

          {selectedTargetCount > 0 ? (
            <p className="task-form-hint">
              Будут добавлены участники по выбранным пользователям, подразделениям и тегам.
            </p>
          ) : null}

          {assignError ? (
            <p className="task-form-error">{assignError}</p>
          ) : null}

          <div className="task-assign-actions">
            <button
              onClick={onAssign}
              disabled={isAssigning || selectedTargetCount === 0}
              className="btn btn-primary btn-sm"
            >
              {isAssigning ? 'Добавление...' : 'Добавить'}
            </button>
            <button onClick={onCancelAssign} className="btn btn-sm">
              Отмена
            </button>
          </div>
        </div>
      ) : null}

      {task.participants.length === 0 ? (
        <p className="task-form-hint">Участников пока нет</p>
      ) : null}

      <div className="participants-grid">
        {task.participants.map((participant) => (
          <TaskParticipantCard
            key={participant.userId}
            participant={participant}
            isMe={participant.userId === currentUserId}
            isCreator={isCreator}
            isReviewing={isReviewing}
            ratingValue={ratingInputs[participant.userId] ?? ''}
            onReview={onReview}
            onChangeRating={onChangeRating}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
};
