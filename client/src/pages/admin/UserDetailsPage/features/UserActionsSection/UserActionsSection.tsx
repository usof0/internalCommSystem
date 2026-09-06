import React from 'react';

import { Button } from '../../../../../components/ui/Button';

import type { UserActionsSectionProps } from './UserActionsSection.types';

export const UserActionsSection: React.FC<UserActionsSectionProps> = ({
  isActive,
  isBlocked,
  onConfirmAction,
  onActivate,
  onDeactivate,
  onBlock,
  onUnblock,
  onResetPassword,
}) => {
  return (
    <div className="profile-actions-panel">
      <div className="profile-actions">
        <div className="profile-action">
          {isActive ? (
            <Button
              size="sm"
              variant="danger"
              onClick={() => onConfirmAction('Деактивировать пользователя?', onDeactivate)}
            >
              Деактивировать
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onConfirmAction('Активировать пользователя?', onActivate)}
            >
              Активировать
            </Button>
          )}
        </div>

        <div className="profile-action">
          {isBlocked ? (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onConfirmAction('Разблокировать пользователя?', onUnblock)}
            >
              Разблокировать
            </Button>
          ) : (
            <Button
              size="sm"
              variant="danger"
              onClick={() => onConfirmAction('Заблокировать пользователя?', onBlock)}
            >
              Заблокировать
            </Button>
          )}
        </div>

        <div className="profile-action">
          <Button
            size="sm"
            onClick={() => onConfirmAction('Сбросить пароль пользователя?', onResetPassword)}
          >
            Сбросить пароль
          </Button>
        </div>
      </div>
    </div>
  );
};
