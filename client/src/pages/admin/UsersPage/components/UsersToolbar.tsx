import React from 'react';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Form';

type Props = {
  q: string;
  onChangeQ: (value: string) => void;
  canCreate: boolean;
  isCreating: boolean;
  onToggleCreate: () => void;
  registrationRequestsCount?: number;
  onOpenRegistrationRequests: () => void;
};

export const UsersToolbar: React.FC<Props> = ({
  q,
  onChangeQ,
  canCreate,
  isCreating,
  onToggleCreate,
  registrationRequestsCount = 0,
  onOpenRegistrationRequests,
}) => {
  return (
    <div className="users-toolbar">
      <div className="users-toolbar__title">
        <span>Администрирование</span>
        <h1>Пользователей</h1>
      </div>

      <div className="users-toolbar__actions">
        <Button
          onClick={onOpenRegistrationRequests}
          disabled={!canCreate}
          title={!canCreate ? 'Нет прав' : undefined}
          className="users-registration-button"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="users-icon">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
            <path d="M19 8v6" />
            <path d="M22 11h-6" />
          </svg>
          <span>Заявки на регистрацию</span>
          {registrationRequestsCount ? (
            <span className="users-registration-button__badge">{registrationRequestsCount}</span>
          ) : null}
        </Button>

        <label className="users-search" aria-label="Поиск пользователей">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="users-icon">
            <path d="m21 21-4.35-4.35" />
            <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
          </svg>
          <Input
            value={q}
            onChange={(e) => onChangeQ(e.target.value)}
            placeholder="Имя, фамилия, email..."
          />
        </label>

        <Button
          variant="primary"
          onClick={onToggleCreate}
          disabled={!canCreate}
          title={!canCreate ? 'Нет прав' : undefined}
          className="users-create-button"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="users-icon">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>{isCreating ? 'Отмена' : 'Создать'}</span>
        </Button>
      </div>
    </div>
  );
};
