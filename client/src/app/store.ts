import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';

import { authApi } from '../api/authApi';
import { usersApi } from '../api/usersApi';
import { orgApi } from '../api/orgsApi';
import { rbacApi } from '../api/rbacApi';
import { chatApi } from '../api/chatApi';
import { tasksApi } from '../api/tasksApi';
import { eventsApi } from '../api/eventsApi';
import { pollsApi } from '../api/pollsApi';
import { notificationsApi } from '../api/notificationsApi';


export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    [authApi.reducerPath]: authApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [orgApi.reducerPath]: orgApi.reducer,
    [rbacApi.reducerPath]: rbacApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [tasksApi.reducerPath]: tasksApi.reducer,
    [eventsApi.reducerPath]: eventsApi.reducer,
    [pollsApi.reducerPath]: pollsApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      usersApi.middleware,
      orgApi.middleware,
      rbacApi.middleware,
      chatApi.middleware,
      tasksApi.middleware,
      eventsApi.middleware,
      pollsApi.middleware,
      notificationsApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
