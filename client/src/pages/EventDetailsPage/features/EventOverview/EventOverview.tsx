import React from 'react';

import { displayEventUser, formatDate } from '../../../../features/events/utils/eventFormatters';

import type { EventOverviewProps } from './EventOverview.types';

export const EventOverview: React.FC<EventOverviewProps> = ({ event }) => {
  const startDate = new Date(event.timeStart);
  const endDate = new Date(event.timeEnd);
  const eventDate = startDate.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const startTime = startDate.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const endTime = endDate.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="task-overview">
      <div className="task-overview-section">
        <h3>Описание</h3>
        <p className="event-overview-description">{event.description}</p>
      </div>
      <div className="task-overview-section">
        <h3>Информация</h3>
        <div className="event-overview-meta">
          <div className="event-overview-meta__item event-overview-meta__item--wide">
            <span className="label">Адрес:</span>
            <span>{event.address}</span>
          </div>
          <div className="event-overview-meta__item">
            <span className="label">Дата:</span>
            <span>{eventDate}</span>
          </div>
          <div className="event-overview-meta__item">
            <span className="label">Начало:</span>
            <span>{startTime}</span>
          </div>
          <div className="event-overview-meta__item">
            <span className="label">Конец:</span>
            <span>{endTime}</span>
          </div>
          <div className="event-overview-meta__item event-overview-meta__item--wide">
            <span className="label">Организатор:</span>
            <span>{displayEventUser(event.creator)}</span>
          </div>
          <div className="event-overview-meta__item">
            <span className="label">Создано:</span>
            <span>{formatDate(event.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
