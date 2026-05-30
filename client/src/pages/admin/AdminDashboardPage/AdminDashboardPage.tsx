import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useListUsersQuery } from '../../../api/usersApi';
import {
  useGetOrgTreeQuery,
  useListPositionRolesQuery,
  useListPositionsQuery,
  useListTagsQuery,
} from '../../../api/orgsApi';
import {
  useGetRoleQuery,
  useListPermissionsQuery,
  useListRolesQuery,
} from '../../../api/rbacApi';
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States';
import { usePermission } from '../../../hooks/usePermission';
import type { OrgUnitNode, Position, Role, User } from '../../../types';
import './AdminDashboardPage.css';

type AdminDashIcon =
  | 'overview'
  | 'users'
  | 'roles'
  | 'org'
  | 'tags'
  | 'positions'
  | 'warning'
  | 'arrow';

const AdminDashIconView = ({ type }: { type: AdminDashIcon }) => {
  const paths = {
    overview: (
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
    org: (
      <>
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-6h6v6" />
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
      </>
    ),
    warning: (
      <>
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="admin-dashboard-icon">
      {paths[type]}
    </svg>
  );
};

const getUserName = (user: User) => {
  if (user.displayName) return user.displayName;
  const fullName = [user.lastName, user.firstName, user.secondName].filter(Boolean).join(' ');
  return fullName || user.email;
};

const countOrgUnits = (nodes: OrgUnitNode[]): number =>
  nodes.reduce((sum, node) => sum + 1 + countOrgUnits(node.children ?? []), 0);

const getOrgDepth = (nodes: OrgUnitNode[], depth = 1): number =>
  nodes.reduce((max, node) => Math.max(max, depth, getOrgDepth(node.children ?? [], depth + 1)), 0);

const flattenOrgUnits = (nodes: OrgUnitNode[]): OrgUnitNode[] =>
  nodes.flatMap((node) => [node, ...flattenOrgUnits(node.children ?? [])]);

export const AdminDashboardPage: React.FC = () => {
  const canManageUsers = usePermission(['users.read', 'users.manage']);
  const canManageRoles = usePermission('rbac.roles.manage');
  const canManagePermissions = usePermission('rbac.permissions.manage');
  const canManageOrg = usePermission('org.manage');
  const canUseAdmin = usePermission([
    'admin.panel.access',
    'users.read',
    'users.manage',
    'rbac.roles.manage',
    'rbac.permissions.manage',
    'org.manage',
  ]);

  const usersQuery = useListUsersQuery({ page: 1, limit: 5 }, { skip: !canManageUsers });
  const blockedUsersQuery = useListUsersQuery({ page: 1, limit: 5, isBlocked: true }, { skip: !canManageUsers });

  const rolesQuery = useListRolesQuery(undefined, { skip: !canManageRoles });
  const permissionsQuery = useListPermissionsQuery(undefined, { skip: !canManagePermissions });

  const orgTreeQuery = useGetOrgTreeQuery(undefined, { skip: !canManageOrg });
  const positionsQuery = useListPositionsQuery(undefined, { skip: !canManageOrg });
  const tagsQuery = useListTagsQuery(undefined, { skip: !canManageOrg });

  const orgNodes = orgTreeQuery.data?.items ?? [];
  const flatOrgUnits = useMemo(() => flattenOrgUnits(orgNodes), [orgNodes]);
  const roles = rolesQuery.data ?? [];
  const positions = positionsQuery.data ?? [];
  const latestUsers = usersQuery.data?.items ?? [];
  const blockedUsers = blockedUsersQuery.data?.items ?? [];

  const hasErrors =
    usersQuery.isError ||
    blockedUsersQuery.isError ||
    rolesQuery.isError ||
    permissionsQuery.isError ||
    orgTreeQuery.isError ||
    positionsQuery.isError ||
    tagsQuery.isError;

  const isLoading =
    usersQuery.isLoading ||
    blockedUsersQuery.isLoading ||
    rolesQuery.isLoading ||
    permissionsQuery.isLoading ||
    orgTreeQuery.isLoading ||
    positionsQuery.isLoading ||
    tagsQuery.isLoading;

  if (!canUseAdmin) {
    return <EmptyState text="Нет прав администратора" />;
  }

  return (
    <div className="admin-dashboard-page">
      <section className="admin-dashboard-hero">
        <div>
          <span>Панель администрирования</span>
          <h1>Обзор системы</h1>
        </div>
        <div className="admin-dashboard-quick-actions">
          {canManageUsers ? <AdminQuickLink to="/admin/users" label="Пользователи" /> : null}
          {canManageRoles ? <AdminQuickLink to="/admin/roles" label="Роли" /> : null}
          {canManageOrg ? <AdminQuickLink to="/admin/organizations" label="Оргструктура" /> : null}
        </div>
      </section>

      {hasErrors ? <ErrorState text="Часть данных дашборда не загрузилась." /> : null}
      {isLoading ? <LoadingState text="Загрузка административного обзора..." /> : null}

      <section className="admin-dashboard-stats" aria-label="Статистика">
        {canManageUsers ? (
          <AdminStatCard icon="users" label="Пользователи" value={usersQuery.data?.total ?? 0} to="/admin/users" />
        ) : null}

        {canManageRoles ? (
          <AdminStatCard icon="roles" label="Роли" value={roles.length} to="/admin/roles" />
        ) : null}

        {canManagePermissions ? (
          <AdminStatCard icon="roles" label="Права" value={permissionsQuery.data?.length ?? 0} to="/admin/roles" />
        ) : null}

        {canManageOrg ? (
          <>
            <AdminStatCard icon="org" label="Подразделения" value={countOrgUnits(orgNodes)} to="/admin/organizations" />
            <AdminStatCard icon="org" label="Корневые разделы" value={orgNodes.length} to="/admin/organizations" />
            <AdminStatCard icon="positions" label="Должности" value={positions.length} to="/admin/positions" />
            <AdminStatCard icon="tags" label="Теги" value={tagsQuery.data?.length ?? 0} to="/admin/tags" />
          </>
        ) : null}
      </section>

      <section className="admin-dashboard-attention">
        <div className="admin-dashboard-section-header">
          <div>
            <span>Контроль качества</span>
            <h2>Требует внимания</h2>
          </div>
        </div>
        <div className="admin-attention-grid">
          {canManageUsers ? (
            <>
              {blockedUsers.slice(0, 3).map((user) => (
                <AdminAttentionItem
                  key={user.id}
                  icon="warning"
                  title={getUserName(user)}
                  meta="Пользователь заблокирован"
                  to={`/admin/users/${user.id}`}
                />
              ))}
            </>
          ) : null}

          {canManageRoles ? roles.slice(0, 12).map((role) => <RoleAttentionItem key={role.id} role={role} />) : null}
          {canManageOrg ? positions.map((position) => <PositionAttentionItem key={position.id} position={position} />) : null}

          {!canManageUsers && !canManageRoles && !canManageOrg ? (
            <EmptyState text="Нет доступных административных проверок" />
          ) : null}
        </div>
      </section>

      <section className="admin-dashboard-grid">
        {canManageUsers ? (
          <AdminDashboardPanel title="Последние пользователи" to="/admin/users">
            {latestUsers.map((user) => (
              <AdminListLink
                key={user.id}
                to={`/admin/users/${user.id}`}
                title={getUserName(user)}
                meta={user.isBlocked ? 'Заблокирован' : user.isActive ? user.email : 'Неактивен'}
              />
            ))}
            {latestUsers.length === 0 ? <EmptyState text="Пользователи не найдены" /> : null}
          </AdminDashboardPanel>
        ) : null}

        {canManageRoles ? (
          <AdminDashboardPanel title="Роли доступа" to="/admin/roles">
            {roles.slice(0, 5).map((role) => (
              <RoleSummaryItem key={role.id} role={role} />
            ))}
            {roles.length === 0 ? <EmptyState text="Роли еще не созданы" /> : null}
          </AdminDashboardPanel>
        ) : null}

        {canManageOrg ? (
          <AdminDashboardPanel title="Оргструктура" to="/admin/organizations">
            <AdminListLink
              to="/admin/organizations"
              title={`${countOrgUnits(orgNodes)} подразделений`}
              meta={`${orgNodes.length} корневых, ${getOrgDepth(orgNodes)} уровней структуры`}
            />
            {flatOrgUnits.slice(0, 4).map((unit) => (
              <AdminListLink key={unit.id} to={`/admin/organizations/${unit.id}`} title={unit.name} meta={unit.description || 'Без описания'} />
            ))}
            {flatOrgUnits.length === 0 ? <EmptyState text="Оргструктура еще не создана" /> : null}
          </AdminDashboardPanel>
        ) : null}

        {canManageOrg ? (
          <AdminDashboardPanel title="Должности и роли" to="/admin/positions">
            {positions.slice(0, 5).map((position) => (
              <PositionSummaryItem key={position.id} position={position} />
            ))}
            {positions.length === 0 ? <EmptyState text="Должности еще не созданы" /> : null}
          </AdminDashboardPanel>
        ) : null}
      </section>
    </div>
  );
};

const AdminQuickLink: React.FC<{ to: string; label: string }> = ({ to, label }) => (
  <Link className="admin-dashboard-quick-link" to={to}>
    {label}
    <AdminDashIconView type="arrow" />
  </Link>
);

const AdminStatCard: React.FC<{ icon: AdminDashIcon; label: string; value: number; to: string }> = ({
  icon,
  label,
  value,
  to,
}) => (
  <Link className="admin-stat-card" to={to}>
    <span className="admin-stat-card__icon">
      <AdminDashIconView type={icon} />
    </span>
    <strong>{value}</strong>
    <span>{label}</span>
  </Link>
);

const AdminAttentionItem: React.FC<{ icon: AdminDashIcon; title: string; meta: string; to: string }> = ({
  icon,
  title,
  meta,
  to,
}) => (
  <Link className="admin-attention-item" to={to}>
    <span className="admin-attention-item__icon">
      <AdminDashIconView type={icon} />
    </span>
    <span>
      <strong>{title}</strong>
      <small>{meta}</small>
    </span>
  </Link>
);

const AdminDashboardPanel: React.FC<{ title: string; to: string; children: React.ReactNode }> = ({ title, to, children }) => (
  <section className="admin-dashboard-panel">
    <div className="admin-dashboard-panel__header">
      <h2>{title}</h2>
      <Link to={to}>Все</Link>
    </div>
    <div className="admin-dashboard-panel__body">{children}</div>
  </section>
);

const AdminListLink: React.FC<{ to: string; title: string; meta: string }> = ({ to, title, meta }) => (
  <Link className="admin-list-link" to={to}>
    <span>
      <strong>{title}</strong>
      <small>{meta}</small>
    </span>
    <AdminDashIconView type="arrow" />
  </Link>
);

const RoleSummaryItem: React.FC<{ role: Role }> = ({ role }) => {
  const { data, isLoading } = useGetRoleQuery(role.id);
  const count = data?.permissions.length;

  return (
    <AdminListLink
      to="/admin/roles"
      title={role.name}
      meta={isLoading ? 'Загрузка прав...' : `${count ?? 0} прав доступа`}
    />
  );
};

const RoleAttentionItem: React.FC<{ role: Role }> = ({ role }) => {
  const { data, isLoading } = useGetRoleQuery(role.id);
  if (isLoading || !data || data.permissions.length > 0) return null;

  return (
    <AdminAttentionItem
      icon="roles"
      title={role.name}
      meta="Роль без прав доступа"
      to="/admin/roles"
    />
  );
};

const PositionSummaryItem: React.FC<{ position: Position }> = ({ position }) => {
  const { data, isLoading } = useListPositionRolesQuery(position.id);
  const count = data?.length;

  return (
    <AdminListLink
      to="/admin/positions"
      title={position.name}
      meta={isLoading ? 'Загрузка ролей...' : `${count ?? 0} ролей назначено`}
    />
  );
};

const PositionAttentionItem: React.FC<{ position: Position }> = ({ position }) => {
  const { data, isLoading } = useListPositionRolesQuery(position.id);
  if (isLoading || !data || data.length > 0) return null;

  return (
    <AdminAttentionItem
      icon="positions"
      title={position.name}
      meta="Должность без назначенных ролей"
      to="/admin/positions"
    />
  );
};
