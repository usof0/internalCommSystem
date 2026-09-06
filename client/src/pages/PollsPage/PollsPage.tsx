import React, { useState } from 'react';
import {
  useGetMyPollsQuery,
  useGetCreatedPollsQuery,
  useCreatePollMutation,
} from '../../api/pollsApi';
import { PollCard } from './features/PollCard';
import { SkeletonList } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import { Modal } from '../../components/ui/Modal';
import { Can } from '../../components';
import { usePermission } from '../../hooks/usePermission';
import './PollsPage.css';

type View = 'mine' | 'created';

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 8;

const ChartIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="poll-icon">
    <path d="M4 19V5" />
    <path d="M4 19h16" />
    <path d="M8 16v-5" />
    <path d="M12 16V8" />
    <path d="M16 16v-7" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="poll-icon">
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="poll-icon">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export const PollsPage: React.FC = () => {
  const [view, setView] = useState<View>('mine');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [allowVoteChange, setAllowVoteChange] = useState(true);
  const [formError, setFormError] = useState('');
  const canCreatePoll = usePermission('poll.create');

  const {
    data: myPolls,
    isLoading: myLoading,
    error: myError,
    refetch: myRefetch,
  } = useGetMyPollsQuery();

  const {
    data: createdPolls,
    isLoading: createdLoading,
    error: createdError,
    refetch: createdRefetch,
  } = useGetCreatedPollsQuery();

  const [createPoll, { isLoading: creating }] = useCreatePollMutation();

  const polls = view === 'mine' ? myPolls : createdPolls;
  const myCount = myPolls?.length ?? 0;
  const createdCount = createdPolls?.length ?? 0;
  const isLoading = view === 'mine' ? myLoading : createdLoading;
  const error = view === 'mine' ? myError : createdError;
  const refetch = view === 'mine' ? myRefetch : createdRefetch;

  const openCreate = () => {
    setTitle('');
    setDescription('');
    setOptions(['', '']);
    setAllowVoteChange(true);
    setFormError('');
    setShowCreateModal(true);
  };

  const closeCreate = () => setShowCreateModal(false);

  const handleOptionChange = (idx: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === idx ? value : o)));
  };

  const addOption = () => {
    if (options.length < MAX_OPTIONS) setOptions((prev) => [...prev, '']);
  };

  const removeOption = (idx: number) => {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setFormError('Введите название опроса');
      return;
    }
    const filled = options.map((o) => o.trim()).filter(Boolean);
    if (filled.length < MIN_OPTIONS) {
      setFormError(`Добавьте минимум ${MIN_OPTIONS} варианта ответа`);
      return;
    }
    try {
      await createPoll({
        title: title.trim(),
        description: description.trim() || undefined,
        options: filled,
        allowVoteChange,
      }).unwrap();
      closeCreate();
    } catch {
      setFormError('Не удалось создать опрос');
    }
  };

  return (
    <div className="polls-page">
      <div className="polls-hero">
        <div className="polls-hero__content">
          <span className="polls-hero__eyebrow">
            <ChartIcon />
            Голосования и результаты
          </span>
          <h1>Опросы</h1>
        </div>
        <Can permission="poll.create">
          <button onClick={openCreate} className="btn btn-primary polls-hero__action">
            <PlusIcon />
            Создать опрос
          </button>
        </Can>
      </div>

      <div className="polls-tabs" role="tablist" aria-label="Фильтр опросов">
        <button
          className={`polls-tab ${view === 'mine' ? 'active' : ''}`}
          onClick={() => setView('mine')}
          role="tab"
          aria-selected={view === 'mine'}
        >
          <span>Мои опросы</span>
          <span className="polls-tab__count">{myCount}</span>
        </button>
        <button
          className={`polls-tab ${view === 'created' ? 'active' : ''}`}
          onClick={() => setView('created')}
          role="tab"
          aria-selected={view === 'created'}
        >
          <span>Созданные мной</span>
          <span className="polls-tab__count">{createdCount}</span>
        </button>
      </div>

      <div className="polls-list">
        {isLoading && <SkeletonList />}
        {error && <ErrorBanner onRetry={refetch} />}
        {!isLoading && !error && (!polls || polls.length === 0) && (
          <EmptyState
            message={view === 'mine' ? 'Нет доступных опросов' : 'Вы еще не создавали опросы'}
            icon={<ChartIcon />}
            action={
              canCreatePoll && view === 'created'
                ? {
                    label: 'Создать опрос',
                    onClick: openCreate,
                  }
                : undefined
            }
          />
        )}
        {polls &&
          polls.map((poll) => (
            <PollCard key={poll.id} poll={poll} mode={view} />
          ))}
      </div>

      <Modal
        open={showCreateModal}
        onClose={closeCreate}
        title={<div className="poll-modal-title"><ChartIcon />Создать опрос</div>}
        footer={
          <div className="poll-modal-actions">
            <button className="btn btn-secondary" onClick={closeCreate}>
              Отмена
            </button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
              {!creating ? <PlusIcon /> : null}
              {creating ? 'Создание…' : 'Создать'}
            </button>
          </div>
        }
      >
        <div className="poll-create-form">
          <div className="form-group">
            <label className="form-label">Название *</label>
            <input
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Тема опроса"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Описание</label>
            <textarea
              className="form-control"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Дополнительное описание (необязательно)"
            />
          </div>

          <div className="form-group">
            <div className="poll-form-label-row">
              <label className="form-label">Варианты ответа *</label>
              <span>{options.length} / {MAX_OPTIONS}</span>
            </div>
            <div className="poll-options-builder">
              {options.map((opt, idx) => (
                <div key={idx} className="poll-options-builder__row">
                  <span className="poll-options-builder__index">{idx + 1}</span>
                  <input
                    className="form-control"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Вариант ${idx + 1}`}
                  />
                  {options.length > MIN_OPTIONS && (
                    <button
                      type="button"
                      className="poll-icon-button poll-options-builder__remove"
                      onClick={() => removeOption(idx)}
                      aria-label="Удалить вариант"
                    >
                      <XIcon />
                    </button>
                  )}
                </div>
              ))}
              {options.length < MAX_OPTIONS && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm poll-add-option"
                  onClick={addOption}
                >
                  <PlusIcon />
                  Добавить вариант
                </button>
              )}
            </div>
          </div>

          <label className="poll-setting-toggle">
            <input
              type="checkbox"
              checked={allowVoteChange}
              onChange={(event) => setAllowVoteChange(event.target.checked)}
            />
            <span className="poll-setting-toggle__control" aria-hidden="true" />
            <span className="poll-setting-toggle__text">
              <strong>Разрешить изменение голоса</strong>
              <small>
                Если выключено, участник не сможет изменить или отозвать ответ после голосования.
              </small>
            </span>
          </label>

          {formError && <p className="form-error">{formError}</p>}
        </div>
      </Modal>
    </div>
  );
};
