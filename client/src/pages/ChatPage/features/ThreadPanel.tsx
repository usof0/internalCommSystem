import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedThreadMessage } from '../../../app/slices/uiSlice';
import type { RootState } from '../../../app/store';
import { useGetThreadQuery, useGetMessageByIdQuery } from '../../../api/chatApi';
import { MessageInput } from './MessageInput';
import { SkeletonList } from '../../../components/Loading';
import { ErrorBanner } from '../../../components/ErrorBanner';
import { EmptyState } from '../../../components/EmptyState';
import { Avatar } from '../../../components/ui/Avatar';
import type { Message } from '../../../types';
import {
  displayName,
  formatMessageDateDivider,
  formatMessageTime,
  shouldShowMessageDateDivider,
} from './utils/chatFormatters';

export const ThreadPanel: React.FC = () => {
  const dispatch = useDispatch();
  const selectedThreadMessageId = useSelector(
    (state: RootState) => state.ui.selectedThreadMessageId
  );
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);

  const { data: parent } = useGetMessageByIdQuery(
    selectedThreadMessageId!,
    { skip: !selectedThreadMessageId }
  );

  const { data: replies, isLoading, error, refetch } = useGetThreadQuery(
    selectedThreadMessageId!,
    { skip: !selectedThreadMessageId }
  );

  if (!selectedThreadMessageId) return null;

  return (
    <div className="thread-panel">
      <div className="thread-panel__header">
        <h3 className="thread-panel__title">Ответы</h3>
        <button
          onClick={() => dispatch(setSelectedThreadMessage(null))}
          className="btn btn-sm"
          title="Закрыть ветку"
        >
          ✕
        </button>
      </div>

      {parent && (
        <div className="thread-panel__parent">
          <Avatar
            src={parent.author.avatarUrl}
            name={displayName(parent.author)}
            email={parent.author.email}
            size={28}
            className="thread-panel__parent-avatar"
          />
          <div className="thread-panel__parent-body">
            <span className="thread-panel__parent-author">{displayName(parent.author)}</span>
            <p className="thread-panel__parent-text">{parent.content}</p>
            <span className="thread-panel__parent-time">{formatMessageTime(parent.createdAt)}</span>
          </div>
        </div>
      )}

      <div className="thread-panel__messages">
        {isLoading && <SkeletonList count={3} />}
        {error && <ErrorBanner onRetry={refetch} />}
        {!isLoading && !error && (!replies || replies.length === 0) && (
          <EmptyState message="Нет ответов" icon="↩" />
        )}
        {replies?.map((message: Message, index) => {
          const isOwn = message.author.id === currentUserId;
          const authorDisplayName = displayName(message.author);
          const showDateDivider = shouldShowMessageDateDivider(
            message.createdAt,
            replies[index - 1]?.createdAt,
          );

          return (
            <React.Fragment key={message.id}>
              {showDateDivider ? (
                <div className="message-date-divider message-date-divider--thread">
                  <span>{formatMessageDateDivider(message.createdAt)}</span>
                </div>
              ) : null}
              <div
                className={[
                  'thread-message',
                  isOwn ? 'thread-message--own' : 'thread-message--other',
                ].join(' ')}
              >
                {!isOwn && (
                  <Avatar
                    src={message.author.avatarUrl}
                    name={authorDisplayName}
                    email={message.author.email}
                    size={28}
                    className="thread-message__avatar"
                  />
                )}
                <div className="thread-message__bubble">
                  {!isOwn && (
                    <span className="thread-message__author">{authorDisplayName}</span>
                  )}
                  <div className="thread-message__text">{message.content}</div>
                  <div className="thread-message__footer">
                    <span className="thread-message__time">{formatMessageTime(message.createdAt)}</span>
                    {isOwn && (
                      <span
                        className={`message__receipt${message.readByCount ? ' message__receipt--read' : ''}`}
                        title={message.readByCount ? 'Прочитано' : 'Отправлено'}
                      >
                        <span>✓</span>
                        <span className="message__receipt-second">✓</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className="thread-panel__input">
        <MessageInput parentId={selectedThreadMessageId} />
      </div>
    </div>
  );
};
