import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useListPasswordResetRequestsQuery, useListRegistrationRequestsQuery } from '../../../api/authApi';
import { usePermission } from '../../../hooks/usePermission';
import { EmptyState } from '../../../components/ui/States';

type AdminNavIcon = 'dashboard' | 'users' | 'roles' | 'organizations' | 'tags' | 'positions' | 'password';

const AdminIcon = ({ type }: { type: AdminNavIcon }) => {
  const paths = {
    dashboard: (
      <>
        <path d="M4 13h6V4H4v9Z" />
        <path d="M14 20h6V4h-6v16Z" />
        <path d="M4 20h6v-3H4v3Z" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    roles: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
    organizations: (
      <>
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-6h6v6" />
        <path d="M9 9h.01M15 9h.01M9 12h.01M15 12h.01" />
      </>
    ),
    tags: (
      <>
        <path d="M20.59 13.41 11 3.83A2.8 2.8 0 0 0 9.02 3H4a1 1 0 0 0-1 1v5.02c0 .74.3 1.45.82 1.98l9.59 9.59a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.83Z" />
        <path d="M7.5 7.5h.01" />
      </>
    ),
    positions: (
      <>
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M4 7h16a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9a2 2 0 0 1 2-2Z" />
        <path d="M10 12h4" />
      </>
    ),
    password: (
      <>
        <path d="M15 7a4 4 0 1 0-3.46 3.96L4 18.5V21h2.5L8 19.5H10V17.5h2L13.04 16.46A4 4 0 0 0 15 7Z" />
        <path d="M16.5 7.5h.01" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="admin-nav-icon">
      {paths[type]}
    </svg>
  );
};

export const AdminPage: React.FC = () => {
  const canManageUsers = usePermission('users.manage');
  const canCreateUsers = usePermission('users.create');
  const canResetPasswords = usePermission('users.password.reset');
  const canManageRoles = usePermission('rbac.roles.manage');
  const canManageOrg = usePermission('org.manage');
  const canManageTags = usePermission('org.manage');
  const canManagePositions = usePermission('org.manage');
  const { data: passwordResetRequests = [] } = useListPasswordResetRequestsQuery(undefined, {
    skip: !canResetPasswords,
  });
  const { data: registrationRequests = [] } = useListRegistrationRequestsQuery(undefined, {
    skip: !canCreateUsers,
  });
  const pendingPasswordResetCount = passwordResetRequests.filter(
    (request) => request.status === 'PENDING',
  ).length;
  const pendingRegistrationRequestCount = registrationRequests.filter(
    (request) => request.status === 'PENDING',
  ).length;

  const LinkItem = ({
    to,
    label,
    icon,
    allowed,
    badge,
  }: {
    to: string;
    label: string;
    icon: AdminNavIcon;
    allowed: boolean;
    badge?: number;
  }) => {
    if (!allowed) return null;
    return (
      <NavLink to={to} className="admin-nav-link">
        <span className="admin-nav-link__icon">
          <AdminIcon type={icon} />
        </span>
        <span>{label}</span>
        {badge ? <span className="admin-nav-link__badge">{badge}</span> : null}
      </NavLink>
    );
  };

  const hasAny =
    canManageUsers || canResetPasswords || canManageRoles || canManageOrg || canManageTags || canManagePositions;

  return (
    <div className="admin-page">
      <aside className="admin-sidebar" aria-label="Администрирование">
        <div className="admin-sidebar__header">
          <span>Панель администрирования</span>
        </div>
        <nav className="admin-nav">
          <LinkItem to="/admin/dashboard" label="Обзор" icon="dashboard" allowed={hasAny} />
          <LinkItem
            to="/admin/users"
            label="Пользователи"
            icon="users"
            allowed={canManageUsers}
            badge={pendingRegistrationRequestCount}
          />
          <LinkItem
            to="/admin/password-reset"
            label="Сброс пароля"
            icon="password"
            allowed={canResetPasswords}
            badge={pendingPasswordResetCount}
          />
          <LinkItem to="/admin/roles" label="Роли и права" icon="roles" allowed={canManageRoles} />
          <LinkItem to="/admin/organizations" label="Подразделения" icon="organizations" allowed={canManageOrg} />
          <LinkItem to="/admin/tags" label="Теги" icon="tags" allowed={canManageTags} />
          <LinkItem to="/admin/positions" label="Должности" icon="positions" allowed={canManagePositions} />
        </nav>

        {!hasAny && <EmptyState text="Нет прав администратора" />}
      </aside>

      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
};
