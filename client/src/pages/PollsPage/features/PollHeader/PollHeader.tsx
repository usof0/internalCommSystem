import React from 'react';

import { BackButton } from '../../../../components/ui/BackButton';
import { displayPollUser, formatPollDate } from '../../features/utils/pollFormatters';
import type { PollHeaderProps } from './PollHeader.types';

const EditIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="poll-icon">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="poll-icon">
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v5" />
    <path d="M14 11v5" />
  </svg>
);

export const PollHeader: React.FC<PollHeaderProps> = ({
  poll,
  isCreator,
  onBack,
  onOpenEdit,
  onOpenDelete,
}) => {
  return (
    <div className="poll-details-header">
      <div className="poll-question-panel">
        <BackButton onClick={onBack} label="К опросам" compact />

        <div className="poll-question-panel__content">
          <div className="poll-question-panel__top">
            <div>
              <span className="poll-question-panel__eyebrow">Опрос</span>
              <h1>{poll.title}</h1>
            </div>
            {isCreator ? (
              <div className="poll-question-panel__actions">
                <button className="btn btn-secondary btn-sm" onClick={onOpenEdit}>
                  <EditIcon />
                  Редактировать
                </button>
                <button className="btn btn-ghost btn-sm poll-danger-button" onClick={onOpenDelete}>
                  <DeleteIcon />
                  Удалить
                </button>
              </div>
            ) : null}
          </div>
          {poll.description ? (
            <p className="poll-question-panel__description">{poll.description}</p>
          ) : null}
          <div className="poll-meta-row">
            <span className="poll-meta-pill">
              <span className="label">Создатель</span>
              {displayPollUser(poll.creator)}
            </span>
            <span className="poll-meta-pill">
              <span className="label">Создан</span>
              {formatPollDate(poll.createdAt)}
            </span>
            <span className="poll-meta-pill">
              <span className="label">Изменение голоса</span>
              {poll.allowVoteChange ? 'Разрешено' : 'Запрещено'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
