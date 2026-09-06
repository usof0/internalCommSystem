import React from 'react';

import {
  taskReviewStatusClass,
  taskReviewStatusLabel,
  taskWorkStatusClass,
  taskWorkStatusLabel,
} from '../../../../features/tasks/utils/taskFormatters';

import type { TaskMyStatusProps } from './TaskMyStatus.types';

export const TaskMyStatus: React.FC<TaskMyStatusProps> = ({
  participation,
  isUpdating,
  onChangeWorkStatus,
}) => {
  return (
    <div className="task-my-status">
      <div className="task-my-status__header">
        <div>
          <span className="task-section-kicker">Исполнение</span>
          <h3>Мой статус</h3>
        </div>
      </div>
      <div className="participant-statuses task-my-status__statuses">
        {participation.isLate ? (
          <div className="status-item">
            <span className="label">Сдача:</span>
            <span className="status-badge status-red">Поздно</span>
          </div>
        ) : null}
        <div className="status-item">
          <span className="label">Работа:</span>
          <span className={`status-badge ${taskWorkStatusClass(participation.workStatus)}`}>
            {taskWorkStatusLabel(participation.workStatus)}
          </span>
        </div>
        <div className="status-item">
          <span className="label">Проверка:</span>
          <span className={`status-badge ${taskReviewStatusClass(participation.reviewStatus)}`}>
            {taskReviewStatusLabel(participation.reviewStatus)}
          </span>
        </div>
        {participation.rating != null ? (
          <div className="status-item">
            <span className="label">Оценка:</span>
            <span>{participation.rating} / 10</span>
          </div>
        ) : null}
      </div>

      <div className="task-status-actions">
        {participation.workStatus === 'PENDING' ? (
          <>
            <button
              onClick={() => onChangeWorkStatus('ACCEPTED')}
              disabled={isUpdating}
              className="task-status-action task-status-action--primary"
            >
              Принять
            </button>
            <button
              onClick={() => onChangeWorkStatus('DECLINED')}
              disabled={isUpdating}
              className="task-status-action task-status-action--danger"
            >
              Отказаться
            </button>
          </>
        ) : null}
        {participation.workStatus === 'ACCEPTED' ? (
          <button
            onClick={() => onChangeWorkStatus('IN_PROGRESS')}
            disabled={isUpdating}
            className="task-status-action task-status-action--primary"
          >
            Начать работу
          </button>
        ) : null}
        {participation.workStatus === 'IN_PROGRESS' ? (
          <button
            onClick={() => onChangeWorkStatus('SUBMITTED')}
            disabled={isUpdating}
            className="task-status-action task-status-action--primary"
          >
            Сдать работу
          </button>
        ) : null}
      </div>
    </div>
  );
};
