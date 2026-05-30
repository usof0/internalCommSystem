import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './baseQueryWithAuth';
import type { PageResult } from '../types';
import type {
  Notification,
  GetNotificationsQuery,
  MarkAllReadResult,
} from '../types';

export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
  baseQuery: baseQueryWithAuth,
  refetchOnMountOrArgChange: true,
  tagTypes: ['Notifications'],
  endpoints: (builder) => ({

    /**
     * GET /notifications
     * List notifications for the current user (excludes hidden by default).
     * Supports optional unreadOnly filter and page/limit pagination.
     */
    getNotifications: builder.query<PageResult<Notification>, GetNotificationsQuery | void>({
      query: (params) => ({ url: '/notifications', params: params ?? {} }),
      providesTags: (result) =>
        result
          ? [
              'Notifications',
              ...result.items.map((n) => ({ type: 'Notifications' as const, id: n.id })),
            ]
          : ['Notifications'],
    }),

    /**   
     * PATCH /notifications/:notificationId/read
     * Mark a single notification as read (sets readAt to now).
     * Returns the updated notification.
     */
    markAsRead: builder.mutation<Notification, string>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: (_res, _err, id) => [{ type: 'Notifications', id }, 'Notifications'],
    }),

    /**
     * POST /notifications/read-all
     * Mark all unread notifications for the current user as read.
     * Returns the count of updated records.
     */
    markAllAsRead: builder.mutation<MarkAllReadResult, void>({
      query: () => ({ url: '/notifications/read-all', method: 'POST' }),
      invalidatesTags: ['Notifications'],
    }),

    /**
     * PATCH /notifications/:notificationId/hide
     * Hide a notification for the current user (sets isHidden = true).
     * Hidden notifications are excluded from the default list query.
     * Returns the updated notification.
     */
    hideNotification: builder.mutation<Notification, string>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/hide`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notifications'],
    }),

  }),
});

export const {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useHideNotificationMutation,
} = notificationsApi;
