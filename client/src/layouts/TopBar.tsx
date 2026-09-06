import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { usePermission } from '../hooks/usePermission';
import { logout } from '../app/slices/authSlice';
import { toggleTheme } from '../app/slices/uiSlice';
import type { RootState } from '../app/store';
import { chatApi, useGetRoomsQuery } from '../api/chatApi';
import { useGetNotificationsQuery, notificationsApi } from '../api/notificationsApi';

import { usersApi } from '../api/usersApi';
import { authApi, useLogoutMutation } from '../api/authApi';
import { orgApi } from '../api/orgsApi';

export const TopBar: React.FC = () => {
  const isAdmin = usePermission('admin.panel.access');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  const theme = useSelector((state: RootState) => state.ui.theme);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutRequest] = useLogoutMutation();
  const { data: unreadData } = useGetNotificationsQuery(
    { unreadOnly: true, page: 1, limit: 1 },
    { skip: !token },
  );
  const { data: roomsData } = useGetRoomsQuery(undefined, { skip: !token });
  const unreadCount = unreadData?.total ?? 0;
  const unreadChatCount = roomsData?.items.reduce(
    (sum, room) => sum + (room.unreadCount ?? 0),
    0,
  ) ?? 0;
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}` || user?.email?.[0] || '?';

  const handleLogout = async () => {
    try {
      await logoutRequest().unwrap();
    } catch {
      // Local logout must still continue if the server session is already gone.
    }

    dispatch(logout());

    dispatch(usersApi.util.resetApiState());
    dispatch(authApi.util.resetApiState());
    dispatch(orgApi.util.resetApiState());
    dispatch(chatApi.util.resetApiState());
    dispatch(notificationsApi.util.resetApiState());

    navigate('/login');
  };

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  return (
    <header className="topbar">
      
        <div className="logo">
          <NavLink to="/dashboard">
            <h1>ICS</h1>
          </NavLink>
        </div>
      
      <nav className="nav" aria-label="Основная навигация">
        <NavLink to="/dashboard" className="navbar-link">
          <span className="sidebar-text">Дашборд</span>
        </NavLink>
        <NavLink to="/chat" className="navbar-link">
          <span className="sidebar-text">Чат</span>
          {unreadChatCount > 0 ? <span className="navbar-badge">{unreadChatCount}</span> : null}
        </NavLink>
        <NavLink to="/tasks" className="navbar-link">
          <span className="sidebar-text">Задачи</span>
        </NavLink>
        <NavLink to="/events" className="navbar-link">
          <span className="sidebar-text">События</span>
        </NavLink>
        <NavLink to="/polls" className="navbar-link">
          <span className="sidebar-text">Опросы</span>
        </NavLink>
      </nav>
        

      <div className="topbar-actions">
        <NavLink
          to="/notifications"
          className="navbar-link navbar-link--icon"
          aria-label="Уведомления"
          title="Уведомления"
        >
          <svg
            className="navbar-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
            <path
              d="M13.73 21a2 2 0 0 1-3.46 0"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
          <span className="visually-hidden">Уведомления</span>
          {unreadCount > 0 ? <span className="navbar-badge">{unreadCount}</span> : null}
        </NavLink>
        <button
          onClick={handleThemeToggle}
          className="topbar-btn"
          aria-label={theme === 'light' ? 'Включить темную тему' : 'Включить светлую тему'}
          title={theme === 'light' ? 'Темная тема' : 'Светлая тема'}
        >
          {theme === 'light' ? (
            <svg className="topbar-btn-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.7 6.7 0 0 0 9.8 9.8Z"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          ) : (
            <svg className="topbar-btn-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle
                cx="12"
                cy="12"
                r="4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
              <path
                d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          )}
        </button>
        <div className="user-menu">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="user-avatar"
            aria-label="Открыть меню пользователя"
            aria-expanded={menuOpen}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email} />
            ) : (
              <span>{initials.toUpperCase()}</span>
            )}
          </button>
          {menuOpen && (
            <div className="user-menu-dropdown">
              <div className="user-menu-header">
                <div className="user-name">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="user-email">{user?.email}</div>
              </div>
              <button onClick={() => { navigate('/profile'); setMenuOpen(false); }} className="menu-item">
                <svg className="menu-item-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M20 21a8 8 0 0 0-16 0"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                  <circle
                    cx="12"
                    cy="7"
                    r="4"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
                <span>Профиль</span>
              </button>
              {isAdmin && (
                <button onClick={() => { navigate('/admin'); setMenuOpen(false); }} className="menu-item">
                  <svg className="menu-item-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path
                      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                    <path
                      d="M9 12l2 2 4-4"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <span>Админ-панель</span>
                </button>
              )}
              <button onClick={handleLogout} className="menu-item">
                Выйти
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
