import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';
import { useSendMessageMutation, useMarkTopicReadMutation } from '../../../api/chatApi';

interface MessageInputProps {
  /** When set, the message is sent as a reply in a thread */
  parentId?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({ parentId }) => {
  const [content, setContent] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedTopicId = useSelector((state: RootState) => state.ui.selectedTopicId);
  const [sendMessage, { isLoading }] = useSendMessageMutation();
  const [markTopicRead] = useMarkTopicReadMutation();

  const canSend = !!selectedTopicId && content.trim().length > 0 && !isLoading;

  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend || !selectedTopicId) return;

    setSendError(null);
    try {
      await sendMessage({
        topicId: selectedTopicId,
        parentId,
        content: content.trim(),
      }).unwrap();
      markTopicRead(selectedTopicId);
      setContent('');
      requestAnimationFrame(resizeTextarea);
      textareaRef.current?.focus();
    } catch {
      setSendError('Не удалось отправить сообщение');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  };

  return (
    <form onSubmit={handleSend} className="message-input">
      {sendError && (
        <p className="message-input__error">{sendError}</p>
      )}
      <div className="message-input__row">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            requestAnimationFrame(resizeTextarea);
          }}
          placeholder="Введите сообщение..."
          className="message-input__textarea"
          rows={1}
          disabled={isLoading}
          onKeyDown={handleKeyDown}
        />
        <button
          type="submit"
          disabled={!canSend}
          className="btn btn-primary message-input__send"
          aria-label="Отправить сообщение"
          title="Отправить"
        >
          {isLoading ? (
            <span className="message-input__spinner" aria-hidden="true" />
          ) : (
            <svg
              className="message-input__send-icon"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              aria-hidden="true"
            >
              <path
                d="M4.5 19.5 21 12 4.5 4.5l2.75 6.25L14 12l-6.75 1.25L4.5 19.5Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
};
