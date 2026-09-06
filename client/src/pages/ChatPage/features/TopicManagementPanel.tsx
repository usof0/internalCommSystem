import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedTopic } from '../../../app/slices/uiSlice';
import type { RootState } from '../../../app/store';
import type { RootDispatch } from '../ChatPage.store';
import {
  chatApi,
  useDeleteTopicMutation,
  useGetTopicVisibilityQuery,
  useSetTopicVisibilityMutation,
  useUpdateTopicMutation,
} from '../../../api/chatApi';
import type { SetTopicVisibilityRequest, Topic } from '../../../types';
import { VisibilityScopeEditor } from './VisibilityScopeEditor';

const DEFAULT_VISIBILITY: SetTopicVisibilityRequest = { scopeType: 'ALL_MEMBERS' };

function normalizeScope(scope: SetTopicVisibilityRequest): SetTopicVisibilityRequest {
  return {
    scopeType: scope.scopeType,
    memberIds: [...(scope.memberIds ?? [])].sort(),
    orgUnitIds: [...(scope.orgUnitIds ?? [])].sort(),
    includeSubUnits: scope.includeSubUnits ?? false,
    orgUnitTagIds: [...(scope.orgUnitTagIds ?? [])].sort(),
  };
}

function scopesEqual(a: SetTopicVisibilityRequest, b: SetTopicVisibilityRequest) {
  return JSON.stringify(normalizeScope(a)) === JSON.stringify(normalizeScope(b));
}

function validateScope(scope: SetTopicVisibilityRequest): string | null {
  if (scope.scopeType === 'INCLUDE_MEMBERS' && (!scope.memberIds || scope.memberIds.length === 0)) {
    return 'Выберите хотя бы одного пользователя для видимости темы';
  }
  if (scope.scopeType === 'EXCLUDE_MEMBERS' && (!scope.memberIds || scope.memberIds.length === 0)) {
    return 'Выберите хотя бы одного пользователя, которому тема будет скрыта';
  }
  if (scope.scopeType === 'ORG_UNIT' && (!scope.orgUnitIds || scope.orgUnitIds.length === 0)) {
    return 'Выберите хотя бы одно подразделение';
  }
  if (scope.scopeType === 'ORG_UNIT_TAG' && (!scope.orgUnitTagIds || scope.orgUnitTagIds.length === 0)) {
    return 'Выберите хотя бы один тег подразделения';
  }
  return null;
}

function visibilityLabel(scope: SetTopicVisibilityRequest) {
  switch (scope.scopeType) {
    case 'INCLUDE_MEMBERS':
      return 'Только выбранные';
    case 'EXCLUDE_MEMBERS':
      return 'Все, кроме выбранных';
    case 'ORG_UNIT':
      return 'По подразделениям';
    case 'ORG_UNIT_TAG':
      return 'По тегам подразделений';
    case 'ALL_MEMBERS':
    default:
      return 'Все участники';
  }
}

type Props = {
  roomId: string;
  topic: Topic;
};

export const TopicManagementPanel: React.FC<Props> = ({ roomId, topic }) => {
  const dispatch = useDispatch<RootDispatch>();
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(topic.title);
  const [description, setDescription] = useState(topic.description ?? '');
  const [visibility, setVisibility] = useState<SetTopicVisibilityRequest>(DEFAULT_VISIBILITY);
  const [showVisibilityEditor, setShowVisibilityEditor] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: visibilityData, isLoading: visibilityLoading, error: visibilityError } = useGetTopicVisibilityQuery({
    roomId,
    topicId: topic.id,
  });
  const [updateTopic, { isLoading: isUpdatingTopic }] = useUpdateTopicMutation();
  const [setTopicVisibility, { isLoading: isSavingVisibility }] = useSetTopicVisibilityMutation();
  const [deleteTopic, { isLoading: isDeletingTopic }] = useDeleteTopicMutation();

  const isBusy = isUpdatingTopic || isSavingVisibility || isDeletingTopic;

  const visibilityValue = useMemo<SetTopicVisibilityRequest>(() => {
    if (!visibilityData) return DEFAULT_VISIBILITY;
    return {
      scopeType: visibilityData.scopeType,
      memberIds: visibilityData.memberIds ?? [],
      orgUnitIds: visibilityData.orgUnitIds ?? [],
      includeSubUnits: visibilityData.includeSubUnits ?? false,
      orgUnitTagIds: visibilityData.orgUnitTagIds ?? [],
    };
  }, [visibilityData]);

  useEffect(() => {
    setTitle(topic.title);
    setDescription(topic.description ?? '');
  }, [topic.description, topic.id, topic.title]);

  useEffect(() => {
    if (!isEditing) {
      setVisibility((current) =>
        scopesEqual(current, visibilityValue) ? current : visibilityValue,
      );
    }
  }, [isEditing, visibilityValue]);

  const handleCancel = () => {
    setTitle(topic.title);
    setDescription(topic.description ?? '');
    setVisibility(visibilityValue);
    setError(null);
    setIsEditing(false);
    setShowVisibilityEditor(false);
  };

  const handleSave = async () => {
    setError(null);
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Название темы не может быть пустым');
      return;
    }

    let finalScope = visibility;
    if (
      visibility.scopeType === 'INCLUDE_MEMBERS' &&
      currentUserId &&
      !(visibility.memberIds ?? []).includes(currentUserId)
    ) {
      finalScope = { ...visibility, memberIds: [...(visibility.memberIds ?? []), currentUserId] };
    }
    if (
      visibility.scopeType === 'EXCLUDE_MEMBERS' &&
      currentUserId &&
      (visibility.memberIds ?? []).includes(currentUserId)
    ) {
      setError('Нельзя скрыть тему от себя');
      return;
    }

    const metadataChanged =
      trimmedTitle !== topic.title ||
      description.trim() !== (topic.description ?? '');
    const visibilityChanged = !scopesEqual(finalScope, visibilityValue);

    if (visibilityChanged) {
      const scopeError = validateScope(finalScope);
      if (scopeError) {
        setError(scopeError);
        return;
      }

      if (visibilityError) {
        setError('Не удалось загрузить текущую видимость темы. Проверьте права доступа и попробуйте снова.');
        return;
      }
    }

    try {
      if (metadataChanged) {
        const updatedTopic = await updateTopic({
          roomId,
          topicId: topic.id,
          body: {
            title: trimmedTitle,
            description: description.trim(),
          },
        }).unwrap();

        dispatch(
          chatApi.util.updateQueryData('getTopics', roomId, (draft) => {
            const index = draft.findIndex((item) => item.id === topic.id);
            if (index !== -1) {
              draft[index] = { ...draft[index], ...updatedTopic };
            }
          }),
        );
      }

      if (visibilityChanged) {
        await setTopicVisibility({
          roomId,
          topicId: topic.id,
          body: finalScope,
        }).unwrap();
      }

      setIsEditing(false);
      setShowVisibilityEditor(false);
    } catch {
      setError('Не удалось сохранить настройки темы. Проверьте права управления темами/видимостью.');
    }
  };

  const handleArchiveToggle = async () => {
    setError(null);
    try {
      await updateTopic({
        roomId,
        topicId: topic.id,
        body: { archivedAt: topic.archivedAt ? null : new Date().toISOString() },
      }).unwrap();
    } catch {
      setError('Не удалось изменить архивный статус темы');
    }
  };

  const handleDelete = async () => {
    setError(null);
    try {
      await deleteTopic({ roomId, topicId: topic.id }).unwrap();
      dispatch(setSelectedTopic(null));
    } catch {
      setError('Не удалось удалить тему');
    }
  };

  return (
    <section className="chat-info-section topic-management">
      <div className="chat-info-section__heading-row">
        <h5 className="chat-info-section__heading">Тема</h5>
        {!isEditing ? (
          <button className="btn btn-sm" onClick={() => setIsEditing(true)}>
            Настроить
          </button>
        ) : null}
      </div>

      {!isEditing ? (
        <div className="topic-management__summary">
          <div className="topic-management__icon">#</div>
          <div className="topic-management__summary-body">
            <h4 className="topic-management__title">{topic.title}</h4>
            {topic.description ? (
              <p className="topic-management__desc">{topic.description}</p>
            ) : (
              <p className="topic-management__desc">Описание не задано</p>
            )}
            <div className="topic-management__meta">
              <span>{visibilityLoading ? 'Загрузка видимости...' : visibilityLabel(visibility)}</span>
              {topic.archivedAt ? <span>Архивная</span> : <span>Активная</span>}
            </div>
          </div>
        </div>
      ) : (
        <div className="topic-management__form">
          <label className="form-group">
            <span>Название</span>
            <input
              className="input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={isBusy}
            />
          </label>

          <label className="form-group">
            <span>Описание</span>
            <textarea
              className="textarea"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              disabled={isBusy}
            />
          </label>

          <button
            type="button"
            className="topic-visibility-toggle topic-management__visibility-toggle"
            onClick={() => setShowVisibilityEditor((value) => !value)}
          >
            {showVisibilityEditor ? '▾' : '▸'} Видимость:{' '}
            <span className="topic-visibility-toggle__value">{visibilityLabel(visibility)}</span>
          </button>

          {showVisibilityEditor ? (
            <VisibilityScopeEditor value={visibility} onChange={setVisibility} />
          ) : null}

          {error ? <p className="topic-create-error">{error}</p> : null}

          <div className="topic-management__actions">
            <button className="btn btn-sm" onClick={handleCancel} disabled={isBusy}>
              Отмена
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={isBusy}>
              {isBusy ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      )}

      <div className="topic-management__danger">
        <button className="btn btn-sm" onClick={handleArchiveToggle} disabled={isBusy}>
          {topic.archivedAt ? 'Вернуть из архива' : 'Архивировать'}
        </button>

        {deleteConfirm ? (
          <div className="topic-management__delete-confirm">
            <span>Удалить тему и сообщения?</span>
            <button className="btn btn-sm" onClick={() => setDeleteConfirm(false)} disabled={isBusy}>
              Нет
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={isBusy}>
              Да
            </button>
          </div>
        ) : (
          <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(true)} disabled={isBusy}>
            Удалить тему
          </button>
        )}
      </div>
    </section>
  );
};
