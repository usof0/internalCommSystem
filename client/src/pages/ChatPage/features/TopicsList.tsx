import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setChatInfoPanelOpen, setSelectedTopic } from '../../../app/slices/uiSlice';
import type { RootState } from '../../../app/store';
import {
  useGetRoomMembersQuery,
  useGetTopicsQuery,
  useCreateTopicMutation,
  useSetTopicVisibilityMutation,
} from '../../../api/chatApi';
import { SkeletonList } from '../../../components/Loading';
import { EmptyState } from '../../../components/EmptyState';
import { ErrorBanner } from '../../../components/ErrorBanner';
import { VisibilityScopeEditor } from './VisibilityScopeEditor';
import type { Topic, SetTopicVisibilityRequest } from '../../../types';

const DEFAULT_VISIBILITY: SetTopicVisibilityRequest = { scopeType: 'ALL_MEMBERS' };

/** Ensure the scope is valid before sending to the backend. */
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

export const TopicsList: React.FC = () => {
  const dispatch = useDispatch();
  const selectedRoomId = useSelector((state: RootState) => state.ui.selectedRoomId);
  const selectedTopicId = useSelector((state: RootState) => state.ui.selectedTopicId);
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);

  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<SetTopicVisibilityRequest>(DEFAULT_VISIBILITY);
  const [showVisibility, setShowVisibility] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: topics, isLoading, error, refetch } = useGetTopicsQuery(selectedRoomId!, {
    skip: !selectedRoomId,
  });
  const { data: members } = useGetRoomMembersQuery(selectedRoomId!, {
    skip: !selectedRoomId,
  });
  const [createTopic, { isLoading: isCreatingTopic }] = useCreateTopicMutation();
  const [setTopicVisibility] = useSetTopicVisibilityMutation();

  const currentRoomRole = members
    ?.find((member) => member.userId === currentUserId)
    ?.roomRole.name.toLowerCase();
  const canManageTopics =
    currentRoomRole === 'owner' ||
    currentRoomRole === 'admin';

  const handleCreateTopic = async () => {
    if (!selectedRoomId || !title.trim()) return;
    setCreateError(null);

    // Validate scope has required selections
    const scopeError = validateScope(visibility);
    if (scopeError) {
      setCreateError(scopeError);
      return;
    }

    // For INCLUDE_MEMBERS: always ensure the creator can see their own topic
    let finalScope = visibility;
    if (
      visibility.scopeType === 'INCLUDE_MEMBERS' &&
      currentUserId &&
      !(visibility.memberIds ?? []).includes(currentUserId)
    ) {
      finalScope = { ...visibility, memberIds: [...(visibility.memberIds ?? []), currentUserId] };
    }

    // Warn if creator excluded themselves (EXCLUDE_MEMBERS)
    if (
      visibility.scopeType === 'EXCLUDE_MEMBERS' &&
      currentUserId &&
      (visibility.memberIds ?? []).includes(currentUserId)
    ) {
      setCreateError('Вы не можете исключить себя из видимости темы, которую создаёте');
      return;
    }

    try {
      const newTopic = await createTopic({
        roomId: selectedRoomId,
        title: title.trim(),
        description: description.trim() || undefined,
      }).unwrap();

      // Always explicitly set the visibility scope via the dedicated endpoint.
      // The create-topic endpoint only creates the topic record; visibility
      // is managed separately through PUT .../visibility.
      await setTopicVisibility({
        roomId: selectedRoomId,
        topicId: newTopic.id,
        body: finalScope,
      }).unwrap();

      setTitle('');
      setDescription('');
      setVisibility(DEFAULT_VISIBILITY);
      setShowVisibility(false);
      setIsCreating(false);
    } catch {
      setCreateError('Не удалось создать тему');
    }
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    setVisibility(DEFAULT_VISIBILITY);
    setShowVisibility(false);
    setCreateError(null);
    setIsCreating(false);
  };

  const handleOpenTopicSettings = (topicId: string) => {
    dispatch(setSelectedTopic(topicId));
    dispatch(setChatInfoPanelOpen(true));
  };

  if (!selectedRoomId) return null;
  if (isLoading) return <SkeletonList count={5} />;
  if (error) return <ErrorBanner onRetry={refetch} />;

  return (
    <div className="topics-list">
      <div className="topics-header">
        <h3 className="topics-title">Темы</h3>
        {canManageTopics ? (
          <button
            onClick={() => setIsCreating((v) => !v)}
            className="btn btn-sm"
            title={isCreating ? 'Отмена' : 'Новая тема'}
          >
            {isCreating ? '✕' : '+'}
          </button>
        ) : null}
      </div>

      {isCreating && (
        <div className="topic-create-form">
          <input
            type="text"
            placeholder="Название темы"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            autoFocus
          />
          <textarea
            placeholder="Описание (необязательно)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="textarea"
            rows={2}
          />

          {/* Visibility toggle */}
          <button
            type="button"
            className="topic-visibility-toggle"
            onClick={() => setShowVisibility((v) => !v)}
          >
            {showVisibility ? '▾' : '▸'}{' '}
            Видимость:{' '}
            <span className="topic-visibility-toggle__value">
              {visibility.scopeType === 'ALL_MEMBERS' && 'Все участники'}
              {visibility.scopeType === 'INCLUDE_MEMBERS' && 'Только выбранные'}
              {visibility.scopeType === 'EXCLUDE_MEMBERS' && 'Все, кроме'}
              {visibility.scopeType === 'ORG_UNIT' && 'По подразделению'}
              {visibility.scopeType === 'ORG_UNIT_TAG' && 'По тегу подразделения'}
            </span>
          </button>

          {showVisibility && (
            <VisibilityScopeEditor value={visibility} onChange={setVisibility} />
          )}

          {createError && <p className="topic-create-error">{createError}</p>}

          <div className="topic-create-actions">
            <button
              onClick={handleCancel}
              className="btn btn-sm"
              disabled={isCreatingTopic}
            >
              Отмена
            </button>
            <button
              onClick={handleCreateTopic}
              className="btn btn-primary btn-sm"
              disabled={isCreatingTopic || !title.trim()}
            >
              {isCreatingTopic ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </div>
      )}

      {!topics || topics.length === 0 ? (
        <EmptyState message="Нет тем" icon="📂" />
      ) : (
        topics.map((topic: Topic) => (
          <div
            key={topic.id}
            className={`topic-item${selectedTopicId === topic.id ? ' topic-item--active' : ''}`}
            onClick={() => dispatch(setSelectedTopic(topic.id))}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && dispatch(setSelectedTopic(topic.id))}
          >
            <span className="topic-item__hash">#</span>
            <div className="topic-item__body">
              <span className="topic-item__title">{topic.title}</span>
              {topic.description && (
                <span className="topic-item__desc">{topic.description}</span>
              )}
            </div>
            {!topic.isPublic && (
              <span className="topic-item__lock" title="Ограниченная видимость">🔒</span>
            )}
            {(topic.unreadCount ?? 0) > 0 ? (
              <span className="topic-item__unread">{topic.unreadCount}</span>
            ) : null}
            <button
              className="topic-item__settings"
              title="Настройки темы"
              aria-label={`Настройки темы ${topic.title}`}
              onClick={(event) => {
                event.stopPropagation();
                handleOpenTopicSettings(topic.id);
              }}
            >
              ⋯
            </button>
          </div>
        ))
      )}
    </div>
  );
};
