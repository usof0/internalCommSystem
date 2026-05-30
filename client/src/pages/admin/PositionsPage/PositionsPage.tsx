import React, { useEffect, useMemo, useState } from 'react';
import {
  useAssignPositionRolesMutation,
  useCreatePositionMutation,
  useDeletePositionMutation,
  useListPositionRolesQuery,
  useListPositionsQuery,
  useRemovePositionRoleMutation,
  useUpdatePositionMutation,
} from '../../../api/orgsApi';
import { useListRolesQuery } from '../../../api/rbacApi';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Form';
import { Modal } from '../../../components/ui/Modal';
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States';
import { usePermission } from '../../../hooks/usePermission';
import type { Position, PositionRole, Role } from '../../../types';
import './PositionsPage.css';

type PositionForm = {
  name: string;
  description: string;
};

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel: string;
  variant?: 'primary' | 'danger';
  onConfirm: () => Promise<unknown>;
};

const emptyForm: PositionForm = { name: '', description: '' };

const positionMatches = (position: Position, query: string) => {
  if (!query) return true;
  return [position.name, position.description].filter(Boolean).join(' ').toLowerCase().includes(query.toLowerCase());
};

const roleMatches = (role: Role | PositionRole, query: string) => {
  if (!query) return true;
  const name = 'roleName' in role ? role.roleName : role.name;
  const description = 'roleName' in role ? role.roleDescription : role.description;
  return [name, description].filter(Boolean).join(' ').toLowerCase().includes(query.toLowerCase());
};

export const PositionsPage: React.FC = () => {
  const canManagePositions = usePermission('org.manage');

  const { data: positionsData = [], isLoading: positionsLoading, isError: positionsError, refetch } = useListPositionsQuery();
  const { data: roles = [], isLoading: rolesLoading } = useListRolesQuery();
  const [createPosition, { isLoading: creating }] = useCreatePositionMutation();
  const [updatePosition, { isLoading: updating }] = useUpdatePositionMutation();
  const [deletePosition] = useDeletePositionMutation();
  const [assignRoles, { isLoading: assigningRole }] = useAssignPositionRolesMutation();
  const [removeRole, { isLoading: removingRole }] = useRemovePositionRoleMutation();

  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<PositionForm>(emptyForm);
  const [editForm, setEditForm] = useState<PositionForm>(emptyForm);
  const [positionSearch, setPositionSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const positions = positionsData;
  const selectedPosition = positions.find((position) => position.id === selectedPositionId) ?? null;
  const { data: assignedRoles = [], isLoading: assignedRolesLoading } = useListPositionRolesQuery(selectedPositionId!, {
    skip: !selectedPositionId,
  });

  const assignedRoleIds = useMemo(() => new Set(assignedRoles.map((role) => role.roleId)), [assignedRoles]);
  const availableRoles = roles.filter((role) => !assignedRoleIds.has(role.id));
  const visiblePositions = positions.filter((position) => positionMatches(position, positionSearch.trim()));
  const visibleAssignedRoles = assignedRoles.filter((role) => roleMatches(role, roleSearch.trim()));
  const visibleAvailableRoles = availableRoles.filter((role) => roleMatches(role, roleSearch.trim()));
  const positionsWithDescription = positions.filter((position) => position.description?.trim()).length;
  const isLoading = positionsLoading || rolesLoading;

  useEffect(() => {
    if (!selectedPositionId && positions.length > 0) {
      setSelectedPositionId(positions[0].id);
    }
  }, [positions, selectedPositionId]);

  useEffect(() => {
    if (!selectedPosition) return;
    setEditForm({
      name: selectedPosition.name,
      description: selectedPosition.description ?? '',
    });
    setIsEditing(false);
  }, [selectedPosition?.id]);

  if (!canManagePositions) {
    return <div className="error">Нет прав для управления должностями</div>;
  }

  const openConfirm = (state: ConfirmState) => {
    setErrorMessage('');
    setConfirm(state);
  };

  const runConfirm = async () => {
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
      const position = await createPosition({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      }).unwrap();
      setForm(emptyForm);
      setIsCreating(false);
      setSelectedPositionId(position.id);
    } catch (err) {
      console.error(err);
      setErrorMessage('Не удалось создать должность.');
    }
  };

  const handleSave = async () => {
    if (!selectedPositionId) return;
    setErrorMessage('');
    try {
      await updatePosition({
        positionId: selectedPositionId,
        body: {
          name: editForm.name.trim(),
          description: editForm.description.trim() || undefined,
        },
      }).unwrap();
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setErrorMessage('Не удалось обновить должность.');
    }
  };

  const requestDelete = (position: Position) => {
    openConfirm({
      title: 'Удалить должность?',
      message: `Должность "${position.name}" будет удалена. Пользователи больше не смогут назначаться на нее в подразделениях.`,
      confirmLabel: 'Удалить должность',
      variant: 'danger',
      onConfirm: async () => {
        await deletePosition(position.id).unwrap();
        if (selectedPositionId === position.id) {
          const nextPosition = positions.find((item) => item.id !== position.id);
          setSelectedPositionId(nextPosition?.id ?? null);
        }
      },
    });
  };

  const handleAssignRole = async (role: Role) => {
    if (!selectedPositionId || assignedRoleIds.has(role.id)) return;
    setErrorMessage('');
    try {
      await assignRoles({ positionId: selectedPositionId, body: { roleIds: [role.id] } }).unwrap();
    } catch (err) {
      console.error(err);
      setErrorMessage('Не удалось назначить роль должности.');
    }
  };

  const requestRemoveRole = (role: PositionRole) => {
    if (!selectedPositionId) return;
    openConfirm({
      title: 'Убрать роль с должности?',
      message: `Роль "${role.roleName}" больше не будет выдаваться через должность "${selectedPosition?.name ?? ''}".`,
      confirmLabel: 'Убрать роль',
      variant: 'danger',
      onConfirm: async () => {
        await removeRole({ positionId: selectedPositionId, roleId: role.roleId }).unwrap();
      },
    });
  };

  return (
    <div className="admin-positions-page">
      <section className="positions-hero">
        <div>
          <span>Оргструктура и доступ</span>
          <h1>Должности</h1>
        </div>
        <Button variant="primary" onClick={() => setIsCreating((value) => !value)}>
          {isCreating ? 'Закрыть форму' : 'Создать должность'}
        </Button>
      </section>

      <div className="positions-summary">
        <div>
          <strong>{positions.length}</strong>
          <span>должностей</span>
        </div>
        <div>
          <strong>{positionsWithDescription}</strong>
          <span>с описанием</span>
        </div>
        <div>
          <strong>{roles.length}</strong>
          <span>доступных ролей</span>
        </div>
        <div>
          <strong>{assignedRoles.length}</strong>
          <span>ролей у выбранной</span>
        </div>
      </div>

      {isCreating ? (
        <form className="position-create-panel" onSubmit={handleCreate}>
          <div className="position-create-panel__header">
            <h2>Новая должность</h2>
            <p>После создания выберите должность и назначьте роли, которые должны наследовать ее участники.</p>
          </div>
          <div className="position-form-grid">
            <label>
              <span>Название должности *</span>
              <Input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Например: Преподаватель"
                required
              />
            </label>
            <label>
              <span>Описание</span>
              <Input
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Кратко опишите область ответственности"
              />
            </label>
          </div>
          <div className="position-create-panel__actions">
            <Button type="submit" variant="primary" loading={creating}>
              Создать должность
            </Button>
          </div>
        </form>
      ) : null}

      {errorMessage ? <div className="positions-error-message">{errorMessage}</div> : null}

      {isLoading ? <LoadingState /> : null}
      {positionsError ? <ErrorState text="Ошибка загрузки должностей." onRetry={refetch} /> : null}

      {!isLoading && !positionsError && positions.length === 0 ? <EmptyState text="Должности еще не созданы" /> : null}

      {!isLoading && !positionsError && positions.length > 0 ? (
        <div className="positions-workspace">
          <aside className="positions-list-panel">
            <div className="positions-panel-header">
              <div>
                <h2>Список должностей</h2>
                <p>{visiblePositions.length} из {positions.length}</p>
              </div>
            </div>
            <label className="positions-search">
              <span>Поиск должностей</span>
              <Input
                value={positionSearch}
                onChange={(event) => setPositionSearch(event.target.value)}
                placeholder="Название или описание"
              />
            </label>
            <div className="positions-list">
              {visiblePositions.map((position) => (
                <button
                  key={position.id}
                  type="button"
                  className={`positions-list-item${selectedPositionId === position.id ? ' positions-list-item--active' : ''}`}
                  onClick={() => setSelectedPositionId(position.id)}
                >
                  <span>
                    <strong>{position.name}</strong>
                    <small>{position.description || 'Описание не задано'}</small>
                  </span>
                </button>
              ))}
              {visiblePositions.length === 0 ? <div className="positions-inline-empty">Должности не найдены</div> : null}
            </div>
          </aside>

          <section className="position-details-panel">
            {selectedPosition ? (
              <>
                <div className="position-details-header">
                  <div>
                    <span>Выбранная должность</span>
                    {isEditing ? (
                      <div className="position-edit-form">
                        <Input
                          value={editForm.name}
                          onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                        />
                        <Input
                          value={editForm.description}
                          onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}
                          placeholder="Описание должности"
                        />
                      </div>
                    ) : (
                      <>
                        <h2>{selectedPosition.name}</h2>
                        <p>{selectedPosition.description || 'Описание должности не задано'}</p>
                      </>
                    )}
                  </div>
                  <div className="position-details-actions">
                    {isEditing ? (
                      <>
                        <Button size="sm" onClick={() => setIsEditing(false)} disabled={updating}>
                          Отмена
                        </Button>
                        <Button size="sm" variant="primary" onClick={handleSave} loading={updating}>
                          Сохранить
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" onClick={() => setIsEditing(true)}>
                          Редактировать
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => requestDelete(selectedPosition)}>
                          Удалить
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="position-links-grid">
                  <div>
                    <strong>{assignedRoles.length}</strong>
                    <span>ролей доступа назначено этой должности</span>
                  </div>
                  <div>
                    <strong>Подразделения</strong>
                    <span>участники получают должность внутри карточки подразделения</span>
                  </div>
                </div>

                <div className="position-role-toolbar">
                  <div>
                    <strong>Роли должности</strong>
                    <span>Настройте доступ, который наследуют пользователи с этой должностью.</span>
                  </div>
                  <Input
                    value={roleSearch}
                    onChange={(event) => setRoleSearch(event.target.value)}
                    placeholder="Поиск ролей"
                  />
                </div>

                {assignedRolesLoading ? <LoadingState text="Загрузка ролей должности..." /> : null}

                {!assignedRolesLoading ? (
                  <div className="position-role-columns">
                    <PositionRoleColumn
                      title="Назначенные роли"
                      emptyText="У должности пока нет ролей"
                      roles={visibleAssignedRoles}
                      actionLabel="Убрать"
                      actionVariant="danger"
                      loading={removingRole}
                      onAction={requestRemoveRole}
                    />
                    <AvailableRoleColumn
                      title="Доступные роли"
                      emptyText="Нет ролей для добавления"
                      roles={visibleAvailableRoles}
                      loading={assigningRole}
                      onAction={handleAssignRole}
                    />
                  </div>
                ) : null}
              </>
            ) : (
              <EmptyState text="Выберите должность для настройки" />
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
            <div className={`positions-confirm-title positions-confirm-title--${confirm.variant ?? 'primary'}`}>
              <span>{confirm.title}</span>
            </div>
          ) : null
        }
        footer={
          confirm ? (
            <div className="positions-confirm-actions">
              <Button onClick={() => setConfirm(null)} disabled={confirmLoading}>
                Отмена
              </Button>
              <Button
                variant={confirm.variant === 'danger' ? 'danger' : 'primary'}
                onClick={runConfirm}
                loading={confirmLoading}
              >
                {confirm.confirmLabel}
              </Button>
            </div>
          ) : null
        }
      >
        {confirm ? <p className="positions-confirm-message">{confirm.message}</p> : null}
      </Modal>
    </div>
  );
};

const PositionRoleColumn: React.FC<{
  title: string;
  emptyText: string;
  roles: PositionRole[];
  actionLabel: string;
  actionVariant: 'danger';
  loading: boolean;
  onAction: (role: PositionRole) => void;
}> = ({ title, emptyText, roles, actionLabel, actionVariant, loading, onAction }) => (
  <div className="position-role-column">
    <div className="position-role-column__header">
      <h3>{title}</h3>
      <span>{roles.length}</span>
    </div>
    <div className="position-role-list">
      {roles.map((role) => (
        <div key={role.roleId} className="position-role-card">
          <div>
            <strong>{role.roleName}</strong>
            <p>{role.roleDescription || 'Описание роли не задано'}</p>
          </div>
          <Button size="sm" variant={actionVariant} onClick={() => onAction(role)} loading={loading}>
            {actionLabel}
          </Button>
        </div>
      ))}
      {roles.length === 0 ? <div className="positions-inline-empty">{emptyText}</div> : null}
    </div>
  </div>
);

const AvailableRoleColumn: React.FC<{
  title: string;
  emptyText: string;
  roles: Role[];
  loading: boolean;
  onAction: (role: Role) => void;
}> = ({ title, emptyText, roles, loading, onAction }) => (
  <div className="position-role-column">
    <div className="position-role-column__header">
      <h3>{title}</h3>
      <span>{roles.length}</span>
    </div>
    <div className="position-role-list">
      {roles.map((role) => (
        <div key={role.id} className="position-role-card">
          <div>
            <strong>{role.name}</strong>
            <p>{role.description || 'Описание роли не задано'}</p>
          </div>
          <Button size="sm" variant="primary" onClick={() => onAction(role)} loading={loading}>
            Добавить
          </Button>
        </div>
      ))}
      {roles.length === 0 ? <div className="positions-inline-empty">{emptyText}</div> : null}
    </div>
  </div>
);
