import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

import type { RootState } from '../../app/store';
import { setUser } from '../../app/slices/authSlice';
import { useChangePasswordMutation } from '../../api/authApi';
import { ErrorState, LoadingState } from '../../components/ui/States';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { ProfileSectionHeader } from '../admin/UserDetailsPage/features';

import { ProfileOverview } from './features/ProfileOverview/ProfileOverview';
import { createProfileFormData, toUpdateMeRequest, useMyProfileData, useUpdateMyProfile } from './features/ProfileOverview/ProfileOverview.api';
import type { ProfileFormData } from './features/ProfileOverview/ProfileOverview.types';
import { ProfileRoles } from './features/ProfileRoles/ProfileRoles';
import { useMyRoles } from './features/ProfileRoles/ProfileRoles.api';
import { ProfileOrganizations } from './features/ProfileOrganizations/ProfileOrganizations';

export const ProfilePage: React.FC = () => {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);

  const { data: profile, isLoading, isError, isUninitialized, refetch } = useMyProfileData(!token);
  const [updateMe, { isLoading: isUpdating }] = useUpdateMyProfile();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>(createProfileFormData());
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const userId = profile?.id;
  const { data: userRolesData } = useMyRoles(userId);
  const userRoles = userRolesData ?? [];

  useEffect(() => {
    if (profile) {
      setFormData(createProfileFormData(profile));
    }
  }, [profile]);

  if (!token) return <Navigate to="/login" replace />;
  if (isUninitialized || isLoading) return <LoadingState text="Загрузка профиля..." />;

  if (isError || !profile) {
    return (
      <div className="error-container">
        <ErrorState text="Ошибка загрузки профиля" onRetry={refetch} />
      </div>
    );
  }

  const handleSave = async () => {
    try {
      const updatedUser = await updateMe(toUpdateMeRequest(formData)).unwrap();
      dispatch(setUser(updatedUser));
      setIsEditing(false);
      refetch();
    } catch (_error) {
      alert('Не удалось обновить профиль');
    }
  };

  const handleCancel = () => {
    setFormData(createProfileFormData(profile));
    setIsEditing(false);
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Новый пароль должен содержать минимум 8 символов.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Новый пароль и подтверждение не совпадают.');
      return;
    }

    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }).unwrap();
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSuccess('Пароль успешно изменен.');
      window.setTimeout(() => setIsPasswordModalOpen(false), 700);
    } catch {
      setPasswordError('Не удалось изменить пароль. Проверьте текущий пароль.');
    }
  };

  return (
    <div className="profile-page">
      <ProfileOverview
        profile={profile}
        formData={formData}
        isEditing={isEditing}
        isSaving={isUpdating}
        onStartEdit={() => setIsEditing(true)}
        onOpenPasswordChange={() => {
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setPasswordError('');
          setPasswordSuccess('');
          setIsPasswordModalOpen(true);
        }}
        onCancelEdit={handleCancel}
        onSave={handleSave}
        onChange={setFormData}
      />

      <div className="profile-content">
        <div className="profile-info">
          <ProfileRoles roles={userRoles} />
        </div>

        <div className="profile-organizations">
          <ProfileSectionHeader>
            <h3>Организации</h3>
          </ProfileSectionHeader>
          <ProfileOrganizations memberships={profile.organizationMemberships ?? []} />
        </div>
      </div>

      <Modal
        open={isPasswordModalOpen}
        onClose={() => {
          if (!isChangingPassword) setIsPasswordModalOpen(false);
        }}
        maxWidth={520}
        title={<h2 className="profile-password-modal-title">Изменить пароль</h2>}
        footer={
          <div className="profile-password-modal-actions">
            <Button onClick={() => setIsPasswordModalOpen(false)} disabled={isChangingPassword}>
              Отмена
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="profile-password-form"
              loading={isChangingPassword}
            >
              Сохранить
            </Button>
          </div>
        }
      >
        <form id="profile-password-form" className="profile-password-form" onSubmit={handlePasswordSubmit}>
          {passwordError ? <div className="profile-password-message profile-password-message--error">{passwordError}</div> : null}
          {passwordSuccess ? <div className="profile-password-message profile-password-message--success">{passwordSuccess}</div> : null}

          <label>
            <span>Текущий пароль</span>
            <input
              className="input"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
              }
              required
            />
          </label>

          <label>
            <span>Новый пароль</span>
            <input
              className="input"
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
              }
              required
              minLength={8}
            />
          </label>

          <label>
            <span>Подтвердите новый пароль</span>
            <input
              className="input"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
              }
              required
              minLength={8}
            />
          </label>
        </form>
      </Modal>
    </div>
  );
};
