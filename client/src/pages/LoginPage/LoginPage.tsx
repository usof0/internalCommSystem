import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

import { setCredentials } from '../../app/slices/authSlice';
import { useLoginMutation, useRequestPasswordResetMutation } from '../../api/authApi';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

const getErrorMessage = (err: unknown, fallback: string) => {
  if (!err || typeof err !== 'object' || !('data' in err)) return fallback;

  const data = (err as FetchBaseQueryError).data;
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message?: unknown }).message;
    return typeof message === 'string' ? message : fallback;
  }

  return fallback;
};

export const LoginPage: React.FC = () => {
  const [ login, { isLoading }] = useLoginMutation();
  const [requestPasswordReset, { isLoading: requestingReset }] = useRequestPasswordResetMutation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetReason, setResetReason] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const data = await login({ email: email.trim(), password }).unwrap();

      dispatch(setCredentials({
        user: data.user,
        authz: data.authz,
        token: data.token,
        // permissions: data.authz.permissions,
        // roles: data.authz.roles,
      }))

      navigate(data.mustChangePassword ? '/change-password' : '/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Неверный email или пароль'));
    }
  };

  const handleResetSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setResetError('');
    setResetMessage('');

    try {
      const result = await requestPasswordReset({
        email: resetEmail.trim(),
        reason: resetReason.trim() || undefined,
      }).unwrap();
      setResetMessage(result.message || 'Если аккаунт существует, запрос будет создан.');
      setResetReason('');
    } catch {
      setResetError('Не удалось отправить запрос. Попробуйте позже.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Вход</h1>
          <p>Добро пожаловать в ICS</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input"
              placeholder="your@email.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isLoading}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
          <button
            type="button"
            className="auth-link-button"
            onClick={() => {
              setResetOpen(true);
              setResetEmail(email);
              setResetMessage('');
              setResetError('');
            }}
          >
            Забыли пароль?
          </button>
        </form>
        <div className="auth-footer">
          <p>
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </p>
        </div>
      </div>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        maxWidth={520}
        title={<h2 className="auth-reset-title">Восстановление пароля</h2>}
        footer={
          <div className="auth-reset-actions">
            <Button onClick={() => setResetOpen(false)} disabled={requestingReset}>Закрыть</Button>
            <Button variant="primary" onClick={() => document.getElementById('password-reset-submit')?.click()} loading={requestingReset}>
              Отправить запрос
            </Button>
          </div>
        }
      >
        <form className="auth-reset-form" onSubmit={handleResetSubmit}>
          <p>Администратор рассмотрит запрос и выдаст временный пароль, если аккаунт существует.</p>
          {resetMessage ? <div className="auth-reset-success">{resetMessage}</div> : null}
          {resetError ? <div className="error-message">{resetError}</div> : null}
          <label>
            <span>Email</span>
            <input
              className="input"
              type="email"
              value={resetEmail}
              onChange={(event) => setResetEmail(event.target.value)}
              required
            />
          </label>
          <label>
            <span>Причина обращения</span>
            <textarea
              className="textarea"
              value={resetReason}
              onChange={(event) => setResetReason(event.target.value)}
              rows={4}
              placeholder="Необязательно"
            />
          </label>
          <button id="password-reset-submit" type="submit" hidden />
        </form>
      </Modal>
    </div>
  );
};
