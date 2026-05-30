import React, { useState } from 'react';
import {
  useGetMyEventsQuery,
  useGetCreatedEventsQuery,
  useCreateEventMutation,
} from '../../api/eventsApi';
import { EventCard } from '../../features/events/EventCard';
import { SkeletonList } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import { Can } from '../../components/Can';
import { Modal } from '../../components/ui/Modal';
import { usePermission } from '../../hooks/usePermission';
import type { CreateEventRequest } from '../../types';

type View = 'mine' | 'created';

const EventsEmptyIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M8 2v4M16 2v4M3 10h18"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <path
      d="M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <path
      d="m9 15 2 2 4-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

// datetime-local input value for "now + 1 hour" as a sensible default
function defaultTimeStart(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d.toISOString().slice(0, 16);
}

function defaultTimeEnd(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 2);
  return d.toISOString().slice(0, 16);
}

const emptyForm = (): CreateEventRequest => ({
  title: '',
  description: '',
  address: '',
  timeStart: defaultTimeStart(),
  timeEnd: defaultTimeEnd(),
});

function splitAndSortEvents<T extends { timeStart: string; timeEnd: string }>(events: T[] = []) {
  const now = Date.now();
  const upcoming = events
    .filter((event) => new Date(event.timeEnd).getTime() >= now)
    .sort((a, b) => new Date(a.timeStart).getTime() - new Date(b.timeStart).getTime());

  const past = events
    .filter((event) => new Date(event.timeEnd).getTime() < now)
    .sort((a, b) => new Date(b.timeEnd).getTime() - new Date(a.timeEnd).getTime());

  return { upcoming, past };
}

export const EventsPage: React.FC = () => {
  const [view, setView] = useState<View>('mine');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<CreateEventRequest>(emptyForm());
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const canCreateEvent = usePermission('event.create');

  const {
    data: myEvents,
    isLoading: myLoading,
    error: myError,
    refetch: myRefetch,
  } = useGetMyEventsQuery();

  const {
    data: createdEvents,
    isLoading: createdLoading,
    error: createdError,
    refetch: createdRefetch,
  } = useGetCreatedEventsQuery();

  const [createEvent, { isLoading: creating }] = useCreateEventMutation();

  const events = view === 'mine' ? myEvents : createdEvents;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredEvents = normalizedSearch
    ? events?.filter((event) => {
        const haystack = `${event.title} ${event.description} ${event.address} ${event.creator.email}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      })
    : events;
  const isLoading = view === 'mine' ? myLoading : createdLoading;
  const error = view === 'mine' ? myError : createdError;
  const refetch = view === 'mine' ? myRefetch : createdRefetch;
  const groupedEvents = splitAndSortEvents(filteredEvents ?? []);

  const openCreate = () => {
    setForm(emptyForm());
    setFormError('');
    setShowCreateModal(true);
  };

  const closeCreate = () => {
    setShowCreateModal(false);
    setForm(emptyForm());
    setFormError('');
  };

  const handleCreate = async () => {
    if (!form.title.trim()) { setFormError('Введите название события'); return; }
    if (!form.description.trim()) { setFormError('Введите описание события'); return; }
    if (!form.address.trim()) { setFormError('Введите адрес'); return; }
    if (!form.timeStart) { setFormError('Укажите время начала'); return; }
    if (!form.timeEnd) { setFormError('Укажите время окончания'); return; }
    if (new Date(form.timeEnd) <= new Date(form.timeStart)) {
      setFormError('Время окончания должно быть позже времени начала');
      return;
    }
    setFormError('');
    try {
      await createEvent({
        title: form.title.trim(),
        description: form.description.trim(),
        address: form.address.trim(),
        timeStart: new Date(form.timeStart).toISOString(),
        timeEnd: new Date(form.timeEnd).toISOString(),
      }).unwrap();
      closeCreate();
      if (view !== 'created') setView('created');
    } catch {
      setFormError('Не удалось создать событие');
    }
  };

  return (
    <div className="events-page">
      <div className="events-hero">
        <div className="events-hero__copy">
          <span className="events-hero__eyebrow">Календарь команды</span>
          <h1>События</h1>
        </div>
        <Can permission="event.create">
          <button onClick={openCreate} className="btn btn-primary events-create-btn">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M12 5v14M5 12h14"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            <span>Создать событие</span>
          </button>
        </Can>
      </div>

      <div className="events-toolbar">
        <div className="events-tabs" role="tablist" aria-label="Фильтр событий">
          <button
            className={`events-tab${view === 'mine' ? ' events-tab--active' : ''}`}
            onClick={() => setView('mine')}
            role="tab"
            aria-selected={view === 'mine'}
          >
            <span>Мои события</span>
            <span className="events-tab__count">{myEvents?.length ?? 0}</span>
          </button>
          <button
            className={`events-tab${view === 'created' ? ' events-tab--active' : ''}`}
            onClick={() => setView('created')}
            role="tab"
            aria-selected={view === 'created'}
          >
            <span>Созданные мной</span>
            <span className="events-tab__count">{createdEvents?.length ?? 0}</span>
          </button>
        </div>

        <label className="events-search">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle
              cx="11"
              cy="11"
              r="7"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
            <path
              d="m20 20-3.5-3.5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по событиям"
            aria-label="Поиск по событиям"
          />
        </label>
      </div>

      <div className="events-list">
        {isLoading && <SkeletonList />}
        {error && <ErrorBanner onRetry={refetch} />}
        {!isLoading && !error && (!filteredEvents || filteredEvents.length === 0) && (
          <EmptyState
            message={
              search.trim()
                ? 'События по этому запросу не найдены'
                : view === 'mine'
                  ? 'Вы не приглашены ни на одно событие'
                  : 'Вы ещё не создали событий'
            }
            icon={<EventsEmptyIcon />}
            action={
              canCreateEvent && !search.trim() && view === 'created'
                ? { label: '+ Создать событие', onClick: openCreate }
                : undefined
            }
          />
        )}
        {!isLoading && !error && filteredEvents && filteredEvents.length > 0 && (
          <>
            <section className="events-list-section">
              <div className="events-list-section__header">
                <h2>Ближайшие события</h2>
                <span>{groupedEvents.upcoming.length}</span>
              </div>
              {groupedEvents.upcoming.length > 0 ? (
                groupedEvents.upcoming.map((event) => (
                  <EventCard key={event.id} event={event} mode={view === 'mine' ? 'mine' : 'created'} />
                ))
              ) : (
                <p className="events-list-section__empty">Нет будущих событий</p>
              )}
            </section>

            {groupedEvents.past.length > 0 && (
              <>
                <div className="events-list-divider" aria-hidden="true" />
                <section className="events-list-section">
                  <div className="events-list-section__header">
                    <h2>Прошедшие события</h2>
                    <span>{groupedEvents.past.length}</span>
                  </div>
                  {groupedEvents.past.map((event) => (
                    <EventCard key={event.id} event={event} mode={view === 'mine' ? 'mine' : 'created'} />
                  ))}
                </section>
              </>
            )}
          </>
        )}
      </div>

      <Modal
        open={showCreateModal}
        title={<h2 className="event-modal-title">Новое событие</h2>}
        onClose={closeCreate}
        maxWidth={580}
        footer={
          <div className="event-modal-actions">
            <button onClick={closeCreate} className="btn">Отмена</button>
            <button onClick={handleCreate} disabled={creating} className="btn btn-primary">
              {creating ? 'Создание...' : 'Создать событие'}
            </button>
          </div>
        }
      >
        <div className="event-create-form">
          {formError && <div className="error-message">{formError}</div>}

          <div className="form-group">
            <label className="form-label">Название *</label>
            <input
              type="text"
              className="form-input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Название события"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Описание *</label>
            <textarea
              className="form-input"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Описание события"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Адрес *</label>
            <input
              type="text"
              className="form-input"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Место проведения"
            />
          </div>

          <div className="event-time-grid">
            <div className="form-group">
              <label className="form-label">Начало *</label>
              <input
                type="datetime-local"
                className="form-input"
                value={form.timeStart}
                onChange={(e) => setForm((f) => ({ ...f, timeStart: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Окончание *</label>
              <input
                type="datetime-local"
                className="form-input"
                value={form.timeEnd}
                onChange={(e) => setForm((f) => ({ ...f, timeEnd: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
