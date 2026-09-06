import React from 'react';
import { Avatar } from '../../../../components/ui/Avatar';

import type { ChatMainHeaderProps } from './ChatMainHeader.types';

export const ChatMainHeader: React.FC<ChatMainHeaderProps> = ({
  title,
  subtitle,
  avatarUrl,
  avatarName,
  showInfoButton,
  infoPanelOpen,
  onToggleInfo,
  onCloseRoom,
  closeButtonLabel = 'Закрыть комнату',
}) => {
  return (
    <div className="chat-main__header">
      <div className="chat-main__header-titles">
        <div className="chat-main__identity">
          {onCloseRoom ? (
            <button
              onClick={onCloseRoom}
              className="chat-main__back-btn"
              title={closeButtonLabel}
              aria-label={closeButtonLabel}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          ) : null}
          <Avatar src={avatarUrl} name={avatarName || title} size={36} />
          <div className="chat-main__identity-text">
            <h2 className="chat-main__title">{title}</h2>
            {subtitle ? <span className="chat-main__subtitle">{subtitle}</span> : null}
          </div>
        </div>
      </div>
      <div className="chat-main__header-actions">
        {showInfoButton ? (
          <button
            onClick={onToggleInfo}
            className={`btn btn-sm chat-main__header-btn${infoPanelOpen ? ' chat-info-btn--active' : ''}`}
            title="Информация о комнате"
            aria-label="Информация о комнате"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 10v6" />
              <path d="M12 7h.01" />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
};
