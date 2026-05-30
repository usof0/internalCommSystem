import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { TaskSummary } from '../../types';
import {
  taskWorkStatusLabel,
  taskReviewStatusLabel,
  taskWorkStatusClass,
  taskReviewStatusClass,
  displayTaskUser,
} from './utils/taskFormatters';

interface TaskCardProps {
  task: TaskSummary;
  mode: 'mine' | 'created';
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const dueTone = (date?: string | null) => {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(date);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 3) return 'soon';
  return 'normal';
};

const dueLabel = (tone: ReturnType<typeof dueTone>) => {
  if (tone === 'overdue') return 'Просрочено';
  if (tone === 'soon') return 'Скоро';
  return 'Срок';
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, mode }) => {
  const navigate = useNavigate();

  const creatorName = displayTaskUser(task.creator);
  const tone = dueTone(task.dueDate);
  const description =
    task.description.length > 150
      ? task.description.slice(0, 150) + '…'
      : task.description;

  return (
    <button className="task-card" onClick={() => navigate(`/tasks/${task.id}`)}>
      <div className="task-card__top">
        <div className="task-card__title-group">
          <h3 className="task-title">{task.title}</h3>
          <p className="task-description">{description}</p>
        </div>
        {task.dueDate ? (
          <span className={`task-due-pill task-due-pill--${tone}`}>
            <span>{dueLabel(tone)}</span>
            <strong>{formatDate(task.dueDate)}</strong>
          </span>
        ) : null}
      </div>

      <div className="task-meta">
        <div className="task-meta-item">
          <span className="label">Создатель:</span>
          <span>{creatorName}</span>
        </div>
        <div className="task-meta-item">
          <span className="label">Создано:</span>
          <span>{formatDate(task.createdAt)}</span>
        </div>
        <div className="task-meta-item">
          <span className="label">Участников:</span>
          <span>{task.participantCount}</span>
        </div>
      </div>

      {mode === 'mine' && task.myParticipation && (
        <div className="task-statuses">
          {task.myParticipation.isLate ? (
            <span className="status-badge status-red">
              <span className="status-badge__label">Сдача</span>
              Поздно
            </span>
          ) : null}
          <span
            className={`status-badge ${taskWorkStatusClass(task.myParticipation.workStatus)}`}
          >
            <span className="status-badge__label">Работа</span>
            {taskWorkStatusLabel(task.myParticipation.workStatus)}
          </span>
          <span
            className={`status-badge ${taskReviewStatusClass(task.myParticipation.reviewStatus)}`}
          >
            <span className="status-badge__label">Проверка</span>
            {taskReviewStatusLabel(task.myParticipation.reviewStatus)}
          </span>
        </div>
      )}
    </button>
  );
};
