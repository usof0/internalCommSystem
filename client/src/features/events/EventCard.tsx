import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useConfirmAttendanceMutation } from '../../api/eventsApi';
import type { EventSummary } from '../../types';
import { displayEventUser, isEventPast, isEventOngoing } from './utils/eventFormatters';

interface EventCardProps {
  event: EventSummary;
  mode: 'mine' | 'created';
}

export const EventCard: React.FC<EventCardProps> = ({ event, mode }) => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [confirmAttendance, { isLoading: confirming }] = useConfirmAttendanceMutation();

  const past = isEventPast(event.timeEnd);
  const ongoing = isEventOngoing(event.timeStart, event.timeEnd);
  const pendingInvitation = mode === 'mine' && !!event.myParticipation && !event.myParticipation.confirmed;
  const creatorName = displayEventUser(event.creator);
  const confirmedPercent = event.participantCount > 0
    ? Math.round((event.confirmedCount / event.participantCount) * 100)
    : 0;
  const startDate = new Date(event.timeStart);
  const day = startDate.toLocaleDateString('ru-RU', { day: '2-digit' });
  const month = startDate.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '');
  const time = startDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const eventDate = startDate.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const startTime = startDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const endTime = new Date(event.timeEnd).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleConfirm = async (confirmed: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await confirmAttendance({ eventId: event.id, userId: user.id, body: { confirmed } }).unwrap();
    } catch {
      // error handled by RTK
    }
  };

  return (
    <button
      className={`event-card${past ? ' event-card--past' : ''}${ongoing ? ' event-card--ongoing' : ''}`}
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <div className="event-date-tile" aria-hidden="true">
        <span className="event-date-tile__month">{month}</span>
        <strong>{day}</strong>
        <span className="event-date-tile__time">{time}</span>
      </div>
      <div className="event-card__top">
        <div className="event-card__title-group">
          <h3 className="event-title">{event.title}</h3>
        </div>
        <div className="event-card__badges">
          {ongoing && <span className="event-badge event-badge--live">Идёт сейчас</span>}
          {past && <span className="event-badge event-badge--past">Завершено</span>}
          {!ongoing && !past ? <span className="event-badge event-badge--upcoming">Запланировано</span> : null}
          {pendingInvitation && !past ? (
            <span className="event-badge event-badge--pending">Ожидает ответа</span>
          ) : null}
        </div>
      </div>

      <div className="event-meta">
        <div className="event-meta-item event-meta-item--address">
          <span className="label">Адрес</span>
          <span>{event.address}</span>
        </div>
        <div className="event-meta-item">
          <span className="label">Дата</span>
          <span>{eventDate}</span>
        </div>
        <div className="event-meta-item">
          <span className="label">Начинается</span>
          <span>{startTime}</span>
        </div>
        <div className="event-meta-item">
          <span className="label">Заканчивается</span>
          <span>{endTime}</span>
        </div>
        <div className="event-meta-item event-meta-item--creator">
          <span className="label">Создатель</span>
          <span>{creatorName}</span>
        </div>
      </div>

      <div className="event-confirmation">
        <div className="event-confirmation__top">
          <span>Участники</span>
          <strong>{event.confirmedCount}/{event.participantCount} подтвердили</strong>
        </div>
        <progress className="event-confirmation__bar" value={confirmedPercent} max={100} />
      </div>

      {/* Quick-action for participant: confirm / unconfirm */}
      {mode === 'mine' && event.myParticipation && !past && (
        <div className="event-actions" onClick={(e) => e.stopPropagation()}>
          {!event.myParticipation.confirmed ? (
            <button
              onClick={(e) => handleConfirm(true, e)}
              disabled={confirming}
              className="btn btn-primary btn-sm"
            >
              Подтвердить участие
            </button>
          ) : (
            <>
              <span className="status-badge status-green">Участие подтверждено</span>
              <button
                onClick={(e) => handleConfirm(false, e)}
                disabled={confirming}
                className="btn btn-sm"
              >
                Отменить
              </button>
            </>
          )}
        </div>
      )}

      {mode === 'mine' && !event.myParticipation && (
        <div className="event-status">
          <span className="status-badge status-gray">Не приглашён</span>
        </div>
      )}
    </button>
  );
};
