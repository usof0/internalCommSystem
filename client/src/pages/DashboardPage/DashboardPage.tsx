import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useGetRoomsQuery } from '../../api/chatApi';
import { useGetNotificationsQuery } from '../../api/notificationsApi';
import { useGetMyTasksQuery } from '../../api/tasksApi';
import { useGetMyEventsQuery } from '../../api/eventsApi';
import { useGetMyPollsQuery } from '../../api/pollsApi';
import type { EventSummary, Notification, PollSummary, TaskSummary } from '../../types';
import './DashboardPage.css';

type AttentionItem = {
  id: string;
  kind: 'task' | 'event' | 'poll' | 'notification' | 'chat';
  title: string;
  meta: string;
  to: string;
  priority: number;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const DashboardIcon = ({ type }: { type: 'chat' | 'bell' | 'task' | 'event' | 'poll' }) => {
  const paths = {
    chat: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </>
    ),
    task: (
      <>
        <path d="M9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </>
    ),
    event: (
      <>
        <path d="M8 2v4M16 2v4M3 10h18" />
        <path d="M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      </>
    ),
    poll: (
      <>
        <path d="M4 19V5M4 19h16" />
        <path d="M8 16v-5M12 16V8M16 16v-7" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="dashboard-icon">
      {paths[type]}
    </svg>
  );
};

function displayUserName(user: RootState['auth']['user']) {
  if (!user) return 'Пользователь';
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.email;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
  });
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isTaskOpen(task: TaskSummary) {
  const status = task.myParticipation?.workStatus;
  return !status || (status !== 'SUBMITTED' && status !== 'DECLINED');
}

function taskUrgency(task: TaskSummary) {
  if (!task.dueDate) return Number.POSITIVE_INFINITY;
  return new Date(task.dueDate).getTime();
}

function taskMeta(task: TaskSummary) {
  if (!task.dueDate) return 'Без срока';
  const due = new Date(task.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / MS_PER_DAY);
  if (diff < 0) return `Просрочено: ${formatDate(task.dueDate)}`;
  if (diff === 0) return 'Срок сегодня';
  if (diff === 1) return 'Срок завтра';
  return `Срок: ${formatDate(task.dueDate)}`;
}

function upcomingEvents(events: EventSummary[]) {
  const now = Date.now();
  return events
    .filter((event) => new Date(event.timeEnd).getTime() >= now)
    .sort((a, b) => new Date(a.timeStart).getTime() - new Date(b.timeStart).getTime());
}

function pendingPolls(polls: PollSummary[]) {
  return polls.filter((poll) => !poll.myParticipation?.done);
}

export const DashboardPage: React.FC = () => {
  const [attentionExpanded, setAttentionExpanded] = React.useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: roomsData, isLoading: roomsLoading } = useGetRoomsQuery();
  const { data: unreadNotifications, isLoading: notificationsLoading } = useGetNotificationsQuery({
    unreadOnly: true,
    page: 1,
    limit: 5,
  });
  const { data: myTasks, isLoading: tasksLoading } = useGetMyTasksQuery();
  const { data: myEvents, isLoading: eventsLoading } = useGetMyEventsQuery();
  const { data: myPolls, isLoading: pollsLoading } = useGetMyPollsQuery();

  const rooms = roomsData?.items ?? [];
  const unreadChatCount = rooms.reduce((sum, room) => sum + (room.unreadCount ?? 0), 0);
  const notifications = unreadNotifications?.items ?? [];
  const unreadNotificationCount = unreadNotifications?.total ?? notifications.length;
  const openTasks = (myTasks ?? []).filter(isTaskOpen).sort((a, b) => taskUrgency(a) - taskUrgency(b));
  const urgentTasks = openTasks.filter((task) => {
    if (!task.dueDate) return false;
    const days = (new Date(task.dueDate).getTime() - Date.now()) / MS_PER_DAY;
    return days <= 7;
  });
  const nextEvents = upcomingEvents(myEvents ?? []);
  const waitingEvents = nextEvents.filter((event) => event.myParticipation && !event.myParticipation.confirmed);
  const pollsToVote = pendingPolls(myPolls ?? []);

  const attentionItems: AttentionItem[] = [
    ...urgentTasks.slice(0, 3).map((task) => ({
      id: task.id,
      kind: 'task' as const,
      title: task.title,
      meta: taskMeta(task),
      to: `/tasks/${task.id}`,
      priority: task.dueDate ? new Date(task.dueDate).getTime() : Date.now(),
    })),
    ...waitingEvents.slice(0, 3).map((event) => ({
      id: event.id,
      kind: 'event' as const,
      title: event.title,
      meta: `Требуется подтверждение · ${formatDateTime(event.timeStart)}`,
      to: `/events/${event.id}`,
      priority: new Date(event.timeStart).getTime(),
    })),
    ...pollsToVote.slice(0, 3).map((poll) => ({
      id: poll.id,
      kind: 'poll' as const,
      title: poll.title,
      meta: `${poll.doneCount}/${poll.participantCount} проголосовали`,
      to: `/polls/${poll.id}`,
      priority: new Date(poll.createdAt).getTime(),
    })),
    ...notifications.slice(0, 2).map((notification) => ({
      id: notification.id,
      kind: 'notification' as const,
      title: notification.title,
      meta: formatDateTime(notification.createdAt),
      to: '/notifications',
      priority: new Date(notification.createdAt).getTime(),
    })),
  ].sort((a, b) => a.priority - b.priority).slice(0, 8);
  const visibleAttentionItems = attentionExpanded ? attentionItems : attentionItems.slice(0, 5);
  const hasMoreAttentionItems = attentionItems.length > visibleAttentionItems.length;

  const loading = roomsLoading || notificationsLoading || tasksLoading || eventsLoading || pollsLoading;

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <span className="dashboard-hero__eyebrow">Рабочая панель</span>
          <h1>Здравствуйте, {displayUserName(user)}</h1>
        </div>
        <Link to="/chat" className="btn btn-primary dashboard-hero__action">
          Открыть чат
        </Link>
      </section>

      <section className="dashboard-stats" aria-label="Краткая сводка">
        <DashboardStat icon="chat" label="Новые сообщения" value={unreadChatCount} to="/chat" />
        <DashboardStat icon="bell" label="Уведомления" value={unreadNotificationCount} to="/notifications" />
        <DashboardStat icon="task" label="Срочные задачи" value={urgentTasks.length} to="/tasks" />
        <DashboardStat icon="event" label="Ближайшие события" value={nextEvents.length} to="/events" />
        <DashboardStat icon="poll" label="Опросы к голосованию" value={pollsToVote.length} to="/polls" />
      </section>

      <section className="dashboard-attention">
        <div className="dashboard-section-header">
          <h2>Требует внимания</h2>
          <span>{attentionItems.length}</span>
        </div>
        {loading ? (
          <div className="dashboard-placeholder">Загрузка данных…</div>
        ) : attentionItems.length > 0 ? (
          <>
          <div
            className={`dashboard-attention-list${
              attentionExpanded ? ' dashboard-attention-list--expanded' : ' dashboard-attention-list--collapsed'
            }`}
          >
            {visibleAttentionItems.map((item) => (
              <Link
                key={`${item.kind}-${item.id}`}
                to={item.to}
                className="dashboard-attention-item"
                title={`${item.title} · ${item.meta}`}
                aria-label={`${item.title}. ${item.meta}`}
              >
                <span className={`dashboard-attention-item__icon dashboard-attention-item__icon--${item.kind}`}>
                  <DashboardIcon type={item.kind === 'notification' ? 'bell' : item.kind} />
                </span>
                <span className="dashboard-attention-item__body">
                  <strong>{item.title}</strong>
                  <small>{item.meta}</small>
                </span>
              </Link>
            ))}
          </div>
          {(hasMoreAttentionItems || attentionExpanded) && (
            <div className="dashboard-attention-actions">
              <button
                type="button"
                className="dashboard-attention-more"
                onClick={() => setAttentionExpanded((value) => !value)}
              >
                {attentionExpanded ? 'Свернуть' : `Показать больше (${attentionItems.length - visibleAttentionItems.length})`}
              </button>
            </div>
          )}
          </>
        ) : (
          <div className="dashboard-placeholder">Нет срочных действий</div>
        )}
      </section>

      <div className="dashboard-grid">
        <DashboardPanel title="Ближайшие задачи" to="/tasks">
          {openTasks.map((task) => (
            <DashboardListItem key={task.id} to={`/tasks/${task.id}`} title={task.title} meta={taskMeta(task)} />
          ))}
          {openTasks.length === 0 ? <p className="dashboard-empty">Нет активных задач</p> : null}
        </DashboardPanel>

        <DashboardPanel title="Ближайшие события" to="/events">
          {nextEvents.map((event) => (
            <DashboardListItem
              key={event.id}
              to={`/events/${event.id}`}
              title={event.title}
              meta={`${formatDateTime(event.timeStart)} · ${event.confirmedCount}/${event.participantCount} подтвердили`}
              badge={event.myParticipation && !event.myParticipation.confirmed ? 'Ожидает ответа' : undefined}
            />
          ))}
          {nextEvents.length === 0 ? <p className="dashboard-empty">Нет ближайших событий</p> : null}
        </DashboardPanel>

        <DashboardPanel title="Опросы к голосованию" to="/polls">
          {pollsToVote.map((poll) => (
            <DashboardListItem
              key={poll.id}
              to={`/polls/${poll.id}`}
              title={poll.title}
              meta={`${poll.doneCount}/${poll.participantCount} проголосовали`}
            />
          ))}
          {pollsToVote.length === 0 ? <p className="dashboard-empty">Нет ожидающих опросов</p> : null}
        </DashboardPanel>

        <DashboardPanel title="Непрочитанные уведомления" to="/notifications">
          {notifications.map((notification: Notification) => (
            <DashboardListItem
              key={notification.id}
              to="/notifications"
              title={notification.title}
              meta={formatDateTime(notification.createdAt)}
            />
          ))}
          {notifications.length === 0 ? <p className="dashboard-empty">Нет непрочитанных уведомлений</p> : null}
        </DashboardPanel>
      </div>
    </div>
  );
};

const DashboardStat: React.FC<{
  icon: 'chat' | 'bell' | 'task' | 'event' | 'poll';
  label: string;
  value: number;
  to: string;
}> = ({ icon, label, value, to }) => (
  <Link to={to} className="dashboard-stat">
    <span className="dashboard-stat__icon">
      <DashboardIcon type={icon} />
    </span>
    <span>
      <strong>{value}</strong>
      <small>{label}</small>
    </span>
  </Link>
);

const DashboardPanel: React.FC<{
  title: string;
  to: string;
  children: React.ReactNode;
}> = ({ title, to, children }) => (
  <section className="dashboard-panel">
    <div className="dashboard-panel__header">
      <h2>{title}</h2>
      <Link to={to}>Все</Link>
    </div>
    <div className="dashboard-panel__list">{children}</div>
  </section>
);

const DashboardListItem: React.FC<{
  to: string;
  title: string;
  meta: string;
  badge?: string;
}> = ({ to, title, meta, badge }) => (
  <Link to={to} className="dashboard-list-item">
    <span>
      <strong>{title}</strong>
      <small>{meta}</small>
    </span>
    {badge ? <em>{badge}</em> : null}
  </Link>
);
