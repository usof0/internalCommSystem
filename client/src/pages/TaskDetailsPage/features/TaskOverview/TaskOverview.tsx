import React from 'react';

import type { Task } from '../../../../types';
import { displayTaskUser } from '../../../../features/tasks/utils/taskFormatters';

import type { TaskOverviewProps } from './TaskOverview.types';

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const renderDueDate = (task: Task) =>
  task.dueDate ? (
    <div className="task-meta-item">
      <span className="label">Срок:</span>
      <span>{formatDate(task.dueDate)}</span>
    </div>
  ) : null;

export const TaskOverview: React.FC<TaskOverviewProps> = ({ task }) => {
  return (
    <div className="task-overview">
      <div className="task-overview-section">
        <h3>Описание</h3>
        <p className="task-overview-description">{task.description}</p>
      </div>
      <div className="task-overview-section">
        <h3>Информация</h3>
        <div className="task-meta">
          <div className="task-meta-item">
            <span className="label">Создатель:</span>
            <span>{displayTaskUser(task.creator)}</span>
          </div>
          <div className="task-meta-item">
            <span className="label">Создано:</span>
            <span>{formatDate(task.createdAt)}</span>
          </div>
          {renderDueDate(task)}
        </div>
      </div>
    </div>
  );
};
