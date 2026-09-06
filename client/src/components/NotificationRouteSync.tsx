import { useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { matchPath, useLocation } from 'react-router-dom';
import type { RootState } from '../app/store';
import { useGetNotificationsQuery, useMarkAsReadMutation } from '../api/notificationsApi';
import type { Notification } from '../types';

function matchesCurrentView(
  notification: Notification,
  pathname: string,
  selectedRoomId: string | null,
  selectedTopicId: string | null,
  selectedThreadMessageId: string | null,
): boolean {
  const taskMatch = matchPath('/tasks/:taskId', pathname);
  if (taskMatch?.params.taskId) {
    return notification.entityType === 'TASK' && notification.entityId === taskMatch.params.taskId;
  }

  const eventMatch = matchPath('/events/:eventId', pathname);
  if (eventMatch?.params.eventId) {
    return notification.entityType === 'EVENT' && notification.entityId === eventMatch.params.eventId;
  }

  const pollMatch = matchPath('/polls/:pollId', pathname);
  if (pollMatch?.params.pollId) {
    return notification.entityType === 'POLL' && notification.entityId === pollMatch.params.pollId;
  }

  if (pathname === '/chat') {
    if (notification.entityType === 'ROOM') {
      return notification.entityId === selectedRoomId;
    }
    if (notification.entityType === 'TOPIC') {
      return notification.entityId === selectedTopicId;
    }
    if (notification.entityType === 'MESSAGE') {
      return notification.entityId === selectedThreadMessageId;
    }
  }

  return false;
}

export function NotificationRouteSync() {
  const location = useLocation();
  const selectedRoomId = useSelector((state: RootState) => state.ui.selectedRoomId);
  const selectedTopicId = useSelector((state: RootState) => state.ui.selectedTopicId);
  const selectedThreadMessageId = useSelector(
    (state: RootState) => state.ui.selectedThreadMessageId,
  );

  const { data: unreadData } = useGetNotificationsQuery({ unreadOnly: true, limit: 100 });
  const [markAsRead] = useMarkAsReadMutation();
  const markingRef = useRef<Set<string>>(new Set());

  const matchingNotificationIds = useMemo(() => {
    const notifications = unreadData?.items ?? [];
    return notifications
      .filter((notification) =>
        matchesCurrentView(
          notification,
          location.pathname,
          selectedRoomId,
          selectedTopicId,
          selectedThreadMessageId,
        ),
      )
      .map((notification) => notification.id);
  }, [
    location.pathname,
    selectedRoomId,
    selectedTopicId,
    selectedThreadMessageId,
    unreadData?.items,
  ]);

  useEffect(() => {
    const pendingIds = matchingNotificationIds.filter((id) => !markingRef.current.has(id));
    if (pendingIds.length === 0) return;

    pendingIds.forEach((id) => {
      markingRef.current.add(id);
      void markAsRead(id)
        .unwrap()
        .catch(() => {
          markingRef.current.delete(id);
        });
    });
  }, [markAsRead, matchingNotificationIds]);

  return null;
}
