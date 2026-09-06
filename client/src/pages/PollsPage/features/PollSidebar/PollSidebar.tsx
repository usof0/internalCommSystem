import React from 'react';

import { Avatar } from '../../../../components/ui/Avatar';
import { OrgUnitPicker } from '../../../ChatPage/features/OrgUnitPicker';
import { TagPicker } from '../../../ChatPage/features/TagPicker';
import { displayPollUser } from '../utils/pollFormatters';
import type { PollSidebarProps } from './PollSidebar.types';

const getUserDisplayName = (user: PollSidebarProps['users'][number]) =>
  `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || undefined;

const VoteIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="poll-icon">
    <path d="m5 12 4 4L19 6" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="poll-icon">
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="poll-icon">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export const PollSidebar: React.FC<PollSidebarProps> = ({
  poll,
  currentUserId,
  myOptionId,
  hasVoted,
  isRetracting,
  isCreator,
  isInviteOpen,
  userSearch,
  selectedUserIds,
  selectedOrgUnitIds,
  selectedTagIds,
  includeSubUnits,
  inviteError,
  users,
  isInviting,
  existingParticipantIds,
  onRetractVote,
  onToggleInvite,
  onChangeSearch,
  onToggleUserSelect,
  onChangeOrgUnitSelection,
  onChangeTagSelection,
  onChangeIncludeSubUnits,
  onInvite,
  onRemoveParticipant,
}) => {
  const myParticipation = poll.participants.find((participant) => participant.userId === currentUserId);
  const selectedTargetCount = selectedUserIds.length + selectedOrgUnitIds.length + selectedTagIds.length;

  return (
    <div className="poll-details-sidebar">
      {myParticipation ? (
        <div className="poll-my-vote-panel">
          <h3><VoteIcon />Мой голос</h3>
          {hasVoted ? (
            <>
              <div className="poll-my-vote-panel__status">
                <span className="status-badge status-green">Вы проголосовали</span>
                {!poll.allowVoteChange ? (
                  <span className="status-badge status-gray">Ответ нельзя изменить</span>
                ) : null}
              </div>
              {myOptionId ? (
                <p className="poll-my-vote-panel__choice">
                  <span>Ваш выбор</span>
                  <strong>{poll.options.find((option) => option.id === myOptionId)?.value ?? '—'}</strong>
                </p>
              ) : null}
              {poll.allowVoteChange ? (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={onRetractVote}
                  disabled={isRetracting}
                >
                  {isRetracting ? 'Отзываем…' : 'Отозвать голос'}
                </button>
              ) : null}
            </>
          ) : (
            <p className="poll-my-vote-panel__hint">
              Выберите вариант ответа из списка слева, чтобы проголосовать.
            </p>
          )}
        </div>
      ) : null}

      {isCreator ? (
        <div className="poll-participants-panel">
          <div className="poll-participants-panel__header">
            <h3>Участники ({poll.participants.length})</h3>
            <button className="btn btn-secondary btn-sm" onClick={onToggleInvite}>
              {isInviteOpen ? 'Отмена' : <><PlusIcon />Пригласить</>}
            </button>
          </div>

          {isInviteOpen ? (
            <div className="poll-invite-form">
              <input
                className="form-control"
                placeholder="Поиск пользователей (мин. 2 символа)"
                value={userSearch}
                onChange={(event) => onChangeSearch(event.target.value)}
              />
              {users.length > 0 ? (
                <div className="task-user-select-list">
                  {users
                    .filter((user) => !existingParticipantIds.has(user.id))
                    .map((user) => {
                      const selected = selectedUserIds.includes(user.id);
                      return (
                        <div
                          key={user.id}
                          className={`task-user-select-item ${selected ? 'selected' : ''}`}
                          onClick={() => onToggleUserSelect(user.id)}
                        >
                          <Avatar
                            src={user.avatarUrl}
                            name={getUserDisplayName(user)}
                            email={user.email}
                            size={32}
                          />
                          <div className="task-user-select-info">
                            <span className="task-user-select-name">
                              {user.firstName} {user.lastName}
                            </span>
                            <span className="task-user-select-email">{user.email}</span>
                          </div>
                          {selected ? <span className="task-user-select-check">✓</span> : null}
                        </div>
                      );
                    })}
                </div>
              ) : null}
              {inviteError ? <p className="form-error">{inviteError}</p> : null}
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
                  Участники будут добавлены по выбранным пользователям, подразделениям и тегам.
                </p>
              ) : null}
              <button
                className="btn btn-primary btn-sm"
                onClick={onInvite}
                disabled={isInviting || selectedTargetCount === 0}
              >
                {!isInviting ? <PlusIcon /> : null}
                {isInviting ? 'Добавляем…' : `Пригласить (${selectedTargetCount})`}
              </button>
            </div>
          ) : null}

          <div className="poll-participants-list">
            {poll.participants.map((participant) => {
              const votedOption = participant.chosenOptionId
                ? poll.options.find((option) => option.id === participant.chosenOptionId)
                : null;
              const isMe = participant.userId === currentUserId;

              return (
                <div
                  key={participant.userId}
                  className={`poll-participant-row ${isMe ? 'participant-card--me' : ''}`}
                >
                  <Avatar
                    src={participant.user.avatarUrl}
                    name={`${participant.user.firstName ?? ''} ${participant.user.lastName ?? ''}`.trim() || undefined}
                    email={participant.user.email}
                    size={32}
                  />
                  <div className="poll-participant-row__info">
                    <span className="poll-participant-row__name">
                      {displayPollUser(participant.user)}
                      {isMe ? (
                        <span className="poll-participant-row__me"> (вы)</span>
                      ) : null}
                    </span>
                    {participant.done && votedOption ? (
                      <span className="poll-participant-row__vote">{votedOption.value}</span>
                    ) : (
                      <span className="poll-participant-row__pending">
                        {participant.done ? 'Проголосовал' : 'Не голосовал'}
                      </span>
                    )}
                  </div>
                  {participant.done ? (
                    <span className="poll-participant-row__done">
                      <VoteIcon />
                    </span>
                  ) : null}
                  {!isMe ? (
                    <button
                      className="poll-icon-button poll-participant-row__remove"
                      onClick={() => onRemoveParticipant(participant.userId)}
                      aria-label="Удалить участника"
                    >
                      <XIcon />
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};
