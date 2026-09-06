import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedThreadMessage } from '../../../app/slices/uiSlice';
import type { RootState } from '../../../app/store';
import {
  useGetMessagesQuery,
  useGetRoomByIdQuery,
  useGetRoomMembersQuery,
  usePinMessageMutation,
  useMarkTopicReadMutation,
} from '../../../api/chatApi';
import { SkeletonList } from '../../../components/Loading';
import { EmptyState } from '../../../components/EmptyState';
import { ErrorBanner } from '../../../components/ErrorBanner';
import { Avatar } from '../../../components/ui/Avatar';
import type { Message } from '../../../types';
import {
  displayName,
  formatMessageDateDivider,
  formatMessageTime,
  shouldShowMessageDateDivider,
} from './utils/chatFormatters';

export const MessagesList: React.FC = () => {
  const dispatch = useDispatch();
  const selectedRoomId = useSelector((state: RootState) => state.ui.selectedRoomId);
  const selectedTopicId = useSelector((state: RootState) => state.ui.selectedTopicId);
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  const threadUnreadCounts = useSelector((state: RootState) => state.ui.threadUnreadCounts);

  const listRef = useRef<HTMLDivElement>(null);

  // Room type is already cached by ChatPage — no extra request
  const { data: room } = useGetRoomByIdQuery(selectedRoomId!, { skip: !selectedRoomId });
  const { data: members } = useGetRoomMembersQuery(selectedRoomId!, { skip: !selectedRoomId });

  const { data: messages, isLoading, error, refetch } = useGetMessagesQuery(
    selectedTopicId!,
    { skip: !selectedTopicId }
  );
  const [pinMessage] = usePinMessageMutation();
  const [markTopicRead] = useMarkTopicReadMutation();

  // Mark the topic as read whenever the user opens it (selectedTopicId changes)
  useEffect(() => {
    if (selectedTopicId) {
      markTopicRead(selectedTopicId);
    }
  }, [selectedTopicId, markTopicRead]);

  useLayoutEffect(() => {
    const messagesList = listRef.current;
    const scrollContainer = messagesList?.parentElement;
    if (!scrollContainer) return;

    requestAnimationFrame(() => {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    });
  }, [selectedTopicId, messages]);

  const handlePinMessage = async (messageId: string, isPinned: boolean) => {
    try {
      await pinMessage({ messageId, body: { isPinned: !isPinned } }).unwrap();
    } catch {
      // silently ignore
    }
  };

  const handleReply = (messageId: string) => {
    dispatch(setSelectedThreadMessage(messageId));
  };

  const currentRoomRole = members
    ?.find((member) => member.userId === currentUserId)
    ?.roomRole.name.toLowerCase();
  const canPinMessages = currentRoomRole === 'owner' || currentRoomRole === 'admin';

  if (!selectedRoomId) {
    return <EmptyState message="Выберите комнату для начала общения" icon="💬" />;
  }

  // For GROUP rooms the user must pick a topic first; for DIRECT it's auto-selected
  if (!selectedTopicId) {
    return room?.type === 'DIRECT'
      ? <SkeletonList count={5} />           // brief moment before auto-select kicks in
      : <EmptyState message="Выберите тему для просмотра сообщений" icon="📂" />;
  }

  if (isLoading) return <SkeletonList count={10} />;
  if (error) return <ErrorBanner onRetry={refetch} />;
  if (!messages || messages.length === 0) {
    return <EmptyState message="Пока здесь пусто. Напишите первое сообщение!" icon="💬" />;
  }

  return (
    <div className="messages-list" ref={listRef}>
      {messages.map((message: Message, index) => {
        const isOwn = message.author.id === currentUserId;
        const authorDisplayName = displayName(message.author);
        const hasThread = (message.replyCount ?? 0) > 0;
        const unreadThreadCount = threadUnreadCounts[message.id] ?? 0;
        const showDateDivider = shouldShowMessageDateDivider(
          message.createdAt,
          messages[index - 1]?.createdAt,
        );

        return (
          <React.Fragment key={message.id}>
            {showDateDivider ? (
              <div className="message-date-divider">
                <span>{formatMessageDateDivider(message.createdAt)}</span>
              </div>
            ) : null}
            <div
              id={`msg-${message.id}`}
              className={[
                'message',
                isOwn ? 'message--own' : 'message--other',
                message.isPinned ? 'message--pinned' : '',
                hasThread ? 'message--has-thread' : '',
                unreadThreadCount > 0 ? 'message--thread-unread' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {!isOwn && (
                <Avatar
                  src={message.author.avatarUrl}
                  name={authorDisplayName}
                  email={message.author.email}
                  size={32}
                  className="message__avatar"
                />
              )}

              <div className="message__bubble">
                {!isOwn && (
                  <span className="message__author">{authorDisplayName}</span>
                )}
                <div className="message__text">{message.content}</div>
                <div className="message__footer">
                  {hasThread && (
                    <button
                      className={`message__thread-chip${unreadThreadCount > 0 ? ' message__thread-chip--unread' : ''}`}
                      onClick={() => handleReply(message.id)}
                      title="Открыть ответы"
                    >
                      <span className="message__thread-icon">↪</span>
                      <span>{message.replyCount}</span>
                      {unreadThreadCount > 0 ? <span className="message__thread-new">{unreadThreadCount}</span> : null}
                    </button>
                  )}
                  {message.isPinned && (
                    <span className="message__pin-indicator" title="Закреплено">📌</span>
                  )}
                  <span className="message__time">{formatMessageTime(message.createdAt)}</span>
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

              <div className="message__actions">
                <button
                  onClick={() => handleReply(message.id)}
                  className="message__action-btn"
                  title="Ответить в ветке"
                >
                  <span className="message__action-icon">↩</span>
                  <span>{message.replyCount ? `Ответы ${message.replyCount}` : 'Ответить'}</span>
                  {unreadThreadCount > 0 ? <span className="message__action-badge">{unreadThreadCount}</span> : null}
                </button>
                {canPinMessages ? (
                  <button
                    onClick={() => handlePinMessage(message.id, message.isPinned)}
                    className="message__action-btn"
                    title={message.isPinned ? 'Открепить' : 'Закрепить'}
                  >
                    <span className="message__action-icon">⌖</span>
                    <span>{message.isPinned ? 'Открепить' : 'Закрепить'}</span>
                  </button>
                ) : null}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
