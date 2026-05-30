import React from 'react';

import { Avatar } from '../../../../../components/ui/Avatar';
import {
  displayTaskUser,
  taskReviewStatusClass,
  taskReviewStatusLabel,
  taskWorkStatusClass,
  taskWorkStatusLabel,
} from '../../../../../features/tasks/utils/taskFormatters';

import type { TaskParticipantCardProps } from '../TaskParticipants.types';

export const TaskParticipantCard: React.FC<TaskParticipantCardProps> = ({
  participant,
  isMe,
  isCreator,
  isReviewing,
  ratingValue,
  onReview,
  onChangeRating,
  onRemove,
}) => {
  const name = displayTaskUser(participant.user);
  const canReview =
    isCreator &&
    !isMe &&
    participant.workStatus === 'SUBMITTED' &&
    participant.reviewStatus === 'PENDING';

  return (
    <div className={`participant-card${isMe ? ' participant-card--me' : ''}`}>
      <div className="participant-header">
        <Avatar src={participant.user.avatarUrl} name={name} email={participant.user.email} size={36} />
        <div className="participant-header__info">
          <h5 className="participant-header__name">
            {name}
            {isMe ? <span className="participant-header__you"> (вы)</span> : null}
          </h5>
          <span className="participant-header__email">{participant.user.email}</span>
        </div>
      </div>

      <div className="participant-statuses">
        {participant.isLate ? (
          <div className="status-item">
            <span className="label">Сдача:</span>
            <span className="status-badge status-red">Поздно</span>
          </div>
        ) : null}
        <div className="status-item">
          <span className="label">Работа:</span>
          <span className={`status-badge ${taskWorkStatusClass(participant.workStatus)}`}>
            {taskWorkStatusLabel(participant.workStatus)}
          </span>
        </div>
        <div className="status-item">
          <span className="label">Проверка:</span>
          <span className={`status-badge ${taskReviewStatusClass(participant.reviewStatus)}`}>
            {taskReviewStatusLabel(participant.reviewStatus)}
          </span>
        </div>
        {participant.rating != null ? (
          <div className="status-item">
            <span className="label">Оценка:</span>
            <span>{participant.rating} / 10</span>
          </div>
        ) : null}
      </div>

      {canReview ? (
        <div className="participant-review">
          <div className="participant-review__rating">
            <label htmlFor={`rating-${participant.userId}`}>
              Оценка (1–10):
            </label>
            <input
              id={`rating-${participant.userId}`}
              type="number"
              min={1}
              max={10}
              value={ratingValue}
              onChange={(event) => onChangeRating(participant.userId, event.target.value)}
              className="form-input participant-review__rating-input"
            />
          </div>
          <div className="participant-actions">
            <button
              onClick={() => onReview(participant.userId, 'APPROVED')}
              disabled={isReviewing}
              className="btn btn-primary btn-sm"
            >
              Одобрить
            </button>
            <button
              onClick={() => onReview(participant.userId, 'REJECTED')}
              disabled={isReviewing}
              className="btn btn-danger btn-sm"
            >
              Отклонить
            </button>
          </div>
        </div>
      ) : null}

      {isCreator ? (
        <div className="participant-card__footer">
          <button
            onClick={() => onRemove(participant.userId)}
            className="btn btn-sm participant-remove-btn"
          >
            Удалить
          </button>
        </div>
      ) : null}
    </div>
  );
};
