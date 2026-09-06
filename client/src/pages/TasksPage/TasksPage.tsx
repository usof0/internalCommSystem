import React, { useState } from 'react';
import {
  useGetMyTasksQuery,
  useGetCreatedTasksQuery,
  useCreateTaskMutation,
} from '../../api/tasksApi';
import { TaskCard } from '../../features/tasks/TaskCard';
import { SkeletonList } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import { Can } from '../../components/Can';
import { Modal } from '../../components/ui/Modal';
import { usePermission } from '../../hooks/usePermission';
import type { CreateTaskRequest } from '../../types';

type View = 'mine' | 'created';

const emptyForm = (): CreateTaskRequest => ({ title: '', description: '', dueDate: null });

const TasksEmptyIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M9 5h6M9 9h6M9 13h3"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <path
      d="M7 3h10a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2-2-1.35V5a2 2 0 0 1 2-2Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

export const TasksPage: React.FC = () => {
  const [view, setView] = useState<View>('mine');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<CreateTaskRequest>(emptyForm());
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const canCreateTask = usePermission('task.create');

  const {
    data: myTasks,
    isLoading: myLoading,
    error: myError,
    refetch: myRefetch,
  } = useGetMyTasksQuery();

  const {
    data: createdTasks,
    isLoading: createdLoading,
    error: createdError,
    refetch: createdRefetch,
  } = useGetCreatedTasksQuery();

  const [createTask, { isLoading: creating }] = useCreateTaskMutation();

  const tasks = view === 'mine' ? myTasks : createdTasks;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredTasks = normalizedSearch
    ? tasks?.filter((task) => {
        const haystack = `${task.title} ${task.description} ${task.creator.email}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      })
    : tasks;
  const isLoading = view === 'mine' ? myLoading : createdLoading;
  const error = view === 'mine' ? myError : createdError;
  const refetch = view === 'mine' ? myRefetch : createdRefetch;

  const openCreate = () => {
    setForm(emptyForm());
    setFormError('');
    setShowCreateModal(true);
  };

  const closeCreate = () => {
    setShowCreateModal(false);
    setForm(emptyForm());
    setFormError('');
  };

  const handleCreate = async () => {
    if (!form.title.trim()) {
      setFormError('Введите название задачи');
      return;
    }
    if (!form.description.trim()) {
      setFormError('Введите описание задачи');
      return;
    }
    setFormError('');
    try {
      await createTask({
        title: form.title.trim(),
        description: form.description.trim(),
        dueDate: form.dueDate || null,
      }).unwrap();
      closeCreate();
      if (view !== 'created') setView('created');
    } catch {
      setFormError('Не удалось создать задачу');
    }
  };

  return (
    <div className="tasks-page">
      <div className="tasks-hero">
        <div className="tasks-hero__copy">
          <span className="tasks-hero__eyebrow">Рабочий центр</span>
          <h1>Задачи</h1>
        </div>
        <Can permission="task.create">
          <button onClick={openCreate} className="btn btn-primary tasks-create-btn">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M12 5v14M5 12h14"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            <span>Создать задачу</span>
          </button>
        </Can>
      </div>

      <div className="tasks-toolbar">
        <div className="tasks-tabs" role="tablist" aria-label="Фильтр задач">
          <button
            className={`tasks-tab${view === 'mine' ? ' tasks-tab--active' : ''}`}
            onClick={() => setView('mine')}
            role="tab"
            aria-selected={view === 'mine'}
          >
            <span>Мои задачи</span>
            <span className="tasks-tab__count">{myTasks?.length ?? 0}</span>
          </button>
          <button
            className={`tasks-tab${view === 'created' ? ' tasks-tab--active' : ''}`}
            onClick={() => setView('created')}
            role="tab"
            aria-selected={view === 'created'}
          >
            <span>Созданные мной</span>
            <span className="tasks-tab__count">{createdTasks?.length ?? 0}</span>
          </button>
        </div>

        <label className="tasks-search">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle
              cx="11"
              cy="11"
              r="7"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
            <path
              d="m20 20-3.5-3.5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по задачам"
            aria-label="Поиск по задачам"
          />
        </label>
      </div>

      <div className="tasks-list">
        {isLoading && <SkeletonList />}
        {error && <ErrorBanner onRetry={refetch} />}
        {!isLoading && !error && (!filteredTasks || filteredTasks.length === 0) && (
          <EmptyState
            message={
              search.trim()
                ? 'Задачи по этому запросу не найдены'
                : view === 'mine'
                  ? 'Вам не назначено задач'
                  : 'Вы ещё не создали задач'
            }
            icon={<TasksEmptyIcon />}
            action={
              canCreateTask && !search.trim() && view === 'created'
                ? { label: '+ Создать задачу', onClick: openCreate }
                : undefined
            }
          />
        )}
        {filteredTasks &&
          filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} mode={view === 'mine' ? 'mine' : 'created'} />
          ))}
      </div>

      <Modal
        open={showCreateModal}
        title={<h2 className="task-modal-title">Новая задача</h2>}
        onClose={closeCreate}
        maxWidth={560}
        footer={
          <div className="task-modal-actions">
            <button onClick={closeCreate} className="btn">
              Отмена
            </button>
            <button onClick={handleCreate} disabled={creating} className="btn btn-primary">
              {creating ? 'Создание...' : 'Создать задачу'}
            </button>
          </div>
        }
      >
        <div className="task-create-form">
          {formError && <div className="error-message">{formError}</div>}
          <div className="form-group">
            <label className="form-label">Название *</label>
            <input
              type="text"
              className="form-input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Название задачи"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Описание *</label>
            <textarea
              className="form-input"
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Описание задачи"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Срок выполнения</label>
            <input
              type="date"
              className="form-input"
              value={form.dueDate ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value || null }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
