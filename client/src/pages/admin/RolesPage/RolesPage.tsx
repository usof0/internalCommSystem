import React, { useMemo, useState } from 'react';
import { usePermission } from '../../../hooks/usePermission';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Form';
import { Modal } from '../../../components/ui/Modal';
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States';
import type { Permission, Role, RoleWithPermissions } from '../../../types';
import {
  useAddRolePermissions,
  useCreateRole,
  useDeleteRole,
  usePermissionsData,
  useRoleDetailsData,
  useRolesData,
  useRemoveRolePermission,
  useUpdateRole,
} from './RolesPage.api';
import type { RoleFormState } from './RolesPage.types';
import './RolesPage.css';

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel: string;
  variant?: 'primary' | 'danger';
  onConfirm: () => Promise<unknown>;
};

const MODULE_LABELS: Record<string, string> = {
  admin: 'Администрирование',
  rbac: 'Роли и права',
  users: 'Пользователи',
  rooms: 'Чаты и комнаты',
  org: 'Оргструктура',
  tasks: 'Задачи',
  events: 'События',
  polls: 'Опросы',
};

const INTERNAL_ROOM_PERMISSION_CODES = new Set([
  'room.update',
  'room.delete',
  'room.members.manage',
  'room.topics.manage',
  'room.topic.visibility.manage',
  'room.message.bin',
]);

const PERMISSION_LABELS: Record<string, { title: string; description: string }> = {
  'admin.panel.access': {
    title: 'Доступ к панели администратора',
    description: 'Позволяет открывать административный раздел платформы.',
  },
  'rbac.roles.manage': {
    title: 'Управление ролями',
    description: 'Создание, изменение и удаление ролей.',
  },
  'rbac.permissions.manage': {
    title: 'Управление правами',
    description: 'Просмотр и настройка доступных прав доступа.',
  },
  'rbac.user_roles.manage': {
    title: 'Назначение ролей пользователям',
    description: 'Позволяет выдавать и отзывать роли у пользователей.',
  },
  'users.read': {
    title: 'Просмотр пользователей',
    description: 'Доступ к списку пользователей и их профилям.',
  },
  'users.create': {
    title: 'Создание пользователей',
    description: 'Позволяет создавать новые учетные записи.',
  },
  'users.manage': {
    title: 'Управление пользователями',
    description: 'Редактирование профилей, активация и блокировка пользователей.',
  },
  'users.delete': {
    title: 'Удаление пользователей',
    description: 'Позволяет удалять учетные записи пользователей.',
  },
  'users.password.reset': {
    title: 'Сброс паролей',
    description: 'Позволяет сбрасывать пароль пользователя.',
  },
  'room.create': {
    title: 'Создание комнат',
    description: 'Позволяет создавать новые комнаты чата.',
  },
  'room.manage': {
    title: 'Глобальное управление комнатами',
    description: 'Административное управление комнатами.',
  },
  'room.update': {
    title: 'Изменение комнат',
    description: 'Позволяет изменять метаданные комнат.',
  },
  'room.delete': {
    title: 'Удаление комнат',
    description: 'Позволяет удалять комнаты.',
  },
  'room.members.manage': {
    title: 'Управление участниками комнат',
    description: 'Добавление, удаление и изменение участников комнат.',
  },
  'room.topics.manage': {
    title: 'Управление темами комнат',
    description: 'Создание, изменение и удаление тем в комнатах.',
  },
  'room.topic.visibility.manage': {
    title: 'Управление видимостью тем',
    description: 'Настройка доступа и видимости тем чата.',
  },
  'room.message.bin': {
    title: 'Закрепление сообщений',
    description: 'Позволяет закреплять и откреплять сообщения.',
  },
  'org.manage': {
    title: 'Управление оргструктурой',
    description: 'Управление подразделениями, должностями и тегами.',
  },
  'task.create': {
    title: 'Создание задач',
    description: 'Позволяет создавать задачи.',
  },
  'task.participants.view': {
    title: 'Просмотр участников задач',
    description: 'Доступ к участникам задачи и результатам проверки.',
  },
  'event.create': {
    title: 'Создание событий',
    description: 'Позволяет создавать события.',
  },
  'poll.create': {
    title: 'Создание опросов',
    description: 'Позволяет создавать опросы.',
  },
};

const permissionTitle = (permission: Permission) =>
  PERMISSION_LABELS[permission.code]?.title ?? 'Неизвестное право доступа';

const permissionDescription = (permission: Permission) =>
  PERMISSION_LABELS[permission.code]?.description ?? 'Описание для этого права еще не добавлено в интерфейсе.';

const moduleLabel = (module?: string | null) => MODULE_LABELS[module || ''] ?? 'Прочее';

const permissionMatches = (permission: Permission, query: string) => {
  const haystack = [
    permission.code,
    permission.module,
    permissionTitle(permission),
    permissionDescription(permission),
    moduleLabel(permission.module),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
};

const groupPermissions = (permissions: Permission[]) =>
  permissions.reduce<Record<string, Permission[]>>((acc, permission) => {
    const label = moduleLabel(permission.module);
    acc[label] = acc[label] ?? [];
    acc[label].push(permission);
    return acc;
  }, {});

export const RolesPage: React.FC = () => {
  const canManageRoles = usePermission('rbac.roles.manage');
  const { data: roles = [], isLoading: rolesLoading, isError: rolesError, refetch } = useRolesData();
  const { data: permissions = [], isLoading: permsLoading } = usePermissionsData();

  const [createRole, { isLoading: creating }] = useCreateRole();
  const [updateRole, { isLoading: updating }] = useUpdateRole();
  const [deleteRole] = useDeleteRole();
  const [addPermissions, { isLoading: addingPermission }] = useAddRolePermissions();
  const [removePermission, { isLoading: removingPermission }] = useRemoveRolePermission();

  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<RoleFormState>({ name: '', description: '' });
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState(false);
  const [editForm, setEditForm] = useState<RoleFormState>({ name: '', description: '' });
  const [roleSearch, setRoleSearch] = useState('');
  const [permissionSearch, setPermissionSearch] = useState('');
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { data: roleDetails } = useRoleDetailsData(selectedRoleId);
  const selectedRole = roleDetails ?? roles.find((role) => role.id === selectedRoleId) ?? null;
  const selectedPermissions = roleDetails?.permissions ?? [];
  const globalSelectedPermissions = selectedPermissions.filter(
    (permission) => !INTERNAL_ROOM_PERMISSION_CODES.has(permission.code)
  );
  const selectedPermissionIds = new Set(selectedPermissions.map((permission) => permission.id));
  const selectedPermissionCodes = new Set(selectedPermissions.map((permission) => permission.code));

  const filteredRoles = useMemo(() => {
    const query = roleSearch.trim().toLowerCase();
    if (!query) return roles;
    return roles.filter((role) => [role.name, role.description].filter(Boolean).join(' ').toLowerCase().includes(query));
  }, [roleSearch, roles]);

  const globalPermissions = permissions.filter((permission) => !INTERNAL_ROOM_PERMISSION_CODES.has(permission.code));
  const availablePermissions = globalPermissions.filter((permission) => !selectedPermissionIds.has(permission.id));
  const visibleAssignedPermissions = globalSelectedPermissions.filter((permission) =>
    permissionMatches(permission, permissionSearch.trim())
  );
  const visibleAvailablePermissions = availablePermissions.filter((permission) =>
    permissionMatches(permission, permissionSearch.trim())
  );

  const assignedGroups = groupPermissions(visibleAssignedPermissions);
  const availableGroups = groupPermissions(visibleAvailablePermissions);
  const isLoading = rolesLoading || permsLoading;

  React.useEffect(() => {
    if (!selectedRoleId && roles.length > 0) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  React.useEffect(() => {
    if (!selectedRole) return;
    setEditForm({
      name: selectedRole.name,
      description: selectedRole.description ?? '',
    });
    setEditingRole(false);
  }, [selectedRole?.id]);

  if (!canManageRoles) {
    return <div className="error">Нет прав для управления ролями</div>;
  }

  const openConfirm = (state: ConfirmState) => {
    setErrorMessage('');
    setConfirm(state);
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    setConfirmLoading(true);
    setErrorMessage('');
    try {
      await confirm.onConfirm();
      setConfirm(null);
    } catch (err) {
      console.error(err);
      setErrorMessage('Не удалось выполнить действие. Попробуйте еще раз.');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    try {
      const role = await createRole({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      }).unwrap();
      setForm({ name: '', description: '' });
      setIsCreating(false);
      setSelectedRoleId(role.id);
    } catch (err) {
      console.error(err);
      setErrorMessage('Не удалось создать роль.');
    }
  };

  const handleSaveRole = async () => {
    if (!selectedRoleId) return;
    setErrorMessage('');
    try {
      await updateRole({
        roleId: selectedRoleId,
        body: {
          name: editForm.name.trim(),
          description: editForm.description.trim() || undefined,
        },
      }).unwrap();
      setEditingRole(false);
    } catch (err) {
      console.error(err);
      setErrorMessage('Не удалось обновить роль.');
    }
  };

  const requestDeleteRole = (role: Role | RoleWithPermissions) => {
    openConfirm({
      title: 'Удалить роль?',
      message: `Роль "${role.name}" будет удалена. Пользователи больше не смогут получать права через эту роль.`,
      confirmLabel: 'Удалить роль',
      variant: 'danger',
      onConfirm: async () => {
        await deleteRole(role.id).unwrap();
        if (selectedRoleId === role.id) {
          const nextRole = roles.find((item) => item.id !== role.id);
          setSelectedRoleId(nextRole?.id ?? null);
        }
      },
    });
  };

  const handleAddPermission = async (permission: Permission) => {
    if (!selectedRoleId || selectedPermissionCodes.has(permission.code)) return;
    setErrorMessage('');
    try {
      await addPermissions({
        roleId: selectedRoleId,
        body: { permissionCodes: [permission.code] },
      }).unwrap();
    } catch (err) {
      console.error(err);
      setErrorMessage('Не удалось добавить право.');
    }
  };

  const requestRemovePermission = (permission: Permission) => {
    if (!selectedRoleId) return;
    openConfirm({
      title: 'Убрать право из роли?',
      message: `Право "${permissionTitle(permission)}" будет отозвано у роли "${selectedRole?.name ?? ''}".`,
      confirmLabel: 'Убрать право',
      variant: 'danger',
      onConfirm: async () => {
        await removePermission({ roleId: selectedRoleId, permissionId: permission.id }).unwrap();
      },
    });
  };

  return (
    <div className="admin-roles-page">
      <section className="roles-hero">
        <div>
          <span>Контроль доступа</span>
          <h1>Роли и права</h1>
          <p>Настраивайте роли пользователей и выдавайте им права доступа. Названия ролей отображаются как введены администратором.</p>
        </div>
        <Button variant="primary" onClick={() => setIsCreating((value) => !value)}>
          {isCreating ? 'Закрыть форму' : 'Создать роль'}
        </Button>
      </section>

      {isCreating ? (
        <form className="role-create-panel" onSubmit={handleCreate}>
          <div className="role-create-panel__header">
            <h2>Новая роль</h2>
            <p>Задайте понятное название. Права можно назначить после создания.</p>
          </div>
          <div className="role-form-grid">
            <label>
              <span>Название роли *</span>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
            <label>
              <span>Описание</span>
              <Input
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Кратко опишите назначение роли"
              />
            </label>
          </div>
          <div className="role-create-panel__actions">
            <Button type="submit" variant="primary" loading={creating}>
              Создать роль
            </Button>
          </div>
        </form>
      ) : null}

      {errorMessage ? <div className="roles-error-message">{errorMessage}</div> : null}

      {isLoading ? <LoadingState /> : null}
      {rolesError ? <ErrorState text="Ошибка загрузки ролей." onRetry={refetch} /> : null}

      {!isLoading && !rolesError && roles.length === 0 ? <EmptyState text="Роли еще не созданы" /> : null}

      {!isLoading && !rolesError && roles.length > 0 ? (
        <div className="roles-workspace">
          <aside className="roles-list-panel">
            <div className="roles-panel-header">
              <div>
                <h2>Роли</h2>
                <p>{roles.length} всего</p>
              </div>
            </div>
            <label className="roles-search">
              <span>Поиск ролей</span>
              <Input
                value={roleSearch}
                onChange={(event) => setRoleSearch(event.target.value)}
                placeholder="Название или описание"
              />
            </label>
            <div className="roles-list">
              {filteredRoles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  className={`roles-list-item${selectedRoleId === role.id ? ' roles-list-item--active' : ''}`}
                  onClick={() => setSelectedRoleId(role.id)}
                >
                  <span>
                    <strong>{role.name}</strong>
                    <small>{role.description || 'Без описания'}</small>
                  </span>
                </button>
              ))}
              {filteredRoles.length === 0 ? <div className="roles-inline-empty">Роли не найдены</div> : null}
            </div>
          </aside>

          <section className="role-details-panel">
            {selectedRole ? (
              <>
                <div className="role-details-header">
                  <div>
                    <span>Выбранная роль</span>
                    {editingRole ? (
                      <div className="role-edit-form">
                        <Input
                          value={editForm.name}
                          onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                        />
                        <Input
                          value={editForm.description}
                          onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}
                          placeholder="Описание роли"
                        />
                      </div>
                    ) : (
                      <>
                        <h2>{selectedRole.name}</h2>
                        <p>{selectedRole.description || 'Описание роли не задано'}</p>
                      </>
                    )}
                  </div>
                  <div className="role-details-actions">
                    {editingRole ? (
                      <>
                        <Button size="sm" onClick={() => setEditingRole(false)} disabled={updating}>
                          Отмена
                        </Button>
                        <Button size="sm" variant="primary" onClick={handleSaveRole} loading={updating}>
                          Сохранить
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" onClick={() => setEditingRole(true)}>
                          Редактировать
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => requestDeleteRole(selectedRole)}>
                          Удалить
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="role-permission-toolbar">
                  <div>
                    <strong>{globalSelectedPermissions.length}</strong>
                    <span>назначено из {globalPermissions.length}</span>
                  </div>
                  <Input
                    value={permissionSearch}
                    onChange={(event) => setPermissionSearch(event.target.value)}
                    placeholder="Поиск прав"
                  />
                </div>

                <div className="permissions-columns">
                  <PermissionColumn
                    title="Назначенные права"
                    groups={assignedGroups}
                    emptyText="У роли пока нет прав"
                    actionLabel="Убрать"
                    actionVariant="danger"
                    loading={removingPermission}
                    onAction={requestRemovePermission}
                  />
                  <PermissionColumn
                    title="Доступные права"
                    groups={availableGroups}
                    emptyText="Нет доступных прав для добавления"
                    actionLabel="Добавить"
                    actionVariant="primary"
                    loading={addingPermission}
                    onAction={handleAddPermission}
                  />
                </div>
              </>
            ) : (
              <EmptyState text="Выберите роль для просмотра деталей" />
            )}
          </section>
        </div>
      ) : null}

      <Modal
        open={!!confirm}
        onClose={() => {
          if (!confirmLoading) setConfirm(null);
        }}
        maxWidth={460}
        title={
          confirm ? (
            <div className={`roles-confirm-title roles-confirm-title--${confirm.variant ?? 'primary'}`}>
              <span>{confirm.title}</span>
            </div>
          ) : null
        }
        footer={
          confirm ? (
            <div className="roles-confirm-actions">
              <Button onClick={() => setConfirm(null)} disabled={confirmLoading}>
                Отмена
              </Button>
              <Button
                variant={confirm.variant === 'danger' ? 'danger' : 'primary'}
                onClick={handleConfirm}
                loading={confirmLoading}
              >
                {confirm.confirmLabel}
              </Button>
            </div>
          ) : null
        }
      >
        {confirm ? <p className="roles-confirm-message">{confirm.message}</p> : null}
      </Modal>
    </div>
  );
};

const PermissionColumn: React.FC<{
  title: string;
  groups: Record<string, Permission[]>;
  emptyText: string;
  actionLabel: string;
  actionVariant: 'primary' | 'danger';
  loading: boolean;
  onAction: (permission: Permission) => void;
}> = ({ title, groups, emptyText, actionLabel, actionVariant, loading, onAction }) => {
  const entries = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b, 'ru'));

  return (
    <div className="permissions-column">
      <div className="permissions-column__header">
        <h3>{title}</h3>
        <span>{entries.reduce((sum, [, items]) => sum + items.length, 0)}</span>
      </div>

      {entries.length === 0 ? (
        <div className="roles-inline-empty">{emptyText}</div>
      ) : (
        <div className="permissions-groups">
          {entries.map(([module, items]) => (
            <section key={module} className="permission-group">
              <h4>{module}</h4>
              <div className="permission-list">
                {items.map((permission) => (
                  <article key={permission.id} className="permission-card">
                    <div>
                      <strong>{permissionTitle(permission)}</strong>
                      <p>{permissionDescription(permission)}</p>
                      <code>{permission.code}</code>
                    </div>
                    <Button
                      size="sm"
                      variant={actionVariant}
                      onClick={() => onAction(permission)}
                      disabled={loading}
                    >
                      {actionLabel}
                    </Button>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
