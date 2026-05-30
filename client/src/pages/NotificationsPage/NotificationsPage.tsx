import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useHideNotificationMutation,
} from '../../api/notificationsApi';
import { chatApi } from '../../api/chatApi';
import { setSelectedRoom, setSelectedThreadMessage, setSelectedTopic } from '../../app/slices/uiSlice';
import type { AppDispatch } from '../../app/store';
import { SkeletonList } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import type { Notification, NotificationEntityType } from '../../types';

// ── helpers ──────────────────────────────────────────────────

const ENTITY_ICONS: Record<NotificationEntityType, string> = {
  ROOM: '🏠',
  TOPIC: '#',
  MESSAGE: '💬',
  TASK: '✅',
  EVENT: '📅',
  POLL: '📊',
};

function entityIcon(entityType: NotificationEntityType): string {
  return ENTITY_ICONS[entityType] ?? '🔔';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── component ────────────────────────────────────────────────

type Filter = 'all' | 'unread';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [filter, setFilter] = useState<Filter>('all');
  const [hidingId, setHidingId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useGetNotificationsQuery(
    filter === 'unread' ? { unreadOnly: true, limit: 100 } : { limit: 100 },
  );
  const { data: unreadData } = useGetNotificationsQuery({ unreadOnly: true, page: 1, limit: 1 });

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();
  const [hideNotification] = useHideNotificationMutation();

  const notifications = data?.items ?? [];
  const unreadCount = unreadData?.total ?? notifications.filter((n) => !n.readAt).length;

  const resolveRoomIdByTopic = async (topicId: string): Promise<string | null> => {
    const roomsRequest = dispatch(chatApi.endpoints.getRooms.initiate(undefined, { subscribe: false }));
    const rooms = await roomsRequest.unwrap();

    for (const room of rooms.items) {
      const topicsRequest = dispatch(chatApi.endpoints.getTopics.initiate(room.id, { subscribe: false }));
      try {
        const topics = await topicsRequest.unwrap();
        if (topics.some((topic) => topic.id === topicId)) {
          return room.id;
        }
      } catch {
        // ignore a single room resolution failure and continue
      }
    }

    return null;
  };

  const openNotificationTarget = async (notification: Notification) => {
    switch (notification.entityType) {
      case 'TASK':
        navigate(`/tasks/${notification.entityId}`);
        return;
      case 'EVENT':
        navigate(`/events/${notification.entityId}`);
        return;
      case 'POLL':
        navigate(`/polls/${notification.entityId}`);
        return;
      case 'ROOM':
        dispatch(setSelectedRoom(notification.entityId));
        navigate('/chat');
        return;
      case 'TOPIC': {
        const roomId = await resolveRoomIdByTopic(notification.entityId);
        if (roomId) {
          dispatch(setSelectedRoom(roomId));
          dispatch(setSelectedTopic(notification.entityId));
        }
        navigate('/chat');
        return;
      }
      case 'MESSAGE': {
        try {
          const messageRequest = dispatch(
            chatApi.endpoints.getMessageById.initiate(notification.entityId, { subscribe: false }),
          );
          const message = await messageRequest.unwrap();
          const roomId = await resolveRoomIdByTopic(message.topicId);
          if (roomId) {
            dispatch(setSelectedRoom(roomId));
            dispatch(setSelectedTopic(message.topicId));
            dispatch(setSelectedThreadMessage(message.parentId ?? null));
          }
        } catch {
          // fallback to chat root if we cannot resolve the message context
        }
        navigate('/chat');
        return;
      }
      default:
        return;
    }
  };

  const handleClick = async (notification: Notification) => {
    if (!notification.readAt) {
      try {
        await markAsRead(notification.id).unwrap();
      } catch {
        // non-critical; navigate anyway
      }
    }
    await openNotificationTarget(notification);
  };

  const handleMarkAll = async () => {
    try {
      await markAllAsRead().unwrap();
    } catch {
      // handled silently; cache will be refreshed
    }
  };

  const handleHide = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setHidingId(id);
    try {
      await hideNotification(id).unwrap();
    } finally {
      setHidingId(null);
    }
  };

  return (
    <div className="notifications-page">
      <div className="page-header">
        <div className="notifications-page__title-row">
          <h1>Уведомления</h1>
          {unreadCount > 0 && (
            <span className="notifications-page__unread-badge">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            className="btn btn-secondary"
            onClick={handleMarkAll}
            disabled={isMarkingAll}
          >
            {isMarkingAll ? 'Обработка...' : 'Отметить все прочитанными'}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="view-switcher">
        <button
          className={`view-btn${filter === 'all' ? ' active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Все
        </button>
        <button
          className={`view-btn${filter === 'unread' ? ' active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Непрочитанные
        </button>
      </div>

      {isLoading && <SkeletonList count={6} />}
      {error && <ErrorBanner onRetry={refetch} />}

      {!isLoading && !error && notifications.length === 0 && (
        <EmptyState
          message={filter === 'unread' ? 'Нет непрочитанных уведомлений' : 'Нет уведомлений'}
          icon="🔔"
        />
      )}

      {!isLoading && !error && notifications.length > 0 && (
        <div className="notifications-list">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`notification-item${!n.readAt ? ' unread' : ''}`}
              onClick={() => handleClick(n)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleClick(n)}
            >
              <div className="notification-icon">
                {entityIcon(n.entityType)}
              </div>

              <div className="notification-content">
                <h4 className="notification-title">{n.title}</h4>
                <p className="notification-message">{n.body}</p>
                {n.actor && (
                  <span className="notification-actor">
                    {n.actor.displayName ?? [n.actor.firstName, n.actor.lastName].filter(Boolean).join(' ') ?? n.actor.email}
                  </span>
                )}
                <span className="notification-date">{formatDate(n.createdAt)}</span>
              </div>

              <div className="notification-item__actions">
                <button
                  className="notification-item__hide-btn btn btn-sm"
                  title="Скрыть"
                  disabled={hidingId === n.id}
                  onClick={(e) => handleHide(e, n.id)}
                >
                  ✕
                </button>
              </div>

              {!n.readAt && <div className="notification-badge" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
