import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChangePasswordMutation } from '../../api/authApi';
import './ChangePasswordPage.css';

export const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Новый пароль должен содержать минимум 8 символов.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают.');
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Не удалось изменить пароль. Проверьте текущий или временный пароль.');
    }
  };

  return (
    <div className="change-password-page">
      <form className="change-password-panel" onSubmit={handleSubmit}>
        <div className="change-password-panel__header">
          <span>Безопасность</span>
          <h1>Сменить пароль</h1>
          <p>Если вы вошли по временному паролю, задайте новый постоянный пароль.</p>
        </div>

        {error ? <div className="change-password-error">{error}</div> : null}

        <label>
          <span>Текущий или временный пароль</span>
          <input
            className="input"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />
        </label>

        <label>
          <span>Новый пароль</span>
          <input
            className="input"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            minLength={8}
          />
        </label>

        <label>
          <span>Повторите новый пароль</span>
          <input
            className="input"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={8}
          />
        </label>

        <button className="btn btn-primary btn-block" type="submit" disabled={isLoading}>
          {isLoading ? 'Сохранение...' : 'Сохранить новый пароль'}
        </button>
      </form>
    </div>
  );
};
