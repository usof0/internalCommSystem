import React from 'react';

import type { EventAttendanceProps } from './EventAttendance.types';

export const EventAttendance: React.FC<EventAttendanceProps> = ({
  participation,
  isPast,
  isConfirming,
  onConfirmAttendance,
}) => {
  return (
    <div className="task-my-status event-attendance">
      <div className="task-my-status__header">
        <div>
          <span className="task-section-kicker">Приглашение</span>
          <h3>Моё участие</h3>
        </div>
      </div>
      <div className="participant-statuses task-my-status__statuses">
        <div className="status-item">
          <span className="label">Статус:</span>
          {participation.confirmed ? (
            <span className="status-badge status-green">Участие подтверждено</span>
          ) : (
            <span className="status-badge status-yellow">Ожидает подтверждения</span>
          )}
        </div>
        <div className="status-item">
          <span className="label">Номер участника:</span>
          <span>#{participation.participantNumber}</span>
        </div>
      </div>
      {!isPast ? (
        <div className="task-status-actions">
          {!participation.confirmed ? (
            <button
              onClick={() => onConfirmAttendance(true)}
              disabled={isConfirming}
              className="task-status-action task-status-action--primary"
            >
              Подтвердить участие
            </button>
          ) : (
            <button
              onClick={() => onConfirmAttendance(false)}
              disabled={isConfirming}
              className="task-status-action"
            >
              Отменить участие
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
};
