import React from 'react';
import { Button } from './Button';

export const LoadingState: React.FC<{ text?: string }> = ({ text = 'Загрузка...' }) => (
  <div className="loading">{text}</div>
);

export const EmptyState: React.FC<{ text: string; className?: string; style?: React.CSSProperties }> = ({
  text,
  className = '',
  style,
}) => <div className={`empty-state ${className}`} style={style}>{text}</div>;

export const ErrorState: React.FC<{
  text?: string;
  onRetry?: () => void;
  retryText?: string;
}> = ({ text = 'Ошибка загрузки.', onRetry, retryText = 'Повторить' }) => (
  <div className="error">
    {text}{' '}
    {onRetry ? (
      <Button size="sm" onClick={onRetry}>
        {retryText}
      </Button>
    ) : null}
  </div>
);
