import React, { useMemo, useState } from 'react';
import {
  useApprovePasswordResetRequestMutation,
  useListPasswordResetRequestsQuery,
  useRejectPasswordResetRequestMutation,
} from '../../../api/authApi';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States';
import type { PasswordResetRequestItem, PasswordResetRequestStatus } from '../../../types';
import './PasswordResetRequestsPage.css';

const statusLabels: Record<PasswordResetRequestStatus, string> = {
  PENDING: 'Ожидает',
  APPROVED: 'Одобрен',
  REJECTED: 'Отклонен',
  USED: 'Использован',
  EXPIRED: 'Истек',
};

const displayName = (request: PasswordResetRequestItem) => {
  const user = request.user;
  if (user.displayName) return user.displayName;
  const fullName = [user.lastName, user.firstName, user.secondName].filter(Boolean).join(' ');
  return fullName || user.email;
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

export const PasswordResetRequestsPage: React.FC = () => {
  const { data = [], isLoading, isError, refetch } = useListPasswordResetRequestsQuery();
  const [approveRequest, { isLoading: approving }] = useApprovePasswordResetRequestMutation();
  const [rejectRequest, { isLoading: rejecting }] = useRejectPasswordResetRequestMutation();
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<PasswordResetRequestItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState('');

  const pendingCount = useMemo(() => data.filter((item) => item.status === 'PENDING').length, [data]);

  const handleApprove = async (request: PasswordResetRequestItem) => {
    setError('');
    try {
      const result = await approveRequest(request.id).unwrap();
      setTemporaryPassword(result.temporaryPassword);
    } catch {
      setError('Не удалось одобрить запрос.');
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setError('');
    try {
      await rejectRequest({ id: rejectTarget.id, reason: rejectReason.trim() || undefined }).unwrap();
      setRejectTarget(null);
      setRejectReason('');
    } catch {
      setError('Не удалось отклонить запрос.');
    }
  };

  const handleCopyPassword = async () => {
    if (!temporaryPassword) return;
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setPasswordCopied(true);
      window.setTimeout(() => setPasswordCopied(false), 1800);
    } catch {
      setError('Не удалось скопировать пароль.');
    }
  };

  return (
    <div className="password-reset-page">
      <section className="password-reset-hero">
        <div>
          <span>Безопасность</span>
          <h1>Сброс пароля</h1>
          <p>Обрабатывайте локальные запросы восстановления и выдавайте временные пароли пользователям.</p>
        </div>
        <div className="password-reset-hero__stat">
          <strong>{pendingCount}</strong>
          <span>ожидают решения</span>
        </div>
      </section>

      {error ? <div className="password-reset-error">{error}</div> : null}
      {isLoading ? <LoadingState /> : null}
      {isError ? <ErrorState text="Не удалось загрузить запросы." onRetry={refetch} /> : null}

      {!isLoading && !isError && data.length === 0 ? <EmptyState text="Запросов на восстановление пока нет" /> : null}

      {!isLoading && !isError && data.length > 0 ? (
        <div className="password-reset-list">
          {data.map((request) => (
            <article key={request.id} className="password-reset-card">
              <div className="password-reset-card__main">
                <span className={`password-reset-status password-reset-status--${request.status.toLowerCase()}`}>
                  {statusLabels[request.status]}
                </span>
                <h2>{displayName(request)}</h2>
                <p>{request.user.email}</p>
                {request.reason ? <div className="password-reset-reason">{request.reason}</div> : null}
              </div>

              <div className="password-reset-card__meta">
                <span>Создан: {formatDate(request.createdAt)}</span>
                <span>Истекает: {formatDate(request.expiresAt)}</span>
                {request.processedAt ? <span>Обработан: {formatDate(request.processedAt)}</span> : null}
              </div>

              <div className="password-reset-card__actions">
                {request.status === 'PENDING' ? (
                  <>
                    <Button size="sm" variant="primary" onClick={() => handleApprove(request)} loading={approving}>
                      Одобрить
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setRejectTarget(request)} disabled={rejecting}>
                      Отклонить
                    </Button>
                  </>
                ) : (
                  <span className="password-reset-card__done">Действий нет</span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <Modal
        open={!!temporaryPassword}
        onClose={() => {
          setTemporaryPassword('');
          setPasswordCopied(false);
        }}
        maxWidth={520}
        title={<h2 className="password-reset-modal-title">Временный пароль</h2>}
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
        <div className="password-reset-temp">
          <p>Скопируйте пароль сейчас. После закрытия окна он больше не будет показан.</p>
          <div className="password-reset-temp__value">
            <code>{temporaryPassword}</code>
            <Button size="sm" onClick={handleCopyPassword}>
              {passwordCopied ? 'Скопировано' : 'Скопировать'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        maxWidth={520}
        title={<h2 className="password-reset-modal-title">Отклонить запрос?</h2>}
        footer={
          <div className="password-reset-modal-actions">
            <Button onClick={() => setRejectTarget(null)} disabled={rejecting}>Отмена</Button>
            <Button variant="danger" onClick={handleReject} loading={rejecting}>Отклонить</Button>
          </div>
        }
      >
        <label className="password-reset-reject-form">
          <span>Причина отказа</span>
          <textarea
            className="textarea"
            rows={4}
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="Необязательно"
          />
        </label>
      </Modal>
    </div>
  );
};
