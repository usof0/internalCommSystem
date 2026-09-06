import React from 'react';

import { Avatar } from '../../../../../components/ui/Avatar';
import { displayEventUser } from '../../../../../features/events/utils/eventFormatters';

import type { EventParticipantCardProps } from '../EventParticipants.types';

export const EventParticipantCard: React.FC<EventParticipantCardProps> = ({
  participant,
  isMe,
  isCreator,
  onRemove,
}) => {
  const name = displayEventUser(participant.user);

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
        <span
          className={`status-badge event-participant-status ${participant.confirmed ? 'status-green' : 'status-yellow'}`}
        >
          {participant.confirmed ? 'Подтверждено' : 'Ожидает'}
        </span>
      </div>

      <div className="status-item event-participant-number">
        <span className="label">Участник №</span>
        <span>{participant.participantNumber}</span>
      </div>

      {isCreator && !isMe ? (
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
