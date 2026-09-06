import React from 'react';

import { OrgUnitPicker } from '../../../ChatPage/features/OrgUnitPicker';
import { TagPicker } from '../../../ChatPage/features/TagPicker';
import { EventParticipantCard } from './components/EventParticipantCard';
import { InvitableUsersList } from './components/InvitableUsersList';
import type { EventParticipantsProps } from './EventParticipants.types';

export const EventParticipants: React.FC<EventParticipantsProps> = ({
  event,
  currentUserId,
  isCreator,
  isPast,
  confirmedCount,
  isInviteOpen,
  userSearch,
  selectedUserIds,
  selectedOrgUnitIds,
  selectedTagIds,
  includeSubUnits,
  inviteError,
  availableUsers,
  isInviting,
  onToggleInvite,
  onChangeSearch,
  onToggleUserSelection,
  onChangeOrgUnitSelection,
  onChangeTagSelection,
  onChangeIncludeSubUnits,
  onInvite,
  onCancelInvite,
  onRemove,
}) => {
  const selectedTargetCount = selectedUserIds.length + selectedOrgUnitIds.length + selectedTagIds.length;

  return (
    <div className="task-participants">
      <div className="task-participants__header">
        <div>
          <span className="task-section-kicker">Гости</span>
          <h3>
            Участники ({event.participants.length}
            {event.participants.length > 0 ? ` · ${confirmedCount} подтвердили` : ''})
          </h3>
        </div>
        {isCreator && !isPast ? (
          <button onClick={onToggleInvite} className="btn btn-primary btn-sm task-participants__add">
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
            <span>{isInviteOpen ? 'Отмена' : 'Пригласить'}</span>
          </button>
        ) : null}
      </div>

      {isCreator && isInviteOpen ? (
        <div className="task-assign-form">
          <input
            type="text"
            placeholder="Поиск пользователей (мин. 2 символа)..."
            value={userSearch}
            onChange={(event) => onChangeSearch(event.target.value)}
            className="form-input"
          />

          {userSearch.length >= 2 && availableUsers.length > 0 ? (
            <InvitableUsersList
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
              Приглашение будет отправлено участникам по выбранным пользователям, подразделениям и тегам.
            </p>
          ) : null}

          {inviteError ? (
            <p className="task-form-error">{inviteError}</p>
          ) : null}

          <div className="task-assign-actions">
            <button
              onClick={onInvite}
              disabled={isInviting || selectedTargetCount === 0}
              className="btn btn-primary btn-sm"
            >
              {isInviting ? 'Отправка...' : 'Пригласить'}
            </button>
            <button onClick={onCancelInvite} className="btn btn-sm">
              Отмена
            </button>
          </div>
        </div>
      ) : null}

      {event.participants.length === 0 ? (
        <p className="task-form-hint">Участников пока нет</p>
      ) : null}

      <div className="participants-grid">
        {event.participants.map((participant) => (
          <EventParticipantCard
            key={participant.userId}
            participant={participant}
            isMe={participant.userId === currentUserId}
            isCreator={isCreator}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
};
