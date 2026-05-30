import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { usePermission } from '../../../hooks/usePermission';
import { Button } from '../../../components/ui/Button';
import { BackButton } from '../../../components/ui/BackButton';
import { Modal } from '../../../components/ui/Modal';
import { LoadingState, ErrorState } from '../../../components/ui/States';
import {
  useActivateUser,
  useAssignUserRoles,
  useAvailableRolesData,
  useBlockUser,
  useDeactivateUser,
  useDeleteUser,
  useRemoveUserRole,
  useResetUserPassword,
  useUnblockUser,
  useUpdateUserProfile,
  useUserDetailsData,
  useUserRolesData,
  toUpdateUserRequest,
} from './UserDetailsPage.api';
import { createUserProfileFormData, type UserDetailsPageParams } from './UserDetailsPage.types';

import { UserDetailsHeader } from './features';
import { UserAvatarSection } from './features';
import { UserBasicInfoSection } from './features';
import { UserStatusSection } from './features';
import { UserRolesSection } from './features';
import { UserOrganizationsSection } from './features';
import { UserActionsSection } from './features';

type ConfirmDialogState = {
  title: string;
  message: string;
  confirmLabel: string;
  variant?: 'primary' | 'danger';
  onConfirm: () => Promise<unknown>;
};

export const UserDetailsPage: React.FC = () => {
  const { userId } = useParams<UserDetailsPageParams>();
  const navigate = useNavigate();

  const canManageUsers = usePermission('users.manage');
  const canManageRoles = usePermission('rbac.roles.manage');
  const canDelete = usePermission('users.delete');

  const { data: profile, isLoading, isError, refetch } = useUserDetailsData(userId);

  const { data: userRolesData } = useUserRolesData(userId);
  const userRoles = userRolesData ?? [];

  const { data: allRoles } = useAvailableRolesData();

  const [updateUser, { isLoading: isUpdating }] = useUpdateUserProfile();
  const [blockUser] = useBlockUser();
  const [unblockUser] = useUnblockUser();
  const [activateUser] = useActivateUser();
  const [deactivateUser] = useDeactivateUser();
  const [deleteUser] = useDeleteUser();
  const [resetUserPassword] = useResetUserPassword();

  const [assignRoles] = useAssignUserRoles();
  const [removeRole] = useRemoveUserRole();

  const [isEditing, setIsEditing] = useState(false);
  const [isAssigningRoles, setIsAssigningRoles] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [passwordCopied, setPasswordCopied] = useState(false);

  const [formData, setFormData] = useState(createUserProfileFormData());

  useEffect(() => {
    if (!profile) return;
    setFormData(createUserProfileFormData(profile));
  }, [profile]);

  if (!canManageUsers) {
    return <div className="error">Нет прав для просмотра пользователей</div>;
  }

  if (isLoading) return <LoadingState />;
  if (isError || !profile) {
    return (
      <div className="error-container">
        <ErrorState text="Ошибка загрузки данных пользователя" onRetry={refetch} />
        <div className="user-details-error-actions">
          <BackButton onClick={() => navigate('/admin/users')} label="К пользователям" />
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      await updateUser({
        id: userId!,
        body: toUpdateUserRequest(formData),
      }).unwrap();

      setIsEditing(false);
      refetch();
    } catch (err) {
      console.error('Ошибка обновления пользователя:', err);
      alert('Не удалось обновить пользователя');
    }
  };

  const handleCancel = () => {
    setFormData(createUserProfileFormData(profile));
    setIsEditing(false);
  };

  const openConfirmDialog = (dialog: ConfirmDialogState) => {
    setConfirmError('');
    setConfirmDialog(dialog);
  };

  const handleConfirmDialog = async () => {
    if (!confirmDialog) return;
    setConfirmLoading(true);
    setConfirmError('');
    try {
      await confirmDialog.onConfirm();
      setConfirmDialog(null);
    } catch (err) {
      console.error(err);
      setConfirmError('Не удалось выполнить действие. Попробуйте еще раз.');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCopyPassword = async () => {
    if (!temporaryPassword) return;
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setPasswordCopied(true);
      window.setTimeout(() => setPasswordCopied(false), 1800);
    } catch {
      setConfirmError('Не удалось скопировать пароль.');
    }
  };

  const confirmAction = (message: string, fn: () => Promise<any>) => {
    const isDanger = message.includes('Заблокировать') || message.includes('Деактивировать');
    openConfirmDialog({
      title: 'Подтвердите действие',
      message,
      confirmLabel: message.replace('?', ''),
      variant: isDanger ? 'danger' : 'primary',
      onConfirm: async () => {
        await fn();
        refetch();
      },
    });
  };

  const handleDelete = () => {
    openConfirmDialog({
      title: 'Удалить пользователя?',
      message: 'Это действие необратимо. Учетная запись будет удалена из списка пользователей.',
      confirmLabel: 'Удалить пользователя',
      variant: 'danger',
      onConfirm: async () => {
        await deleteUser(userId!).unwrap();
        navigate('/admin/users');
      },
    });
  };

  return (
    <div className="user-details-page">
      <UserDetailsHeader
        onBack={() => navigate('/admin/users')}
        email={profile.email}
        displayName={profile.displayName}
        firstName={profile.firstName}
        lastName={profile.lastName}
        isActive={!!profile.isActive}
        isBlocked={!!profile.isBlocked}
        isEditing={isEditing}
        onStartEdit={() => setIsEditing(true)}
        onCancel={handleCancel}
        onSave={handleSave}
        isSaving={isUpdating}
        canDelete={!!canDelete}
        onDelete={handleDelete}
      />

      <div className="profile-content">
        <div className="user-details-side">
          <UserAvatarSection
            email={profile.email}
            displayName={profile.displayName}
            firstName={profile.firstName}
            lastName={profile.lastName}
            avatarUrl={profile.avatarUrl}
            editingAvatarUrl={formData.avatarUrl}
            isEditing={isEditing}
            onChangeAvatarUrl={(value) => setFormData((p) => ({ ...p, avatarUrl: value }))}
          />

          <UserActionsSection
            isActive={!!profile.isActive}
            isBlocked={!!profile.isBlocked}
            onConfirmAction={confirmAction}
            onActivate={() => activateUser(userId!).unwrap()}
            onDeactivate={() => deactivateUser(userId!).unwrap()}
            onBlock={() => blockUser(userId!).unwrap()}
            onUnblock={() => unblockUser(userId!).unwrap()}
            onResetPassword={async () => {
              const result = await resetUserPassword({ id: userId! }).unwrap();
              setTemporaryPassword(result.temporaryPassword || '');
            }}
          />
        </div>

        <div className="profile-info">
          <UserBasicInfoSection
            email={profile.email}
            profile={profile}
            isEditing={isEditing}
            formData={{
              firstName: formData.firstName,
              secondName: formData.secondName,
              lastName: formData.lastName,
              displayName: formData.displayName,
            }}
            onChange={(next) =>
              setFormData((p) => ({
                ...p,
                firstName: next.firstName,
                secondName: next.secondName,
                lastName: next.lastName,
                displayName: next.displayName,
              }))
            }
          />

          <UserStatusSection
            isActive={!!profile.isActive}
            isBlocked={!!profile.isBlocked}
          />

          <UserRolesSection
            canManageRoles={!!canManageRoles}
            isAssigningRoles={isAssigningRoles}
            onToggleAssigning={() => setIsAssigningRoles((v) => !v)}
            userRoles={userRoles as any}
            allRoles={allRoles as any}
            onAssignRole={async (roleId) => {
              try {
                await assignRoles({ userId: userId!, body: { roleIds: [roleId] } }).unwrap();
              } catch (err) {
                console.error(err);
                alert('Не удалось назначить роль');
              }
            }}
            onRemoveRole={async (roleId, roleName) => {
              openConfirmDialog({
                title: 'Удалить роль?',
                message: `Роль "${roleName}" будет удалена у этого пользователя.`,
                confirmLabel: 'Удалить роль',
                variant: 'danger',
                onConfirm: async () => {
                  await removeRole({ userId: userId!, roleId }).unwrap();
                },
              });
            }}
          />
        </div>

        <UserOrganizationsSection
          memberships={ (profile.organizationMemberships ?? []) as any}
        />
      </div>

      <Modal
        open={!!confirmDialog}
        onClose={() => {
          if (!confirmLoading) setConfirmDialog(null);
        }}
        maxWidth={460}
        title={
          confirmDialog ? (
            <div className={`user-confirm-title user-confirm-title--${confirmDialog.variant ?? 'primary'}`}>
              <span className="user-confirm-title__icon">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="user-details-icon">
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                  <path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0Z" />
                </svg>
              </span>
              <span>{confirmDialog.title}</span>
            </div>
          ) : null
        }
        footer={
          confirmDialog ? (
            <div className="user-confirm-actions">
              <Button onClick={() => setConfirmDialog(null)} disabled={confirmLoading}>
                Отмена
              </Button>
              <Button
                variant={confirmDialog.variant === 'danger' ? 'danger' : 'primary'}
                onClick={handleConfirmDialog}
                loading={confirmLoading}
              >
                {confirmDialog.confirmLabel}
              </Button>
            </div>
          ) : null
        }
      >
        {confirmDialog ? (
          <div className="user-confirm-body">
            <p>{confirmDialog.message}</p>
            {confirmError ? <div className="user-confirm-error">{confirmError}</div> : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={!!temporaryPassword}
        onClose={() => {
          setTemporaryPassword('');
          setPasswordCopied(false);
        }}
        maxWidth={520}
        title={<h2 className="user-details-modal-title">Временный пароль</h2>}
        footer={
          <Button
            variant="primary"
            onClick={() => {
              setTemporaryPassword('');
              setPasswordCopied(false);
            }}
          >
            Закрыть
          </Button>
        }
      >
        <div className="user-details-temp-password">
          <p>Передайте пароль пользователю. После закрытия окна он больше не будет показан.</p>
          <div className="user-details-temp-password__value">
            <code>{temporaryPassword}</code>
            <Button size="sm" onClick={handleCopyPassword}>
              {passwordCopied ? 'Скопировано' : 'Скопировать'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
