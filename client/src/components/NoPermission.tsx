import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BackButton } from './ui/BackButton';

interface NoPermissionProps {
  message?: string;
}

export const NoPermission: React.FC<NoPermissionProps> = ({ message }) => {
  const navigate = useNavigate();

  return (
    <div className="no-permission">
      <div className="no-permission-content">
        <div className="no-permission-icon">🔒</div>
        <h2>Недостаточно прав</h2>
        <p>{message || 'У вас нет прав для просмотра этой страницы'}</p>
        <div className="no-permission-actions">
          <BackButton onClick={() => navigate(-1)} label="Назад" />
          <button onClick={() => navigate('/')} className="btn btn-primary">
            На главную
          </button>
        </div>
      </div>
    </div>
  );
};
