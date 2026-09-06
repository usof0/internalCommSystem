import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { Loading } from '../../components/Loading';
import { ErrorBanner } from '../../components/ErrorBanner';
import { BackButton } from '../../components/ui/BackButton';
import { usePermission } from '../../hooks/usePermission';
import type { TaskWorkStatus, TaskReviewStatus } from '../../types';
import {
  useAssignTaskParticipants,
  useRemoveTaskParticipant,
  useReviewTaskParticipant,
  useTaskAssignableUsers,
  useTaskDetailsData,
  useUpdateTask,
  useUpdateTaskWorkStatus,
} from './TaskDetailsPage.api';
import type { RatingInputs, TaskDetailsPageParams } from './TaskDetailsPage.types';
import { displayTaskUser } from '../../features/tasks/utils/taskFormatters';
import { TaskOverview } from './features/TaskOverview/TaskOverview';
import { TaskMyStatus } from './features/TaskMyStatus/TaskMyStatus';
import { TaskParticipants } from './features/TaskParticipants/TaskParticipants';

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

const nextDayInputValue = (date?: string | null) => {
  const base = date ? new Date(date) : new Date();
  base.setDate(base.getDate() + 1);
  return toDateInputValue(base);
};

export const TaskDetailsPage: React.FC = () => {
  const { taskId } = useParams<TaskDetailsPageParams>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const hasParticipantsViewPermission = usePermission('task.participants.view');

  const { data: task, isLoading, error, refetch } = useTaskDetailsData(taskId);
  const [updateWorkStatus, { isLoading: updatingWork }] = useUpdateTaskWorkStatus();
  const [updateTask, { isLoading: updatingTask }] = useUpdateTask();
  const [reviewParticipant, { isLoading: reviewing }] = useReviewTaskParticipant();
  const [assignParticipants, { isLoading: assigning }] = useAssignTaskParticipants();
  const [removeParticipant] = useRemoveTaskParticipant();

  const [showAssignForm, setShowAssignForm] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedOrgUnitIds, setSelectedOrgUnitIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [includeSubUnits, setIncludeSubUnits] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [dueDateDraft, setDueDateDraft] = useState('');
  const [dueDateError, setDueDateError] = useState('');
  const [ratingInputs, setRatingInputs] = useState<RatingInputs>({});

  const { data: usersResult } = useTaskAssignableUsers(showAssignForm, userSearch);

  if (isLoading) return <Loading />;
  if (error) return <ErrorBanner onRetry={refetch} />;
  if (!task) return null;

  const isCreator = task.creatorId === user?.id;
  const canViewParticipants = isCreator || !!task.canViewParticipants || hasParticipantsViewPermission;
  const myParticipation = task.participants.find((p) => p.userId === user?.id);
  const existingParticipantIds = new Set(task.participants.map((p) => p.userId));
  const minExtendDate = nextDayInputValue(task.dueDate);

  const handleWorkStatus = async (workStatus: TaskWorkStatus) => {
    if (!user) return;
    try {
      await updateWorkStatus({ taskId: taskId!, userId: user.id, body: { workStatus } }).unwrap();
    } catch {
      // RTK Query surfaces errors via the mutation result
    }
  };

  const handleReview = async (participantUserId: string, reviewStatus: TaskReviewStatus) => {
    const ratingStr = ratingInputs[participantUserId];
    const parsed = ratingStr ? parseInt(ratingStr, 10) : NaN;
    const rating = !isNaN(parsed) && parsed >= 1 && parsed <= 10 ? parsed : null;
    try {
      await reviewParticipant({
        taskId: taskId!,
        userId: participantUserId,
        body: { reviewStatus, rating },
      }).unwrap();
      setRatingInputs((prev) => {
        const next = { ...prev };
        delete next[participantUserId];
        return next;
      });
    } catch {
      // error handled by RTK
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleAssign = async () => {
    if (selectedUserIds.length === 0 && selectedOrgUnitIds.length === 0 && selectedTagIds.length === 0) {
      setAssignError('Выберите пользователей, подразделения или теги подразделений');
      return;
    }
    setAssignError('');
    try {
      await assignParticipants({
        taskId: taskId!,
        body: {
          userIds: selectedUserIds,
          orgUnitIds: selectedOrgUnitIds,
          orgUnitTagIds: selectedTagIds,
          includeSubUnits,
        },
      }).unwrap();
      setSelectedUserIds([]);
      setSelectedOrgUnitIds([]);
      setSelectedTagIds([]);
      setIncludeSubUnits(false);
      setUserSearch('');
      setShowAssignForm(false);
    } catch {
      setAssignError('Не удалось добавить участников');
    }
  };

  const handleExtendDueDate = async () => {
    if (!dueDateDraft) {
      setDueDateError('Выберите новый срок');
      return;
    }
    if (dueDateDraft < minExtendDate) {
      setDueDateError('Новый срок должен быть позже текущего срока');
      return;
    }
    setDueDateError('');
    try {
      await updateTask({ taskId: taskId!, body: { dueDate: dueDateDraft } }).unwrap();
      setDueDateDraft('');
    } catch {
      setDueDateError('Не удалось изменить срок');
    }
  };

  const cancelAssign = () => {
    setShowAssignForm(false);
    setSelectedUserIds([]);
    setSelectedOrgUnitIds([]);
    setSelectedTagIds([]);
    setIncludeSubUnits(false);
    setUserSearch('');
    setAssignError('');
  };

  const availableUsers = usersResult?.items.filter((u) => !existingParticipantIds.has(u.id)) ?? [];

  return (
    <div className="task-details-page">
      <div className="task-details-header">
        <BackButton onClick={() => navigate('/tasks')} label="К задачам" compact />
        <div className="task-details-header__content">
          <span className="task-details-header__eyebrow">Детали задачи</span>
          <h1>{task.title}</h1>
          <div className="task-details-header__meta">
            <span>{displayTaskUser(task.creator)}</span>
            <span>{formatDate(task.createdAt)}</span>
            {task.dueDate ? <span>Срок: {formatDate(task.dueDate)}</span> : null}
            {canViewParticipants ? <span>{task.participants.length} участников</span> : null}
          </div>
        </div>
      </div>

      <TaskOverview task={task} />

      {isCreator ? (
        <div className="task-deadline-panel">
          <div>
            <span className="task-section-kicker">Срок выполнения</span>
            <h3>Продлить срок</h3>
            <p>Создатель может изменить срок, в том числе после просрочки или поздней сдачи.</p>
          </div>
          <div className="task-deadline-panel__controls">
            <input
              type="date"
              className="form-input"
              value={dueDateDraft}
              min={minExtendDate}
              onChange={(event) => setDueDateDraft(event.target.value)}
              aria-label="Новый срок выполнения"
            />
            <button
              onClick={handleExtendDueDate}
              disabled={updatingTask}
              className="btn btn-primary"
            >
              {updatingTask ? 'Сохранение...' : 'Сохранить срок'}
            </button>
          </div>
          {dueDateError ? <p className="task-form-error">{dueDateError}</p> : null}
        </div>
      ) : null}

      {myParticipation && !isCreator && (
        <TaskMyStatus
          participation={myParticipation}
          isUpdating={updatingWork}
          onChangeWorkStatus={handleWorkStatus}
        />
      )}

      {canViewParticipants ? (
        <TaskParticipants
          task={task}
          currentUserId={user?.id}
          isCreator={isCreator}
          isAssigningOpen={showAssignForm}
          userSearch={userSearch}
          selectedUserIds={selectedUserIds}
          selectedOrgUnitIds={selectedOrgUnitIds}
          selectedTagIds={selectedTagIds}
          includeSubUnits={includeSubUnits}
          assignError={assignError}
          availableUsers={availableUsers}
          isAssigning={assigning}
          isReviewing={reviewing}
          ratingInputs={ratingInputs}
          onToggleAssigning={() => (showAssignForm ? cancelAssign() : setShowAssignForm(true))}
          onChangeSearch={setUserSearch}
          onToggleUserSelection={toggleUserSelection}
          onChangeOrgUnitSelection={setSelectedOrgUnitIds}
          onChangeTagSelection={setSelectedTagIds}
          onChangeIncludeSubUnits={setIncludeSubUnits}
          onAssign={handleAssign}
          onCancelAssign={cancelAssign}
          onReview={handleReview}
          onChangeRating={(participantUserId, value) =>
            setRatingInputs((prev) => ({
              ...prev,
              [participantUserId]: value,
            }))
          }
          onRemove={(participantUserId) => {
            void removeParticipant({ taskId: taskId!, userId: participantUserId });
          }}
        />
      ) : null}
    </div>
  );
};
