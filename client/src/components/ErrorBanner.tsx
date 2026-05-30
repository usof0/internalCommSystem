import React from 'react';

interface ErrorBannerProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message = 'Произошла ошибка при загрузке данных',
  onRetry
}) => {
  return (
    <div className="error-banner">
      <div className="error-banner-content">
        <span className="error-icon">⚠️</span>
        <span className="error-message">{message}</span>
        {onRetry && (
          <button onClick={onRetry} className="btn btn-sm btn-secondary">
            Повторить
          </button>
        )}
      </div>
    </div>
  );
};
