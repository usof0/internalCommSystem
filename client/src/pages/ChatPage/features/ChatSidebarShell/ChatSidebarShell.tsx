import React from 'react';

import type { ChatSidebarShellProps } from './ChatSidebarShell.types';

export const ChatSidebarShell: React.FC<ChatSidebarShellProps> = ({
  onOpenCreateRoom,
  compact = false,
  children,
}) => {
  return (
    <aside className={`chat-sidebar${compact ? ' chat-sidebar--compact' : ''}`}>
      <div className="chat-sidebar__header">
        <h2 className="chat-sidebar__title">Комнаты</h2>
        <button
          className="btn btn-sm"
          onClick={onOpenCreateRoom}
          title="Создать комнату"
        >
          +
        </button>
      </div>
      {children}
    </aside>
  );
};
