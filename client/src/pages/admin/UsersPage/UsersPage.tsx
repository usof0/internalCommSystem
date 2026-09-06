import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useListUsersQuery,
  useCreateUserMutation,
  useDeleteUserMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
  useActivateUserMutation,
  useDeactivateUserMutation,
} from '../../../api/usersApi';
import { useListRegistrationRequestsQuery } from '../../../api/authApi';
import { usePermission } from '../../../hooks/usePermission';
import type { User } from '../../../types';

import { LoadingState, ErrorState, EmptyState } from '../../../components/ui/States';
import { Pagination } from '../../../components/ui/Pagination';
import type { ContextMenuItem } from '../../../components/ui/ContextMenu';

import { UsersToolbar } from './components/UsersToolbar';
import { CreateUserForm, type CreateUserFormData } from './components/CreateUserForm';
import { UsersList } from './components/UsersList';
import { UsersActionsMenu, type UsersMenuState } from './components/UsersActionsMenu';



export const UsersPage: React.FC = () => {
  const navigate = useNavigate();

  const canManageUsers = usePermission('users.manage');
  const canBlock = usePermission('users.manage');
  const canActivate = usePermission('users.manage');
  const canDelete = usePermission('users.delete');
  const canCreate = usePermission('users.create');

  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const queryParams = useMemo(() => ({ q: q.trim(), page, limit }), [q, page, limit]);

  const { data, isLoading, isError, refetch } = useListUsersQuery(queryParams);
  const users = data?.items ?? [];
  const total = data?.total ?? 0;
  const { data: registrationRequests = [] } = useListRegistrationRequestsQuery(undefined, {
    skip: !canCreate,
  });
  const pendingRegistrationRequests = registrationRequests.filter((request) => request.status === 'PENDING').length;

  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [blockUser] = useBlockUserMutation();
  const [unblockUser] = useUnblockUserMutation();
  const [activateUser] = useActivateUserMutation();
  const [deactivateUser] = useDeactivateUserMutation();

  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateUserFormData>({
    email: '',
    firstName: '',
    secondName: '',
    lastName: '',
    displayName: '',
  });

  const [menu, setMenu] = useState<UsersMenuState>({
    visible: false,
    x: 0,
    y: 0,
    user: null,
  });


  

  if (!canManageUsers) {
    return <div className="error">Нет прав для управления пользователями</div>;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;

    try {
      await createUser({
        email: formData.email.trim(),
        firstName: formData.firstName || undefined,
        secondName: formData.secondName || undefined,
        lastName: formData.lastName || undefined,
        displayName: formData.displayName || undefined,
        password: 'ChangeMe123!',
      }).unwrap();

      setFormData({ email: '', firstName: '', secondName: '', lastName: '', displayName: '' });
      setIsCreating(false);
    } catch (err) {
      console.error(err);
      alert('Не удалось создать пользователя');
    }
  };

  const confirmAction = async (message: string, fn: () => Promise<any>) => {
    if (!confirm(message)) return;
    try {
      await fn();
    } catch (err) {
      console.error(err);
      alert('Ошибка выполнения действия');
    }
  };

  const getFullName = (user: User) => {
    const parts = [user.lastName, user.firstName, user.secondName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : '—';
  };

  const getStatusText = (user: User) => {
    if (user.isBlocked) return 'Заблокирован';
    if (!user.isActive) return 'Неактивен';
    return 'Активен';
  };

  const getStatusClass = (user: User) => {
    if (user.isBlocked) return 'blocked';
    if (!user.isActive) return 'inactive';
    return 'active';
  };

  const handleRowClick = (userId: string) => navigate(`/admin/users/${userId}`);

  const handleContextMenu = (e: React.MouseEvent, user: User) => {
    e.preventDefault();
    setMenu({ visible: true, x: e.clientX, y: e.clientY, user });
  };

  const menuUser = menu.user;

  const menuItems: ContextMenuItem[] = !menuUser
    ? []
    : [
        menuUser.isBlocked
          ? {
              label: 'Разблокировать',
              disabled: !canBlock,
              onClick: () => confirmAction('Разблокировать пользователя?', () => unblockUser(menuUser.id).unwrap()),
            }
          : {
              label: 'Заблокировать',
              disabled: !canBlock,
              onClick: () => confirmAction('Заблокировать пользователя?', () => blockUser(menuUser.id).unwrap()),
            },

        menuUser.isActive
          ? {
              label: 'Деактивировать',
              disabled: !canActivate,
              onClick: () => confirmAction('Деактивировать пользователя?', () => deactivateUser(menuUser.id).unwrap()),
            }
          : {
              label: 'Активировать',
              disabled: !canActivate,
              onClick: () => confirmAction('Активировать пользователя?', () => activateUser(menuUser.id).unwrap()),
            },

        {
          label: 'Удалить',
          danger: true,
          disabled: !canDelete,
          onClick: () =>
            confirmAction('Удалить пользователя? Это действие необратимо!', () => deleteUser(menuUser.id).unwrap()),
        },
      ];

  return (
    <div className="admin-users-page">
      <UsersToolbar
        q={q}
        onChangeQ={(value) => {
          setQ(value);
          setPage(1);
        }}
        canCreate={canCreate}
        isCreating={isCreating}
        onToggleCreate={() => setIsCreating((v) => !v)}
        registrationRequestsCount={pendingRegistrationRequests}
        onOpenRegistrationRequests={() => navigate('/admin/users/registration-requests')}
      />

      {isCreating && (
        <CreateUserForm value={formData} onChange={setFormData} onSubmit={handleCreate} loading={creating} />
      )}

      <div className="users-summary">
        <div>
          <strong>{total || users.length}</strong>
          <span>{q.trim() ? 'Найдено по запросу' : 'Пользователей в списке'}</span>
        </div>
        {q.trim() ? <em>Поиск: {q.trim()}</em> : <em>Можно искать по имени, фамилии, отображаемому имени и email</em>}
      </div>

      {isLoading && (
        <div className="users-state-card">
          <LoadingState />
        </div>
      )}
      {isError && (
        <div className="users-state-card">
          <ErrorState text="Ошибка загрузки пользователей." onRetry={refetch} />
        </div>
      )}
      {!isLoading && !isError && users.length === 0 && (
        <div className="users-state-card">
          <EmptyState text={q.trim() ? 'По этому запросу пользователи не найдены' : 'Пользователи не найдены'} />
        </div>
      )}

      {!isLoading && !isError && users.length > 0 && (
        <UsersList
          users={users}
          getFullName={getFullName}
          getStatusText={getStatusText}
          getStatusClass={getStatusClass}
          onClickUser={handleRowClick}
          onContextMenuUser={handleContextMenu}
        />
      )}

      <Pagination page={page} total={total} limit={limit} onChange={setPage} />

      <UsersActionsMenu
        state={menu}
        onClose={() => setMenu({ visible: false, x: 0, y: 0, user: null })}
        items={menuItems}
      />
    </div>
  );
};
