import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { useRegisterMutation } from '../../api/authApi';

const getErrorMessage = (err: unknown, fallback: string) => {
  if (!err || typeof err !== 'object' || !('data' in err)) return fallback;

  const data = (err as FetchBaseQueryError).data;
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message?: unknown }).message;
    return typeof message === 'string' ? message : fallback;
  }

  return fallback;
};

export const RegisterPage: React.FC = () => {
  const [register, { isLoading }] = useRegisterMutation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
  }>({})

  const buildDisplayName = () => {
    const firstInitial = firstName.trim().charAt(0);
    const secondInitial = secondName.trim().charAt(0);

    return `${lastName} ${firstInitial}.${secondInitial || ''}${secondName ? '.' : ''}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const errors: typeof fieldErrors = {};

    if (!firstName.trim()) {
      errors.firstName = 'Обязательное поле';
    }

    if (!lastName.trim()) {
      errors.lastName = 'Обязательное поле';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setError('');

    try {
      const payload = {
        email,
        password,
        firstName,
        lastName,
        ...(secondName ? { secondName } : {}),
        displayName: buildDisplayName(),
      };
      const data = await register(payload).unwrap();
      setSuccess(data.message);
      setEmail('');
      setPassword('');
      setFirstName('');
      setSecondName('');
      setLastName('');
      window.setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось отправить заявку. Пожалуйста, попробуйте снова.'));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Регистрация</h1>
          <p>Отправьте заявку на создание аккаунта</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <div className="form-group">
            <label htmlFor="lastName">Фамилия *</label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={`input ${fieldErrors.lastName ? 'input-error' : ''}`}
              placeholder="Иванов"
            />
          </div>
          <div className="form-group">
            <label htmlFor="firstName">Имя *</label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={`input ${fieldErrors.firstName ? 'input-error' : ''}`}
              placeholder="Иван"
            />
          </div>
          <div className="form-group">
            <label htmlFor="secondName">Отчество</label>
            <input
              id="secondName"
              type="text"
              value={secondName}
              onChange={(e) => setSecondName(e.target.value)}
              className="input"
              placeholder="Иванович"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`input ${fieldErrors.email ? 'input-error' : ''}`}
              placeholder="your@email.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Пароль *</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`input ${fieldErrors.password ? 'input-error' : ''}`}
              placeholder="••••••••"
            />
          </div>

          {firstName && lastName && (
            <div className="display-name-preview">
              Ваше имя в системе: <strong>{buildDisplayName()}</strong>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isLoading}
          >
            {isLoading ? 'Отправка...' : 'Отправить заявку'}
          </button>
        </form>
        <div className="auth-footer">
          <p>
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
