import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';
import { useGetMessagesQuery } from '../../../api/chatApi';
import type { Message } from '../../../types';

interface Props {
  /** Called when the user clicks a pinned message link — scroll the list to that message. */
  onScrollTo: (messageId: string) => void;
}

export const PinnedBar: React.FC<Props> = ({ onScrollTo }) => {
  const selectedTopicId = useSelector((state: RootState) => state.ui.selectedTopicId);
  const [expanded, setExpanded] = useState(false);

  const { data: messages } = useGetMessagesQuery(selectedTopicId!, { skip: !selectedTopicId });

  const pinned: Message[] = (messages ?? [])
    .filter((m) => m.isPinned)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (pinned.length === 0) return null;

  // When collapsed: show only the most recently pinned (last by date)
  const visible = expanded ? pinned : [pinned[pinned.length - 1]];

  return (
    <div className="pinned-bar">
      <div className="pinned-bar__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M15 4.5l4.5 4.5-3 3 1.5 4.5-1.5 1.5-4.1-4.1-4.2 4.2-1.3-1.3 4.2-4.2L7 8.5 8.5 7l4.5 1.5 2-4z" />
        </svg>
      </div>

      <div className="pinned-bar__items">
        {visible.map((msg) => (
          <button
            key={msg.id}
            className="pinned-bar__link"
            onClick={() => onScrollTo(msg.id)}
            title={msg.content}
          >
            <span className="pinned-bar__index">#{pinned.indexOf(msg) + 1}</span>
            <span className="pinned-bar__preview">{msg.content}</span>
          </button>
        ))}
      </div>

      {pinned.length > 1 && (
        <button
          className="pinned-bar__toggle"
          onClick={() => setExpanded((v) => !v)}
          title={expanded ? 'Свернуть' : `Все закреплённые (${pinned.length})`}
        >
          {expanded ? '▲' : `▼ ${pinned.length}`}
        </button>
      )}
    </div>
  );
};
