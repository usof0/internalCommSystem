import React from 'react';

import { MessageInput } from '../MessageInput';
import { MessagesList } from '../MessagesList';
import { PinnedBar } from '../PinnedBar';
import { ThreadPanel } from '../ThreadPanel';
import { TopicsList } from '../TopicsList';
import type { ChatPanelsProps } from './ChatPanels.types';

export const ChatPanels: React.FC<ChatPanelsProps> = ({
  selectedRoomId,
  selectedTopicId,
  selectedThreadMessageId,
  room,
  isDirect,
  header,
}) => {
  const handleScrollToPinnedMessage = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.classList.add('message--highlight');
    setTimeout(() => el?.classList.remove('message--highlight'), 1500);
  };

  return (
    <>
      {selectedRoomId && room && !isDirect ? (
        <aside className="chat-topics-panel">
          <TopicsList />
        </aside>
      ) : null}

      <div className="chat-main">
        {header}

        {selectedTopicId ? (
          <PinnedBar onScrollTo={handleScrollToPinnedMessage} />
        ) : null}

        <div className="chat-main__messages">
          <MessagesList />
        </div>

        {selectedTopicId ? (
          <div className="chat-main__input">
            <MessageInput />
          </div>
        ) : null}
      </div>

      {selectedThreadMessageId ? (
        <aside className="chat-thread-panel">
          <ThreadPanel />
        </aside>
      ) : null}
    </>
  );
};
