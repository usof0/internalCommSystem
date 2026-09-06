import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import {
  useApproveRegistrationRequestMutation,
  useListRegistrationRequestsQuery,
  useRejectRegistrationRequestMutation,
} from '../../../api/authApi';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States';
import { BackButton } from '../../../components/ui/BackButton';
import { usePermission } from '../../../hooks/usePermission';
import type { RegistrationRequestItem, RegistrationRequestStatus } from '../../../types';
import '../UsersPage/UsersPage.css';

const statusLabels: Record<RegistrationRequestStatus, string> = {
  PENDING: 'Ожидает',
  APPROVED: 'Одобрена',
  REJECTED: 'Отклонена',
};

const getFullName = (request: RegistrationRequestItem) => {
  const name = [request.lastName, request.firstName, request.secondName].filter(Boolean).join(' ');
  return request.displayName || name || 'Без имени';
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

const getErrorMessage = (err: unknown, fallback: string) => {
  if (!err || typeof err !== 'object' || !('data' in err)) return fallback;

  const data = (err as FetchBaseQueryError).data;
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message?: unknown }).message;
    return typeof message === 'string' ? message : fallback;
  }

  return fallback;
};

export const RegistrationRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const canCreateUsers = usePermission('users.create');
  const { data = [], isLoading, isError, refetch } = useListRegistrationRequestsQuery(undefined, {
    skip: !canCreateUsers,
  });
  const [approveRequest, { isLoading: approving }] = useApproveRegistrationRequestMutation();
  const [rejectRequest, { isLoading: rejecting }] = useRejectRegistrationRequestMutation();
  const [rejectTarget, setRejectTarget] = useState<RegistrationRequestItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState('');

  const pendingCount = useMemo(() => data.filter((item) => item.status === 'PENDING').length, [data]);

  if (!canCreateUsers) {
    return <div className="error">Нет прав для обработки заявок на регистрацию</div>;
  }

  const handleApprove = async (request: RegistrationRequestItem) => {
    setError('');
    try {
      await approveRequest(request.id).unwrap();
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось одобрить заявку.'));
      refetch();
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setError('');
    try {
      await rejectRequest({ id: rejectTarget.id, reason: rejectReason.trim() || undefined }).unwrap();
      setRejectTarget(null);
      setRejectReason('');
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось отклонить заявку.'));
    }
  };

  return (
    <div className="admin-users-page">
      <section className="users-toolbar users-registration-hero">
        <BackButton onClick={() => navigate('/admin/users')} aria-label="Назад к пользователям" />
        <div className="users-toolbar__title">
          <span>Пользователи</span>
          <h1>Заявки на регистрацию</h1>
          <p>Проверьте данные пользователя и примите решение. Пароль в заявке не отображается.</p>
        </div>
        <div className="users-registration-hero__stat">
          <strong>{pendingCount}</strong>
          <span>ожидают решения</span>
        </div>
      </section>

      {error ? <div className="users-request-error">{error}</div> : null}
      {isLoading ? <div className="users-state-card"><LoadingState /></div> : null}
      {isError ? (
        <div className="users-state-card">
          <ErrorState text="Не удалось загрузить заявки." onRetry={refetch} />
        </div>
      ) : null}

      {!isLoading && !isError && data.length === 0 ? (
        <div className="users-state-card">
          <EmptyState text="Заявок на регистрацию пока нет" />
        </div>
      ) : null}

      {!isLoading && !isError && data.length > 0 ? (
        <div className="users-registration-list">
          {data.map((request) => (
            <article key={request.id} className="users-registration-card">
              <div className="users-registration-card__main">
                <span className={`users-request-status users-request-status--${request.status.toLowerCase()}`}>
                  {statusLabels[request.status]}
                </span>
                <h2>{getFullName(request)}</h2>
                <p>{request.email}</p>
                <dl>
                  <div>
                    <dt>Фамилия</dt>
                    <dd>{request.lastName || '—'}</dd>
                  </div>
                  <div>
                    <dt>Имя</dt>
                    <dd>{request.firstName || '—'}</dd>
                  </div>
                  <div>
                    <dt>Отчество</dt>
                    <dd>{request.secondName || '—'}</dd>
                  </div>
                  <div>
                    <dt>Имя в системе</dt>
                    <dd>{request.displayName || '—'}</dd>
                  </div>
                </dl>
              </div>

              <div className="users-registration-card__meta">
                <span>Создана: {formatDate(request.createdAt)}</span>
                {request.processedAt ? <span>Обработана: {formatDate(request.processedAt)}</span> : null}
                {request.rejectReason ? <span>Причина отказа: {request.rejectReason}</span> : null}
              </div>

              <div className="users-registration-card__actions">
                {request.status === 'PENDING' ? (
                  <>
                    <Button size="sm" variant="primary" onClick={() => handleApprove(request)} loading={approving}>
                      Подтвердить
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setRejectTarget(request)} disabled={rejecting}>
                      Отклонить
                    </Button>
                  </>
                ) : (
                  <span className="users-registration-card__done">Действий нет</span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <Modal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        maxWidth={520}
        title={<h2 className="users-request-modal-title">Отклонить заявку?</h2>}
        footer={
          <div className="users-request-modal-actions">
            <Button onClick={() => setRejectTarget(null)} disabled={rejecting}>Отмена</Button>
            <Button variant="danger" onClick={handleReject} loading={rejecting}>Отклонить</Button>
          </div>
        }
      >
        <label className="users-request-reject-form">
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
